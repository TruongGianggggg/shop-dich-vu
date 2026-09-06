import { AdminSiteSettingsManager } from "@/app/components/admin/admin-site-settings-manager";
import { RoleGate } from "@/app/components/role-gate";
import "./site-settings.css";

export default function AdminSiteSettingsPage() {
  return (
    <RoleGate allowedRoles={["ADMIN"]}>
      <AdminSiteSettingsManager />
    </RoleGate>
  );
}
