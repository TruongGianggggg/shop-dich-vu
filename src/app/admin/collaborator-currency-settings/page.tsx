import { AdminCollaboratorCurrencySettingsManager } from "@/app/components/admin/admin-collaborator-currency-settings-manager";
import { RoleGate } from "@/app/components/role-gate";
import "../currency-settings/currency-settings.css";
import "./collaborator-currency-settings.css";

export default function AdminCollaboratorCurrencySettingsPage() {
  return <RoleGate allowedRoles={["ADMIN"]}><AdminCollaboratorCurrencySettingsManager /></RoleGate>;
}
