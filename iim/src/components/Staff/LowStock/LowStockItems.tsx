import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTheme, Breadcrumb } from "../StaffNavbar";

type Status = "Critical" | "Low" | "Warning" | "Success";

interface LowStockItem {
  id: number;
  name: string;
  category: string;
  quantityInStock: number;
  reOrderLevel: number;
  status: Status;
}

const LowStockItems: React.FC = () => {
  const { tokens, primary } = useTheme();
  const token = localStorage.getItem("token");

  const [items, setItems] = useState<LowStockItem[]>([]);
  const [filter, setFilter] = useState<"All" | Status>("All");
  const [search, setSearch] = useState("");

  const statusColor = (s: Status) => {
    if (s === "Critical") return { bg: "#fbd8d4", text: "#8a2a2a", bar: "#ef4444" };
    if (s === "Low") return { bg: "#fbe8c8", text: "#8a5a1a", bar: "#f59e0b" };
    if (s === "Success") return { bg: "#d4f5d4", text: "#2e7d32", bar: "#22c55e" };
    return { bg: `${primary}18`, text: primary, bar: primary }; // Warning
  };

  const computeBar = (stock: number, reorder: number) => {
    const maxStock = reorder * 2 || 1;
    return Math.min(Math.round((stock / maxStock) * 100), 100);
  };

  const computeStatus = (stock: number, reorder: number): Status => {
    const bar = computeBar(stock, reorder);
    if (stock === 0) return "Critical";
    if (stock <= reorder) return "Low";
    if (bar === 100) return "Success";
    return "Warning";
  };

  const fetchItems = async () => {
    try {
      const res = await axios.get<any[]>(
        "http://localhost:8080/api/staff/item/fetchAll",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data: LowStockItem[] = res.data.map((item: any, idx: number) => {
        const stock = item.quantityInStock ?? 0;
        const reorder = item.reOrderLevel ?? 1;

        return {
          id: item.itemId ?? idx,
          name: item.name ?? "Unknown",
          category: item.categoryDescription ?? "General",
          quantityInStock: stock,
          reOrderLevel: reorder,
          status: computeStatus(stock, reorder),
        };
      });

      setItems(data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filtered = items.filter((i) => {
    const matchFilter = filter === "All" || i.status === filter;
    const matchSearch =
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const summary = [
    { label: "Critical", count: items.filter((i) => i.status === "Critical").length },
    { label: "Low", count: items.filter((i) => i.status === "Low").length },
    { label: "Warning", count: items.filter((i) => i.status === "Warning").length },
    { label: "Success", count: items.filter((i) => i.status === "Success").length },
  ];

  return (
    <div className="p-4 space-y-5">
      <Breadcrumb page="Low Stock Items" parent="Low Stock" />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold" style={{ color: tokens.text }}>
            ⚠️ Low Stock Items
          </h1>
          <p className="text-sm" style={{ color: tokens.muted }}>
            Inventory items near reorder level
          </p>
        </div>

        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{
            background: tokens.card,
            color: tokens.text,
            border: `1px solid ${tokens.border}`,
          }}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summary.map((c) => {
          const sc = statusColor(c.label as Status);
          return (
            <div
              key={c.label}
              className="rounded-xl p-4 text-center"
              style={{ background: sc.bg }}
            >
              <p className="text-2xl font-bold" style={{ color: sc.text }}>
                {c.count}
              </p>
              <p className="text-xs font-semibold mt-1" style={{ color: sc.text }}>
                {c.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["All", "Critical", "Low", "Warning", "Success"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{
              background: filter === f ? primary : tokens.card,
              color: filter === f ? "#fff" : tokens.sub,
              border: `1px solid ${tokens.border}`,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid ${tokens.border}` }}>
              {["Item", "Category", "Current Stock", "Reorder Level", "Stock Level", "Status"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase"
                    style={{ color: tokens.muted }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {filtered.map((item, idx) => {
              const bar = computeBar(item.quantityInStock, item.reOrderLevel);
              const sc = statusColor(item.status);

              return (
                <tr
                  key={item.id}
                  style={{
                    borderBottom:
                      idx < filtered.length - 1
                        ? `1px solid ${tokens.border}`
                        : "none",
                  }}
                >
                  <td className="px-4 py-3 font-semibold">{item.name}</td>
                  <td className="px-4 py-3">{item.category}</td>
                  <td className="px-4 py-3 font-bold">{item.quantityInStock}</td>
                  <td className="px-4 py-3">{item.reOrderLevel}</td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex-1 h-2 rounded-full overflow-hidden"
                        style={{ background: tokens.border }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${bar}%`, background: sc.bar }}
                        />
                      </div>
                      <span className="text-xs">{bar}%</span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-1 rounded-full text-xs font-semibold"
                      style={{ background: sc.bg, color: sc.text }}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LowStockItems;