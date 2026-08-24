"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import {
  ServiceOrder,
  ServicePackage,
  ServiceSubCategory,
  formatVnd,
  getApiErrorMessage,
} from "@/lib/shop-api";
import { SafeRichText } from "./safe-rich-text";
import { useAuthSession } from "./use-auth-session";

type CarotBatchOrderResponse = {
  batchId: string;
  accountCount: number;
  totalAmount: number;
  orders: ServiceOrder[];
};

function parseCarotUsernames(value: string) {
  return value
    .split(/\r?\n/)
    .map((username) => username.trim())
    .filter(Boolean);
}

const NGOC_RONG_SERVERS = [
  "1 Sao",
  "2 Sao",
  "3 Sao",
  "4 Sao",
  "5 Sao",
  "6 Sao",
  "7 Sao",
  "8 Sao",
  "9 Sao",
  "10 Sao",
  "Vip 1",
  "12 Sao",
  "Super 1",
  "Super 2",
  "13 Sao",
  "Vip 2",
  "14 Sao",
  "Super 3",
] as const;

export function ServiceOrderForm({
  service,
  packages,
}: {
  service: ServiceSubCategory;
  packages: ServicePackage[];
}) {
  const session = useAuthSession();
  const [selectedPackageId, setSelectedPackageId] = useState(
    packages[0]?.id ?? "",
  );
  const [message, setMessage] = useState("");
  const [createdOrder, setCreatedOrder] = useState<ServiceOrder | null>(null);
  const [createdCarotBatch, setCreatedCarotBatch] =
    useState<CarotBatchOrderResponse | null>(null);
  const [carotUsernameInput, setCarotUsernameInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedPackage = useMemo(
    () => packages.find((item) => item.id === selectedPackageId) ?? null,
    [packages, selectedPackageId],
  );
  const isManualService = service.type === "GAME_SERVICE";
  const isCarotTopup = service.type === "TOPUP_CAROT";
  const carotUsernames = useMemo(
    () => parseCarotUsernames(carotUsernameInput),
    [carotUsernameInput],
  );
  const usesNgocRongServers =
    isCarotTopup || service.the9pServiceCode?.trim().toLowerCase() === "nr";
  const returnUrl = `/dich-vu/${encodeURIComponent(service.id)}`;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setMessage("");
    setCreatedOrder(null);
    setCreatedCarotBatch(null);

    if (!session) {
      window.location.href = `/login?returnUrl=${encodeURIComponent(returnUrl)}`;
      return;
    }

    if (!selectedPackage) {
      setMessage("Vui lòng chọn một gói dịch vụ.");
      return;
    }

    const formData = new FormData(form);
    const account = String(formData.get("account") ?? "").trim();
    const server = String(formData.get("server") ?? "").trim();
    const note = String(formData.get("note") ?? "").trim();
    if (isCarotTopup) {
      if (!carotUsernames.length || !server) {
        setMessage("Vui lòng nhập tài khoản và chọn server dùng chung.");
        return;
      }
      const uniqueUsernames = new Set(
        carotUsernames.map((username) => username.toLowerCase()),
      );
      if (uniqueUsernames.size !== carotUsernames.length) {
        setMessage("Danh sách có username bị trùng. Vui lòng kiểm tra lại.");
        return;
      }
    }

    const payload = isCarotTopup
      ? {
          subCategoryId: service.id,
          packageId: selectedPackage.id,
          usernames: carotUsernames,
          server,
          note,
        }
      : isManualService
      ? {
          subCategoryId: service.id,
          packageId: selectedPackage.id,
          username: account,
          password: String(formData.get("password") ?? ""),
          server,
          note,
        }
      : {
          subCategoryId: service.id,
          packageId: selectedPackage.id,
          accountInfo: { account, server },
          note,
        };

    setIsSubmitting(true);

    try {
      const response = await fetch(
        isCarotTopup
          ? "/api/service-orders/topup/carot-batch"
          : isManualService
          ? "/api/service-orders/game-service"
          : "/api/service-orders/topup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      const data = (await response.json()) as
        | ServiceOrder
        | CarotBatchOrderResponse
        | unknown;

      if (!response.ok) {
        setMessage(getApiErrorMessage(data, "Không thể tạo đơn dịch vụ."));
        return;
      }

      if (isCarotTopup) {
        setCreatedCarotBatch(data as CarotBatchOrderResponse);
        setCarotUsernameInput("");
      } else {
        setCreatedOrder(data as ServiceOrder);
      }
      form.reset();
      setSelectedPackageId(selectedPackage.id);
    } catch {
      setMessage("Không kết nối được hệ thống đặt đơn.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!packages.length) {
    return (
      <div className="detail-empty-state">
        <strong>Dịch vụ chưa có gói đang mở bán</strong>
        <p>Vui lòng quay lại sau hoặc liên hệ quản trị viên.</p>
      </div>
    );
  }

  return (
    <form
      className="detail-order-form"
      data-route-scroll-target
      onSubmit={submit}
    >
      <section className="detail-order-panel">
        <div className="detail-panel-heading">
          <span>1</span>
          <h2>Chọn Gói Dịch Vụ</h2>
        </div>
        <div className="detail-panel-body">
          <label className="detail-select-wrap">
            <span className="detail-visually-hidden">Chọn gói dịch vụ</span>
            <select
              name="packageId"
              onChange={(event) => setSelectedPackageId(event.target.value)}
              value={selectedPackageId}
            >
              <option disabled value="">Tìm và chọn gói dịch vụ...</option>
              {packages.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {formatVnd(item.price)}
                </option>
              ))}
            </select>
          </label>
          {selectedPackage?.description ? (
            <SafeRichText
              className="detail-package-description"
              html={selectedPackage.description}
            />
          ) : null}
        </div>
      </section>

      <section className="detail-order-panel">
        <div className="detail-panel-heading">
          <span>2</span>
          <h2>Thông Tin Tài Khoản</h2>
        </div>
        <div className="detail-panel-body detail-account-grid">
          {isCarotTopup ? (
            <label className="detail-field detail-field-wide">
              <span>Danh sách tài khoản đăng nhập</span>
              <textarea
                autoComplete="off"
                className="detail-carot-accounts-textarea"
                name="account"
                onChange={(event) => setCarotUsernameInput(event.target.value)}
                placeholder={"Nhập tài khoản đăng nhập\nMỗi tài khoản một dòng"}
                required
                rows={8}
                value={carotUsernameInput}
              />
              <small className="detail-field-helper">
                Mỗi tài khoản một dòng — đã nhập {carotUsernames.length} tài khoản.
              </small>
            </label>
          ) : (
            <label className="detail-field">
              <span>Tài Khoản</span>
              <input
                autoComplete="off"
                maxLength={120}
                name="account"
                placeholder="Nhập tài khoản cần xử lý"
                required
              />
            </label>
          )}
          {isManualService ? (
            <label className="detail-field">
              <span>Mật Khẩu</span>
              <input
                autoComplete="new-password"
                maxLength={120}
                name="password"
                placeholder="Nhập mật khẩu của tài khoản"
                required
                type="password"
              />
            </label>
          ) : null}
          <label className="detail-field detail-field-wide">
            <span>Server</span>
            {usesNgocRongServers ? (
              <select defaultValue="" name="server" required>
                <option disabled value="">Chọn máy chủ</option>
                {NGOC_RONG_SERVERS.map((server) => (
                  <option key={server} value={server}>{server}</option>
                ))}
              </select>
            ) : (
              <input
                maxLength={120}
                name="server"
                placeholder="Nhập tên hoặc số máy chủ, ví dụ: Server 1"
                required
              />
            )}
          </label>
        </div>
      </section>

      <section className="detail-order-panel">
        <div className="detail-panel-heading">
          <span>3</span>
          <h2>Ghi Chú &amp; Xác Nhận</h2>
        </div>
        <div className="detail-panel-body">
          <label className="detail-field">
            <span>Ghi Chú</span>
            <textarea
              maxLength={1000}
              name="note"
              placeholder="Nhập ghi chú cho admin nếu có..."
              rows={4}
            />
          </label>
          <div className="detail-confirm-box">
            <div className="detail-total">
              <span>Tổng thanh toán</span>
              <strong>
                {selectedPackage
                  ? formatVnd(
                        selectedPackage.price *
                        (isCarotTopup ? carotUsernames.length : 1),
                    )
                  : "—"}
              </strong>
            </div>
            {message ? <p className="detail-form-error">{message}</p> : null}
            {createdOrder ? (
              <div className="detail-order-success" role="status">
                <strong>Tạo đơn thành công</strong>
                <span>Mã đơn: {createdOrder.requestId}</span>
                <Link href="/lich-su-mua">Xem lịch sử mua →</Link>
              </div>
            ) : null}
            {createdCarotBatch ? (
              <div className="detail-order-success" role="status">
                <strong>
                  Đã tạo thành công {createdCarotBatch.accountCount} đơn nạp Carot
                </strong>
                <span>Mã lô: {createdCarotBatch.batchId}</span>
                <Link href="/lich-su-mua">Xem lịch sử mua →</Link>
              </div>
            ) : null}
            <button disabled={isSubmitting || !selectedPackage} type="submit">
              <span aria-hidden="true">🛒</span>
              {isSubmitting
                ? "Đang tạo đơn..."
                : session
                  ? isCarotTopup && carotUsernames.length > 1
                    ? `Tạo ${carotUsernames.length} Đơn Hàng`
                    : "Tạo Đơn Hàng"
                  : "Đăng nhập để đặt dịch vụ"}
            </button>
          </div>
        </div>
      </section>
    </form>
  );
}
