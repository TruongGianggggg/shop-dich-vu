"use client";

import { Coins, Gem, Pencil, Plus, RefreshCw, Server, Trash2 } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { CollaboratorSidebar } from "@/app/components/collaborator-sidebar";
import { formatIntegerInput, normalizeIntegerInput } from "@/lib/integer-input";
import { CollaboratorCurrencyPolicy, CollaboratorCurrencyServer, GameServerCurrencyConfigPayload, formatVnd, getApiErrorMessage } from "@/lib/shop-api";

type Form = { name: string; goldEnabled: boolean; goldAmount: string; goldPrice: string; gemEnabled: boolean; gemAmount: string; gemPrice: string; displayOrder: string; toolServerIndex: string; active: boolean };
const empty: Form = { name: "", goldEnabled: true, goldAmount: "37000000", goldPrice: "10000", gemEnabled: false, gemAmount: "1000", gemPrice: "10000", displayOrder: "0", toolServerIndex: "1", active: true };

export function CollaboratorCurrencySettingsManager() {
  const [items, setItems] = useState<CollaboratorCurrencyServer[]>([]);
  const [form, setForm] = useState<Form>(empty);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [policy, setPolicy] = useState<CollaboratorCurrencyPolicy | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [serverResponse, policyResponse] = await Promise.all([
        fetch("/api/collaborators/currency-servers", { cache: "no-store" }),
        fetch("/api/collaborators/currency-policy", { cache: "no-store" }),
      ]);
      const [serverData, policyData] = await Promise.all([readJson(serverResponse), readJson(policyResponse)]);
      if (!serverResponse.ok) throw new Error(getApiErrorMessage(serverData, "Không tải được cấu hình server."));
      if (!policyResponse.ok) throw new Error(getApiErrorMessage(policyData, "Không tải được quyền bán Vàng/Ngọc."));
      const nextPolicy = policyData as CollaboratorCurrencyPolicy;
      setItems(serverData as CollaboratorCurrencyServer[]);
      setPolicy(nextPolicy);
      setForm((current) => editingId ? current : {
        ...current,
        goldEnabled: nextPolicy.goldSellingEnabled,
        gemEnabled: !nextPolicy.goldSellingEnabled && nextPolicy.gemSellingEnabled,
      });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không tải được cấu hình server."); }
    finally { setLoading(false); }
  }, [editingId]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  function edit(item: CollaboratorCurrencyServer) {
    setEditingId(item.id); setMessage(""); setError("");
    setForm({ name: item.name, goldEnabled: item.goldEnabled && !!policy?.goldSellingEnabled, goldAmount: String(item.goldAmount), goldPrice: String(item.goldPrice), gemEnabled: item.gemEnabled && !!policy?.gemSellingEnabled, gemAmount: String(item.gemAmount), gemPrice: String(item.gemPrice), displayOrder: String(item.displayOrder), toolServerIndex: String(item.toolServerIndex), active: item.active });
  }
  function reset() { setEditingId(""); setForm({ ...empty, goldEnabled: !!policy?.goldSellingEnabled, gemEnabled: !policy?.goldSellingEnabled && !!policy?.gemSellingEnabled, displayOrder: String(items.length), toolServerIndex: String(nextIndex(items)) }); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    if (!form.goldEnabled && !form.gemEnabled) { setError("Hãy bật ít nhất Vàng hoặc Ngọc."); return; }
    const payload: GameServerCurrencyConfigPayload = { name: form.name.trim(), goldEnabled: form.goldEnabled, goldAmount: form.goldEnabled ? Number(form.goldAmount) : 0, goldPrice: form.goldEnabled ? Number(form.goldPrice) : 0, gemEnabled: form.gemEnabled, gemAmount: form.gemEnabled ? Number(form.gemAmount) : 0, gemPrice: form.gemEnabled ? Number(form.gemPrice) : 0, displayOrder: Number(form.displayOrder), toolServerIndex: Number(form.toolServerIndex), active: form.active };
    setSaving(true);
    try {
      const url = editingId ? `/api/collaborators/currency-servers/${editingId}` : "/api/collaborators/currency-servers";
      const response = await fetch(url, { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await readJson(response);
      if (!response.ok) throw new Error(getApiErrorMessage(data, "Không lưu được server."));
      setMessage(`Đã lưu server ${(data as CollaboratorCurrencyServer).name}.`); reset(); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không lưu được server."); }
    finally { setSaving(false); }
  }

  async function remove(item: CollaboratorCurrencyServer) {
    if (!window.confirm(`Xóa server ${item.name}?`)) return;
    const response = await fetch(`/api/collaborators/currency-servers/${item.id}`, { method: "DELETE" });
    if (response.ok) { setMessage(`Đã xóa server ${item.name}.`); await load(); }
    else setError(getApiErrorMessage(await readJson(response), "Không xóa được server."));
  }

  return <main className="role-dashboard"><CollaboratorSidebar active="currency-settings" /><section className="role-main collaborator-role-main ctv-currency-main">
    <header className="role-topbar backoffice-users-header"><div><p className="section-kicker">KÊNH BÁN CỦA CTV</p><h1>Cấu hình Vàng &amp; Ngọc</h1><p className="role-subtitle">Mỗi server được gắn tự động với username CTV của bạn để bot nhận đúng đơn.</p><div className="ctv-currency-permissions"><span className={policy?.goldSellingEnabled ? "is-granted" : ""}>Vàng: {policy?.goldSellingEnabled ? `Được bán · CK ${policy.goldDiscountPercent}%` : "Chưa được cấp"}</span><span className={policy?.gemSellingEnabled ? "is-granted" : ""}>Ngọc: {policy?.gemSellingEnabled ? `Được bán · CK ${policy.gemDiscountPercent}%` : "Chưa được cấp"}</span></div></div><button className="ghost-button h-11 px-5" disabled={loading} onClick={() => void load()}><RefreshCw size={16} /> Tải lại</button></header>
    {message ? <p className="admin-users-message success">{message}</p> : null}{error ? <p className="admin-users-message error">{error}</p> : null}
    <div className="ctv-currency-layout"><section className="role-panel ctv-currency-form-card"><div className="role-panel-head"><div><p className="section-kicker">{editingId ? "CHỈNH SỬA" : "THÊM SERVER"}</p><h2>Thông tin mở bán</h2></div><Server size={22} /></div>
      <form className="ctv-currency-form" onSubmit={submit}><label className="field-label ctv-currency-wide">Tên hiển thị<input className="text-field" maxLength={120} placeholder="Ví dụ: Server 1 - CTV Giang" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <CurrencyFields permitted={!!policy?.goldSellingEnabled} type="gold" form={form} setForm={setForm} /><CurrencyFields permitted={!!policy?.gemSellingEnabled} type="gem" form={form} setForm={setForm} />
        <label className="field-label">Index server của tool<input className="text-field" min={1} max={21} required type="number" value={form.toolServerIndex} onChange={(e) => setForm({ ...form, toolServerIndex: e.target.value })} /><small>Từ 1 đến 21, đúng server trong game.</small></label>
        <label className="field-label">Thứ tự hiển thị<input className="text-field" inputMode="numeric" value={formatIntegerInput(form.displayOrder)} onChange={(e) => setForm({ ...form, displayOrder: normalizeIntegerInput(e.target.value) })} /></label>
        <label className="admin-check-field ctv-currency-wide"><input checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} type="checkbox" /> Đang mở bán cho khách</label>
        <div className="ctv-currency-form-actions">{editingId ? <button className="ghost-button h-11 px-4" onClick={reset} type="button">Hủy sửa</button> : null}<button className="primary-button h-11 px-5" disabled={saving} type="submit"><Plus size={16} /> {saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Thêm server"}</button></div>
      </form></section>
      <section className="role-panel ctv-currency-list"><div className="role-panel-head"><div><p className="section-kicker">SERVER CỦA TÔI</p><h2>{items.length} cấu hình</h2></div></div><div className="ctv-currency-cards">{items.map((item) => <article key={item.id}><header><span><Server size={17} /></span><div><strong>{item.name}</strong><small>Tool #{item.toolServerIndex} · {item.active ? "Đang mở" : "Đang tắt"}</small></div><button onClick={() => edit(item)}><Pencil size={15} /></button><button onClick={() => void remove(item)}><Trash2 size={15} /></button></header><div>{item.goldEnabled ? <p><Coins size={15} /><span>{item.goldAmount.toLocaleString("vi-VN")} vàng</span><strong>{formatVnd(item.goldPrice)}</strong></p> : null}{item.gemEnabled ? <p><Gem size={15} /><span>{item.gemAmount.toLocaleString("vi-VN")} ngọc</span><strong>{formatVnd(item.gemPrice)}</strong></p> : null}</div><footer>userctv: <strong>{item.collaboratorUsername}</strong></footer></article>)}{!loading && !items.length ? <p className="collaborator-service-empty">Bạn chưa cấu hình server nào.</p> : null}</div></section>
    </div></section></main>;
}

function CurrencyFields({ type, form, setForm, permitted }: { type: "gold" | "gem"; form: Form; setForm: (form: Form) => void; permitted: boolean }) {
  const gold = type === "gold", enabled = gold ? form.goldEnabled : form.gemEnabled, Icon = gold ? Coins : Gem;
  return <fieldset className={`ctv-currency-block ${type}`}><label><input checked={enabled} disabled={!permitted} onChange={(e) => setForm({ ...form, [gold ? "goldEnabled" : "gemEnabled"]: e.target.checked })} type="checkbox" /><Icon size={17} /> Bật bán {gold ? "Vàng" : "Ngọc"} {!permitted ? <small>Admin chưa cấp quyền</small> : null}</label><div><label className="field-label">Số lượng<input className="text-field" disabled={!enabled || !permitted} inputMode="numeric" required={enabled && permitted} value={formatIntegerInput(gold ? form.goldAmount : form.gemAmount)} onChange={(e) => setForm({ ...form, [gold ? "goldAmount" : "gemAmount"]: normalizeIntegerInput(e.target.value) })} /></label><label className="field-label">Giá bán<input className="text-field" disabled={!enabled || !permitted} inputMode="numeric" required={enabled && permitted} value={formatIntegerInput(gold ? form.goldPrice : form.gemPrice)} onChange={(e) => setForm({ ...form, [gold ? "goldPrice" : "gemPrice"]: normalizeIntegerInput(e.target.value) })} /></label></div></fieldset>;
}
function nextIndex(items: CollaboratorCurrencyServer[]) { const used = new Set(items.map((x) => x.toolServerIndex)); for (let i = 1; i <= 21; i++) if (!used.has(i)) return i; return 21; }
async function readJson(response: Response) { try { return await response.json() as unknown; } catch { return null; } }
