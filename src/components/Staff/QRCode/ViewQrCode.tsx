import { useTheme, Breadcrumb } from '../StaffNavbar';
import React, { useState, useEffect, useRef, useCallback } from "react";
import { QRCodeCanvas as QRCode } from "qrcode.react";
import QrCode2OutlinedIcon  from "@mui/icons-material/QrCode2Outlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import SearchOutlinedIcon   from "@mui/icons-material/SearchOutlined";
import axios from "axios";

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
    `Unit Price  : $${Number(item.unitPrice ?? 0).toFixed(2)}`,
    `Delivery    : ${delivery}`,
    `Stock       : ${item.quantityInStock} units (${status})`,
    `Reorder Lvl : ${item.reOrderLevel}`,
    `Supplier    : ${item.supplierName || "—"}`,
    item.description ? `Description : ${item.description}` : null,
    "======================",
  ].filter(Boolean).join("\n");
};

const ViewQrCode = () => {
  const { tokens, primary, fontFamily, t } = useTheme();
  const token = localStorage.getItem("token");

  const [text, setText]               = useState("");
  const [qrValue, setQrValue]         = useState("");
  const [allItems, setAllItems]       = useState<InventoryItem[]>([]);
  const [suggestions, setSuggestions] = useState<InventoryItem[]>([]);
  const [matchedItem, setMatchedItem] = useState<InventoryItem | null>(null);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError]             = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch all items on mount
  useEffect(() => {
    setLoadingItems(true);
    axios.get<InventoryItem[]>("http://localhost:8080/api/staff/item/fetchAll", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => setAllItems(Array.isArray(res.data) ? res.data : []))
      .catch(() => setAllItems([]))
      .finally(() => setLoadingItems(false));
  }, [token]);

  // Autocomplete
  useEffect(() => {
    const q = text.trim().toLowerCase();
    if (!q) { setSuggestions([]); setMatchedItem(null); return; }
    const hits = allItems.filter(i =>
      i.name.toLowerCase().includes(q) || i.itemCode.toLowerCase().includes(q)
    ).slice(0, 6);
    setSuggestions(hits);
    const exact = allItems.find(i => i.name.toLowerCase() === q || i.itemCode.toLowerCase() === q);
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

  const handleGenerate = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) { setError("Please enter an inventory name or item code."); return; }
    setError("");
    const item = matchedItem ?? allItems.find(i =>
      i.name.toLowerCase() === trimmed.toLowerCase() ||
      i.itemCode.toLowerCase() === trimmed.toLowerCase()
    );
    if (item) {
      setQrValue(buildQrPayload(item));
      setMatchedItem(item);
    } else {
      setError("No matching inventory item found. Please select from the list.");
    }
  }, [text, matchedItem, allItems]);

  const handleDownload = () => {
    const canvas = document.getElementById("staffQrCode") as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = matchedItem ? `QR_${matchedItem.name}_${matchedItem.itemCode}.png` : "qr-code.png";
      link.click();
    }
  };

  return (
    <div style={{ background: tokens.bg, fontFamily, minHeight: "100%", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 16px 40px", boxSizing: "border-box" }}>
      <div style={{ width: "100%", maxWidth: 520 }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <Breadcrumb page={t("viewQr")} parent={t("qrCode")} />
          <h1 style={{ fontSize: "clamp(1.2rem, 4vw, 1.5rem)", fontWeight: 700, color: tokens.text, margin: "4px 0 4px" }}>Generate QR Code</h1>
          <p style={{ fontSize: 13, color: tokens.muted, margin: 0 }}>Search an inventory item by name or code to generate its QR code.</p>
        </div>

        {/* Main card */}
        <div style={{ background: tokens.card, border: `1px solid ${tokens.border}`, borderRadius: 20, padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>

          {/* Search input */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }} ref={dropdownRef}>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: tokens.muted }}>
              Inventory Name or Item Code
            </label>
            <div style={{ position: "relative" }}>
              <SearchOutlinedIcon fontSize="small" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: tokens.muted, pointerEvents: "none" }} />
              <input
                type="text"
                placeholder={loadingItems ? "Loading inventory…" : "e.g. Laptop, ITEM-001"}
                value={text}
                onChange={e => { setText(e.target.value); setQrValue(""); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleGenerate()}
                style={{ width: "100%", paddingLeft: 34, paddingRight: 12, paddingTop: 11, paddingBottom: 11, borderRadius: 12, border: `1.5px solid ${tokens.border}`, background: tokens.bg, color: tokens.text, fontSize: 14, fontFamily, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                onFocus={e => (e.currentTarget.style.borderColor = primary)}
                onBlur={e => (e.currentTarget.style.borderColor = tokens.border)}
              />
              {/* Autocomplete dropdown */}
              {suggestions.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: tokens.card, border: `1px solid ${tokens.border}`, borderRadius: 12, marginTop: 4, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden" }}>
                  {suggestions.map(item => (
                    <button key={item.itemId} onMouseDown={() => selectItem(item)}
                      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "9px 14px", background: "transparent", border: "none", cursor: "pointer", borderBottom: `1px solid ${tokens.border}`, fontFamily }}
                      onMouseEnter={e => (e.currentTarget.style.background = tokens.cardHover)}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <QrCode2OutlinedIcon style={{ fontSize: 16, color: primary, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: tokens.text, margin: 0 }}>{item.name}</p>
                        <p style={{ fontSize: 11, color: tokens.muted, margin: 0 }}>{item.itemCode} · ID #{item.itemId}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Matched item chip */}
            {matchedItem && (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", background: `${primary}10`, border: `1px solid ${primary}28`, borderRadius: 10, padding: "8px 12px" }}>
                <span style={{ fontSize: 12, color: tokens.muted }}>ID: <strong style={{ color: tokens.text }}>#{matchedItem.itemId}</strong></span>
                <span style={{ fontSize: 12, color: tokens.muted }}>Code: <strong style={{ color: tokens.text }}>{matchedItem.itemCode}</strong></span>
                <span style={{ fontSize: 12, color: tokens.muted }}>Category: <strong style={{ color: tokens.text }}>{matchedItem.categoryDescription || "—"}</strong></span>
                <span style={{ fontSize: 12, color: tokens.muted }}>Stock: <strong style={{ color: tokens.text }}>{matchedItem.quantityInStock}</strong></span>
              </div>
            )}

            <button onClick={handleGenerate}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 0", borderRadius: 12, background: primary, color: "#fff", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily, boxShadow: `0 4px 16px ${primary}38`, transition: "opacity 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.86")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
              <QrCode2OutlinedIcon style={{ fontSize: 18 }} /> Generate QR Code
            </button>

            {error && <p style={{ fontSize: 12, color: "#ef4444", textAlign: "center", margin: 0 }}>{error}</p>}
          </div>

          {/* Divider */}
          <div style={{ width: "100%", height: 1, background: tokens.border }} />

          {/* QR Preview */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%" }}>
            {qrValue ? (
              <>
                <div style={{ padding: 16, borderRadius: 20, background: "#fff", border: `1px solid ${tokens.border}`, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <QRCode
                    id="staffQrCode"
                    value={qrValue}
                    size={Math.min(220, typeof window !== "undefined" ? Math.min(window.innerWidth - 100, 220) : 220)}
                    bgColor="#ffffff"
                    fgColor="#1a1a2e"
                    level="H"
                    includeMargin
                  />
                  {matchedItem && (
                    <p style={{ fontSize: 12, color: "#666", maxWidth: 220, textAlign: "center", wordBreak: "break-word", lineHeight: 1.4, margin: 0, fontWeight: 600 }}>
                      {matchedItem.name}
                    </p>
                  )}
                </div>
                <p style={{ fontSize: 11, color: tokens.muted, textAlign: "center", margin: 0 }}>
                  QR encodes full item details — readable by Google Lens &amp; any scanner app
                </p>
                <button onClick={handleDownload}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 28px", borderRadius: 12, background: `${primary}14`, color: primary, border: `1.5px solid ${primary}38`, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily, transition: "background 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = `${primary}26`)}
                  onMouseLeave={e => (e.currentTarget.style.background = `${primary}14`)}>
                  <DownloadOutlinedIcon style={{ fontSize: 18 }} /> Download PNG
                </button>
                <button onClick={() => { setQrValue(""); setText(""); setMatchedItem(null); setSuggestions([]); }}
                  style={{ fontSize: 12, color: tokens.muted, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2 }}>
                  Clear
                </button>
              </>
            ) : (
              <div style={{ width: "100%", maxWidth: 260, aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, border: `2px dashed ${tokens.border}`, borderRadius: 20, background: tokens.bg, color: tokens.muted }}>
                <div style={{ width: 60, height: 60, borderRadius: 18, background: `${primary}10`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <QrCode2OutlinedIcon style={{ fontSize: 32, color: primary, opacity: 0.45 }} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: tokens.sub, margin: "0 0 4px" }}>No QR code yet</p>
                  <p style={{ fontSize: 12, color: tokens.muted, margin: 0 }}>Search an inventory item above</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewQrCode;
