import { CurrencyOrderHistory } from "@/app/components/currency-order-history";
import { UserAccountShell } from "@/app/components/user-account-shell";

export default function CurrencyOrderHistoryPage() {
  return (
    <UserAccountShell>
      <div className="order-history-page currency-history-page">
        <main className="order-history-main currency-history-main">
          <div className="order-history-title currency-history-title">
            <p>TÀI KHOẢN CỦA TÔI</p>
            <h1>Lịch sử nạp Vàng & Ngọc</h1>
            <span>Theo dõi trạng thái, số tiền và số lượng thực nhận của từng đơn.</span>
          </div>
          <CurrencyOrderHistory />
        </main>
      </div>
    </UserAccountShell>
  );
}
