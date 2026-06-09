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

export type FeaturedPackage = ServicePackage & {
  categoryName: string;
  subCategoryName: string;
};

export const AUTH_STORAGE_KEY = "shop-game-auth";

export function getRoleDestination(role: UserRole) {
  if (role === "ADMIN") {
    return "/admin";
  }

  if (role === "COLLABORATOR") {
    return "/collaborator";
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
