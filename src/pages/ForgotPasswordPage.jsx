import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  PackageIcon,
  SunIcon,
  MoonIcon,
  MailIcon,
  EyeIcon,
  EyeOffIcon,
  ShieldCheckIcon,
  UserIcon,
} from "lucide-react";
import axios from "axios";
import { useTheme } from "../context/HomeThemeContext";

/* OTP boxes */
function OtpBoxes({ otp, setOtp, t }) {
  const refs = useRef([]);
  const [focusIdx, setFocusIdx] = useState(-1);
  
  const handleChange = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    setOtp((prev) => {
      const n = [...prev];
      n[i] = v;
      return n;
    });
    if (v && i < 5) refs.current[i + 1]?.focus();
  };
  const handleKey = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };
  const handlePaste = (e) => {
    const txt = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (txt.length === 6) {
      setOtp(txt.split(""));
      refs.current[5]?.focus();
    }
  };

  return (
    <div className="flex gap-2 sm:gap-3 justify-center" onPaste={handlePaste}>
      {otp.map((d, i) => {
        const isFocused = focusIdx === i,
          isFilled = !!d;
        const borderColor = isFocused
          ? t.otpAccent
          : isFilled
            ? t.otpFill
            : t.otpBase;
        const boxShadow = isFocused
          ? `0 0 0 3px ${t.otpFocusGlow}`
          : isFilled
            ? `0 0 0 2px ${t.otpGlow}`
            : "none";
        const bg = isFilled
          ? t.otpFilledBg
          : isFocused
            ? t.otpFocusBg
            : t.otpBg;
        return (
          <input
            key={i}
            ref={(el) => (refs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKey(i, e)}
            onFocus={() => setFocusIdx(i)}
            onBlur={() => setFocusIdx(-1)}
            className="text-center text-xl font-bold rounded-xl border-2 focus:outline-none transition-all duration-150"
            style={{
              width: "clamp(2.5rem,12vw,3rem)",
              height: "clamp(3rem,14vw,3.5rem)",
              background: bg,
              color: isFilled ? t.otpFilledText : t.txtMain,
              borderColor,
              boxShadow,
              transform: isFocused ? "scale(1.1)" : "scale(1)",
            }}
          />
        );
      })}
    </div>
  );
}

/* Field */
function Field({
  name,
  label,
  type,
  value,
  error,
  onChange,
  Icon,
  showPw,
  onTogglePw,
  t,
  placeholder,
}) {
  const resolvedType =
    name === "password" || name === "confirmPassword"
      ? showPw
        ? "text"
        : "password"
      : type || "text";
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: t.lblClr }}
      >
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <div
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: t.iconInClr }}
          >
            <Icon className="size-4" strokeWidth={1.75} />
          </div>
        )}
        <input
          type={resolvedType}
          value={value}
          autoComplete="off"
          placeholder={placeholder}
          className="auth-input w-full rounded-xl py-3 text-sm border transition-all"
          style={{
            paddingLeft: Icon ? "2.75rem" : "1rem",
            paddingRight: onTogglePw ? "2.75rem" : "1rem",
            background: t.inBg,
            color: t.inClr,
            borderColor: error ? "#ef4444" : t.inBdr,
          }}
          onChange={onChange}
        />
        {onTogglePw && (
          <button
            type="button"
            onClick={onTogglePw}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: t.iconInClr }}
          >
            {showPw ? (
              <EyeOffIcon className="size-4" />
            ) : (
              <EyeIcon className="size-4" />
            )}
          </button>
        )}
      </div>
      {error && <p className="text-[11px] text-red-400 mt-0.5">{error}</p>}
    </div>
  );
}

