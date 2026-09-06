import { AdminServicesManager } from "@/app/components/admin/admin-services-manager";
import { RoleGate } from "@/app/components/role-gate";
import "../services/services-upload.css";

export default function AdminServiceCategoriesPage() {
  return (
    <RoleGate allowedRoles={["ADMIN"]}>
      <AdminServicesManager view="parents" />
    </RoleGate>
  );
}
