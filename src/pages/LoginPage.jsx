import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  EyeIcon, EyeOffIcon, ArrowRightIcon, ArrowLeftIcon,
  CheckCircleIcon, PackageIcon, SunIcon, MoonIcon,
  ShieldCheckIcon, UserIcon,
} from "lucide-react";
import { useTheme } from "../context/HomeThemeContext";
import axios from "axios";

/*  Field  */
function Field({ name, label, type, placeholder, value, error, showPw, onTogglePw, onChange, isDark, t }) {
  const inputType = name === "password" ? (showPw ? "text" : "password") : (type || "text");
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: t.lblClr }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={inputType} value={value} placeholder={placeholder}
          autoComplete={name === "password" ? "current-password" : "email"}
          className="w-full rounded-xl px-3.5 py-2.5 text-sm border transition-all outline-none"
          style={{
            background: t.inBg, color: t.inClr,
            borderColor: error ? "#ef4444" : t.inBdr,
            paddingRight: name === "password" ? "2.5rem" : undefined,
          }}
          onChange={onChange}
        />
        {name === "password" && (
          <button type="button" onClick={onTogglePw}
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: isDark ? "rgba(255,255,255,0.38)" : "var(--text-muted)" }}
            onMouseEnter={e => e.currentTarget.style.color = isDark ? "#fff" : "var(--text-primary)"}
            onMouseLeave={e => e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.38)" : "var(--text-muted)"}>
            {showPw ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-[11px] text-red-400 mt-0.5">{error}</p>}
    </div>
  );
}

/* OTP Step  */
function OtpStep({ email, onLogin, onBack, t, isDark }) {
  const [otp, setOtp]             = useState(["", "", "", "", "", ""]);
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const [focusIdx, setFocusIdx]   = useState(-1);
  const [errorMsg, setErrorMsg]   = useState("");
  const refs = Array.from({ length: 6 }, () => null);
  const setRef = (i) => (el) => { refs[i] = el; };

  const handleChange = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    setOtp(prev => { const n = [...prev]; n[i] = v; return n; });
    if (v && i < 5) refs[i + 1]?.focus();
  };
  const handleKey   = (i, e) => { if (e.key === "Backspace" && !otp[i] && i > 0) refs[i - 1]?.focus(); };
  const handlePaste = (e) => {
    const txt = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (txt.length === 6) { setOtp(txt.split("")); refs[5]?.focus(); }
  };
  const full = otp.join("").length === 6;

  const submit = async () => {
    setErrorMsg(""); setLoading(true);
    try {
      const res = await axios.post(
        `http://localhost:8080/mail/verify-otp?email=${email}&otp=${otp.join("")}`
      );
      if (res.data === "OTP Verified" || res.status === 200) {
        await axios.delete(`http://localhost:8080/mail/delete-otp?email=${email}`).catch(() => {});
        onLogin();
      } else {
        setErrorMsg("Incorrect OTP. Please try again.");
      }
    } catch {
      setErrorMsg("Incorrect OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true); setErrorMsg(""); setOtp(["", "", "", "", "", ""]);
    try {
      await axios.delete(`http://localhost:8080/mail/delete-otp?email=${email}`).catch(() => {});
      await axios.post(`http://localhost:8080/mail/send-otp?email=${email}`);
    } catch { setErrorMsg("Failed to resend. Please go back and try again."); }
    finally { setResending(false); }
  };

  return (
    <motion.div key="otp"
      initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.2 }}>

      <div className="flex flex-col items-center gap-3 mb-5">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: t.iconBg, border: `1px solid ${t.iconBdr}` }}>🔐</div>
        <div className="text-center px-2">
          <p className="text-base sm:text-lg font-bold" style={{ color: t.txtMain }}>
            Enter Verification Code
          </p>
          <p className="text-xs sm:text-sm mt-1 leading-relaxed" style={{ color: t.txtSub }}>
            6-digit OTP sent to{" "}
            <span className="font-semibold break-all" style={{ color: t.txtMain }}>{email}</span>
          </p>
        </div>
      </div>

      <div className="flex gap-1.5 sm:gap-2.5 justify-center mb-4" onPaste={handlePaste}>
        {otp.map((d, i) => {
          const isFocused = focusIdx === i, isFilled = !!d;
          return (
            <input key={i} ref={setRef(i)} type="text" inputMode="numeric" maxLength={1} value={d}
              onChange={e => handleChange(i, e.target.value)} onKeyDown={e => handleKey(i, e)}
              onFocus={() => setFocusIdx(i)} onBlur={() => setFocusIdx(-1)}
              className="text-center font-bold rounded-xl border-2 focus:outline-none transition-all duration-150"
              style={{
                width: "clamp(2rem,11vw,2.75rem)", height: "clamp(2.4rem,13vw,3.25rem)",
                fontSize: "clamp(0.9rem,3.5vw,1.2rem)",
                background: isFilled
                  ? (isDark ? "rgba(99,102,241,0.22)" : "rgba(232,93,26,0.12)")
                  : isFocused ? (isDark ? "rgba(99,102,241,0.18)" : "rgba(232,93,26,0.08)") : t.otpBg,
                color:       isFilled ? t.otpFilledText : t.txtMain,
                borderColor: isFocused ? t.otpAccent : isFilled ? t.otpFill : t.otpBase,
                boxShadow:   isFocused ? `0 0 0 3px ${t.otpFocusGlow}` : isFilled ? `0 0 0 2px ${t.otpGlow}` : "none",
                transform:   isFocused ? "scale(1.08)" : "scale(1)",
              }} />
          );
        })}
      </div>

      {errorMsg && (
        <div className="px-3 py-2 rounded-xl text-xs font-medium text-red-400 mb-3 text-center"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          ⚠ {errorMsg}
        </div>
      )}

      <button onClick={submit} disabled={!full || loading}
        className="w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm"
        style={{ background: t.btnBg, border: `1px solid ${t.btnBdr}`, boxShadow: t.btnShadow }}>
        {loading
          ? <><svg className="animate-spin size-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>Verifying…</>
          : <><CheckCircleIcon className="size-4" />Verify &amp; Login</>}
      </button>

      <div className="flex items-center justify-between mt-3">
        <button onClick={onBack} className="text-xs hover:underline underline-offset-2"
          style={{ color: t.txtMuted }}>← Back</button>
        <p className="text-xs" style={{ color: t.txtMuted }}>
          Didn't receive?{" "}
          <button onClick={resend} disabled={resending}
            className="underline underline-offset-2 disabled:opacity-50"
            style={{ color: t.accentCl }}>
            {resending ? "Sending…" : "Resend OTP"}
          </button>
        </p>
      </div>
    </motion.div>
  );
}

