import Link from "next/link";
import { AuthForm } from "@/app/components/auth-form";

export default function RegisterPage() {
  return (
    <main className="auth-page">
      <Link className="brand-mark" href="/">
        <span className="brand-symbol">SG</span>
        <span>
          <strong>Shop Game</strong>
          <small>Ve trang chu</small>
        </span>
      </Link>
      <AuthForm mode="register" />
    </main>
  );
}
