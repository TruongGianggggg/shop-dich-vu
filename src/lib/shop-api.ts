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

export type BankQr = {
  bankId: string;
  shortName: string;
  accountNumber: string;
  accountName: string;
  transferContent: string;
  amount: number;
  qrUrl: string;
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

export type FeaturedPackage = ServicePackage & {
  categoryName: string;
  subCategoryName: string;
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

export const sampleCategories: ServiceCategory[] = [
  {
    id: "game-topup",
    name: "Nap game",
    description: "Nap uc, quan huy, robux va goi game pho bien.",
    displayOrder: 1,
    active: true,
    children: [
      {
        id: "pubg-mobile",
        parentId: "game-topup",
        name: "PUBG Mobile",
        description: "Nap UC nhanh, tu dong tao don.",
        imageUrl: null,
        type: "TOPUP",
        the9pServiceCode: null,
        requiredFormFields: ["playerId"],
        displayOrder: 1,
        serviceCount: 8,
        active: true,
      },
      {
        id: "free-fire",
        parentId: "game-topup",
        name: "Free Fire",
        description: "Kim cuong va goi su kien.",
        imageUrl: null,
        type: "TOPUP",
        the9pServiceCode: null,
        requiredFormFields: ["playerId"],
        displayOrder: 2,
        serviceCount: 10,
        active: true,
      },
    ],
  },
  {
    id: "game-service",
    name: "Dich vu game",
    description: "Cay thue, lam nhiem vu, ho tro tai khoan.",
    displayOrder: 2,
    active: true,
    children: [
      {
        id: "rank-boost",
        parentId: "game-service",
        name: "Cay rank",
        description: "Nhan don theo bac rank va thoi gian.",
        imageUrl: null,
        type: "GAME_SERVICE",
        the9pServiceCode: null,
        requiredFormFields: ["account", "server", "note"],
        displayOrder: 1,
        serviceCount: 5,
        active: true,
      },
    ],
  },
];

export const samplePackages: FeaturedPackage[] = [
  {
    id: "uc-60",
    subCategoryId: "pubg-mobile",
    categoryName: "Nap game",
    subCategoryName: "PUBG Mobile",
    name: "60 UC",
    description: "Goi nap nho, xu ly nhanh sau thanh toan.",
    price: 25000,
    originalPrice: 29000,
    the9pAmount: 60,
    displayOrder: 1,
    active: true,
  },
  {
    id: "ff-140",
    subCategoryId: "free-fire",
    categoryName: "Nap game",
    subCategoryName: "Free Fire",
    name: "140 kim cuong",
    description: "Phu hop nap goi su kien hang ngay.",
    price: 48000,
    originalPrice: 52000,
    the9pAmount: 140,
    displayOrder: 2,
    active: true,
  },
  {
    id: "rank-boost-week",
    subCategoryId: "rank-boost",
    categoryName: "Dich vu game",
    subCategoryName: "Cay rank",
    name: "Goi cay rank co ban",
    description: "Cong tac vien nhan don va cap nhat tien do.",
    price: 120000,
    originalPrice: null,
    the9pAmount: null,
    displayOrder: 3,
    active: true,
  },
];
