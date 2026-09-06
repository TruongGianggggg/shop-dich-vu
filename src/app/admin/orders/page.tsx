import { AdminOrdersManager } from "@/app/components/admin/admin-orders-manager";
import { RoleGate } from "@/app/components/role-gate";

export default function AdminOrdersPage() {
  return (
    <RoleGate allowedRoles={["ADMIN"]}>
      <AdminOrdersManager />
    </RoleGate>
  );
}
