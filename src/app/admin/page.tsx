import { RoleGate } from "@/app/components/role-gate";
import {
  RoleDashboard,
  adminDashboardData,
} from "@/app/components/role-dashboard";

export default function AdminPage() {
  return (
    <RoleGate allowedRoles={["ADMIN"]}>
      <RoleDashboard {...adminDashboardData} />
    </RoleGate>
  );
}
