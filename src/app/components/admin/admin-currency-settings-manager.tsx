"use client";

import {
  Coins,
  Gem,
  ImageIcon,
  Pencil,
  Plus,
  RefreshCw,
  Server,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AdminSidebar } from "@/app/components/admin/admin-sidebar";
import { useAuthSession } from "@/app/components/use-auth-session";
import {
  formatIntegerInput,
  isNonNegativeIntegerInput,
  isPositiveIntegerInput,
  normalizeIntegerInput,
} from "@/lib/integer-input";
import {
  AuthResponse,
  GameCurrencyDisplaySettings,
  GameServerCurrencyConfig,
  GameServerCurrencyConfigPayload,
  formatVnd,
  getApiErrorMessage,
} from "@/lib/shop-api";

type ServerForm = {
  name: string;
  goldEnabled: boolean;
  goldAmount: string;
  goldPrice: string;
  gemEnabled: boolean;
  gemAmount: string;
  gemPrice: string;
  displayOrder: string;
  active: boolean;
};

const emptyForm: ServerForm = {
  name: "",
  goldEnabled: true,
  goldAmount: "1000000",
  goldPrice: "10000",
  gemEnabled: false,
  gemAmount: "0",
  gemPrice: "0",
  displayOrder: "0",
  active: true,
};

const emptyDisplaySettings: GameCurrencyDisplaySettings = {
  goldImageUrl: "",
  gemImageUrl: "",
};

