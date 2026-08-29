import { AdminActiveOrdersManager } from "@/app/components/admin/admin-active-orders-manager";
import { RoleGate } from "@/app/components/role-gate";

export default function AdminActiveOrdersPage() {
  return (
    <RoleGate allowedRoles={["ADMIN"]}>
      <AdminActiveOrdersManager />
    </RoleGate>
  );
}
