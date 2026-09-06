import { AdminBanksManager } from "@/app/components/admin/admin-banks-manager";
import { RoleGate } from "@/app/components/role-gate";

export default function AdminBanksPage() {
  return (
    <RoleGate allowedRoles={["ADMIN"]}>
      <AdminBanksManager />
    </RoleGate>
  );
}
