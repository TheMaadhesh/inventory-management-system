import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTheme, Breadcrumb, FilterButton } from "../../Admin/Navbar";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

interface InventoryItem {
  itemId: number;
  name: string;
  categoryDescription: string;
  quantityInStock?: number;
  reOrderLevel?: number;
  unitPrice?: number;
}

interface StockTransaction {
  id: number;
  quantity: number;
  type: string; // "STOCK_IN" | "STOCK_OUT"
  transactionDate?: string;
  item?: { name?: string; itemId?: number; itemName?: string };
}

// Per-item stock movement totals
interface ItemMovement {
  name: string;
  totalIn: number;
  totalOut: number;
  netMovement: number;
}

const COLORS = ["#4a7c6a", "#f59e0b", "#ef4444"];

const InventoryReport = () => {
  const { tokens, primary } = useTheme();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get<InventoryItem[]>("http://localhost:8080/api/admin/item/fetchAll", { headers }),
      axios.get<StockTransaction[]>("http://localhost:8080/api/admin/stock/all", { headers }),
    ])
      .then(([itemRes, txRes]) => {
        setInventory(Array.isArray(itemRes.data) ? itemRes.data : []);
        setTransactions(Array.isArray(txRes.data) ? txRes.data : []);
      })
      .catch(err => console.error("Failed to fetch data:", err))
      .finally(() => setLoading(false));
  }, []);

  const getStatus = (item: InventoryItem): "In Stock" | "Low Stock" | "Out of Stock" => {
    const qty = item.quantityInStock ?? 0;
    const reorder = item.reOrderLevel ?? 0;
    if (qty === 0) return "Out of Stock";
    if (qty <= reorder) return "Low Stock";
    return "In Stock";
  };

  const statusStyle = (s: string): React.CSSProperties =>
    s === "In Stock"  ? { background: "#d4e8d4", color: "#2d6a2d" } :
    s === "Low Stock" ? { background: "#fbe8c8", color: "#8a5a1a" } :
                        { background: "#fbd8d4", color: "#8a2a2a" };

  // Computed totals
  const inStock    = inventory.filter(i => getStatus(i) === "In Stock").length;
  const lowStock   = inventory.filter(i => getStatus(i) === "Low Stock").length;
  const outOfStock = inventory.filter(i => getStatus(i) === "Out of Stock").length;
  const categories = new Set(inventory.map(i => i.categoryDescription)).size;
  const totalStockOut = transactions.filter(t => t.type === "STOCK_OUT").reduce((sum, t) => sum + (t.quantity ?? 0), 0);
  const totalStockIn  = transactions.filter(t => t.type === "STOCK_IN").reduce((sum, t) => sum + (t.quantity ?? 0), 0);
  const totalValue    = inventory.reduce((sum, i) => sum + (i.quantityInStock ?? 0) * (i.unitPrice ?? 0), 0);

  // Per-item movement map from stock history
  const itemMovements: Record<string, { totalIn: number; totalOut: number }> = {};
  transactions.forEach(t => {
    const name = t.item?.name ?? t.item?.itemName ?? "Unknown";
    if (!itemMovements[name]) itemMovements[name] = { totalIn: 0, totalOut: 0 };
    if (t.type === "STOCK_IN")  itemMovements[name].totalIn  += t.quantity ?? 0;
    if (t.type === "STOCK_OUT") itemMovements[name].totalOut += t.quantity ?? 0;
  });

  const pieData = [
    { name: "In Stock",     value: inStock },
    { name: "Low Stock",    value: lowStock },
    { name: "Out of Stock", value: outOfStock },
  ];

  // Category breakdown for bar chart
  const categoryBreakdown = Array.from(new Set(inventory.map(i => i.categoryDescription)))
    .map(cat => ({
      name: cat.length > 12 ? cat.slice(0, 12) + "…" : cat,
      fullName: cat,
      count: inventory.filter(i => i.categoryDescription === cat).length,
      inStock: inventory.filter(i => i.categoryDescription === cat && getStatus(i) === "In Stock").length,
      low: inventory.filter(i => i.categoryDescription === cat && getStatus(i) === "Low Stock").length,
    }));

  const allCategories = Array.from(new Set(inventory.map(i => i.categoryDescription).filter(Boolean)));
  const activeFilters = [filterStatus, filterCategory].filter(Boolean).length;

  const filtered = inventory.filter(i => {
    const q = search.toLowerCase();
    const matchSearch = !q || i.name.toLowerCase().includes(q) ||
      i.categoryDescription.toLowerCase().includes(q);
    const matchStatus = !filterStatus || getStatus(i) === filterStatus;
    const matchCategory = !filterCategory || i.categoryDescription === filterCategory;
    return matchSearch && matchStatus && matchCategory;
  });

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Inventory Report");
    sheet.addRow(["Item", "Category", "Qty in Stock", "Reorder Level", "Unit Price ($)", "Total Value ($)", "Status"]);
    filtered.forEach(item => {
      sheet.addRow([
        item.name, item.categoryDescription, item.quantityInStock ?? 0,
        item.reOrderLevel ?? 0, item.unitPrice?.toFixed(2) ?? "0.00",
        ((item.quantityInStock ?? 0) * (item.unitPrice ?? 0)).toFixed(2),
        getStatus(item),
      ]);
    });
    sheet.getRow(1).eachCell(cell => { cell.font = { bold: true }; });
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `InventoryReport_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  if (loading) {
    return <div className="p-6 flex items-center justify-center" style={{ color: tokens.muted }}>Loading report...</div>;
  }

  const card = { background: tokens.card, border: `1px solid ${tokens.border}` };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">
      <Breadcrumb page="Inventory Report" parent="Reports" />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: tokens.text }}>Inventory Report</h1>
          <p className="text-sm" style={{ color: tokens.muted }}>Full overview of inventory status and stock movements</p>
        </div>
        <button onClick={exportToExcel}
          className="px-4 py-2 rounded-xl text-sm font-medium self-start text-white"
          style={{ background: primary }}>⬇ Export Excel</button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: "Total Items",   value: inventory.length, c: "#3a4e7a" },
          { label: "Categories",    value: categories,        c: primary },
          { label: "Total Stock In", value: totalStockIn,    c: "#2d6a2d" },
          { label: "Total Stock Out", value: totalStockOut,  c: "#8a2a2a" },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-3 sm:p-4 text-center" style={card}>
            <p className="text-xl sm:text-2xl font-bold" style={{ color: s.c }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: tokens.muted }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Pie chart */}
        <div className="rounded-2xl p-4 sm:p-5" style={card}>
          <p className="font-semibold mb-3" style={{ color: tokens.text }}>Status Distribution</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" outerRadius={65} innerRadius={42} paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: tokens.card, border: `1px solid ${tokens.border}`, borderRadius: 10, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                  <span style={{ color: tokens.sub }}>{d.name}</span>
                </div>
                <span className="font-bold" style={{ color: tokens.text }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category bar chart */}
        <div className="rounded-2xl p-4 sm:p-5" style={card}>
          <p className="font-semibold mb-3" style={{ color: tokens.text }}>Items by Category</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBreakdown} margin={{ top: 0, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={tokens.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: tokens.muted }} />
                <YAxis tick={{ fontSize: 10, fill: tokens.muted }} />
                <Tooltip
                  contentStyle={{ background: tokens.card, border: `1px solid ${tokens.border}`, borderRadius: 10, fontSize: 11 }}
                  formatter={(value, name) => [value, name === "inStock" ? "In Stock" : name === "low" ? "Low Stock" : "Total"]}
                />
                <Bar dataKey="inStock" fill="#4a7c6a" radius={[3, 3, 0, 0]} name="inStock" />
                <Bar dataKey="low" fill="#f59e0b" radius={[3, 3, 0, 0]} name="low" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2 text-xs justify-center">
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#4a7c6a]" />In Stock</div>
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />Low Stock</div>
          </div>
        </div>
      </div>

      {/* Inventory value + stock movements summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Total Inventory Value", value: `$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: "💰", c: "#2d6a2d" },
          { label: "Total Qty Stock-In", value: totalStockIn.toLocaleString(), icon: "📥", c: "#3a4e7a" },
          { label: "Total Qty Stock-Out", value: totalStockOut.toLocaleString(), icon: "📤", c: "#8a2a2a" },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 flex items-center gap-3" style={card}>
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="text-lg font-bold" style={{ color: s.c }}>{s.value}</p>
              <p className="text-xs" style={{ color: tokens.muted }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative">
          <FilterButton onClick={() => setFilterActive(f => !f)} active={filterActive} />
          {activeFilters > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
              style={{ background: primary }}>{activeFilters}</span>
          )}
        </div>
        <input type="text" placeholder="Search items…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm outline-none flex-1"
          style={{ background: tokens.card, color: tokens.text, border: `1px solid ${tokens.border}` }} />
        <span className="text-xs" style={{ color: tokens.muted }}>
          Showing {filtered.length} of {inventory.length}
        </span>
      </div>

      {filterActive && (
        <div className="rounded-2xl p-4 space-y-3" style={card}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: tokens.text }}>Filters</p>
            <button onClick={() => { setFilterStatus(""); setFilterCategory(""); }}
              className="text-xs underline" style={{ color: tokens.muted }}>Reset</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: tokens.muted }}>Status</label>
              <div className="flex gap-1.5 flex-wrap">
                {["All", "In Stock", "Low Stock", "Out of Stock"].map(s => (
                  <button key={s} onClick={() => setFilterStatus(s === "All" ? "" : s)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium"
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
                value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="">All Categories</option>
                {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={card}>
        {/* Mobile */}
        <div className="sm:hidden divide-y" style={{ borderColor: tokens.border }}>
          {filtered.length > 0 ? filtered.map((item, i) => (
            <div key={item.itemId} className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${tokens.border}` : "none" }}>
              <div>
                <p className="text-sm font-medium" style={{ color: tokens.text }}>{item.name}</p>
                <p className="text-xs" style={{ color: tokens.sub }}>
                  {item.categoryDescription} · Qty: {item.quantityInStock ?? 0}
                </p>
                {(() => { const mv = itemMovements[item.name] || { totalIn: 0, totalOut: 0 }; return mv.totalIn > 0 || mv.totalOut > 0 ? (
                  <p className="text-xs mt-0.5" style={{ color: tokens.muted }}>
                    <span style={{ color: "#2d6a2d" }}>▲{mv.totalIn}</span>
                    {" · "}
                    <span style={{ color: "#8a2a2a" }}>▼{mv.totalOut}</span>
                    {" moved"}
                  </p>
                ) : null; })()}
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
                style={statusStyle(getStatus(item))}>{getStatus(item)}</span>
            </div>
          )) : (
            <div className="px-4 py-8 text-center text-sm" style={{ color: tokens.muted }}>
              No inventory items found.
            </div>
          )}
        </div>
        {/* Desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${tokens.border}` }}>
                {["Item", "Category", "Current Qty", "Stock In", "Stock Out", "Net Move", "Unit Price", "Value", "Status"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold tracking-wider uppercase"
                    style={{ color: tokens.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((item, i) => {
                const qty   = item.quantityInStock ?? 0;
                const price = item.unitPrice ?? 0;
                const value = qty * price;
                const mv    = itemMovements[item.name] || { totalIn: 0, totalOut: 0 };
                const net   = mv.totalIn - mv.totalOut;
                const status = getStatus(item);
                return (
                  <tr key={item.itemId}
                    style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${tokens.border}` : "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = tokens.cardHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

                    {/* Item */}
                    <td className="px-4 py-3 font-medium" style={{ color: tokens.text }}>{item.name}</td>

                    {/* Category */}
                    <td className="px-4 py-3" style={{ color: tokens.sub }}>{item.categoryDescription || "—"}</td>

                    {/* Current Qty */}
                    <td className="px-4 py-3 font-bold"
                      style={{ color: qty <= 0 ? "#ef4444" : qty <= (item.reOrderLevel ?? 0) ? "#f59e0b" : "#2d6a2d" }}>
                      {qty}
                    </td>

                    {/* Stock In (from transactions) */}
                    <td className="px-4 py-3 font-semibold" style={{ color: mv.totalIn > 0 ? "#2d6a2d" : tokens.muted }}>
                      {mv.totalIn > 0 ? `+${mv.totalIn}` : "—"}
                    </td>

                    {/* Stock Out (from transactions) */}
                    <td className="px-4 py-3 font-semibold" style={{ color: mv.totalOut > 0 ? "#8a2a2a" : tokens.muted }}>
                      {mv.totalOut > 0 ? `−${mv.totalOut}` : "—"}
                    </td>

                    {/* Net Move */}
                    <td className="px-4 py-3 font-semibold"
                      style={{ color: net > 0 ? "#2d6a2d" : net < 0 ? "#8a2a2a" : tokens.muted }}>
                      {net !== 0 ? (net > 0 ? `+${net}` : `${net}`) : "—"}
                    </td>

                    {/* Unit Price */}
                    <td className="px-4 py-3" style={{ color: tokens.text }}>
                      {price > 0 ? `$${price.toFixed(2)}` : "—"}
                    </td>

                    {/* Value (qty × price) */}
                    <td className="px-4 py-3 font-semibold" style={{ color: tokens.text }}>
                      {value > 0 ? `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                        style={statusStyle(status)}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm" style={{ color: tokens.muted }}>
                    No items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryReport;
