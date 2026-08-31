import { AdminVpsManager } from "@/app/components/admin/admin-vps-manager";
import { RoleGate } from "@/app/components/role-gate";

export default function AdminVpsPage() {
  return (
    <RoleGate allowedRoles={["ADMIN"]}>
      <AdminVpsManager />
    </RoleGate>
  );
}
