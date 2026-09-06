import { RoleGate } from "@/app/components/role-gate";
import { AdminDashboard } from "@/app/components/admin/admin-dashboard";

export default function AdminPage() {
  return (
    <RoleGate allowedRoles={["ADMIN"]}>
      <AdminDashboard />
    </RoleGate>
  );
}
