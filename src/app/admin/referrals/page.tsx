import { AdminReferralsManager } from "@/app/components/admin/admin-referrals-manager";
import { RoleGate } from "@/app/components/role-gate";

export default function AdminReferralsPage() {
  return <RoleGate allowedRoles={["ADMIN"]}><AdminReferralsManager /></RoleGate>;
}
