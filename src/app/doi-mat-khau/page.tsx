import { PasswordChangeForm } from "@/app/components/password-change-form";
import { UserAccountShell } from "@/app/components/user-account-shell";
import "./password-change.css";

export default function PasswordChangePage() {
  return (
    <UserAccountShell>
      <main className="password-change-page"><PasswordChangeForm /></main>
    </UserAccountShell>
  );
}
