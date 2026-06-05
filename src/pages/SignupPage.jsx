import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  EyeIcon, EyeOffIcon, ArrowRightIcon, ArrowLeftIcon,
  CheckCircleIcon, PackageIcon, SunIcon, MoonIcon,
  ShieldCheckIcon, UserIcon, CameraIcon, XCircleIcon,
} from "lucide-react";
import { useTheme } from "../context/HomeThemeContext";

/* ─── Image constraints ──────────────────────────────────────── */
const MAX_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

function validateProfileImage(file) {
  return new Promise((resolve) => {
    if (!ALLOWED_TYPES.includes(file.type))
      return resolve({ ok: false, error: "Only JPG or PNG files are allowed." });
    if (file.size > MAX_MB * 1024 * 1024)
      return resolve({ ok: false, error: `File exceeds ${MAX_MB} MB limit.` });
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width < 200 || img.height < 200)
        return resolve({ ok: false, error: "Minimum 200×200 px required." });
      if (img.width > 3000 || img.height > 3000)
        return resolve({ ok: false, error: "Maximum 3000×3000 px allowed." });
      const r = img.width / img.height;
      if (r > 2 || r < 0.5)
        return resolve({ ok: false, error: "Use a square or near-square photo." });
      resolve({ ok: true });
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve({ ok: false, error: "Cannot read image." }); };
    img.src = url;
  });
}

/* ─── Password strength ──────────────────────────────────────── */
function getStrength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const S_LABEL = ["", "Weak", "Fair", "Strong", "Very Strong"];
const S_COLOR = ["", "#ef4444", "#f59e0b", "#22c55e", "#10b981"];
const S_WIDTH = ["0%", "25%", "55%", "80%", "100%"];

/* ─── Sub-components ─────────────────────────────────────────── */

function AvatarUpload({ avatar, onAvatarChange, onFileChange, avatarError, onAvatarError, isDark, t }) {
  const fileRef = useRef(null);
  const handleFile = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const res = await validateProfileImage(file);
  if (!res.ok) {
    onAvatarError(res.error);
    e.target.value = "";
    return;
  }

  onAvatarError("");

  const extension = file.name.split(".").pop();
  const baseName = file.name.replace(/\.[^/.]+$/, "");
  const date = new Date().toISOString().replace(/[-:T]/g, "").slice(0,14);

  const fileName = `${baseName}_${date}.${extension}`;

  const path = `uploads/${fileName}`;

  console.log("Generated Path:", path);

  onFileChange(file, path);

  const reader = new FileReader();
  reader.onload = (ev) => onAvatarChange(ev.target.result);
  reader.readAsDataURL(file);
};
  return (
    <div className="flex flex-col items-center gap-2.5 py-1">
      <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-[3px] flex items-center justify-center transition-all"
          style={{
            borderColor: avatarError ? "#ef4444" : avatar ? "#22c55e" : isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)",
            background: avatar ? "transparent" : isDark ? "linear-gradient(135deg,#3b82f6,#1d4ed8)" : "linear-gradient(135deg,#e85d1a,#f97316)",
          }}>
          {avatar
            ? <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
            : <UserIcon className="size-8 sm:size-10 text-white opacity-80" />}
        </div>
        <div className="absolute inset-0 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: "rgba(0,0,0,0.52)" }}>
          <CameraIcon className="size-4 text-white" />
          <span className="text-white text-[9px] font-bold mt-0.5">{avatar ? "Change" : "Upload"}</span>
        </div>
        {avatar && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onAvatarChange(null); onAvatarError(""); }}
            className="absolute -top-0.5 -right-0.5 rounded-full" style={{ background: isDark ? "#0d1425" : "#fff" }}>
            <XCircleIcon className="size-4 text-red-400" />
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleFile} />
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-xs font-semibold" style={{ color: t.txtMain }}>Profile Photo</span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
            style={{ background: avatar ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.12)", color: avatar ? "#22c55e" : "#ef4444" }}>
            {avatar ? "✓ Added" : "Required"}
          </span>
        </div>
        <p className="text-[10px] mt-0.5" style={{ color: t.txtMuted }}>
          JPG / PNG · Max {MAX_MB} MB · 200–3000 px · Square
        </p>
        {avatarError && <p className="text-[11px] text-red-400 mt-1 font-medium">{avatarError}</p>}
      </div>
    </div>
  );
}

