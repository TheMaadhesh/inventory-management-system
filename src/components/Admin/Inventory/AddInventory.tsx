import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTheme, Breadcrumb } from "../../Admin/Navbar";
import {
  Toast,
  useToast,
  ConfirmDialog,
  useConfirm,
} from "../../shared/ConfirmDialog";

interface FormState {
  name: string;
  itemCode: string;
  description: string;
  unit_price: number | "";
  categoryId: number | "";
  supplierId: number | "";
  quantityInStock: number | "";
  reOrderLevel: number | "";
}

interface SupplierOption {
  supplierId: number;
  name: string;
}
interface CategoryOption {
  id: number;
  description: string;
}

const EMPTY: FormState = {
  name: "",
  itemCode: "",
  description: "",
  unit_price: "",
  categoryId: "",
  supplierId: "",
  quantityInStock: "",
  reOrderLevel: "",
};

const AddInventory: React.FC = () => {
  const { tokens, primary } = useTheme();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const { toastState, showToast, hideToast } = useToast();
  const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };

    // Fetch suppliers
    axios
      .get("http://localhost:8080/api/admin/supplier/fetchAll", { headers })
      .then((r) => {
        console.log("Suppliers API:", r.data);
        const data: SupplierOption[] = Array.isArray(r.data)
          ? r.data.map((s) => ({
              supplierId: Number(s.supplierId),
              name: s.name || "",
            }))
          : [];
        setSuppliers(data);
      })
      .catch((err) => {
        console.error(err);
        setSuppliers([]);
      });

    // Fetch categories
    axios
      .get("http://localhost:8080/api/admin/category/fetchAll", { headers })
      .then((r) => {
        console.log("Categories API:", r.data);
        const data: CategoryOption[] = Array.isArray(r.data)
          ? r.data.map((c) => ({
              id: Number(c.id),
              description: c.description || "",
            }))
          : [];
        setCategories(data);
      })
      .catch((err) => {
        console.error(err);
        setCategories([]);
      });
  }, [token]);

  const inp: React.CSSProperties = {
    background: tokens.cardHover,
    color: tokens.text,
    border: `1px solid ${tokens.border}`,
    borderRadius: 10,
    padding: "9px 14px",
    fontSize: "inherit",
    outline: "none",
    width: "100%",
    fontFamily: "inherit",
  };
  const lbl: React.CSSProperties = {
    display: "block",
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: tokens.muted,
    marginBottom: 6,
  };
  const sel: React.CSSProperties = {
    ...inp,
    appearance: "none",
    cursor: "pointer",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId || !form.supplierId) {
      showToast("Please select a Category and Supplier", "error");
      return;
    }

    const ok = await confirm({
      title: "Add Inventory Item?",
      message: `Add "${form.name}" to inventory? This will create a new item record.`,
      confirmLabel: "Yes, Add Item",
      cancelLabel: "Cancel",
      icon: "📦",
    });
    if (!ok) return;

    const payload = {
      name: form.name,
      itemCode: form.itemCode,
      description: form.description,
      unit_price: Number(form.unit_price),
      quantityInStock: Number(form.quantityInStock),
      reOrderLevel: Number(form.reOrderLevel),
      category: { categoryId: Number(form.categoryId) },
      supplier: { supplierId: Number(form.supplierId) },
    };

    try {
      await axios.post("http://localhost:8080/api/admin/item/save", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("Inventory item added successfully!", "success");
      setForm(EMPTY);
    } catch (err: unknown) {
      if (axios.isAxiosError(err))
        showToast(err.response?.data?.message || "Failed to add item", "error");
      else showToast("Server error", "error");
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">
      <Toast {...toastState} onClose={hideToast} />
      <ConfirmDialog
        {...confirmState}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        tokens={tokens}
        primary={primary}
      />
      <Breadcrumb page="Add Inventory" parent="Inventory" />

      <div>
        <h1 className="text-xl font-bold" style={{ color: tokens.text }}>
          Add Inventory Item
        </h1>
        <p className="text-sm" style={{ color: tokens.muted }}>
          Fill out the form to add a new item.
        </p>
      </div>

      <div
        className="max-w-2xl rounded-2xl p-4 sm:p-6"
        style={{
          background: tokens.card,
          border: `1px solid ${tokens.border}`,
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Text fields */}
          {[
            { label: "Item Name", field: "name" as const, type: "text" },
            { label: "Item Code", field: "itemCode" as const, type: "text" },
            {
              label: "Description",
              field: "description" as const,
              type: "text",
            },
          ].map(({ label, field, type }) => (
            <div key={field}>
              <label style={lbl}>{label}</label>
              <input
                style={inp}
                type={type}
                required
                value={form[field] as string}
                onChange={(e) =>
                  setForm((p) => ({ ...p, [field]: e.target.value }))
                }
              />
            </div>
          ))}

          {/* Category dropdown */}
          <div>
            <label style={lbl}>Category</label>
            <select
              style={sel}
              required
              value={form.categoryId}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  categoryId: e.target.value ? Number(e.target.value) : "",
                }))
              }
            >
              <option value="">— Select Category —</option>
              {categories.map((c) => (
                <option key={c.id} value={Number(c.id)}>
                  {c.description}
                </option>
              ))}
            </select>
            {categories.length === 0 && (
              <p className="text-xs mt-1" style={{ color: "#f59e0b" }}>
                ⚠ No categories found. Please create categories first.
              </p>
            )}
          </div>

          {/* Supplier dropdown */}
          <div>
            <label style={lbl}>Supplier</label>
            <select
              style={sel}
              required
              value={form.supplierId}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  supplierId: e.target.value ? Number(e.target.value) : "",
                }))
              }
            >
              <option value="">— Select Supplier —</option>
              {suppliers.map((s) => (
                <option key={s.supplierId} value={Number(s.supplierId)}>
                  #{s.supplierId} — {s.name}
                </option>
              ))}
            </select>
            {suppliers.length === 0 && (
              <p className="text-xs mt-1" style={{ color: "#ef4444" }}>
                ⚠ No suppliers found. Go to{" "}
                <strong>Inventory → Manage Suppliers</strong> to add them first.
              </p>
            )}
          </div>

          {/* Unit Price */}
          <div>
            <label style={lbl}>Unit Price ($)</label>
            <input
              style={inp}
              type="number"
              min="0"
              step="0.01"
              required
              value={form.unit_price}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  unit_price: e.target.value ? Number(e.target.value) : "",
                }))
              }
            />
          </div>

          {/* Qty + Reorder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={lbl}>Quantity In Stock</label>
              <input
                style={inp}
                type="number"
                min="0"
                required
                value={form.quantityInStock}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    quantityInStock: e.target.value
                      ? Number(e.target.value)
                      : "",
                  }))
                }
              />
            </div>
            <div>
              <label style={lbl}>Reorder Level</label>
              <input
                style={inp}
                type="number"
                min="0"
                required
                value={form.reOrderLevel}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    reOrderLevel: e.target.value ? Number(e.target.value) : "",
                  }))
                }
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: primary }}
            >
              + Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInventory;
