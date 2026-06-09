import { RoleGate } from "@/app/components/role-gate";
import {
  RoleDashboard,
  collaboratorDashboardData,
} from "@/app/components/role-dashboard";

export default function CollaboratorPage() {
  return (
    <RoleGate allowedRoles={["COLLABORATOR", "ADMIN"]}>
      <RoleDashboard {...collaboratorDashboardData} />
    </RoleGate>
  );
}
