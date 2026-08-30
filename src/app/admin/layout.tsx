import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_ACCESS_COOKIE_NAME,
  isAdminAccessGranted,
} from "@/lib/admin-otp";
import { AUTH_TOKEN_COOKIE_NAME } from "@/lib/auth-cookie";
import { fetchBackendJson } from "@/lib/backend";
import { AuthResponse } from "@/lib/shop-api";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value;

  if (!token) redirect("/login");

  let session: AuthResponse | null = null;
  try {
    session = await fetchBackendJson<AuthResponse>("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    console.error("Admin session verification failed", error);
  }

  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/");
  if (
    !isAdminAccessGranted(
      cookieStore.get(ADMIN_ACCESS_COOKIE_NAME)?.value,
      session.userId,
    )
  ) {
    redirect("/admin-access");
  }

  return children;
}
