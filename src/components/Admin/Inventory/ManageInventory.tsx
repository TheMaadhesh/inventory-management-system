import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTheme, Breadcrumb, FilterButton } from "../../Admin/Navbar";
import { ConfirmDialog, Toast, useConfirm, useToast } from "../../shared/ConfirmDialog";

interface InventoryItem {
  itemId: number;
  name: string;
  itemCode: string;
  description: string;
  quantityInStock?: number;
  unitPrice?: number;
  reOrderLevel?: number;
  categoryDescription: string;
  supplierName: string;
}

interface CategoryOption { id: number; description: string; }
interface SupplierOption { supplierId: number; name: string; }

// ── Inline Edit Modal ────────────────────────────────────────────
const EditModal = ({
  item, onClose, onSaved, tokens, primary,
}: {
  item: InventoryItem; onClose: () => void;
  onSaved: (updated: InventoryItem) => void;
  tokens: Record<string, string>; primary: string;
}) => {
  const token = localStorage.getItem("token");
  const { confirmState: editConfirmState, confirm: editConfirm, handleConfirm: editHandleConfirm, handleCancel: editHandleCancel } = useConfirm();
  const [form, setForm] = useState({
    name: item.name, itemCode: item.itemCode, description: item.description,
    unit_price: item.unitPrice ?? 0, quantityInStock: item.quantityInStock ?? 0,
    reOrderLevel: item.reOrderLevel ?? 0, categoryId: "", supplierId: "",
  });
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    axios.get("http://localhost:8080/api/admin/category/fetchAll", { headers })
      .then(r => setCategories(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get("http://localhost:8080/api/admin/supplier/fetchAll", { headers })
      .then(r => setSuppliers(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const inp: React.CSSProperties = {
    background: tokens.cardHover, color: tokens.text, border: `1px solid ${tokens.border}`,
    borderRadius: 10, padding: "8px 12px", fontSize: "0.8rem", outline: "none", width: "100%",
  };
  const lbl: React.CSSProperties = {
    display: "block", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em",
    textTransform: "uppercase" as const, color: tokens.muted, marginBottom: 4,
  };

  const handleSave = async () => {
    const ok = await editConfirm({
      title: "Save Changes?",
      message: `Update "${form.name}"? All modifications will be saved to the inventory.`,
      confirmLabel: "Yes, Save",
      cancelLabel: "Cancel",
      icon: "✏️",
    });
    if (!ok) return;
    setSaving(true); setError("");
    try {
      const payload: Record<string, unknown> = {
        itemId: item.itemId, name: form.name, itemCode: form.itemCode,
        description: form.description, unit_price: Number(form.unit_price),
        quantityInStock: Number(form.quantityInStock), reOrderLevel: Number(form.reOrderLevel),
      };
      if (form.categoryId) payload.category = { categoryId: Number(form.categoryId) };
      if (form.supplierId) payload.supplier = { supplierId: Number(form.supplierId) };
      await axios.put(`http://localhost:8080/api/admin/item/update`, payload,
        { headers: { Authorization: `Bearer ${token}` } });
      onSaved({ ...item, name: form.name, itemCode: form.itemCode, description: form.description,
        unitPrice: Number(form.unit_price), quantityInStock: Number(form.quantityInStock),
        reOrderLevel: Number(form.reOrderLevel) });
    } catch (err: unknown) {
      if (axios.isAxiosError(err))
        setError(err.response?.data?.message || "Failed to update item. Please try again.");
      else setError("Server error — please try again");
    } finally { setSaving(false); }
  };

  return (
    <>
    <ConfirmDialog {...editConfirmState} onConfirm={editHandleConfirm} onCancel={editHandleCancel} tokens={tokens} primary={primary} />
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="rounded-2xl p-5 w-full max-w-md relative space-y-3 overflow-y-auto"
        style={{ background: tokens.card, border: `1px solid ${tokens.border}`, maxHeight: "90vh" }}
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full text-lg"
          style={{ background: tokens.cardHover, color: tokens.muted }}>×</button>
        <div>
          <h2 className="font-bold text-base pr-8" style={{ color: tokens.text }}>✏️ Edit Item</h2>
          <p className="text-xs" style={{ color: tokens.muted }}>ID #{item.itemId} · Update inventory item details</p>
        </div>
        {error && <p className="text-xs px-2 py-1.5 rounded-lg" style={{ background: "#fbd8d4", color: "#8a2a2a" }}>{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <div><label style={lbl}>Item Name</label>
            <input style={inp} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div><label style={lbl}>Item Code</label>
            <input style={inp} value={form.itemCode} onChange={e => setForm(p => ({ ...p, itemCode: e.target.value }))} />
          </div>
        </div>
        <div><label style={lbl}>Description</label>
          <input style={inp} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div><label style={lbl}>Unit Price ($)</label>
            <input style={inp} type="number" min="0" step="0.01" value={form.unit_price}
              onChange={e => setForm(p => ({ ...p, unit_price: Number(e.target.value) }))} />
          </div>
          <div><label style={lbl}>Qty In Stock</label>
            <input style={inp} type="number" min="0" value={form.quantityInStock}
              onChange={e => setForm(p => ({ ...p, quantityInStock: Number(e.target.value) }))} />
          </div>
          <div><label style={lbl}>Reorder Level</label>
            <input style={inp} type="number" min="0" value={form.reOrderLevel}
              onChange={e => setForm(p => ({ ...p, reOrderLevel: Number(e.target.value) }))} />
          </div>
        </div>
        {categories.length > 0 && (
          <div><label style={lbl}>Category (optional)</label>
            <select style={{ ...inp, appearance: "none" as const, cursor: "pointer" }}
              value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}>
              <option value="">— Keep current ({item.categoryDescription}) —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.description}</option>)}
            </select>
          </div>
        )}
        {suppliers.length > 0 && (
          <div><label style={lbl}>Supplier (optional)</label>
            <select style={{ ...inp, appearance: "none" as const, cursor: "pointer" }}
              value={form.supplierId} onChange={e => setForm(p => ({ ...p, supplierId: e.target.value }))}>
              <option value="">— Keep current ({item.supplierName}) —</option>
              {suppliers.map(s => <option key={s.supplierId} value={s.supplierId}>{s.name}</option>)}
            </select>
          </div>
        )}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm font-medium"
            style={{ background: tokens.cardHover, color: tokens.text, border: `1px solid ${tokens.border}` }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: primary }}>{saving ? "Saving…" : "Save Changes"}</button>
        </div>
      </div>
    </div>
    </>
  );
};

// ── Filter Panel ────────────────────────────────────────────────
const FilterPanel = ({ tokens, primary, categories, filterStatus, filterCategory, onStatusChange, onCategoryChange, onReset }: {
  tokens: Record<string, string>; primary: string; categories: string[];
  filterStatus: string; filterCategory: string;
  onStatusChange: (s: string) => void; onCategoryChange: (c: string) => void; onReset: () => void;
}) => (
  <div className="rounded-2xl p-4 space-y-3" style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}>
    <div className="flex items-center justify-between">
      <p className="text-sm font-semibold" style={{ color: tokens.text }}>Filters</p>
      <button onClick={onReset} className="text-xs underline underline-offset-2" style={{ color: tokens.muted }}>Reset All</button>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: tokens.muted }}>Status</label>
        <div className="flex gap-1.5 flex-wrap">
          {["All", "In Stock", "Low Stock", "Out of Stock"].map(s => (
            <button key={s} onClick={() => onStatusChange(s === "All" ? "" : s)}
              className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
              style={filterStatus === (s === "All" ? "" : s)
                ? { background: primary, color: "#fff" }
                : { background: tokens.cardHover, color: tokens.muted, border: `1px solid ${tokens.border}` }}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: tokens.muted }}>Category</label>
        <select className="w-full px-3 py-1.5 rounded-xl text-xs outline-none"
          style={{ background: tokens.cardHover, color: tokens.text, border: `1px solid ${tokens.border}` }}
          value={filterCategory} onChange={e => onCategoryChange(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
    </div>
  </div>
);

// ── Main Component ──────────────────────────────────────────────
const ManageInventory = () => {
  const { tokens, primary } = useTheme();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const token = localStorage.getItem("token");

  const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();
  const { toastState, showToast, hideToast } = useToast();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await axios.get<InventoryItem[]>(
          "http://localhost:8080/api/admin/item/fetchAll",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setItems(response.data || []);
      } catch { showToast("Failed to load inventory items", "error"); }
      finally { setLoading(false); }
    };
    fetchItems();
  }, [token]);

  const handleDelete = async (itemId: number, itemName: string) => {
    const confirmed = await confirm({
      title: "Delete Inventory Item",
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      confirmLabel: "Yes, Delete", cancelLabel: "Cancel", confirmColor: "#ef4444", icon: "🗑️",
    });
    if (!confirmed) return;
    try {
      await axios.delete(`
        http://localhost:8080/api/admin/item/deleteByid`,
        { headers: { Authorization: `Bearer ${token}` }, params: { id: itemId } });
      setItems(prev => prev.filter(i => i.itemId !== itemId));
      showToast(`"${itemName}" deleted successfully`, "success");
    } catch { showToast("Failed to delete item. Please try again.", "error"); }
  };

  const getStatus = (qty?: number, reorder?: number): "In Stock" | "Low Stock" | "Out of Stock" => {
    const q = qty ?? 0; const r = reorder ?? 0;
    if (q === 0) return "Out of Stock";
    if (q <= r) return "Low Stock";
    return "In Stock";
  };

  const statusStyle = (s: string): React.CSSProperties =>
    s === "In Stock"  ? { background: "#d4e8d4", color: "#2d6a2d" }
    : s === "Low Stock" ? { background: "#fbe8c8", color: "#8a5a1a" }
    : { background: "#fbd8d4", color: "#8a2a2a" };

  const allCategories = Array.from(new Set(items.map(i => i.categoryDescription).filter(Boolean)));
  const activeFilterCount = [filterStatus, filterCategory].filter(Boolean).length;

  const filtered = items.filter(i => {
    const status = getStatus(i.quantityInStock, i.reOrderLevel);
    const q = search.toLowerCase();
    const matchSearch = !q || i.name.toLowerCase().includes(q) ||
      i.categoryDescription.toLowerCase().includes(q) ||
      (i.itemCode || "").toLowerCase().includes(q);
    const matchStatus = !filterStatus || status === filterStatus;
    const matchCategory = !filterCategory || i.categoryDescription === filterCategory;
    return matchSearch && matchStatus && matchCategory;
  });

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">
      <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} tokens={tokens} primary={primary} />
      <Toast {...toastState} onClose={hideToast} />
      {editItem && (
        <EditModal item={editItem} tokens={tokens} primary={primary}
          onClose={() => setEditItem(null)}
          onSaved={updated => {
            setItems(prev => prev.map(i => i.itemId === updated.itemId ? updated : i));
            setEditItem(null);
            showToast(`"${updated.name}" updated successfully`, "success");
          }} />
      )}

      <Breadcrumb page="Manage Inventory" parent="Inventory" />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: tokens.text }}>Manage Inventory</h1>
          <p className="text-sm" style={{ color: tokens.muted }}>Edit or remove inventory items</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative">
            <FilterButton onClick={() => setFilterActive(f => !f)} active={filterActive} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                style={{ background: primary }}>{activeFilterCount}</span>
            )}
          </div>
          <input type="text" placeholder="Search name, code, category…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm outline-none flex-1 sm:w-52 sm:flex-none"
            style={{ background: tokens.card, color: tokens.text, border: `1px solid ${tokens.border}` }} />
        </div>
      </div>

      {filterActive && (
        <FilterPanel tokens={tokens} primary={primary} categories={allCategories}
          filterStatus={filterStatus} filterCategory={filterCategory}
          onStatusChange={setFilterStatus} onCategoryChange={setFilterCategory}
          onReset={() => { setFilterStatus(""); setFilterCategory(""); }} />
      )}

      {(filterStatus || filterCategory) && (
        <div className="flex gap-2 flex-wrap">
          {filterStatus && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1"
              style={{ background: primary + "22", color: primary, border: `1px solid ${primary}44` }}>
              Status: {filterStatus}
              <button onClick={() => setFilterStatus("")} className="ml-1 hover:opacity-70">×</button>
            </span>
          )}
          {filterCategory && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1"
              style={{ background: primary + "22", color: primary, border: `1px solid ${primary}44` }}>
              Category: {filterCategory}
              <button onClick={() => setFilterCategory("")} className="ml-1 hover:opacity-70">×</button>
            </span>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-sm" style={{ color: tokens.muted }}>Loading inventory...</div>
      ) : (
        <>
          {/* Mobile card view */}
          <div className="sm:hidden space-y-2">
            {filtered.length > 0 ? filtered.map(item => {
              const status = getStatus(item.quantityInStock, item.reOrderLevel);
              const qty = item.quantityInStock ?? 0;
              const reorder = item.reOrderLevel ?? 0;
              return (
                <div key={item.itemId} className="p-3 rounded-xl"
                  style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}>
                  {/* Row 1: name + status */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: tokens.text }}>{item.name}</p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: tokens.muted }}>
                        {item.categoryDescription} · <span className="font-mono">{item.itemCode}</span>
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
                      style={statusStyle(status)}>{status}</span>
                  </div>
                  {/* Row 2: qty / price / reorder */}
                  <div className="flex items-center gap-3 mb-2.5 flex-wrap">
                    <span className="text-xs" style={{ color: tokens.muted }}>
                      Qty: <span className="font-bold"
                        style={{ color: qty <= 0 ? "#ef4444" : qty <= reorder ? "#f59e0b" : tokens.text }}>
                        {qty}
                      </span>
                    </span>
                    <span className="text-xs" style={{ color: tokens.muted }}>
                      Price: <span className="font-semibold" style={{ color: tokens.text }}>
                        ${item.unitPrice?.toFixed(2) ?? "0.00"}
                      </span>
                    </span>
                    <span className="text-xs" style={{ color: tokens.muted }}>
                      Reorder: <span className="font-semibold" style={{ color: tokens.text }}>{reorder}</span>
                    </span>
                  </div>
                  {/* Row 3: supplier */}
                  {item.supplierName && (
                    <p className="text-xs mb-2" style={{ color: tokens.muted }}>
                      Supplier: <span style={{ color: tokens.text }}>{item.supplierName}</span>
                    </p>
                  )}
                  {/* Actions */}
                  <div className="flex gap-1.5">
                    <button className="px-3 py-1.5 rounded-lg text-xs font-medium flex-1"
                      onClick={() => setEditItem(item)}
                      style={{ background: "#dde4f0", color: "#3a4e7a" }}>✏️ Edit</button>
                    <button onClick={() => handleDelete(item.itemId, item.name)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium flex-1"
                      style={{ background: "#fbd8d4", color: "#8a2a2a" }}>🗑️ Delete</button>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8 text-sm" style={{ color: tokens.muted }}>No items match your filters.</div>
            )}
          </div>

          {/* Desktop table view */}
          <div className="hidden sm:block rounded-2xl overflow-hidden"
            style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${tokens.border}` }}>
                    {["ID", "Name", "Code", "Category", "Qty", "Price", "Status", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold tracking-wider uppercase"
                        style={{ color: tokens.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? filtered.map((item, i) => {
                    const status = getStatus(item.quantityInStock, item.reOrderLevel);
                    const qty = item.quantityInStock ?? 0;
                    return (
                      <tr key={item.itemId}
                        style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${tokens.border}` : "none" }}
                        onMouseEnter={e => (e.currentTarget.style.background = tokens.cardHover)}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <td className="px-4 py-3 text-xs" style={{ color: tokens.muted }}>#{item.itemId}</td>
                        <td className="px-4 py-3 font-medium" style={{ color: tokens.text }}>{item.name}</td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: tokens.muted }}>{item.itemCode}</td>
                        <td className="px-4 py-3" style={{ color: tokens.muted }}>{item.categoryDescription}</td>
                        <td className="px-4 py-3 font-semibold"
                          style={{ color: qty <= 0 ? "#ef4444" : qty <= (item.reOrderLevel ?? 0) ? "#f59e0b" : tokens.text }}>
                          {qty}
                        </td>
                        <td className="px-4 py-3" style={{ color: tokens.text }}>${item.unitPrice?.toFixed(2) ?? "0.00"}</td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={statusStyle(status)}>{status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <button className="px-2.5 py-1.5 rounded-lg text-xs font-medium"
                              onClick={() => setEditItem(item)}
                              style={{ background: "#dde4f0", color: "#3a4e7a" }}>✏️ Edit</button>
                            <button onClick={() => handleDelete(item.itemId, item.name)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-medium"
                              style={{ background: "#fbd8d4", color: "#8a2a2a" }}>🗑️ Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-sm" style={{ color: tokens.muted }}>
                        {search || filterStatus || filterCategory ? "No items match your filters." : "No items found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ManageInventory;