/* Step dots */
function StepDots({ step, t }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-7">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
            style={step >= s ? t.stepAct : t.stepIna}
          >
            {step > s ? <CheckCircleIcon className="size-3.5" /> : s}
          </div>
          {s < 3 && (
            <div
              className="w-10 h-px transition-all duration-500"
              style={{ background: step > s ? t.lineAct : t.lineIna }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* Main  */
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  /* Detect role from URL path */
  const isAdmin = location.pathname.startsWith("/admin");
  const isStaff = location.pathname.startsWith("/staff");
  const loginPath = isAdmin
    ? "/admin/login"
    : isStaff
      ? "/staff/login"
      : "/login";
  const RoleIcon = isAdmin ? ShieldCheckIcon : isStaff ? UserIcon : PackageIcon;
  const roleLabel = isAdmin ? "IIM — Admin" : isStaff ? "IIM — Staff" : "IIM";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpErr, setOtpErr] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwErrors, setPwErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [resending, setResending] = useState(false);


  useEffect(() => {
    setStep(1);
    setLoading(false);
    setEmail("");
    setEmailErr("");
    setOtp(["", "", "", "", "", ""]);
    setOtpErr("");
    setNewPw("");
    setConfirmPw("");
    setPwErrors({});
    setShowPw(false);
  }, []);

  /* theme tokens */
  const t = {
    pageBg: isDark
      ? "linear-gradient(135deg,#060a14 0%,#0d1425 50%,#080c18 100%)"
      : "var(--bg-base)",
    cardBg: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.75)",
    cardBdr: isDark ? "rgba(255,255,255,0.10)" : "var(--border)",
    cardSdw: isDark
      ? "0 24px 64px rgba(0,0,0,0.5),0 1px 0 rgba(255,255,255,0.06) inset"
      : "var(--shadow-card)",
    txtMain: isDark ? "#fff" : "var(--text-primary)",
    txtSub: isDark ? "rgba(255,255,255,0.45)" : "var(--text-secondary)",
    txtMuted: isDark ? "rgba(255,255,255,0.32)" : "var(--text-muted)",
    lblClr: isDark ? "rgba(255,255,255,0.50)" : "var(--text-muted)",
    inBg: isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.9)",
    inClr: isDark ? "#fff" : "var(--text-primary)",
    inBdr: isDark ? "rgba(255,255,255,0.13)" : "var(--border)",
    iconInClr: isDark ? "rgba(255,255,255,0.28)" : "var(--text-muted)",
    btnBg: isDark ? "#3b82f6" : "var(--accent)",
    btnBdr: isDark ? "#2563eb" : "transparent",
    btnShadow: isDark
      ? "0 4px 18px rgba(37,99,235,0.40)"
      : "0 4px 14px rgba(232,93,26,0.30)",
    togBg: isDark ? "rgba(255,255,255,0.08)" : "var(--bg-card)",
    togBdr: isDark ? "rgba(255,255,255,0.14)" : "var(--border)",
    togClr: isDark ? "rgba(255,255,255,0.70)" : "var(--text-secondary)",
    backClr: isDark ? "rgba(255,255,255,0.50)" : "var(--text-muted)",
    accentCl: isDark ? "rgba(255,255,255,0.75)" : "var(--accent)",
    logoSub: isDark ? "rgba(255,255,255,0.40)" : "var(--text-muted)",
    iconBg: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
    iconBdr: isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.09)",
    stepAct: isDark
      ? { background: "rgba(255,255,255,0.9)", color: "#060a14" }
      : { background: "var(--accent)", color: "#fff" },
    stepIna: isDark
      ? {
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "rgba(255,255,255,0.35)",
        }
      : {
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          color: "var(--text-muted)",
        },
    lineAct: isDark ? "rgba(255,255,255,0.55)" : "var(--accent)",
    lineIna: isDark ? "rgba(255,255,255,0.12)" : "var(--border)",
    otpBg: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.85)",
    otpFocusBg: isDark ? "rgba(99,102,241,0.18)" : "rgba(232,93,26,0.08)",
    otpFilledBg: isDark ? "rgba(99,102,241,0.22)" : "rgba(232,93,26,0.12)",
    otpBase: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.13)",
    otpAccent: isDark ? "#818cf8" : "#e85d1a",
    otpFill: isDark ? "#818cf8" : "#e85d1a",
    otpGlow: isDark ? "rgba(129,140,248,0.30)" : "rgba(232,93,26,0.25)",
    otpFocusGlow: isDark ? "rgba(129,140,248,0.45)" : "rgba(232,93,26,0.35)",
    otpFilledText: isDark ? "#e0e7ff" : "#c2410c",
  };

  const handleSendOtp = async () => {
    if (!email.trim() || !email.includes("@")) {
      setEmailErr("Please enter a valid email address.");
      return;
    }

    setEmailErr("");
    setLoading(true);

    try {
      await axios
        .delete(`http://localhost:8080/mail/delete-otp?email=${email}`)
        .catch(() => {});

      await axios.post(`http://localhost:8080/mail/send-otp?email=${email}`);

      setStep(2);
    } catch (error) {
      setEmailErr("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };
 const handleVerifyOtp = async () => {

  const code = otp.join("");

  if (code.length !== 6) {
    setOtpErr("Please enter the complete 6-digit code.");
    return;
  }

  setOtpErr("");
  setLoading(true);

  try {

    const res = await axios.post(
      `http://localhost:8080/mail/verify-otp?email=${encodeURIComponent(email)}&otp=${code}`
    );

    if (res.data === "OTP Verified") {

      await axios.delete(
        `http://localhost:8080/mail/delete-otp?email=${encodeURIComponent(email)}`
      ).catch(() => {});

      setStep(3);

    } else {

      setOtpErr("Invalid OTP. Please try again.");

    }

  } catch (error) {

    setOtpErr("Invalid OTP. Please try again.");

  } finally {

    setLoading(false);

  }

};
const handleResetPassword = async () => {
  const errors = {};

  if (newPw.length < 8)
    errors.newPw = "Password must be at least 8 characters.";

  if (newPw !== confirmPw)
    errors.confirmPw = "Passwords do not match.";

  if (Object.keys(errors).length) {
    setPwErrors(errors);
    return;
  }

  setLoading(true);

  try {
    await axios.post(
      `http://localhost:8080/mail/reset-password?email=${encodeURIComponent(email)}&newPassword=${encodeURIComponent(newPw)}`
    );
    navigate(loginPath);
  } catch (error) {
    setPwErrors({ newPw: "Failed to reset password. Please try again." });
  } finally {
    setLoading(false);
  }
};
  return (
    <div
      className="min-h-screen w-full flex flex-col overflow-x-hidden"
      style={{ background: t.pageBg }}
    >
      {/* Background orbs */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 0 }}
      >
        {isDark ? (
          <>
            <div
              className="absolute -top-32 -right-28 w-[380px] h-[380px] sm:w-[660px] sm:h-[660px] rounded-full"
              style={{
                background:
                  "radial-gradient(circle,rgba(59,130,246,0.18) 0%,transparent 70%)",
              }}
            />
            <div
              className="absolute -bottom-36 -left-24 w-[380px] h-[380px] sm:w-[700px] sm:h-[700px] rounded-full"
              style={{
                background:
                  "radial-gradient(circle,rgba(99,102,241,0.14) 0%,transparent 65%)",
              }}
            />
            <div
              className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[240px] h-[240px] sm:w-[440px] sm:h-[440px] rounded-full"
              style={{
                background:
                  "radial-gradient(circle,rgba(139,92,246,0.10) 0%,transparent 70%)",
              }}
            />
          </>
        ) : (
          <>
            <div
              className="absolute -top-28 -right-20 w-[580px] h-[580px] rounded-full"
              style={{
                background:
                  "radial-gradient(circle,var(--orb1) 0%,transparent 68%)",
              }}
            />
            <div
              className="absolute -bottom-32 -left-16 w-[650px] h-[650px] rounded-full"
              style={{
                background:
                  "radial-gradient(circle,var(--orb2) 0%,transparent 65%)",
              }}
            />
            <div
              className="absolute top-1/2 right-1/3 w-[360px] h-[360px] rounded-full"
              style={{
                background:
                  "radial-gradient(circle,var(--orb3) 0%,transparent 70%)",
              }}
            />
          </>
        )}
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-8 pt-5 sm:pt-6 pb-2">
        <button
          onClick={() =>
            step === 1 ? navigate(loginPath) : setStep((s) => s - 1)
          }
          className="flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: t.backClr }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = isDark
              ? "#fff"
              : "var(--text-primary)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.color = t.backClr)}
        >
          <ArrowLeftIcon className="size-4" />
          {step === 1 ? "Back to login" : "Back"}
        </button>
        <button
          onClick={toggle}
          className="p-2 rounded-lg transition-colors"
          style={{
            background: t.togBg,
            border: `1px solid ${t.togBdr}`,
            color: t.togClr,
          }}
        >
          {isDark ? (
            <SunIcon className="size-4" />
          ) : (
            <MoonIcon className="size-4" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-10">
        <motion.div
          className="w-full max-w-[420px] sm:max-w-md"
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 60 }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-7 justify-center">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: isDark
                  ? "linear-gradient(135deg,#3b82f6,#1d4ed8)"
                  : "linear-gradient(135deg,#e85d1a,#f97316)",
                boxShadow: isDark
                  ? "0 4px 14px rgba(37,99,235,0.4)"
                  : "0 4px 14px rgba(232,93,26,0.4)",
              }}
            >
              <RoleIcon className="size-5 text-white" strokeWidth={1.8} />
            </div>
            <div className="leading-tight">
              <p
                className="text-sm font-extrabold tracking-wide"
                style={{ color: t.txtMain }}
              >
                {roleLabel}
              </p>
              <p
                className="text-[10px] font-medium"
                style={{ color: t.logoSub }}
              >
                Internal Inventory Management
              </p>
            </div>
          </div>

          <StepDots step={step} t={t} />

          {/* Card */}
          <div
            className="rounded-2xl p-6 sm:p-8"
            style={{
              background: t.cardBg,
              border: `1px solid ${t.cardBdr}`,
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              boxShadow: t.cardSdw,
            }}
          >
            <AnimatePresence mode="wait">
              {/* Step 1 — Email */}
              {step === 1 && (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex flex-col items-center mb-6 text-center">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-4"
                      style={{
                        background: t.iconBg,
                        border: `1px solid ${t.iconBdr}`,
                      }}
                    >
                      🔑
                    </div>
                    <h1
                      className="text-xl sm:text-2xl font-bold"
                      style={{ color: t.txtMain }}
                    >
                      Forgot password?
                    </h1>
                    <p
                      className="text-sm mt-2 max-w-xs leading-relaxed"
                      style={{ color: t.txtSub }}
                    >
                      Enter your registered email and we'll send a 6-digit
                      verification code.
                    </p>
                  </div>
                  <div className="flex flex-col gap-4">
                    <Field
                      name="email"
                      label="Email Address"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      error={emailErr}
                      Icon={MailIcon}
                      t={t}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailErr("");
                      }}
                    />
                    <button
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 font-semibold py-3.5 rounded-xl mt-1 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 text-white"
                      style={{
                        background: t.btnBg,
                        border: `1px solid ${t.btnBdr}`,
                        boxShadow: t.btnShadow,
                      }}
                    >
                      {loading ? (
                        <>
                          <svg
                            className="animate-spin size-4"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8z"
                            />
                          </svg>
                          Sending…
                        </>
                      ) : (
                        <>
                          Send Code <ArrowRightIcon className="size-4" />
                        </>
                      )}
                    </button>
                  </div>
                  <p
                    className="text-xs text-center mt-5"
                    style={{ color: t.txtMuted }}
                  >
                    Remember your password?{" "}
                    <button
                      onClick={() => navigate(loginPath)}
                      className="font-medium hover:underline underline-offset-2"
                      style={{ color: t.accentCl }}
                    >
                      Log in
                    </button>
                  </p>
                </motion.div>
              )}

              {/* Step 2 — OTP */}
              {step === 2 && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex flex-col items-center mb-6 text-center">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-4"
                      style={{
                        background: t.iconBg,
                        border: `1px solid ${t.iconBdr}`,
                      }}
                    >
                      📩
                    </div>
                    <h1
                      className="text-xl sm:text-2xl font-bold"
                      style={{ color: t.txtMain }}
                    >
                      Enter verification code
                    </h1>
                    <p
                      className="text-sm mt-2 max-w-xs leading-relaxed"
                      style={{ color: t.txtSub }}
                    >
                      A 6-digit code was sent to{" "}
                      <span
                        className="font-semibold"
                        style={{ color: t.txtMain }}
                      >
                        {email}
                      </span>
                    </p>
                  </div>
                  <OtpBoxes
                    otp={otp}
                    setOtp={(v) => {
                      setOtp(v);
                      setOtpErr("");
                    }}
                    t={t}
                  />
                  {otpErr && (
                    <p className="text-[11px] text-red-400 text-center mt-2">
                      {otpErr}
                    </p>
                  )}
                  <button
                    onClick={handleVerifyOtp}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 font-semibold py-3.5 rounded-xl mt-5 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white"
                    style={{
                      background: t.btnBg,
                      border: `1px solid ${t.btnBdr}`,
                      boxShadow: t.btnShadow,
                    }}
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin size-4"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8z"
                          />
                        </svg>
                        Verifying…
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="size-4" />
                        Verify Code
                      </>
                    )}
                  </button>
                  <div className="flex items-center justify-between mt-4">
                    <button
                      onClick={() => setStep(1)}
                      className="text-xs hover:underline underline-offset-2"
                      style={{ color: t.txtMuted }}
                    >
                      ← Change email
                    </button>
                    <button
                      className="text-xs hover:underline underline-offset-2"
                      style={{ color: t.accentCl }}
                    >
                      Resend code
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3 — New password */}
              {step === 3 && (
                <motion.div
                  key="reset"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex flex-col items-center mb-6 text-center">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-4"
                      style={{
                        background: t.iconBg,
                        border: `1px solid ${t.iconBdr}`,
                      }}
                    >
                      🔒
                    </div>
                    <h1
                      className="text-xl sm:text-2xl font-bold"
                      style={{ color: t.txtMain }}
                    >
                      Reset password
                    </h1>
                    <p
                      className="text-sm mt-2 max-w-xs leading-relaxed"
                      style={{ color: t.txtSub }}
                    >
                      Create a new password for your account.
                    </p>
                  </div>
                  <div className="flex flex-col gap-4">
                    <Field
                      name="password"
                      label="New Password"
                      type="password"
                      placeholder="Min. 8 characters"
                      value={newPw}
                      error={pwErrors.newPw}
                      t={t}
                      showPw={showPw}
                      onTogglePw={() => setShowPw((v) => !v)}
                      onChange={(e) => {
                        setNewPw(e.target.value);
                        setPwErrors((p) => ({ ...p, newPw: "" }));
                      }}
                    />
                    <Field
                      name="confirmPassword"
                      label="Confirm Password"
                      type="password"
                      placeholder="Re-enter your password"
                      value={confirmPw}
                      error={pwErrors.confirmPw}
                      t={t}
                      showPw={showPw}
                      onTogglePw={() => setShowPw((v) => !v)}
                      onChange={(e) => {
                        setConfirmPw(e.target.value);
                        setPwErrors((p) => ({ ...p, confirmPw: "" }));
                      }}
                    />
                    <button
                      onClick={handleResetPassword}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 font-semibold py-3.5 rounded-xl mt-1 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 text-white"
                      style={{
                        background: t.btnBg,
                        border: `1px solid ${t.btnBdr}`,
                        boxShadow: t.btnShadow,
                      }}
                    >
                      {loading ? (
                        <>
                          <svg
                            className="animate-spin size-4"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8z"
                            />
                          </svg>
                          Resetting…
                        </>
                      ) : (
                        <>
                          Reset Password <ArrowRightIcon className="size-4" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
