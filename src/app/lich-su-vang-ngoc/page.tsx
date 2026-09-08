import { CurrencyOrderHistory } from "@/app/components/currency-order-history";

export default function CurrencyOrderHistoryPage() {
  return (
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
  );
}
