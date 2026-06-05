import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PackageIcon, SunIcon, MoonIcon } from "lucide-react";
import { useTheme } from "../context/HomeThemeContext";

export default function GetStartedPage() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  /* ── Theme tokens ────────────────────────────────────────────── */
  const t = {
    pageBg: isDark
      ? "linear-gradient(135deg,#060a14 0%,#0d1425 50%,#080c18 100%)"
      : "var(--bg-base)",
    cardBg: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.80)",
    cardBdr: isDark ? "rgba(255,255,255,0.10)" : "var(--border)",
    cardSdw: isDark
      ? "0 24px 64px rgba(0,0,0,0.5),0 1px 0 rgba(255,255,255,0.06) inset"
      : "0 8px 40px rgba(0,0,0,0.10)",
    txtPrimary: isDark ? "#ffffff" : "var(--text-primary)",
    txtSecondary: isDark ? "rgba(255,255,255,0.55)" : "var(--text-secondary)",
    txtMuted: isDark ? "rgba(255,255,255,0.35)" : "var(--text-muted)",
    accentLabel: isDark ? "#60a5fa" : "var(--accent)",
    divider: isDark ? "rgba(255,255,255,0.10)" : "var(--border)",
    /* Register Now button */
    btnBg: isDark
      ? "linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%)"
      : "linear-gradient(135deg,#e85d1a 0%,#f97316 100%)",
    btnShadow: isDark
      ? "0 6px 20px rgba(37,99,235,0.45)"
      : "0 6px 20px rgba(232,93,26,0.40)",
    /* Login link */
    loginClr: isDark ? "#60a5fa" : "#e85d1a",
    /* Logo icon */
    logoGrad: isDark
      ? "linear-gradient(135deg,#3b82f6,#1d4ed8)"
      : "linear-gradient(135deg,#e85d1a,#f97316)",
    logoShadow: isDark
      ? "0 4px 14px rgba(37,99,235,0.40)"
      : "0 4px 14px rgba(232,93,26,0.40)",
    logoSub: isDark ? "rgba(255,255,255,0.40)" : "var(--text-muted)",
    togBg: isDark ? "rgba(255,255,255,0.08)" : "var(--bg-card)",
    togBdr: isDark ? "rgba(255,255,255,0.14)" : "var(--border)",
    togClr: isDark ? "rgba(255,255,255,0.70)" : "var(--text-secondary)",
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col overflow-x-hidden"
      style={{ background: t.pageBg }}
    >
      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {isDark ? (
          <>
            <div
              className="absolute -top-32 -right-32 w-[580px] h-[580px] rounded-full"
              style={{ background: "radial-gradient(circle,rgba(59,130,246,0.18) 0%,transparent 70%)" }}
            />
            <div
              className="absolute -bottom-40 -left-20 w-[620px] h-[620px] rounded-full"
              style={{ background: "radial-gradient(circle,rgba(99,102,241,0.14) 0%,transparent 65%)" }}
            />
          </>
        ) : (
          <>
            <div
              className="absolute -top-24 -right-24 w-[580px] h-[580px] rounded-full"
              style={{ background: "radial-gradient(circle,rgba(255,165,90,0.45) 0%,transparent 68%)" }}
            />
            <div
              className="absolute -bottom-32 -left-16 w-[650px] h-[650px] rounded-full"
              style={{ background: "radial-gradient(circle,rgba(195,165,240,0.35) 0%,transparent 65%)" }}
            />
          </>
        )}
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-8 pt-5 pb-2">
        {/* Logo — left */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: t.logoGrad, boxShadow: t.logoShadow }}
          >
            <PackageIcon className="size-5 text-white" strokeWidth={1.8} />
          </div>
          <div className="leading-tight text-left">
            <p className="text-sm font-extrabold tracking-wide" style={{ color: t.txtPrimary }}>
              IIM
            </p>
            <p className="text-[10px] font-medium" style={{ color: t.logoSub }}>
              Internal Inventory Management
            </p>
          </div>
        </button>

        {/* Theme toggle — right */}
        <button
          onClick={toggle}
          className="p-2 rounded-lg transition-colors"
          style={{
            background: t.togBg,
            border: `1px solid ${t.togBdr}`,
            color: t.togClr,
          }}
        >
          {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
        </button>
      </div>

      {/* Main content — centred */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <motion.div
          className="w-full max-w-[480px]"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 60 }}
        >
          {/* Card */}
          <div
            className="rounded-2xl px-8 py-10 sm:px-12 sm:py-12 flex flex-col items-center text-center"
            style={{
              background: t.cardBg,
              border: `1px solid ${t.cardBdr}`,
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              boxShadow: t.cardSdw,
            }}
          >
            {/* WELCOME TO label */}
            <p
              className="text-xs font-extrabold uppercase tracking-[0.18em] mb-2"
              style={{ color: t.accentLabel }}
            >
              Welcome to
            </p>

            {/* Title */}
            <h1
              className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4"
              style={{ color: t.txtPrimary }}
            >
              IIM Groups
            </h1>

            {/* Subtitle */}
            <p
              className="text-sm sm:text-base leading-relaxed max-w-xs mb-6"
              style={{ color: t.txtSecondary }}
            >
              Your secure, role-based platform for internal inventory management.
              Create an account to get started.
            </p>

            {/* Divider */}
            <div
              className="w-24 h-px mb-8"
              style={{ background: t.divider }}
            />

            {/* Register Now button */}
            <motion.button
              onClick={() => navigate("/signup")}
              className="w-full sm:w-auto sm:px-16 py-3.5 rounded-full text-white font-bold text-sm sm:text-base transition-all hover:brightness-110 active:scale-95"
              style={{
                background: t.btnBg,
                boxShadow: t.btnShadow,
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Register Now
            </motion.button>

            {/* Login link */}
            <p
              className="mt-5 text-sm font-medium"
              style={{ color: t.txtSecondary }}
            >
              Already Registered?{" "}
              <button
                onClick={() => navigate("/login")}
                className="font-bold underline underline-offset-2 transition-colors hover:opacity-80"
                style={{ color: t.loginClr }}
              >
                LOGIN HERE
              </button>
            </p>
          </div>

          {/* Footer note */}
          <p
            className="text-center text-[11px] mt-5"
            style={{ color: t.txtMuted }}
          >
            Authorized users only · Secure role-based access
          </p>
        </motion.div>
      </div>
    </div>
  );
}
