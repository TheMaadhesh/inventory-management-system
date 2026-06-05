import { useEffect, useState } from "react";
import axios from "axios";
import { useTheme, Breadcrumb } from "../../Admin/Navbar";
import {
  ConfirmDialog,
  Toast,
  useConfirm,
  useToast,
} from "../../shared/ConfirmDialog";

// ── Exact field names from Supplier.java entity ──────────────────
interface Supplier {
  supplierId: number;
  name: string;
  email: string;
  phoneNo: number; // long in Java — send as number
  address: string;
  contactPerson: string; // camelCase — matches Java getter getContactPerson()
  createdAt?: string;
}

interface FormState {
  name: string;
  email: string;
  phoneNo: string; // string in form, convert to number on submit
  address: string;
  contactPerson: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  phoneNo: "",
  address: "",
  contactPerson: "",
};

// Realistic example suppliers — fields match entity exactly
const EXAMPLE_SUPPLIERS: Omit<Supplier, "supplierId" | "createdAt">[] = [
  {
    name: "TechParts India Pvt Ltd",
    email: "sales@techpartsindia.com",
    phoneNo: 9840011223,
    address: "14, Industrial Estate, Ambattur, Chennai 600058",
    contactPerson: "Rajesh Kumar",
  },
  {
    name: "GlobalElec Distributors",
    email: "orders@globalelec.in",
    phoneNo: 4423456789,
    address: "78, Anna Salai, Teynampet, Chennai 600018",
    contactPerson: "Priya Nair",
  },
  {
    name: "Bharat Supply Chain Co.",
    email: "info@bharatsupply.com",
    phoneNo: 9876543210,
    address: "Plot 22, SIPCOT, Hosur, Tamil Nadu 635126",
    contactPerson: "Suresh Babu",
  },
  {
    name: "SunTech Components Ltd",
    email: "contact@suntechcomp.com",
    phoneNo: 8067801234,
    address: "No 5, Whitefield Industrial Park, Bengaluru 560066",
    contactPerson: "Anitha Rajan",
  },
  {
    name: "Prime Logistics & Supplies",
    email: "prime@primelogistics.in",
    phoneNo: 2245678901,
    address: "302, Dharavi Industrial Zone, Mumbai 400017",
    contactPerson: "Mohammed Irfan",
  },
];

const BASE = "/api/admin";

