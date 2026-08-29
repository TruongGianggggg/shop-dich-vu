import { AdminActivityLogsManager } from "@/app/components/admin/admin-activity-logs-manager";
import { RoleGate } from "@/app/components/role-gate";

export default function AdminActivityLogsPage() {
  return (
    <RoleGate allowedRoles={["ADMIN"]}>
      <AdminActivityLogsManager />
    </RoleGate>
  );
}
