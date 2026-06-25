import { DepositHistoryManager } from "@/app/components/deposit-history-manager";
import { RoleGate } from "@/app/components/role-gate";

export default function AdminDepositsPage() {
  return (
    <RoleGate allowedRoles={["ADMIN"]}>
      <DepositHistoryManager />
    </RoleGate>
  );
}