const ManageSuppliers = () => {
  const { tokens, primary } = useTheme();
  const token = localStorage.getItem("token") || "";
  const headers = { Authorization: `Bearer ${token}` };

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Supplier | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();
  const { toastState, showToast, hideToast } = useToast();

  // ── Fetch all suppliers
  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await axios.get<Supplier[]>(
        `http://localhost:8080/api/admin/supplier/fetchAll`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSuppliers(Array.isArray(res.data) ? res.data : []);
    } catch {
      setSuppliers([]);
      showToast("Failed to load suppliers", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // ── Seed example data
  const seedExamples = async () => {
    setSeeding(true);
    let seeded = 0;
    for (const s of EXAMPLE_SUPPLIERS) {
      try {
        await axios.post(
          `http://localhost:8080/api/admin/supplier/service/save`,
          s,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        seeded++;
      } catch {
        /* skip failed seeds */
      }
    }
    setSeeding(false);
    if (seeded > 0) {
      showToast(`${seeded} example suppliers added!`, "success");
      await fetchSuppliers();
    } else {
      showToast("Could not seed suppliers — check backend is running", "error");
    }
  };

  // ── Save (add / edit) ──────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast("Supplier name is required", "error");
      return;
    }
    if (!form.phoneNo || isNaN(Number(form.phoneNo))) {
      showToast("Phone number must be numeric", "error");
      return;
    }

    const ok = await confirm({
      title: editTarget ? "Update Supplier?" : "Add Supplier?",
      message: editTarget
        ? `Save changes to "${form.name}"? The supplier record will be updated.`
        : `Add "${form.name}" as a new supplier? They will be available in inventory records.`,
      confirmLabel: editTarget ? "Yes, Update" : "Yes, Add",
      cancelLabel: "Cancel",
      icon: editTarget ? "✏️" : "🏭",
    });
    if (!ok) return;

    setSaving(true);

    const payload = {
      supplierId: editTarget?.supplierId,
      name: form.name.trim(),
      email: form.email.trim(),
      phoneNo: String(form.phoneNo),
      address: form.address.trim(),
      contactPerson: form.contactPerson.trim(),
      ...(editTarget ? { supplierId: editTarget.supplierId } : {}),
    };

    try {
      if (editTarget) {
        await axios.put(
          `http://localhost:8080/api/admin/supplier/update`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        showToast("Supplier updated successfully", "success");
      } else {
        await axios.post(
          `http://localhost:8080/api/admin/supplier/service/save`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        showToast("Supplier added successfully", "success");
      }
      setShowForm(false);
      setEditTarget(null);
      setForm({ ...EMPTY_FORM });
      await fetchSuppliers();
    } catch (err) {
      if (axios.isAxiosError(err))
        showToast(
          err.response?.data?.message || "Failed to save supplier",
          "error",
        );
      else showToast("Server error", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────
  const handleDelete = async (id: number, name: string) => {
    const ok = await confirm({
      title: "Delete Supplier",
      message: `Delete "${name}"? This cannot be undone.`,
      confirmLabel: "Yes, Delete",
      cancelLabel: "Cancel",
      confirmColor: "#ef4444",
      icon: "🗑️",
    });
    if (!ok) return;
    try {
      await axios.delete(
        `http://localhost:8080/api/admin/supplier/delete?id=${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setSuppliers((prev) => prev.filter((s) => s.supplierId !== id));
      showToast(`"${name}" deleted`, "success");
    } catch {
      showToast("Failed to delete supplier", "error");
    }
  };

  const openAdd = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  };
  const openEdit = (s: Supplier) => {
    setEditTarget(s);
    setForm({
      name: s.name,
      email: s.email,
      phoneNo: String(s.phoneNo),
      address: s.address,
      contactPerson: s.contactPerson,
    });
    setShowForm(true);
  };

  const filtered = suppliers.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.contactPerson?.toLowerCase().includes(search.toLowerCase()),
  );

  const inp = {
    background: tokens.cardHover,
    color: tokens.text,
    border: `1px solid ${tokens.border}`,
    borderRadius: 10,
    padding: "9px 14px",
    fontSize: "inherit",
    outline: "none",
    width: "100%",
    fontFamily: "inherit",
  } as React.CSSProperties;
  const lbl = {
    display: "block",
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: tokens.muted,
    marginBottom: 5,
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">
      <ConfirmDialog
        {...confirmState}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        tokens={tokens}
        primary={primary}
      />
      <Toast {...toastState} onClose={hideToast} />

      <Breadcrumb page="Manage Suppliers" parent="Suppliers" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: tokens.text }}>
            Manage Suppliers
          </h1>
          <p className="text-sm" style={{ color: tokens.muted }}>
            Add and manage your product suppliers
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {suppliers.length === 0 && !loading && (
            <button
              onClick={seedExamples}
              disabled={seeding}
              className="px-4 py-2 rounded-xl text-sm font-medium border transition-all hover:brightness-95 disabled:opacity-50"
              style={{
                background: tokens.card,
                color: tokens.text,
                border: `1px solid ${tokens.border}`,
              }}
            >
              {seeding ? "Adding…" : "✨ Load Example Data"}
            </button>
          )}
          <button
            onClick={openAdd}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: primary }}
          >
            + Add Supplier
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: suppliers.length, color: primary },
          {
            label: "With Email",
            value: suppliers.filter((s) => s.email).length,
            color: "#22c55e",
          },
          {
            label: "With Phone",
            value: suppliers.filter((s) => s.phoneNo).length,
            color: "#f59e0b",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="p-3 sm:p-4 rounded-xl"
            style={{
              background: tokens.card,
              border: `1px solid ${tokens.border}`,
            }}
          >
            <p
              className="text-xl sm:text-2xl font-bold"
              style={{ color: s.color }}
            >
              {s.value}
            </p>
            <p className="text-xs mt-0.5" style={{ color: tokens.muted }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name, email or contact person…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full sm:max-w-sm px-4 py-2.5 rounded-xl text-sm outline-none"
        style={{
          background: tokens.card,
          color: tokens.text,
          border: `1px solid ${tokens.border}`,
        }}
      />

      {/* Add / Edit form */}
      {showForm && (
        <div
          className="rounded-2xl p-5 sm:p-6 space-y-4"
          style={{
            background: tokens.card,
            border: `1.5px solid ${primary}40`,
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base" style={{ color: tokens.text }}>
              {editTarget ? "Edit Supplier" : "Add New Supplier"}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setEditTarget(null);
              }}
              className="text-2xl leading-none hover:opacity-60"
              style={{ color: tokens.muted }}
            >
              ×
            </button>
          </div>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label style={lbl}>Supplier Name *</label>
                <input
                  style={inp}
                  required
                  value={form.name}
                  placeholder="e.g. TechParts India Pvt Ltd"
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>
              <div>
                <label style={lbl}>Contact Person</label>
                <input
                  style={inp}
                  value={form.contactPerson}
                  placeholder="e.g. Rajesh Kumar"
                  onChange={(e) =>
                    setForm((p) => ({ ...p, contactPerson: e.target.value }))
                  }
                />
              </div>
              <div>
                <label style={lbl}>Email</label>
                <input
                  style={inp}
                  type="email"
                  value={form.email}
                  placeholder="e.g. sales@supplier.com"
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>
              <div>
                <label style={lbl}>Phone Number (digits only)</label>
                <input
                  style={inp}
                  type="number"
                  value={form.phoneNo}
                  placeholder="e.g. 9840011223"
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phoneNo: e.target.value }))
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label style={lbl}>Address</label>
                <input
                  style={inp}
                  value={form.address}
                  placeholder="e.g. 14, Industrial Estate, Chennai 600058"
                  onChange={(e) =>
                    setForm((p) => ({ ...p, address: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditTarget(null);
                }}
                className="px-5 py-2 rounded-xl text-sm font-semibold"
                style={{
                  background: tokens.cardHover,
                  color: tokens.text,
                  border: `1px solid ${tokens.border}`,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: primary }}
              >
                {saving
                  ? "Saving…"
                  : editTarget
                    ? "Update Supplier"
                    : "Add Supplier"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div
          className="text-center py-12 text-sm"
          style={{ color: tokens.muted }}
        >
          Loading suppliers…
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {filtered.length > 0 ? (
              filtered.map((s) => (
                <div
                  key={s.supplierId}
                  className="p-4 rounded-xl"
                  style={{
                    background: tokens.card,
                    border: `1px solid ${tokens.border}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background: `${primary}20`, color: primary }}
                      >
                        {s.name?.[0] ?? "?"}
                      </div>
                      <div>
                        <p
                          className="font-semibold text-sm"
                          style={{ color: tokens.text }}
                        >
                          {s.name}
                        </p>
                        <p className="text-xs" style={{ color: tokens.muted }}>
                          {s.contactPerson}
                        </p>
                      </div>
                    </div>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: `${primary}15`, color: primary }}
                    >
                      #{s.supplierId}
                    </span>
                  </div>
                  <div
                    className="mt-3 space-y-1 text-xs"
                    style={{ color: tokens.muted }}
                  >
                    <p>📧 {s.email || "—"}</p>
                    <p>📞 {s.phoneNo || "—"}</p>
                    <p>📍 {s.address || "—"}</p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => openEdit(s)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-medium"
                      style={{ background: "#dde4f0", color: "#3a4e7a" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(s.supplierId, s.name)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-medium"
                      style={{ background: "#fbd8d4", color: "#8a2a2a" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div
                className="text-center py-12 rounded-xl"
                style={{
                  background: tokens.card,
                  border: `1px solid ${tokens.border}`,
                }}
              >
                <div className="text-4xl mb-3">🏭</div>
                <p
                  className="font-semibold text-sm"
                  style={{ color: tokens.text }}
                >
                  No suppliers yet
                </p>
                <p
                  className="text-xs mt-1 mb-4"
                  style={{ color: tokens.muted }}
                >
                  {search
                    ? "Try clearing your search"
                    : 'Click "Load Example Data" to add sample suppliers'}
                </p>
                {!search && (
                  <button
                    onClick={openAdd}
                    className="px-5 py-2 rounded-xl text-sm font-semibold text-white"
                    style={{ background: primary }}
                  >
                    + Add First Supplier
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Desktop table */}
          <div
            className="hidden sm:block rounded-2xl overflow-hidden"
            style={{
              background: tokens.card,
              border: `1px solid ${tokens.border}`,
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${tokens.border}` }}>
                    {[
                      "ID",
                      "Supplier Name",
                      "Contact Person",
                      "Email",
                      "Phone",
                      "Address",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                        style={{ color: tokens.muted }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? (
                    filtered.map((s, i) => (
                      <tr
                        key={s.supplierId}
                        style={{
                          borderBottom:
                            i < filtered.length - 1
                              ? `1px solid ${tokens.border}`
                              : "none",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = tokens.cardHover)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <td className="px-4 py-3">
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{
                              background: `${primary}15`,
                              color: primary,
                            }}
                          >
                            #{s.supplierId}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{
                                background: `${primary}20`,
                                color: primary,
                              }}
                            >
                              {s.name?.[0] ?? "?"}
                            </div>
                            <span
                              className="font-medium"
                              style={{ color: tokens.text }}
                            >
                              {s.name}
                            </span>
                          </div>
                        </td>
                        <td
                          className="px-4 py-3"
                          style={{ color: tokens.text }}
                        >
                          {s.contactPerson || "—"}
                        </td>
                        <td
                          className="px-4 py-3"
                          style={{ color: tokens.muted }}
                        >
                          {s.email || "—"}
                        </td>
                        <td
                          className="px-4 py-3"
                          style={{ color: tokens.muted }}
                        >
                          {s.phoneNo || "—"}
                        </td>
                        <td
                          className="px-4 py-3 max-w-[200px] truncate"
                          style={{ color: tokens.muted }}
                          title={s.address}
                        >
                          {s.address || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => openEdit(s)}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium hover:brightness-95"
                              style={{
                                background: "#dde4f0",
                                color: "#3a4e7a",
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(s.supplierId, s.name)}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium hover:brightness-95"
                              style={{
                                background: "#fbd8d4",
                                color: "#8a2a2a",
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-14 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="text-4xl">🏭</div>
                          <p
                            className="font-semibold"
                            style={{ color: tokens.text }}
                          >
                            No suppliers found
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: tokens.muted }}
                          >
                            {search
                              ? "Try clearing your search"
                              : "Add suppliers or use the example data button"}
                          </p>
                          {!search && (
                            <button
                              onClick={seedExamples}
                              disabled={seeding}
                              className="mt-1 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                              style={{ background: primary }}
                            >
                              {seeding
                                ? "Adding…"
                                : "✨ Load Example Suppliers"}
                            </button>
                          )}
                        </div>
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

export default ManageSuppliers;
