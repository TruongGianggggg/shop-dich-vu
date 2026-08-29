import {
  appendClientRequestHeaders,
  getBackendUrl,
  getRequestAuthToken,
  requireAdminRequest,
} from "@/lib/backend";
import {
  AdminActiveOrderPage,
  AdminDashboardSummary,
  AdminUser,
  GameCurrencyOrder,
  PageResponse,
  ServiceOrder,
  ServiceOrderStatus,
} from "@/lib/shop-api";

const DASHBOARD_TIME_ZONE = "Asia/Ho_Chi_Minh";
const PAGE_SIZE = 200;

export async function GET(request: Request) {
  const forbidden = await requireAdminRequest(request);
  if (forbidden) return forbidden;

  const now = new Date();
  const dates = Array.from({ length: 7 }, (_, index) =>
    dateKey(new Date(now.getTime() - (6 - index) * 86_400_000)),
  );
  const fromDate = dates[0];
  const toDate = dates[6];

  const [serviceResult, currencyResult, userResult, activeResult, walletResult] =
    await Promise.allSettled([
      fetchAllPages<ServiceOrder>(
        "/api/service-orders/history",
        request,
        { fromDate, toDate },
      ),
      fetchAllPages<GameCurrencyOrder>(
        "/api/admin/currency-orders",
        request,
      ),
      fetchAllPages<AdminUser>("/api/admin/users", request),
      fetchBackend<AdminActiveOrderPage>(
        "/api/admin/active-orders?page=0&size=6",
        request,
      ),
      fetchBackend<unknown>("/api/admin/deposits?page=0&size=1", request),
    ]);

  const warnings: string[] = [];
  const serviceOrders = fulfilledValue(serviceResult, []);
  const currencyOrders = fulfilledValue(currencyResult, []).filter((order) =>
    dates.includes(dateKey(new Date(order.createdAt))),
  );
  const users = fulfilledValue(userResult, []);
  const activeOrders = fulfilledValue(activeResult, null);

  if (serviceResult.status === "rejected") warnings.push("Không tải được đơn dịch vụ.");
  if (currencyResult.status === "rejected") warnings.push("Không tải được đơn Vàng/Ngọc.");
  if (userResult.status === "rejected") warnings.push("Không tải được thống kê người dùng.");
  if (activeResult.status === "rejected") warnings.push("Không tải được đơn đang xử lý.");
  if (walletResult.status === "rejected") warnings.push("Không kết nối được dữ liệu ví/nạp tiền.");

  const orderDataComplete =
    serviceResult.status === "fulfilled" && currencyResult.status === "fulfilled";
  const allOrders = [
    ...serviceOrders.map((order) => normalizeServiceOrder(order)),
    ...currencyOrders.map((order) => normalizeCurrencyOrder(order)),
  ];
  const computedLast7Days = dates.map((date) => {
    const dayOrders = allOrders.filter((order) => order.date === date);
    return {
      date,
      revenue: sumRevenue(dayOrders),
      completedOrders: dayOrders.filter((order) => order.status === "done").length,
      activeOrders: dayOrders.filter(
        (order) => order.status === "pending" || order.status === "processing",
      ).length,
      failedOrders: dayOrders.filter(
        (order) => order.status === "error" || order.status === "refund_error",
      ).length,
    };
  });
  const revenueToday = orderDataComplete
    ? computedLast7Days.at(-1)?.revenue ?? 0
    : null;
  const revenueYesterday = computedLast7Days.at(-2)?.revenue ?? 0;

  const summary: AdminDashboardSummary = {
    revenueToday,
    revenueChangePercent:
      revenueToday === null
        ? null
        : revenueYesterday === 0
          ? revenueToday === 0
            ? 0
            : null
          : ((revenueToday - revenueYesterday) / revenueYesterday) * 100,
    activeOrders: activeOrders?.totalElements ?? null,
    pendingOrders: activeOrders?.pendingCount ?? null,
    totalUsers: userResult.status === "fulfilled" ? users.length : null,
    newUsersToday:
      userResult.status === "fulfilled"
        ? users.filter((user) => dateKey(new Date(user.createdAt)) === toDate).length
        : null,
    failedOrders: orderDataComplete
      ? allOrders.filter(
          (order) => order.status === "error" || order.status === "refund_error",
        ).length
      : null,
    last7Days: orderDataComplete ? computedLast7Days : [],
    recentOrders: allOrders
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 6)
      .map((order) => ({
        id: order.id,
        code: order.code,
        title: order.title,
        owner: order.owner,
        status: order.status,
        amount: order.amount,
        createdAt: order.createdAt,
      })),
    services: {
      auth: "UP",
      service: orderDataComplete ? "UP" : "DOWN",
      wallet: walletResult.status === "fulfilled" ? "UP" : "DOWN",
    },
    warnings,
    generatedAt: now.toISOString(),
  };

  return Response.json(summary, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

type NormalizedOrder = {
  id: string;
  code: string;
  title: string;
  owner: string;
  status: ServiceOrderStatus;
  amount: number;
  createdAt: string;
  date: string;
};

function normalizeServiceOrder(order: ServiceOrder): NormalizedOrder {
  return {
    id: `service-${order.id}`,
    code: order.requestId,
    title: order.serviceName || order.packageName || "Đơn dịch vụ",
    owner: order.receiverUsername || "Hệ thống",
    status: order.status,
    amount: order.payAmount ?? order.amount,
    createdAt: order.createdAt,
    date: dateKey(new Date(order.createdAt)),
  };
}

function normalizeCurrencyOrder(order: GameCurrencyOrder): NormalizedOrder {
  return {
    id: `currency-${order.id}`,
    code: order.requestId,
    title: `Nạp ${order.currencyType === "GOLD" ? "Vàng" : "Ngọc"} - ${order.serverName}`,
    owner: "Hệ thống",
    status: order.status,
    amount: order.paymentAmount,
    createdAt: order.createdAt,
    date: dateKey(new Date(order.createdAt)),
  };
}

function sumRevenue(orders: NormalizedOrder[]) {
  return orders.reduce(
    (total, order) => total + (order.status === "done" ? order.amount : 0),
    0,
  );
}

async function fetchAllPages<T>(
  path: string,
  request: Request,
  filters: Record<string, string> = {},
) {
  const firstPage = await fetchBackend<PageResponse<T>>(
    pagePath(path, 0, filters),
    request,
  );
  if (firstPage.totalPages <= 1) return firstPage.content;

  const remaining = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      fetchBackend<PageResponse<T>>(
        pagePath(path, index + 1, filters),
        request,
      ),
    ),
  );
  return [firstPage, ...remaining].flatMap((page) => page.content);
}

function pagePath(path: string, page: number, filters: Record<string, string>) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(PAGE_SIZE),
    ...filters,
  });
  return `${path}?${params}`;
}

async function fetchBackend<T>(path: string, request: Request) {
  const headers = new Headers({ Accept: "application/json" });
  const token = getRequestAuthToken(request);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  appendClientRequestHeaders(headers, request);

  const response = await fetch(getBackendUrl(path), {
    headers,
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Backend returned ${response.status}`);
  return (await response.json()) as T;
}

function fulfilledValue<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === "fulfilled" ? result.value : fallback;
}

function dateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DASHBOARD_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
