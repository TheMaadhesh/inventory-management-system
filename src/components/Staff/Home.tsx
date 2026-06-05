import { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import { useTheme } from "./StaffNavbar";

/* QUICK NAV CHILD LINKS  */
const quickNavGroups = [
  {
    label: "QR Code",
    color: "#8b5cf6",
    links: [{ to: "/QRcode/Scan", label: "Scan QR Code", icon: "📷" }],
  },
  {
    label: "Inventory",
    color: "#3b82f6",
    links: [
      { to: "/inventory/view", label: "View Items", icon: "📋" },
      { to: "/inventory/details", label: "Item Details", icon: "🔍" },
    ],
  },
  {
    label: "Stock",
    color: "#10b981",
    links: [
      { to: "/stock/in", label: "Stock In", icon: "📥" },
      { to: "/stock/out", label: "Stock Out", icon: "📤" },
      { to: "/stock/history", label: "Stock History", icon: "📊" },
    ],
  },
  {
    label: "Low Stock",
    color: "#f59e0b",
    links: [{ to: "/lowstock/items", label: "Low Stock Items", icon: "⚠️" }],
  },
  {
    label: "Settings",
    color: "#6366f1",
    links: [
      { to: "/settings/profile", label: "Profile", icon: "👤" },
      { to: "/settings/password", label: "Change Password", icon: "🔒" },
    ],
  },
];

/* ═══ DATA ═══════════════════════════════════════════════ */
const stockTrendData = [
  { day: "Feb 01", stockIn: 12, stockOut: 8 },
  { day: "Feb 04", stockIn: 20, stockOut: 15 },
  { day: "Feb 06", stockIn: 16, stockOut: 11 },
  { day: "Feb 08", stockIn: 26, stockOut: 18 },
  { day: "Feb 10", stockIn: 18, stockOut: 13 },
  { day: "Feb 12", stockIn: 31, stockOut: 24 },
  { day: "Feb 14", stockIn: 25, stockOut: 19 },
  { day: "Feb 16", stockIn: 29, stockOut: 21 },
  { day: "Feb 18", stockIn: 34, stockOut: 28 },
];

// const weeklyActivity = [
//   { day: "Mon", scans: 8 },
//   { day: "Tue", scans: 14 },
//   { day: "Wed", scans: 11 },
//   { day: "Thu", scans: 18 },
//   { day: "Fri", scans: 22 },
//   { day: "Sat", scans: 7 },
// ];

const miniScanData = [
  { v: 8 },
  { v: 14 },
  { v: 11 },
  { v: 18 },
  { v: 22 },
  { v: 7 },
  { v: 16 },
];

const today = new Date();
const weekday = today.toLocaleDateString("en-US", { weekday: "long" });
const dateStr = today.toLocaleDateString("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});
const hour = today.getHours();
const greeting =
  hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

/* STATUS PILL */
const ScanPill = ({ action }: { action: string }) => {
  const isIn = action === "Stock In";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{
        background: isIn ? "#d4e8d4" : "#fbd8d4",
        color: isIn ? "#2d6a2d" : "#8a2a2a",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: isIn ? "#22c55e" : "#ef4444" }}
      />
      {action}
    </span>
  );
};

/* ANIMATED NUMBER */
const AnimatedNumber = ({
  target,
  prefix = "",
  suffix = "",
}: {
  target: number;
  prefix?: string;
  suffix?: string;
}) => {
  const [val, setVal] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const start = Date.now(),
      dur = 1200;
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / dur);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);
  return (
    <>
      {prefix}
      {val.toLocaleString()}
      {suffix}
    </>
  );
};

