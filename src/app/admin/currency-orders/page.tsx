import { AdminCurrencyOrdersManager } from "@/app/components/admin/admin-currency-orders-manager";
import { RoleGate } from "@/app/components/role-gate";

export default function AdminCurrencyOrdersPage() {
  return <RoleGate allowedRoles={["ADMIN"]}><AdminCurrencyOrdersManager /></RoleGate>;
}
