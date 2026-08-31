import { RoleGate } from "@/app/components/role-gate";
import { UserVpsManager } from "@/app/components/vps/user-vps-manager";

export default function MyVpsPage() {
  return (
    <RoleGate allowedRoles={["USER", "COLLABORATOR", "ADMIN"]}>
      <UserVpsManager />
    </RoleGate>
  );
}
