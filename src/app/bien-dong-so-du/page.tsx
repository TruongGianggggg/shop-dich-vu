import { BalanceChanges } from "@/app/components/balance-changes";
import { UserAccountShell } from "@/app/components/user-account-shell";

export default function BalanceChangesPage() {
  return <UserAccountShell><BalanceChanges /></UserAccountShell>;
}
