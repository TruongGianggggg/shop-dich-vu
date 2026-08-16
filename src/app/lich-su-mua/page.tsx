import { OrderHistory } from "@/app/components/order-history";

export default function OrderHistoryPage() {
  return (
    <div className="order-history-page">
      <main className="order-history-main">
        <div className="order-history-title">
          <p>TÀI KHOẢN CỦA TÔI</p>
          <h1>Lịch sử mua dịch vụ</h1>
          <span>Theo dõi trạng thái và thông tin các đơn đã đặt.</span>
        </div>
        <OrderHistory />
      </main>
    </div>
  );
}
