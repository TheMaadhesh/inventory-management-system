import React, { useState, useEffect } from "react";
import axios from "axios";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useTheme, Breadcrumb, FilterButton } from "../../Admin/Navbar";

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
  type: string;
  transactionDate?: string;
  item?: { name?: string; itemName?: string };
}

const LowStockReport = () => {
  const { tokens, primary } = useTheme();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState(false);
  const [filterType, setFilterType] = useState<"" | "Low Stock" | "Out of Stock">("");
  const [filterCategory, setFilterCategory] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "qty" | "reorder">("qty");

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
    const qty    = item.quantityInStock ?? 0;
    const reorder = item.reOrderLevel ?? 0;
    if (qty === 0) return "Out of Stock";
    // Low Stock when qty is at or below reOrderLevel (consistent with manage inventory)
    // Also flag when qty < 30% of reOrderLevel as a stricter low-stock signal
    if (qty <= reorder) return "Low Stock";
    return "In Stock";
  };

  // Stock level percentage (qty as % of reOrderLevel — used for visual bar)
  const stockPct = (item: InventoryItem): number => {
    const qty    = item.quantityInStock ?? 0;
    const reorder = item.reOrderLevel ?? 0;
    if (reorder === 0) return qty > 0 ? 100 : 0;
    return Math.round((qty / reorder) * 100);
  };

  // Critical = truly alarming: 0 qty or below 30% of reOrderLevel
  const isCritical = (item: InventoryItem): boolean => {
    const qty    = item.quantityInStock ?? 0;
    const reorder = item.reOrderLevel ?? 0;
    if (qty === 0) return true;
    if (reorder > 0 && (qty / reorder) * 100 < 30) return true;
    return false;
  };

  // Items that need attention
  const alertItems = inventory.filter(i => {
    const s = getStatus(i);
    return s === "Low Stock" || s === "Out of Stock";
  });

  const allCategories = Array.from(new Set(alertItems.map(i => i.categoryDescription).filter(Boolean)));

  // Apply filters + search + sort
  const filtered = alertItems
    .filter(i => {
      const q = search.toLowerCase();
      const matchSearch = !q || i.name.toLowerCase().includes(q) ||
        i.categoryDescription.toLowerCase().includes(q);
      const matchType = !filterType || getStatus(i) === filterType;
      const matchCategory = !filterCategory || i.categoryDescription === filterCategory;
      return matchSearch && matchType && matchCategory;
    })
    .sort((a, b) => {
      if (sortBy === "qty") return (a.quantityInStock ?? 0) - (b.quantityInStock ?? 0);
      if (sortBy === "reorder") return (a.reOrderLevel ?? 0) - (b.reOrderLevel ?? 0);
      return a.name.localeCompare(b.name);
    });

  // Per-item movement from stock history
  const itemMovements: Record<string, { totalIn: number; totalOut: number; lastDate: string }> = {};
  transactions.forEach(t => {
    const name = t.item?.name ?? t.item?.itemName ?? "Unknown";
    if (!itemMovements[name]) itemMovements[name] = { totalIn: 0, totalOut: 0, lastDate: "" };
    if (t.type === "STOCK_IN")  itemMovements[name].totalIn  += t.quantity ?? 0;
    if (t.type === "STOCK_OUT") itemMovements[name].totalOut += t.quantity ?? 0;
    if (t.transactionDate && t.transactionDate > itemMovements[name].lastDate)
      itemMovements[name].lastDate = t.transactionDate.split("T")[0];
  });

  // Totals
  const totalLow    = inventory.filter(i => getStatus(i) === "Low Stock").length;
  const totalOut    = inventory.filter(i => getStatus(i) === "Out of Stock").length;
  const totalAlert  = alertItems.length;
  // Estimated restock cost: sum of (reOrderLevel - qty) * unitPrice for items below reorder
  const restockCost = alertItems.reduce((acc, i) => {
    const needed = Math.max(0, (i.reOrderLevel ?? 0) - (i.quantityInStock ?? 0));
    return acc + needed * (i.unitPrice ?? 0);
  }, 0);

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Low Stock Report");
    sheet.addRow(["Item Name", "Category", "Qty in Stock", "Reorder Level", "Total Stock In", "Total Stock Out", "Units Needed", "Unit Price ($)", "Restock Cost ($)", "Status", "Last Movement"]);
    filtered.forEach(item => {
      const needed = Math.max(0, (item.reOrderLevel ?? 0) - (item.quantityInStock ?? 0));
      const mv = itemMovements[item.name] || { totalIn: 0, totalOut: 0, lastDate: "" };
      sheet.addRow([
        item.name, item.categoryDescription,
        item.quantityInStock ?? 0, item.reOrderLevel ?? 0,
        mv.totalIn, mv.totalOut,
        needed, item.unitPrice?.toFixed(2) ?? "0.00",
        (needed * (item.unitPrice ?? 0)).toFixed(2),
        getStatus(item),
        mv.lastDate || "—",
      ]);
    });
    sheet.getRow(1).eachCell(cell => { cell.font = { bold: true }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFBE8C8" } }; });
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `LowStockReport_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const activeFilters = [filterType, filterCategory].filter(Boolean).length;

  if (loading) {
    return <div className="p-6 flex items-center justify-center" style={{ color: tokens.muted }}>Loading report...</div>;
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">
      <Breadcrumb page="Low Stock Report" parent="Reports" />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: tokens.text }}>Low Stock Report</h1>
          <p className="text-sm" style={{ color: tokens.muted }}>Items requiring immediate attention</p>
        </div>
        <button onClick={exportToExcel}
          className="px-4 py-2 rounded-xl text-sm font-medium self-start flex-shrink-0 text-white"
          style={{ background: primary }}>⬇ Export Excel</button>
      </div>

      {/* Alert banner */}
      {totalAlert > 0 && (
        <div className="px-4 py-3 rounded-xl space-y-1"
          style={{ background: "#fbe8c8", border: "1px solid #f0d4a0" }}>
          <p className="text-sm font-semibold" style={{ color: "#8a5a1a" }}>
            ⚠️ {totalAlert} item{totalAlert !== 1 ? "s" : ""} need restocking.
            Estimated restock cost: <strong>${restockCost.toFixed(2)}</strong>
          </p>
          {inventory.filter(i => isCritical(i)).length > 0 && (
            <p className="text-xs font-medium" style={{ color: "#8a2a2a" }}>
              🚨 {inventory.filter(i => isCritical(i)).length} item{inventory.filter(i => isCritical(i)).length !== 1 ? "s" : ""} are critically low (below 30% of reorder level or out of stock) — restock immediately.
            </p>
          )}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: "Low Stock",    value: totalLow,   bg: "#fbe8c8", c: "#8a5a1a" },
          { label: "Out of Stock", value: totalOut,   bg: "#fbd8d4", c: "#8a2a2a" },
          { label: "Critical (<30%)", value: inventory.filter(i => isCritical(i)).length, bg: "#fbd8d4", c: "#8a2a2a" },
          { label: "Restock Cost", value: `$${restockCost.toFixed(0)}`, bg: tokens.cardHover, c: tokens.text },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: s.bg }}>
            <p className="text-lg sm:text-xl font-bold" style={{ color: s.c }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: s.c, opacity: 0.8 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter toolbar */}
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
        <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="px-3 py-2 rounded-xl text-xs outline-none"
          style={{ background: tokens.card, color: tokens.text, border: `1px solid ${tokens.border}` }}>
          <option value="qty">Sort: Qty ↑</option>
          <option value="reorder">Sort: Reorder Level</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>

      {filterActive && (
        <div className="rounded-2xl p-4 space-y-3" style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: tokens.text }}>Filters</p>
            <button onClick={() => { setFilterType(""); setFilterCategory(""); }}
              className="text-xs underline" style={{ color: tokens.muted }}>Reset</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: tokens.muted }}>Alert Type</label>
              <div className="flex gap-1.5 flex-wrap">
                {["All", "Low Stock", "Out of Stock"].map(t => (
                  <button key={t} onClick={() => setFilterType(t === "All" ? "" : t as typeof filterType)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                    style={filterType === (t === "All" ? "" : t)
                      ? { background: primary, color: "#fff" }
                      : { background: tokens.cardHover, color: tokens.muted, border: `1px solid ${tokens.border}` }}>
                    {t}
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
      <div className="rounded-2xl overflow-hidden" style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}>
        {/* Mobile */}
        <div className="sm:hidden">
          {filtered.length > 0 ? filtered.map((item, i) => {
            const qty    = item.quantityInStock ?? 0;
            const reorder = item.reOrderLevel ?? 0;
            const needed  = Math.max(0, reorder - qty);
            const pct     = stockPct(item);
            const critical = isCritical(item);
            const mv = itemMovements[item.name] || { totalIn: 0, totalOut: 0 };
            return (
              <div key={item.itemId} className="px-4 py-3"
                style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${tokens.border}` : "none",
                         background: critical ? "rgba(239,68,68,0.04)" : "transparent" }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: tokens.text }}>{item.name}</p>
                    <p className="text-xs" style={{ color: tokens.sub }}>{item.categoryDescription}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
                    style={getStatus(item) === "Low Stock"
                      ? { background: "#fbe8c8", color: "#8a5a1a" }
                      : { background: "#fbd8d4", color: "#8a2a2a" }}>
                    {getStatus(item)}
                  </span>
                </div>

                {/* Stock level bar with 30% threshold marker */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: tokens.muted }}>
                      Qty: <span className="font-bold"
                        style={{ color: qty === 0 ? "#ef4444" : critical ? "#f59e0b" : tokens.text }}>
                        {qty}
                      </span> / Reorder: {reorder}
                    </span>
                    <span className="font-bold"
                      style={{ color: qty === 0 ? "#ef4444" : pct < 30 ? "#f59e0b" : "#2d6a2d" }}>
                      {qty === 0 ? "OUT" : `${pct}%`}
                    </span>
                  </div>
                  <div className="relative w-full h-2.5 rounded-full overflow-visible"
                    style={{ background: tokens.border }}>
                    <div className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, Math.max(0, pct))}%`,
                        background: qty === 0 ? "#ef4444" : pct < 30 ? "#f59e0b" : "#22c55e",
                      }} />
                    {/* 30% threshold marker */}
                    {reorder > 0 && (
                      <div className="absolute top-0 h-full w-0.5"
                        style={{ left: "30%", background: "#ef4444", opacity: 0.6 }} />
                    )}
                  </div>
                  <p className="text-[10px] mt-0.5" style={{ color: tokens.muted }}>
                    Red line = 30% threshold · {pct < 30 ? "🚨 Below critical threshold" : pct <= 100 ? "⚠️ At or below reorder level" : ""}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs flex-wrap gap-1">
                  {needed > 0 && (
                    <span className="font-semibold px-2 py-0.5 rounded-lg"
                      style={{ background: "#fbe8c8", color: "#8a5a1a" }}>
                      Need +{needed} units
                    </span>
                  )}
                  {(mv.totalIn > 0 || mv.totalOut > 0) && (
                    <span style={{ color: tokens.muted }}>
                      <span style={{ color: "#2d6a2d" }}>▲{mv.totalIn}</span>
                      {" / "}
                      <span style={{ color: "#8a2a2a" }}>▼{mv.totalOut}</span>
                      {" moved"}
                    </span>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="px-4 py-8 text-center text-sm" style={{ color: tokens.muted }}>
              {alertItems.length === 0 ? "All items well stocked! ✅" : "No items match your filters."}
            </div>
          )}
        </div>

        {/* Desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${tokens.border}` }}>
                {["Item", "Category", "Qty", "Reorder", "Total In", "Total Out", "Need", "Restock Cost", "Status"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold tracking-wider uppercase"
                    style={{ color: tokens.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => {
                const qty    = item.quantityInStock ?? 0;
                const reorder = item.reOrderLevel ?? 0;
                const price   = item.unitPrice ?? 0;
                const needed  = Math.max(0, reorder - qty);
                const restockCostItem = needed * price;
                const mv = itemMovements[item.name] || { totalIn: 0, totalOut: 0, lastDate: "" };
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

                    {/* Qty — with mini bar */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 min-w-[72px]">
                        <span className="font-bold"
                          style={{ color: qty === 0 ? "#ef4444" : isCritical(item) ? "#f59e0b" : tokens.text }}>
                          {qty}{qty === 0 ? " 🚨" : isCritical(item) ? " ⚠️" : ""}
                        </span>
                        <div className="relative w-full h-1.5 rounded-full overflow-visible"
                          style={{ background: tokens.border, minWidth: 56 }}>
                          <div className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, Math.max(0, stockPct(item)))}%`,
                              background: qty === 0 ? "#ef4444" : stockPct(item) < 30 ? "#f59e0b" : "#22c55e",
                            }} />
                          {reorder > 0 && (
                            <div className="absolute top-0 h-full w-px"
                              style={{ left: "30%", background: "#ef4444", opacity: 0.7 }} />
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Reorder */}
                    <td className="px-4 py-3" style={{ color: tokens.sub }}>{reorder}</td>

                    {/* Total In */}
                    <td className="px-4 py-3 font-semibold" style={{ color: mv.totalIn > 0 ? "#2d6a2d" : tokens.muted }}>
                      {mv.totalIn > 0 ? `+${mv.totalIn}` : "—"}
                    </td>

                    {/* Total Out */}
                    <td className="px-4 py-3 font-semibold" style={{ color: mv.totalOut > 0 ? "#8a2a2a" : tokens.muted }}>
                      {mv.totalOut > 0 ? `−${mv.totalOut}` : "—"}
                    </td>

                    {/* Need */}
                    <td className="px-4 py-3 font-semibold" style={{ color: needed > 0 ? "#c97c2a" : tokens.muted }}>
                      {needed > 0 ? `+${needed}` : "—"}
                    </td>

                    {/* Restock Cost */}
                    <td className="px-4 py-3 font-semibold" style={{ color: restockCostItem > 0 ? "#c97c2a" : tokens.muted }}>
                      {restockCostItem > 0
                        ? `$${restockCostItem.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "—"}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                        style={status === "Low Stock"
                          ? { background: "#fbe8c8", color: "#8a5a1a" }
                          : { background: "#fbd8d4", color: "#8a2a2a" }}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm" style={{ color: tokens.muted }}>
                    {alertItems.length === 0 ? "All items well stocked! ✅" : "No items match your filters."}
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

export default LowStockReport;
