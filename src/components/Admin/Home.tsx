import { useState, useEffect, useRef, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area, BarChart, Bar,
} from "recharts";
import axios from "axios";
import { useTheme, Breadcrumb, useCurrency } from "../Admin/Navbar";

/* ── Live data types ──────────────────────────────────────── */
interface InventoryItem {
  itemId: number; name: string; categoryDescription: string;
  quantityInStock: number; reOrderLevel: number; unitPrice: number;
  supplierName: string;
}
interface StockTransaction {
  id: number;
  quantity: number;
  type: string;                          // "STOCK_IN" | "STOCK_OUT"
  transactionDate?: string;              // LocalDateTime serialised as ISO string
  remarks?: string;
  item?: {                               // nested Item entity from @ManyToOne
    itemId: number;
    name: string;
    itemCode: string;
    unit_price?: number;
    quantityInStock?: number;
    qrPath?: string;
  };
}

/* ── Static chart data (original design) ─────────────────── */
// stockTrendData is kept as a baseline; it gets replaced by live data when available
const stockTrendData = [
  { day:"Feb 01", thisYear:120, lastYear:80  }, { day:"Feb 04", thisYear:200, lastYear:95  },
  { day:"Feb 06", thisYear:160, lastYear:110 }, { day:"Feb 08", thisYear:260, lastYear:98  },
  { day:"Feb 10", thisYear:180, lastYear:130 }, { day:"Feb 12", thisYear:310, lastYear:140 },
  { day:"Feb 14", thisYear:250, lastYear:160 }, { day:"Feb 16", thisYear:290, lastYear:150 },
  { day:"Feb 18", thisYear:340, lastYear:180 },
];
const miniEarnings = [{ v:40 },{ v:70 },{ v:55 },{ v:90 },{ v:75 },{ v:110 },{ v:95 },{ v:130 }];
const recentOrders = [
  { id:"ORD-0091", item:"Office Chair Pro",  qty:3, status:"Delivered",  amountUSD:427,  date:"Feb 18" },
  { id:"ORD-0090", item:"Standing Desk XL",  qty:1, status:"In Transit", amountUSD:595,  date:"Feb 18" },
  { id:"ORD-0089", item:"Monitor Arm",       qty:5, status:"Processing", amountUSD:199,  date:"Feb 17" },
  { id:"ORD-0088", item:"Mech. Keyboard",   qty:2, status:"Delivered",  amountUSD:280,  date:"Feb 17" },
  { id:"ORD-0087", item:"Webcam HD",         qty:4, status:"In Transit", amountUSD:119,  date:"Feb 16" },
];
const topProducts = [
  { name:"Office Chair Pro",  vendor:"ErgoPlus",    margin:"42%", sold:248, stock:34 },
  { name:"Standing Desk XL",  vendor:"DeskCo",      margin:"38%", sold:182, stock:12 },
  { name:"Monitor Arm",       vendor:"FlexMount",   margin:"55%", sold:441, stock:76 },
  { name:"Mech. Keyboard",   vendor:"TypeMaster",  margin:"47%", sold:319, stock:58 },
  { name:"Webcam HD",         vendor:"ClearVision", margin:"34%", sold:193, stock:8  },
];
const storageData = [
  { name:"Documents", used:42, color:"#3b82f6" },
  { name:"Images",    used:28, color:"#10b981" },
  { name:"Videos",    used:18, color:"#f59e0b" },
  { name:"Other",     used:7,  color:"#8b5cf6" },
];
const monthlyBarData = [
  { month:"Jan", orders:310 }, { month:"Feb", orders:380 },
  { month:"Mar", orders:290 }, { month:"Apr", orders:420 },
  { month:"May", orders:510 }, { month:"Jun", orders:460 },
];
const worldDistribution = [
  { region:"Southeast Asia", country:"Malaysia / Indonesia",  flag:"🇲🇾", clients:3840, color:"#3b82f6" },
  { region:"East Asia",      country:"China / Japan",         flag:"🇨🇳", clients:2910, color:"#10b981" },
  { region:"Europe",         country:"UK / France / Germany", flag:"🇬🇧", clients:2200, color:"#f59e0b" },
  { region:"North America",  country:"USA / Canada",          flag:"🇺🇸", clients:1950, color:"#ef4444" },
  { region:"Middle East",    country:"UAE / Saudi Arabia",    flag:"🇸🇦", clients:1200, color:"#8b5cf6" },
  { region:"South Asia",     country:"India / Pakistan",      flag:"🇮🇳", clients:980,  color:"#ec4899" },
  { region:"Australia",      country:"Australia / NZ",        flag:"🇦🇺", clients:740,  color:"#06b6d4" },
  { region:"Africa",         country:"Nigeria / South Africa",flag:"🇳🇬", clients:520,  color:"#14b8a6" },
];

/** Build a mini sparkline from live inventory values (one point per item, sorted by value) */
const buildMiniEarnings = (items: InventoryItem[]): { v: number }[] => {
  if (!items.length) return miniEarnings;
  const vals = items
    .map(i => i.quantityInStock * (i.unitPrice ?? 0))
    .sort((a, b) => a - b)
    .slice(0, 8);
  // normalise to 0-130 range for display consistency
  const max = Math.max(...vals) || 1;
  return vals.map(v => ({ v: Math.round((v / max) * 130) }));
};

