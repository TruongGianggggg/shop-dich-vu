import { AdminCollaboratorWithdrawalsManager } from "@/app/components/admin/admin-collaborator-withdrawals-manager";
import { RoleGate } from "@/app/components/role-gate";

export default function AdminCollaboratorWithdrawalsPage() {
  return <RoleGate allowedRoles={["ADMIN"]}><AdminCollaboratorWithdrawalsManager /></RoleGate>;
}