/*  CARD */
const Card = ({
  children,
  className = "",
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) => {
  const { tokens } = useTheme();
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        background: tokens.card,
        border: `1px solid ${tokens.border}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/* HOME */
const Home = () => {
  const { tokens, primary } = useTheme();
  const [scanSearch, setScanSearch] = useState("");

  const [counts, setCounts] = useState({
    total: 0,
    stockIn: 0,
    stockOut: 0,
    lowStock: 0,
    todayStockIn: 0,
    todayStockOut: 0,
    yesterdayStockIn: 0,
    yesterdayStockOut: 0,
    lowStcokItems: [],
    recentTransactions: [],
    previousMonthStockIn: 0,
    previousMonthStockOut: 0,
    previousWeekStockIn: 0,
    previousWeekStockOut: 0,
    previousWeekDaily: [],
  });
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [weeklyActivity, setweeklyActivity] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const payload = JSON.parse(atob(token.split(".")[1] || ""));
        const userId = payload.userId || payload.id || payload.sub;
        const res = await axios.get(
          `http://localhost:8080/api/staff/count/user?id=${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        console.log(res.data);

        setCounts({
          total: res.data.total,
          stockIn: res.data.stockIn,
          stockOut: res.data.stockOut,
          lowStock: res.data.lowStock,
          todayStockIn: res.data.todayStockIn,
          todayStockOut: res.data.todayStockOut,
          yesterdayStockIn: res.data.yesterdayStockIn,
          yesterdayStockOut: res.data.yesterdayStockOut,
          lowStcokItems: res.data.lowStockItems,
          recentTransactions: res.data.recentTransactions,
          previousMonthStockIn: res.data.previousMonthStockIn,
          previousMonthStockOut: res.data.previousMonthStockOut,
          previousWeekStockIn: res.data.previousWeekStockIn,
          previousWeekStockOut: res.data.previousWeekStockOut,
          previousWeekDaily: res.data.previousWeekDaily,
        });
        const transactions = res.data.recentTransactions;

        const formatted = transactions.map((t: any) => ({
          id: `SCN-${t.id}`,
          item: t.item?.name,
          action: t.type === "STOCK_IN" ? "Stock In" : "Stock Out",
          qty: t.quantity,
          time: new Date(t.transactionDate).toLocaleString(),
          category: t.item.categoryId?.category?.name,
        }));
        const lowStocksData = res.data.lowStockItems;
        const formatted1 = lowStocksData.map((t: any) => ({
          name: t.name,
          stock: t.quantityInStock,
          threshold: t.reOrderLevel,
          category: t.categoryId,
        }));

        const previousWeekDaily = res.data.previousWeekDaily;

        // Helper to convert date to weekday abbreviation
        const dayAbbr = (dateStr: string) => {
          const date = new Date(dateStr);
          return date.toLocaleDateString("en-US", { weekday: "short" });
        };

        // Format for chart — guard against null, array, or non-object values
        let formattedWeeklyActivity: { day: string; scans: number }[] = [];
        if (previousWeekDaily && typeof previousWeekDaily === "object" && !Array.isArray(previousWeekDaily)) {
          formattedWeeklyActivity = Object.keys(previousWeekDaily).map((date) => ({
            day: dayAbbr(date),
            scans: (previousWeekDaily[date]?.stockIn ?? 0) + (previousWeekDaily[date]?.stockOut ?? 0),
          }));
        }

        // Set state for chart
        setweeklyActivity(formattedWeeklyActivity);
        setLowStockItems(formatted1);
        setRecentScans(formatted);

        // Fetch inventory items for pie chart
        try {
          const token2 = localStorage.getItem("token");
          const itemRes = await axios.get(
            "http://localhost:8080/api/staff/item/fetchAll",
            { headers: { Authorization: `Bearer ${token2}` } }
          );
          setInventoryItems(Array.isArray(itemRes.data) ? itemRes.data : []);
        } catch { /* silent */ }
      } catch (error) {
        console.error("Dashboard count error", error);
      }
    };

    fetchCounts();
  }, []);

  const tip = {
    contentStyle: {
      background: tokens.sidebar,
      border: `1px solid ${tokens.border}`,
      borderRadius: 12,
      color: tokens.text,
      fontSize: 12,
      boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
    },
    itemStyle: { color: tokens.text },
    cursor: { stroke: tokens.border, strokeDasharray: "3 3" },
  };

  return (
    <div
      className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5"
      style={{ minHeight: "100%", background: tokens.bg }}
    >
      {/* ── Quick Navigation Child Links — hidden ── */}
      <div className="hidden">
        {quickNavGroups.map((group) => (
          <div
            key={group.label}
            className="rounded-2xl overflow-hidden"
            style={{
              background: tokens.card,
              border: `1px solid ${tokens.border}`,
            }}
          >
            <div
              className="px-3 py-2 flex items-center gap-1.5"
              style={{
                background: `${group.color}12`,
                borderBottom: `1px solid ${group.color}25`,
              }}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: group.color }}
              />
              <p
                className="text-xs font-bold truncate"
                style={{ color: group.color }}
              >
                {group.label}
              </p>
            </div>
            <div className="p-1.5 flex flex-col gap-1">
              {group.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium transition-all"
                  style={({ isActive }) => ({
                    background: isActive ? `${group.color}15` : "transparent",
                    color: isActive ? group.color : tokens.sub,
                  })}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background =
                      `${group.color}10`;
                    (e.currentTarget as HTMLAnchorElement).style.color =
                      group.color;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background =
                      "transparent";
                    (e.currentTarget as HTMLAnchorElement).style.color =
                      tokens.sub;
                  }}
                >
                  <span className="text-sm flex-shrink-0">{link.icon}</span>
                  <span className="truncate">{link.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {[
          {
            icon: "📦",
            label: "Total Items",
            value: counts.total,
            color: "#3b82f6",
          },
          {
            icon: "📥",
            label: "Stock In",
            value: counts.stockIn,
            color: "#10b981",
          },
          {
            icon: "📤",
            label: "Stock Out",
            value: counts.stockOut,
            color: "#f59e0b",
          },
          {
            icon: "⚠️",
            label: "Low Stock Alerts",
            value: counts.lowStock,
            color: "#ef4444",
          },
        ].map((s) => (
          <Card
            key={s.label}
            className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3"
          >
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-lg sm:text-xl flex-shrink-0"
              style={{ background: `${s.color}18` }}
            >
              {s.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[10px] sm:text-xs font-medium truncate"
                style={{ color: tokens.muted }}
              >
                {s.label}
              </p>
              <p
                className="text-base sm:text-lg font-bold leading-tight"
                style={{ color: tokens.text }}
              >
                <AnimatedNumber target={s.value} />
              </p>
            </div>
            {s.delta && (
              <span
                className="text-[10px] sm:text-xs font-semibold px-1 sm:px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{ background: `${s.color}18`, color: s.color }}
              >
                {s.delta}
              </span>
            )}
          </Card>
        ))}
      </div>

      {/* ── ROW 1: Greeting + Activity Trend + Low Stock + Weekly Scans ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {/* Greeting */}
        <Card
          className="p-4 sm:p-5 flex flex-col justify-between"
          style={{ minHeight: 240 }}
        >
          <div>
            <p className="text-xs font-medium" style={{ color: tokens.muted }}>
              {weekday} · {dateStr}
            </p>
            <h2
              className="text-lg sm:text-xl font-bold mt-1"
              style={{ color: tokens.text }}
            >
              {greeting}, Staff! 👋
            </h2>
            <p className="text-sm" style={{ color: tokens.muted }}>
              Here's your inventory activity.
            </p>
          </div>
          <div className="mt-4 space-y-2.5">
            {[
              {
                icon: "📦",
                label: "Total Items",
                value: counts.total,
                color: "#3b82f6",
              },
              {
                icon: "📤",
                label: "Stock Out",
                value: counts.stockOut,
                color: "#f59e0b",
              },
              {
                icon: "📥",
                label: "Stock In",
                value: counts.stockIn,
                color: "#10b981",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-3 p-2.5 rounded-xl"
                style={{ background: tokens.cardHover }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: `${s.color}18` }}
                >
                  {s.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs" style={{ color: tokens.muted }}>
                    {s.label}
                  </p>
                  <p
                    className="text-sm font-bold truncate"
                    style={{ color: tokens.text }}
                  >
                    {s.value}
                  </p>
                </div>
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: s.color }}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Today's Scan Activity */}
        <Card className="p-4 sm:p-5 flex flex-col">
          <p
            className="text-xs font-medium mb-1"
            style={{ color: tokens.muted }}
          >
            Today's Scan Activity
          </p>
          <p
            className="text-2xl sm:text-3xl font-bold"
            style={{ color: tokens.text }}
          >
            {Number(counts.todayStockIn || 0) +
              Number(counts.todayStockOut || 0)}
          </p>
          <span
            className="inline-block text-xs px-2.5 py-0.5 rounded-full mt-1.5 mb-3 font-semibold"
            style={{ background: "#d4e8d4", color: "#2d6a2d" }}
          >
            {Number(counts.yesterdayStockIn + counts.yesterdayStockOut)}{" "}
            yesterday Stocks
          </span>
          <div className="h-24 sm:h-28">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={weeklyActivity.length > 0 ? weeklyActivity.map(d => ({ v: d.scans })) : miniScanData}
                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
              >
                <defs>
                  <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={primary} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={primary}
                  strokeWidth={2.5}
                  fill="url(#scanGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              { l: "Stock In", v: counts.todayStockIn },
              { l: "Stock Out", v: counts.todayStockOut },
              { l: "Total", v: counts.todayStockIn + counts.todayStockOut },
            ].map((s) => (
              <div
                key={s.l}
                className="flex flex-col items-center py-2 rounded-xl"
                style={{ background: tokens.cardHover }}
              >
                <p
                  className="text-xs sm:text-sm font-bold"
                  style={{ color: tokens.text }}
                >
                  {s.v}
                </p>
                <p
                  className="text-[10px] sm:text-xs"
                  style={{ color: tokens.muted }}
                >
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Low Stock */}
        <Card className="p-4 sm:p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p
                className="text-xs font-medium"
                style={{ color: tokens.muted }}
              >
                Low Stock
              </p>
              <p className="text-sm font-bold" style={{ color: tokens.text }}>
                Items needing restock
              </p>
            </div>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "#fef3c7" }}
            >
              ⚠️
            </div>
          </div>
          <div className="space-y-4">
            {lowStockItems.slice(0, 3).map((item, i) => {
              const pct = Math.min(100, (item.stock / item.threshold) * 100);
              const danger = item.stock < 10;
              return (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span
                      className="text-sm font-semibold truncate pr-2"
                      style={{ color: tokens.text }}
                    >
                      {item.name}
                    </span>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        background: danger ? "#fee2e2" : "#fef3c7",
                        color: danger ? "#dc2626" : "#d97706",
                      }}
                    >
                      {item.stock} left
                    </span>
                  </div>
                  <div
                    className="w-full rounded-full h-2"
                    style={{ background: tokens.cardHover }}
                  >
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: danger ? "#ef4444" : "#f59e0b",
                      }}
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: tokens.muted }}>
                    Min: {item.threshold} units
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Weekly Scans mini bar */}
        <Card className="p-4 sm:p-5">
          <p
            className="text-xs font-medium mb-1"
            style={{ color: tokens.muted }}
          >
            Weekly Scan Volume
          </p>
          <p className="text-sm font-bold mb-3" style={{ color: tokens.text }}>
            Stocks previous week
          </p>
          <div className="h-36 sm:h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weeklyActivity}
                margin={{ top: 4, right: 4, bottom: 0, left: -22 }}
              >
                <CartesianGrid
                  stroke={tokens.border}
                  strokeDasharray="4 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fill: tokens.muted, fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: tokens.muted, fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip {...tip} />
                <Bar
                  dataKey="scans"
                  fill={primary}
                  radius={[6, 6, 0, 0]}
                  opacity={0.85}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              {
                l: "Total",
                v: counts.previousWeekStockIn + counts.previousWeekStockOut,
              },
              { l: "Stock In", v: counts.previousWeekStockIn },
              { l: "Stock Out", v: counts.previousWeekStockOut },
            ].map((s) => (
              <div
                key={s.l}
                className="py-2 px-2 rounded-xl text-center"
                style={{ background: tokens.cardHover }}
              >
                <p className="text-sm font-bold" style={{ color: tokens.text }}>
                  {s.v}
                </p>
                <p className="text-xs" style={{ color: tokens.muted }}>
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── ROW 2: Stock Trend Chart + Recent Scans ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        {/* Recent Scans Table — wide */}
        <Card className="p-4 sm:p-5 xl:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <p className="font-bold" style={{ color: tokens.text }}>
                Recent Stocks
              </p>
              {/* <p className="text-xs" style={{ color: tokens.muted }}>
                Your latest scan activity
              </p> */}
            </div>
            {/* Search bar */}
            <div className="relative w-full sm:w-52 flex-shrink-0">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: tokens.muted,
                  pointerEvents: "none",
                }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={scanSearch}
                onChange={(e) => setScanSearch(e.target.value)}
                placeholder="Search…"
                className="w-full text-xs outline-none"
                style={{
                  paddingLeft: 30,
                  paddingRight: scanSearch ? 28 : 10,
                  paddingTop: 7,
                  paddingBottom: 7,
                  borderRadius: 10,
                  background: tokens.cardHover,
                  color: tokens.text,
                  border: `1.5px solid ${tokens.border}`,
                  fontFamily: "inherit",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = primary)}
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = tokens.border)
                }
              />
              {scanSearch && (
                <button
                  onClick={() => setScanSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                  style={{ background: tokens.border, color: tokens.sub }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          {(() => {
            const q = scanSearch.toLowerCase();
            const filtered = recentScans.filter(
              (s) =>
                !q ||
                s.id.toLowerCase().includes(q) ||
                s.item.toLowerCase().includes(q) ||
                s.category.toLowerCase().includes(q) ||
                s.action.toLowerCase().includes(q),
            );
            return (
              <>
                {/* Mobile card view */}
                <div className="sm:hidden space-y-2">
                  {filtered.length === 0 ? (
                    <p
                      className="text-center text-sm py-6"
                      style={{ color: tokens.muted }}
                    >
                      No scans match your search.
                    </p>
                  ) : (
                    filtered.map((s, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl"
                        style={{
                          background: tokens.cardHover,
                          border: `1px solid ${tokens.border}`,
                        }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className="text-xs font-mono font-semibold"
                            style={{ color: primary }}
                          >
                            {s.id}
                          </span>
                          <ScanPill action={s.action} />
                        </div>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: tokens.text }}
                        >
                          {s.item}
                        </p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span
                            className="text-xs"
                            style={{ color: tokens.muted }}
                          >
                            {s.category} · {s.time}
                          </span>
                          <span
                            className="text-sm font-bold"
                            style={{ color: tokens.text }}
                          >
                            {s.qty}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {/* Desktop table view */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full min-w-[380px]">
                    <thead>
                      <tr
                        style={{ borderBottom: `1px solid ${tokens.border}` }}
                      >
                        {["Scan ID", "Item", "Action", "Qty", "Time"].map(
                          (h) => (
                            <th
                              key={h}
                              className="pb-2.5 text-left text-xs font-semibold"
                              style={{ color: tokens.muted, paddingRight: 12 }}
                            >
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-8 text-center text-sm"
                            style={{ color: tokens.muted }}
                          >
                            No scans match your search.
                          </td>
                        </tr>
                      ) : (
                        filtered.map((s, i) => (
                          <tr
                            key={i}
                            className="transition-all"
                            style={{
                              borderBottom:
                                i < filtered.length - 1
                                  ? `1px solid ${tokens.border}`
                                  : "none",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background =
                                tokens.cardHover)
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "transparent")
                            }
                          >
                            <td
                              className="py-2.5 pr-3 text-xs font-mono font-semibold"
                              style={{ color: primary }}
                            >
                              {s.id}
                            </td>
                            <td
                              className="py-2.5 pr-3 text-sm font-medium"
                              style={{ color: tokens.text }}
                            >
                              {s.item}
                            </td>

                            <td className="py-2.5 pr-3">
                              <ScanPill action={s.action} />
                            </td>
                            <td
                              className="py-2.5 pr-3 text-sm font-bold"
                              style={{ color: tokens.text }}
                            >
                              ×{s.qty}
                            </td>
                            <td
                              className="py-2.5 text-xs"
                              style={{ color: tokens.muted }}
                            >
                              {s.time}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            );
          })()}
        </Card>

        {/* Stock Trend Line Chart */}
        {/* <Card className="p-4 sm:p-5">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="font-bold" style={{ color: tokens.text }}>
                Stock Trend
              </p>
              <p className="text-xs" style={{ color: tokens.muted }}>
                In vs Out — Feb 2026
              </p>
            </div>
          </div>
          <div className="h-48 sm:h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={stockTrendData}
                margin={{ top: 4, right: 4, bottom: 0, left: -24 }}
              >
                <CartesianGrid
                  stroke={tokens.border}
                  strokeDasharray="4 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fill: tokens.muted, fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: tokens.muted, fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip {...tip} />
                <Line
                  type="monotone"
                  dataKey="stockIn"
                  name="Stock In"
                  stroke={primary}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: primary, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="stockOut"
                  name="Stock Out"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  dot={{ r: 2, fill: "#f59e0b", strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <span
                className="w-5 h-0.5 rounded inline-block"
                style={{ background: primary }}
              />
              <span className="text-xs" style={{ color: tokens.sub }}>
                Stock In
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-5 h-0.5 rounded inline-block"
                style={{ background: "#f59e0b", opacity: 0.8 }}
              />
              <span className="text-xs" style={{ color: tokens.sub }}>
                Stock Out
              </span>
            </div>
          </div>
        </Card> */}
      </div>

      {/* ── ROW 3: Stock In/Out Area Chart + Category Pie + Low Stock ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Category Breakdown Pie/Donut — auto-updates from live stock in/out/low stock records */}
        {(() => {
          const PIE_COLORS = ["#3b82f6","#10b981","#f59e0b","#8b5cf6","#ef4444","#ec4899"];

          // Build slices from live counts (stockIn, stockOut, lowStock) + category inventory
          // Priority: use inventoryItems if available, else fall back to aggregate counts
          let slices: { name: string; used: number; color: string }[] = [];
          let sliceTotal = 1;

          if (inventoryItems.length > 0) {
            const catMap: Record<string, number> = {};
            inventoryItems.forEach((item: any) => {
              const cat = item.categoryDescription || item.categoryId?.category?.name || "Other";
              catMap[cat] = (catMap[cat] ?? 0) + (item.quantityInStock ?? 0);
            });
            const entries = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
            const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
            slices = entries.map(([name, qty], idx) => ({
              name,
              used: Math.round((qty / total) * 95),
              color: PIE_COLORS[idx % PIE_COLORS.length],
            }));
          } else if (counts.stockIn > 0 || counts.stockOut > 0 || counts.lowStock > 0) {
            // Fallback: use live aggregate counts to build a simple pie
            const liveData = [
              { name: "Stock In",    value: counts.stockIn,  color: "#10b981" },
              { name: "Stock Out",   value: counts.stockOut, color: "#f59e0b" },
              { name: "Low Stock",   value: counts.lowStock, color: "#ef4444" },
            ].filter(d => d.value > 0);
            const total = liveData.reduce((s, d) => s + d.value, 0) || 1;
            slices = liveData.map(d => ({ name: d.name, used: Math.round((d.value / total) * 95), color: d.color }));
          }

          sliceTotal = slices.reduce((s, d) => s + d.used, 0) || 1;

          // Center label: show total items if inventory loaded, else stockIn+stockOut
          const centerValue = inventoryItems.length > 0
            ? slices.length
            : counts.stockIn + counts.stockOut;
          const centerLabel = inventoryItems.length > 0 ? "categories" : "transactions";

          return (
            <Card className="p-4 sm:p-5">
              <p className="font-bold mb-0.5" style={{ color: tokens.text }}>
                {inventoryItems.length > 0 ? "Category Breakdown" : "Stock Distribution"}
              </p>
              <p className="text-xs mb-3" style={{ color: tokens.muted }}>
                {inventoryItems.length > 0 ? "Inventory by category (live)" : "Stock in / out / low stock (live)"}
              </p>
              <div className="flex items-center justify-center my-2">
                <div className="relative" style={{ width: "min(180px, 100%)", aspectRatio: "1" }}>
                  <svg viewBox="0 0 200 200" style={{ width: "100%", height: "100%" }}>
                    {slices.length > 0 ? (() => {
                      const cx = 100, cy = 100, r = 78, inner = 48;
                      let angle = -90;
                      return slices.map((d, i) => {
                        const pct = d.used / sliceTotal;
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
                        return (
                          <path key={i}
                            d={`M ${ix1} ${iy1} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${inner} ${inner} 0 ${large} 0 ${ix1} ${iy1} Z`}
                            fill={d.color} stroke={tokens.card} strokeWidth="2" opacity={0.93}
                            style={{ cursor: "default", transition: "opacity 0.2s" }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                            onMouseLeave={e => (e.currentTarget.style.opacity = "0.93")}
                          />
                        );
                      });
                    })() : (
                      <circle cx="100" cy="100" r="78" fill={tokens.cardHover} stroke={tokens.border} strokeWidth="2" />
                    )}
                    <circle cx="100" cy="100" r="48" fill={tokens.card} />
                    <text x="100" y="94" textAnchor="middle" fontSize="20" fontWeight="800"
                      fill={tokens.text}>{centerValue}</text>
                    <text x="100" y="110" textAnchor="middle" fontSize="9" fontWeight="500"
                      fill={tokens.muted}>{centerLabel}</text>
                  </svg>
                </div>
              </div>
              <div className="mt-2 space-y-1.5">
                {slices.length > 0 ? slices.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: s.color }} />
                    <span className="text-xs flex-1 truncate" style={{ color: tokens.sub }}>{s.name}</span>
                    <div className="w-14 h-1.5 rounded-full overflow-hidden flex-shrink-0" style={{ background: tokens.cardHover }}>
                      <div style={{ width: `${s.used}%`, background: s.color, height: "100%", transition: "width 0.6s ease" }} />
                    </div>
                    <span className="text-xs font-bold w-7 text-right flex-shrink-0" style={{ color: tokens.text }}>{s.used}%</span>
                  </div>
                )) : (
                  <p className="text-xs text-center py-2" style={{ color: tokens.muted }}>Loading…</p>
                )}
              </div>
            </Card>
          );
        })()}

        {/* Area chart - stock movement */}
        {/* <Card className="p-4 sm:p-5">
          <p className="font-bold mb-0.5" style={{ color: tokens.text }}>
            Stock Movement
          </p>
          <p className="text-xs mb-3" style={{ color: tokens.muted }}>
            Daily in/out volume area view
          </p>
          <div className="h-48 sm:h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={stockTrendData}
                margin={{ top: 4, right: 4, bottom: 0, left: -22 }}
              >
                <defs>
                  <linearGradient id="gradIn2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={primary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradOut2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke={tokens.border}
                  strokeDasharray="4 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fill: tokens.muted, fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: tokens.muted, fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip {...tip} />
                <Area
                  type="monotone"
                  dataKey="stockIn"
                  name="Stock In"
                  stroke={primary}
                  fill="url(#gradIn2)"
                  strokeWidth={2}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="stockOut"
                  name="Stock Out"
                  stroke="#f59e0b"
                  fill="url(#gradOut2)"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              { l: "Peak Day", v: "Feb 18" },
              { l: "Total In", v: "211" },
              { l: "Total Out", v: "157" },
            ].map((s) => (
              <div
                key={s.l}
                className="py-2 px-2 rounded-xl text-center"
                style={{ background: tokens.cardHover }}
              >
                <p className="text-sm font-bold" style={{ color: tokens.text }}>
                  {s.v}
                </p>
                <p className="text-xs" style={{ color: tokens.muted }}>
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </Card> */}

        {/* Full low stock alert panel */}
        {/* <Card>
          <div
            className="flex items-center justify-between px-4 sm:px-5 py-4"
            style={{ borderBottom: `1px solid ${tokens.border}` }}
          >
            <div>
              <p className="font-bold" style={{ color: tokens.text }}>
                ⚠️ Low Stock Alerts
              </p>
              <p className="text-xs mt-0.5" style={{ color: tokens.muted }}>
                Read-only — contact admin to reorder
              </p>
            </div>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{ background: "#fbd8d4", color: "#8a2a2a" }}
            >
              {lowStockItems.length} items
            </span>
          </div>
          <div className="p-4 sm:p-5 space-y-3.5">
            {lowStockItems.map((item) => {
              const pct = Math.round((item.stock / item.threshold) * 100);
              const color =
                pct <= 40 ? "#ef4444" : pct <= 70 ? "#f59e0b" : "#10b981";
              return (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: tokens.text }}
                      >
                        {item.name}
                      </p>
                      <p className="text-xs" style={{ color: tokens.muted }}>
                        {item.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color }}>
                        {item.stock}
                      </p>
                      <p className="text-xs" style={{ color: tokens.muted }}>
                        of {item.threshold} min
                      </p>
                    </div>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: tokens.cardHover }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card> */}
      </div>
    </div>
  );
};

export default Home;
