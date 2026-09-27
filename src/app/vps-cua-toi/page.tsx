import { RoleGate } from "@/app/components/role-gate";
import { UserAccountShell } from "@/app/components/user-account-shell";
import { UserVpsManager } from "@/app/components/vps/user-vps-manager";

export default function MyVpsPage() {
  return (
    <UserAccountShell>
      <RoleGate allowedRoles={["USER", "COLLABORATOR", "ADMIN"]}>
        <UserVpsManager />
      </RoleGate>
    </UserAccountShell>
  );
}
