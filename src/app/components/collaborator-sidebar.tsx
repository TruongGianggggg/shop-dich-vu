"use client";

import Link from "next/link";
import { BadgeDollarSign, ClipboardList, Coins, History, Landmark, ReceiptText, UserCheck } from "lucide-react";

type CollaboratorSection = "available" | "received" | "currency-settings" | "currency-orders" | "withdraw" | "withdraw-history";

export function CollaboratorSidebar({ active }: { active: CollaboratorSection }) {
  return (
    <aside className="role-sidebar">
      <Link className="role-brand" href="/">
        <span>SG</span>
        <strong>Shop Game</strong>
      </Link>

      <div className="role-nav-block">
        <p>QUẢN TRỊ CTV</p>
        <nav className="role-nav">
          <Link className={active === "available" ? "role-nav-link active" : "role-nav-link"} href="/ctv?tab=available">
            <span aria-hidden="true"><ClipboardList size={16} strokeWidth={2.2} /></span>
            Đơn có thể nhận
          </Link>
          <Link className={active === "received" ? "role-nav-link active" : "role-nav-link"} href="/ctv?tab=received">
            <span aria-hidden="true"><UserCheck size={16} strokeWidth={2.2} /></span>
            Đơn của tôi
          </Link>
          <Link className={active === "currency-settings" ? "role-nav-link active" : "role-nav-link"} href="/ctv/cau-hinh-vang-ngoc">
            <span aria-hidden="true"><Coins size={16} strokeWidth={2.2} /></span>
            Cấu hình Vàng &amp; Ngọc
          </Link>
          <Link className={active === "currency-orders" ? "role-nav-link active" : "role-nav-link"} href="/ctv/don-vang-ngoc">
            <span aria-hidden="true"><ReceiptText size={16} strokeWidth={2.2} /></span>
            Đơn Vàng &amp; Ngọc
          </Link>
          <Link className={active === "withdraw" ? "role-nav-link active" : "role-nav-link"} href="/ctv/rut-tien">
            <span aria-hidden="true"><Landmark size={16} strokeWidth={2.2} /></span>
            Rút tiền CTV
          </Link>
          <Link className={active === "withdraw-history" ? "role-nav-link active" : "role-nav-link"} href="/ctv/lich-su-rut-tien">
            <span aria-hidden="true"><History size={16} strokeWidth={2.2} /></span>
            Lịch sử rút tiền
          </Link>
        </nav>
      </div>

      <div className="role-sidebar-widget">
        <p>PHẠM VI CÔNG VIỆC</p>
        <strong><BadgeDollarSign aria-hidden="true" size={18} /> Theo dịch vụ được giao</strong>
        <span>Bạn chỉ thấy và nhận được đơn thuộc các gói dịch vụ admin đã phân công.</span>
      </div>
    </aside>
  );
}
