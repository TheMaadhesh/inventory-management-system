import { useTheme, Breadcrumb } from '../../Admin/Navbar';
import React, { useState, useRef, useEffect, useCallback } from "react";
import jsQR from "jsqr";
import axios from "axios";
import CameraAltOutlinedIcon    from "@mui/icons-material/CameraAltOutlined";
import UploadFileOutlinedIcon   from "@mui/icons-material/UploadFileOutlined";
import RefreshOutlinedIcon      from "@mui/icons-material/RefreshOutlined";
import StopCircleOutlinedIcon   from "@mui/icons-material/StopCircleOutlined";
import InventoryOutlinedIcon    from "@mui/icons-material/InventoryOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import ContentCopyOutlinedIcon  from "@mui/icons-material/ContentCopyOutlined";
import CheckOutlinedIcon        from "@mui/icons-material/CheckOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";

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

const DELIVERY_ADDRESSES = [
  { label: "Warehouse A – Main Hub",     address: "No. 12, Industrial Estate, Coimbatore – 641 021, Tamil Nadu, India" },
  { label: "Warehouse B – North Zone",   address: "Plot 7, Phase II, SIDCO Industrial Area, Salem – 636 004, Tamil Nadu, India" },
  { label: "Warehouse C – South Hub",    address: "SF No. 45/2, Ambattur Industrial Estate, Chennai – 600 058, Tamil Nadu, India" },
  { label: "Distribution Centre – West", address: "Survey No. 88, Kumbalgodu Industrial Area, Bengaluru – 560 074, Karnataka, India" },
  { label: "Regional Depot – East",      address: "Block 3, Sector 5, Durgapur Industrial Park, West Bengal – 713 214, India" },
];
const getDeliveryAddress = (itemId: number) => DELIVERY_ADDRESSES[itemId % DELIVERY_ADDRESSES.length];

const parseQrPayload = (raw: string): { itemId: number } | null => {
  const idLineMatch = raw.match(/Item ID\s*:\s*#?(\d+)/i);
  if (idLineMatch) { const id = parseInt(idLineMatch[1], 10); if (!isNaN(id)) return { itemId: id }; }
  const parts = raw.split(",");
  if (parts.length >= 1) { const id = parseInt(parts[0], 10); if (!isNaN(id)) return { itemId: id }; }
  return null;
};

const statusStyle = (qty: number, reorder: number): React.CSSProperties => {
  if (qty <= 0)       return { background: "#fbd8d4", color: "#8a2a2a" };
  if (qty <= reorder) return { background: "#fbe8c8", color: "#8a5a1a" };
  return { background: "#d4e8d4", color: "#2d6a2d" };
};
const statusLabel = (qty: number, reorder: number) =>
  qty <= 0 ? "Out of Stock" : qty <= reorder ? "Low Stock" : "In Stock";

const CopyAllBtn = ({ item, tokens, primary, fontFamily }: { item: InventoryItem; tokens: any; primary: string; fontFamily: string }) => {
  const [copied, setCopied] = useState(false);
  const delivery = getDeliveryAddress(item.itemId);
  const copy = () => {
    const text = [
      `Item Name: ${item.name}`,
      `Item ID: #${item.itemId}`,
      `Item Code: ${item.itemCode}`,
      `Category: ${item.categoryDescription || "—"}`,
      `Unit Price: ₹${(item.unitPrice ?? 0).toFixed(2)}`,
      `Stock: ${item.quantityInStock} units`,
      `Reorder Level: ${item.reOrderLevel}`,
      `Supplier: ${item.supplierName || "—"}`,
      item.description ? `Description: ${item.description}` : "",
      ``,
      `Delivery Address: ${delivery.label}`,
      delivery.address,
    ].filter(l => l !== undefined).join("\n");
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  };
  return (
    <button onClick={copy} style={{ width: "100%", padding: "10px 0", borderRadius: 12, background: copied ? "#22c55e" : tokens.cardHover, color: copied ? "#fff" : tokens.sub, border: `1.5px solid ${copied ? "#22c55e" : tokens.border}`, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "all 0.25s" }}>
      {copied ? <><CheckOutlinedIcon style={{ fontSize: 16 }} /> Values Copied!</> : <><ContentCopyOutlinedIcon style={{ fontSize: 16 }} /> Copy Values</>}
    </button>
  );
};

const ItemCard = ({ item, tokens, primary, fontFamily, onClear }: { item: InventoryItem; tokens: any; primary: string; fontFamily: string; onClear: () => void }) => {
  const qty = item.quantityInStock ?? 0;
  const reorder = item.reOrderLevel ?? 0;
  const price = item.unitPrice ?? 0;
  const delivery = getDeliveryAddress(item.itemId);
  const rows = [
    { label: "Item ID",        value: `#${item.itemId}` },
    { label: "Item Code",      value: item.itemCode },
    { label: "Category",       value: item.categoryDescription || "—" },
    { label: "Unit Price",     value: `$${price.toFixed(2)}` },
    { label: "Stock",          value: `${qty} units` },
    { label: "Reorder Level",  value: String(reorder) },
    { label: "Supplier",       value: item.supplierName || "—" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div>
          <span style={{ ...statusStyle(qty, reorder), fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, display: "inline-block", marginBottom: 6 }}>{statusLabel(qty, reorder)}</span>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: tokens.text, margin: "0 0 2px", fontFamily }}>{item.name}</h2>
          <p style={{ fontSize: 12, color: tokens.muted, margin: 0, fontFamily }}>{item.categoryDescription || "Uncategorised"} · {item.itemCode}</p>
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: `${primary}14`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <InventoryOutlinedIcon style={{ color: primary, fontSize: 22 }} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {rows.map(row => (
          <div key={row.label} style={{ display: "flex", alignItems: "center", background: tokens.cardHover, borderRadius: 10, padding: "8px 12px" }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: tokens.muted, margin: "0 0 2px", fontFamily }}>{row.label}</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: tokens.text, margin: 0, fontFamily, wordBreak: "break-all" }}>{row.value}</p>
            </div>
          </div>
        ))}
      </div>
      {item.description && (
        <div style={{ background: tokens.cardHover, borderRadius: 10, padding: "8px 12px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: tokens.muted, margin: "0 0 4px", fontFamily }}>Description</p>
          <p style={{ fontSize: 13, color: tokens.text, margin: 0, lineHeight: 1.5, fontFamily }}>{item.description}</p>
        </div>
      )}
      <div style={{ background: `${primary}0a`, border: `1px solid ${primary}25`, borderRadius: 12, padding: "10px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
          <LocalShippingOutlinedIcon style={{ fontSize: 16, color: primary }} />
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: primary, margin: 0, fontFamily }}>Delivery Address</p>
        </div>
        <p style={{ fontSize: 12, fontWeight: 700, color: tokens.text, margin: "0 0 2px", fontFamily }}>{delivery.label}</p>
        <p style={{ fontSize: 12, color: tokens.muted, margin: 0, lineHeight: 1.6, fontFamily }}>{delivery.address}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <CopyAllBtn item={item} tokens={tokens} primary={primary} fontFamily={fontFamily} />
        <button onClick={onClear} style={{ width: "100%", padding: "10px 0", borderRadius: 12, background: primary, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }} onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")} onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
          <RefreshOutlinedIcon style={{ fontSize: 16 }} /> Scan Again
        </button>
      </div>
    </div>
  );
};

const QRScan = () => {
  const { tokens, primary, fontFamily } = useTheme();
  const token = localStorage.getItem("token");
  const [scanMode, setScanMode] = useState<"camera" | "upload">("camera");
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState("");
  const [rawResult, setRawResult] = useState("");
  const [fetchState, setFetchState] = useState<"idle" | "loading" | "found" | "not_found">("idle");
  const [foundItem, setFoundItem] = useState<InventoryItem | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scanFrame = useCallback(() => {
    const video = videoRef.current; const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) { rafRef.current = requestAnimationFrame(scanFrame); return; }
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code) { handleQrDecoded(code.data); stopCamera(); return; }
    rafRef.current = requestAnimationFrame(scanFrame);
  }, []);

  const startCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      setCameraOn(true); rafRef.current = requestAnimationFrame(scanFrame);
    } catch { setError("Camera access denied. Please allow camera permission or use the upload option."); }
  };

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null; setCameraOn(false);
  };

  useEffect(() => { return () => stopCamera(); }, []);
  useEffect(() => { if (scanMode !== "camera") stopCamera(); }, [scanMode]);

  const handleQrDecoded = async (raw: string) => {
    setRawResult(raw);
    const parsed = parseQrPayload(raw);
    if (!parsed) { setFetchState("not_found"); return; }
    setFetchState("loading");
    try {
      const res = await axios.get<InventoryItem[]>("http://localhost:8080/api/admin/item/fetchAll", { headers: { Authorization: `Bearer ${token}` } });
      const items = Array.isArray(res.data) ? res.data : [];
      const match = items.find(i => i.itemId === parsed.itemId);
      if (match) { setFoundItem(match); setFetchState("found"); } else { setFetchState("not_found"); }
    } catch { setFetchState("not_found"); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas"); canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext("2d"); if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);
      if (code) handleQrDecoded(code.data); else setError("No QR code found in this image.");
    };
    img.src = URL.createObjectURL(file);
  };

  const reset = () => {
    setRawResult(""); setFoundItem(null); setFetchState("idle"); setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6" style={{ background: tokens.bg, minHeight: "100%", fontFamily, color: tokens.text }}>
      <div>
        <Breadcrumb page="QR Scanner" parent="QR Code" />
        <h1 className="text-xl sm:text-2xl font-bold" style={{ color: tokens.text, fontFamily }}>QR Code Scanner</h1>
        <p className="text-sm mt-0.5" style={{ color: tokens.muted, fontFamily }}>Scan an inventory QR code to view item details instantly.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {([
          { key: "camera", label: "Camera",      icon: <CameraAltOutlinedIcon fontSize="small" /> },
          { key: "upload", label: "Upload Image", icon: <UploadFileOutlinedIcon fontSize="small" /> },
        ] as const).map(m => (
          <button key={m.key} onClick={() => setScanMode(m.key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: scanMode === m.key ? primary : tokens.card, color: scanMode === m.key ? "#fff" : tokens.sub, border: `1px solid ${scanMode === m.key ? primary : tokens.border}`, fontFamily }}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full max-w-4xl">
        <div className="rounded-2xl p-4 sm:p-6 space-y-4" style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}>
          {scanMode === "camera" && (
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-full rounded-xl overflow-hidden" style={{ border: `2px solid ${cameraOn ? primary : tokens.border}`, aspectRatio: "1", maxWidth: 300, margin: "0 auto" }}>
                <video ref={videoRef} muted playsInline className="w-full h-full object-cover" style={{ display: cameraOn ? "block" : "none" }} />
                {!cameraOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ background: tokens.bg, color: tokens.muted }}>
                    <CameraAltOutlinedIcon style={{ fontSize: 44, opacity: 0.4 }} />
                    <p className="text-xs" style={{ fontFamily }}>Camera is off</p>
                  </div>
                )}
                {cameraOn && (
                  <div className="absolute inset-0 pointer-events-none">
                    {["top-2 left-2", "top-2 right-2", "bottom-2 left-2", "bottom-2 right-2"].map((pos, i) => (
                      <span key={i} className={`absolute w-5 h-5 border-2 ${pos}`} style={{ borderColor: primary, borderTopWidth: pos.includes("bottom") ? 0 : 2, borderBottomWidth: pos.includes("top") ? 0 : 2, borderLeftWidth: pos.includes("right") ? 0 : 2, borderRightWidth: pos.includes("left") ? 0 : 2 }} />
                    ))}
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} style={{ display: "none" }} />
              {!cameraOn
                ? <button onClick={startCamera} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold w-full sm:w-auto justify-center" style={{ background: primary, color: "#fff", fontFamily }}><CameraAltOutlinedIcon fontSize="small" /> Start Camera</button>
                : <button onClick={stopCamera} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold w-full sm:w-auto justify-center" style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.33)", fontFamily }}><StopCircleOutlinedIcon fontSize="small" /> Stop Camera</button>
              }
              {cameraOn && <p className="text-xs text-center" style={{ color: tokens.muted }}>Point camera at a QR code — scans automatically.</p>}
              {error && <p className="text-xs text-center px-3 py-2 rounded-lg w-full" style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444" }}>{error}</p>}
            </div>
          )}
          {scanMode === "upload" && (
            <label className="flex flex-col items-center justify-center w-full rounded-xl cursor-pointer" style={{ border: `2px dashed ${tokens.border}`, background: tokens.bg, color: tokens.muted, minHeight: 180 }} onMouseEnter={e => (e.currentTarget.style.borderColor = primary)} onMouseLeave={e => (e.currentTarget.style.borderColor = tokens.border)}>
              <UploadFileOutlinedIcon style={{ fontSize: 38, marginBottom: 8, opacity: 0.5 }} />
              <span className="text-sm font-medium">Click to upload QR image</span>
              <span className="text-xs mt-1">PNG, JPG supported</span>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          )}
        </div>

        <div className="rounded-2xl p-4 sm:p-5" style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}>
          <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: tokens.muted }}>Scan Result</p>
          {fetchState === "loading" && <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0" }}><div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${primary}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} /><p style={{ fontSize: 13, color: tokens.muted, margin: 0 }}>Looking up inventory item…</p></div>}
          {fetchState === "found" && foundItem && <ItemCard item={foundItem} tokens={tokens} primary={primary} fontFamily={fontFamily} onClear={reset} />}
          {fetchState === "not_found" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)", borderRadius: 12, padding: "12px 14px" }}>
                <ErrorOutlineOutlinedIcon style={{ color: "#ef4444", flexShrink: 0, marginTop: 1, fontSize: 20 }} />
                <div><p style={{ fontSize: 13, fontWeight: 600, color: "#ef4444", margin: "0 0 4px" }}>Item not found</p><p style={{ fontSize: 12, color: tokens.muted, margin: "0 0 6px" }}>QR code could not be matched to an inventory item.</p><p style={{ fontSize: 11, color: tokens.muted, wordBreak: "break-all", margin: 0 }}>Raw: <span style={{ fontFamily: "monospace" }}>{rawResult}</span></p></div>
              </div>
              <button onClick={reset} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium" style={{ alignSelf: "flex-start", background: tokens.cardHover, color: tokens.sub }}><RefreshOutlinedIcon fontSize="small" /> Try Again</button>
            </div>
          )}
          {fetchState === "idle" && <p className="text-sm" style={{ color: tokens.muted }}>No QR code scanned yet.</p>}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default QRScan;