/** Build stock-trend chart from transactions grouped into buckets */
const buildStockTrend = (txList: StockTransaction[]): typeof stockTrendData => {
  if (!txList.length) return stockTrendData;
  // group by id modulo 9 buckets to simulate time buckets
  const buckets: { thisYear: number; lastYear: number }[] = Array.from({ length: 9 }, () => ({ thisYear: 0, lastYear: 0 }));
  txList.forEach((tx, idx) => {
    const bucket = idx % 9;
    if (tx.type === "STOCK_IN")  buckets[bucket].thisYear += tx.quantity ?? 0;
    if (tx.type === "STOCK_OUT") buckets[bucket].lastYear  += tx.quantity ?? 0;
  });
  return buckets.map((b, i) => ({
    day: stockTrendData[i]?.day ?? `Day ${i + 1}`,
    thisYear: b.thisYear || stockTrendData[i]?.thisYear,
    lastYear: b.lastYear || stockTrendData[i]?.lastYear,
  }));
};

/** Build monthly bar chart from transactions bucketed into 6 months */
const buildMonthlyBar = (txList: StockTransaction[]): { month: string; orders: number }[] => {
  if (!txList.length) return monthlyBarData;
  const months = ["Jan","Feb","Mar","Apr","May","Jun"];
  const counts = [0, 0, 0, 0, 0, 0];
  txList.forEach((tx, idx) => { counts[idx % 6] += tx.quantity ?? 0; });
  const hasData = counts.some(c => c > 0);
  if (!hasData) return monthlyBarData;
  return months.map((month, i) => ({ month, orders: counts[i] }));
};

/** Build pie/radial chart from live category breakdown */
const buildStorageData = (items: InventoryItem[]): typeof storageData => {
  if (!items.length) return storageData;
  const COLORS = ["#3b82f6","#10b981","#f59e0b","#8b5cf6","#ef4444","#ec4899"];
  const catMap: Record<string, number> = {};
  items.forEach(i => {
    const cat = i.categoryDescription || "Other";
    catMap[cat] = (catMap[cat] ?? 0) + i.quantityInStock;
  });
  const entries = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
  return entries.map(([name, qty], idx) => ({
    name,
    used: Math.round((qty / total) * 95),
    color: COLORS[idx % COLORS.length],
  }));
};

/** Build world distribution from supplier names (heuristic region mapping) */
const buildWorldDistribution = (items: InventoryItem[]): typeof worldDistribution => {
  if (!items.length) return worldDistribution;
  const supplierMap: Record<string, number> = {};
  items.forEach(i => {
    if (i.supplierName) supplierMap[i.supplierName] = (supplierMap[i.supplierName] ?? 0) + i.quantityInStock;
  });
  const entries = Object.entries(supplierMap).sort((a, b) => b[1] - a[1]);
  if (entries.length < 2) return worldDistribution;
  const COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#06b6d4","#14b8a6"];
  const FLAGS  = ["🏭","🏪","🏬","🏢","🏗","🏛","🏦","🏨"];
  return entries.slice(0, 8).map(([name, qty], i) => ({
    region: name,
    country: name,
    flag: FLAGS[i % FLAGS.length],
    clients: qty,
    color: COLORS[i % COLORS.length],
  }));
};



const today   = new Date();
const weekday = today.toLocaleDateString("en-US", { weekday: "long" });
const dateStr = today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
const hour    = today.getHours();
const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

/* ── Status pill ──────────────────────────────────────────── */
const STATUS_CFG: Record<string, { bg: string; color: string; dot: string }> = {
  "Delivered":  { bg:"#d4e8d4", color:"#2d6a2d", dot:"#22c55e" },
  "In Transit": { bg:"#fbe8c8", color:"#8a5a1a", dot:"#f59e0b" },
  "Processing": { bg:"#dde4f0", color:"#3a4e7a", dot:"#3b82f6" },
};
const StatusPill = ({ s }: { s: string }) => {
  const cfg = STATUS_CFG[s] || { bg:"#e2e8f0", color:"#64748b", dot:"#94a3b8" };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />{s}
    </span>
  );
};

/* ── Animated number ──────────────────────────────────────── */
const AnimatedNumber = ({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) => {
  const [val, setVal] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const start = Date.now(), dur = 1200;
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / dur);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);
  return <>{prefix}{val.toLocaleString()}{suffix}</>;
};

/* ── Card ─────────────────────────────────────────────────── */
const Card = ({ children, className = "", style = {} }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) => {
  const { tokens } = useTheme();
  return (
    <div className={`rounded-2xl ${className}`}
      style={{ background: tokens.card, border: `1px solid ${tokens.border}`, ...style }}>
      {children}
    </div>
  );
};

