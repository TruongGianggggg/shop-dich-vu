import { Gift, History, Medal } from "lucide-react";
import { CommissionLeaderboard, PublicTransaction, formatVnd } from "@/lib/shop-api";

export function StorefrontCommunityPanels({ leaderboard, transactions }: { leaderboard: CommissionLeaderboard | null; transactions: PublicTransaction[] }) {
  const recentTransactions = transactions.slice(0, 5);
  return <section className="storefront-community" aria-label="Hoạt động và bảng xếp hạng">
    <Panel icon={<History size={19} />} title="Lịch sử giao dịch">
      {recentTransactions.length ? recentTransactions.map((item) => <article className="community-transaction" key={item.id}><div><strong>{item.username}</strong><span>{item.description}</span></div><b>{formatVnd(item.amount)}</b><time>{formatTime(item.completedAt)}</time></article>) : <p className="community-empty">Chưa có giao dịch hoàn thành.</p>}
    </Panel>
    <Ranking title="Top hoa hồng Referral" icon={<Gift size={19} />} entries={(leaderboard?.referrals ?? []).slice(0, 5)} />
    <Ranking title="Top hoa hồng Đại lý" icon={<Medal size={19} />} entries={(leaderboard?.agencies ?? []).slice(0, 5)} />
  </section>;
}

function Ranking({ title, icon, entries }: { title: string; icon: React.ReactNode; entries: { username: string; amount: number }[] }) {
  return <Panel icon={icon} title={title}>{entries.length ? entries.map((item, index) => <article className="community-rank" key={item.username}><span>{index < 3 ? ["🥇", "🥈", "🥉"][index] : index + 1}</span><strong>{item.username}</strong><b>{formatVnd(item.amount)}</b></article>) : <p className="community-empty">Chưa có dữ liệu xếp hạng.</p>}</Panel>;
}
function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) { return <section className="community-panel"><header><span>{icon}</span><h2>{title}</h2></header><div>{children}</div></section>; }
function formatTime(value: string) { return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value)); }
