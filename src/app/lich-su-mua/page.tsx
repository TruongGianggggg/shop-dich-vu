import { OrderHistory } from "@/app/components/order-history";
import styles from "./order-history.module.css";

export default function OrderHistoryPage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.title}>
          <p>TÀI KHOẢN CỦA TÔI</p>
          <h1>Lịch sử mua dịch vụ</h1>
          <span>Theo dõi trạng thái và thông tin các đơn đã đặt.</span>
        </div>
        <OrderHistory />
      </main>
    </div>
  );
}
