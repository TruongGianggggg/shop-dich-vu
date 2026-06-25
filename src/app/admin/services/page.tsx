import { AdminServicesManager } from "@/app/components/admin/admin-services-manager";
import { RoleGate } from "@/app/components/role-gate";

export default function AdminServicesPage() {
  return (
    <RoleGate allowedRoles={["ADMIN"]}>
      <AdminServicesManager />
    </RoleGate>
  );
}
