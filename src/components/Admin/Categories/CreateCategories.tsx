import React, { useState } from "react";
import { useTheme, Breadcrumb } from "../../Admin/Navbar";
import axios from "axios";
import { Toast, useToast } from "../../shared/ConfirmDialog";

const CreateCategories = () => {
  const { tokens, primary } = useTheme();
  const [form, setForm] = useState({ name: "", description: "" });
  const token = localStorage.getItem("token");
  const { toastState, showToast, hideToast } = useToast();

  const inp: React.CSSProperties = {
    background: tokens.cardHover, color: tokens.text, border: `1px solid ${tokens.border}`,
    borderRadius: 10, padding: "9px 14px", fontSize: "inherit", outline: "none", width: "100%", fontFamily: "inherit",
  };
  const lbl: React.CSSProperties = {
    display: "block", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em",
    textTransform: "uppercase", color: tokens.muted, marginBottom: 6,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8080/api/admin/category/save",
        { name: form.name, description: form.description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("Category added successfully!", "success");
      setForm({ name: "", description: "" });
    } catch (e) {
      console.error(e);
      showToast("Failed to add category", "error");
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">
      <Toast {...toastState} onClose={hideToast} />
      <Breadcrumb page="Create Category" parent="Categories" />
      <div>
        <h1 className="text-xl font-bold" style={{ color: tokens.text }}>Create Category</h1>
        <p className="text-sm" style={{ color: tokens.muted }}>Add a new product category.</p>
      </div>
      <div className="max-w-2xl rounded-2xl p-4 sm:p-6 space-y-4"
        style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label style={lbl}>Name</label>
            <input style={inp} required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><label style={lbl}>Description</label>
            <input style={inp} required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="px-6 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: primary, color: "#fff" }}>+ Add Category</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCategories;
