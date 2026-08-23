import { AuthResponse, UserRole } from "@/lib/shop-api";

export type SampleAccount = {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  label: string;
};

export const sampleAccounts: SampleAccount[] = [
  {
    username: "admin",
    email: "admin@shop.local",
    password: "Shop@123456",
    role: "ADMIN",
    label: "Admin",
  },
  {
    username: "ctv",
    email: "ctv@shop.local",
    password: "Shop@123456",
    role: "COLLABORATOR",
    label: "Cộng tác viên",
  },
  {
    username: "user",
    email: "user@shop.local",
    password: "Shop@123456",
    role: "USER",
    label: "User",
  },
];

export function findSampleAccount(login: string, password: string) {
  const normalizedLogin = login.trim().toLowerCase();

  return sampleAccounts.find(
    (account) =>
      account.password === password &&
      (account.username === normalizedLogin || account.email === normalizedLogin),
  );
}

export function createSampleAuthResponse(account: SampleAccount): AuthResponse {
  return {
    expiresIn: 86400,
    userId: `sample-${account.username}`,
    username: account.username,
    email: account.email,
    role: account.role,
  };
}
