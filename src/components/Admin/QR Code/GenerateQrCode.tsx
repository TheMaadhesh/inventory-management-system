import { useTheme, Breadcrumb } from '../../Admin/Navbar';
import React, { useState, useEffect, useRef, useCallback } from "react";
import { QRCodeCanvas as QRCode } from "qrcode.react";
import QrCode2OutlinedIcon from "@mui/icons-material/QrCode2Outlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import axios from "axios";
import { ConfirmDialog, useConfirm } from "../../shared/ConfirmDialog";

interface InventoryItem {
  itemId: number;
  name: string;
  itemCode: string;
  description: string;
  quantityInStock: number;
  unitPrice: number;
  reOrderLevel: number;
  qrPath: string | null;
  categoryDescription: string;
  supplierName: string;
}

/** Build a human-readable QR payload that any scanner app (Google Lens etc.) can display.
 *  Format: plain-text block — no URL, no CSV — just labelled lines. */
const buildQrPayload = (item: InventoryItem): string => {
  const status = item.quantityInStock <= 0
    ? "Out of Stock"
    : item.quantityInStock <= item.reOrderLevel
      ? "Low Stock"
      : "In Stock";
  const delivery = item.quantityInStock <= 0
    ? "Awaiting Restock"
    : item.quantityInStock <= item.reOrderLevel
      ? "Limited Availability"
      : "Available";

  return [
    "=== INVENTORY ITEM ===",
    `Name        : ${item.name}`,
    `Item ID     : #${item.itemId}`,
    `Item Code   : ${item.itemCode}`,
    `Category    : ${item.categoryDescription || "—"}`,
    `Unit Price  : \u20B9${Number(item.unitPrice ?? 0).toFixed(2)}`,
    `Delivery    : ${delivery}`,
    `Stock       : ${item.quantityInStock} units (${status})`,
    `Reorder Lvl : ${item.reOrderLevel}`,
    `Supplier    : ${item.supplierName || "—"}`,
    item.description ? `Description : ${item.description}` : null,
    "======================",
  ].filter(Boolean).join("\n");
};

const isUrl = (val: string) =>
  /^(https?:\/\/|www\.)/i.test(val.trim());

