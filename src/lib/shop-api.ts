export type UserRole = "USER" | "COLLABORATOR" | "ADMIN";

export type AuthResponse = {
  token: string;
  tokenType: string;
  expiresIn: number;
  userId: string;
  username: string;
  email: string;
  role: UserRole;
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
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELED";

export type DepositHistory = {
  id: string;
  transId: string;
  userId: string;
  source: "CARD" | "BANK";
  provider: string;
  rawAmount: number;
  creditedAmount: number;
  status: DepositStatus;
  reason: string;
  createdAt: string;
  updatedAt: string;
};

export type ServiceOrder = {
  id: string;
  subCategoryId: string;
  userId: string | null;
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
  role: UserRole;
  balance: number;
  totalDeposited: number;
  collaboratorBalance: number;
  collaboratorTotalEarned: number;
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
};

export type GameCurrencyOrder = {
  id: string;
  requestId: string;
  userId: string;
  username: string;
  serverConfigId: string;
  serverName: string;
  characterName: string;
  currencyType: GameCurrencyType;
  status: ServiceOrderStatus;
  unitAmount: number;
  unitPrice: number;
  paymentAmount: number;
  receivedAmount: number;
  adminNote: string | null;
  walletRefunded: boolean;
  createdAt: string;
  updatedAt: string;
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
    return "/admin";
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
