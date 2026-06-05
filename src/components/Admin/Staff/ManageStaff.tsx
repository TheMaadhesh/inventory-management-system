import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTheme, Breadcrumb } from "../../Admin/Navbar";
import {
  ConfirmDialog,
  Toast,
  useConfirm,
  useToast,
} from "../../shared/ConfirmDialog";

interface Staff {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  gender: string;
  role: string;
  emailVerified: boolean;
  path: string;
}

const roleColor: Record<string, React.CSSProperties> = {
  ADMIN: { background: "#dde4f0", color: "#3a4e7a" },
  STAFF: { background: "#e8e2d8", color: "#7a6e60" },
  MANAGER: { background: "#fbe8c8", color: "#8a5a1a" },
};

// Add Staff Modal
const AddStaffModal = ({
  tokens,
  primary,
  onClose,
  onAdded,
}: {
  tokens: Record<string, string>;
  primary: string;
  onClose: () => void;
  onAdded: () => void;
}) => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    gender: "",
    password: "",
    role: "STAFF",
    emailVerified: true,
    path: "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();

  const {
    confirmState: addConfirmState,
    confirm: addConfirm,
    handleConfirm: addHandleConfirm,
    handleCancel: addHandleCancel,
  } = useConfirm();

  const inp: React.CSSProperties = {
    background: tokens.cardHover,
    color: tokens.text,
    border: `1px solid ${tokens.border}`,
    borderRadius: 10,
    padding: "8px 12px",
    fontSize: "0.8rem",
    outline: "none",
    width: "100%",
  };
  const lbl: React.CSSProperties = {
    display: "block",
    fontSize: "0.65rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: tokens.muted,
    marginBottom: 4,
  };
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split(".").pop(); // jpg/png
    const baseName = file.name.split(".")[0]; // original name

    const date = new Date().toISOString().slice(0, 19).replace(/[-T:]/g, "");

    const fileName = `${baseName}_${date}.${extension}`;

    // create renamed file
    const renamedFile = new File([file], fileName, { type: file.type });

    setAvatarFile(renamedFile);

    // save filename in path
    setForm((prev) => ({
      ...prev,
      path: fileName,
    }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  const handleSave = async () => {
    if (!form.firstName || !form.email || !form.password) {
      setError("First name, email and password are required.");
      return;
    }

    const ok = await confirm({
      title: "Add Staff Member?",
      message: `Create account for "${form.firstName} ${form.lastName}"?`,
      confirmLabel: "Yes, Add Staff",
      cancelLabel: "Cancel",
      icon: "👤",
    });

    if (!ok) return;

    setSaving(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append("firstName", form.firstName);
      formData.append("lastName", form.lastName);
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("mobile", form.mobile);
      formData.append("gender", form.gender);
      formData.append("role", form.role);
      formData.append("emailVerified", form.emailVerified ? "1" : "0");

      if (avatarFile) {
        formData.append("image", avatarFile);
        formData.append("path", form.path);
      }

      await axios.post("http://localhost:8080/api/auth/register", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });

      onAdded();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to add staff.");
      } else {
        setError("Server error.");
      }
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <ConfirmDialog
        {...confirmState}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        tokens={tokens}
        primary={primary}
      />

      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.6)" }}
        onClick={onClose}
      >
        <div
          className="rounded-2xl p-5 w-full max-w-md relative space-y-3 overflow-y-auto"
          style={{
            background: tokens.card,
            border: `1px solid ${tokens.border}`,
            maxHeight: "90vh",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full text-lg"
            style={{ background: tokens.cardHover, color: tokens.muted }}
          >
            ×
          </button>

          <h2 className="font-bold text-base" style={{ color: tokens.text }}>
            ➕ Add Staff Member
          </h2>

          {error && (
            <p
              className="text-xs px-2 py-1.5 rounded-lg"
              style={{ background: "#fbd8d4", color: "#8a2a2a" }}
            >
              {error}
            </p>
          )}

          {/* Profile Photo */}
          <div className="flex flex-col items-center gap-2">
            {/* Avatar preview */}
            <div className="relative group cursor-pointer" onClick={() => (document.getElementById("staffAvatarInput") as HTMLInputElement)?.click()}>
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  className="w-20 h-20 rounded-full object-cover border-2"
                  style={{ borderColor: primary }}
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold"
                  style={{ background: `${primary}20`, color: primary }}
                >
                  ?
                </div>
              )}
              {/* hover overlay */}
              <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "rgba(0,0,0,0.45)" }}>
                <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>Change</span>
              </div>
            </div>

            {/* Hidden real file input */}
            <input
              id="staffAvatarInput"
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleAvatarChange}
              style={{ display: "none" }}
            />

            {/* Styled choose-file button */}
            <button
              type="button"
              onClick={() => (document.getElementById("staffAvatarInput") as HTMLInputElement)?.click()}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 10,
                background: `${primary}15`,
                color: primary,
                border: `1.5px solid ${primary}35`,
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = `${primary}28`)}
              onMouseLeave={e => (e.currentTarget.style.background = `${primary}15`)}
            >
              📁 Choose Photo
            </button>

            {/* Filename display */}
            {avatarFile && (
              <p style={{ fontSize: 11, color: tokens.muted, maxWidth: 200, textAlign: "center", wordBreak: "break-all" }}>
                {avatarFile.name}
              </p>
            )}
            {!avatarFile && (
              <p style={{ fontSize: 11, color: tokens.muted }}>JPG / PNG · Max 5 MB</p>
            )}
          </div>

          {/* First + Last Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={lbl}>First Name *</label>
              <input
                style={inp}
                value={form.firstName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, firstName: e.target.value }))
                }
              />
            </div>

            <div>
              <label style={lbl}>Last Name</label>
              <input
                style={inp}
                value={form.lastName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, lastName: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={lbl}>Email *</label>
            <input
              type="email"
              style={inp}
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
            />
          </div>

          {/* Password */}
          <div>
            <label style={lbl}>Password *</label>
            <input
              type="password"
              style={inp}
              value={form.password}
              onChange={(e) =>
                setForm((p) => ({ ...p, password: e.target.value }))
              }
            />
          </div>

          {/* Mobile + Gender */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={lbl}>Mobile</label>
              <input
                style={inp}
                value={form.mobile}
                onChange={(e) =>
                  setForm((p) => ({ ...p, mobile: e.target.value }))
                }
              />
            </div>

            <div>
              <label style={lbl}>Gender</label>
              <select
                style={inp}
                value={form.gender}
                onChange={(e) =>
                  setForm((p) => ({ ...p, gender: e.target.value }))
                }
              >
                <option value="" style={{ background: tokens.cardHover, color: tokens.muted }}>Select…</option>
                <option value="Male" style={{ background: tokens.cardHover, color: tokens.text }}>Male</option>
                <option value="Female" style={{ background: tokens.cardHover, color: tokens.text }}>Female</option>
                <option value="Other" style={{ background: tokens.cardHover, color: tokens.text }}>Other</option>
              </select>
            </div>
            <select
              style={inp}
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            >
              <option value="" style={{ background: tokens.cardHover, color: tokens.muted }}>Select Role</option>
              <option value="STAFF" style={{ background: tokens.cardHover, color: tokens.text }}>Staff</option>
              <option value="ADMIN" style={{ background: tokens.cardHover, color: tokens.text }}>Admin</option>
            </select>
            <select
              style={inp}
              value={form.emailVerified ? "1" : "0"}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  emailVerified: e.target.value === "1",
                }))
              }
            >
              <option value="1" style={{ background: tokens.cardHover, color: tokens.text }}>Verified</option>
              <option value="0" style={{ background: tokens.cardHover, color: tokens.text }}>Not Verified</option>
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-xl text-sm font-medium"
              style={{
                background: tokens.cardHover,
                color: tokens.text,
                border: `1px solid ${tokens.border}`,
              }}
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: primary }}
            >
              {saving ? "Adding…" : "Add Staff"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// View/Edit Staff Modal
const ViewStaffModal = ({
  staff,
  tokens,
  primary,
  onClose,
  onDeleted,
}: {
  staff: Staff;
  tokens: Record<string, string>;
  primary: string;
  onClose: () => void;
  onDeleted: (id: number) => void;
}) => {
  const avatar =
    localStorage.getItem(`profileAvatar_${staff.email.toLowerCase()}`) || "";
  const initials =
    `${staff.firstName[0] || ""}${staff.lastName[0] || ""}`.toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl p-5 w-full max-w-sm relative space-y-4"
        style={{
          background: tokens.card,
          border: `1px solid ${tokens.border}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full text-lg"
          style={{ background: tokens.cardHover, color: tokens.muted }}
        >
          ×
        </button>
        <div className="flex flex-col items-center gap-3 pt-2">
          {avatar ? (
            <img
              src={avatar}
              alt={initials}
              className="w-16 h-16 rounded-full object-cover border-2"
              style={{ borderColor: primary }}
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
              style={{ background: `${primary}22`, color: primary }}
            >
              {initials}
            </div>
          )}
          <div className="text-center">
            <p className="font-bold text-base" style={{ color: tokens.text }}>
              {staff.firstName} {staff.lastName}
            </p>
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-medium"
              style={
                roleColor[staff.role] || {
                  background: tokens.cardHover,
                  color: tokens.muted,
                }
              }
            >
              {staff.role}
            </span>
          </div>
        </div>
        <div
          className="space-y-2 rounded-xl p-3"
          style={{ background: tokens.cardHover }}
        >
          {[
            { label: "Email", value: staff.email },
            { label: "Mobile", value: staff.mobile || "—" },
            { label: "Gender", value: staff.gender || "—" },
            {
              label: "Email Verified",
              value: staff.emailVerified ? "✅ Yes" : "❌ No",
            },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-xs">
              <span style={{ color: tokens.muted }}>{label}</span>
              <span className="font-medium" style={{ color: tokens.text }}>
                {value}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full py-2 rounded-xl text-sm font-medium"
          style={{ background: primary, color: "#fff" }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

// Main Component
const ManageStaff = () => {
  const { tokens, primary } = useTheme();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterVerified, setFilterVerified] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewStaff, setViewStaff] = useState<Staff | null>(null);
  const token = localStorage.getItem("token");

  const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();
  const { toastState, showToast, hideToast } = useToast();

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await axios.get<Staff[]>(
        "http://localhost:8080/api/admin/users/fetchAll",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setStaffList(
        Array.isArray(res.data)
          ? res.data.filter((u: Staff) => u.role === "STAFF")
          : [],
      );
    } catch {
      // Fallback: try users endpoint
      try {
        const res2 = await axios.get<Staff[]>(
          "http://localhost:8080/api/admin/users",
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setStaffList(
          Array.isArray(res2.data)
            ? res2.data.filter((u: Staff) => u.role === "STAFF")
            : [],
        );
      } catch {
        showToast("Could not load staff list from backend.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [token]);

  const handleDelete = async (id: number, name: string) => {
    const confirmed = await confirm({
      title: "Remove Staff Member",
      message: `Are you sure you want to remove "${name}" from the system? This cannot be undone.`,
      confirmLabel: "Yes, Remove",
      cancelLabel: "Cancel",
      confirmColor: "#ef4444",
      icon: "🗑️",
    });
    if (!confirmed) return;
    try {
      await axios.delete(`http://localhost:8080/api/admin/users/delete`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { id },
      });
      setStaffList((prev) => prev.filter((s) => s.id !== id));
      showToast(`"${name}" removed successfully`, "success");
    } catch {
      showToast("Failed to remove staff member.", "error");
    }
  };

  const filtered = staffList.filter((s) => {
    const q = search.toLowerCase();
    const name = `${s.firstName} ${s.lastName}`.toLowerCase();
    const matchSearch =
      !q || name.includes(q) || s.email.toLowerCase().includes(q);
    const matchRole = !filterRole || s.role === filterRole;
    const matchVerified =
      !filterVerified ||
      (filterVerified === "verified" ? s.emailVerified : !s.emailVerified);
    return matchSearch && matchRole && matchVerified;
  });

  const stats = [
    { label: "Total Staff", value: staffList.length, c: "#3a4e7a" },
    {
      label: "Active (Verified)",
      value: staffList.filter((s) => s.emailVerified).length,
      c: "#2d6a2d",
    },
    {
      label: "Unverified",
      value: staffList.filter((s) => !s.emailVerified).length,
      c: "#8a2a2a",
    },
  ];

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
      {showAddModal && (
        <AddStaffModal
          tokens={tokens}
          primary={primary}
          onClose={() => setShowAddModal(false)}
          onAdded={() => {
            setShowAddModal(false);
            fetchStaff();
            showToast("Staff member added!", "success");
          }}
        />
      )}
      {viewStaff && (
        <ViewStaffModal
          staff={viewStaff}
          tokens={tokens}
          primary={primary}
          onClose={() => setViewStaff(null)}
          onDeleted={(id) => {
            setStaffList((prev) => prev.filter((s) => s.id !== id));
            setViewStaff(null);
          }}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div>
          <Breadcrumb page="Manage Staff" parent="Users" />
          <h1 className="text-xl font-bold" style={{ color: tokens.text }}>
            Manage Staff
          </h1>
          <p className="text-sm" style={{ color: tokens.muted }}>
            Manage staff user accounts only
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl text-sm font-medium self-start flex-shrink-0 text-white"
          style={{ background: primary }}
        >
          + Add Staff
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-3 sm:p-4 text-center"
            style={{
              background: tokens.card,
              border: `1px solid ${tokens.border}`,
            }}
          >
            <div
              className="text-xl sm:text-2xl font-bold"
              style={{ color: s.c }}
            >
              {s.value}
            </div>
            <p className="text-xs mt-0.5" style={{ color: tokens.muted }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2 flex-wrap items-center">
        <button
          onClick={() => setShowFilter((f) => !f)}
          className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
          style={{
            background: showFilter ? primary : tokens.card,
            color: showFilter ? "#fff" : tokens.muted,
            border: `1px solid ${tokens.border}`,
          }}
        >
          ⚙ Filter{" "}
          {[filterRole, filterVerified].filter(Boolean).length > 0 &&
            `(${[filterRole, filterVerified].filter(Boolean).length})`}
        </button>
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm outline-none flex-1"
          style={{
            background: tokens.card,
            color: tokens.text,
            border: `1px solid ${tokens.border}`,
          }}
        />
      </div>

      {showFilter && (
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{
            background: tokens.card,
            border: `1px solid ${tokens.border}`,
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: tokens.text }}>
              Filters
            </p>
            <button
              onClick={() => {
                setFilterRole("");
                setFilterVerified("");
              }}
              className="text-xs underline"
              style={{ color: tokens.muted }}
            >
              Reset
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                style={{ color: tokens.muted }}
              >
                Role
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {["All", "STAFF"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setFilterRole(r === "All" ? "" : r)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                    style={
                      filterRole === (r === "All" ? "" : r)
                        ? { background: primary, color: "#fff" }
                        : {
                            background: tokens.cardHover,
                            color: tokens.muted,
                            border: `1px solid ${tokens.border}`,
                          }
                    }
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label
                className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                style={{ color: tokens.muted }}
              >
                Email Verified
              </label>
              <div className="flex gap-1.5">
                {["All", "verified", "unverified"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setFilterVerified(v === "All" ? "" : v)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-all"
                    style={
                      filterVerified === (v === "All" ? "" : v)
                        ? { background: primary, color: "#fff" }
                        : {
                            background: tokens.cardHover,
                            color: tokens.muted,
                            border: `1px solid ${tokens.border}`,
                          }
                    }
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div
          className="text-center py-10 text-sm"
          style={{ color: tokens.muted }}
        >
          Loading staff list…
        </div>
      ) : staffList.length === 0 ? (
        <div
          className="text-center py-12 rounded-2xl"
          style={{
            background: tokens.card,
            border: `1px solid ${tokens.border}`,
          }}
        >
          <p className="text-3xl mb-2">👥</p>
          <p className="font-semibold" style={{ color: tokens.text }}>
            No staff members found
          </p>
          <p className="text-xs mt-1 mb-4" style={{ color: tokens.muted }}>
            Add staff via the button above, or check backend endpoint{" "}
            <code>/api/admin/users/fetchAll</code>
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: primary }}
          >
            + Add First Staff Member
          </button>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {filtered.map((s) => (
              <div
                key={s.id}
                className="p-3 rounded-xl"
                style={{
                  background: tokens.card,
                  border: `1px solid ${tokens.border}`,
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: `${primary}20`, color: primary }}
                    >
                      {s.firstName[0]}
                      {s.lastName[0]}
                    </div>
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: tokens.text }}
                      >
                        {s.firstName} {s.lastName}
                      </p>
                      <p className="text-xs" style={{ color: tokens.muted }}>
                        {s.email}
                      </p>
                    </div>
                  </div>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
                    style={
                      s.emailVerified
                        ? { background: "#d4e8d4", color: "#2d6a2d" }
                        : { background: "#fbd8d4", color: "#8a2a2a" }
                    }
                  >
                    {s.emailVerified ? "Verified" : "Unverified"}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={roleColor[s.role] || {}}
                  >
                    {s.role}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setViewStaff(s)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium"
                      style={{ background: "#dde4f0", color: "#3a4e7a" }}
                    >
                      View
                    </button>
                    <button
                      onClick={() =>
                        handleDelete(s.id, `${s.firstName} ${s.lastName}`)
                      }
                      className="px-2.5 py-1 rounded-lg text-xs font-medium"
                      style={{ background: "#fbd8d4", color: "#8a2a2a" }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p
                className="text-center py-8 text-sm"
                style={{ color: tokens.muted }}
              >
                No staff match your search.
              </p>
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
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${tokens.border}` }}>
                    {[
                      "Name",
                      "Email",
                      "Mobile",
                      "Role",
                      "Verified",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold tracking-wider uppercase"
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
                        key={s.id}
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
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{
                                background: `${primary}20`,
                                color: primary,
                              }}
                            >
                              {s.firstName[0]}
                              {s.lastName[0]}
                            </div>
                            <span
                              className="font-medium"
                              style={{ color: tokens.text }}
                            >
                              {s.firstName} {s.lastName}
                            </span>
                          </div>
                        </td>
                        <td
                          className="px-4 py-3 text-xs"
                          style={{ color: tokens.sub }}
                        >
                          {s.email}
                        </td>
                        <td
                          className="px-4 py-3 text-xs"
                          style={{ color: tokens.sub }}
                        >
                          {s.mobile || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={roleColor[s.role] || {}}
                          >
                            {s.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={
                              s.emailVerified
                                ? { background: "#d4e8d4", color: "#2d6a2d" }
                                : { background: "#fbd8d4", color: "#8a2a2a" }
                            }
                          >
                            {s.emailVerified ? "✅ Verified" : "❌ Unverified"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => setViewStaff(s)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-medium"
                              style={{
                                background: "#dde4f0",
                                color: "#3a4e7a",
                              }}
                            >
                              View
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(
                                  s.id,
                                  `${s.firstName} ${s.lastName}`,
                                )
                              }
                              className="px-2.5 py-1.5 rounded-lg text-xs font-medium"
                              style={{
                                background: "#fbd8d4",
                                color: "#8a2a2a",
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-sm"
                        style={{ color: tokens.muted }}
                      >
                        No staff match your search.
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

export default ManageStaff;
