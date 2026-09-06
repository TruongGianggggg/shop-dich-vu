import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_TOKEN_COOKIE_NAME } from "@/lib/auth-cookie";
import { fetchBackendJson } from "@/lib/backend";
import type { AuthResponse } from "@/lib/shop-api";

export default async function CollaboratorLayout({
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
    console.error("Collaborator session verification failed", error);
  }

  if (!session) redirect("/login");
  if (session.role !== "COLLABORATOR") redirect("/");

  return children;
}
