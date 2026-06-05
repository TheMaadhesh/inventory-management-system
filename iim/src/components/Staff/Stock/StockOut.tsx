import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTheme, Breadcrumb } from "../StaffNavbar";

interface ApiStock {
  id: number;
  quantity: number | string | null;
  type: "STOCK_IN" | "STOCK_OUT";
  transactionDate?: string;
  remarks?: string;
  item?: {
    id?: number;
    itemName?: string;
    name?: string;
  };
}

interface StockRecord {
  id: number;
  itemName: string;
  quantity: number;
  date: string;
  remarks: string;
}

const StockOut: React.FC = () => {
  const { tokens } = useTheme();
  const token = localStorage.getItem("token");

  /* ===============================
     DECODE JWT → USER ID
  =============================== */
  const getUserIdFromToken = () => {
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id;
    } catch {
      return null;
    }
  };

  const userId = getUserIdFromToken();

  const [records, setRecords] = useState<StockRecord[]>([]);

  const [form, setForm] = useState({
    itemId: "",
    quantity: "",
    remarks: "",
  });

  const inp: React.CSSProperties = {
    background: tokens.cardHover,
    color: tokens.text,
    border: `1px solid ${tokens.border}`,
    borderRadius: 10,
    padding: "9px 14px",
    outline: "none",
    width: "100%",
  };

  /* ===============================
     FETCH STOCK OUT HISTORY
  =============================== */
  const fetchStockOut = async () => {
    try {
      const res = await axios.get<ApiStock[]>(
        "http://localhost:8080/api/staff/stock/all",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const outRecords: StockRecord[] = res.data
        .filter((s) => s.type === "STOCK_OUT")
        .map((s) => ({
          id: s.id,
          itemName: s.item?.itemName || s.item?.name || "Unknown Item",
          quantity: Number(s.quantity) || 0,
          date: s.transactionDate ? s.transactionDate.split("T")[0] : "N/A",
          remarks: s.remarks || "",
        }));

      setRecords(outRecords.reverse());
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchStockOut();
  }, []);

  /* ===============================
     SAVE + DECREASE STOCK
  =============================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.itemId || !form.quantity) return;

    try {
      /* 1️⃣ SAVE STOCK OUT TRANSACTION */
      const saveRes = await axios.post(
        "http://localhost:8080/api/staff/stock/save",
        null,
        {
          params: {
            itemId: Number(form.itemId), // ✅ itemId added
            quantity: Number(form.quantity),
            type: "STOCK_OUT",
            remarks: form.remarks,
            userId: userId, // ✅ userId added
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const savedId = saveRes.data?.id;

      /* 2️⃣ DECREASE ITEM STOCK */
      if (savedId) {
        await axios.put(
          "http://localhost:8080/api/staff/stock/decrease",
          null,
          {
            params: {
              id: Number(form.itemId),
              quantity: Number(form.quantity),
            },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
      }

      await fetchStockOut();

      setForm({
        itemId: "",
        quantity: "",
        remarks: "",
      });
    } catch (err) {
      console.error("Stock out error:", err);
    }
  };

  const totalUnits = records.reduce((a, r) => a + r.quantity, 0);

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-5">
      <Breadcrumb page="Stock Out" parent="Stock" />

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold" style={{ color: tokens.text }}>
            Stock Out
          </h1>
          <p style={{ color: tokens.muted }}>Record outgoing inventory</p>
        </div>

        <div
          className="rounded-xl px-4 py-2 text-center"
          style={{
            background: "#fbd8d4",
            border: "1px solid #f5a8a8",
          }}
        >
          <p className="text-lg font-bold" style={{ color: "#8a2a2a" }}>
            {totalUnits}
          </p>
          <p className="text-xs" style={{ color: "#8a2a2a" }}>
            Total Units Out
          </p>
        </div>
      </div>

      {/* FORM */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: tokens.card,
          border: `1px solid ${tokens.border}`,
        }}
      >
        <h3 className="font-semibold mb-3">Remove Stock</h3>

        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-3 gap-3 mb-3">
            {/* ITEM ID */}
            <div>
              <label
                className="text-xs font-bold uppercase mb-1 block"
                style={{ color: tokens.muted }}
              >
                Item ID
              </label>

              <input
                style={inp}
                type="number"
                required
                placeholder="Enter Item ID"
                value={form.itemId}
                onChange={(e) => setForm({ ...form, itemId: e.target.value })}
              />
            </div>

            {/* QUANTITY */}
            <div>
              <label
                className="text-xs font-bold uppercase mb-1 block"
                style={{ color: tokens.muted }}
              >
                Quantity
              </label>

              <input
                style={inp}
                type="number"
                min="1"
                required
                placeholder="0"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>

            {/* REMARKS */}
            <div>
              <label
                className="text-xs font-bold uppercase mb-1 block"
                style={{ color: tokens.muted }}
              >
                Remarks
              </label>

              <input
                style={inp}
                placeholder="Enter remarks"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-white text-sm font-semibold"
              style={{ background: "#ef4444" }}
            >
              Remove Stock
            </button>
          </div>
        </form>
      </div>

      {/* TABLE */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: tokens.card,
          border: `1px solid ${tokens.border}`,
        }}
      >
        <div
          className="px-4 py-3"
          style={{ borderBottom: `1px solid ${tokens.border}` }}
        >
          <h3 className="font-semibold text-sm">Stock Out History</h3>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid ${tokens.border}` }}>
              <th className="px-4 py-3 text-left">Item</th>
              <th className="px-4 py-3 text-left">Quantity</th>
              <th className="px-4 py-3 text-left">Remarks</th>
              <th className="px-4 py-3 text-left">Date</th>
            </tr>
          </thead>

          <tbody>
            {records.map((row) => (
              <tr key={row.id}>
                <td
                  className="px-4 py-3 font-semibold"
                  style={{ color: tokens.text }}
                >
                  {row.itemName}
                </td>

                <td className="px-4 py-3">
                  <span
                    className="px-2 py-1 rounded text-xs font-bold"
                    style={{
                      background: "#fbd8d4",
                      color: "#8a2a2a",
                    }}
                  >
                    -{row.quantity}
                  </span>
                </td>

                <td className="px-4 py-3" style={{ color: tokens.muted }}>
                  {row.remarks || "—"}
                </td>

                <td className="px-4 py-3" style={{ color: tokens.muted }}>
                  {row.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockOut;