export function AdminCurrencySettingsManager() {
  const session = useAuthSession();
  const [configs, setConfigs] = useState<GameServerCurrencyConfig[]>([]);
  const [displayForm, setDisplayForm] =
    useState<GameCurrencyDisplaySettings>(emptyDisplaySettings);
  const [form, setForm] = useState<ServerForm>(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDisplaySaving, setIsDisplaySaving] = useState(false);
  const [uploadingCurrency, setUploadingCurrency] = useState<"gold" | "gem" | "">("");
  const [updatingId, setUpdatingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!session) return;
    let ignore = false;

    async function loadConfigs(activeSession: AuthResponse) {
      setIsLoading(true);
      setError("");
      try {
        const [response, settingsResponse] = await Promise.all([
          fetch("/api/admin/currency-servers", { headers: authHeaders(activeSession) }),
          fetch("/api/admin/currency-settings", { headers: authHeaders(activeSession) }),
        ]);
        const data = await readResponseJson(response);
        const settingsData = await readResponseJson(settingsResponse);

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(data, "Không tải được cấu hình server."),
          );
        }
        if (!settingsResponse.ok) {
          throw new Error(
            getApiErrorMessage(settingsData, "Không tải được ảnh hiển thị."),
          );
        }
        if (!ignore) {
          setConfigs(data as GameServerCurrencyConfig[]);
          setDisplayForm(settingsData as GameCurrencyDisplaySettings);
        }
      } catch (exception) {
        if (!ignore) {
          setConfigs([]);
          setError(
            exception instanceof Error
              ? exception.message
              : "Không tải được cấu hình server.",
          );
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadConfigs(session);
    return () => {
      ignore = true;
    };
  }, [refreshKey, session]);

  const goldServers = useMemo(
    () => configs.filter((item) => item.goldEnabled),
    [configs],
  );
  const gemServers = useMemo(
    () => configs.filter((item) => item.gemEnabled),
    [configs],
  );
  function openCreate(currency: "gold" | "gem" = "gold") {
    setEditingId("");
    setForm({
      ...emptyForm,
      goldEnabled: currency === "gold",
      gemEnabled: currency === "gem",
      goldAmount: currency === "gold" ? emptyForm.goldAmount : "0",
      goldPrice: currency === "gold" ? emptyForm.goldPrice : "0",
      gemAmount: currency === "gem" ? "100" : "0",
      gemPrice: currency === "gem" ? "10000" : "0",
      displayOrder: String(configs.length),
    });
    setMessage("");
    setError("");
    setIsModalOpen(true);
  }

  async function uploadDisplayImage(currency: "gold" | "gem", file: File) {
    if (!session) return;
    const formData = new FormData();
    formData.append("file", file);
    setUploadingCurrency(currency);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/service-images", {
        method: "POST",
        headers: authHeaders(session),
        body: formData,
      });
      const data = await readResponseJson(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, "Không tải được ảnh lên."));
      }
      const imageUrl = (data as { imageUrl: string }).imageUrl;
      setDisplayForm((current) => ({
        ...current,
        [currency === "gold" ? "goldImageUrl" : "gemImageUrl"]: imageUrl,
      }));
      setMessage("Đã tải ảnh lên. Bấm “Lưu ảnh hiển thị” để áp dụng.");
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Không tải được ảnh lên.");
    } finally {
      setUploadingCurrency("");
    }
  }

  async function saveDisplaySettings() {
    if (!session) return;
    setIsDisplaySaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/currency-settings", {
        method: "PUT",
        headers: {
          ...authHeaders(session),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(displayForm),
      });
      const data = await readResponseJson(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, "Không lưu được ảnh hiển thị."));
      }
      setDisplayForm(data as GameCurrencyDisplaySettings);
      setMessage("Đã lưu ảnh hiển thị Nạp Vàng và Nạp Ngọc.");
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Không lưu được ảnh hiển thị.");
    } finally {
      setIsDisplaySaving(false);
    }
  }

  function openEdit(config: GameServerCurrencyConfig) {
    setEditingId(config.id);
    setForm({
      name: config.name,
      goldEnabled: config.goldEnabled,
      goldAmount: String(config.goldAmount),
      goldPrice: String(config.goldPrice),
      gemEnabled: config.gemEnabled,
      gemAmount: String(config.gemAmount),
      gemPrice: String(config.gemPrice),
      displayOrder: String(config.displayOrder),
      active: config.active,
    });
    setMessage("");
    setError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId("");
    setForm(emptyForm);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;

    if (!form.goldEnabled && !form.gemEnabled) {
      setError("Hãy bật ít nhất Vàng hoặc Ngọc cho server.");
      return;
    }

    if (
      (form.goldEnabled && (!isPositiveIntegerInput(form.goldAmount) || !isPositiveIntegerInput(form.goldPrice)))
      || (form.gemEnabled && (!isPositiveIntegerInput(form.gemAmount) || !isPositiveIntegerInput(form.gemPrice)))
      || !isNonNegativeIntegerInput(form.displayOrder)
    ) {
      setError("Số lượng, giá bán phải lớn hơn 0 và thứ tự hiển thị không được âm.");
      return;
    }

    const payload: GameServerCurrencyConfigPayload = {
      name: form.name.trim(),
      goldEnabled: form.goldEnabled,
      goldAmount: form.goldEnabled ? Number(form.goldAmount) : 0,
      goldPrice: form.goldEnabled ? Number(form.goldPrice) : 0,
      gemEnabled: form.gemEnabled,
      gemAmount: form.gemEnabled ? Number(form.gemAmount) : 0,
      gemPrice: form.gemEnabled ? Number(form.gemPrice) : 0,
      displayOrder: Number(form.displayOrder),
      active: form.active,
    };

    setIsSaving(true);
    setError("");
    try {
      const response = await fetch(
        editingId
          ? `/api/admin/currency-servers/${editingId}`
          : "/api/admin/currency-servers",
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            ...authHeaders(session),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      const data = await readResponseJson(response);

      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, "Không lưu được server."));
      }

      setMessage(`Đã lưu cấu hình server ${(data as GameServerCurrencyConfig).name}.`);
      closeModal();
      setRefreshKey((current) => current + 1);
    } catch (exception) {
      setError(
        exception instanceof Error ? exception.message : "Không lưu được server.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteConfig(config: GameServerCurrencyConfig) {
    if (!session) return;
    if (!window.confirm(`Xóa server ${config.name}?`)) return;

    setUpdatingId(config.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/currency-servers/${config.id}`, {
        method: "DELETE",
        headers: authHeaders(session),
      });
      if (!response.ok) {
        const data = await readResponseJson(response);
        throw new Error(getApiErrorMessage(data, "Không xóa được server."));
      }
      setConfigs((current) => current.filter((item) => item.id !== config.id));
      setMessage(`Đã xóa server ${config.name}.`);
    } catch (exception) {
      setError(
        exception instanceof Error ? exception.message : "Không xóa được server.",
      );
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <main className="role-dashboard">
      <AdminSidebar active="currency-settings" />
      <section className="role-main backoffice-users-main currency-settings-main">
        <header className="role-topbar backoffice-users-header">
          <div>
            <p className="section-kicker">Module độc lập</p>
            <h1>Cấu hình Vàng &amp; Ngọc theo server</h1>
            <p className="role-subtitle">
              Một server có thể đồng thời xuất hiện trong cả hai nhóm.
            </p>
          </div>
          <div className="role-topbar-actions">
            <button
              className="ghost-button h-11 px-5"
              disabled={isLoading}
              onClick={() => setRefreshKey((current) => current + 1)}
              type="button"
            >
              <RefreshCw size={16} /> Tải lại
            </button>
            <button
              className="primary-button h-11 px-5"
              onClick={() => openCreate()}
              type="button"
            >
              <Plus size={16} /> Thêm server
            </button>
          </div>
        </header>

        <section className="role-panel currency-images-panel">
          <div className="currency-images-head">
            <div>
              <p className="section-kicker">Ảnh ngoài trang chủ</p>
              <h2>Ảnh Nạp Vàng và Nạp Ngọc</h2>
              <span>Nên dùng ảnh ngang tỷ lệ khoảng 2:1 như mẫu bạn gửi.</span>
            </div>
            <button
              className="primary-button h-11 px-5"
              disabled={isDisplaySaving || Boolean(uploadingCurrency)}
              onClick={saveDisplaySettings}
              type="button"
            >
              {isDisplaySaving ? "Đang lưu..." : "Lưu ảnh hiển thị"}
            </button>
          </div>
          <div className="currency-image-grid">
            <CurrencyImageEditor
              currency="gold"
              imageUrl={displayForm.goldImageUrl}
              isUploading={uploadingCurrency === "gold"}
              onChange={(imageUrl) => setDisplayForm((current) => ({ ...current, goldImageUrl: imageUrl }))}
              onUpload={(file) => uploadDisplayImage("gold", file)}
            />
            <CurrencyImageEditor
              currency="gem"
              imageUrl={displayForm.gemImageUrl}
              isUploading={uploadingCurrency === "gem"}
              onChange={(imageUrl) => setDisplayForm((current) => ({ ...current, gemImageUrl: imageUrl }))}
              onUpload={(file) => uploadDisplayImage("gem", file)}
            />
          </div>
        </section>

        <section className="role-panel currency-service-picker">
          <div>
            <strong>Danh sách server Vàng &amp; Ngọc</strong>
            <span>{configs.length} server · {configs.filter((item) => item.active).length} đang hoạt động</span>
          </div>
          <p>Danh sách này hoạt động độc lập, không gắn với danh mục hay gói dịch vụ.</p>
        </section>

        {message ? <p className="admin-users-message success">{message}</p> : null}
        {error ? <p className="admin-users-message error">{error}</p> : null}

        <div className="currency-columns">
          <CurrencyPanel
            configs={goldServers}
            currency="gold"
            isLoading={isLoading}
            onAdd={() => openCreate("gold")}
            onDelete={deleteConfig}
            onEdit={openEdit}
            updatingId={updatingId}
          />
          <CurrencyPanel
            configs={gemServers}
            currency="gem"
            isLoading={isLoading}
            onAdd={() => openCreate("gem")}
            onDelete={deleteConfig}
            onEdit={openEdit}
            updatingId={updatingId}
          />
        </div>
      </section>

      {isModalOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="admin-user-modal" role="presentation">
              <button
                aria-label="Đóng form"
                className="admin-user-modal-backdrop"
                onClick={closeModal}
                type="button"
              />
              <section className="admin-user-modal-panel currency-modal" role="dialog" aria-modal="true">
                <div className="admin-user-modal-header">
                  <div>
                    <h2>{editingId ? "Sửa server" : "Thêm server"}</h2>
                    <p>Cấu hình Vàng và Ngọc của server này</p>
                  </div>
                  <button className="admin-user-modal-close" onClick={closeModal} type="button">
                    <X size={18} />
                  </button>
                </div>
                <form className="currency-form" onSubmit={submit}>
                  <div className="currency-form-body">
                    <label className="field-label currency-form-wide">
                      Tên server
                      <input
                        className="text-field"
                        maxLength={120}
                        onChange={(event) => setForm({ ...form, name: event.target.value })}
                        placeholder="Ví dụ: Server 1"
                        required
                        value={form.name}
                      />
                    </label>
                    <CurrencyFormBlock currency="gold" form={form} onChange={setForm} />
                    <CurrencyFormBlock currency="gem" form={form} onChange={setForm} />
                    <label className="field-label">
                      Thứ tự hiển thị
                      <input
                        className="text-field"
                        inputMode="numeric"
                        onChange={(event) => setForm({ ...form, displayOrder: normalizeIntegerInput(event.target.value) })}
                        required
                        type="text"
                        value={formatIntegerInput(form.displayOrder)}
                      />
                    </label>
                    <label className="admin-check-field currency-active-field">
                      <input
                        checked={form.active}
                        onChange={(event) => setForm({ ...form, active: event.target.checked })}
                        type="checkbox"
                      />
                      Server đang hoạt động
                    </label>
                  </div>
                  {error ? <p className="currency-modal-error">{error}</p> : null}
                  <div className="admin-user-modal-actions">
                    <button className="ghost-button h-11 px-5" onClick={closeModal} type="button">Hủy</button>
                    <button className="primary-button h-11 px-5" disabled={isSaving} type="submit">
                      {isSaving ? "Đang lưu..." : "Lưu cấu hình"}
                    </button>
                  </div>
                </form>
              </section>
            </div>,
            document.body,
          )
        : null}
    </main>
  );
}

function CurrencyImageEditor({
  currency,
  imageUrl,
  isUploading,
  onChange,
  onUpload,
}: {
  currency: "gold" | "gem";
  imageUrl: string;
  isUploading: boolean;
  onChange: (imageUrl: string) => void;
  onUpload: (file: File) => void;
}) {
  const isGold = currency === "gold";
  return (
    <article className={`currency-image-editor ${currency}`}>
      <div
        className={imageUrl ? "currency-image-preview has-image" : "currency-image-preview"}
        style={imageUrl ? { backgroundImage: `url(${JSON.stringify(imageUrl)})` } : undefined}
      >
        {!imageUrl ? <><ImageIcon size={30} /><span>Chưa có ảnh</span></> : null}
      </div>
      <div className="currency-image-editor-body">
        <div><strong>Ảnh Nạp {isGold ? "Vàng" : "Ngọc"}</strong><span>JPG, PNG hoặc WEBP · tối đa theo giới hạn hệ thống</span></div>
        <div className="currency-image-actions">
          <label className="ghost-button h-9 px-3">
            <Upload size={15} /> {isUploading ? "Đang tải..." : "Chọn ảnh"}
            <input
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={isUploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onUpload(file);
                event.target.value = "";
              }}
              type="file"
            />
          </label>
          {imageUrl ? <button className="danger-button h-9 px-3" onClick={() => onChange("")} type="button"><Trash2 size={15} /> Xóa ảnh</button> : null}
        </div>
      </div>
    </article>
  );
}

function CurrencyPanel({
  configs,
  currency,
  isLoading,
  updatingId,
  onAdd,
  onEdit,
  onDelete,
}: {
  configs: GameServerCurrencyConfig[];
  currency: "gold" | "gem";
  isLoading: boolean;
  updatingId: string;
  onAdd: () => void;
  onEdit: (config: GameServerCurrencyConfig) => void;
  onDelete: (config: GameServerCurrencyConfig) => void;
}) {
  const isGold = currency === "gold";
  const Icon = isGold ? Coins : Gem;
  return (
    <section className={`role-panel currency-panel ${currency}`}>
      <div className="currency-panel-head">
        <div className="currency-title">
          <span><Icon size={20} /></span>
          <div><p>CẤU HÌNH</p><h2>{isGold ? "Vàng" : "Ngọc"}</h2></div>
        </div>
        <button className="ghost-button h-9 px-3" onClick={onAdd} type="button">
          <Plus size={15} /> Thêm server
        </button>
      </div>
      <div className="currency-server-list">
        {configs.map((config) => {
          const amount = isGold ? config.goldAmount : config.gemAmount;
          const price = isGold ? config.goldPrice : config.gemPrice;
          return (
            <article className="currency-server-card" key={config.id}>
              <div className="currency-server-name">
                <span><Server size={17} /></span>
                <div>
                  <strong>{config.name}</strong>
                  <small>{config.active ? "Đang hoạt động" : "Đang tắt"}</small>
                </div>
              </div>
              <div className="currency-rate">
                <span>Số lượng</span><strong>{amount.toLocaleString("vi-VN")}</strong>
              </div>
              <div className="currency-rate">
                <span>Giá bán</span><strong>{formatVnd(price)}</strong>
              </div>
              <div className="currency-card-actions">
                <button aria-label={`Sửa ${config.name}`} onClick={() => onEdit(config)} type="button"><Pencil size={15} /></button>
                <button aria-label={`Xóa ${config.name}`} disabled={updatingId === config.id} onClick={() => onDelete(config)} type="button"><Trash2 size={15} /></button>
              </div>
            </article>
          );
        })}
        {!isLoading && configs.length === 0 ? (
          <div className="currency-empty"><Icon size={28} /><strong>Chưa có server cho {isGold ? "Vàng" : "Ngọc"}</strong><span>Bấm “Thêm server” để bắt đầu cấu hình.</span></div>
        ) : null}
        {isLoading ? <div className="currency-empty"><RefreshCw className="spin" size={24} /><span>Đang tải cấu hình...</span></div> : null}
      </div>
    </section>
  );
}

function CurrencyFormBlock({
  currency,
  form,
  onChange,
}: {
  currency: "gold" | "gem";
  form: ServerForm;
  onChange: (form: ServerForm) => void;
}) {
  const isGold = currency === "gold";
  const enabledKey = isGold ? "goldEnabled" : "gemEnabled";
  const amountKey = isGold ? "goldAmount" : "gemAmount";
  const priceKey = isGold ? "goldPrice" : "gemPrice";
  const enabled = form[enabledKey];
  return (
    <fieldset className={`currency-form-block ${currency}`}>
      <label className="currency-enable">
        <input checked={enabled} onChange={(event) => onChange({ ...form, [enabledKey]: event.target.checked })} type="checkbox" />
        <span>{isGold ? <Coins size={18} /> : <Gem size={18} />} Bật {isGold ? "Vàng" : "Ngọc"}</span>
      </label>
      <div>
        <label className="field-label">
          Số lượng quy đổi
          <input className="text-field" disabled={!enabled} inputMode="numeric" onChange={(event) => onChange({ ...form, [amountKey]: normalizeIntegerInput(event.target.value) })} required={enabled} type="text" value={formatIntegerInput(form[amountKey])} />
        </label>
        <label className="field-label">
          Giá bán (VNĐ)
          <input className="text-field" disabled={!enabled} inputMode="numeric" onChange={(event) => onChange({ ...form, [priceKey]: normalizeIntegerInput(event.target.value) })} required={enabled} type="text" value={formatIntegerInput(form[priceKey])} />
        </label>
      </div>
    </fieldset>
  );
}

function authHeaders(session: AuthResponse) {
  return { Authorization: `Bearer ${session.token}` };
}

async function readResponseJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text) as unknown; } catch { return { message: text }; }
}
