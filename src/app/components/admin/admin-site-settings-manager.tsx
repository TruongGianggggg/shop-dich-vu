"use client";

import { ImageUp, Pencil, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { AdminSidebar } from "@/app/components/admin/admin-sidebar";
import { useAuthSession } from "@/app/components/use-auth-session";
import { getApiErrorMessage, ManualMonthlyDepositEntry, SiteSettings } from "@/lib/shop-api";

const defaultSettings: SiteSettings = {
  shopName: "SHOP GAME",
  logoUrl: "",
  bannerUrl: "",
  footerTitle: "SHOP GAME",
  footerDescription: "Dịch vụ game trực tuyến nhanh chóng và an toàn.",
  footerCopyright: "Shop Game. All rights reserved.",
  footerSupportTitle: "LIÊN HỆ HỖ TRỢ",
  footerSupportDescription: "Liên hệ ngay cho chăm sóc khách hàng nếu gặp lỗi khi sử dụng dịch vụ.",
  footerPhone: "",
  footerEmail: "",
  footerFacebookUrl: "",
  footerZaloUrl: "",
};

type ImageField = "logoUrl" | "bannerUrl";

export function AdminSiteSettingsManager() {
  const session = useAuthSession();
  const [form, setForm] = useState<SiteSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<ImageField | "">("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const currentDate = new Date();
  const [leaderboardYear, setLeaderboardYear] = useState(currentDate.getFullYear());
  const [leaderboardMonth, setLeaderboardMonth] = useState(currentDate.getMonth() + 1);
  const [manualEntries, setManualEntries] = useState<ManualMonthlyDepositEntry[]>([]);
  const [manualRefreshKey, setManualRefreshKey] = useState(0);
  const [isLoadingManual, setIsLoadingManual] = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState("");
  const [manualForm, setManualForm] = useState({ displayName: "", amount: "" });

  useEffect(() => {
    if (session?.role !== "ADMIN") return;
    let ignore = false;

    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch("/api/site-settings", { cache: "no-store" });
        const data = (await readJson(response)) as SiteSettings | unknown;
        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, "Không tải được cấu hình shop."));
        }
        if (!ignore) setForm(data as SiteSettings);
      } catch (exception) {
        if (!ignore) {
          setError(exception instanceof Error ? exception.message : "Không tải được cấu hình shop.");
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    load();
    return () => { ignore = true; };
  }, [refreshKey, session]);

  useEffect(() => {
    if (session?.role !== "ADMIN") return;
    let ignore = false;

    async function loadManualEntries() {
      setIsLoadingManual(true);
      setError("");
      try {
        const response = await fetch(
          `/api/admin/deposits/leaderboard/manual?year=${leaderboardYear}&month=${leaderboardMonth}`,
          {
            cache: "no-store",
            headers: { Authorization: `${session!.tokenType} ${session!.token}` },
          },
        );
        const data = (await readJson(response)) as ManualMonthlyDepositEntry[] | unknown;
        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, "Không tải được top nạp thủ công."));
        }
        if (!ignore) setManualEntries(Array.isArray(data) ? data : []);
      } catch (exception) {
        if (!ignore) {
          setError(exception instanceof Error ? exception.message : "Không tải được top nạp thủ công.");
        }
      } finally {
        if (!ignore) setIsLoadingManual(false);
      }
    }

    loadManualEntries();
    return () => { ignore = true; };
  }, [leaderboardMonth, leaderboardYear, manualRefreshKey, session]);

  async function uploadImage(field: ImageField, file: File) {
    if (!session) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setError("Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh không được vượt quá 5 MB.");
      return;
    }

    setUploadingField(field);
    setError("");
    setMessage("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/site-settings/images", {
        method: "POST",
        headers: { Authorization: `${session.tokenType} ${session.token}` },
        body,
      });
      const data = (await readJson(response)) as unknown;
      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, "Không tải được ảnh lên."));
      }
      const imageUrl =
        data && typeof data === "object" && "imageUrl" in data
          ? (data as { imageUrl?: unknown }).imageUrl
          : null;
      if (typeof imageUrl !== "string" || !imageUrl) {
        throw new Error("Backend không trả đường dẫn ảnh hợp lệ.");
      }
      setForm((current) => ({ ...current, [field]: imageUrl }));
      setMessage("Đã tải ảnh lên. Bấm Lưu cấu hình để áp dụng.");
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Không tải được ảnh lên.");
    } finally {
      setUploadingField("");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: {
          Authorization: `${session.tokenType} ${session.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const data = (await readJson(response)) as SiteSettings | unknown;
      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, "Không lưu được cấu hình shop."));
      }
      setForm(data as SiteSettings);
      setMessage("Đã lưu cấu hình giao diện shop.");
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Không lưu được cấu hình shop.");
    } finally {
      setIsSaving(false);
    }
  }

  async function submitManualEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    const amount = Number(manualForm.amount);
    if (!manualForm.displayName.trim() || !Number.isSafeInteger(amount) || amount <= 0) {
      setError("Hãy nhập tên hiển thị và số tiền hợp lệ.");
      return;
    }

    setIsSavingManual(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        editingEntryId
          ? `/api/admin/deposits/leaderboard/manual/${encodeURIComponent(editingEntryId)}`
          : "/api/admin/deposits/leaderboard/manual",
        {
          method: editingEntryId ? "PUT" : "POST",
          headers: {
            Authorization: `${session.tokenType} ${session.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            displayName: manualForm.displayName.trim(),
            amount,
            year: leaderboardYear,
            month: leaderboardMonth,
          }),
        },
      );
      const data = await readJson(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, "Không lưu được người trong top nạp."));
      }
      setManualForm({ displayName: "", amount: "" });
      setEditingEntryId("");
      setManualRefreshKey((value) => value + 1);
      setMessage(editingEntryId ? "Đã cập nhật top nạp thủ công." : "Đã thêm người vào top nạp.");
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Không lưu được người trong top nạp.");
    } finally {
      setIsSavingManual(false);
    }
  }

  async function deleteManualEntry(entry: ManualMonthlyDepositEntry) {
    if (!session || !window.confirm(`Xoá ${entry.displayName} khỏi top nạp tháng này?`)) return;
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `/api/admin/deposits/leaderboard/manual/${encodeURIComponent(entry.id)}`,
        {
          method: "DELETE",
          headers: { Authorization: `${session.tokenType} ${session.token}` },
        },
      );
      if (!response.ok) {
        throw new Error(getApiErrorMessage(await readJson(response), "Không xoá được người khỏi top nạp."));
      }
      if (editingEntryId === entry.id) {
        setEditingEntryId("");
        setManualForm({ displayName: "", amount: "" });
      }
      setManualRefreshKey((value) => value + 1);
      setMessage("Đã xoá người khỏi top nạp thủ công.");
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Không xoá được người khỏi top nạp.");
    }
  }

  return (
    <main className="role-dashboard">
      <AdminSidebar active="settings" />
      <section className="role-main backoffice-users-main site-settings-main">
        <header className="php-page-header">
          <div>
            <h1>Cấu hình giao diện</h1>
            <p><span>Hệ thống</span><b>/</b>Cấu hình giao diện</p>
          </div>
          <button
            className="php-reload-button"
            disabled={isLoading}
            onClick={() => setRefreshKey((value) => value + 1)}
            type="button"
          >
            <RefreshCw aria-hidden="true" size={15} />
            Tải lại
          </button>
        </header>

        {message ? <p className="admin-users-message success">{message}</p> : null}
        {error ? <p className="admin-users-message error">{error}</p> : null}

        <form className="php-settings-block" onSubmit={submit}>
          <div className="php-block-title">THAY ĐỔI GIAO DIỆN WEBSITE</div>
          <div className="php-block-content">
            <div className="php-setting-row php-name-row">
              <label>
                <span>Tên shop</span>
                <input
                  className="php-form-control"
                  maxLength={120}
                  onChange={(event) => setForm({ ...form, shopName: event.target.value })}
                  required
                  value={form.shopName}
                />
              </label>
              <div className="php-name-preview"><small>Tên đang hiển thị</small><strong>{form.shopName}</strong></div>
            </div>

            <ImageEditor
              field="logoUrl"
              imageUrl={form.logoUrl}
              isUploading={uploadingField === "logoUrl"}
              label="Logo"
              onClear={() => setForm({ ...form, logoUrl: "" })}
              onUpload={uploadImage}
            />

            <ImageEditor
              field="bannerUrl"
              imageUrl={form.bannerUrl}
              isBanner
              isUploading={uploadingField === "bannerUrl"}
              label="Banner chính"
              onClear={() => setForm({ ...form, bannerUrl: "" })}
              onUpload={uploadImage}
            />
            <div className="php-footer-section">
              <h3>NỘI DUNG FOOTER</h3>
              <label>
                <span>Tiêu đề footer</span>
                <input className="php-form-control" maxLength={200} onChange={(event) => setForm({ ...form, footerTitle: event.target.value })} required value={form.footerTitle} />
              </label>
              <label>
                <span>Dòng bản quyền</span>
                <input className="php-form-control" maxLength={300} onChange={(event) => setForm({ ...form, footerCopyright: event.target.value })} required value={form.footerCopyright} />
              </label>
              <label className="php-footer-wide">
                <span>Nội dung giới thiệu shop</span>
                <textarea className="php-form-control" maxLength={1000} onChange={(event) => setForm({ ...form, footerDescription: event.target.value })} required value={form.footerDescription} />
              </label>
              <label>
                <span>Tiêu đề hỗ trợ</span>
                <input className="php-form-control" maxLength={200} onChange={(event) => setForm({ ...form, footerSupportTitle: event.target.value })} required value={form.footerSupportTitle} />
              </label>
              <label>
                <span>Số điện thoại</span>
                <input className="php-form-control" maxLength={40} onChange={(event) => setForm({ ...form, footerPhone: event.target.value })} placeholder="Ví dụ: 0966645030" value={form.footerPhone} />
              </label>
              <label className="php-footer-wide">
                <span>Nội dung liên hệ hỗ trợ</span>
                <textarea className="php-form-control" maxLength={1000} onChange={(event) => setForm({ ...form, footerSupportDescription: event.target.value })} required value={form.footerSupportDescription} />
              </label>
              <label>
                <span>Email hỗ trợ</span>
                <input className="php-form-control" maxLength={200} onChange={(event) => setForm({ ...form, footerEmail: event.target.value })} placeholder="support@example.com" type="email" value={form.footerEmail} />
              </label>
              <label>
                <span>Link Facebook</span>
                <input className="php-form-control" maxLength={1000} onChange={(event) => setForm({ ...form, footerFacebookUrl: event.target.value })} placeholder="https://facebook.com/..." type="url" value={form.footerFacebookUrl} />
              </label>
              <label className="php-footer-wide">
                <span>Link Zalo</span>
                <input className="php-form-control" maxLength={1000} onChange={(event) => setForm({ ...form, footerZaloUrl: event.target.value })} placeholder="https://zalo.me/..." type="url" value={form.footerZaloUrl} />
              </label>
            </div>

            <button className="php-save-button" disabled={isSaving || Boolean(uploadingField)}>
              <Save aria-hidden="true" size={17} />
              {isSaving ? "Đang lưu..." : "Lưu ngay"}
            </button>
          </div>
        </form>

        <section className="role-panel site-settings-panel manual-leaderboard-panel">
          <div className="role-panel-head manual-leaderboard-head">
            <div>
              <p className="section-kicker">Top nạp tháng</p>
              <h2>Người hiển thị thủ công</h2>
              <p>Người thật và người thêm tại đây sẽ được trộn, sau đó xếp hạng lại theo số tiền.</p>
            </div>
            <div className="manual-period-fields">
              <label>
                Tháng
                <select
                  className="text-field"
                  onChange={(event) => {
                    setLeaderboardMonth(Number(event.target.value));
                    setEditingEntryId("");
                    setManualForm({ displayName: "", amount: "" });
                  }}
                  value={leaderboardMonth}
                >
                  {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                    <option key={month} value={month}>Tháng {month}</option>
                  ))}
                </select>
              </label>
              <label>
                Năm
                <input
                  className="text-field"
                  max={2100}
                  min={2000}
                  onChange={(event) => setLeaderboardYear(Number(event.target.value))}
                  type="number"
                  value={leaderboardYear}
                />
              </label>
            </div>
          </div>

          <form className="manual-leaderboard-form" onSubmit={submitManualEntry}>
            <label className="field-label">
              Tên hiển thị
              <input
                className="text-field"
                maxLength={80}
                onChange={(event) => setManualForm({ ...manualForm, displayName: event.target.value })}
                placeholder="Ví dụ: nam******"
                required
                value={manualForm.displayName}
              />
            </label>
            <label className="field-label">
              Số tiền nạp
              <input
                className="text-field"
                min={1}
                onChange={(event) => setManualForm({ ...manualForm, amount: event.target.value })}
                placeholder="Ví dụ: 8000000"
                required
                step={1}
                type="number"
                value={manualForm.amount}
              />
            </label>
            <button className="primary-button h-11 px-5" disabled={isSavingManual} type="submit">
              {editingEntryId ? <Save aria-hidden="true" size={16} /> : <Plus aria-hidden="true" size={16} />}
              {isSavingManual ? "Đang lưu..." : editingEntryId ? "Lưu thay đổi" : "Thêm vào top"}
            </button>
            {editingEntryId ? (
              <button
                className="ghost-button h-11 px-4"
                onClick={() => {
                  setEditingEntryId("");
                  setManualForm({ displayName: "", amount: "" });
                }}
                type="button"
              >
                <X aria-hidden="true" size={16} /> Huỷ sửa
              </button>
            ) : null}
          </form>

          <div className="manual-leaderboard-list">
            {isLoadingManual ? <p className="manual-empty">Đang tải danh sách...</p> : null}
            {!isLoadingManual && !manualEntries.length ? (
              <p className="manual-empty">Chưa có người hiển thị thủ công trong tháng này.</p>
            ) : null}
            {manualEntries.map((entry, index) => (
              <article className="manual-leaderboard-row" key={entry.id}>
                <span className="manual-rank">{index + 1}</span>
                <div><strong>{entry.displayName}</strong><small>Tháng {entry.month}/{entry.year}</small></div>
                <b>{formatCurrency(entry.amount)}</b>
                <div className="manual-row-actions">
                  <button
                    className="ghost-button h-9 px-3"
                    onClick={() => {
                      setEditingEntryId(entry.id);
                      setManualForm({ displayName: entry.displayName, amount: String(entry.amount) });
                    }}
                    type="button"
                  >
                    <Pencil aria-hidden="true" size={14} /> Sửa
                  </button>
                  <button className="danger-button h-9 px-3" onClick={() => deleteManualEntry(entry)} type="button">
                    <Trash2 aria-hidden="true" size={14} /> Xoá
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function ImageEditor({ field, imageUrl, isBanner = false, isUploading, label, onClear, onUpload }: {
  field: ImageField;
  imageUrl: string;
  isBanner?: boolean;
  isUploading: boolean;
  label: string;
  onClear: () => void;
  onUpload: (field: ImageField, file: File) => void;
}) {
  return (
    <div className="site-image-editor php-setting-row">
      <div className="site-image-control">
        <span className="site-image-label">{label}</span>
        <div className="site-image-actions">
          <label className="php-file-control site-image-upload">
            <ImageUp aria-hidden="true" size={16} />
            {isUploading ? "Đang tải ảnh..." : "Chọn tệp ảnh"}
            <input
              accept="image/jpeg,image/png,image/webp"
              disabled={isUploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onUpload(field, file);
                event.currentTarget.value = "";
              }}
              type="file"
            />
          </label>
          {imageUrl ? (
            <button className="php-remove-image" onClick={onClear} type="button">
              <Trash2 aria-hidden="true" size={14} /> Bỏ ảnh
            </button>
          ) : null}
        </div>
        <small>JPG, PNG hoặc WEBP, tối đa 5 MB.</small>
      </div>
      <div
        className={`site-image-preview${isBanner ? " is-banner" : ""}${imageUrl ? " has-image" : ""}`}
        style={imageUrl ? { backgroundImage: `url(${JSON.stringify(imageUrl)})` } : undefined}
      >
        {!imageUrl ? <span>Chưa có ảnh</span> : null}
      </div>
    </div>
  );
}

async function readJson(response: Response) {
  try { return await response.json(); } catch { return null; }
}

function formatCurrency(amount: number) {
  return `${amount.toLocaleString("vi-VN")} đ`;
}
