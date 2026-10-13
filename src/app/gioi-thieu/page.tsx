import { ReferralDashboard } from "@/app/components/referral-dashboard";
import { UserAccountShell } from "@/app/components/user-account-shell";

export default function ReferralPage() {
  return <UserAccountShell><ReferralDashboard /></UserAccountShell>;
}
