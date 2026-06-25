import { AdminUsersManager } from "@/app/components/admin/admin-users-manager";
import { RoleGate } from "@/app/components/role-gate";

export default function AdminUsersPage() {
  return (
    <RoleGate allowedRoles={["ADMIN"]}>
      <AdminUsersManager />
    </RoleGate>
  );
}