function Field({ name, label, type = "text", placeholder, value, error, showPw, onTogglePw, onChange, isDark, t, password }) {
  const isSelect = type === "select";
  const inputType = name === "password" ? (showPw ? "text" : "password") : type;
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: t.lblClr }}>{label}</label>
      <div className="relative">
        {isSelect ? (
          <select value={value} onChange={onChange}
            className="w-full rounded-xl px-3.5 py-2.5 text-sm border transition-all appearance-none outline-none"
            style={{ background: t.inBg, color: value ? t.inClr : t.txtMuted, borderColor: error ? "#ef4444" : t.inBdr }}>
            <option value="" style={{ background: t.inBg, color: t.txtMuted }}>Select gender</option>
            <option value="Male" style={{ background: t.inBg, color: t.inClr }}>Male</option>
            <option value="Female" style={{ background: t.inBg, color: t.inClr }}>Female</option>
            <option value="Other" style={{ background: t.inBg, color: t.inClr }}>Other</option>
          </select>
        ) : (
          <>
            <input type={inputType} value={value} placeholder={placeholder}
              autoComplete={name === "password" ? "new-password" : name === "email" ? "email" : "off"}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm border transition-all outline-none"
              style={{ background: t.inBg, color: t.inClr, borderColor: error ? "#ef4444" : t.inBdr, paddingRight: name === "password" ? "2.5rem" : undefined }}
              onChange={onChange} />
            {name === "password" && (
              <button type="button" onClick={onTogglePw}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: isDark ? "rgba(255,255,255,0.38)" : "var(--text-muted)" }}
                onMouseEnter={e => e.currentTarget.style.color = isDark ? "#fff" : "var(--text-primary)"}
                onMouseLeave={e => e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.38)" : "var(--text-muted)"}>
                {showPw ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            )}
          </>
        )}
      </div>
      {name === "password" && password && (
        <div className="mt-1 flex flex-col gap-1">
          <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)" }}>
            <motion.div className="h-full rounded-full"
              animate={{ width: S_WIDTH[getStrength(password)], background: S_COLOR[getStrength(password)] }}
              transition={{ duration: 0.3 }} />
          </div>
          <p className="text-[10px] font-semibold" style={{ color: S_COLOR[getStrength(password)] }}>{S_LABEL[getStrength(password)]}</p>
        </div>
      )}
      {error && <p className="text-[11px] text-red-400 mt-0.5">{error}</p>}
    </div>
  );
}

