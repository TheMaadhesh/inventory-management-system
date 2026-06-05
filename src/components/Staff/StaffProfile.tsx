import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme, Breadcrumb } from "./StaffNavbar";
import { notifyUserInfoUpdated } from "../../hooks/useUserInfo";
import axios from "axios";
const EMPTY = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "",
  department: "",
  location: "",
  bio: "",
};
type ProfileData = typeof EMPTY;

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

function validateProfileImage(
  file: File,
): Promise<{ ok: boolean; error?: string; width?: number; height?: number }> {
  return new Promise((resolve) => {
    if (!ALLOWED_TYPES.includes(file.type))
      return resolve({
        ok: false,
        error: "Unsupported format. Please upload a JPG or PNG file.",
      });
    if (file.size > MAX_FILE_SIZE_BYTES)
      return resolve({ ok: false, error: "File exceeds the 5 MB limit." });
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width < 200 || img.height < 200)
        return resolve({ ok: false, error: "Minimum size is 200×200 px." });
      if (img.width > 3000 || img.height > 3000)
        return resolve({ ok: false, error: "Maximum size is 3000×3000 px." });
      const ratio = img.width / img.height;
      if (ratio > 2.0 || ratio < 0.5)
        return resolve({
          ok: false,
          error: "Please use a square or near-square photo.",
        });
      resolve({ ok: true, width: img.width, height: img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ ok: false, error: "Unable to read the image file." });
    };
    img.src = url;
  });
}

// function loadProfileFromStorage(): ProfileData | null {
//   try {
//     const token = localStorage.getItem("token");
//     if (!token) return null;
//     const p = JSON.parse(atob(token.split(".")[1]));
//     const email     = p.sub       || p.email      || "";
//     const firstName = p.firstname || p.firstName  || p.given_name  || p.first_name
//                    || localStorage.getItem(`profile_firstName_${email}`) || "";
//     const lastName  = p.lastname  || p.lastName   || p.family_name || p.last_name
//                    || localStorage.getItem(`profile_lastName_${email}`)  || "";
//     const phone     = p.mobile    || p.phone      || p.phoneNumber || p.phone_number
//                    || localStorage.getItem(`profile_phone_${email}`)     || "";
//     const role      = p.role      || localStorage.getItem(`profile_role_${email}`) || "";
//     return { firstName, lastName, email, phone, role,
//       department: p.department || "", location: p.location || "", bio: p.bio || "" };
//   } catch { return null; }
// }

