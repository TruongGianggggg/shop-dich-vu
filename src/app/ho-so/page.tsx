import { ProfileOverview } from "@/app/components/profile-overview";
import { UserAccountShell } from "@/app/components/user-account-shell";

export default function ProfilePage() {
  return (
    <UserAccountShell>
      <div className="profile-page"><ProfileOverview /></div>
    </UserAccountShell>
  );
}
