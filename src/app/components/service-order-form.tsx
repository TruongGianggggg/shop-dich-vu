"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useRef, useState } from "react";
import {
  ServiceOrder,
  ServicePackage,
  ServiceSubCategory,
  agencyRate,
  estimateAgencyCommission,
  formatVnd,
  getApiErrorMessage,
} from "@/lib/shop-api";
import { SafeRichText } from "./safe-rich-text";
import { OrderConfirmationDialog } from "./order-confirmation-dialog";
import { RecentServiceOrderHistory } from "./recent-order-history";
import { useAuthSession } from "./use-auth-session";
import { useUserBalance } from "./use-user-balance";
import { useAgencySummary } from "./use-agency-summary";

type CarotBatchOrderResponse = {
  batchId: string;
  accountCount: number;
  orderCount: number;
  quantityPerAccount: number;
  totalQuantity: number;
  totalAmount: number;
  orders: ServiceOrder[];
};

type PendingServiceOrder = {
  endpoint: string;
  payload: Record<string, unknown>;
  orderValue: number;
  details: { label: string; value: string }[];
};

function parseCarotUsernames(value: string) {
  return value
    .split(/\r?\n/)
    .map(firstWhitespaceSeparatedToken)
    .filter(Boolean);
}

function firstWhitespaceSeparatedToken(value: string) {
  return value.trim().split(/\s+/, 1)[0] ?? "";
}

const NGOC_RONG_SERVERS = [
  "1 Sao",
  "2 Sao",
  "3 Sao",
  "4 Sao",
  "5 Sao",
  "6 Sao",
  "7 Sao",
  "8 Sao",
  "9 Sao",
  "10 Sao",
  "Vip 1",
  "12 Sao",
  "Super 1",
  "Super 2",
  "13 Sao",
  "Vip 2",
  "14 Sao",
  "Super 3",
  "15 Sao",
] as const;

