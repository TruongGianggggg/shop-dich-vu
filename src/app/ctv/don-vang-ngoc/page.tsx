import { CollaboratorCurrencyOrdersManager } from "@/app/components/collaborator-currency-orders-manager";
import { RoleGate } from "@/app/components/role-gate";
import "./style.css";

export default function CollaboratorCurrencyOrdersPage() {
  return <RoleGate allowedRoles={["COLLABORATOR"]}><CollaboratorCurrencyOrdersManager /></RoleGate>;
}