function OtpStep({ email, onConfirm, onBack, t, isDark }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [focusIdx, setFocusIdx] = useState(-1);
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
    setErrorMsg(""); setLoading(true);
    try {
      await onConfirm(otp.join(""));
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
    <motion.div key="otp" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
      <div className="flex flex-col items-center gap-3 mb-5">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
          style={{ background: t.iconBg, border: `1px solid ${t.iconBdr}` }}>📧</div>
        <div className="text-center">
          <p className="text-lg font-bold" style={{ color: t.txtMain }}>Verify your email</p>
          <p className="text-sm mt-1" style={{ color: t.txtSub }}>
            Enter the 6-digit code sent to{" "}
            <span className="font-semibold" style={{ color: t.txtMain }}>{email}</span>
          </p>
        </div>
      </div>
      <div className="flex gap-2 sm:gap-3 justify-center mb-4" onPaste={handlePaste}>
        {otp.map((d, i) => {
          const isFocused = focusIdx === i, isFilled = !!d;
          return (
            <input key={i} ref={setRef(i)} type="text" inputMode="numeric" maxLength={1} value={d}
              onChange={e => handleChange(i, e.target.value)} onKeyDown={e => handleKey(i, e)}
              onFocus={() => setFocusIdx(i)} onBlur={() => setFocusIdx(-1)}
              className="text-center text-lg font-bold rounded-xl border-2 focus:outline-none transition-all duration-150"
              style={{
                width: "clamp(2.4rem,11vw,2.75rem)", height: "clamp(2.8rem,13vw,3.25rem)",
                background: isFilled ? (isDark ? "rgba(99,102,241,0.22)" : "rgba(232,93,26,0.12)") : isFocused ? (isDark ? "rgba(99,102,241,0.18)" : "rgba(232,93,26,0.08)") : t.otpBg,
                color: isFilled ? t.otpFilledText : t.txtMain,
                borderColor: isFocused ? t.otpAccent : isFilled ? t.otpFill : t.otpBase,
                boxShadow: isFocused ? `0 0 0 3px ${t.otpFocusGlow}` : isFilled ? `0 0 0 2px ${t.otpGlow}` : "none",
                transform: isFocused ? "scale(1.08)" : "scale(1)",
              }} />
          );
        })}
      </div>
      {errorMsg && (
        <div className="px-3 py-2 rounded-xl text-xs font-medium text-red-400 mb-3 text-center"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>⚠ {errorMsg}</div>
      )}
      <button onClick={submit} disabled={!full || loading}
        className="w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm"
        style={{ background: t.btnBg, border: `1px solid ${t.btnBdr}`, boxShadow: t.btnShadow }}>
        {loading
          ? <><svg className="animate-spin size-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Verifying…</>
          : <><CheckCircleIcon className="size-4" />Verify &amp; Create Account</>}
      </button>
      <div className="flex items-center justify-between mt-3">
        <button onClick={onBack} className="text-xs hover:underline underline-offset-2" style={{ color: t.txtMuted }}>← Back</button>
        <p className="text-xs" style={{ color: t.txtMuted }}>
          Didn't receive?{" "}
          <button onClick={resend} disabled={resending} className="underline underline-offset-2 disabled:opacity-50" style={{ color: t.accentCl }}>
            {resending ? "Sending…" : "Resend"}
          </button>
        </p>
      </div>
    </motion.div>
  );
}

// SuccessStep removed — signup now auto-redirects directly to dashboard after OTP

