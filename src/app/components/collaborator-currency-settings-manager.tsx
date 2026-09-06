"use client";

import { Coins, Gem, Pencil, Plus, RefreshCw, Server, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CollaboratorSidebar } from "@/app/components/collaborator-sidebar";
import { formatIntegerInput, isNonNegativeIntegerInput, isPositiveIntegerInput, normalizeIntegerInput } from "@/lib/integer-input";
import { CollaboratorCurrencyPolicy, CollaboratorCurrencyServer, GameServerCurrencyConfigPayload, formatVnd, getApiErrorMessage } from "@/lib/shop-api";

type ServerForm = { name: string; goldEnabled: boolean; goldAmount: string; goldPrice: string; gemEnabled: boolean; gemAmount: string; gemPrice: string; displayOrder: string; toolServerIndex: string; active: boolean };
const emptyForm: ServerForm = { name: "", goldEnabled: true, goldAmount: "37000000", goldPrice: "10000", gemEnabled: false, gemAmount: "100", gemPrice: "10000", displayOrder: "0", toolServerIndex: "1", active: true };

export function CollaboratorCurrencySettingsManager() {
  const [configs, setConfigs] = useState<CollaboratorCurrencyServer[]>([]);
  const [policy, setPolicy] = useState<CollaboratorCurrencyPolicy | null>(null);
  const [form, setForm] = useState<ServerForm>(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function loadConfigs() {
      setIsLoading(true); setError("");
      try {
        const [serverResponse, policyResponse] = await Promise.all([
          fetch("/api/collaborators/currency-servers", { cache: "no-store" }),
          fetch("/api/collaborators/currency-policy", { cache: "no-store" }),
        ]);
        const [serverData, policyData] = await Promise.all([readResponseJson(serverResponse), readResponseJson(policyResponse)]);
        if (!serverResponse.ok) throw new Error(getApiErrorMessage(serverData, "Không tải được cấu hình server."));
        if (!policyResponse.ok) throw new Error(getApiErrorMessage(policyData, "Không tải được quyền bán Vàng/Ngọc."));
        if (!ignore) { setConfigs(serverData as CollaboratorCurrencyServer[]); setPolicy(policyData as CollaboratorCurrencyPolicy); }
      } catch (exception) {
        if (!ignore) { setConfigs([]); setError(exception instanceof Error ? exception.message : "Không tải được cấu hình server."); }
      } finally { if (!ignore) setIsLoading(false); }
    }
    void loadConfigs();
    return () => { ignore = true; };
  }, [refreshKey]);

  const goldServers = useMemo(() => configs.filter((item) => item.goldEnabled), [configs]);
  const gemServers = useMemo(() => configs.filter((item) => item.gemEnabled), [configs]);

  function openCreate(requested: "gold" | "gem" = "gold") {
    const fallback = requested === "gold" ? "gem" : "gold";
    const currency = canSell(requested, policy) ? requested : canSell(fallback, policy) ? fallback : null;
    if (!currency) { setError("Admin chưa cấp quyền bán Vàng hoặc Ngọc cho tài khoản của bạn."); return; }
    setEditingId("");
    setForm({ ...emptyForm, goldEnabled: currency === "gold", gemEnabled: currency === "gem", displayOrder: String(configs.length), toolServerIndex: String(nextAvailableToolIndex(configs)) });
    setMessage(""); setError(""); setIsModalOpen(true);
  }

  function openEdit(config: CollaboratorCurrencyServer) {
    setEditingId(config.id);
    setForm({ name: config.name, goldEnabled: config.goldEnabled && !!policy?.goldSellingEnabled, goldAmount: String(config.goldAmount), goldPrice: String(config.goldPrice), gemEnabled: config.gemEnabled && !!policy?.gemSellingEnabled, gemAmount: String(config.gemAmount), gemPrice: String(config.gemPrice), displayOrder: String(config.displayOrder), toolServerIndex: String(config.toolServerIndex), active: config.active });
    setMessage(""); setError(""); setIsModalOpen(true);
  }

  function closeModal() { setIsModalOpen(false); setEditingId(""); setForm(emptyForm); setError(""); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.goldEnabled && !form.gemEnabled) { setError("Hãy bật ít nhất Vàng hoặc Ngọc cho server."); return; }
    if ((form.goldEnabled && !policy?.goldSellingEnabled) || (form.gemEnabled && !policy?.gemSellingEnabled)) { setError("Bạn đang bật loại tiền chưa được admin cấp quyền bán."); return; }
    if ((form.goldEnabled && (!isPositiveIntegerInput(form.goldAmount) || !isPositiveIntegerInput(form.goldPrice))) || (form.gemEnabled && (!isPositiveIntegerInput(form.gemAmount) || !isPositiveIntegerInput(form.gemPrice))) || !isNonNegativeIntegerInput(form.displayOrder) || !isPositiveIntegerInput(form.toolServerIndex) || Number(form.toolServerIndex) > 21) {
      setError("Số lượng và giá bán phải lớn hơn 0; index tool phải từ 1 đến 21."); return;
    }
    const payload: GameServerCurrencyConfigPayload = { name: form.name.trim(), goldEnabled: form.goldEnabled, goldAmount: form.goldEnabled ? Number(form.goldAmount) : 0, goldPrice: form.goldEnabled ? Number(form.goldPrice) : 0, gemEnabled: form.gemEnabled, gemAmount: form.gemEnabled ? Number(form.gemAmount) : 0, gemPrice: form.gemEnabled ? Number(form.gemPrice) : 0, displayOrder: Number(form.displayOrder), toolServerIndex: Number(form.toolServerIndex), active: form.active };
    setIsSaving(true); setError("");
    try {
      const response = await fetch(editingId ? `/api/collaborators/currency-servers/${editingId}` : "/api/collaborators/currency-servers", { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await readResponseJson(response);
      if (!response.ok) throw new Error(getApiErrorMessage(data, "Không lưu được server."));
      setMessage(`Đã lưu cấu hình server ${(data as CollaboratorCurrencyServer).name}.`); closeModal(); setRefreshKey((current) => current + 1);
    } catch (exception) { setError(exception instanceof Error ? exception.message : "Không lưu được server."); }
    finally { setIsSaving(false); }
  }

  async function deleteConfig(config: CollaboratorCurrencyServer) {
    if (!window.confirm(`Xóa server ${config.name}?`)) return;
    setUpdatingId(config.id); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/collaborators/currency-servers/${config.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(getApiErrorMessage(await readResponseJson(response), "Không xóa được server."));
      setConfigs((current) => current.filter((item) => item.id !== config.id)); setMessage(`Đã xóa server ${config.name}.`);
    } catch (exception) { setError(exception instanceof Error ? exception.message : "Không xóa được server."); }
    finally { setUpdatingId(""); }
  }

  return <main className="role-dashboard">
    <CollaboratorSidebar active="currency-settings" />
    <section className="role-main backoffice-users-main currency-settings-main ctv-currency-main">
      <header className="role-topbar backoffice-users-header"><div><p className="section-kicker">KÊNH BÁN CỦA CTV</p><h1>Cấu hình Vàng &amp; Ngọc theo server</h1><p className="role-subtitle">Bố cục quản lý giống Admin · userctv được gắn tự động theo tài khoản của bạn.</p></div><div className="role-topbar-actions"><button className="ghost-button h-11 px-5" disabled={isLoading} onClick={() => setRefreshKey((current) => current + 1)} type="button"><RefreshCw size={16} /> Tải lại</button><button className="primary-button h-11 px-5" disabled={!policy?.goldSellingEnabled && !policy?.gemSellingEnabled} onClick={() => openCreate()} type="button"><Plus size={16} /> Thêm server</button></div></header>
      <section className="role-panel currency-service-picker ctv-currency-policy-summary"><div><strong>Phạm vi được Admin cấp</strong><span>userctv: {policy?.collaboratorUsername ?? "Đang tải..."} · {configs.filter((item) => item.active).length}/{configs.length} server đang hoạt động</span></div><div className="ctv-currency-permissions"><span className={policy?.goldSellingEnabled ? "is-granted" : ""}>Vàng: {policy?.goldSellingEnabled ? `Được bán · CK ${policy.goldDiscountPercent}%` : "Chưa được cấp"}</span><span className={policy?.gemSellingEnabled ? "is-granted" : ""}>Ngọc: {policy?.gemSellingEnabled ? `Được bán · CK ${policy.gemDiscountPercent}%` : "Chưa được cấp"}</span></div></section>
      {message ? <p className="admin-users-message success">{message}</p> : null}{error && !isModalOpen ? <p className="admin-users-message error">{error}</p> : null}
      <div className="currency-columns"><CurrencyPanel configs={goldServers} currency="gold" discount={policy?.goldDiscountPercent ?? 0} isLoading={isLoading} onAdd={() => openCreate("gold")} onDelete={deleteConfig} onEdit={openEdit} permitted={!!policy?.goldSellingEnabled} updatingId={updatingId} /><CurrencyPanel configs={gemServers} currency="gem" discount={policy?.gemDiscountPercent ?? 0} isLoading={isLoading} onAdd={() => openCreate("gem")} onDelete={deleteConfig} onEdit={openEdit} permitted={!!policy?.gemSellingEnabled} updatingId={updatingId} /></div>
    </section>
    {isModalOpen && typeof document !== "undefined" ? createPortal(<div className="admin-user-modal" role="presentation"><button aria-label="Đóng form" className="admin-user-modal-backdrop" onClick={closeModal} type="button" /><section aria-modal="true" className="admin-user-modal-panel currency-modal" role="dialog"><div className="admin-user-modal-header"><div><h2>{editingId ? "Sửa server" : "Thêm server"}</h2><p>Cấu hình Vàng và Ngọc của server này</p></div><button aria-label="Đóng" className="admin-user-modal-close" onClick={closeModal} type="button"><X size={18} /></button></div><form className="currency-form" onSubmit={submit}><div className="currency-form-body"><label className="field-label currency-form-wide">Tên server<input className="text-field" maxLength={120} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ví dụ: Server 1" required value={form.name} /></label><CurrencyFormBlock currency="gold" form={form} onChange={setForm} permitted={!!policy?.goldSellingEnabled} /><CurrencyFormBlock currency="gem" form={form} onChange={setForm} permitted={!!policy?.gemSellingEnabled} /><label className="field-label">Thứ tự hiển thị<input className="text-field" inputMode="numeric" onChange={(event) => setForm({ ...form, displayOrder: normalizeIntegerInput(event.target.value) })} required type="text" value={formatIntegerInput(form.displayOrder)} /></label><label className="field-label">Index server dành cho tool<input className="text-field" inputMode="numeric" max="21" min="1" onChange={(event) => setForm({ ...form, toolServerIndex: normalizeIntegerInput(event.target.value) })} required type="number" value={form.toolServerIndex} /><small>Giá trị từ 1 đến 21, đúng với server trong game.</small></label><label className="admin-check-field currency-active-field"><input checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} type="checkbox" /> Server đang hoạt động</label></div>{error ? <p className="currency-modal-error">{error}</p> : null}<div className="admin-user-modal-actions"><button className="ghost-button h-11 px-5" onClick={closeModal} type="button">Hủy</button><button className="primary-button h-11 px-5" disabled={isSaving} type="submit">{isSaving ? "Đang lưu..." : "Lưu cấu hình"}</button></div></form></section></div>, document.body) : null}
  </main>;
}

function CurrencyPanel({ configs, currency, discount, isLoading, permitted, updatingId, onAdd, onEdit, onDelete }: { configs: CollaboratorCurrencyServer[]; currency: "gold" | "gem"; discount: number; isLoading: boolean; permitted: boolean; updatingId: string; onAdd: () => void; onEdit: (config: CollaboratorCurrencyServer) => void; onDelete: (config: CollaboratorCurrencyServer) => void }) {
  const isGold = currency === "gold"; const Icon = isGold ? Coins : Gem;
  return <section className={`role-panel currency-panel ${currency}`}><div className="currency-panel-head"><div className="currency-title"><span><Icon size={20} /></span><div><p>CẤU HÌNH</p><h2>{isGold ? "Vàng" : "Ngọc"}</h2><small>{permitted ? `Được bán · Chiết khấu ${discount}%` : "Admin chưa cấp quyền"}</small></div></div><button className="ghost-button h-9 px-3" disabled={!permitted} onClick={onAdd} type="button"><Plus size={15} /> Thêm server</button></div><div className="currency-server-list">{configs.map((config) => { const amount = isGold ? config.goldAmount : config.gemAmount; const price = isGold ? config.goldPrice : config.gemPrice; return <article className="currency-server-card" key={config.id}><div className="currency-server-name"><span><Server size={17} /></span><div><strong>{config.name}</strong><small>{config.active ? "Đang hoạt động" : "Đang tắt"} · Tool #{config.toolServerIndex}</small></div></div><div className="currency-rate"><span>Số lượng</span><strong>{amount.toLocaleString("vi-VN")}</strong></div><div className="currency-rate"><span>Giá bán</span><strong>{formatVnd(price)}</strong></div><div className="currency-card-actions"><button aria-label={`Sửa ${config.name}`} onClick={() => onEdit(config)} type="button"><Pencil size={15} /></button><button aria-label={`Xóa ${config.name}`} disabled={updatingId === config.id} onClick={() => onDelete(config)} type="button"><Trash2 size={15} /></button></div></article>; })}{!isLoading && configs.length === 0 ? <div className="currency-empty"><Icon size={28} /><strong>{permitted ? `Chưa có server cho ${isGold ? "Vàng" : "Ngọc"}` : `Chưa được cấp quyền bán ${isGold ? "Vàng" : "Ngọc"}`}</strong><span>{permitted ? "Bấm “Thêm server” để bắt đầu cấu hình." : "Admin cấp quyền tại màn Quản lý Users."}</span></div> : null}{isLoading ? <div className="currency-empty"><RefreshCw className="spin" size={24} /><span>Đang tải cấu hình...</span></div> : null}</div></section>;
}

function CurrencyFormBlock({ currency, form, onChange, permitted }: { currency: "gold" | "gem"; form: ServerForm; onChange: (form: ServerForm) => void; permitted: boolean }) {
  const isGold = currency === "gold"; const enabledKey = isGold ? "goldEnabled" : "gemEnabled"; const amountKey = isGold ? "goldAmount" : "gemAmount"; const priceKey = isGold ? "goldPrice" : "gemPrice"; const enabled = form[enabledKey];
  return <fieldset className={`currency-form-block ${currency}`}><label className="currency-enable"><input checked={enabled} disabled={!permitted} onChange={(event) => onChange({ ...form, [enabledKey]: event.target.checked })} type="checkbox" /><span>{isGold ? <Coins size={18} /> : <Gem size={18} />} Bật {isGold ? "Vàng" : "Ngọc"}</span>{!permitted ? <small>Admin chưa cấp quyền</small> : null}</label><div><label className="field-label">Số lượng quy đổi<input className="text-field" disabled={!enabled || !permitted} inputMode="numeric" onChange={(event) => onChange({ ...form, [amountKey]: normalizeIntegerInput(event.target.value) })} required={enabled && permitted} type="text" value={formatIntegerInput(form[amountKey])} /></label><label className="field-label">Giá bán (VNĐ)<input className="text-field" disabled={!enabled || !permitted} inputMode="numeric" onChange={(event) => onChange({ ...form, [priceKey]: normalizeIntegerInput(event.target.value) })} required={enabled && permitted} type="text" value={formatIntegerInput(form[priceKey])} /></label></div></fieldset>;
}

function canSell(currency: "gold" | "gem", policy: CollaboratorCurrencyPolicy | null) { return currency === "gold" ? !!policy?.goldSellingEnabled : !!policy?.gemSellingEnabled; }
function nextAvailableToolIndex(configs: CollaboratorCurrencyServer[]) { const used = new Set(configs.map((config) => config.toolServerIndex)); for (let index = 1; index <= 21; index += 1) if (!used.has(index)) return index; return 21; }
async function readResponseJson(response: Response) { const text = await response.text(); if (!text) return null; try { return JSON.parse(text) as unknown; } catch { return { message: text }; } }