const GenerateQrCode = () => {
  const { tokens, primary, fontFamily } = useTheme();
  const token = localStorage.getItem("token");
  const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();

  const [text, setText]               = useState("");
  const [qrValue, setQrValue]         = useState("");
  const [qrError, setQrError]         = useState("");

  // Inventory look-up
  const [allItems, setAllItems]       = useState<InventoryItem[]>([]);
  const [suggestions, setSuggestions] = useState<InventoryItem[]>([]);
  const [matchedItem, setMatchedItem] = useState<InventoryItem | null>(null);
  const [loadingItems, setLoadingItems] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch all inventory on mount
  useEffect(() => {
    setLoadingItems(true);
    axios
      .get<InventoryItem[]>("http://localhost:8080/api/admin/item/fetchAll", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setAllItems(Array.isArray(res.data) ? res.data : []))
      .catch(() => setAllItems([]))
      .finally(() => setLoadingItems(false));
  }, [token]);

  // Compute autocomplete suggestions whenever text changes
  useEffect(() => {
    const q = text.trim().toLowerCase();
    if (!q || isUrl(text)) {
      setSuggestions([]);
      setMatchedItem(null);
      return;
    }
    const hits = allItems
      .filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.itemCode.toLowerCase().includes(q)
      )
      .slice(0, 6);
    setSuggestions(hits);

    // Exact match → auto-select
    const exact = allItems.find(
      i => i.name.toLowerCase() === q || i.itemCode.toLowerCase() === q
    );
    setMatchedItem(exact ?? null);
  }, [text, allItems]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setSuggestions([]);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectItem = (item: InventoryItem) => {
    setText(item.name);
    setMatchedItem(item);
    setSuggestions([]);
  };

  const handleGenerate = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) { setQrError("Please enter an inventory name, item code, or URL."); return; }

    const label = matchedItem ? matchedItem.name : isUrl(trimmed) ? "this URL" : trimmed;
    const ok = await confirm({
      title: "Generate QR Code?",
      message: `Generate a QR code for "${label}"?`,
      confirmLabel: "Yes, Generate",
      cancelLabel: "Cancel",
      icon: "🔲",
    });
    if (!ok) return;

    setQrError("");

    if (isUrl(trimmed)) {
      setQrValue(trimmed);
      setMatchedItem(null);
      return;
    }

    const item =
      matchedItem ??
      allItems.find(
        i =>
          i.name.toLowerCase() === trimmed.toLowerCase() ||
          i.itemCode.toLowerCase() === trimmed.toLowerCase()
      );

    if (item) {
      setQrValue(buildQrPayload(item));
      setMatchedItem(item);
    } else {
      setQrValue(trimmed);
    }
  }, [text, matchedItem, allItems, confirm]);

  const handleDownload = () => {
    const canvas = document.getElementById("qrCode") as HTMLCanvasElement;
    if (canvas) {
      const link    = document.createElement("a");
      link.href     = canvas.toDataURL("image/png");
      link.download = matchedItem
        ? `QR_${matchedItem.name}_${matchedItem.itemCode}.png`
        : "qr-code.png";
      link.click();
    }
  };

  const handleClear = useCallback(async () => {
    if (!qrValue) { setText(""); setQrError(""); setMatchedItem(null); setSuggestions([]); return; }
    const ok = await confirm({
      title: "Clear QR Code?",
      message: "This will remove the current QR code and reset the form.",
      confirmLabel: "Yes, Clear",
      cancelLabel: "Cancel",
      icon: "🗑️",
    });
    if (ok) { setText(""); setQrValue(""); setQrError(""); setMatchedItem(null); setSuggestions([]); }
  }, [qrValue, confirm]);

  const dlBg  = `${primary}1a`;
  const dlClr = primary;

  return (
    <div
      className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6"
      style={{ background: tokens.bg, minHeight: "100%", fontFamily, color: tokens.text }}
    >
      <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} tokens={tokens} primary={primary} />
      {/* Header */}
      <div>
        <Breadcrumb page="Generate QR Code" parent="QR Code" />
        <h1 className="text-2xl font-bold" style={{ color: tokens.text, fontFamily }}>
          Generate QR Code
        </h1>
        <p className="text-sm mt-0.5" style={{ color: tokens.muted, fontFamily }}>
          Enter an inventory name or item code to generate its QR code, or paste any URL.
        </p>
      </div>

      {/* Card */}
      <div
        className="max-w-2xl rounded-2xl p-4 sm:p-8"
        style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}
      >
        <div className="flex flex-col md:flex-row gap-8 items-start">

          {/* Input column */}
          <div className="flex-1 w-full space-y-4">
            <div className="flex flex-col gap-1.5" ref={dropdownRef} style={{ position: "relative" }}>
              <label
                className="text-xs font-semibold tracking-wider uppercase"
                style={{ color: tokens.muted, fontFamily }}
              >
                Inventory Name, Item Code, or URL
              </label>

              <div style={{ position: "relative" }}>
                <SearchOutlinedIcon
                  fontSize="small"
                  style={{
                    position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                    color: tokens.muted, pointerEvents: "none",
                  }}
                />
                <input
                  type="text"
                  placeholder={loadingItems ? "Loading inventory…" : "e.g. Laptop, ITEM-001, https://…"}
                  value={text}
                  onChange={e => { setText(e.target.value); setQrValue(""); }}
                  onKeyDown={e => e.key === "Enter" && handleGenerate()}
                  className="rounded-lg py-2.5 text-sm outline-none transition-colors w-full"
                  style={{
                    paddingLeft: 34, paddingRight: 12,
                    background: tokens.bg,
                    color: tokens.text,
                    border: `1px solid ${tokens.border}`,
                    fontFamily,
                  }}
                />
              </div>

              {/* Autocomplete dropdown */}
              {suggestions.length > 0 && (
                <div
                  style={{
                    position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
                    background: tokens.card, border: `1px solid ${tokens.border}`,
                    borderRadius: 12, marginTop: 4,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    overflow: "hidden",
                  }}
                >
                  {suggestions.map(item => (
                    <button
                      key={item.itemId}
                      onMouseDown={() => selectItem(item)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        width: "100%", textAlign: "left",
                        padding: "9px 14px",
                        background: "transparent",
                        border: "none", cursor: "pointer",
                        borderBottom: `1px solid ${tokens.border}`,
                        fontFamily,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = tokens.cardHover)}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <QrCode2OutlinedIcon style={{ fontSize: 16, color: primary, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: tokens.text, margin: 0 }}>{item.name}</p>
                        <p style={{ fontSize: 11, color: tokens.muted, margin: 0 }}>
                          {item.itemCode} · ID #{item.itemId}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Matched item info chip */}
            {matchedItem && (
              <div
                className="rounded-xl px-3 py-2 text-xs flex gap-3 flex-wrap"
                style={{ background: `${primary}12`, border: `1px solid ${primary}30` }}
              >
                <span style={{ color: tokens.muted }}>
                  Item ID: <strong style={{ color: tokens.text }}>#{matchedItem.itemId}</strong>
                </span>
                <span style={{ color: tokens.muted }}>
                  Code: <strong style={{ color: tokens.text }}>{matchedItem.itemCode}</strong>
                </span>
                <span style={{ color: tokens.muted }}>
                  Category: <strong style={{ color: tokens.text }}>{matchedItem.categoryDescription || "—"}</strong>
                </span>
                <span style={{ color: tokens.muted }}>
                  Qty: <strong style={{ color: tokens.text }}>{matchedItem.quantityInStock}</strong>
                </span>
              </div>
            )}

            <button
              onClick={handleGenerate}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold w-full justify-center transition-opacity hover:opacity-90 active:scale-[0.98]"
              style={{ background: primary, color: "#fff", fontFamily }}
            >
              <QrCode2OutlinedIcon fontSize="small" />
              Generate QR Code
            </button>

            {qrError && (
              <p className="text-xs text-red-500 text-center font-medium">{qrError}</p>
            )}

            {!qrValue && (
              <p className="text-xs leading-relaxed" style={{ color: tokens.muted, fontFamily }}>
                Tip: Type an inventory name or item code to search from your stock, or paste a URL. Press{" "}
                <kbd
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                  style={{ background: tokens.border, color: tokens.sub }}
                >
                  Enter
                </kbd>{" "}
                to generate quickly.
              </p>
            )}
          </div>

          {/* QR preview column */}
          <div className="flex flex-col items-center gap-4">
            {qrValue ? (
              <>
                <div
                  className="p-4 rounded-xl shadow-sm"
                  style={{ background: "#ffffff", border: `1px solid ${tokens.border}` }}
                >
                  <QRCode
                    id="qrCode"
                    value={qrValue}
                    size={160}
                    bgColor="#ffffff"
                    fgColor="#111111"
                    level="H"
                    includeMargin
                  />
                </div>

                {/* Encoded preview label */}
                {matchedItem && (
                  <p className="text-xs text-center" style={{ color: tokens.muted, fontFamily, maxWidth: 200 }}>
                    QR encodes full item details readable by any scanner app
                  </p>
                )}

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                  style={{
                    background: dlBg,
                    color: dlClr,
                    border: `1px solid ${primary}33`,
                    fontFamily,
                  }}
                >
                  <DownloadOutlinedIcon fontSize="small" />
                  Download PNG
                </button>

                <button
                  onClick={handleClear}
                  className="text-xs underline underline-offset-2 transition-opacity hover:opacity-70"
                  style={{ color: tokens.muted, fontFamily }}
                >
                  Clear
                </button>
              </>
            ) : (
              <div
                className="w-48 h-48 flex flex-col items-center justify-center gap-2 rounded-xl"
                style={{ border: `2px dashed ${tokens.border}`, color: tokens.muted }}
              >
                <QrCode2OutlinedIcon style={{ fontSize: 44, opacity: 0.35 }} />
                <p className="text-xs text-center" style={{ fontFamily }}>
                  QR code will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateQrCode;
