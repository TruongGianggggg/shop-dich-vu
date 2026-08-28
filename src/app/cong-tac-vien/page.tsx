import { CollaboratorDashboard } from "@/app/components/collaborator-dashboard";
import { RoleGate } from "@/app/components/role-gate";

export default function CollaboratorPage() {
  return (
    <RoleGate allowedRoles={["COLLABORATOR"]}>
      <CollaboratorDashboard />
    </RoleGate>
  );
}
