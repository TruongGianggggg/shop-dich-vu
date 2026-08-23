import { AuthForm } from "@/app/components/auth-form";
import Home from "@/app/page";
import "../login/login-modal.css";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ returnUrl?: string | string[] }>;
}) {
  const query = await searchParams;
  const requestedReturnUrl = Array.isArray(query.returnUrl)
    ? query.returnUrl[0]
    : query.returnUrl;
  const returnUrl =
    requestedReturnUrl?.startsWith("/") &&
    !requestedReturnUrl.startsWith("//")
      ? requestedReturnUrl
      : undefined;

  return (
    <div className="login-modal-page">
      <div aria-hidden="true" className="login-modal-background">
        <Home />
      </div>
      <div className="login-modal-shade" />
      <main className="login-modal-layer">
        <AuthForm
          closeHref={returnUrl ?? "/"}
          mode="register"
          returnUrl={returnUrl}
        />
      </main>
    </div>
  );
}
