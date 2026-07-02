"use client";

import Image from "next/image";
import {
  Pencil,
  Plus,
  QrCode,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AdminSidebar } from "@/app/components/admin/admin-sidebar";
import { useAuthSession } from "@/app/components/use-auth-session";
import {
  AuthResponse,
  BankAccount,
  BankAccountPayload,
  BankDepositSettings,
  BankQr,
  formatVnd,
  getApiErrorMessage,
} from "@/lib/shop-api";

const defaultSettings: BankDepositSettings = {
  enabled: true,
  prefix: "NAP",
  minAmount: 10000,
  maxAmount: 100000000,
  cronLink: "",
};

const emptyForm = {
  shortName: "",
  accountNumber: "",
  accountName: "",
  urlApi: "",
  active: true,
};

type BankForm = typeof emptyForm;

export function AdminBanksManager() {
  const session = useAuthSession();
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [form, setForm] = useState<BankForm>(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [settings, setSettings] =
    useState<BankDepositSettings>(defaultSettings);
  const [settingsForm, setSettingsForm] =
    useState<BankDepositSettings>(defaultSettings);
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);
  const [qrBank, setQrBank] = useState<BankAccount | null>(null);
  const [qrAmount, setQrAmount] = useState(String(defaultSettings.minAmount));
  const [qrUserId, setQrUserId] = useState("");
  const [qrResult, setQrResult] = useState<BankQr | null>(null);
  const [isQrLoading, setIsQrLoading] = useState(false);

  useEffect(() => {
    if (!session) {
      return;
    }

    const activeSession = session;
    let ignore = false;

    async function loadBanks() {
      setIsLoading(true);
      setError("");

      try {
        const headers = authHeaders(activeSession);
        const [response, settingsResponse] = await Promise.all([
          fetch("/api/admin/banks", { headers }),
          fetch("/api/admin/banks/settings", { headers }),
        ]);
        const data = (await readResponseJson(response)) as BankAccount[] | unknown;
        const settingsData = (await readResponseJson(settingsResponse)) as
          | BankDepositSettings
          | unknown;

        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, "Khong tai duoc ngan hang."));
        }

        if (!settingsResponse.ok) {
          throw new Error(
            getApiErrorMessage(settingsData, "Khong tai duoc cau hinh nap bank."),
          );
        }

        if (!ignore) {
          setBanks(
            (data as BankAccount[]).sort((a, b) =>
              a.shortName.localeCompare(b.shortName),
            ),
          );
          const loadedSettings = normalizeBankDepositSettings(settingsData);
          setSettings(loadedSettings);
          setSettingsForm(loadedSettings);
        }
      } catch (exception) {
        if (!ignore) {
          setBanks([]);
          setSettings(defaultSettings);
          setSettingsForm(defaultSettings);
          setError(
            exception instanceof Error
              ? exception.message
              : "Khong tai duoc ngan hang.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadBanks();

    return () => {
      ignore = true;
    };
  }, [refreshKey, session]);

  const summary = useMemo(() => {
    const activeCount = banks.filter((bank) => bank.active).length;

    return {
      activeCount,
      inactiveCount: banks.length - activeCount,
      total: banks.length,
      amountRange: `${formatVnd(settings.minAmount)} - ${formatVnd(
        settings.maxAmount,
      )}`,
    };
  }, [banks, settings]);

  function openCreateForm() {
    setEditingId("");
    setForm(emptyForm);
    setMessage("");
    setError("");
    setIsFormOpen(true);
  }

  function openEditForm(bank: BankAccount) {
    setEditingId(bank.id);
    setForm({
      shortName: bank.shortName,
      accountNumber: bank.accountNumber,
      accountName: bank.accountName,
      urlApi: bank.urlApi,
      active: bank.active,
    });
    setMessage("");
    setError("");
    setIsFormOpen(true);
  }

  function closeForm() {
    setEditingId("");
    setForm(emptyForm);
    setIsFormOpen(false);
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      return;
    }

    const payload: BankAccountPayload = {
      shortName: form.shortName.trim().toUpperCase(),
      accountNumber: form.accountNumber.trim(),
      accountName: form.accountName.trim(),
      urlApi: form.urlApi.trim(),
      active: form.active,
    };

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        editingId ? `/api/admin/banks/${editingId}` : "/api/admin/banks",
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            ...authHeaders(session),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      const data = (await readResponseJson(response)) as BankAccount | unknown;

      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, "Khong luu duoc ngan hang."));
      }

      const savedBank = data as BankAccount;
      setMessage(`Da luu ngan hang ${savedBank.shortName}.`);
      closeForm();
      setRefreshKey((current) => current + 1);
    } catch (exception) {
      setError(
        exception instanceof Error ? exception.message : "Khong luu duoc ngan hang.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteBank(bank: BankAccount) {
    if (!session) {
      return;
    }

    const confirmed = window.confirm(`Xoa ngan hang ${bank.shortName}?`);

    if (!confirmed) {
      return;
    }

    setUpdatingId(bank.id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/banks/${bank.id}`, {
        method: "DELETE",
        headers: authHeaders(session),
      });

      if (!response.ok) {
        const data = await readResponseJson(response);
        throw new Error(getApiErrorMessage(data, "Khong xoa duoc ngan hang."));
      }

      setMessage(`Da xoa ngan hang ${bank.shortName}.`);
      setBanks((current) => current.filter((item) => item.id !== bank.id));
    } catch (exception) {
      setError(
        exception instanceof Error ? exception.message : "Khong xoa duoc ngan hang.",
      );
    } finally {
      setUpdatingId("");
    }
  }

  async function submitSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      return;
    }

    const payload: BankDepositSettings = {
      enabled: settingsForm.enabled,
      prefix: settingsForm.prefix.trim().toUpperCase(),
      minAmount: Number(settingsForm.minAmount),
      maxAmount: Number(settingsForm.maxAmount),
      cronLink: (settingsForm.cronLink ?? "").trim(),
    };

    setIsSettingsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/banks/settings", {
        method: "PUT",
        headers: {
          ...authHeaders(session),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = (await readResponseJson(response)) as
        | BankDepositSettings
        | unknown;

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(data, "Khong luu duoc cau hinh nap bank."),
        );
      }

      const savedSettings = normalizeBankDepositSettings(data);
      setSettings(savedSettings);
      setSettingsForm(savedSettings);
      setQrAmount(String(savedSettings.minAmount));
      setMessage("Da luu cau hinh nap bank.");
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Khong luu duoc cau hinh nap bank.",
      );
    } finally {
      setIsSettingsSaving(false);
    }
  }

  function openQr(bank: BankAccount) {
    setQrBank(bank);
    setQrAmount(String(settings.minAmount));
    setQrUserId(session?.userId ?? "");
    setQrResult(null);
    setError("");
    setMessage("");
  }

  function closeQr() {
    setQrBank(null);
    setQrResult(null);
    setQrAmount(String(settings.minAmount));
    setQrUserId("");
  }

  async function createQr(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session || !qrBank) {
      return;
    }

    const amount = Number(qrAmount);

    setIsQrLoading(true);
    setError("");
    setQrResult(null);

    try {
      const params = new URLSearchParams({
        userId: qrUserId.trim(),
        amount: String(amount),
      });
      const response = await fetch(
        `/api/admin/banks/${qrBank.id}/qr?${params.toString()}`,
        { headers: authHeaders(session) },
      );
      const data = (await readResponseJson(response)) as BankQr | unknown;

      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, "Khong tao duoc QR."));
      }

      setQrResult(data as BankQr);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Khong tao duoc QR.");
    } finally {
      setIsQrLoading(false);
    }
  }

  return (
    <main className="role-dashboard">
      <AdminSidebar active="banks" />

      <section className="role-main backoffice-users-main admin-banks-main">
        <header className="role-topbar backoffice-users-header">
          <div>
            <p className="section-kicker">Ngân hàng</p>
            <h1>Quản lý ngân hàng</h1>
          </div>
          <div className="role-topbar-actions">
            <button
              className="ghost-button h-11 px-5"
              disabled={isLoading}
              onClick={() => setRefreshKey((current) => current + 1)}
              type="button"
            >
              <RefreshCw aria-hidden="true" size={16} />
              Tải lại
            </button>
            <button
              className="primary-button h-11 px-5"
              onClick={openCreateForm}
              type="button"
            >
              <Plus aria-hidden="true" size={16} />
              Thêm ngân hàng
            </button>
          </div>
        </header>

        <section className="role-metric-grid admin-bank-metrics">
          <article className="role-metric-card tone-blue">
            <p>Tổng ngân hàng</p>
            <strong>{summary.total}</strong>
            <span>Tài khoản cấu hình</span>
          </article>
          <article className="role-metric-card tone-green">
            <p>Đang bật</p>
            <strong>{summary.activeCount}</strong>
            <span>Có thể tạo QR nạp tiền</span>
          </article>
          <article className="role-metric-card tone-amber">
            <p>Tạm tắt</p>
            <strong>{summary.inactiveCount}</strong>
            <span>Không dùng nhận nạp</span>
          </article>
          <article className="role-metric-card tone-rose">
            <p>Khoảng nạp</p>
            <strong>{settings.prefix}</strong>
            <span>{summary.amountRange}</span>
          </article>
        </section>

        <section className="role-panel admin-bank-settings-panel">
          <div className="role-panel-head">
            <div>
              <p className="section-kicker">Cấu hình nạp bank</p>
              <h2>Quy tắc tạo QR chuyển khoản</h2>
            </div>
            <span>{settings.enabled ? "Đang bật" : "Tạm tắt"}</span>
          </div>

          <form className="admin-bank-settings-form" onSubmit={submitSettings}>
            <label className="admin-bank-switch-field">
              <input
                checked={settingsForm.enabled}
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    enabled: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span>
                <strong>Bật nạp tiền qua ngân hàng</strong>
                <small> Khi tắt, backend sẽ từ chối tạo QR nạp bank.</small>
              </span>
            </label>

            <div className="admin-bank-settings-grid">
              <label className="field-label">
                Tiền tố nội dung
                <input
                  className="text-field"
                  maxLength={24}
                  onChange={(event) =>
                    setSettingsForm((current) => ({
                      ...current,
                      prefix: event.target.value,
                    }))
                  }
                  placeholder="NAP"
                  required
                  value={settingsForm.prefix}
                />
              </label>
              <label className="field-label">
                Số tiền tối thiểu
                <input
                  className="text-field"
                  min={1}
                  onChange={(event) =>
                    setSettingsForm((current) => ({
                      ...current,
                      minAmount: Number(event.target.value),
                    }))
                  }
                  required
                  step={1000}
                  type="number"
                  value={settingsForm.minAmount}
                />
              </label>
              <label className="field-label">
                Số tiền tối đa
                <input
                  className="text-field"
                  min={1}
                  onChange={(event) =>
                    setSettingsForm((current) => ({
                      ...current,
                      maxAmount: Number(event.target.value),
                    }))
                  }
                  required
                  step={1000}
                  type="number"
                  value={settingsForm.maxAmount}
                />
              </label>
              <label className="field-label admin-bank-cron-field">
                Link cron
                <input
                  className="text-field"
                  onChange={(event) =>
                    setSettingsForm((current) => ({
                      ...current,
                      cronLink: event.target.value,
                    }))
                  }
                  placeholder="https://..."
                  type="url"
                  value={settingsForm.cronLink ?? ""}
                />
              </label>
            </div>

            <div className="admin-bank-settings-footer">
              <div>
                <strong>Nội dung mẫu</strong>
                <span>{settingsForm.prefix.trim().toUpperCase() || "NAP"}USER_ID</span>
              </div>
              <div>
                <strong>Link cron</strong>
                <span>{settingsForm.cronLink?.trim() || "Chưa cấu hình"}</span>
              </div>
              <button
                className="primary-button h-11 px-5"
                disabled={isSettingsSaving}
                type="submit"
              >
                {isSettingsSaving ? "Đang lưu..." : "Lưu cấu hình"}
              </button>
            </div>
          </form>
        </section>

        {message ? <p className="admin-users-message success">{message}</p> : null}
        {error ? <p className="admin-users-message error">{error}</p> : null}

        <section className="role-panel role-table-panel backoffice-table-card">
          <div className="role-panel-head">
            <div>
              <p className="section-kicker">Danh sách</p>
              <h2>Tài khoản ngân hàng</h2>
            </div>
            <span>{isLoading ? "Đang tải" : `${banks.length} ngân hàng`}</span>
          </div>

          <div className="role-table-wrap">
            <table className="role-table admin-users-table admin-banks-table">
              <thead>
                <tr>
                  <th>Ngân hàng</th>
                  <th>Số tài khoản</th>
                  <th>Chủ tài khoản</th>
                  <th>API giao dịch</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {banks.map((bank) => (
                  <tr key={bank.id}>
                    <td>
                      <strong>{bank.shortName}</strong>
                      <small>{bank.id}</small>
                    </td>
                    <td>{bank.accountNumber}</td>
                    <td>{bank.accountName}</td>
                    <td>
                      <span className="admin-bank-url">{bank.urlApi}</span>
                    </td>
                    <td>
                      <span
                        className={
                          bank.active
                            ? "admin-status-pill active"
                            : "admin-status-pill"
                        }
                      >
                        {bank.active ? "Đang bật" : "Tạm tắt"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-users-actions admin-bank-actions">
                        <button
                          className="ghost-button h-9 px-3"
                          disabled={!settings.enabled || !bank.active}
                          onClick={() => openQr(bank)}
                          type="button"
                        >
                          <QrCode aria-hidden="true" size={15} />
                          QR
                        </button>
                        <button
                          className="ghost-button h-9 px-3"
                          onClick={() => openEditForm(bank)}
                          type="button"
                        >
                          <Pencil aria-hidden="true" size={15} />
                          Sửa
                        </button>
                        <button
                          className="danger-button h-9 px-3"
                          disabled={updatingId === bank.id}
                          onClick={() => deleteBank(bank)}
                          type="button"
                        >
                          <Trash2 aria-hidden="true" size={15} />
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && banks.length === 0 ? (
                  <tr>
                    <td colSpan={6}>Chưa có ngân hàng nào.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      {isFormOpen && typeof document !== "undefined" ? createPortal(
        <div className="admin-user-modal" role="presentation">
          <button
            aria-label="Đóng form ngân hàng"
            className="admin-user-modal-backdrop"
            onClick={closeForm}
            type="button"
          />
          <section
            aria-modal="true"
            className="admin-user-modal-panel admin-bank-modal-panel"
            role="dialog"
          >
            <div className="admin-user-modal-header">
              <div>
                <h2>{editingId ? "Sửa ngân hàng" : "Thêm ngân hàng"}</h2>
                <p>Cấu hình tài khoản nhận chuyển khoản và API giao dịch</p>
              </div>
              <button
                aria-label="Đóng form"
                className="admin-user-modal-close"
                onClick={closeForm}
                type="button"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>

            <form className="admin-user-form admin-bank-form" onSubmit={submitForm}>
              <div className="admin-user-form-content">
                <label className="field-label">
                  Mã ngân hàng
                  <input
                    className="text-field"
                    maxLength={32}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        shortName: event.target.value,
                      }))
                    }
                    placeholder="VCB, MB, MOMO..."
                    required
                    value={form.shortName}
                  />
                </label>
                <label className="field-label">
                  Số tài khoản
                  <input
                    className="text-field"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        accountNumber: event.target.value,
                      }))
                    }
                    required
                    value={form.accountNumber}
                  />
                </label>
                <label className="field-label admin-form-span-2">
                  Chủ tài khoản
                  <input
                    className="text-field"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        accountName: event.target.value,
                      }))
                    }
                    required
                    value={form.accountName}
                  />
                </label>
                <label className="field-label admin-form-span-2">
                  URL API giao dịch
                  <input
                    className="text-field"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        urlApi: event.target.value,
                      }))
                    }
                    placeholder="https://..."
                    required
                    value={form.urlApi}
                  />
                </label>
                <label className="admin-check-field admin-form-span-2">
                  <input
                    checked={form.active}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        active: event.target.checked,
                      }))
                    }
                    type="checkbox"
                  />
                  Bật ngân hàng này
                </label>
              </div>
              <div className="admin-user-modal-actions">
                <button
                  className="ghost-button h-11 px-5"
                  onClick={closeForm}
                  type="button"
                >
                  Hủy
                </button>
                <button
                  className="primary-button h-11 px-5"
                  disabled={isSaving}
                  type="submit"
                >
                  {isSaving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </section>
        </div>,
        document.body,
      ) : null}

      {qrBank && typeof document !== "undefined" ? createPortal(
        <div className="admin-user-modal" role="presentation">
          <button
            aria-label="Đóng QR"
            className="admin-user-modal-backdrop"
            onClick={closeQr}
            type="button"
          />
          <section
            aria-modal="true"
            className="admin-user-modal-panel admin-bank-qr-panel"
            role="dialog"
          >
            <div className="admin-user-modal-header">
              <div>
                <h2>Tạo QR {qrBank.shortName}</h2>
                <p>{qrBank.accountNumber} - {qrBank.accountName}</p>
              </div>
              <button
                aria-label="Đóng QR"
                className="admin-user-modal-close"
                onClick={closeQr}
                type="button"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>

            <form className="admin-user-form admin-bank-form" onSubmit={createQr}>
              <div className="admin-user-form-content">
                <label className="field-label">
                  User ID nạp tiền
                  <input
                    className="text-field"
                    onChange={(event) => setQrUserId(event.target.value)}
                    required
                    value={qrUserId}
                  />
                </label>
                <label className="field-label">
                  Số tiền
                  <input
                    className="text-field"
                    min={settings.minAmount}
                    max={settings.maxAmount}
                    onChange={(event) => setQrAmount(event.target.value)}
                    required
                    step={1000}
                    type="number"
                    value={qrAmount}
                  />
                </label>
                {qrResult ? (
                  <div className="admin-bank-qr-result admin-form-span-2">
                    <Image
                      alt="QR nạp tiền"
                      height={180}
                      src={qrResult.qrUrl}
                      unoptimized
                      width={180}
                    />
                    <div>
                      <strong>{formatVnd(qrResult.amount)}</strong>
                      <span>{qrResult.transferContent}</span>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="admin-user-modal-actions">
                <button
                  className="ghost-button h-11 px-5"
                  onClick={closeQr}
                  type="button"
                >
                  Đóng
                </button>
                <button
                  className="primary-button h-11 px-5"
                  disabled={isQrLoading}
                  type="submit"
                >
                  {isQrLoading ? "Đang tạo..." : "Tạo QR"}
                </button>
              </div>
            </form>
          </section>
        </div>,
        document.body,
      ) : null}
    </main>
  );
}

function authHeaders(session: AuthResponse) {
  return {
    Authorization: `${session.tokenType} ${session.token}`,
  };
}

async function readResponseJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function normalizeBankDepositSettings(data: unknown): BankDepositSettings {
  const value =
    data && typeof data === "object"
      ? (data as Partial<BankDepositSettings>)
      : {};

  return {
    enabled:
      typeof value.enabled === "boolean" ? value.enabled : defaultSettings.enabled,
    prefix: typeof value.prefix === "string" ? value.prefix : defaultSettings.prefix,
    minAmount:
      typeof value.minAmount === "number"
        ? value.minAmount
        : defaultSettings.minAmount,
    maxAmount:
      typeof value.maxAmount === "number"
        ? value.maxAmount
        : defaultSettings.maxAmount,
    cronLink:
      typeof value.cronLink === "string" ? value.cronLink : defaultSettings.cronLink,
  };
}
