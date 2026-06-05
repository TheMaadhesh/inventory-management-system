import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    EyeIcon, EyeOffIcon, ArrowRightIcon, ArrowLeftIcon,
    CheckCircleIcon, SunIcon, MoonIcon, UserIcon,
} from "lucide-react";
import axios from "axios";
import { useTheme } from "../context/HomeThemeContext";

/* ─── Field ──────────────────────────────────────────────────── */
function Field({ name, label, type, placeholder, value, error, showPw, onTogglePw, onChange, isDark, t }) {
    const inputType = name === "password" ? (showPw ? "text" : "password") : (type || "text");
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: t.lblClr }}>
                {label}
            </label>
            <div className="relative">
                <input
                    type={inputType} value={value} placeholder={placeholder}
                    autoComplete={name === "password" ? "current-password" : "email"}
                    className="auth-input w-full rounded-xl px-4 py-3 text-sm border transition-all"
                    style={{ background: t.inBg, color: t.inClr, borderColor: error ? "#ef4444" : t.inBdr }}
                    onChange={onChange}
                />
                {name === "password" && (
                    <button type="button" onClick={onTogglePw}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
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

/* ─── OTP Step ───────────────────────────────────────────────── */
function OtpStep({ email, onLogin, onBack, t }) {
    const [otp, setOtp]           = useState(["", "", "", "", "", ""]);
    const [loading, setLoading]   = useState(false);
    const [resending, setResending] = useState(false);
    const [focusIdx, setFocusIdx] = useState(-1);
    const [errorMsg, setErrorMsg] = useState("");
    const refs = Array.from({ length: 6 }, () => null);
    const setRef = (i) => (el) => { refs[i] = el; };

    const handleChange = (i, v) => {
        if (!/^\d?$/.test(v)) return;
        setOtp(prev => { const n = [...prev]; n[i] = v; return n; });
        if (v && i < 5) refs[i + 1]?.focus();
    };
    const handleKey = (i, e) => { if (e.key === "Backspace" && !otp[i] && i > 0) refs[i - 1]?.focus(); };
    const handlePaste = (e) => {
        const txt = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (txt.length === 6) { setOtp(txt.split("")); refs[5]?.focus(); }
    };
    const full = otp.join("").length === 6;

    const submit = async () => {
        const otpCode = otp.join("");
        setErrorMsg("");
        try {
            setLoading(true);
            const res = await axios.post(
                `http://localhost:8080/mail/verify-otp?email=${email}&otp=${otpCode}`
            );
            if (res.data === "OTP Verified" || res.status === 200) {
                await axios.delete(`http://localhost:8080/mail/delete-otp?email=${email}`).catch(() => {});
                onLogin();
            } else {
                setErrorMsg("Incorrect OTP. Please try again.");
            }
        } catch (err) {
            setErrorMsg("Incorrect OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const resend = async () => {
        setResending(true);
        setErrorMsg("");
        setOtp(["", "", "", "", "", ""]);
        try {
            await axios.delete(`http://localhost:8080/mail/delete-otp?email=${email}`).catch(() => {});
            await axios.post(`http://localhost:8080/mail/send-otp?email=${email}`);
        } catch {
            setErrorMsg("Failed to resend OTP. Please go back and try again.");
        } finally {
            setResending(false);
        }
    };

    return (
        <motion.div key="otp"
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}>
            <div className="flex flex-col items-center gap-4 mb-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-3xl"
                    style={{ background: t.iconBg, border: `1px solid ${t.iconBdr}` }}>🔐</div>
                <div className="text-center">
                    <p className="text-xl font-bold" style={{ color: t.txtMain }}>Enter Verification Code</p>
                    <p className="text-sm mt-1.5" style={{ color: t.txtSub }}>
                        A 6-digit OTP was sent to{" "}
                        <span className="font-semibold" style={{ color: t.txtMain }}>{email}</span>
                    </p>
                </div>
            </div>
            <div className="flex gap-2 sm:gap-3 justify-center mb-5" onPaste={handlePaste}>
                {otp.map((d, i) => {
                    const isFocused = focusIdx === i, isFilled = !!d;
                    const borderColor = isFocused ? t.otpAccent : isFilled ? t.otpFill : t.otpBase;
                    const boxShadow = isFocused ? `0 0 0 3px ${t.otpFocusGlow}` : isFilled ? `0 0 0 2px ${t.otpGlow}` : "none";
                    const bg = isFilled ? t.otpFilledBg : isFocused ? t.otpFocusBg : t.otpBg;
                    return (
                        <input key={i} ref={setRef(i)} type="text" inputMode="numeric" maxLength={1} value={d}
                            onChange={e => handleChange(i, e.target.value)} onKeyDown={e => handleKey(i, e)}
                            onFocus={() => setFocusIdx(i)} onBlur={() => setFocusIdx(-1)}
                            className="text-center text-xl font-bold rounded-xl border-2 focus:outline-none transition-all duration-150"
                            style={{
                                width: "clamp(2.5rem,12vw,2.75rem)", height: "clamp(3rem,14vw,3.25rem)",
                                background: bg, color: isFilled ? t.otpFilledText : t.txtMain,
                                borderColor, boxShadow, transform: isFocused ? "scale(1.1)" : "scale(1)",
                            }} />
                    );
                })}
            </div>
            {errorMsg && (
                <p className="text-center text-[12px] text-red-400 font-medium mb-3">{errorMsg}</p>
            )}
            <button onClick={submit} disabled={!full || loading}
                className="w-full flex items-center justify-center gap-2 font-semibold py-3.5 rounded-xl transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white"
                style={{ background: t.btnBg, border: `1px solid ${t.btnBdr}`, boxShadow: t.btnShadow }}>
                {loading
                    ? <><svg className="animate-spin size-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>Verifying…</>
                    : <><CheckCircleIcon className="size-4" />Verify &amp; Login</>}
            </button>
            <div className="flex items-center justify-between mt-4">
                <button onClick={onBack} className="text-xs hover:underline underline-offset-2" style={{ color: t.txtMuted }}>← Back</button>
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
function SuccessStep({ t, onContinue }) {
    useState(() => {
        const timer = setTimeout(onContinue, 1800);
        return () => clearTimeout(timer);
    });

    return (
        <motion.div key="success"
            initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 65 }}>
            <div className="flex flex-col items-center gap-5 text-center py-3">
                <motion.div
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(34,197,94,0.12)", border: "2px solid rgba(34,197,94,0.3)" }}
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 280, damping: 60 }}>
                    <CheckCircleIcon className="size-9 sm:size-11 text-green-400" strokeWidth={1.6} />
                </motion.div>
                <div>
                    <p className="text-xl sm:text-2xl font-bold" style={{ color: t.txtMain }}>Login Successful!</p>
                    <p className="text-sm mt-2 max-w-xs mx-auto" style={{ color: t.txtSub }}>
                        Welcome back. Redirecting to your Staff dashboard…
                    </p>
                </div>
                <div className="w-full p-4 rounded-xl text-sm font-medium text-green-400"
                    style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                    ✓ You are now logged in as Staff.
                </div>
                <button onClick={onContinue}
                    className="w-full flex items-center justify-center gap-2 font-semibold py-3.5 rounded-xl transition-all hover:brightness-110 active:scale-[0.98] text-white"
                    style={{ background: t.btnBg, border: `1px solid ${t.btnBdr}`, boxShadow: t.btnShadow }}>
                    Go to Staff Dashboard <ArrowRightIcon className="size-4" />
                </button>
            </div>
        </motion.div>
    );
}

/* ─── Main ───────────────────────────────────────────────────── */
export default function StaffLoginPage({ onLoginSuccess }) {
    const navigate   = useNavigate();
    const { theme, toggle } = useTheme();
    const isDark     = theme === "dark";

    const [step, setStep]         = useState(1);
    const [showPw, setShowPw]     = useState(false);
    const [errors, setErrors]     = useState({});
    const [email, setEmail]       = useState("");
    const [password, setPassword] = useState("");
    const [sending, setSending]   = useState(false);
    const [loginError, setLoginError] = useState("");

    const t = {
        pageBg: isDark ? "linear-gradient(135deg,#060a14 0%,#0d1425 50%,#080c18 100%)" : "var(--bg-base)",
        cardBg: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.75)",
        cardBdr: isDark ? "rgba(255,255,255,0.10)" : "var(--border)",
        cardSdw: isDark ? "0 24px 64px rgba(0,0,0,0.5),0 1px 0 rgba(255,255,255,0.06) inset" : "var(--shadow-card)",
        txtMain: isDark ? "#fff" : "var(--text-primary)",
        txtSub: isDark ? "rgba(255,255,255,0.45)" : "var(--text-secondary)",
        txtMuted: isDark ? "rgba(255,255,255,0.32)" : "var(--text-muted)",
        lblClr: isDark ? "rgba(255,255,255,0.50)" : "var(--text-muted)",
        inBg: isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.9)",
        inClr: isDark ? "#fff" : "var(--text-primary)",
        inBdr: isDark ? "rgba(255,255,255,0.13)" : "var(--border)",
        btnBg: isDark ? "#3b82f6" : "var(--accent)",
        btnBdr: isDark ? "#2563eb" : "transparent",
        btnShadow: isDark ? "0 4px 18px rgba(37,99,235,0.40)" : "0 4px 14px rgba(232,93,26,0.30)",
        stepAct: isDark ? { background: "rgba(255,255,255,0.9)", color: "#060a14" } : { background: "var(--accent)", color: "#fff" },
        stepIna: isDark ? { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.35)" }
                        : { background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)" },
        stepLine: isDark ? (step > 1 ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.12)")
                         : (step > 1 ? "var(--accent)" : "var(--border)"),
        togBg: isDark ? "rgba(255,255,255,0.08)" : "var(--bg-card)",
        togBdr: isDark ? "rgba(255,255,255,0.14)" : "var(--border)",
        togClr: isDark ? "rgba(255,255,255,0.70)" : "var(--text-secondary)",
        backClr: isDark ? "rgba(255,255,255,0.50)" : "var(--text-muted)",
        accentCl: isDark ? "rgba(255,255,255,0.75)" : "var(--accent)",
        logoSub: isDark ? "rgba(255,255,255,0.40)" : "var(--text-muted)",
        fgotClr: isDark ? "rgba(255,255,255,0.42)" : "var(--text-muted)",
        iconBg: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
        iconBdr: isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.09)",
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

    const validate = () => {
        const e = {};
        if (!email.includes("@")) e.email    = "Valid email required";
        if (password.length < 6)  e.password = "Password required";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSendOtp = async () => {
        if (!validate()) return;
        setSending(true);
        setLoginError("");
        try {
            const loginRes = await axios.post("http://localhost:8080/api/auth/login", { email, password });
            const token = loginRes.data.token;

            const payload = JSON.parse(atob(token.split(".")[1]));
            if (payload.role !== "STAFF") {
                setLoginError("This account does not have Staff access. Please use Admin Login.");
                return;
            }

            localStorage.setItem("token_pending", token);
            await axios.delete(`http://localhost:8080/mail/delete-otp?email=${email}`).catch(() => {});
            await axios.post(`http://localhost:8080/mail/send-otp?email=${email}`);
            setStep(2);
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                setLoginError("Invalid email or password. Please check your credentials.");
            } else {
                setLoginError("Unable to reach the server. Please try again.");
            }
        } finally {
            setSending(false);
        }
    };

    const handleLoginSuccess = () => {
        const token = localStorage.getItem("token_pending");
        if (token) {
            localStorage.setItem("token", token);
            localStorage.removeItem("token_pending");
        }
        if (onLoginSuccess) onLoginSuccess(token);
        setStep(3);
    };

    return (
        <div className="min-h-screen w-full flex flex-col overflow-x-hidden" style={{ background: t.pageBg }}>
            <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
                {isDark ? (<>
                    <div className="absolute -top-28 -left-28 w-[380px] h-[380px] sm:w-[640px] sm:h-[640px] rounded-full"
                        style={{ background: "radial-gradient(circle,rgba(59,130,246,0.18) 0%,transparent 70%)" }} />
                    <div className="absolute -bottom-36 -right-16 w-[680px] h-[680px] rounded-full"
                        style={{ background: "radial-gradient(circle,rgba(99,102,241,0.14) 0%,transparent 65%)" }} />
                </>) : (<>
                    <div className="absolute -top-32 -left-20 w-[600px] h-[600px] rounded-full"
                        style={{ background: "radial-gradient(circle,var(--orb1) 0%,transparent 70%)" }} />
                    <div className="absolute -bottom-40 -right-20 w-[700px] h-[700px] rounded-full"
                        style={{ background: "radial-gradient(circle,var(--orb2) 0%,transparent 65%)" }} />
                </>)}
            </div>

            <div className="relative z-10 flex items-center justify-between px-4 sm:px-8 pt-5 sm:pt-6 pb-2">
                <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm font-medium"
                    style={{ color: t.backClr }}
                    onMouseEnter={e => e.currentTarget.style.color = isDark ? "#fff" : "var(--text-primary)"}
                    onMouseLeave={e => e.currentTarget.style.color = t.backClr}>
                    <ArrowLeftIcon className="size-4" /> Back to home
                </button>
                <button onClick={toggle} className="p-2 rounded-lg"
                    style={{ background: t.togBg, border: `1px solid ${t.togBdr}`, color: t.togClr }}>
                    {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
                </button>
            </div>

            <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
                <motion.div className="w-full max-w-[420px] sm:max-w-md"
                    initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 240, damping: 60 }}>

                    <div className="flex items-center gap-2.5 mb-8 justify-center">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
                            style={{
                                background: isDark ? "linear-gradient(135deg,#3b82f6,#1d4ed8)" : "linear-gradient(135deg,#e85d1a,#f97316)",
                                boxShadow: isDark ? "0 4px 14px rgba(37,99,235,0.4)" : "0 4px 14px rgba(232,93,26,0.4)",
                            }}>
                            <UserIcon className="size-5 text-white" strokeWidth={1.8} />
                        </div>
                        <div className="leading-tight">
                            <p className="text-sm font-extrabold tracking-wide" style={{ color: t.txtMain }}>IIM — Staff</p>
                            <p className="text-[10px] font-medium" style={{ color: t.logoSub }}>Internal Inventory Management</p>
                        </div>
                    </div>

                    {step < 3 && (
                        <div className="flex items-center justify-center gap-3 mb-7">
                            {[1, 2].map(s => (
                                <div key={s} className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                                        style={step >= s ? t.stepAct : t.stepIna}>
                                        {step > s ? <CheckCircleIcon className="size-4" /> : s}
                                    </div>
                                    {s === 1 && <div className="w-14 h-px" style={{ background: t.stepLine }} />}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="rounded-2xl p-6 sm:p-9"
                        style={{ background: t.cardBg, border: `1px solid ${t.cardBdr}`, backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", boxShadow: t.cardSdw }}>
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div key="login"
                                    initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                                    transition={{ duration: 0.2 }}>
                                    <h1 className="text-xl sm:text-2xl font-bold mb-1" style={{ color: t.txtMain }}>Staff Login</h1>
                                    <p className="text-sm mb-6" style={{ color: t.txtSub }}>
                                        Enter your credentials to receive a one-time password.
                                    </p>
                                    <div className="flex flex-col gap-3.5">
                                        <Field name="email" label="Email Address" type="email"
                                            placeholder="staff@company.com" value={email} error={errors.email}
                                            showPw={showPw} onTogglePw={() => setShowPw(v => !v)}
                                            onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: "" })); setLoginError(""); }}
                                            isDark={isDark} t={t} />
                                        <Field name="password" label="Password" type="password"
                                            placeholder="Your password" value={password} error={errors.password}
                                            showPw={showPw} onTogglePw={() => setShowPw(v => !v)}
                                            onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: "" })); setLoginError(""); }}
                                            isDark={isDark} t={t} />
                                        <div className="flex justify-end -mt-1">
                                            <button onClick={() => navigate("/staff/forgot-password")}
                                                className="text-xs hover:underline underline-offset-2"
                                                style={{ color: t.fgotClr }}
                                                onMouseEnter={e => e.currentTarget.style.color = t.accentCl}
                                                onMouseLeave={e => e.currentTarget.style.color = t.fgotClr}>
                                                Forgot password?
                                            </button>
                                        </div>
                                        {loginError && (
                                            <div className="px-3.5 py-2.5 rounded-xl text-xs font-medium text-red-400"
                                                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                                                ⚠ {loginError}
                                            </div>
                                        )}
                                        <button onClick={handleSendOtp} disabled={sending}
                                            className="w-full flex items-center justify-center gap-2 font-semibold py-3.5 rounded-xl mt-0.5 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white"
                                            style={{ background: t.btnBg, border: `1px solid ${t.btnBdr}`, boxShadow: t.btnShadow }}>
                                            {sending
                                                ? <><svg className="animate-spin size-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                  </svg>Sending OTP…</>
                                                : <>Send OTP <ArrowRightIcon className="size-4" /></>}
                                        </button>
                                    </div>
                                    <p className="text-xs text-center mt-5" style={{ color: t.txtMuted }}>
                                        Don't have an account?{" "}
                                        <button onClick={() => navigate("/signup")} className="font-medium hover:underline underline-offset-2" style={{ color: t.accentCl }}>Sign up</button>
                                    </p>
                                    <p className="text-xs text-center mt-2" style={{ color: t.txtMuted }}>
                                        Admin?{" "}
                                        <button onClick={() => navigate("/admin/login")} className="font-medium hover:underline underline-offset-2" style={{ color: t.accentCl }}>Admin Login →</button>
                                    </p>
                                </motion.div>
                            )}
                            {step === 2 && <OtpStep email={email} onLogin={handleLoginSuccess} onBack={() => setStep(1)} t={t} />}
                            {step === 3 && <SuccessStep t={t} onContinue={() => navigate("/staff")} />}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
