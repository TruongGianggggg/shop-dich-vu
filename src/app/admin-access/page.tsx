import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminOtpForm } from "@/app/components/admin-otp-form";
import { AUTH_TOKEN_COOKIE_NAME } from "@/lib/auth-cookie";
import { fetchBackendJson } from "@/lib/backend";
import { AuthResponse } from "@/lib/shop-api";
import "./admin-access.css";

export default async function AdminAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const token = (await cookies()).get(AUTH_TOKEN_COOKIE_NAME)?.value;
  if (!token) redirect("/login");

  let session: AuthResponse | null = null;
  try {
    session = await fetchBackendJson<AuthResponse>("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {}

  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/");

  const query = await searchParams;
  const requestedNext = Array.isArray(query.next) ? query.next[0] : query.next;
  const next = sanitizeAdminPath(requestedNext);

  return (
    <main className="admin-access-page">
      <div className="admin-access-glow" aria-hidden="true" />
      <AdminOtpForm next={next} />
    </main>
  );
}

function sanitizeAdminPath(value: string | undefined) {
  return value?.startsWith("/admin") && !value.startsWith("//")
    ? value
    : "/admin";
}