const BANGIFTCODE_SERVERS: Record<string, { value: string; label: string }[]> = {
  avatar: [{ value: "dieuky", label: "Diệu Kỳ" }, { value: "thantien", label: "Thần Tiên" }],
  av3: [{ value: "1", label: "Avatar 3" }],
  am: [{ value: "1", label: "Avatar Musik" }],
  avl: [{ value: "1", label: "Avatar Land" }],
  ht: [{ value: "1", label: "Going Merry" }, { value: "2", label: "Thousand Sunny" }, { value: "3", label: "Redforce" }, { value: "4", label: "Oro Jackson" }],
  nj: ["Boken", "Shuriken", "Tensen", "Kunnai", "Katana", "Tone", "Sanzu", "Sensha", "Daisho", "Tekkan", "Bisento"].map((label, index) => ({ value: ["1", "2", "2", "5", "6", "7", "8", "10", "11", "12", "15"][index], label })),
  nr: NGOC_RONG_SERVERS.map((label, index) => ({ value: ["1", "2", "3", "6", "7", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22"][index], label })),
  hs: ["Chiến Thần", "Rồng Lửa", "Phượng Hoàng", "Nhân Mã", "Global", "Kỳ Lân", "Thiên Hà", "Bạch Hổ"].map((label, index) => ({ value: ["1", "2", "7", "8", "3", "12", "13", "14"][index], label })),
  ngulong: [{ value: "1", label: "Kim Long" }, { value: "2", label: "Hỏa Long" }],
  kpah: ["Tiên La", "Tràng An", "Hoàng Vương", "Mỹ Sơn", "Kinh Môn", "Hoa Lư", "Thanh Long", "Cổ Loa", "Văn Xuân"].map((label, index) => ({ value: ["2", "2", "3", "3", "5", "7", "8", "9", "10"][index], label })),
  army2: [{ value: "0", label: "Trái Đất" }, { value: "1", label: "Sao Hỏa" }],
};

export function ServiceOrderForm({
  service,
  packages,
}: {
  service: ServiceSubCategory;
  packages: ServicePackage[];
}) {
  const router = useRouter();
  const session = useAuthSession();
  const agency = useAgencySummary();
  const { error: balanceError, isLoading: isBalanceLoading, refresh: refreshBalance, wallet } = useUserBalance();
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedPackageId, setSelectedPackageId] = useState(
    packages[0]?.id ?? "",
  );
  const [message, setMessage] = useState("");
  const [createdOrder, setCreatedOrder] = useState<ServiceOrder | null>(null);
  const [createdCarotBatch, setCreatedCarotBatch] =
    useState<CarotBatchOrderResponse | null>(null);
  const [carotUsernameInput, setCarotUsernameInput] = useState("");
  const [carotQuantity, setCarotQuantity] = useState(1);
  const [selectedServer, setSelectedServer] = useState("");
  const [pendingOrder, setPendingOrder] = useState<PendingServiceOrder | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedPackage = useMemo(
    () => packages.find((item) => item.id === selectedPackageId) ?? null,
    [packages, selectedPackageId],
  );
  const isManualService = service.type === "GAME_SERVICE";
  const isCarotTopup = service.type === "TOPUP_CAROT";
  const carotUsernames = useMemo(
    () => parseCarotUsernames(carotUsernameInput),
    [carotUsernameInput],
  );
  const providerGameCode = resolveBangiftcodeGameCode(service.name, service.the9pServiceCode);
  const usesNgocRongServers = providerGameCode === "nr";
  const providerServers = !isCarotTopup ? BANGIFTCODE_SERVERS[providerGameCode] : undefined;
  const carotServers = isCarotTopup ? BANGIFTCODE_SERVERS[providerGameCode] : undefined;
  const returnUrl = `/dich-vu/${encodeURIComponent(service.id)}`;
  const orderValue = selectedPackage
    ? selectedPackage.price * (isCarotTopup ? carotUsernames.length * carotQuantity : 1)
    : 0;
  const agencyCategory = isCarotTopup ? "CAROT" : "SERVICE";
  const commissionRate = agencyRate(agency.summary, agencyCategory);
  const estimatedCommission = estimateAgencyCommission(agency.summary, agencyCategory, orderValue);
  const agencyLevel = agency.summary?.level ?? 0;

  function buyAgain(order: ServiceOrder) {
    const orderPackage = packages.find((item) => item.id === order.packageId);
    if (orderPackage) setSelectedPackageId(orderPackage.id);
    setCarotUsernameInput(order.username ?? "");
    setSelectedServer(order.server ?? "");
    setCarotQuantity(orderPackage?.price ? Math.min(10, Math.max(1, Math.round(order.amount / orderPackage.price))) : 1);
    setMessage("Đã điền dữ liệu từ đơn cũ. Vui lòng kiểm tra trước khi đặt lại.");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setMessage("");
    setCreatedOrder(null);
    setCreatedCarotBatch(null);

    if (!session) {
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    if (!selectedPackage) {
      setMessage("Vui lòng chọn một gói dịch vụ.");
      return;
    }

    const formData = new FormData(form);
    const account = String(formData.get("account") ?? "").trim();
    const server = String(formData.get("server") ?? "").trim();
    const note = String(formData.get("note") ?? "").trim();
    if (isCarotTopup) {
      if (!carotUsernames.length || !server) {
        setMessage("Vui lòng nhập tài khoản và chọn server dùng chung.");
        return;
      }
    }

    const payload: Record<string, unknown> = isCarotTopup
      ? {
          subCategoryId: service.id,
          packageId: selectedPackage.id,
          usernames: carotUsernames,
          quantity: carotQuantity,
          server,
          ...(providerGameCode === "hs"
            ? { charname: String(formData.get("charname") ?? "").trim() }
            : {}),
          note,
        }
      : isManualService
      ? {
          subCategoryId: service.id,
          packageId: selectedPackage.id,
          username: account,
          password: String(formData.get("password") ?? ""),
          contactInfo: String(formData.get("contactInfo") ?? "").trim(),
          server,
          note,
        }
      : {
          subCategoryId: service.id,
          packageId: selectedPackage.id,
          accountInfo: {
            username: account,
            server,
            ...(providerGameCode === "ht" ? { type: String(formData.get("type") ?? "1") } : {}),
            ...(providerGameCode === "hs" ? { charname: String(formData.get("charname") ?? "").trim() } : {}),
          },
          note,
        };

    const endpoint = isCarotTopup
      ? "/api/service-orders/topup/carot-batch"
      : isManualService
        ? "/api/service-orders/game-service"
        : "/api/service-orders/topup";
    setPendingOrder({
      endpoint,
      payload,
      orderValue,
      details: isCarotTopup
        ? [
            { label: "Gói nạp", value: selectedPackage.name },
            { label: "Số tài khoản", value: `${carotUsernames.length} tài khoản` },
            { label: "Số lượng mỗi tài khoản", value: `${carotQuantity} lần` },
            { label: "Tổng lượt nạp", value: `${carotUsernames.length * carotQuantity} lượt` },
            { label: "Server", value: server },
            { label: "Hoa hồng dự kiến", value: `+${formatVnd(estimatedCommission)} · Cấp ${agencyLevel} (${commissionRate / 100}%)` },
          ]
        : [
            { label: "Dịch vụ", value: selectedPackage.name },
            { label: "Tài khoản", value: account },
            { label: "Server", value: server },
            { label: "Hoa hồng dự kiến", value: `+${formatVnd(estimatedCommission)} · Cấp ${agencyLevel} (${commissionRate / 100}%)` },
          ],
    });
    refreshBalance();
  }

  async function confirmOrder() {
    if (!pendingOrder || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(pendingOrder.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(pendingOrder.payload),
        });
      const data = (await response.json()) as
        | ServiceOrder
        | CarotBatchOrderResponse
        | unknown;

      if (!response.ok) {
        setMessage(getApiErrorMessage(data, "Không thể tạo đơn dịch vụ."));
        setPendingOrder(null);
        return;
      }

      if (isCarotTopup) {
        setCreatedCarotBatch(data as CarotBatchOrderResponse);
        setHistoryRefreshKey((current) => current + 1);
      } else {
        setCreatedOrder(data as ServiceOrder);
        formRef.current?.reset();
        setSelectedServer("");
      }
      setPendingOrder(null);
      refreshBalance();
    } catch {
      setMessage("Không kết nối được hệ thống đặt đơn.");
      setPendingOrder(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!packages.length) {
    return (
      <div className="detail-empty-state">
        <strong>Dịch vụ chưa có gói đang mở bán</strong>
        <p>Vui lòng quay lại sau hoặc liên hệ quản trị viên.</p>
      </div>
    );
  }

  return (
    <>
    <form
      className="detail-order-form"
      data-route-scroll-target
      onSubmit={submit}
      ref={formRef}
    >
      <section className="detail-order-panel">
        <div className="detail-panel-heading">
          <span>1</span>
          <h2>Chọn Gói Dịch Vụ</h2>
        </div>
        <div className="detail-panel-body">
          <label className="detail-select-wrap">
            <span className="detail-visually-hidden">Chọn gói dịch vụ</span>
            <select
              name="packageId"
              onChange={(event) => setSelectedPackageId(event.target.value)}
              value={selectedPackageId}
            >
              <option disabled value="">Tìm và chọn gói dịch vụ...</option>
              {packages.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {formatVnd(item.price)}
                </option>
              ))}
            </select>
          </label>
          {selectedPackage?.description ? (
            <SafeRichText
              className="detail-package-description"
              html={selectedPackage.description}
            />
          ) : null}
        </div>
      </section>

      <section className="detail-order-panel">
        <div className="detail-panel-heading">
          <span>2</span>
          <h2>Thông Tin Tài Khoản</h2>
        </div>
        <div className="detail-panel-body detail-account-grid">
          {isCarotTopup ? (
            <>
              <label className="detail-field detail-field-wide">
                <span>Danh sách tài khoản đăng nhập</span>
                <textarea
                  autoComplete="off"
                  className="detail-carot-accounts-textarea"
                  name="account"
                  onChange={(event) => setCarotUsernameInput(event.target.value)}
                  placeholder={"Nhập tài khoản đăng nhập\nMỗi tài khoản một dòng"}
                  required
                  rows={8}
                  value={carotUsernameInput}
                />
                <small className="detail-field-helper">
                  Mỗi tài khoản được nạp {carotQuantity} lần — đã nhập {carotUsernames.length} tài khoản,
                  tổng cộng {carotUsernames.length * carotQuantity} lượt nạp.
                </small>
              </label>
              <label className="detail-field">
                <span>Số lượng</span>
                <select
                  name="quantity"
                  onChange={(event) => setCarotQuantity(Number(event.target.value))}
                  value={carotQuantity}
                >
                  {Array.from({ length: 10 }, (_, index) => index + 1).map((quantity) => (
                    <option key={quantity} value={quantity}>{quantity}</option>
                  ))}
                </select>
                <small className="detail-field-helper">
                  Số lần nạp cho mỗi tài khoản (từ 1 đến 10).
                </small>
              </label>
            </>
          ) : (
            <label className="detail-field">
              <span>Tài Khoản</span>
              <input
                autoComplete="off"
                maxLength={120}
                name="account"
                placeholder="Nhập tài khoản cần xử lý"
                required
              />
            </label>
          )}
          {isManualService ? (
            <>
              <label className="detail-field">
                <span>Mật Khẩu</span>
                <input
                  autoComplete="new-password"
                  maxLength={120}
                  name="password"
                  placeholder="Nhập mật khẩu của tài khoản"
                  required
                  type="password"
                />
              </label>
              <label className="detail-field detail-field-wide">
                <span>Zalo hoặc link Facebook</span>
                <input
                  autoComplete="tel"
                  maxLength={500}
                  name="contactInfo"
                  placeholder="Nhập Zalo hoặc link Facebook để được hỗ trợ"
                  required
                  type="text"
                />
                <small className="detail-field-helper">
                  Dùng để liên hệ hỗ trợ khi đơn hàng cần thêm thông tin.
                </small>
              </label>
            </>
          ) : null}
          {providerGameCode === "hs" ? (
            <label className="detail-field">
              <span>Tên Nhân Vật</span>
              <input maxLength={120} name="charname" placeholder="Nhập tên nhân vật" required />
            </label>
          ) : null}
          {!isCarotTopup && providerGameCode === "ht" ? (
            <label className="detail-field">
              <span>Nạp</span>
              <select name="type" defaultValue="1"><option value="1">Vào nhân vật</option><option value="2">Vào Băng Hải Tặc</option></select>
            </label>
          ) : null}
          <label className="detail-field detail-field-wide">
            <span>Server</span>
            {(providerServers ?? carotServers)?.length ? (
              <select name="server" onChange={(event) => setSelectedServer(event.target.value)} required value={selectedServer}>
                <option disabled value="">Chọn máy chủ</option>
                {(providerServers ?? carotServers)?.map((server, index) => <option key={`${server.value}-${index}`} value={server.value}>{server.label}</option>)}
              </select>
            ) : usesNgocRongServers ? (
              <select
                name="server"
                onChange={(event) => setSelectedServer(event.target.value)}
                required
                value={selectedServer}
              >
                <option disabled value="">Chọn máy chủ</option>
                {NGOC_RONG_SERVERS.map((server) => (
                  <option key={server} value={server}>{server}</option>
                ))}
              </select>
            ) : (
              <input
                maxLength={120}
                name="server"
                placeholder="Nhập tên hoặc số máy chủ, ví dụ: Server 1"
                required
              />
            )}
          </label>
        </div>
      </section>

      <section className="detail-order-panel">
        <div className="detail-panel-heading">
          <span>3</span>
          <h2>Ghi Chú &amp; Xác Nhận</h2>
        </div>
        <div className="detail-panel-body">
          <label className="detail-field">
            <span>Ghi Chú</span>
            <textarea
              maxLength={1000}
              name="note"
              placeholder="Nhập ghi chú cho admin nếu có..."
              rows={4}
            />
          </label>
          <div className="detail-confirm-box">
            <div className="detail-total">
              <span>Tổng thanh toán</span>
              <strong>
                {selectedPackage
                  ? formatVnd(
                        orderValue,
                    )
                  : "—"}
              </strong>
            </div>
            <p className="detail-commission-preview">
              Hoa hồng cấp {agencyLevel} ({commissionRate / 100}%): <strong>+{formatVnd(estimatedCommission)}</strong>
              <span> Cộng vào ví khi đơn hoàn thành.</span>
            </p>
            {message ? <p className="detail-form-error">{message}</p> : null}
            {createdOrder ? (
              <div className="detail-order-success" role="status">
                <strong>Tạo đơn thành công</strong>
                <span>Mã đơn: {createdOrder.requestId}</span>
                <Link href="/lich-su-mua">Xem lịch sử mua →</Link>
              </div>
            ) : null}
            {createdCarotBatch ? (
              <div className="detail-order-success" role="status">
                <strong>
                  {`Đã tạo ${createdCarotBatch.orderCount} đơn, tổng ${createdCarotBatch.totalQuantity} lượt nạp Carot`}
                </strong>
                <span>Mã lô: {createdCarotBatch.batchId}</span>
                <Link href="/lich-su-mua">Xem lịch sử mua →</Link>
              </div>
            ) : null}
            <button disabled={isSubmitting || !selectedPackage} type="submit">
              <span aria-hidden="true">🛒</span>
              {isSubmitting
                ? "Đang tạo đơn..."
                : session
                  ? isCarotTopup && carotUsernames.length > 1
                    ? `Tạo ${carotUsernames.length} Đơn Hàng`
                    : "Tạo Đơn Hàng"
                  : "Đăng nhập để đặt dịch vụ"}
            </button>
          </div>
        </div>
      </section>
    </form>
    {isCarotTopup ? (
      <RecentServiceOrderHistory
        onBuyAgain={buyAgain}
        refreshKey={historyRefreshKey}
        subCategoryId={service.id}
      />
    ) : null}
    <OrderConfirmationDialog
      balance={isBalanceLoading ? null : wallet?.balance ?? null}
      balanceError={balanceError}
      details={pendingOrder?.details ?? []}
      isOpen={Boolean(pendingOrder)}
      isSubmitting={isSubmitting}
      onCancel={() => setPendingOrder(null)}
      onConfirm={confirmOrder}
      orderValue={pendingOrder?.orderValue ?? 0}
      title={isCarotTopup ? "Xác nhận nạp Carot" : "Xác nhận tạo đơn"}
    />
    </>
  );

}

function resolveBangiftcodeGameCode(name: string, configuredCode: string | null) {
  const code = configuredCode?.trim().toLowerCase();
  if (code && BANGIFTCODE_SERVERS[code]) return code;
  const value = name.trim().toLowerCase();
  if (value.includes("avatar musik")) return "am";
  if (value.includes("avatar land")) return "avl";
  if (value.includes("avatar 3")) return "av3";
  if (value.includes("avatar")) return "avatar";
  if (value.includes("hải tặc") || value.includes("hai tac")) return "ht";
  if (value.includes("ninja")) return "nj";
  if (value.includes("ngọc rồng") || value.includes("ngoc rong")) return "nr";
  if (value.includes("hiệp sĩ") || value.includes("hiep si")) return "hs";
  if (value.includes("ngũ long") || value.includes("ngu long")) return "ngulong";
  if (value.includes("kpah")) return "kpah";
  if (value.includes("army 2") || value.includes("army2")) return "army2";
  return code ?? "";
}