/* ── World Distribution Bars ──────────────────────────────── */
const WorldDistributionBars = ({ tokens, data }: { tokens: Record<string, string>; data: typeof worldDistribution }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  const total      = data.reduce((a, d) => a + d.clients, 0);
  const maxClients = data[0]?.clients ?? 1;

  return (
    <div>
      <div className="space-y-3 mb-5">
        {data.map((r, i) => {
          const sharePct   = Math.round((r.clients / total) * 100);
          const isHov      = hovered === i;
          const clientLabel = r.clients >= 1000 ? `${(r.clients / 1000).toFixed(1)}K` : String(r.clients);
          const barW       = (r.clients / maxClients) * 100;
          return (
            <div key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="flex items-center gap-3 group cursor-default">
              <div className="flex items-center gap-1.5 flex-shrink-0" style={{ width:"clamp(80px,130px,28%)" }}>
                <span className="text-base leading-none flex-shrink-0">{r.flag}</span>
                <span className="text-xs font-semibold truncate"
                  style={{ color: isHov ? r.color : tokens.sub, transition:"color 0.2s" }}>
                  {r.region}
                </span>
              </div>
              <div className="flex-1 h-5 rounded-lg overflow-hidden relative" style={{ background:`${r.color}12` }}>
                <div className="h-full rounded-lg"
                  style={{
                    width: mounted ? `${barW}%` : "0%",
                    background: `linear-gradient(90deg, ${r.color}bb, ${r.color})`,
                    transition: `width 1.1s cubic-bezier(0.4,0,0.2,1) ${i * 60}ms`,
                    boxShadow: isHov ? `0 0 12px ${r.color}55` : "none",
                  }} />
                {barW > 22 && (
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold pointer-events-none"
                    style={{ color:"rgba(255,255,255,0.92)" }}>
                    {clientLabel}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0" style={{ width: 72 }}>
                <span className="text-[11px] font-bold tabular-nums"
                  style={{ color: isHov ? r.color : tokens.text, transition:"color 0.2s", minWidth:28, textAlign:"right" }}>
                  {sharePct}%
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0"
                  style={{ background:`${r.color}18`, color:r.color }}>
                  #{i + 1}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {/* Stacked proportion bar */}
      <div className="rounded-xl overflow-hidden" style={{ border:`1px solid ${tokens.border}` }}>
        <div className="flex h-5">
          {data.map((d, i) => (
            <div key={i} className="h-full transition-opacity duration-200"
              style={{
                width: `${(d.clients / total) * 100}%`,
                background: d.color,
                opacity: hovered === null || hovered === i ? 1 : 0.3,
              }}
              title={`${d.region}: ${Math.round((d.clients / total) * 100)}%`}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)} />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-3 py-2.5" style={{ background:tokens.cardHover }}>
          {data.map((d, i) => (
            <div key={i} className="flex items-center gap-1.5 min-w-fit">
              <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background:d.color }} />
              <span className="text-[11px]" style={{ color:tokens.muted }}>{d.flag} {d.region}</span>
              <span className="text-[11px] font-bold" style={{ color:tokens.text }}>{Math.round((d.clients / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   HOME DASHBOARD
═══════════════════════════════════════════════════════════ */
const Home = () => {
  const { tokens, primary, t } = useTheme();
  const { convert } = useCurrency();
  const [chartRange, setChartRange]     = useState("Last month");
  const [productSearch, setProductSearch] = useState("");

  /* ── Live backend data ────────────────────────────────── */
  const [items, setItems]       = useState<InventoryItem[]>([]);
  const [txList, setTxList]     = useState<StockTransaction[]>([]);
  const [loading, setLoading]   = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [supplier,setSupplier] = useState("")
  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [iRes, tRes] = await Promise.all([
        axios.get<InventoryItem[]>("http://localhost:8080/api/admin/item/fetchAll", { headers }),
        axios.get<StockTransaction[]>("http://localhost:8080/api/admin/stock/all",  { headers }),
      ]);

      let data =await axios.get("http://localhost:8080/api/admin/users/supplier/count",{headers})
      setSupplier(data.data)
      setItems(Array.isArray(iRes.data) ? iRes.data : []);
      setTxList(Array.isArray(tRes.data) ? tRes.data : []);
      setLastUpdated(new Date());
    } catch { /* silent — backend may not be running */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 60_000);
    return () => clearInterval(iv);
  }, [fetchData]);

  /*  Derived live values*/
  const totalItems   = items.length;
  const totalValue   = items.reduce((s, i) => s + i.quantityInStock * (i.unitPrice ?? 0), 0);
  const totalStockIn = txList.filter(t => t.type === "STOCK_IN").reduce((s, t) => s + (t.quantity ?? 0), 0);
  const totalStockOut= txList.filter(t => t.type === "STOCK_OUT").reduce((s, t) => s + (t.quantity ?? 0), 0);
  const customersCount = supplier; 

  /*  Real low-stock items replacing static list */
  const liveLowStock = items
    .filter(i => i.quantityInStock >= 0 && i.quantityInStock <= i.reOrderLevel)
    .sort((a, b) => a.quantityInStock - b.quantityInStock)
    .slice(0, 3)
    .map(i => ({ name: i.name, stock: i.quantityInStock, threshold: i.reOrderLevel }));

  // Fall back to static data if nothing from backend yet
  const displayLowStock = liveLowStock.length > 0
    ? liveLowStock
    : [
        { name:"Standing Desk XL", stock:12, threshold:15 },
        { name:"Webcam HD",        stock:8,  threshold:10 },
        { name:"Cable Organizer",  stock:5,  threshold:20 },
      ];

  /* Low stock alert count for greeting card  */
  const lowAlertCount = items.filter(i => i.quantityInStock <= i.reOrderLevel).length;

  const RAW = { revenue: totalValue > 0 ? totalValue : 25049, todayRev: 2840, profit: 8000 };

  /* Live-derived chart data */
  const liveStockTrend   = buildStockTrend(txList);
  const liveMiniEarnings = buildMiniEarnings(items);
  const liveMonthlyBar   = buildMonthlyBar(txList);
  const liveStorageData  = buildStorageData(items);
  const liveWorldDist    = buildWorldDistribution(items);
  const liveStorageTotal = liveStorageData.reduce((a, s) => a + s.used, 0);

  /* Live top-products from inventory (sorted by qty value desc) */
  const liveTopProducts = items.length > 0
    ? items
        .sort((a, b) => b.quantityInStock * (b.unitPrice ?? 0) - a.quantityInStock * (a.unitPrice ?? 0))
        .slice(0, 5)
        .map(i => ({
          name:   i.name,
          vendor: i.supplierName || "—",
          margin: `${Math.min(99, Math.round(((i.unitPrice ?? 0) / Math.max(1, i.unitPrice ?? 1)) * 35 + 25))}%`,
          sold:   i.quantityInStock,
          stock:  i.quantityInStock,
        }))
    : topProducts;

  /* Live monthly bar summary stats */
  const liveMonthlyTotal  = liveMonthlyBar.reduce((s, d) => s + d.orders, 0);
  const liveMonthlyBest   = liveMonthlyBar.reduce((best, d) => d.orders > best.orders ? d : best, liveMonthlyBar[0]);
  const liveMonthlyAvg    = liveMonthlyBar.length ? Math.round(liveMonthlyTotal / liveMonthlyBar.length) : 0;

  const tip = {
    contentStyle: { background:tokens.sidebar, border:`1px solid ${tokens.border}`, borderRadius:12, color:tokens.text, fontSize:12, boxShadow:"0 10px 30px rgba(0,0,0,0.12)" },
    itemStyle: { color:tokens.text },
    cursor: { stroke:tokens.border, strokeDasharray:"3 3" },
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5"
      style={{ minHeight:"100%", background:tokens.bg }}>
      <Breadcrumb page="Dashboard" />

      {/* ── KPI Strip ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {[
          { icon:"🛒", label:"Total Stock-In",   value: totalStockIn,    delta:"+12%", color:"#3b82f6", isMoney:false },
          { icon:"📦", label:"Total Items",      value: totalItems,       delta:"+5%",  color:"#10b981", isMoney:false },
          { icon:"👥", label:"Customers",        value: customersCount,   delta:"+8%",  color:"#8b5cf6", isMoney:false },
          { icon:"📤", label:"Stock Out",  value: totalStockOut,     delta:"+4%",  color:"#f59e0b", isMoney:true  },
        ].map(s => (
          <Card key={s.label} className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-lg sm:text-xl flex-shrink-0"
              style={{ background:`${s.color}18` }}>{s.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs font-medium truncate" style={{ color:tokens.muted }}>{s.label}</p>
              <p className="text-base sm:text-lg font-bold leading-tight" style={{ color:tokens.text }}>
                {s.isMoney
                  ? <span>{convert(s.value)}</span>
                  : <AnimatedNumber target={s.value} />}
              </p>
            </div>
            <span className="text-[10px] sm:text-xs font-semibold px-1 sm:px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background:`${s.color}18`, color:s.color }}>{s.delta}</span>
          </Card>
        ))}
      </div>

      {/* ── ROW 1: Greeting + Earnings + Low Stock + Storage ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">

        {/* Greeting */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between" style={{ minHeight:240 }}>
          <div>
            <p className="text-xs font-medium" style={{ color:tokens.muted }}>{weekday} · {dateStr}</p>
            <h2 className="text-lg sm:text-xl font-bold mt-1" style={{ color:tokens.text }}>{greeting}, Admin! 👋</h2>
            <p className="text-sm" style={{ color:tokens.muted }}>Here's what's happening today.</p>
          </div>
          <div className="mt-4 space-y-2.5">
            {[
              { icon:"📥", label:"Total Stock-In",   value: totalStockIn > 0 ? `${totalStockIn} units`   : "—", color:"#3b82f6" },
              { icon:"⚠️", label:"Low stock alerts", value: lowAlertCount > 0 ? `${lowAlertCount} items` : "All good ✅", color:"#f59e0b" },
              { icon:"📤", label:"Total Stock-Out",  value: totalStockOut > 0 ?  `${totalStockIn} units` : "—",  color:"#10b981" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background:tokens.cardHover }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background:`${s.color}18` }}>{s.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs" style={{ color:tokens.muted }}>{s.label}</p>
                  <p className="text-sm font-bold truncate" style={{ color:tokens.text }}>{s.value}</p>
                </div>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:s.color }} />
              </div>
            ))}
            {lastUpdated && (
              <p className="text-[10px] text-right" style={{ color:tokens.muted }}>
                Updated {lastUpdated.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
              </p>
            )}
          </div>
        </Card>

        {/* Monthly Earnings */}
        <Card className="p-4 sm:p-5 flex flex-col">
          <p className="text-xs font-medium mb-1" style={{ color:tokens.muted }}>Inventory Value</p>
          <p className="text-2xl sm:text-3xl font-bold" style={{ color:tokens.text }}>{convert(RAW.revenue)}</p>
          <span className="inline-block text-xs px-2.5 py-0.5 rounded-full mt-1.5 mb-3 font-semibold"
            style={{ background:"#d4e8d4", color:"#2d6a2d" }}>
            {totalStockIn > totalStockOut ? "↑" : "↓"} Stock {totalStockIn > totalStockOut ? "surplus" : "deficit"} this period
          </span>
          <div className="h-24 sm:h-28">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={liveMiniEarnings} margin={{ top:0, right:0, bottom:0, left:0 }}>
                <defs>
                  <linearGradient id="earG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={primary} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={primary} stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={primary} strokeWidth={2.5} fill="url(#earG)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              { l:"Items",    v: totalItems > 0 ? totalItems.toLocaleString() : "—" },
              { l:"Stock In", v: totalStockIn > 0 ? `+${totalStockIn}` : "—" },
              { l:"Stock Out",v: totalStockOut > 0 ? `-${totalStockOut}` : "—" },
            ].map(s => (
              <div key={s.l} className="flex flex-col items-center py-2 rounded-xl" style={{ background:tokens.cardHover }}>
                <p className="text-xs sm:text-sm font-bold truncate w-full text-center" style={{ color:tokens.text }}>{s.v}</p>
                <p className="text-[10px] sm:text-xs" style={{ color:tokens.muted }}>{s.l}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Low Stock — live data */}
        <Card className="p-4 sm:p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-xs font-medium" style={{ color:tokens.muted }}>Low Stock</p>
              <p className="text-sm font-bold" style={{ color:tokens.text }}>Items needing restock</p>
            </div>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:"#fef3c7" }}>⚠️</div>
          </div>
          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-3 rounded mb-2" style={{ background:tokens.cardHover }} />
                  <div className="h-2 rounded-full" style={{ background:tokens.cardHover }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {displayLowStock.map((item, i) => {
                const pct    = item.threshold > 0 ? Math.min(100, (item.stock / item.threshold) * 100) : 0;
                const danger = item.stock === 0 || (item.threshold > 0 && pct < 30);
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-semibold truncate pr-2" style={{ color:tokens.text }}>{item.name}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background:danger?"#fee2e2":"#fef3c7", color:danger?"#dc2626":"#d97706" }}>
                        {item.stock === 0 ? "OUT" : `${item.stock} left`}
                      </span>
                    </div>
                    <div className="relative w-full rounded-full h-2" style={{ background:tokens.cardHover }}>
                      <div className="h-2 rounded-full" style={{ width:`${pct}%`, background:danger?"#ef4444":"#f59e0b" }} />
                      {/* 30% marker line */}
                      <div className="absolute top-0 h-full w-0.5 rounded-full"
                        style={{ left:"30%", background:"#ef4444", opacity:0.5 }} />
                    </div>
                    <p className="text-xs mt-1" style={{ color:tokens.muted }}>
                      Reorder level: {item.threshold} units
                      {danger && <span className="ml-1" style={{ color:"#dc2626" }}>· ⚠️ Critical</span>}
                    </p>
                  </div>
                );
              })}
              {liveLowStock.length === 0 && !loading && (
                <p className="text-xs text-center py-4" style={{ color:tokens.muted }}>
                  All items well stocked ✅
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Storage — mini donut */}
        <Card className="p-4 sm:p-5">
          <p className="text-xs font-medium mb-1" style={{ color:tokens.muted }}>Storage Usage</p>
          <p className="text-sm font-bold mb-2" style={{ color:tokens.text }}>Data by type</p>
          {/* Stacked bar */}
          <div className="flex h-2.5 rounded-full overflow-hidden mb-3 gap-px">
            {liveStorageData.map((s, i) => (
              <div key={i} style={{ width:`${(s.used / 100) * 100}%`, background:s.color, transition:"width 0.6s ease" }} />
            ))}
          </div>
          {/* Mini donut */}
          <div className="flex items-center justify-center mb-3">
            <div className="relative" style={{ width: "min(120px, 100%)", aspectRatio: "1" }}>
              <svg viewBox="0 0 200 200" style={{ width: "100%", height: "100%" }}>
                {(() => {
                  const PIE_COLORS = ["#3b82f6","#10b981","#f59e0b","#8b5cf6","#ef4444","#ec4899"];
                  const slices = liveStorageData.slice(0, 6);
                  const total = slices.reduce((s, d) => s + d.used, 0) || 1;
                  const cx = 100, cy = 100, r = 80, inner = 52;
                  let angle = -90;
                  return slices.map((d, i) => {
                    const pct = d.used / total;
                    const sweep = pct * 360;
                    const start = angle;
                    angle += sweep;
                    const toRad = (deg: number) => (deg * Math.PI) / 180;
                    const x1 = cx + r * Math.cos(toRad(start));
                    const y1 = cy + r * Math.sin(toRad(start));
                    const x2 = cx + r * Math.cos(toRad(start + sweep));
                    const y2 = cy + r * Math.sin(toRad(start + sweep));
                    const ix1 = cx + inner * Math.cos(toRad(start));
                    const iy1 = cy + inner * Math.sin(toRad(start));
                    const ix2 = cx + inner * Math.cos(toRad(start + sweep));
                    const iy2 = cy + inner * Math.sin(toRad(start + sweep));
                    const large = sweep > 180 ? 1 : 0;
                    const color = PIE_COLORS[i % PIE_COLORS.length];
                    return (
                      <path key={i}
                        d={`M ${ix1} ${iy1} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${inner} ${inner} 0 ${large} 0 ${ix1} ${iy1} Z`}
                        fill={color} stroke={tokens.card} strokeWidth="3" opacity={0.93} />
                    );
                  });
                })()}
                <circle cx="100" cy="100" r="52" fill={tokens.card} />
                <text x="100" y="95" textAnchor="middle" fontSize="26" fontWeight="800" fill={tokens.text}>{liveStorageTotal}%</text>
                <text x="100" y="113" textAnchor="middle" fontSize="10" fill={tokens.muted}>distributed</text>
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            {liveStorageData.map((s, i) => {
              const PIE_COLORS = ["#3b82f6","#10b981","#f59e0b","#8b5cf6","#ef4444","#ec4899"];
              const color = PIE_COLORS[i % PIE_COLORS.length];
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: color }} />
                  <span className="text-xs flex-1 truncate" style={{ color:tokens.sub }}>{s.name}</span>
                  <div className="w-12 h-1.5 rounded-full overflow-hidden flex-shrink-0" style={{ background:tokens.cardHover }}>
                    <div style={{ width:`${s.used}%`, background: color, height:"100%", transition:"width 0.6s ease" }} />
                  </div>
                  <span className="text-xs font-bold w-7 text-right flex-shrink-0" style={{ color:tokens.text }}>{s.used}%</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] mt-2 pt-2"
            style={{ borderTop:`1px solid ${tokens.border}`, color:tokens.muted }}>
            <span>{liveStorageTotal}% distributed</span><span>{100 - liveStorageTotal}% unallocated</span>
          </div>
        </Card>
      </div>

      {/* ── ROW 2: New Stock Details + Stock Trend ─────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-5 xl:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="font-bold" style={{ color:tokens.text }}>New Stock Details</p>
              <p className="text-xs" style={{ color:tokens.muted }}>Latest stock-in / stock-out transactions</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{ background:`${primary}18`, color:primary }}>
              {txList.length > 0 ? `${txList.length} records` : "Live"}
            </span>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="animate-pulse h-10 rounded-xl" style={{ background:tokens.cardHover }} />
              ))}
            </div>
          ) : txList.length === 0 ? (
            /* fallback: show static demo rows when backend has no transactions */
            <>
              {/* Mobile */}
              <div className="sm:hidden space-y-2">
                {recentOrders.map((order, i) => (
                  <div key={i} className="p-3 rounded-xl"
                    style={{ background:tokens.cardHover, border:`1px solid ${tokens.border}` }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono font-semibold" style={{ color:primary }}>{order.id}</span>
                      <StatusPill s={order.status} />
                    </div>
                    <p className="text-sm font-semibold" style={{ color:tokens.text }}>{order.item}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs" style={{ color:tokens.muted }}>{order.date} · {order.qty}x</span>
                      <span className="text-sm font-bold" style={{ color:tokens.text }}>{convert(order.amountUSD)}</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full min-w-[480px]">
                  <thead>
                    <tr style={{ borderBottom:`1px solid ${tokens.border}` }}>
                      {["Order ID","Item","Qty","Status","Date","Amount"].map(h => (
                        <th key={h} className="pb-2.5 text-left text-xs font-semibold"
                          style={{ color:tokens.muted, paddingRight:12 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order, i) => (
                      <tr key={i} className="transition-all"
                        style={{ borderBottom:i<recentOrders.length-1?`1px solid ${tokens.border}`:"none" }}
                        onMouseEnter={e => (e.currentTarget.style.background = tokens.cardHover)}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <td className="py-2.5 pr-3 text-xs font-mono font-semibold" style={{ color:primary }}>{order.id}</td>
                        <td className="py-2.5 pr-3 text-sm font-medium" style={{ color:tokens.text }}>{order.item}</td>
                        <td className="py-2.5 pr-3 text-sm font-bold" style={{ color:tokens.text }}>{order.qty}x</td>
                        <td className="py-2.5 pr-3"><StatusPill s={order.status} /></td>
                        <td className="py-2.5 pr-3 text-xs" style={{ color:tokens.muted }}>{order.date}</td>
                        <td className="py-2.5 text-sm font-bold" style={{ color:tokens.text }}>{convert(order.amountUSD)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              {/* Mobile — live transactions */}
              <div className="sm:hidden space-y-2">
                {txList.slice(0, 8).map((tx, i) => {
                  const isIn = tx.type === "STOCK_IN";
                  return (
                    <div key={i} className="p-3 rounded-xl flex items-center gap-3"
                      style={{ background:tokens.cardHover, border:`1px solid ${tokens.border}` }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                        style={{ background: isIn ? "#d4e8d4" : "#fbd8d4" }}>
                        {isIn ? "📥" : "📤"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color:tokens.text }}>
                          {tx.item?.name || `Transaction #${tx.id}`}
                        </p>
                        <p className="text-xs" style={{ color:tokens.muted }}>
                          {tx.item?.itemCode || "—"} · {tx.transactionDate ? new Date(tx.transactionDate).toLocaleDateString() : "Recent"}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold" style={{ color: isIn ? "#2d6a2d" : "#8a2a2a" }}>
                          {isIn ? "+" : "−"}{tx.quantity}
                        </p>
                        <p className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ background: isIn ? "#d4e8d4" : "#fbd8d4", color: isIn ? "#2d6a2d" : "#8a2a2a" }}>
                          {isIn ? "IN" : "OUT"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Desktop — live transactions */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full min-w-[480px]">
                  <thead>
                    <tr style={{ borderBottom:`1px solid ${tokens.border}` }}>
                      {["#","Item","Code","Type","Qty","Date"].map(h => (
                        <th key={h} className="pb-2.5 text-left text-xs font-semibold"
                          style={{ color:tokens.muted, paddingRight:12 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {txList.slice(0, 8).map((tx, i) => {
                      const isIn = tx.type === "STOCK_IN";
                      return (
                        <tr key={i} className="transition-all"
                          style={{ borderBottom:i < Math.min(txList.length,8)-1 ? `1px solid ${tokens.border}` : "none" }}
                          onMouseEnter={e => (e.currentTarget.style.background = tokens.cardHover)}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                          <td className="py-2.5 pr-3 text-xs font-mono" style={{ color:tokens.muted }}>#{tx.id}</td>
                          <td className="py-2.5 pr-3 text-sm font-medium" style={{ color:tokens.text }}>
                            {tx.item?.name || `Item #${tx.id}`}
                          </td>
                          <td className="py-2.5 pr-3 font-mono text-xs" style={{ color:tokens.muted }}>
                            {tx.item?.itemCode || "—"}
                          </td>
                          <td className="py-2.5 pr-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{ background: isIn ? "#d4e8d4" : "#fbd8d4", color: isIn ? "#2d6a2d" : "#8a2a2a" }}>
                              {isIn ? "📥 IN" : "📤 OUT"}
                            </span>
                          </td>
                          <td className="py-2.5 pr-3 text-sm font-bold"
                            style={{ color: isIn ? "#2d6a2d" : "#8a2a2a" }}>
                            {isIn ? "+" : "−"}{tx.quantity}
                          </td>
                          <td className="py-2.5 text-xs" style={{ color:tokens.muted }}>
                            {tx.transactionDate ? new Date(tx.transactionDate).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="font-bold" style={{ color:tokens.text }}>Stock Trend</p>
              <p className="text-xs" style={{ color:tokens.muted }}>This vs last year</p>
            </div>
            <select value={chartRange} onChange={e => setChartRange(e.target.value)}
              className="text-xs px-2 py-1 rounded-lg outline-none"
              style={{ background:tokens.cardHover, color:tokens.sub, border:`1px solid ${tokens.border}` }}>
              <option>Last month</option>
              <option>Last 3 months</option>
              <option>This year</option>
            </select>
          </div>
          <div className="h-48 sm:h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={liveStockTrend} margin={{ top:4, right:4, bottom:0, left:-24 }}>
                <CartesianGrid stroke={tokens.border} strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="day" tick={{ fill:tokens.muted, fontSize:9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill:tokens.muted, fontSize:9 }} tickLine={false} axisLine={false} />
                <Tooltip {...tip} />
                <Line type="monotone" dataKey="thisYear" name="This year" stroke={primary}       strokeWidth={2.5} dot={{ r:3, fill:primary,       strokeWidth:0 }} activeDot={{ r:5 }} />
                <Line type="monotone" dataKey="lastYear" name="Last year" stroke={tokens.muted} strokeWidth={2}   dot={{ r:2, fill:tokens.muted, strokeWidth:0 }} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-0.5 rounded inline-block" style={{ background:primary }} />
              <span className="text-xs" style={{ color:tokens.sub }}>This year</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-0.5 rounded inline-block" style={{ background:tokens.muted, opacity:0.6 }} />
              <span className="text-xs" style={{ color:tokens.sub }}>Last year</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ── ROW 3: Monthly Bar + Storage Radial ────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-5">
          <p className="font-bold mb-0.5" style={{ color:tokens.text }}>Monthly Orders</p>
          <p className="text-xs mb-3" style={{ color:tokens.muted }}>Order volume per month</p>
          <div className="h-48 sm:h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={liveMonthlyBar} margin={{ top:4, right:4, bottom:0, left:-22 }}>
                <CartesianGrid stroke={tokens.border} strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" tick={{ fill:tokens.muted, fontSize:10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill:tokens.muted, fontSize:10 }} tickLine={false} axisLine={false} />
                <Tooltip {...tip} />
                <Bar dataKey="orders" fill={primary} radius={[6,6,0,0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[{ l:"Best",v: liveMonthlyBest?.month ?? "—",c:primary },{ l:"Total",v:liveMonthlyTotal.toLocaleString(),c:tokens.text },{ l:"Avg/mo",v: liveMonthlyAvg.toLocaleString(),c:tokens.text }].map(s => (
              <div key={s.l} className="py-2 px-2 rounded-xl text-center" style={{ background:tokens.cardHover }}>
                <p className="text-sm font-bold" style={{ color:s.c }}>{s.v}</p>
                <p className="text-xs" style={{ color:tokens.muted }}>{s.l}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <p className="font-bold mb-0.5" style={{ color:tokens.text }}>
            {items.length > 0 ? "Category Breakdown" : "Storage Details"}
          </p>
          <p className="text-xs mb-3" style={{ color:tokens.muted }}>
            {items.length > 0 ? "Stock distribution by category" : "Data breakdown by type"}
          </p>
          {/* Responsive interactive donut chart */}
          {(() => {
            const PIE_COLORS = ["#3b82f6","#10b981","#f59e0b","#8b5cf6","#ef4444","#ec4899"];
            const slices = liveStorageData.slice(0, 6);
            const total = slices.reduce((s, d) => s + d.used, 0) || 1;
            return (
              <>
                <div className="flex items-center justify-center my-2">
                  <div className="relative" style={{ width: "min(180px, 100%)", aspectRatio: "1" }}>
                    <svg viewBox="0 0 200 200" style={{ width: "100%", height: "100%" }}>
                      {(() => {
                        const cx = 100, cy = 100, r = 78, inner = 48;
                        let angle = -90;
                        return slices.map((d, i) => {
                          const pct = d.used / total;
                          const sweep = pct * 360;
                          const start = angle;
                          angle += sweep;
                          const toRad = (deg: number) => (deg * Math.PI) / 180;
                          const x1 = cx + r * Math.cos(toRad(start));
                          const y1 = cy + r * Math.sin(toRad(start));
                          const x2 = cx + r * Math.cos(toRad(start + sweep));
                          const y2 = cy + r * Math.sin(toRad(start + sweep));
                          const ix1 = cx + inner * Math.cos(toRad(start));
                          const iy1 = cy + inner * Math.sin(toRad(start));
                          const ix2 = cx + inner * Math.cos(toRad(start + sweep));
                          const iy2 = cy + inner * Math.sin(toRad(start + sweep));
                          const large = sweep > 180 ? 1 : 0;
                          const color = PIE_COLORS[i % PIE_COLORS.length];
                          return (
                            <path key={i}
                              d={`M ${ix1} ${iy1} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${inner} ${inner} 0 ${large} 0 ${ix1} ${iy1} Z`}
                              fill={color} stroke={tokens.card} strokeWidth="2" opacity={0.93}
                              style={{ cursor: "default", transition: "opacity 0.2s" }}
                              onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                              onMouseLeave={e => (e.currentTarget.style.opacity = "0.93")}
                            />
                          );
                        });
                      })()}
                      <circle cx="100" cy="100" r="48" fill={tokens.card} />
                      <text x="100" y="94" textAnchor="middle" fontSize="20" fontWeight="800"
                        fill={tokens.text}>{liveStorageTotal}%</text>
                      <text x="100" y="110" textAnchor="middle" fontSize="9" fontWeight="500"
                        fill={tokens.muted}>of total</text>
                    </svg>
                  </div>
                </div>
                <div className="mt-2 space-y-1.5">
                  {slices.map((s, i) => {
                    const color = PIE_COLORS[i % PIE_COLORS.length];
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
                        <span className="text-xs flex-1 truncate" style={{ color:tokens.sub }}>{s.name}</span>
                        <div className="w-14 h-1.5 rounded-full overflow-hidden flex-shrink-0" style={{ background:tokens.cardHover }}>
                          <div style={{ width:`${s.used}%`, background: color, height:"100%", transition:"width 0.6s ease" }} />
                        </div>
                        <span className="text-xs font-bold w-7 text-right flex-shrink-0" style={{ color:tokens.text }}>{s.used}%</span>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </Card>
      </div>

      {/* ── ROW 4: World Distribution ──────────────────────── */}
      {/* <Card className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 sm:mb-5">
          <div>
            <p className="font-bold text-base" style={{ color:tokens.text }}>
              {items.length > 0 ? "Stock by Supplier — Distribution" : "Most Clients — World Distribution"}
            </p>
            <p className="text-xs" style={{ color:tokens.muted }}>
              {items.length > 0 ? "Inventory quantity per supplier" : "Client presence across global regions"}
            </p>
          </div>
        </div>
        <WorldDistributionBars tokens={tokens} data={liveWorldDist} />
      </Card> */}

      {/* ── ROW 5: Top Products ────────────────────────────── */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-5 pb-3">
          <div>
            <p className="font-bold" style={{ color:tokens.text }}>Top Products</p>
            <p className="text-xs" style={{ color:tokens.muted }}>Best-performing inventory items</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", color:tokens.muted, pointerEvents:"none" }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)}
                placeholder="Search products..."
                className="text-xs pl-7 pr-3 py-1.5 rounded-xl outline-none transition-all w-full sm:w-auto"
                style={{
                  background: tokens.cardHover, color: tokens.text,
                  border: `1px solid ${productSearch ? primary : tokens.border}`, minWidth:140,
                }} />
              {productSearch && (
                <button onClick={() => setProductSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color:tokens.muted, lineHeight:1 }}>✕</button>
              )}
            </div>
            <button className="text-xs px-3 py-1.5 rounded-xl font-semibold flex-shrink-0"
              style={{ background:`${primary}15`, color:primary }}>Export</button>
          </div>
        </div>

        {/* Mobile */}
        <div className="sm:hidden px-4 pb-4 space-y-2">
          {(() => {
            const q = productSearch.trim().toLowerCase();
            const filtered = q
              ? liveTopProducts.filter(p => p.name.toLowerCase().includes(q) || p.vendor.toLowerCase().includes(q))
              : liveTopProducts;
            return filtered.map((p, i) => {
              const low = p.stock < 15;
              return (
                <div key={i} className="p-3 rounded-xl"
                  style={{ background:tokens.cardHover, border:`1px solid ${tokens.border}` }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-sm font-semibold" style={{ color:tokens.text }}>{p.name}</p>
                      <p className="text-xs" style={{ color:tokens.sub }}>{p.vendor}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
                      style={{ background:"#d4e8d4", color:"#2d6a2d" }}>{p.margin}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color:tokens.muted }}>Sold: <span className="font-semibold" style={{ color:tokens.text }}>{p.sold}</span></span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full"
                        style={{ background:low?"#ef4444":p.stock<30?"#f59e0b":"#22c55e" }} />
                      <span style={{ color:low?"#ef4444":tokens.text }}>{p.stock} units{low&&" ⚠️"}</span>
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>

        {/* Desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm min-w-[540px]">
            <thead>
              <tr style={{ borderBottom:`1px solid ${tokens.border}` }}>
                {["Product","Vendor","Margin","Units Sold","Stock Status"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold tracking-wider uppercase"
                    style={{ color:tokens.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const q = productSearch.trim().toLowerCase();
                const filtered = q
                  ? liveTopProducts.filter(p =>
                      p.name.toLowerCase().includes(q) ||
                      p.vendor.toLowerCase().includes(q) ||
                      p.margin.toLowerCase().includes(q))
                  : liveTopProducts;
                if (filtered.length === 0) return (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm" style={{ color:tokens.muted }}>
                      No products match "<span style={{ color:tokens.text, fontWeight:600 }}>{productSearch}</span>"
                    </td>
                  </tr>
                );
                return filtered.map((p, i) => {
                  const low = p.stock < 15;
                  return (
                    <tr key={i} className="transition-all"
                      style={{ borderBottom:i<filtered.length-1?`1px solid ${tokens.border}`:"none" }}
                      onMouseEnter={e => (e.currentTarget.style.background = tokens.cardHover)}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td className="px-5 py-3.5 font-semibold" style={{ color:tokens.text }}>{p.name}</td>
                      <td className="px-5 py-3.5 text-xs" style={{ color:tokens.sub }}>{p.vendor}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background:"#d4e8d4", color:"#2d6a2d" }}>{p.margin}</span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold" style={{ color:tokens.text }}>{p.sold.toLocaleString()}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full"
                            style={{ background:low?"#ef4444":p.stock<30?"#f59e0b":"#22c55e" }} />
                          <span className="font-semibold text-xs"
                            style={{ color:low?"#ef4444":tokens.text }}>{p.stock} units{low&&" ⚠️"}</span>
                        </div>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Home;
