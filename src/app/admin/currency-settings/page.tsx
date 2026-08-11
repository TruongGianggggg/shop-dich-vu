import { AdminCurrencySettingsManager } from "@/app/components/admin/admin-currency-settings-manager";
import { RoleGate } from "@/app/components/role-gate";
import "./currency-settings.css";

export default function AdminCurrencySettingsPage() {
  return (
    <RoleGate allowedRoles={["ADMIN"]}>
      <AdminCurrencySettingsManager />
    </RoleGate>
  );
}
