export type UserRole = "USER" | "COLLABORATOR" | "ADMIN";

export type AuthResponse = {
  expiresIn: number;
  userId: string;
  username: string;
  email: string;
  role: UserRole;
  adminAccessGranted: boolean;
  passwordChangeRequired: boolean;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export type DepositStatus = "PENDING" | "COMPLETED" | "FAILED";

export type ServiceOrderStatus =
  | "error"
  | "refund_error"
  | "pending"
  | "processing"
  | "done";

export type ActiveOrderKind = "SERVICE" | "CURRENCY";

export type AdminActiveOrder = {
  id: string;
  requestId: string;
  kind: ActiveOrderKind;
  serviceName: string;
  customerUsername: string | null;
  accountName: string | null;
  serverName: string | null;
  paymentAmount: number;
  receivedAmount: number | null;
  status: "pending" | "processing";
  adminNote: string | null;
  walletRefunded: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminActiveOrderPage = PageResponse<AdminActiveOrder> & {
  pendingCount: number;
  processingCount: number;
};

export type DashboardDay = {
  date: string;
  revenue: number;
  completedOrders: number;
  activeOrders: number;
  failedOrders: number;
};

export type DashboardRecentOrder = {
  id: string;
  code: string;
  title: string;
  owner: string;
  status: ServiceOrderStatus;
  amount: number;
  createdAt: string;
};

export type DashboardServiceState = "UP" | "DOWN";

export type AdminDashboardSummary = {
  revenueToday: number | null;
  revenueChangePercent: number | null;
  activeOrders: number | null;
  pendingOrders: number | null;
  totalUsers: number | null;
  newUsersToday: number | null;
  failedOrders: number | null;
  last7Days: DashboardDay[];
  recentOrders: DashboardRecentOrder[];
  services: {
    auth: DashboardServiceState;
    service: DashboardServiceState;
    wallet: DashboardServiceState;
  };
  warnings: string[];
  generatedAt: string;
};

export type DepositHistory = {
  id: string;
  transId: string;
  userId: string;
  customerUsername: string | null;
  customerEmail: string | null;
  source: "CARD" | "BANK";
  provider: string;
  rawAmount: number;
  creditedAmount: number;
  status: DepositStatus;
  reason: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminDepositPage = PageResponse<DepositHistory> & {
  totalTransactions: number;
  completedTransactions: number;
  bankTransactions: number;
  cardTransactions: number;
  totalCreditedAmount: number;
};

export type CardDepositDetail = {
  id: string;
  transId: string;
  userId: string;
  telco: string;
  declaredAmount: number;
  creditedAmount: number;
  serial: string;
  pin: string;
  status: DepositStatus;
  reason: string;
  createdAt: string;
  updatedAt: string;
};

export type CardDepositResponse = {
  id: string;
  transId: string;
  userId: string;
  telco: string;
  declaredAmount: number;
  serial: string;
  creditedAmount: number;
  status: DepositStatus;
  reason: string;
  createdAt: string;
  updatedAt: string;
};

export type CardDepositSettings = {
  discountPercent: number;
};

export type ServiceOrder = {
  id: string;
  subCategoryId: string;
  serviceName: string | null;
  userId: string | null;
  customerUsername: string | null;
  type: string;
  status: ServiceOrderStatus;
  requestId: string;
  packageId: string;
  packageName: string | null;
  amount: number;
  payAmount: number | null;
  the9pOrderCode: string | null;
  username: string | null;
  password: string | null;
  server: string | null;
  note: string | null;
  adminNote: string | null;
  receiverId: string | null;
  receiverUsername: string | null;
  collaboratorDiscountPercent: number | null;
  collaboratorEarningAmount: number | null;
  collaboratorPaid: boolean;
  walletRefunded: boolean;
  externalMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserBalance = {
  userId: string;
  username: string;
  balance: number;
  totalDeposited: number;
  collaboratorBalance: number;
  collaboratorTotalEarned: number;
};

export type BankAccount = {
  id: string;
  shortName: string;
  accountNumber: string;
  accountName: string;
  urlApi: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BankAccountPayload = {
  shortName: string;
  accountNumber: string;
  accountName: string;
  urlApi: string;
  active: boolean;
};

export type BankDepositSettings = {
  enabled: boolean;
  prefix: string;
  minAmount: number;
  maxAmount: number;
  cronLink: string;
};

export type BankQr = {
  bankId: string;
  shortName: string;
  accountNumber: string;
  accountName: string;
  transferContent: string;
  amount: number;
  qrUrl: string;
};

export type SiteSettings = {
  shopName: string;
  logoUrl: string;
  bannerUrl: string;
  bannerUrls: string[];
  announcementEnabled: boolean;
  announcementTitle: string;
  announcementContent: string;
  footerTitle: string;
  footerDescription: string;
  footerCopyright: string;
  footerSupportTitle: string;
  footerSupportDescription: string;
  footerPhone: string;
  footerEmail: string;
  footerFacebookUrl: string;
  footerZaloUrl: string;
};

export type MonthlyTopDepositor = {
  rank: number;
  maskedUsername: string;
  totalAmount: number;
  cardAmount: number;
  bankAmount: number;
};

export type MonthlyDepositLeaderboard = {
  year: number;
  month: number;
  from: string;
  to: string;
  entries: MonthlyTopDepositor[];
};

export type ManualMonthlyDepositEntry = {
  id: string;
  displayName: string;
  amount: number;
  year: number;
  month: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminUser = {
  id: string;
  username: string;
  email: string;
  depositCode: string;
  role: UserRole;
  balance: number;
  totalDeposited: number;
  collaboratorBalance: number;
  collaboratorTotalEarned: number;
  failedLoginAttempts: number;
  loginLockedUntil: string | null;
  loginPermanentlyLocked: boolean;
  createdAt: string;
};

export type ApiProblem = {
  message?: string;
  detail?: string;
  title?: string;
  errors?: Record<string, string>;
};

export type ServiceSubCategory = {
  id: string;
  parentId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  type: string;
  the9pServiceCode: string | null;
  requiredFormFields: string[];
  displayOrder: number;
  serviceCount: number;
  active: boolean;
};

export type ServiceCategory = {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  active: boolean;
  children: ServiceSubCategory[];
};

export type ServicePackage = {
  id: string;
  subCategoryId: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  the9pAmount: number | null;
  displayOrder: number;
  active: boolean;
};

export type ServiceSubCategoryPayload = {
  parentId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  type: string;
  the9pServiceCode: string | null;
  displayOrder: number;
  serviceCount: number;
  active: boolean;
};

export type ServiceCategoryPayload = {
  name: string;
  description: string | null;
  displayOrder: number;
  active: boolean;
};

export type ServicePackagePayload = {
  subCategoryId: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  the9pAmount: number | null;
  displayOrder: number;
  active: boolean;
};

export type GameServerCurrencyConfig = {
  id: string;
  name: string;
  goldEnabled: boolean;
  goldAmount: number;
  goldPrice: number;
  gemEnabled: boolean;
  gemAmount: number;
  gemPrice: number;
  displayOrder: number;
  toolServerIndex: number;
  active: boolean;
};

export type GameServerCurrencyConfigPayload = Omit<
  GameServerCurrencyConfig,
  "id"
>;

export type GameCurrencyType = "GOLD" | "GEM";

export type GameCurrencyDisplaySettings = {
  goldImageUrl: string;
  gemImageUrl: string;
  goldDescription: string;
  gemDescription: string;
  goldServiceCount: number;
  gemServiceCount: number;
};

export type GameCurrencyOrder = {
  id: string;
  requestId: string;
  username: string;
  serverConfigId: string;
  serverName: string;
  toolServerIndex: number;
  characterName: string;
  currencyType: GameCurrencyType;
  status: ServiceOrderStatus;
  unitAmount: number;
  unitPrice: number;
  paymentAmount: number;
  receivedAmount: number;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GameNotification = {
  id: number;
  eventType: string;
  serverName: string;
  message: string;
  characterName: string;
  bossName: string;
  location: string;
  timestamp: string;
};

export type GameNotificationFilters = {
  serverNames: string[];
  eventTypes: string[];
};

export type VpsOrderStatus =
  | "PENDING"
  | "ACTIVE"
  | "REVIEW"
  | "FAILED"
  | "EXPIRED"
  | "CANCELLED";

export type VpsPlan = {
  id: string;
  providerProductId: string;
  subCategoryId: string;
  name: string;
  description: string;
  billingCycle: string;
  price: number;
  addonCpuPrice: number;
  addonRamPrice: number;
  addonDiskPricePer10Gb: number;
  active: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type VpsPlanPayload = Omit<
  VpsPlan,
  "id" | "subCategoryId" | "createdAt" | "updatedAt"
>;

export type VpsOrder = {
  id: string;
  requestId: string;
  userId: string;
  customerUsername: string;
  planId: string;
  planName: string;
  providerProductId: string;
  billingCycle: string;
  osId: number;
  addonCpu: number;
  addonRam: number;
  addonDisk: number;
  amount: number;
  providerTotal: number | null;
  providerCredit: number | null;
  status: VpsOrderStatus;
  providerVpsId: string | null;
  providerStatus: string | null;
  ipAddress: string | null;
  vpsUsername: string | null;
  providerCreatedAt: string | null;
  nextDueAt: string | null;
  specialProduct: boolean;
  walletRefunded: boolean;
  providerMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VpsCredentials = { username: string; password: string };

export type VpsOption = {
  id: string;
  label: string;
  raw: unknown;
};

export type VpsOptions = {
  operatingSystems: VpsOption[];
  billingCycles: VpsOption[];
};

export type VpsProviderInfo = {
  configured: boolean;
  agencyName: string | null;
  totalService: number | null;
  credit: number | null;
  totalExpenses: number | null;
  totalCredit: number | null;
  raw: unknown;
};

export const AUTH_STORAGE_KEY = "shop-game-auth";

export function getApiErrorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const problem = data as ApiProblem;

  if (problem.errors) {
    const firstError = Object.values(problem.errors).find(Boolean);

    if (firstError) {
      return firstError;
    }
  }

  return problem.message ?? problem.detail ?? problem.title ?? fallback;
}

export function getRoleDestination(role: UserRole) {
  if (role === "ADMIN") {
    return "/";
  }

  if (role === "COLLABORATOR") {
    return "/cong-tac-vien";
  }

  return "/";
}

export function formatVnd(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}
