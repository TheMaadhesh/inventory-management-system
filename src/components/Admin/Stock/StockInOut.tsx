import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme, Breadcrumb } from "../../Admin/Navbar";
import { ConfirmDialog, useConfirm } from "../../shared/ConfirmDialog";

interface ItemOption {
  itemId: number;
  name: string;
  quantityInStock: number;
  reOrderLevel: number;
  unitPrice?: number;
  categoryDescription?: string;
}
interface StockRow {
  id: number;
  itemName: string;
  type: "In" | "Out";
  quantity: number;
  date: string;
  remainingQty?: number;
}

const safeNum = (v: unknown) => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

/* ─── Alert Modal — shown for low stock / out of stock events ─── */
type AlertKind = "low_stock" | "out_of_stock" | "confirm_zero";

interface StockAlertProps {
  kind: AlertKind;
  item: ItemOption;
  qty: number;
  remaining: number;
  pct: number;
  onConfirm: () => void;
  onCancel: () => void;
  tokens: Record<string, string>;
  primary: string;
}

const StockAlert: React.FC<StockAlertProps> = ({
  kind,
  item,
  qty,
  remaining,
  pct,
  onConfirm,
  onCancel,
  tokens,
  primary,
}) => {
  const cfg = {
    out_of_stock: {
      icon: "🚨",
      color: "#ef4444",
      bg: "#ffd5d5",
      title: "Out of Stock",
      subtitle: "This item will be completely depleted",
      confirmLabel: "Confirm Stock Out",
      cancelLabel: "Cancel",
    },
    low_stock: {
      icon: "⚠️",
      color: "#f59e0b",
      bg: "#fff3cd",
      title: "Low Stock Alert",
      subtitle: "Stock will drop below 30% of reorder level",
      confirmLabel: "Proceed Anyway",
      cancelLabel: "Cancel",
    },
    confirm_zero: {
      icon: "🚨",
      color: "#ef4444",
      bg: "#ffd5d5",
      title: "Out of Stock After This",
      subtitle: "Stock will reach exactly 0 after this transaction",
      confirmLabel: "Confirm — Stock Out",
      cancelLabel: "Cancel",
    },
  }[kind];

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      />

      <motion.div
        className="relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: tokens.card, border: `2px solid ${cfg.color}40` }}
        initial={{ scale: 0.88, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 16 }}
        transition={{ type: "spring", stiffness: 340, damping: 38 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Colour stripe header */}
        <div
          className="px-5 pt-5 pb-4 text-center"
          style={{ background: cfg.bg }}
        >
          <div className="text-5xl mb-2">{cfg.icon}</div>
          <h2 className="text-base font-bold" style={{ color: cfg.color }}>
            {cfg.title}
          </h2>
          <p
            className="text-xs mt-0.5"
            style={{ color: cfg.color, opacity: 0.8 }}
          >
            {cfg.subtitle}
          </p>
        </div>

        {/* Item detail */}
        <div className="px-5 py-4 space-y-3">
          <div
            className="rounded-xl p-3 space-y-2"
            style={{ background: tokens.cardHover }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold" style={{ color: tokens.text }}>
                {item.name}
              </p>
              {item.categoryDescription && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: `${primary}18`, color: primary }}
                >
                  {item.categoryDescription}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div
                className="rounded-lg py-1.5"
                style={{ background: tokens.card }}
              >
                <p
                  className="text-xs font-semibold"
                  style={{ color: tokens.muted }}
                >
                  Current
                </p>
                <p
                  className="text-base font-bold"
                  style={{ color: tokens.text }}
                >
                  {item.quantityInStock}
                </p>
              </div>
              <div
                className="rounded-lg py-1.5"
                style={{ background: tokens.card }}
              >
                <p
                  className="text-xs font-semibold"
                  style={{ color: tokens.muted }}
                >
                  Removing
                </p>
                <p className="text-base font-bold" style={{ color: "#ef4444" }}>
                  −{qty}
                </p>
              </div>
              <div
                className="rounded-lg py-1.5"
                style={{ background: tokens.card }}
              >
                <p
                  className="text-xs font-semibold"
                  style={{ color: tokens.muted }}
                >
                  Remaining
                </p>
                <p
                  className="text-base font-bold"
                  style={{
                    color:
                      remaining <= 0
                        ? "#ef4444"
                        : remaining <= item.reOrderLevel
                          ? "#f59e0b"
                          : "#2d6a2d",
                  }}
                >
                  {remaining}
                </p>
              </div>
            </div>
            {/* Stock level bar */}
            <div>
              <div
                className="flex justify-between text-xs mb-1"
                style={{ color: tokens.muted }}
              >
                <span>Stock level after transaction</span>
                <span
                  style={{
                    color:
                      pct <= 0 ? "#ef4444" : pct < 30 ? "#f59e0b" : "#2d6a2d",
                    fontWeight: 700,
                  }}
                >
                  {pct <= 0 ? "OUT" : `${Math.round(pct)}%`}
                </span>
              </div>
              <div
                className="w-full h-2.5 rounded-full overflow-hidden"
                style={{ background: tokens.border }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(0, Math.min(100, pct))}%`,
                    background:
                      pct <= 0 ? "#ef4444" : pct < 30 ? "#f59e0b" : "#22c55e",
                  }}
                />
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-xs" style={{ color: tokens.muted }}>
                  Reorder level: {item.reOrderLevel} units
                </span>
              </div>
            </div>
          </div>

          {/* Warning message */}
          <div
            className="rounded-xl px-3 py-2.5 flex items-start gap-2"
            style={{
              background: `${cfg.color}10`,
              border: `1px solid ${cfg.color}30`,
            }}
          >
            <span className="text-base flex-shrink-0 mt-0.5">{cfg.icon}</span>
            <p className="text-xs leading-relaxed" style={{ color: cfg.color }}>
              {kind === "out_of_stock" || kind === "confirm_zero"
                ? `After removing ${qty} unit${qty !== 1 ? "s" : ""}, "${item.name}" will have 0 units remaining and will be marked as Out of Stock.`
                : `After removing ${qty} unit${qty !== 1 ? "s" : ""}, stock drops to ${remaining} units — below 30% of the reorder level (${item.reOrderLevel}). Consider restocking soon.`}
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-95"
              style={{
                background: tokens.cardHover,
                color: tokens.text,
                border: `1px solid ${tokens.border}`,
              }}
            >
              {cfg.cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
              style={{
                background: cfg.color,
                boxShadow: `0 4px 14px ${cfg.color}40`,
              }}
            >
              {cfg.confirmLabel}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─── Toast ─────────────────────────────────────────────────── */
interface ToastMsg {
  id: number;
  message: string;
  type: "success" | "error" | "warning" | "info";
}

const ToastStack: React.FC<{
  toasts: ToastMsg[];
  onRemove: (id: number) => void;
}> = ({ toasts, onRemove }) => {
  const colors = {
    success: { bg: "#d4e8d4", text: "#1e4d1e", icon: "✅" },
    error: { bg: "#fde8e8", text: "#7f1d1d", icon: "❌" },
    warning: { bg: "#fff3cd", text: "#7c4a00", icon: "⚠️" },
    info: { bg: "#dbeafe", text: "#1e3a5f", icon: "ℹ️" },
  };
  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-[9998] space-y-2 max-w-xs w-full sm:w-auto pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const c = colors[t.type];
          return (
            <motion.div
              key={t.id}
              className="flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium pointer-events-auto"
              style={{ background: c.bg, color: c.text }}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 340, damping: 38 }}
            >
              <span className="flex-shrink-0 mt-0.5">{c.icon}</span>
              <span className="flex-1 leading-snug">{t.message}</span>
              <button
                onClick={() => onRemove(t.id)}
                className="opacity-50 hover:opacity-100 text-base leading-none flex-shrink-0"
              >
                ×
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────────────── */
const StockInOut: React.FC = () => {
  const { tokens, primary } = useTheme();
  const token = localStorage.getItem("token");
  const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();

  const [items, setItems] = useState<ItemOption[]>([]);
  const [history, setHistory] = useState<StockRow[]>([]);
  const [form, setForm] = useState({
    itemId: "",
    type: "In",
    quantity: "",
    remarks: "",
  });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | "In" | "Out">("All");

  /* Alert modal state */
  const [alertState, setAlertState] = useState<{
    open: boolean;
    kind: AlertKind;
    item: ItemOption | null;
    qty: number;
    remaining: number;
    pct: number;
    resolve?: (v: boolean) => void;
  }>({
    open: false,
    kind: "low_stock",
    item: null,
    qty: 0,
    remaining: 0,
    pct: 0,
  });

  /* Toast stack */
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const addToast = (message: string, type: ToastMsg["type"] = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000,
    );
  };
  const removeToast = (id: number) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  /* Show alert modal — returns promise resolving to true (proceed) or false (cancel) */
  const showAlert = (
    kind: AlertKind,
    item: ItemOption,
    qty: number,
    remaining: number,
    pct: number,
  ): Promise<boolean> =>
    new Promise((resolve) =>
      setAlertState({ open: true, kind, item, qty, remaining, pct, resolve }),
    );

  const closeAlert = (result: boolean) => {
    setAlertState((s) => ({ ...s, open: false }));
    alertState.resolve?.(result);
  };

  const inp: React.CSSProperties = {
    background: tokens.cardHover,
    color: tokens.text,
    border: `1px solid ${tokens.border}`,
    borderRadius: 12,
    padding: "10px 14px",
    width: "100%",
    outline: "none",
    fontSize: "0.85rem",
  };

  /* Fetch items */
  const fetchItems = useCallback(async () => {
    try {
      const res = await axios.get<ItemOption[]>(
        "http://localhost:8080/api/admin/item/fetchAll",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch {
      /* silent */
    }
  }, [token]);

  /* Fetch history */
  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/admin/stock/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rows: StockRow[] = (res.data as any[]).map((s) => ({
        id: s.id ?? 0,
        itemName: s.item?.name ?? s.item?.itemName ?? "Unknown",
        type: s.type === "STOCK_IN" ? "In" : "Out",
        quantity: safeNum(s.quantity),
        remarks: s.remarks,
        date: s.transactionDate ? s.transactionDate.split("T")[0] : "—",
      }));
      setHistory(rows);
    } catch {
      /* silent */
    }
  }, [token]);

  useEffect(() => {
    fetchItems();
    fetchHistory();
  }, [fetchItems, fetchHistory]);

  /* Selected item live info */
  const selectedItem =
    items.find((i) => String(i.itemId) === form.itemId) ?? null;

  /* Live preview of qty after operation */
  const previewQty = selectedItem
    ? form.type === "In"
      ? selectedItem.quantityInStock + safeNum(form.quantity)
      : selectedItem.quantityInStock - safeNum(form.quantity)
    : null;

  /* Stock level % relative to reOrderLevel (as 100% baseline) */
  const stockPct = (qty: number, reorder: number) =>
    reorder > 0 ? (qty / reorder) * 100 : qty > 0 ? 100 : 0;

  /* ─── Submit with alert flow ─────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = safeNum(form.quantity);

    if (!form.itemId || qty <= 0) {
      addToast("Please select an item and enter a valid quantity.", "error");
      return;
    }

    if (!selectedItem) {
      addToast("Selected item not found.", "error");
      return;
    }

    /* ── Stock Out validation & alerts */
    if (form.type === "Out") {
      const remaining = selectedItem.quantityInStock - qty;

      /* Hard block — trying to remove more than available */
      if (qty > selectedItem.quantityInStock) {
        addToast(
          `Cannot remove ${qty} unit${qty !== 1 ? "s" : ""} — "${selectedItem.name}" only has ${selectedItem.quantityInStock} in stock. Quantity is out of stock.`,
          "error",
        );
        return;
      }

      /* Exact zero — confirm out-of-stock */
      if (remaining === 0) {
        const pct = 0;
        const proceed = await showAlert(
          "out_of_stock",
          selectedItem,
          qty,
          0,
          pct,
        );
        if (!proceed) return;
      } else {
        /* Drops below 30% of reorder level — warn */
        const afterPct = stockPct(remaining, selectedItem.reOrderLevel);
        const beforePct = stockPct(
          selectedItem.quantityInStock,
          selectedItem.reOrderLevel,
        );
        if (afterPct < 30 && beforePct >= 30) {
          /* Crosses the 30% threshold — low stock warning */
          const proceed = await showAlert(
            "low_stock",
            selectedItem,
            qty,
            remaining,
            afterPct,
          );
          if (!proceed) return;
        } else if (afterPct < 30) {
          /* Already below 30% but going further — still warn */
          const proceed = await showAlert(
            "low_stock",
            selectedItem,
            qty,
            remaining,
            afterPct,
          );
          if (!proceed) return;
        }
      }
    }

    /* ── Stock In: confirm before saving ── */
    if (form.type === "In") {
      const ok = await confirm({
        title: "Record Stock In?",
        message: `Add ${qty} unit${qty !== 1 ? "s" : ""} to "${selectedItem.name}"? Stock will go from ${selectedItem.quantityInStock} → ${selectedItem.quantityInStock + qty}.`,
        confirmLabel: "Yes, Record",
        cancelLabel: "Cancel",
        icon: "📥",
      });
      if (!ok) return;
      if (selectedItem.quantityInStock === 0) {
        addToast(
          `Restocking "${selectedItem.name}" from 0 → ${qty} units. 📥`,
          "info",
        );
      }
    }

    /* Save  */
    setSaving(true);
    try {
      const token = localStorage.getItem("token");

      let userId = null;

      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        userId = payload.id;
        console.log(userId);
      }
      await axios.post("http://localhost:8080/api/admin/stock/save", null, {
        params: {
          itemId: Number(form.itemId),
          quantity: qty,
          type: form.type === "In" ? "STOCK_IN" : "STOCK_OUT",
          remarks: form.remarks,
          userId: userId,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const newQty =
        form.type === "In"
          ? selectedItem.quantityInStock + qty
          : selectedItem.quantityInStock - qty;
      const exqty = Number(form.quantity);

      if (form.type === "In") {
        await axios.put("http://localhost:8080/api/admin/stock/update", null, {
          params: {
            id: Number(form.itemId),
            quantity: Number(exqty),
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        await axios.put(
          "http://localhost:8080/api/admin/stock/decrease",
          null,
          {
            params: {
              id: Number(form.itemId),
              quantity: Number(exqty),
            },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
      }

      

      /* Post-save alerts */
      if (form.type === "Out") {
        if (newQty === 0) {
          addToast(
            `🚨 "${selectedItem.name}" is now OUT OF STOCK (0 units remaining). Add stock immediately.`,
            "error",
          );
        } else if (stockPct(newQty, selectedItem.reOrderLevel) < 30) {
          addToast(
            `⚠️ Low stock alert: "${selectedItem.name}" now has only ${newQty} units — below 30% of reorder level.`,
            "warning",
          );
        } else {
          addToast(
            `Stock Out recorded. "${selectedItem.name}": ${selectedItem.quantityInStock} → ${newQty} units.`,
            "success",
          );
        }
      } else {
        addToast(
          `Stock In recorded. "${selectedItem.name}": ${selectedItem.quantityInStock} → ${newQty} units. ✅`,
          "success",
        );
      }

      setForm({ itemId: "", type: "In", quantity: "", remarks: "" });
      await fetchHistory();
      await fetchItems();
    } catch (err: unknown) {
      if (axios.isAxiosError(err))
        addToast(
          err.response?.data?.message || "Failed to record stock movement.",
          "error",
        );
      else addToast("Server error — please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  /* Totals */
  const totalIn = history
    .filter((s) => s.type === "In")
    .reduce((a, s) => a + s.quantity, 0);
  const totalOut = history
    .filter((s) => s.type === "Out")
    .reduce((a, s) => a + s.quantity, 0);
  const netStock = totalIn - totalOut;

  /* Filtered history */
  const filtered = history.filter((s) => {
    const q = search.toLowerCase();
    return (
      (!q || s.itemName.toLowerCase().includes(q)) &&
      (typeFilter === "All" || s.type === typeFilter)
    );
  });

  /* Low stock items for sidebar alert strip */
  const lowStockItems = items.filter(
    (i) =>
      i.quantityInStock <= 0 ||
      stockPct(i.quantityInStock, i.reOrderLevel) < 30,
  );

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">
      <ConfirmDialog
        {...confirmState}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        tokens={tokens}
        primary={primary}
      />
      {/* Alert Modal */}
      <AnimatePresence>
        {alertState.open && alertState.item && (
          <StockAlert
            kind={alertState.kind}
            item={alertState.item}
            qty={alertState.qty}
            remaining={alertState.remaining}
            pct={alertState.pct}
            tokens={tokens}
            primary={primary}
            onConfirm={() => closeAlert(true)}
            onCancel={() => closeAlert(false)}
          />
        )}
      </AnimatePresence>

      {/* Toast Stack */}
      <ToastStack toasts={toasts} onRemove={removeToast} />

      <Breadcrumb page="Stock In/Out" parent="Stock" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: tokens.text }}>
            Stock Movement
          </h1>
          <p className="text-sm" style={{ color: tokens.muted }}>
            Record and track inventory stock in/out
          </p>
        </div>
        {lowStockItems.length > 0 && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
            style={{
              background: "#fff3cd",
              color: "#7c4a00",
              border: "1px solid #f59e0b40",
            }}
          >
            <span>⚠️</span>
            <span>
              {lowStockItems.length} item{lowStockItems.length !== 1 ? "s" : ""}{" "}
              need restocking
            </span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          {
            label: "Total Stock In",
            value: totalIn,
            bg: "#d4e8d4",
            c: "#2d6a2d",
            icon: "📥",
          },
          {
            label: "Total Stock Out",
            value: totalOut,
            bg: "#fbd8d4",
            c: "#8a2a2a",
            icon: "📤",
          },
          {
            label: "Net Movement",
            value: netStock,
            bg: netStock >= 0 ? "#d4e8d4" : "#fbd8d4",
            c: netStock >= 0 ? "#2d6a2d" : "#8a2a2a",
            icon: "📊",
          },
          {
            label: "Low Stock Items",
            value: lowStockItems.length,
            bg: lowStockItems.length > 0 ? "#fff3cd" : tokens.cardHover,
            c: lowStockItems.length > 0 ? "#7c4a00" : tokens.muted,
            icon: "⚠️",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-3 sm:p-4"
            style={{ background: s.bg, border: `1px solid ${tokens.border}` }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-lg">{s.icon}</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold" style={{ color: s.c }}>
              {s.value.toLocaleString()}
            </p>
            <p className="text-xs mt-0.5" style={{ color: s.c, opacity: 0.75 }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Low Stock Alert Strip */}
      {lowStockItems.length > 0 && (
        <div
          className="rounded-2xl p-3 sm:p-4 space-y-2"
          style={{ background: "#fff8e6", border: "1px solid #f59e0b50" }}
        >
          <p
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: "#7c4a00" }}
          >
            ⚠️ Items Needing Attention ({lowStockItems.length})
          </p>
          <div className="space-y-1.5">
            {lowStockItems.slice(0, 5).map((item) => {
              const pct = stockPct(item.quantityInStock, item.reOrderLevel);
              const isOut = item.quantityInStock <= 0;
              return (
                <div key={item.itemId} className="flex items-center gap-3">
                  <span className="text-sm flex-shrink-0">
                    {isOut ? "🚨" : "⚠️"}
                  </span>
                  <span
                    className="text-xs font-semibold flex-shrink-0 min-w-0 truncate"
                    style={{ color: "#7c4a00", maxWidth: 140 }}
                  >
                    {item.name}
                  </span>
                  <div
                    className="flex-1 h-2 rounded-full overflow-hidden min-w-0"
                    style={{ background: "#f0e4c2" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, Math.max(0, pct))}%`,
                        background: isOut ? "#ef4444" : "#f59e0b",
                      }}
                    />
                  </div>
                  <span
                    className="text-xs font-bold flex-shrink-0"
                    style={{
                      color: isOut ? "#ef4444" : "#7c4a00",
                      minWidth: 56,
                      textAlign: "right",
                    }}
                  >
                    {isOut ? "OUT" : `${item.quantityInStock} left`}
                  </span>
                </div>
              );
            })}
            {lowStockItems.length > 5 && (
              <p className="text-xs" style={{ color: "#7c4a00" }}>
                +{lowStockItems.length - 5} more items below threshold
              </p>
            )}
          </div>
        </div>
      )}

      {/* Record Form */}
      <div
        className="rounded-2xl p-4 sm:p-5 space-y-4"
        style={{
          background: tokens.card,
          border: `1px solid ${tokens.border}`,
        }}
      >
        <div>
          <h3 className="font-bold text-sm" style={{ color: tokens.text }}>
            Record Stock Movement
          </h3>
          <p className="text-xs mt-0.5" style={{ color: tokens.muted }}>
            Select item, movement type, and quantity
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Item dropdown */}
            <div>
              <label
                className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                style={{ color: tokens.muted }}
              >
                Item
              </label>
              <select
                style={{ ...inp, appearance: "none", cursor: "pointer" }}
                required
                value={form.itemId}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    itemId: e.target.value,
                    quantity: "",
                  }))
                }
              >
                <option value="">— Select Item —</option>
                {items.map((i) => {
                  const pct = stockPct(i.quantityInStock, i.reOrderLevel);
                  const tag =
                    i.quantityInStock <= 0 ? " 🚨" : pct < 30 ? " ⚠️" : "";
                  return (
                    <option key={i.itemId} value={i.itemId}>
                      {i.name} — {i.quantityInStock} units{tag}
                    </option>
                  );
                })}
              </select>

              {/* Live item info panel */}
              {selectedItem && (
                <div
                  className="mt-2 rounded-xl p-2.5 space-y-2"
                  style={{
                    background: tokens.cardHover,
                    border: `1px solid ${tokens.border}`,
                  }}
                >
                  <div className="flex justify-between text-xs">
                    <span style={{ color: tokens.muted }}>Current stock</span>
                    <span
                      className="font-bold"
                      style={{
                        color:
                          selectedItem.quantityInStock <= 0
                            ? "#ef4444"
                            : stockPct(
                                  selectedItem.quantityInStock,
                                  selectedItem.reOrderLevel,
                                ) < 30
                              ? "#f59e0b"
                              : "#2d6a2d",
                      }}
                    >
                      {selectedItem.quantityInStock} units
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: tokens.muted }}>Reorder level</span>
                    <span
                      className="font-semibold"
                      style={{ color: tokens.text }}
                    >
                      {selectedItem.reOrderLevel} units
                    </span>
                  </div>
                  {/* Current stock bar */}
                  <div>
                    <div
                      className="w-full h-2 rounded-full overflow-hidden"
                      style={{ background: tokens.border }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, Math.max(0, stockPct(selectedItem.quantityInStock, selectedItem.reOrderLevel)))}%`,
                          background:
                            selectedItem.quantityInStock <= 0
                              ? "#ef4444"
                              : stockPct(
                                    selectedItem.quantityInStock,
                                    selectedItem.reOrderLevel,
                                  ) < 30
                                ? "#f59e0b"
                                : "#22c55e",
                        }}
                      />
                    </div>
                    <p
                      className="text-[10px] mt-0.5"
                      style={{ color: tokens.muted }}
                    >
                      {selectedItem.quantityInStock <= 0
                        ? "🚨 Out of stock"
                        : stockPct(
                              selectedItem.quantityInStock,
                              selectedItem.reOrderLevel,
                            ) < 30
                          ? "⚠️ Below 30% of reorder level"
                          : "✅ Stock level OK"}
                    </p>
                  </div>
                  {/* Preview after operation */}
                  {form.quantity &&
                    safeNum(form.quantity) > 0 &&
                    previewQty !== null && (
                      <div
                        className="rounded-lg px-2.5 py-1.5"
                        style={{
                          background:
                            previewQty <= 0
                              ? "#fde8e8"
                              : stockPct(
                                    previewQty,
                                    selectedItem.reOrderLevel,
                                  ) < 30
                                ? "#fff3cd"
                                : "#d4e8d4",
                        }}
                      >
                        <p
                          className="text-xs font-semibold"
                          style={{
                            color:
                              previewQty <= 0
                                ? "#7f1d1d"
                                : stockPct(
                                      previewQty,
                                      selectedItem.reOrderLevel,
                                    ) < 30
                                  ? "#7c4a00"
                                  : "#1e4d1e",
                          }}
                        >
                          After this: {selectedItem.quantityInStock} →{" "}
                          {previewQty} units
                          {previewQty <= 0
                            ? " 🚨 Out of Stock"
                            : stockPct(previewQty, selectedItem.reOrderLevel) <
                                30
                              ? " ⚠️ Low Stock"
                              : " ✅"}
                        </p>
                      </div>
                    )}
                </div>
              )}
              {/* Remarks */}
              <div className="sm:col-span-3">
                <label
                  className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                  style={{ color: tokens.muted }}
                >
                  Remarks
                </label>

                <input
                  style={inp}
                  type="text"
                  placeholder="Optional notes (e.g. damaged item, restock from supplier)"
                  value={form.remarks}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, remarks: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Type toggle */}
            <div>
              <label
                className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                style={{ color: tokens.muted }}
              >
                Type
              </label>
              <div className="flex gap-2 h-[42px]">
                {(["In", "Out"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() =>
                      setForm((p) => ({ ...p, type: t, quantity: "" }))
                    }
                    className="flex-1 rounded-xl text-sm font-bold transition-all"
                    style={
                      form.type === t
                        ? {
                            background: t === "In" ? "#2d6a2d" : "#8a2a2a",
                            color: "#fff",
                            boxShadow: `0 4px 12px ${t === "In" ? "#2d6a2d" : "#8a2a2a"}40`,
                          }
                        : {
                            background: tokens.cardHover,
                            color: tokens.muted,
                            border: `1px solid ${tokens.border}`,
                          }
                    }
                  >
                    {t === "In" ? "📥 Stock In" : "📤 Stock Out"}
                  </button>
                ))}
              </div>
              {form.type === "Out" && selectedItem && (
                <p className="text-xs mt-1.5" style={{ color: tokens.muted }}>
                  Max you can remove:{" "}
                  <strong style={{ color: tokens.text }}>
                    {selectedItem.quantityInStock}
                  </strong>{" "}
                  units
                </p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label
                className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                style={{ color: tokens.muted }}
              >
                Quantity
              </label>
              <input
                style={inp}
                type="number"
                min="1"
                max={
                  form.type === "Out" && selectedItem
                    ? selectedItem.quantityInStock
                    : undefined
                }
                placeholder={
                  form.type === "Out" && selectedItem
                    ? `Max: ${selectedItem.quantityInStock}`
                    : "Enter quantity"
                }
                required
                value={form.quantity}
                onChange={(e) =>
                  setForm((p) => ({ ...p, quantity: e.target.value }))
                }
              />

              {/* Quantity warning inline */}
              {form.type === "Out" &&
                selectedItem &&
                form.quantity &&
                safeNum(form.quantity) > 0 &&
                (() => {
                  const qty = safeNum(form.quantity);
                  const remaining = selectedItem.quantityInStock - qty;
                  if (qty > selectedItem.quantityInStock) {
                    return (
                      <p
                        className="text-xs mt-1 font-semibold"
                        style={{ color: "#ef4444" }}
                      >
                        🚨 Exceeds available stock (
                        {selectedItem.quantityInStock} units) — quantity is out
                        of stock
                      </p>
                    );
                  }
                  if (remaining === 0) {
                    return (
                      <p
                        className="text-xs mt-1 font-semibold"
                        style={{ color: "#ef4444" }}
                      >
                        🚨 This will make the item Out of Stock
                      </p>
                    );
                  }
                  if (stockPct(remaining, selectedItem.reOrderLevel) < 30) {
                    return (
                      <p
                        className="text-xs mt-1 font-semibold"
                        style={{ color: "#f59e0b" }}
                      >
                        ⚠️ Stock will drop below 30% of reorder level
                      </p>
                    );
                  }
                  return null;
                })()}
            </div>
          </div>

          <div
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 pt-3"
            style={{ borderTop: `1px solid ${tokens.border}` }}
          >
            <p className="text-xs" style={{ color: tokens.muted }}>
              {form.type === "Out" &&
              selectedItem &&
              safeNum(form.quantity) === selectedItem.quantityInStock
                ? "⚠️ You are about to remove all remaining stock."
                : form.type === "Out" && selectedItem
                  ? `Removing stock from "${selectedItem.name}"`
                  : selectedItem
                    ? `Adding stock to "${selectedItem.name}"`
                    : "Select an item to record movement"}
            </p>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all hover:brightness-110 active:scale-[0.98] flex-shrink-0"
              style={{ background: form.type === "In" ? "#2d6a2d" : "#8a2a2a" }}
            >
              {saving ? "Saving…" : `Record Stock ${form.type}`}
            </button>
          </div>
        </form>
      </div>

      {/* History Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: tokens.card,
          border: `1px solid ${tokens.border}`,
        }}
      >
        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-5 py-3 sm:py-4"
          style={{ borderBottom: `1px solid ${tokens.border}` }}
        >
          <div>
            <h3 className="font-bold text-sm" style={{ color: tokens.text }}>
              Stock History
            </h3>
            <p className="text-xs" style={{ color: tokens.muted }}>
              {filtered.length} records
            </p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <input
              type="text"
              placeholder="Search item…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs outline-none flex-1 sm:w-36 sm:flex-none"
              style={{
                background: tokens.cardHover,
                color: tokens.text,
                border: `1px solid ${tokens.border}`,
              }}
            />
            {(["All", "In", "Out"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={
                  typeFilter === f
                    ? { background: primary, color: "#fff" }
                    : {
                        background: tokens.cardHover,
                        color: tokens.muted,
                        border: `1px solid ${tokens.border}`,
                      }
                }
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile */}
        <div className="sm:hidden">
          {filtered.length > 0 ? (
            filtered.map((row, i) => (
              <div
                key={row.id}
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
                    {row.itemName}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: tokens.muted }}>
                    {row.date}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="text-sm font-bold"
                    style={{ color: row.type === "In" ? "#2d6a2d" : "#8a2a2a" }}
                  >
                    {row.type === "In" ? "+" : "−"}
                    {row.quantity}
                  </span>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={
                      row.type === "In"
                        ? { background: "#d4e8d4", color: "#2d6a2d" }
                        : { background: "#fbd8d4", color: "#8a2a2a" }
                    }
                  >
                    {row.type === "In" ? "📥" : "📤"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div
              className="px-4 py-8 text-center text-sm"
              style={{ color: tokens.muted }}
            >
              {search || typeFilter !== "All"
                ? "No records match your filters."
                : "No stock transactions yet."}
            </div>
          )}
        </div>

        {/* Desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${tokens.border}` }}>
                {["#", "Item Name", "Type", "Qty Change", "Date"].map((h) => (
                  <th
                    key={h}
                    className="px-4 sm:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: tokens.muted }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((row, i) => (
                  <tr
                    key={row.id}
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
                    <td
                      className="px-4 sm:px-5 py-3 text-xs"
                      style={{ color: tokens.muted }}
                    >
                      #{row.id}
                    </td>
                    <td
                      className="px-4 sm:px-5 py-3 font-medium"
                      style={{ color: tokens.text }}
                    >
                      {row.itemName}
                    </td>
                    <td className="px-4 sm:px-5 py-3">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={
                          row.type === "In"
                            ? { background: "#d4e8d4", color: "#2d6a2d" }
                            : { background: "#fbd8d4", color: "#8a2a2a" }
                        }
                      >
                        {row.type === "In" ? "📥 Stock In" : "📤 Stock Out"}
                      </span>
                    </td>
                    <td
                      className="px-4 sm:px-5 py-3 font-bold"
                      style={{
                        color: row.type === "In" ? "#2d6a2d" : "#8a2a2a",
                      }}
                    >
                      {row.type === "In" ? "+" : "−"}
                      {row.quantity}
                    </td>
                    <td
                      className="px-4 sm:px-5 py-3"
                      style={{ color: tokens.muted }}
                    >
                      {row.date}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-sm"
                    style={{ color: tokens.muted }}
                  >
                    {search || typeFilter !== "All"
                      ? "No records match your filters."
                      : "No stock transactions yet."}
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

export default StockInOut;
