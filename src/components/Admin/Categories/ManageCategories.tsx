import { useEffect, useState } from "react";
import { useTheme, Breadcrumb, FilterButton } from "../../Admin/Navbar";
import axios from "axios";
import { ConfirmDialog, Toast, useConfirm, useToast } from "../../shared/ConfirmDialog";

interface Category {
  id: number;
  name: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
}

interface ApiCategoryResponse {
  id: number;
  name?: string;
  description: string;
  status: "ACTIVE" | "INACTIVE" | null;
}

const ManageCategories = () => {
  const { tokens, primary, fontFamily } = useTheme();
  const token = localStorage.getItem("token") || "";

  const [categories, setCategories]       = useState<Category[]>([]);
  const [loading, setLoading]             = useState(false);
  const [catSearch, setCatSearch]         = useState("");
  const [catStatusFilter, setCatStatusFilter] = useState("");
  const [showFilter, setShowFilter]       = useState(false);

  /* ── Add Category modal state ── */
  const [showAddModal, setShowAddModal]   = useState(false);
  const [addForm, setAddForm]             = useState({ name: "", description: "" });
  const [addLoading, setAddLoading]       = useState(false);
  const [addError, setAddError]           = useState("");

  const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();
  const { toastState, showToast, hideToast } = useToast();

  const filteredCats = categories.filter(c => {
    const q = catSearch.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
    const matchStatus = !catStatusFilter || c.status === catStatusFilter;
    return matchSearch && matchStatus;
  });

  const flattenCategories = (apiData: ApiCategoryResponse[]): Category[] =>
    apiData.filter(cat => cat.id != null).map(cat => ({
      id: cat.id,
      name: cat.name || `Category ${cat.id}`,
      description: cat.description || "",
      status: cat.status || "ACTIVE",
    }));

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get<ApiCategoryResponse[]>(
        "http://localhost:8080/api/admin/category/fetchAll",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCategories(flattenCategories(res.data));
    } catch {
      showToast("Failed to load categories", "error");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, [token]);

  /* ── Add Category submit ── */
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) { setAddError("Category name is required."); return; }
    setAddError("");
    setAddLoading(true);
    try {
      await axios.post(
        "http://localhost:8080/api/admin/category/save",
        { name: addForm.name.trim(), description: addForm.description.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(`Category "${addForm.name}" added successfully!`, "success");
      setAddForm({ name: "", description: "" });
      setShowAddModal(false);
      await fetchCategories();
    } catch {
      setAddError("Failed to add category. Please try again.");
    } finally { setAddLoading(false); }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setAddForm({ name: "", description: "" });
    setAddError("");
  };

  /* ── Delete ── */
  const deleteByID = async (id: number, name: string) => {
    const confirmed = await confirm({
      title: "Delete Category",
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmLabel: "Yes, Delete",
      cancelLabel: "Cancel",
      confirmColor: "#ef4444",
      icon: "🗑️",
    });
    if (!confirmed) return;
    try {
      await axios.delete("http://localhost:8080/api/admin/category/delete", {
        headers: { Authorization: `Bearer ${token}` },
        params: { id },
      });
      showToast(`"${name}" deleted successfully`, "success");
      await fetchCategories();
    } catch {
      showToast("Failed to delete category", "error");
    }
  };

  /* ── Toggle status ── */
  const toggleStatus = async (id: number, currentStatus: "ACTIVE" | "INACTIVE", name: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const confirmed = await confirm({
      title: `${newStatus === "ACTIVE" ? "Activate" : "Deactivate"} Category`,
      message: `Set "${name}" status to ${newStatus}?`,
      confirmLabel: "Yes, Update",
      cancelLabel: "Cancel",
      confirmColor: newStatus === "ACTIVE" ? "#22c55e" : "#f59e0b",
      icon: newStatus === "ACTIVE" ? "✅" : "⏸️",
    });
    if (!confirmed) return;
    try {
      await axios.put(
        "http://localhost:8080/api/admin/category/update/status",
        {},
        { headers: { Authorization: `Bearer ${token}` }, params: { id, status: newStatus } }
      );
      showToast(`Category status updated to ${newStatus}`, "success");
      await fetchCategories();
    } catch {
      showToast("Failed to update category status", "error");
    }
  };

  if (loading) return (
    <div className="text-center py-8 text-sm" style={{ color: tokens.muted, fontFamily }}>
      Loading categories…
    </div>
  );

  /* ── Shared input style ── */
  const inp = {
    background: tokens.bg,
    color: tokens.text,
    border: `1.5px solid ${tokens.border}`,
    borderRadius: 12,
    padding: "10px 14px",
    fontSize: 14,
    outline: "none",
    width: "100%",
    fontFamily,
    boxSizing: "border-box" as const,
    transition: "border-color 0.2s",
  };
  const lbl = {
    display: "block",
    fontSize: "0.68rem",
    fontWeight: 700,
    letterSpacing: "0.09em",
    textTransform: "uppercase" as const,
    color: tokens.muted,
    marginBottom: 6,
    fontFamily,
  };

  return (
    <div className="p-4 space-y-5" style={{ fontFamily }}>
      <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} tokens={tokens} primary={primary} />
      <Toast {...toastState} onClose={hideToast} />

      {/* ── Add Category Modal ── */}
      {showAddModal && (
        <>
          {/* Backdrop */}
          <div
            onClick={closeModal}
            style={{
              position: "fixed", inset: 0, zIndex: 50,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(4px)",
            }}
          />
          {/* Modal */}
          <div
            style={{
              position: "fixed", zIndex: 51,
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: "100%", maxWidth: 460,
              background: tokens.card,
              border: `1px solid ${tokens.border}`,
              borderRadius: 20,
              padding: "28px 28px 24px",
              boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
              fontFamily,
            }}
          >
            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: tokens.text, margin: 0, fontFamily }}>
                  Add Category
                </h2>
                <p style={{ fontSize: 12, color: tokens.muted, margin: "4px 0 0", fontFamily }}>
                  Fill in the details below to create a new category.
                </p>
              </div>
              <button
                onClick={closeModal}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: `1px solid ${tokens.border}`,
                  background: tokens.cardHover, color: tokens.muted, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontFamily, flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: tokens.border, marginBottom: 20 }} />

            {/* Form */}
            <form onSubmit={handleAddSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={lbl}>Category Name <span style={{ color: "#ef4444" }}>*</span></label>
                <input
                  style={inp}
                  placeholder="e.g. Electronics"
                  value={addForm.name}
                  onChange={e => { setAddForm(f => ({ ...f, name: e.target.value })); setAddError(""); }}
                  onFocus={e => (e.currentTarget.style.borderColor = primary)}
                  onBlur={e => (e.currentTarget.style.borderColor = tokens.border)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label style={lbl}>Description</label>
                <textarea
                  style={{ ...inp, resize: "none", minHeight: 88, lineHeight: 1.5 }}
                  placeholder="Optional — describe this category"
                  value={addForm.description}
                  onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
                  onFocus={e => (e.currentTarget.style.borderColor = primary)}
                  onBlur={e => (e.currentTarget.style.borderColor = tokens.border)}
                  rows={3}
                />
              </div>

              {addError && (
                <p style={{ fontSize: 12, color: "#ef4444", margin: 0, fontFamily }}>⚠ {addError}</p>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    padding: "9px 20px", borderRadius: 12, border: `1px solid ${tokens.border}`,
                    background: tokens.cardHover, color: tokens.sub,
                    fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  style={{
                    padding: "9px 22px", borderRadius: 12, border: "none",
                    background: addLoading ? `${primary}80` : primary,
                    color: "#fff", fontSize: 13, fontWeight: 700,
                    cursor: addLoading ? "not-allowed" : "pointer",
                    fontFamily, display: "flex", alignItems: "center", gap: 7,
                    boxShadow: `0 4px 14px ${primary}35`,
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={e => !addLoading && (e.currentTarget.style.opacity = "0.88")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                >
                  {addLoading ? (
                    <>
                      <svg style={{ width: 14, height: 14, animation: "spin 0.8s linear infinite" }} viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Saving…
                    </>
                  ) : (
                    <>+ Add Category</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* ── Page header ── */}
      <Breadcrumb page="Manage Categories" parent="Categories" />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: tokens.text, fontFamily }}>Manage Categories</h1>
          <p className="text-sm" style={{ color: tokens.muted, fontFamily }}>Organize your product categories</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <FilterButton onClick={() => setShowFilter(f => !f)} active={showFilter} />
          <input
            type="text" placeholder="Search categories…" value={catSearch}
            onChange={e => setCatSearch(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: tokens.card, color: tokens.text, border: `1px solid ${tokens.border}`, minWidth: 160, fontFamily }}
          />
          <button
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: primary, fontFamily, boxShadow: `0 3px 10px ${primary}35` }}
            onClick={() => setShowAddModal(true)}
          >
            + Add Category
          </button>
        </div>
      </div>

      {/* ── Filter panel ── */}
      {showFilter && (
        <div className="rounded-2xl p-4 space-y-3" style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: tokens.text, fontFamily }}>Filter by Status</p>
            <button onClick={() => setCatStatusFilter("")} className="text-xs underline" style={{ color: tokens.muted, fontFamily }}>Reset</button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {["All", "ACTIVE", "INACTIVE"].map(s => (
              <button key={s} onClick={() => setCatStatusFilter(s === "All" ? "" : s)}
                className="px-3 py-1.5 rounded-full text-xs font-medium"
                style={catStatusFilter === (s === "All" ? "" : s)
                  ? { background: primary, color: "#fff", fontFamily }
                  : { background: tokens.cardHover, color: tokens.muted, border: `1px solid ${tokens.border}`, fontFamily }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total",    value: categories.length },
          { label: "Active",   value: categories.filter(c => c.status === "ACTIVE").length },
          { label: "Inactive", value: categories.filter(c => c.status === "INACTIVE").length },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl text-center" style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}>
            <p className="text-2xl font-bold" style={{ color: tokens.text, fontFamily }}>{s.value}</p>
            <p className="text-xs" style={{ color: tokens.muted, fontFamily }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl overflow-x-auto" style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}>
        <table className="w-full text-sm min-w-[500px]" style={{ fontFamily }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${tokens.border}` }}>
              {["Name", "Description", "Status", "Actions"].map(h => (
                <th key={h} className="p-3 text-left font-semibold text-xs uppercase tracking-wider" style={{ color: tokens.muted, fontFamily }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredCats.map(cat => (
              <tr key={cat.id} style={{ borderBottom: `1px solid ${tokens.border}` }}>
                <td className="p-3 font-medium" style={{ color: tokens.text, fontFamily }}>{cat.name}</td>
                <td className="p-3" style={{ color: tokens.muted, fontFamily }}>{cat.description || "—"}</td>
                <td className="p-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={cat.status === "ACTIVE"
                      ? { background: "#d4e8d4", color: "#2d6a2d" }
                      : { background: "#fbd8d4", color: "#8a2a2a" }}>
                    {cat.status}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => toggleStatus(cat.id, cat.status, cat.name)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:brightness-95 active:scale-[0.97]"
                      style={{ background: "#dde4f0", color: "#3a4e7a", fontFamily }}>
                      Toggle
                    </button>
                    <button onClick={() => deleteByID(cat.id, cat.name)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:brightness-95 active:scale-[0.97]"
                      style={{ background: "#fbd8d4", color: "#8a2a2a", fontFamily }}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredCats.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center p-8" style={{ color: tokens.muted, fontFamily }}>
                  {catSearch || catStatusFilter ? "No categories match your search." : "No categories found. Click \"+ Add Category\" to create one."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ManageCategories;
