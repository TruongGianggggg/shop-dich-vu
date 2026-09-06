"use client";

import Link from "next/link";
import { BadgeDollarSign, ClipboardList, UserCheck } from "lucide-react";

export function CollaboratorSidebar({ activeTab }: { activeTab: "available" | "received" }) {
  return (
    <aside className="role-sidebar">
      <Link className="role-brand" href="/">
        <span>SG</span>
        <strong>Shop Game</strong>
      </Link>

      <div className="role-nav-block">
        <p>QUẢN TRỊ CTV</p>
        <nav className="role-nav">
          <Link className={activeTab === "available" ? "role-nav-link active" : "role-nav-link"} href="/ctv?tab=available">
            <span aria-hidden="true"><ClipboardList size={16} strokeWidth={2.2} /></span>
            Đơn có thể nhận
          </Link>
          <Link className={activeTab === "received" ? "role-nav-link active" : "role-nav-link"} href="/ctv?tab=received">
            <span aria-hidden="true"><UserCheck size={16} strokeWidth={2.2} /></span>
            Đơn của tôi
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