/* ─── Success Step ───────────────────────────────────────────── */
function SuccessStep({ role, t, onContinue }) {
  const isAdmin = role === "admin";
  return (
    <motion.div key="success"
      initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 65 }}>
      <div className="flex flex-col items-center gap-4 text-center py-2">
        <motion.div
          className="w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center"
          style={{ background: "rgba(34,197,94,0.12)", border: "2px solid rgba(34,197,94,0.3)" }}
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 280, damping: 60 }}>
          <CheckCircleIcon className="size-7 sm:size-11 text-green-400" strokeWidth={1.6} />
        </motion.div>
        <div>
          <p className="text-xl sm:text-2xl font-bold" style={{ color: t.txtMain }}>
            Login Successful!
          </p>
          <p className="text-xs sm:text-sm mt-1.5 max-w-[260px] mx-auto" style={{ color: t.txtSub }}>
            Welcome back,{" "}
            <span className="font-semibold">{isAdmin ? "Admin" : "Staff"}</span>.
            Redirecting to your dashboard…
          </p>
        </div>
        <div className="w-full p-3 rounded-xl text-sm font-medium text-green-400"
          style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
          {isAdmin ? "🛡️" : "👤"} Logged in as {isAdmin ? "Admin" : "Staff"}
        </div>
        <button onClick={onContinue}
          className="w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-all hover:brightness-110 active:scale-[0.98] text-white text-sm"
          style={{ background: t.btnBg, border: `1px solid ${t.btnBdr}`, boxShadow: t.btnShadow }}>
          {isAdmin ? <ShieldCheckIcon className="size-4" /> : <UserIcon className="size-4" />}
          Go to {isAdmin ? "Admin" : "Staff"} Dashboard
          <ArrowRightIcon className="size-4" />
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Main ───────────────────────────────────────────────────── */
export default function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  const [role, setRole]             = useState("admin");
  const [step, setStep]             = useState(1);
  const [showPw, setShowPw]         = useState(false);
  const [errors, setErrors]         = useState({});
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [sending, setSending]       = useState(false);
  const [loginError, setLoginError] = useState("");
  const [userRole, setUserRole]     = useState("");

  const switchRole = (r) => {
    setRole(r); setStep(1); setErrors({});
    setEmail(""); setPassword(""); setLoginError(""); setShowPw(false);
  };

  /* ── Theme tokens — identical palette to SignupPage ────────── */
  const t = {
    pageBg:    isDark ? "linear-gradient(135deg,#060a14 0%,#0d1425 50%,#080c18 100%)" : "var(--bg-base)",
    cardBg:    isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.75)",
    cardBdr:   isDark ? "rgba(255,255,255,0.10)" : "var(--border)",
    cardSdw:   isDark ? "0 24px 64px rgba(0,0,0,0.5),0 1px 0 rgba(255,255,255,0.06) inset" : "var(--shadow-card)",
    txtMain:   isDark ? "#fff"                    : "var(--text-primary)",
    txtSub:    isDark ? "rgba(255,255,255,0.45)"  : "var(--text-secondary)",
    txtMuted:  isDark ? "rgba(255,255,255,0.32)"  : "var(--text-muted)",
    lblClr:    isDark ? "rgba(255,255,255,0.50)"  : "var(--text-muted)",
    inBg:      isDark ? "rgba(255,255,255,0.07)"  : "rgba(255,255,255,0.9)",
    inClr:     isDark ? "#fff"                    : "var(--text-primary)",
    inBdr:     isDark ? "rgba(255,255,255,0.13)"  : "var(--border)",
    btnBg:     isDark ? "#3b82f6"                 : "var(--accent)",
    btnBdr:    isDark ? "#2563eb"                 : "transparent",
    btnShadow: isDark ? "0 4px 18px rgba(37,99,235,0.40)" : "0 4px 14px rgba(232,93,26,0.30)",
    stepAct:   isDark
      ? { background: "rgba(255,255,255,0.9)", color: "#060a14" }
      : { background: "var(--accent)", color: "#fff" },
    stepIna:   isDark
      ? { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.35)" }
      : { background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)" },
    stepLine:  isDark
      ? (step > 1 ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.12)")
      : (step > 1 ? "var(--accent)" : "var(--border)"),
    togBg:     isDark ? "rgba(255,255,255,0.08)"  : "var(--bg-card)",
    togBdr:    isDark ? "rgba(255,255,255,0.14)"  : "var(--border)",
    togClr:    isDark ? "rgba(255,255,255,0.70)"  : "var(--text-secondary)",
    backClr:   isDark ? "rgba(255,255,255,0.50)"  : "var(--text-muted)",
    accentCl:  isDark ? "rgba(255,255,255,0.75)"  : "var(--accent)",
    logoSub:   isDark ? "rgba(255,255,255,0.40)"  : "var(--text-muted)",
    fgotClr:   isDark ? "rgba(255,255,255,0.42)"  : "var(--text-muted)",
    tabWrap:   isDark ? "rgba(255,255,255,0.06)"  : "rgba(0,0,0,0.05)",
    tabActBg:  isDark ? "rgba(255,255,255,0.12)"  : "rgba(255,255,255,0.95)",
    tabActClr: isDark ? "#fff"                    : "var(--text-primary)",
    tabInaClr: isDark ? "rgba(255,255,255,0.38)"  : "var(--text-muted)",
    iconBg:    isDark ? "rgba(255,255,255,0.08)"  : "rgba(0,0,0,0.04)",
    iconBdr:   isDark ? "rgba(255,255,255,0.14)"  : "rgba(0,0,0,0.09)",
    otpBg:        isDark ? "rgba(255,255,255,0.06)"  : "rgba(255,255,255,0.85)",
    otpBase:      isDark ? "rgba(255,255,255,0.15)"  : "rgba(0,0,0,0.13)",
    otpAccent:    isDark ? "#818cf8"                 : "#e85d1a",
    otpFill:      isDark ? "#818cf8"                 : "#e85d1a",
    otpGlow:      isDark ? "rgba(129,140,248,0.30)"  : "rgba(232,93,26,0.25)",
    otpFocusGlow: isDark ? "rgba(129,140,248,0.45)"  : "rgba(232,93,26,0.35)",
    otpFilledText:isDark ? "#e0e7ff"                 : "#c2410c",
  };

  /* ── Validate ─────────────────────────────────────────────── */
  const validate = () => {
    const e = {};
    if (!email.includes("@")) e.email    = "Valid email required";
    if (password.length < 6)  e.password = "Password required (min 6 chars)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Step 1: verify creds → decode role → send OTP ─────────── */
  const handleSendOtp = async () => {
    if (!validate()) return;
    setSending(true); setLoginError("");
    try {
      const loginRes = await axios.post("http://localhost:8080/api/auth/login", { email, password });
      const token    = loginRes.data.token;
      const payload  = JSON.parse(atob(token.split(".")[1]));
      const jwtRole  = (payload.role || "").toUpperCase();
      const expected = role === "admin" ? "ADMIN" : "STAFF";

      if (jwtRole !== expected) {
        const other = jwtRole === "ADMIN" ? "Admin" : "Staff";
        setLoginError(`This account is registered as ${other}. Please switch to the ${other} tab.`);
        setSending(false); return;
      }

      setUserRole(jwtRole);
      localStorage.setItem("token_pending", token);
      await axios.delete(`http://localhost:8080/mail/delete-otp?email=${email}`).catch(() => {});
      await axios.post(`http://localhost:8080/mail/send-otp?email=${email}`);
      setStep(2);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setLoginError("Invalid email or password. Please check your credentials.");
      } else {
        setLoginError("Unable to connect to the server. Please try again.");
      }
    } finally {
      setSending(false);
    }
  };

  /* ── OTP confirmed → commit token → show success ─────────── */
  const handleOtpSuccess = () => {
    const token = localStorage.getItem("token_pending") || "";
    if (token) { localStorage.setItem("token", token); localStorage.removeItem("token_pending"); }
    if (onLoginSuccess) onLoginSuccess(token);
    setStep(3);
  };

  const goDashboard = () => navigate(userRole === "ADMIN" ? "/admin" : "/staff");

  /* ── Demo placeholder hints ───────────────────────────────── */
  const DEMO = {
    admin: { email: "Admin@company.com" },
    staff: { email: "Staff@company.com" },
  };

  return (
    <div className="min-h-screen w-full flex flex-col overflow-x-hidden" style={{ background: t.pageBg }}>

      {/* ── Background orbs ───────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {isDark ? (<>
          <div className="absolute -top-32 -right-32 w-[300px] h-[300px] sm:w-[660px] sm:h-[660px] rounded-full"
            style={{ background: "radial-gradient(circle,rgba(59,130,246,0.18) 0%,transparent 70%)" }} />
          <div className="absolute -bottom-40 -left-20 w-[300px] h-[300px] sm:w-[700px] sm:h-[700px] rounded-full"
            style={{ background: "radial-gradient(circle,rgba(99,102,241,0.14) 0%,transparent 65%)" }} />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[180px] h-[180px] sm:w-[440px] sm:h-[440px] rounded-full"
            style={{ background: "radial-gradient(circle,rgba(139,92,246,0.10) 0%,transparent 70%)" }} />
        </>) : (<>
          <div className="absolute -top-24 -right-24 w-[580px] h-[580px] rounded-full"
            style={{ background: "radial-gradient(circle,var(--orb1) 0%,transparent 68%)" }} />
          <div className="absolute -bottom-32 -left-16 w-[650px] h-[650px] rounded-full"
            style={{ background: "radial-gradient(circle,var(--orb2) 0%,transparent 65%)" }} />
        </>)}
      </div>

      {/* ── Top bar ───────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-8 pt-5 pb-2">
        <button onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: t.backClr }}
          onMouseEnter={e => e.currentTarget.style.color = isDark ? "#fff" : "var(--text-primary)"}
          onMouseLeave={e => e.currentTarget.style.color = t.backClr}>
          <ArrowLeftIcon className="size-4" /> Back to home
        </button>
        <button onClick={toggle} className="p-2 rounded-lg transition-colors"
          style={{ background: t.togBg, border: `1px solid ${t.togBdr}`, color: t.togClr }}>
          {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
        </button>
      </div>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-4 sm:py-8">
        <motion.div className="w-full max-w-[460px]"
          initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 60 }}>

          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-5 justify-center">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
              style={{
                background: isDark
                  ? "linear-gradient(135deg,#3b82f6,#1d4ed8)"
                  : "linear-gradient(135deg,#e85d1a,#f97316)",
                boxShadow: isDark
                  ? "0 4px 14px rgba(37,99,235,0.4)"
                  : "0 4px 14px rgba(232,93,26,0.4)",
              }}>
              <PackageIcon className="size-5 text-white" strokeWidth={1.8} />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-extrabold tracking-wide" style={{ color: t.txtMain }}>IIM</p>
              <p className="text-[10px] font-medium" style={{ color: t.logoSub }}>
                Internal Inventory Management
              </p>
            </div>
          </div>

          {/* ── Role tabs (step 1 only) ─────────────────────── */}
          {step === 1 && (
            <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: t.tabWrap }}>
              {[
                { key: "admin", label: "Admin Account", Icon: ShieldCheckIcon },
                { key: "staff", label: "Staff Account",  Icon: UserIcon },
              ].map(({ key, label, Icon }) => (
                <button key={key} onClick={() => switchRole(key)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all min-w-0"
                  style={role === key
                    ? { background: t.tabActBg, color: t.tabActClr, boxShadow: "0 1px 6px rgba(0,0,0,0.18)" }
                    : { background: "transparent", color: t.tabInaClr }}>
                  <Icon className="size-3.5 sm:size-4 flex-shrink-0" strokeWidth={1.8} />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          )}

          {/* ── Step indicators ────────────────────────────── */}
          {step < 3 && (
            <div className="flex items-center justify-center gap-3 mb-4">
              {[1, 2].map(s => (
                <div key={s} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all flex-shrink-0"
                    style={step >= s ? t.stepAct : t.stepIna}>
                    {step > s ? <CheckCircleIcon className="size-4" /> : s}
                  </div>
                  {s === 1 && (
                    <div className="w-12 h-px transition-all duration-500" style={{ background: t.stepLine }} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Card ────────────────────────────────────────── */}
          <div className="rounded-2xl p-5 sm:p-7"
            style={{
              background: t.cardBg,
              border: `1px solid ${t.cardBdr}`,
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              boxShadow: t.cardSdw,
            }}>
            <AnimatePresence mode="wait">

              {/* ── Step 1: Credentials ─────────────────────── */}
              {step === 1 && (
                <motion.div key={`login-${role}`}
                  initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.2 }}>

                  <h1 className="text-lg sm:text-xl font-bold mb-0.5" style={{ color: t.txtMain }}>
                    Welcome back
                  </h1>
                  <p className="text-xs sm:text-sm mb-5" style={{ color: t.txtSub }}>
                    Log in as{" "}
                    <span className="font-semibold" style={{ color: t.accentCl }}>
                      {role === "admin" ? "Admin" : "Staff"}
                    </span>{" "}
                    to access your dashboard.
                  </p>

                  <div className="flex flex-col gap-3">
                    <Field
                      name="email" label="Work Email" type="email"
                      placeholder={DEMO[role].email}
                      value={email} error={errors.email}
                      showPw={showPw} onTogglePw={() => setShowPw(v => !v)}
                      onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: "" })); setLoginError(""); }}
                      isDark={isDark} t={t}
                    />

                    <Field
                      name="password" label="Password" type="password"
                      placeholder="Min. 8 chars"
                      value={password} error={errors.password}
                      showPw={showPw} onTogglePw={() => setShowPw(v => !v)}
                      onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: "" })); setLoginError(""); }}
                      isDark={isDark} t={t}
                    />

                    <div className="flex justify-end -mt-1">
                      <button
                        onClick={() => navigate("/forgot-password")}
                        className="text-xs hover:underline underline-offset-2 transition-colors"
                        style={{ color: t.fgotClr }}
                        onMouseEnter={e => e.currentTarget.style.color = t.accentCl}
                        onMouseLeave={e => e.currentTarget.style.color = t.fgotClr}>
                        Forgot password?
                      </button>
                    </div>

                    {/* Inline login error */}
                    {loginError && (
                      <div className="px-3 py-2.5 rounded-xl text-xs font-medium text-red-400"
                        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                        ⚠ {loginError}
                      </div>
                    )}

                    {/* CTA */}
                    <button onClick={handleSendOtp} disabled={sending}
                      className="w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl mt-0.5 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm"
                      style={{ background: t.btnBg, border: `1px solid ${t.btnBdr}`, boxShadow: t.btnShadow }}>
                      {sending
                        ? <><svg className="animate-spin size-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>Sending OTP…</>
                        : <>Send OTP <ArrowRightIcon className="size-4" /></>}
                    </button>
                  </div>

                  <p className="text-xs text-center mt-4" style={{ color: t.txtMuted }}>
                    Don't have an account?{" "}
                    <button onClick={() => navigate("/signup")}
                      className="font-medium hover:underline underline-offset-2"
                      style={{ color: t.accentCl }}>
                      Sign up
                    </button>
                  </p>
                </motion.div>
              )}

              {/* ── Step 2: OTP ─────────────────────────────── */}
              {step === 2 && (
                <OtpStep
                  email={email}
                  onLogin={handleOtpSuccess}
                  onBack={() => setStep(1)}
                  t={t} isDark={isDark}
                />
              )}

              {/* ── Step 3: Success ─────────────────────────── */}
              {step === 3 && (
                <SuccessStep role={role} t={t} onContinue={goDashboard} />
              )}

            </AnimatePresence>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