/* ─── Main ───────────────────────────────────────────────────── */
export default function SignupPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  const [role, setRole]         = useState("admin");
  const [step, setStep]         = useState(1);
  const [showPw, setShowPw]     = useState(false);
  const [errors, setErrors]     = useState({});
  const [sending, setSending]   = useState(false);

  // form fields
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [gender,    setGender]    = useState("");
  const [email,     setEmail]     = useState("");
  const [phone,     setPhone]     = useState("");
  const [password,  setPassword]  = useState("");
  const [avatar,    setAvatar]    = useState(null);
  const [avatarError, setAvatarError] = useState("");
  const [avatarPath, setAvatarPath] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const pwScore = getStrength(password);

  // Reset form when switching roles
  const switchRole = (r) => {
    setRole(r); setStep(1); setErrors({});
    setFirstName(""); setLastName(""); setGender(""); setEmail(""); setPhone(""); setPassword(""); setAvatar(null); setAvatarError(""); setShowPw(false);
  };

  /* Theme tokens  */
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
    stepAct:   isDark ? { background: "rgba(255,255,255,0.9)", color: "#060a14" } : { background: "var(--accent)", color: "#fff" },
    stepIna:   isDark ? { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.35)" }
                      : { background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)" },
    stepLine:  isDark ? (step > 1 ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.12)") : (step > 1 ? "var(--accent)" : "var(--border)"),
    togBg:     isDark ? "rgba(255,255,255,0.08)"  : "var(--bg-card)",
    togBdr:    isDark ? "rgba(255,255,255,0.14)"  : "var(--border)",
    togClr:    isDark ? "rgba(255,255,255,0.70)"  : "var(--text-secondary)",
    backClr:   isDark ? "rgba(255,255,255,0.50)"  : "var(--text-muted)",
    accentCl:  isDark ? "rgba(255,255,255,0.75)"  : "var(--accent)",
    logoSub:   isDark ? "rgba(255,255,255,0.40)"  : "var(--text-muted)",
    tabWrap:   isDark ? "rgba(255,255,255,0.06)"  : "rgba(0,0,0,0.05)",
    tabActBg:  isDark ? "rgba(255,255,255,0.12)"  : "rgba(255,255,255,0.95)",
    tabActClr: isDark ? "#fff"                    : "var(--text-primary)",
    tabInaClr: isDark ? "rgba(255,255,255,0.38)"  : "var(--text-muted)",
    iconBg:    isDark ? "rgba(255,255,255,0.08)"  : "rgba(0,0,0,0.04)",
    iconBdr:   isDark ? "rgba(255,255,255,0.14)"  : "rgba(0,0,0,0.09)",
    otpBg:     isDark ? "rgba(255,255,255,0.06)"  : "rgba(255,255,255,0.85)",
    otpBase:   isDark ? "rgba(255,255,255,0.15)"  : "rgba(0,0,0,0.13)",
    otpAccent: isDark ? "#818cf8"                 : "#e85d1a",
    otpFill:   isDark ? "#818cf8"                 : "#e85d1a",
    otpGlow:   isDark ? "rgba(129,140,248,0.30)"  : "rgba(232,93,26,0.25)",
    otpFocusGlow: isDark ? "rgba(129,140,248,0.45)" : "rgba(232,93,26,0.35)",
    otpFilledText: isDark ? "#e0e7ff"             : "#c2410c",
  };

  /* ── Validation ───────────────────────────────────────────── */
  const validate = () => {
    const e = {};
    if (!avatar) { setAvatarError("A profile photo is required."); e.avatar = "required"; }
    if (!firstName.trim()) e.firstName = "Required";
    if (!lastName.trim())  e.lastName  = "Required";
    if (!gender)           e.gender    = "Required";
    if (!email.includes("@")) e.email  = "Valid email required";
    if (!/^\+?\d{8,15}$/.test(phone.replace(/\s/g, ""))) e.phone = "Valid phone required";
    if (password.length < 8) e.password = "Minimum 8 characters";
    else if (pwScore < 4)    e.password = "Must meet all strength criteria";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── API calls ────────────────────────────────────────────── */
  const sendOtp = async () => {
    if (!validate()) return;
    setSending(true);
    try {
      await axios.delete(`http://localhost:8080/mail/delete-otp?email=${email}`).catch(() => {});
      await axios.post(`http://localhost:8080/mail/send-otp?email=${email}`);
      setStep(2);
    } catch {
      setErrors(p => ({ ...p, email: "Failed to send OTP. Please try again." }));
    } finally {
      setSending(false);
    }
  };

 const createUser = async () => {
  const formData = new FormData();

  formData.append("firstName", firstName);
  formData.append("lastName", lastName);
  formData.append("gender", gender);
  formData.append("email", email);
  formData.append("password", password);
  formData.append("mobile", phone);
  formData.append("role", role.toUpperCase());
  formData.append("emailVerified", true);
  formData.append("image", avatarFile); // actual file

  await axios.post(
    "http://localhost:8080/api/auth/register",
    formData
  );
};

  const verifyOtp = async (otpCode) => {
    const res = await axios.post(
      `http://localhost:8080/mail/verify-otp?email=${email}&otp=${otpCode}`
    );
    if (res.data === "OTP Verified" || res.status === 200) {
      await createUser();
      await axios.delete(`http://localhost:8080/mail/delete-otp?email=${email}`).catch(() => {});

      // Auto-login: get JWT so dashboard is accessible immediately
      try {
        const loginRes = await axios.post("http://localhost:8080/api/auth/login", { email, password });
        const token = loginRes.data.token;
        localStorage.setItem("token", token);
        if (onLoginSuccess) onLoginSuccess(token);
      } catch { /* dashboard will still show, user can login manually if this fails */ }

      // Navigate directly to dashboard — no SuccessStep
      navigate(role === "admin" ? "/admin" : "/staff");
    } else {
      throw new Error("Invalid OTP");
    }
  };

  /* ── Field definitions ────────────────────────────────────── */
  const DEMO = {
    admin: { firstName: "Ashwin", lastName: "Kumar", phone: "+91 9832445420", email: "Admin@company.com" },
    staff: { firstName: "Segar",  lastName: "Kumar", phone: "+91 9832445320", email: "Staff@company.com" },
  };
  const demo = DEMO[role];

  const fields = [
    { name: "firstName", label: "First Name",    placeholder: demo.firstName, value: firstName, onChange: e => { setFirstName(e.target.value); setErrors(p => ({ ...p, firstName: "" })); } },
    { name: "lastName",  label: "Last Name",     placeholder: demo.lastName,  value: lastName,  onChange: e => { setLastName(e.target.value);  setErrors(p => ({ ...p, lastName: "" })); } },
    { name: "gender",    label: "Gender",        type: "select",              value: gender,    onChange: e => { setGender(e.target.value);    setErrors(p => ({ ...p, gender: "" })); } },
    { name: "email",     label: "Work Email",    type: "email", placeholder: demo.email, value: email, onChange: e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: "" })); } },
    { name: "phone",     label: "Phone Number",  type: "tel",  placeholder: demo.phone, value: phone, onChange: e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: "" })); } },
    { name: "password",  label: "Password",      type: "password", placeholder: "Min. 8 chars · A-Z · 0-9 · symbol", value: password, onChange: e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: "" })); } },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col overflow-x-hidden" style={{ background: t.pageBg }}>

      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {isDark ? (<>
          <div className="absolute -top-32 -right-32 w-[380px] h-[380px] sm:w-[660px] sm:h-[660px] rounded-full"
            style={{ background: "radial-gradient(circle,rgba(59,130,246,0.18) 0%,transparent 70%)" }} />
          <div className="absolute -bottom-40 -left-20 w-[380px] h-[380px] sm:w-[700px] sm:h-[700px] rounded-full"
            style={{ background: "radial-gradient(circle,rgba(99,102,241,0.14) 0%,transparent 65%)" }} />
        </>) : (<>
          <div className="absolute -top-24 -right-24 w-[580px] h-[580px] rounded-full"
            style={{ background: "radial-gradient(circle,var(--orb1) 0%,transparent 68%)" }} />
          <div className="absolute -bottom-32 -left-16 w-[650px] h-[650px] rounded-full"
            style={{ background: "radial-gradient(circle,var(--orb2) 0%,transparent 65%)" }} />
        </>)}
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-8 pt-5 pb-2">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm font-medium transition-colors"
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

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-4 sm:py-8">
        <motion.div className="w-full max-w-[460px]"
          initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 60 }}>

          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-5 justify-center">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: isDark ? "linear-gradient(135deg,#3b82f6,#1d4ed8)" : "linear-gradient(135deg,#e85d1a,#f97316)",
                boxShadow: isDark ? "0 4px 14px rgba(37,99,235,0.4)" : "0 4px 14px rgba(232,93,26,0.4)",
              }}>
              <PackageIcon className="size-5 text-white" strokeWidth={1.8} />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-extrabold tracking-wide" style={{ color: t.txtMain }}>IIM</p>
              <p className="text-[10px] font-medium" style={{ color: t.logoSub }}>Internal Inventory Management</p>
            </div>
          </div>

          {/* Role tabs — only on step 1 */}
          {step === 1 && (
            <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: t.tabWrap }}>
              {[
                { key: "admin", label: "Admin Account", Icon: ShieldCheckIcon },
                { key: "staff", label: "Staff Account",  Icon: UserIcon },
              ].map(({ key, label, Icon }) => (
                <button key={key} onClick={() => switchRole(key)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all"
                  style={role === key
                    ? { background: t.tabActBg, color: t.tabActClr, boxShadow: "0 1px 6px rgba(0,0,0,0.18)" }
                    : { background: "transparent", color: t.tabInaClr }}>
                  <Icon className="size-4" strokeWidth={1.8} /> {label}
                </button>
              ))}
            </div>
          )}

          {/* Step dots */}
          {step < 3 && (
            <div className="flex items-center justify-center gap-3 mb-4">
              {[1, 2].map(s => (
                <div key={s} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={step >= s ? t.stepAct : t.stepIna}>
                    {step > s ? <CheckCircleIcon className="size-4" /> : s}
                  </div>
                  {s === 1 && <div className="w-12 h-px transition-all duration-500" style={{ background: t.stepLine }} />}
                </div>
              ))}
            </div>
          )}

          {/* Card */}
          <div className="rounded-2xl p-5 sm:p-7"
            style={{ background: t.cardBg, border: `1px solid ${t.cardBdr}`, backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", boxShadow: t.cardSdw }}>
            <AnimatePresence mode="wait">

              {/* ── Step 1: Form ── */}
              {step === 1 && (
                <motion.div key="form" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
                  <h1 className="text-lg sm:text-xl font-bold mb-0.5" style={{ color: t.txtMain }}>Create your account</h1>
                  <p className="text-xs mb-4" style={{ color: t.txtSub }}>
                    Registering as{" "}
                    <span className="font-semibold" style={{ color: t.accentCl }}>{role === "admin" ? "Admin" : "Staff"}</span>
                  </p>

                  {/* Avatar */}
                  <div className="rounded-xl p-3 mb-4"
                    style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.025)", border: `1px solid ${avatarError ? "#ef4444" : t.cardBdr}` }}>
                    <AvatarUpload
  avatar={avatar}
  onAvatarChange={(url) => { setAvatar(url); setAvatarError(""); }}
  onFileChange={(file, path) => {
    setAvatarFile(file);
    setAvatarPath(path);
   

    
  }}
  avatarError={avatarError}
  onAvatarError={setAvatarError}
  isDark={isDark}
  t={t}
/>
                  </div>

                  {/* Fields */}
                  <div className="flex flex-col gap-3">
                    {/* Name row */}
                    <div className="grid grid-cols-2 gap-3">
                      {fields.slice(0, 2).map(fd => (
                        <Field key={fd.name} {...fd} showPw={showPw} onTogglePw={() => setShowPw(v => !v)}
                          error={errors[fd.name]} isDark={isDark} t={t} password={password} />
                      ))}
                    </div>
                    {/* Remaining fields */}
                    {fields.slice(2).map(fd => (
                      <Field key={fd.name} {...fd} showPw={showPw} onTogglePw={() => setShowPw(v => !v)}
                        error={errors[fd.name]} isDark={isDark} t={t} password={password} />
                    ))}

                    {/* Submit */}
                    <button onClick={sendOtp} disabled={sending}
                      className="w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl mt-1 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm"
                      style={{ background: t.btnBg, border: `1px solid ${t.btnBdr}`, boxShadow: t.btnShadow }}>
                      {sending
                        ? <><svg className="animate-spin size-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Sending OTP…</>
                        : <>Send OTP <ArrowRightIcon className="size-4" /></>}
                    </button>
                  </div>

                  <p className="text-xs text-center mt-4" style={{ color: t.txtMuted }}>
                    Already have an account?{" "}
                    <button onClick={() => navigate(role === "admin" ? "/admin/login" : "/staff/login")}
                      className="font-medium hover:underline underline-offset-2" style={{ color: t.accentCl }}>
                      Log in
                    </button>
                  </p>
                </motion.div>
              )}

              {/* ── Step 2: OTP ── */}
              {step === 2 && (
                <OtpStep email={email} onConfirm={verifyOtp} onBack={() => setStep(1)} t={t} isDark={isDark} />
              )}

            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
