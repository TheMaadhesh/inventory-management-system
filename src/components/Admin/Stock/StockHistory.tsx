import { useState, useEffect } from "react";
import axios from "axios";
import { useTheme, Breadcrumb } from "../../Admin/Navbar";

interface StockItem {
  id: number;
  itemName: string;
  type: "In" | "Out";
  quantity: number;
  date: string;
}

const StockHistory = () => {
  const { tokens, primary } = useTheme();
  const token = localStorage.getItem("token");

  const [history, setHistory] = useState<StockItem[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | "In" | "Out">("All");

  /* ================= FETCH DATA ================= */

  const loadHistory = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/admin/stock/all", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const mapped: StockItem[] = res.data.map((s: any) => ({
        id: s.id ?? 0,
        itemName: s.item?.name ?? "Unknown Item",
        type: s.type === "STOCK_IN" ? "In" : "Out",
        quantity: Number(s.quantity) || 0,
        date: s.transactionDate ? s.transactionDate.split("T")[0] : "N/A",
      }));

      setHistory(mapped);
    } catch (err) {
      console.error("Failed to load stock history", err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  /* ================= FILTER ================= */

  const filtered = history.filter(
    (s) =>
      s.itemName.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "All" || s.type === filter),
  );

  /* ================= TOTALS ================= */

  const totalIn = filtered
    .filter((s) => s.type === "In")
    .reduce((a, s) => a + (Number(s.quantity) || 0), 0);

  const totalOut = filtered
    .filter((s) => s.type === "Out")
    .reduce((a, s) => a + (Number(s.quantity) || 0), 0);

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">
      <Breadcrumb page="Stock History" parent="Stock" />

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: tokens.text }}>
            Stock History
          </h1>

          <p className="text-sm" style={{ color: tokens.muted }}>
            Full log of all stock movements
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search..."
            className="px-3 py-2 rounded-xl text-sm outline-none flex-1 sm:w-40 sm:flex-none"
            style={{
              background: tokens.card,
              color: tokens.text,
              border: `1px solid ${tokens.border}`,
            }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex gap-1.5">
            {(["All", "In", "Out"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
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
        </div>
      </div>

      {/* SUMMARY */}
      <div className="flex gap-2 flex-wrap text-sm">
        <div
          className="px-3 py-1.5 rounded-xl"
          style={{
            background: "#d4e8d4",
            color: "#2d6a2d",
          }}
        >
          <span className="font-bold">{totalIn}</span> units in
        </div>

        <div
          className="px-3 py-1.5 rounded-xl"
          style={{
            background: "#fbd8d4",
            color: "#8a2a2a",
          }}
        >
          <span className="font-bold">{totalOut}</span> units out
        </div>

        <div
          className="px-3 py-1.5 rounded-xl"
          style={{
            background: tokens.card,
            color: tokens.sub,
            border: `1px solid ${tokens.border}`,
          }}
        >
          <span className="font-bold">{filtered.length}</span> records
        </div>
      </div>

      {/* TABLE */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: tokens.card,
          border: `1px solid ${tokens.border}`,
        }}
      >
        {/* MOBILE */}
        <div className="sm:hidden">
          {filtered.length > 0 ? (
            filtered.map((s, i) => (
              <div
                key={s.id}
                className="flex items-center justify-between px-4 py-3"
                style={{
                  borderBottom:
                    i < filtered.length - 1
                      ? `1px solid ${tokens.border}`
                      : "none",
                }}
              >
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: tokens.text }}
                  >
                    {s.itemName}
                  </p>

                  <p className="text-xs mt-0.5" style={{ color: tokens.muted }}>
                    {s.date}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-bold"
                    style={{ color: tokens.text }}
                  >
                    {s.quantity}
                  </span>

                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={
                      s.type === "In"
                        ? {
                            background: "#d4e8d4",
                            color: "#2d6a2d",
                          }
                        : {
                            background: "#fbd8d4",
                            color: "#8a2a2a",
                          }
                    }
                  >
                    {s.type}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div
              className="px-4 py-8 text-center text-sm"
              style={{ color: tokens.muted }}
            >
              No records found.
            </div>
          )}
        </div>

        {/* DESKTOP */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  borderBottom: `1px solid ${tokens.border}`,
                }}
              >
                {["Item", "Type", "Qty", "Date"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase"
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
                  >
                    <td
                      className="px-4 py-3 font-medium"
                      style={{ color: tokens.text }}
                    >
                      {s.itemName}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={
                          s.type === "In"
                            ? {
                                background: "#d4e8d4",
                                color: "#2d6a2d",
                              }
                            : {
                                background: "#fbd8d4",
                                color: "#8a2a2a",
                              }
                        }
                      >
                        {s.type}
                      </span>
                    </td>

                    <td className="px-4 py-3" style={{ color: tokens.text }}>
                      {s.quantity}
                    </td>

                    <td className="px-4 py-3" style={{ color: tokens.sub }}>
                      {s.date}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-sm"
                    style={{ color: tokens.muted }}
                  >
                    No records found.
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

export default StockHistory;
