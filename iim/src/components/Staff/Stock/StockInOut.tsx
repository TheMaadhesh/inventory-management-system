import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTheme, Breadcrumb } from "../StaffNavbar";

interface ApiStock {
  id: number;
  quantity: number | string | null;
  type: "STOCK_IN" | "STOCK_OUT";
  transactionDate?: string;
  item?: {
    id?: number;
    itemName?: string;
    name?: string;
  };
  supplier?: string;
  note?: string;
}

interface StockRecord {
  id: number;
  itemName: string;
  quantity: number;
  supplier: string;
  date: string;
  note: string;
}

const StockOut: React.FC = () => {
  const { tokens, primary } = useTheme();
  const token = localStorage.getItem("token");

  const [records, setRecords] = useState<StockRecord[]>([]);

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


  const fetchStockOut = async () => {
    try {
      const res = await axios.get<ApiStock[]>(
        "http://localhost:8080/api/staff/stock/all",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const stockOutRecords: StockRecord[] = res.data
        .filter((s) => s.type === "STOCK_OUT")
        .map((s) => ({
          id: s.id,
          itemName: s.item?.itemName || s.item?.name || "Unknown Item",
          quantity: Number(s.quantity) || 0,
          supplier: s.supplier || "",
          date: s.transactionDate ? s.transactionDate.split("T")[0] : "N/A",
          note: s.note || "",
        }));

      setRecords(stockOutRecords.reverse()); // newest first
    } catch (err) {
      console.error("Error fetching stock out:", err);
    }
  };

  useEffect(() => {
    fetchStockOut();
  }, []);

  const totalUnits = records.reduce((a, r) => a + r.quantity, 0);

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">
      <Breadcrumb page="Stock Out" parent="Stock" />

      {/* TITLE + SUMMARY */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: tokens.text }}>
            Stock Out
          </h1>
          <p className="text-sm" style={{ color: tokens.muted }}>
            View outgoing stock movements
          </p>
        </div>
        <div className="flex gap-2">
          <div
            className="rounded-xl px-4 py-2.5 text-center"
            style={{ background: "#fbd8d4", border: "1px solid #f5a8a0" }}
          >
            <p className="text-lg font-bold" style={{ color: "#8a2a2a" }}>
              {totalUnits}
            </p>
            <p className="text-xs" style={{ color: "#8a2a2a" }}>
              Total Units Out
            </p>
          </div>
          <div
            className="rounded-xl px-4 py-2.5 text-center"
            style={{ background: "#fde3d9", border: "1px solid #fbc0b2" }}
          >
            <p className="text-lg font-bold" style={{ color: "#8a2a2a" }}>
              {records.length}
            </p>
            <p className="text-xs" style={{ color: "#8a2a2a" }}>
              Records
            </p>
          </div>
        </div>
      </div>

      {/* RECORDS TABLE */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}
      >
        <div
          className="px-4 py-3 flex items-center gap-2"
          style={{ borderBottom: `1px solid ${tokens.border}` }}
        >
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#f87171" }} />
          <p className="font-semibold text-sm" style={{ color: tokens.text }}>
            Stock Out Records
          </p>
        </div>

        {/* Mobile view */}
        <div className="sm:hidden divide-y" style={{ borderColor: tokens.border }}>
          {records.map((r) => (
            <div key={r.id} className="px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold" style={{ color: tokens.text }}>
                  {r.itemName}
                </p>
                <span
                  className="text-sm font-bold px-2 py-0.5 rounded-lg"
                  style={{ background: "#fbd8d4", color: "#8a2a2a" }}
                >
                  -{r.quantity}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs" style={{ color: tokens.muted }}>
                <span>{r.supplier || "—"}</span>
                <span>{r.date}</span>
              </div>
              {r.note && (
                <p className="text-xs mt-1 italic" style={{ color: tokens.muted }}>
                  {r.note}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Desktop table view */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${tokens.border}` }}>
                {["#", "Item", "Quantity", "Supplier", "Date", "Note"].map((h) => (
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
              {records.map((r, i) => (
                <tr
                  key={r.id}
                  style={{ borderBottom: i < records.length - 1 ? `1px solid ${tokens.border}` : "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = tokens.cardHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td className="px-4 py-3 text-xs" style={{ color: tokens.muted }}>
                    {r.id}
                  </td>
                  <td className="px-4 py-3 font-semibold" style={{ color: tokens.text }}>
                    {r.itemName}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="font-bold px-2.5 py-0.5 rounded-lg text-xs"
                      style={{ background: "#fbd8d4", color: "#8a2a2a" }}
                    >
                      -{r.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: tokens.sub }}>
                    {r.supplier || "—"}
                  </td>
                  <td className="px-4 py-3" style={{ color: tokens.sub }}>
                    {r.date}
                  </td>
                  <td className="px-4 py-3 text-xs italic" style={{ color: tokens.muted }}>
                    {r.note || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockOut;