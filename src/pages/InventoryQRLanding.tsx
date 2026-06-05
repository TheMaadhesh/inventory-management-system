import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

interface Item {
  itemId: number; name: string; itemCode: string;
  description: string; quantityInStock: number;
  unitPrice: number; reOrderLevel: number;
  categoryDescription: string; supplierName: string;
}

const getStatus = (qty: number, reOrder: number) =>
  qty <= 0 ? "Out of Stock" : qty <= reOrder ? "Low Stock" : "In Stock";

const STATUS_CFG: Record<string,{bg:string;color:string}> = {
  "In Stock":     { bg:"#d4e8d4", color:"#1a5c1a"  },
  "Low Stock":    { bg:"#fde8c8", color:"#7a4a10"  },
  "Out of Stock": { bg:"#fbd8d4", color:"#7a1a1a"  },
};

const DELIVERY_CFG: Record<string,{bg:string;color:string;label:string}> = {
  "In Stock":     { bg:"#e0f7f4", color:"#005946", label:"🚚 Available for Delivery" },
  "Low Stock":    { bg:"#fff8e1", color:"#7a5000", label:"⏳ Limited — Order Soon"  },
  "Out of Stock": { bg:"#fce4ec", color:"#7b0030", label:"🚫 Currently Unavailable" },
};

const f = (label: string, style: object, children: React.ReactNode) => (
  <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"10px 14px", borderRadius:10, marginBottom:6, ...style }}>
    <span style={{ fontSize:11, fontWeight:600, letterSpacing:"0.07em", textTransform:"uppercase", color:"#888", flexShrink:0 }}>{label}</span>
    <span style={{ fontSize:14, fontWeight:600, color:"#111", textAlign:"right", marginLeft:12, maxWidth:"60%", wordBreak:"break-word" }}>{children}</span>
  </div>
);

export default function InventoryQRLanding() {
  const [params]  = useSearchParams();
  const id        = params.get("id");
  const [item, setItem]     = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!id) { setError("No item ID provided."); setLoading(false); return; }
    axios.get(`http://localhost:8080/api/public/item/${id}`)
      .then(r => { setItem(r.data); setLoading(false); })
      .catch(() => { setError("Item not found or server unavailable."); setLoading(false); });
  }, [id]);

  const page: React.CSSProperties = {
    minHeight:"100vh", background:"#f0f2f5",
    fontFamily:"system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    display:"flex", alignItems:"flex-start", justifyContent:"center",
    padding:"24px 14px 48px", boxSizing:"border-box",
  };
  const receipt: React.CSSProperties = {
    width:"100%", maxWidth:420,
    background:"#fff", borderRadius:20,
    boxShadow:"0 8px 40px rgba(0,0,0,0.13)",
    overflow:"hidden",
  };

  if (loading) return (
    <div style={page}>
      <div style={{ ...receipt, padding:40, textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:12 }}>⏳</div>
        <p style={{ fontSize:14, color:"#666" }}>Loading item details…</p>
      </div>
    </div>
  );
  if (error || !item) return (
    <div style={page}>
      <div style={{ ...receipt, padding:40, textAlign:"center" }}>
        <div style={{ fontSize:52, marginBottom:12 }}>❌</div>
        <p style={{ fontSize:16, fontWeight:700, color:"#111", marginBottom:6 }}>Item Not Found</p>
        <p style={{ fontSize:13, color:"#888" }}>{error || "This inventory item could not be found."}</p>
      </div>
    </div>
  );

  const status  = getStatus(item.quantityInStock, item.reOrderLevel);
  const ss      = STATUS_CFG[status];
  const ds      = DELIVERY_CFG[status];
  const pct     = Math.min(100, Math.round((item.quantityInStock / Math.max(item.reOrderLevel * 3, 1)) * 100));
  const barClr  = status === "Out of Stock" ? "#ef4444" : status === "Low Stock" ? "#f59e0b" : "#22c55e";

  return (
    <div style={page}>
      <div style={receipt}>
        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#1a2e4a 0%,#2563eb 100%)", padding:"24px 20px 20px", color:"#fff" }}>
          <p style={{ fontSize:10, letterSpacing:"0.14em", opacity:0.65, marginBottom:8, textTransform:"uppercase" }}>
            IIM · Inventory Item
          </p>
          <h1 style={{ fontSize:22, fontWeight:700, margin:"0 0 4px", lineHeight:1.2 }}>{item.name}</h1>
          <p style={{ fontSize:12, opacity:0.75, margin:0 }}>SKU: {item.itemCode} · ID: #{item.itemId}</p>
          <div style={{ display:"flex", gap:8, marginTop:14, flexWrap:"wrap" }}>
            <span style={{ ...ss, padding:"5px 12px", borderRadius:20, fontSize:12, fontWeight:600 }}>
              {status === "In Stock" ? "✅" : status === "Low Stock" ? "⚠️" : "❌"} {status}
            </span>
            <span style={{ ...ds, padding:"5px 12px", borderRadius:20, fontSize:12, fontWeight:600 }}>
              {ds.label}
            </span>
          </div>
        </div>

        {/* Price highlight */}
        <div style={{ padding:"14px 18px 0" }}>
          <div style={{ background:"#f0fdf4", border:"1.5px solid #bbf7d0", borderRadius:12, padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:12, color:"#166534", fontWeight:500 }}>Unit Price</span>
            <span style={{ fontSize:22, fontWeight:700, color:"#15803d" }}>${item.unitPrice?.toFixed(2)}</span>
          </div>
        </div>

        {/* Detail rows */}
        <div style={{ padding:"12px 18px 0" }}>
          {[
            ["ITEM ID",      `#${item.itemId}`],
            ["CATEGORY",     item.categoryDescription || "—"],
            ["SUPPLIER",     item.supplierName || "—"],
            ["STOCK",        `${item.quantityInStock} units`],
            ["REORDER AT",   `${item.reOrderLevel} units`],
          ].map(([label, value]) =>
            f(label, { background:"#f8f9fb" }, value)
          )}
        </div>

        {/* Stock bar */}
        <div style={{ padding:"10px 18px 0" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
            <span style={{ fontSize:11, color:"#888" }}>Stock Level</span>
            <span style={{ fontSize:11, fontWeight:700, color: barClr }}>{pct}%</span>
          </div>
          <div style={{ height:8, borderRadius:99, background:"#eee", overflow:"hidden" }}>
            <div style={{ height:"100%", borderRadius:99, background: barClr, width:`${pct}%`, transition:"width 0.6s ease" }} />
          </div>
        </div>

        {/* Description */}
        {item.description && (
          <div style={{ margin:"12px 18px 0", padding:"10px 14px", background:"#f8f9fb", borderRadius:10 }}>
            <p style={{ fontSize:11, color:"#888", fontWeight:600, marginBottom:4 }}>DESCRIPTION</p>
            <p style={{ fontSize:13, color:"#333", lineHeight:1.5, margin:0 }}>{item.description}</p>
          </div>
        )}

        {/* Receipt footer */}
        <div style={{ margin:"14px 0 0", padding:"12px 18px 18px", borderTop:"1px dashed #e0e0e0", textAlign:"center" }}>
          <p style={{ fontSize:11, color:"#bbb", margin:0 }}>Powered by IIM Inventory System</p>
          <p style={{ fontSize:10, color:"#ccc", marginTop:2 }}>Scanned via QR Code</p>
        </div>
      </div>
    </div>
  );
}