/* ── ProfileField defined OUTSIDE StaffProfile so React never remounts it ── */
interface FieldProps {
  label: string;
  field: keyof ProfileData;
  type?: string;
  ph?: string;
  wide?: boolean;
  editMode: boolean;
  draftValue: string;
  profileValue: string;
  primary: string;
  tokens: Record<string, string>;
  onChange: (field: keyof ProfileData, value: string) => void;
}
const ProfileField = ({
  label,
  field,
  type = "text",
  ph,
  wide = false,
  editMode,
  draftValue,
  profileValue,
  primary,
  tokens,
  onChange,
}: FieldProps) => (
  <div className={wide ? "sm:col-span-2" : ""}>
    <label
      className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
      style={{ color: tokens.muted }}
    >
      {label}
    </label>
    {editMode ? (
      <input
        type={type}
        value={draftValue}
        placeholder={ph || `Enter ${label.toLowerCase()}`}
        onChange={(e) => onChange(field, e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
        style={{
          background: tokens.cardHover,
          color: tokens.text,
          border: `1.5px solid ${primary}`,
          boxShadow: `0 0 0 3px ${primary}15`,
        }}
      />
    ) : (
      <div
        className="px-3.5 py-2.5 rounded-xl text-sm"
        style={{
          background: tokens.cardHover,
          border: `1px solid ${tokens.border}`,
          color: profileValue ? tokens.text : tokens.muted,
        }}
      >
        {profileValue || <em>Not set</em>}
      </div>
    )}
  </div>
);

const StaffProfile = () => {
  const { tokens, primary } = useTheme();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData>(EMPTY);
  const [draft, setDraft] = useState<ProfileData>(EMPTY);
  const [editMode, setEditMode] = useState(false);
  const [saved, setSaved] = useState(false);
  const [ordersCount, setTotalOrdersCount] = useState(0);
  const [tab, setTab] = useState<"profile" | "security" | "activity">("profile");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState("");
  const [avatarInfo, setAvatarInfo] = useState<{
    width: number;
    height: number;
    size: string;
  } | null>(null);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwOk, setPwOk] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const initials =
    [profile.firstName[0], profile.lastName[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "?";
  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        // decode token
        const payload = JSON.parse(atob(token.split(".")[1]));
        const userId = payload.userId || payload.id || payload.sub;

        const response = await axios.get(
          `http://localhost:8080/api/staff/find?id=${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const count = await axios.get(
          `http://localhost:8080/api/staff/stock/Count/User?id=${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        setTotalOrdersCount(count.data);

        const data = response.data;

        const profileData = {
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          phone: data.mobile || "",
          role: data.role || "",
          department: data.department || "",
          location: data.location || "",
          bio: data.bio || "",
          path: data.path || "",
        };

        setProfile(profileData);
        setDraft(profileData);
        setAvatar("http://localhost:8080/images/" + profileData.path);
      } catch (error) {
        console.error("Profile fetch failed", error);
      }
    };

    fetchProfile();
  }, []);

  const handleFieldChange = useCallback(
    (field: keyof ProfileData, value: string) => {
      setDraft((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const save = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userId = payload.userId || payload.id || payload.sub;
    setProfile({ ...draft });
    setEditMode(false);
    setSaved(true);
    const body = {
      id: userId,
      firstName: draft.firstName,
      lastName: draft.lastName,
      mobile: profile.email,
      emailVerified: true,
    };
    try {
      await axios.put(
        `http://localhost:8080/api/staff/user/profile/update`,
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setSaved(false), 3000);
    // if (draft.email) {
    //   localStorage.setItem(`profile_firstName_${draft.email}`, draft.firstName);
    //   localStorage.setItem(`profile_lastName_${draft.email}`,  draft.lastName);
    //   localStorage.setItem(`profile_phone_${draft.email}`,     draft.phone);
    //   localStorage.setItem(`profile_role_${draft.email}`,      draft.role);
    // }
    notifyUserInfoUpdated();
  };

  const cancel = () => {
    setDraft({ ...profile });
    setEditMode(false);
  };

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarError("");
    const result = await validateProfileImage(f);
    if (!result.ok) {
      setAvatarError(result.error || "Invalid image.");
      e.target.value = "";
      return;
    }
    setAvatarInfo({
      width: result.width!,
      height: result.height!,
      size: (f.size / 1024 / 1024).toFixed(2) + " MB",
    });
    const r = new FileReader();
    r.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setAvatar(dataUrl);
      if (profile.email) {
        localStorage.setItem(`profileAvatar_${profile.email}`, dataUrl);
        localStorage.setItem(
          `profileAvatar_${profile.email.toLowerCase()}`,
          dataUrl,
        );
      }
      notifyUserInfoUpdated();
    };
    r.readAsDataURL(f);
  };

  const fieldProps = { editMode, primary, tokens, onChange: handleFieldChange };
  const updatePassword = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const payload = JSON.parse(atob(token.split(".")[1]));
    const userId = payload.userId || payload.id || payload.sub;

    try {
      await axios.put(
        "http://localhost:8080/api/staff/update-password",
        {
          userId: userId,
          oldPassword: pw.current,
          newPassword: pw.next,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
    } catch (e) {
      console.error(e);
    }
  };
  return (
    <div
      className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5"
      style={{ minHeight: "100%", background: tokens.bg }}
    >
      <Breadcrumb page="Profile" parent="Settings" />

      {/* Hero */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: `1px solid ${tokens.border}` }}
      >
        <div
          className="h-28 relative"
          style={{
            background: `linear-gradient(135deg, ${primary}50 0%, ${primary}18 60%, transparent 100%)`,
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 25% 50%, ${primary}28, transparent 65%)`,
            }}
          />
        </div>
        <div className="px-6 pb-5" style={{ background: tokens.card }}>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex items-end gap-4 -mt-14">
              <div
                className="relative group cursor-pointer"
                onClick={() => fileRef.current?.click()}
              >
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-xl border-4 overflow-hidden"
                  style={{
                    background: avatar
                      ? "transparent"
                      : `linear-gradient(135deg,${primary}cc,${primary}77)`,
                    color: "#fff",
                    borderColor: tokens.card,
                  }}
                >
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="av"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div
                  className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(0,0,0,0.42)" }}
                >
                  <span className="text-white text-xs font-bold">
                    📷 Change
                  </span>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onAvatar}
                />
              </div>
              <div className="mb-1">
                <h2
                  className="text-xl font-bold"
                  style={{ color: tokens.text }}
                >
                  {fullName || (
                    <span style={{ color: tokens.muted, fontStyle: "italic" }}>
                      Your Name
                    </span>
                  )}
                </h2>
                <p className="text-sm" style={{ color: tokens.muted }}>
                  {profile.role || <span className="italic">Role not set</span>}
                  {profile.department && ` · ${profile.department}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:mb-1 flex-wrap">
              {saved && (
                <span
                  className="text-xs font-bold px-3 py-1.5 rounded-xl"
                  style={{ background: "#d4e8d4", color: "#2d6a2d" }}
                >
                  ✓ Saved!
                </span>
              )}
              {editMode ? (
                <>
                  <button
                    onClick={cancel}
                    className="px-4 py-2 rounded-xl text-sm font-semibold"
                    style={{
                      background: tokens.cardHover,
                      color: tokens.sub,
                      border: `1px solid ${tokens.border}`,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={save}
                    className="px-5 py-2 rounded-xl text-sm font-bold text-white"
                    style={{
                      background: primary,
                      boxShadow: `0 4px 14px ${primary}45`,
                    }}
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setEditMode(true);
                    setDraft({ ...profile });
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{
                    background: `${primary}15`,
                    color: primary,
                    border: `1.5px solid ${primary}35`,
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        {[{ icon: "📦", label: "Total Orders", color: "#3b82f6" }].map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl"
            style={{
              background: tokens.card,
              border: `1px solid ${tokens.border}`,
            }}
          >
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-lg sm:text-xl flex-shrink-0"
              style={{ background: `${s.color}18` }}
            >
              {s.icon}
            </div>
            <div>
              <p className="text-xs" style={{ color: tokens.muted }}>
                {s.label}
              </p>
              <p className="text-sm font-bold" style={{ color: tokens.text }}>
                {ordersCount}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl w-full sm:w-fit"
        style={{
          background: tokens.cardHover,
          border: `1px solid ${tokens.border}`,
        }}
      >
        {(["profile", "security", "activity"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded-lg text-sm font-semibold capitalize"
            style={{
              background: tab === t ? tokens.card : "transparent",
              color: tab === t ? primary : tokens.muted,
              boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ═ Profile Tab ═ */}
      {tab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div
            className="lg:col-span-2 rounded-2xl p-6"
            style={{
              background: tokens.card,
              border: `1px solid ${tokens.border}`,
            }}
          >
            <div className="mb-5">
              <h3 className="font-bold" style={{ color: tokens.text }}>
                Personal Information
              </h3>
              <p className="text-xs mt-0.5" style={{ color: tokens.muted }}>
                {editMode
                  ? "Fill in your details and click Save Changes."
                  : "Click Edit Profile to update your details."}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProfileField
                {...fieldProps}
                label="First Name"
                field="firstName"
                ph="e.g. John"
                draftValue={draft.firstName}
                profileValue={profile.firstName}
              />
              <ProfileField
                {...fieldProps}
                label="Last Name"
                field="lastName"
                ph="e.g. Smith"
                draftValue={draft.lastName}
                profileValue={profile.lastName}
              />
              <ProfileField
                {...fieldProps}
                label="Email Address"
                field="email"
                ph="you@example.com"
                type="email"
                draftValue={draft.email}
                profileValue={profile.email}
              />
              <ProfileField
                {...fieldProps}
                label="Phone Number"
                field="phone"
                ph="+1 (555) 000-0000"
                type="tel"
                draftValue={draft.phone}
                profileValue={profile.phone}
              />
              <ProfileField
                {...fieldProps}
                label="Role "
                field="role"
                ph="e.g. Staff Member"
                draftValue={draft.role}
                profileValue={profile.role}
              />
              {/* <ProfileField {...fieldProps} label="Department"    field="department" ph="e.g. Operations"             draftValue={draft.department} profileValue={profile.department}/>
              <ProfileField {...fieldProps} label="Location"      field="location"   ph="City, Country"               draftValue={draft.location}   profileValue={profile.location}/> */}
              <div />
              {/* Bio */}
              {/* <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{color:tokens.muted}}>Bio</label>
                {editMode ? (
                  <textarea value={draft.bio} rows={3} placeholder="Tell us about yourself..."
                    onChange={e => setDraft(p=>({...p, bio:e.target.value}))}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none resize-none"
                    style={{background:tokens.cardHover, color:tokens.text, border:`1.5px solid ${primary}`, boxShadow:`0 0 0 3px ${primary}15`}}/>
                ) : (
                  <div className="px-3.5 py-2.5 rounded-xl text-sm min-h-[70px]"
                    style={{background:tokens.cardHover, border:`1px solid ${tokens.border}`, color:profile.bio?tokens.text:tokens.muted}}>
                    {profile.bio || <em>No bio added yet</em>}
                  </div>
                )}
              </div> */}
            </div>
            {!editMode && !profile.firstName && !profile.email && (
              <div
                className="mt-5 p-4 rounded-xl flex items-center gap-3"
                style={{
                  background: `${primary}10`,
                  border: `1px dashed ${primary}40`,
                }}
              >
                <span className="text-2xl">👋</span>
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: tokens.text }}
                  >
                    Welcome! Set up your profile
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: tokens.muted }}>
                    Click <strong>Edit Profile</strong> above to enter your
                    details.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          {/* <div className="space-y-4">
            <div
              className="rounded-2xl p-5 text-center"
              style={{
                background: tokens.card,
                border: `1px solid ${tokens.border}`,
              }}
            >
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-3 shadow-md overflow-hidden cursor-pointer"
                style={{
                  background: avatar
                    ? "transparent"
                    : `linear-gradient(135deg,${primary}cc,${primary}77)`,
                  color: "#fff",
                }}
                onClick={() => fileRef.current?.click()}
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt="av"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <p className="text-sm font-bold" style={{ color: tokens.text }}>
                {fullName || "—"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: tokens.muted }}>
                {profile.email || "—"}
              </p>
              {profile.phone && (
                <p className="text-xs mt-0.5" style={{ color: tokens.muted }}>
                  {profile.phone}
                </p>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                className="mt-3 w-full py-2 rounded-xl text-xs font-semibold"
                style={{ background: `${primary}15`, color: primary }}
              >
                Upload Photo
              </button>
              <p
                className="text-[10px] mt-1.5 leading-relaxed"
                style={{ color: tokens.muted }}
              >
                JPG / PNG · Max 5 MB
                <br />
                200×200 to 3000×3000 px · Square or near-square
              </p>
              {avatarError && (
                <p className="text-[10px] mt-1 text-red-400 font-medium">
                  {avatarError}
                </p>
              )}
              {avatarInfo && !avatarError && (
                <p className="text-[10px] mt-1" style={{ color: tokens.muted }}>
                  {avatarInfo.width}×{avatarInfo.height}px · {avatarInfo.size}
                </p>
              )}
              {avatar && (
                <button
                  onClick={() => {
                    setAvatar(null);
                    setAvatarInfo(null);
                    setAvatarError("");
                    if (profile.email) {
                      localStorage.removeItem(`profileAvatar_${profile.email}`);
                      localStorage.removeItem(
                        `profileAvatar_${profile.email.toLowerCase()}`,
                      );
                    }
                  }}
                  className="mt-1.5 w-full py-1.5 rounded-xl text-xs font-semibold"
                  style={{
                    background: "rgba(239,68,68,0.10)",
                    color: "#ef4444",
                  }}
                >
                  Remove Photo
                </button>
              )}
            </div>
            <div
              className="rounded-2xl p-5 space-y-3"
              style={{
                background: tokens.card,
                border: `1px solid ${tokens.border}`,
              }}
            >
              <p
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: tokens.muted }}
              >
                Summary
              </p>
              {(
                [
                  { icon: "📧", val: profile.email },
                  { icon: "📞", val: profile.phone },
                ] as const
              ).map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="text-base">{item.icon}</span>
                  <span
                    className="text-xs truncate"
                    style={{ color: item.val ? tokens.sub : tokens.muted }}
                  >
                    {item.val || "—"}
                  </span>
                </div>
              ))}
            </div> 
          </div>*/}
        </div>
      )}

      {/* ═ Security Tab ═ */}
      {tab === "security" && (
        <div
          className="rounded-2xl p-6 max-w-2xl space-y-6"
          style={{
            background: tokens.card,
            border: `1px solid ${tokens.border}`,
          }}
        >
          <h3 className="font-bold" style={{ color: tokens.text }}>
            Security Settings
          </h3>
          <div className="space-y-3">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: tokens.muted }}
            >
              Change Password
            </p>
            {pwOk && (
              <div
                className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "#d4e8d4", color: "#2d6a2d" }}
              >
                ✓ Password updated!
              </div>
            )}
            {(
              [
                { k: "current", l: "Current Password" },
                { k: "next", l: "New Password" },
                { k: "confirm", l: "Confirm Password" },
              ] as { k: keyof typeof pw; l: string }[]
            ).map((f) => (
              <div key={f.k}>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: tokens.muted }}
                >
                  {f.l}
                </label>
                <input
                  type="password"
                  value={pw[f.k]}
                  placeholder="••••••••"
                  onChange={(e) =>
                    setPw((p) => ({ ...p, [f.k]: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    background: tokens.cardHover,
                    color: tokens.text,
                    border: `1.5px solid ${tokens.border}`,
                  }}
                  onFocus={(e) => (e.target.style.borderColor = primary)}
                  onBlur={(e) => (e.target.style.borderColor = tokens.border)}
                />
              </div>
            ))}
            {pw.next && pw.confirm && pw.next !== pw.confirm && (
              <p className="text-xs" style={{ color: "#ef4444" }}>
                Passwords do not match.
              </p>
            )}
            <button
              onClick={() => {
                if (pw.next && pw.next === pw.confirm) {
                  updatePassword();
                  setPw({ current: "", next: "", confirm: "" });
                  setPwOk(true);
                  setTimeout(() => setPwOk(false), 3000);
                }
              }}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white"
              style={{
                background: primary,
                opacity: pw.next && pw.next === pw.confirm ? 1 : 0.4,
              }}
            >
              Update Password
            </button>
          </div>
          <div style={{ height: 1, background: tokens.border }} />
          {/* <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold" style={{color:tokens.text}}>Two-Factor Authentication</p>
              <p className="text-xs mt-0.5" style={{color:tokens.muted}}>Extra layer of security</p>
            </div>
            <div className="w-11 h-6 rounded-full relative cursor-pointer" style={{background:`${primary}40`}}>
              <div className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow-sm"/>
            </div>
          </div> */}
        </div>
      )}

      {/* ═ Activity Tab ═ */}
      {tab==="activity" && (
        <div className="space-y-4 max-w-2xl">
          <div className="rounded-2xl p-6" style={{background:tokens.card, border:`1px solid ${tokens.border}`}}>
            <h3 className="font-bold mb-4" style={{color:tokens.text}}>Recent Activity</h3>
            <div className="space-y-3">
              {[
                { icon:"🔐", text:"Staff logged in",            time:"Just now",    color:primary },
                { icon:"📦", text:"Viewed inventory list",      time:"5 min ago",  color:"#10b981" },
                { icon:"🔲", text:"Scanned QR code",            time:"20 min ago", color:"#8b5cf6" },
                { icon:"📤", text:"Stock out operation done",   time:"1 hour ago", color:"#f59e0b" },
                { icon:"📥", text:"Stock in recorded",          time:"2 hours ago",color:"#3b82f6" },
                { icon:"⚙️", text:"Updated profile settings",  time:"Yesterday",  color:"#06b6d4" },
              ].map((a,i)=>(
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{background:tokens.cardHover}}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{background:`${a.color}18`}}>{a.icon}</div>
                  <p className="text-sm flex-1" style={{color:tokens.text}}>{a.text}</p>
                  <p className="text-xs flex-shrink-0" style={{color:tokens.muted}}>{a.time}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl p-6" style={{background:tokens.card, border:`1px solid ${tokens.border}`}}>
            <h3 className="font-bold mb-4" style={{color:tokens.text}}>Quick Links</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label:"View Inventory",   href:"/staff/inventory/view", icon:"📦", color:"#3b82f6" },
                { label:"Stock In",          href:"/staff/stock/in",       icon:"📥", color:"#10b981" },
                { label:"Stock Out",         href:"/staff/stock/out",      icon:"📤", color:"#f59e0b" },
                { label:"Scan QR Code",      href:"/staff/QRcode/Scan",    icon:"🔲", color:"#8b5cf6" },
              ].map(r=>(
                <button key={r.label} onClick={()=>navigate(r.href)}
                  className="flex items-center gap-3 p-3 rounded-xl text-left"
                  style={{background:tokens.cardHover, border:`1px solid ${tokens.border}`, cursor:"pointer"}}>
                  <span className="text-xl">{r.icon}</span>
                  <span className="text-sm font-semibold" style={{color:tokens.text}}>{r.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffProfile;
