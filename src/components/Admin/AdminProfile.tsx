import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme, Breadcrumb } from "./Navbar";
import { notifyUserInfoUpdated } from "../../hooks/useUserInfo";
import axios  from "axios";
import { ConfirmDialog, Toast, useConfirm, useToast } from "../shared/ConfirmDialog";

const EMPTY = { firstName:"", lastName:"", email:"", phone:"", role:"",path:"" };
type ProfileData = typeof EMPTY;

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

function validateProfileImage(file: File): Promise<{ ok: boolean; error?: string; width?: number; height?: number }> {
  return new Promise((resolve) => {
    if (!ALLOWED_TYPES.includes(file.type))
      return resolve({ ok: false, error: "Unsupported format. Please upload a JPG or PNG file." });
    if (file.size > MAX_FILE_SIZE_BYTES)
      return resolve({ ok: false, error: `File exceeds the ${MAX_FILE_SIZE_MB} MB limit.` });
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
        return resolve({ ok: false, error: "Please use a square or near-square photo." });
      resolve({ ok: true, width: img.width, height: img.height });
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve({ ok: false, error: "Unable to read the image file." }); };
    img.src = url;
  });
}

/* ── Field component defined OUTSIDE the parent so React never remounts it ── */
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
const ProfileField = ({ label, field, type="text", ph, wide=false, editMode, draftValue, profileValue, primary, tokens, onChange }: FieldProps) => (
  <div className={wide ? "sm:col-span-2" : ""}>
    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{color:tokens.muted}}>{label}</label>
    {editMode ? (
      <input
        type={type}
        value={draftValue}
        placeholder={ph || `Enter ${label.toLowerCase()}`}
        onChange={e => onChange(field, e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
        style={{background:tokens.cardHover, color:tokens.text, border:`1.5px solid ${primary}`, boxShadow:`0 0 0 3px ${primary}15`}}
      />
    ) : (
      <div className="px-3.5 py-2.5 rounded-xl text-sm"
        style={{background:tokens.cardHover, border:`1px solid ${tokens.border}`, color:profileValue ? tokens.text : tokens.muted}}>
        {profileValue || <em>Not set</em>}
      </div>
    )}
  </div>
);

const AdminProfile = () => {
  const { tokens, primary } = useTheme();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData>(EMPTY);
  const [draft,   setDraft]   = useState<ProfileData>(EMPTY);
  const [editMode, setEditMode] = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [tab, setTab]           = useState<"profile"|"security"|"activity">("profile");
  const [avatar,      setAvatar]      = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState("");
  const [avatarInfo,  setAvatarInfo]  = useState<{width:number;height:number;size:string}|null>(null);
  const [pw, setPw]   = useState({ current:"", next:"", confirm:"" });
  const [pwOk, setPwOk] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Live stats from backend
  const [stats, setStats] = useState({ totalStockMovements: 0, staffCount: 0, totalItems: 0, lowStockCount: 0 });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch("http://localhost:8080/api/admin/stock/all", { headers }).then(r => r.ok ? r.json() : []),
      fetch("http://localhost:8080/api/admin/users/fetchAll", { headers }).then(r => r.ok ? r.json() : []),
      fetch("http://localhost:8080/api/admin/item/fetchAll", { headers }).then(r => r.ok ? r.json() : []),
    ]).then(([txData, usersData, itemsData]) => {
      const txArr = Array.isArray(txData) ? txData : [];
      const usersArr = Array.isArray(usersData) ? usersData : [];
      const itemsArr = Array.isArray(itemsData) ? itemsData : [];
      const staffOnly = usersArr.filter((u: any) => u.role === "STAFF");
      const lowStock = itemsArr.filter((i: any) => {
        const qty = i.quantityInStock ?? 0;
        const reorder = i.reOrderLevel ?? 0;
        return qty <= reorder;
      });
      setStats({
        totalStockMovements: txArr.length,
        staffCount: staffOnly.length,
        totalItems: itemsArr.length,
        lowStockCount: lowStock.length,
      });
    }).catch(() => {});
  }, []);

useEffect(() => {
  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const payload = JSON.parse(atob(token.split(".")[1]));
      const userId = payload.userId || payload.id || payload.sub;

      const response = await axios.get(
        `http://localhost:8080/api/admin/find?id=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;

      const profileData = {
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        phone: data.mobile || "",
        role: data.role || "",
        path: data.path || "",
      };
      console.log(data.path)
      setProfile(profileData);
      setDraft(profileData);

        if (data.path) {
        setAvatar(`http://localhost:8080/images/${data.path}`);
        }
      

    } catch (error) {
      console.error("Admin profile fetch failed", error);
    }
  };

  fetchProfile();
}, []);
  const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();
  const { toastState, showToast, hideToast } = useToast();

  const initials = [profile.firstName[0], profile.lastName[0]].filter(Boolean).join("").toUpperCase() || "?";
  const fullName = `${profile.firstName} ${profile.lastName}`.trim();


  const handleFieldChange = useCallback((field: keyof ProfileData, value: string) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  }, []);

  const save = async () => {
  const token = localStorage.getItem("token");
  if (!token) return;

  const payload = JSON.parse(atob(token.split(".")[1]));
  const userId = payload.userId || payload.id || payload.sub;

  try {
    const body = {
      id: userId,
      firstName: draft.firstName,
      lastName: draft.lastName,
      mobile: draft.phone,
      emailVerified: true,
    };

    await axios.put(
      "http://localhost:8080/api/admin/user/profile/update",
      body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setProfile({ ...draft });
    setEditMode(false);
    setSaved(true);

    setTimeout(() => setSaved(false), 3000);

    notifyUserInfoUpdated();
  } catch (e) {
    console.error("Admin update failed", e);
  }
};
  const cancel = async () => {
    const ok = await confirm({
      title: "Discard Changes",
      message: "Are you sure you want to discard unsaved changes?",
      confirmLabel: "Yes, Discard",
      cancelLabel: "Keep Editing",
      confirmColor: "#f59e0b",
      icon: "⚠️",
    });
    if (!ok) return;
    setDraft({ ...profile }); setEditMode(false);
  };

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setAvatarError("");
    const result = await validateProfileImage(f);
    if (!result.ok) { setAvatarError(result.error || "Invalid image."); e.target.value = ""; return; }
    setAvatarInfo({ width: result.width!, height: result.height!, size: (f.size/1024/1024).toFixed(2)+" MB" });
    const r = new FileReader();
    r.onload = ev => {
      const dataUrl = ev.target?.result as string;
      setAvatar(dataUrl);
      if (profile.email) {
        localStorage.setItem(`profileAvatar_${profile.email}`, dataUrl);
        localStorage.setItem(`profileAvatar_${profile.email.toLowerCase()}`, dataUrl);
      }
      notifyUserInfoUpdated();
    };
    r.readAsDataURL(f);
  };

  const fieldProps = { editMode, primary, tokens, onChange: handleFieldChange };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5" style={{minHeight:"100%", background:tokens.bg}}>
      <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} tokens={tokens} primary={primary} />
      <Toast {...toastState} onClose={hideToast} />
      <Breadcrumb page="Profile" parent="Settings"/>

      {/* Hero */}
      <div className="rounded-2xl overflow-hidden" style={{border:`1px solid ${tokens.border}`}}>
        <div className="h-28 relative" style={{background:`linear-gradient(135deg, ${primary}50 0%, ${primary}18 60%, transparent 100%)`}}>
          <div className="absolute inset-0" style={{background:`radial-gradient(ellipse at 25% 50%, ${primary}28, transparent 65%)`}}/>
        </div>
        <div className="px-6 pb-5" style={{background:tokens.card}}>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex items-end gap-4 -mt-14">
              <div className="relative group cursor-pointer" onClick={()=>fileRef.current?.click()}>
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-xl border-4 overflow-hidden"
                  style={{background:avatar?"transparent":`linear-gradient(135deg,${primary}cc,${primary}77)`, color:"#fff", borderColor:tokens.card}}>
                  {avatar ? <img src={avatar} alt="av" className="w-full h-full object-cover"/> : initials}
                </div>
                <div className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{background:"rgba(0,0,0,0.42)"}}>
                  <span className="text-white text-xs font-bold">📷 Change</span>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatar}/>
              </div>
      
            </div>
            <div className="flex items-center gap-2 sm:mb-1 flex-wrap">
              {saved && <span className="text-xs font-bold px-3 py-1.5 rounded-xl" style={{background:"#d4e8d4", color:"#2d6a2d"}}>✓ Saved!</span>}
              {editMode ? (
                <>
                  <button onClick={cancel} className="px-4 py-2 rounded-xl text-sm font-semibold"
                    style={{background:tokens.cardHover, color:tokens.sub, border:`1px solid ${tokens.border}`}}>Cancel</button>
                  <button onClick={save} className="px-5 py-2 rounded-xl text-sm font-bold text-white"
                    style={{background:primary, boxShadow:`0 4px 14px ${primary}45`}}>Save Changes</button>
                </>
              ) : (
                <button onClick={()=>{ setEditMode(true); setDraft({...profile}); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{background:`${primary}15`, color:primary, border:`1.5px solid ${primary}35`}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
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
        {[
          { icon:"📦", label:"Stock Movements", value: stats.totalStockMovements.toLocaleString(), color:"#3b82f6" },
          { icon:"👥", label:"Staff Managed",   value: stats.staffCount.toLocaleString(),          color:"#10b981" },
          { icon:"📊", label:"Total Items",      value: stats.totalItems.toLocaleString(),           color:"#8b5cf6" },
          { icon:"⚠️", label:"Low Stock Alerts", value: stats.lowStockCount.toLocaleString(),        color:"#f59e0b" },
        ].map(s=>(
          <div key={s.label} className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl" style={{background:tokens.card, border:`1px solid ${tokens.border}`}}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-lg sm:text-xl flex-shrink-0" style={{background:`${s.color}18`}}>{s.icon}</div>
            <div>
              <p className="text-xs" style={{color:tokens.muted}}>{s.label}</p>
              <p className="text-sm font-bold" style={{color:s.color}}>{s.value || "—"}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-full sm:w-fit" style={{background:tokens.cardHover, border:`1px solid ${tokens.border}`}}>
        {(["profile","security","activity"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded-lg text-sm font-semibold capitalize"
            style={{background:tab===t?tokens.card:"transparent", color:tab===t?primary:tokens.muted,
                    boxShadow:tab===t?"0 1px 4px rgba(0,0,0,0.08)":"none", transition:"all 0.15s"}}>{t}</button>
        ))}
      </div>

      {/* ═ Profile Tab ═ */}
      {tab==="profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-2xl p-6" style={{background:tokens.card, border:`1px solid ${tokens.border}`}}>
            <div className="mb-5">
              <h3 className="font-bold" style={{color:tokens.text}}>Personal Information</h3>
              <p className="text-xs mt-0.5" style={{color:tokens.muted}}>
                {editMode ? "Fill in your details and click Save Changes." : "Click Edit Profile to update your details."}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProfileField {...fieldProps} label="First Name"    field="firstName"  ph="e.g. John"                   draftValue={draft.firstName}  profileValue={profile.firstName}/>
              <ProfileField {...fieldProps} label="Last Name"     field="lastName"   ph="e.g. Smith"                  draftValue={draft.lastName}   profileValue={profile.lastName}/>
              <ProfileField {...fieldProps} label="Email Address" field="email"      ph="you@example.com" type="email" draftValue={draft.email}      profileValue={profile.email}/>
              <ProfileField {...fieldProps} label="Phone Number"  field="phone"      ph="+1 (555) 000-0000" type="tel" draftValue={draft.phone}      profileValue={profile.phone}/>
              <ProfileField {...fieldProps} label="Role / Title"  field="role"       ph="e.g. System Administrator"   draftValue={draft.role}       profileValue={profile.role}/>
              <div/>
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
              <div className="mt-5 p-4 rounded-xl flex items-center gap-3"
                style={{background:`${primary}10`, border:`1px dashed ${primary}40`}}>
                <span className="text-2xl">👋</span>
                <div>
                  <p className="text-sm font-semibold" style={{color:tokens.text}}>Welcome! Set up your profile</p>
                  <p className="text-xs mt-0.5" style={{color:tokens.muted}}>Click <strong>Edit Profile</strong> above to enter your details.</p>
                </div>
              </div>
            )}
          </div>

        </div> 
      )}

      {/* ═ Security Tab ═ */}
      {tab==="security" && (
        <div className="rounded-2xl p-6 max-w-2xl space-y-6" style={{background:tokens.card, border:`1px solid ${tokens.border}`}}>
          <h3 className="font-bold" style={{color:tokens.text}}>Security Settings</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{color:tokens.muted}}>Change Password</p>
              <p className="text-sm mb-4" style={{color:tokens.muted}}>To change your password securely, we'll send a verification code to your email.</p>
              <button
                onClick={() => navigate("/admin/forgot-password")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
                style={{background:primary, boxShadow:`0 4px 14px ${primary}40`}}>
                🔐 Change Password
              </button>
            </div>
          </div>
          <div style={{height:1, background:tokens.border}}/>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{color:tokens.muted}}>Two-Factor Authentication</p>
            <p className="text-sm mb-3" style={{color:tokens.muted}}>Add an extra layer of security to your account by enabling 2FA.</p>
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{background:tokens.cardHover, border:`1px solid ${tokens.border}`}}>
              <span className="text-2xl">🔒</span>
              <div>
                <p className="text-sm font-semibold" style={{color:tokens.text}}>2FA Status</p>
                <p className="text-xs" style={{color:"#f59e0b"}}>Not configured</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═ Activity Tab ═ */}
      {tab==="activity" && (
        <div className="space-y-4 max-w-2xl">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon:"📦", label:"Stock Movements", value: stats.totalStockMovements.toLocaleString(), color:"#3b82f6" },
              { icon:"👥", label:"Staff Managed",   value: stats.staffCount.toLocaleString(),          color:"#10b981" },
              { icon:"📊", label:"Total Items",      value: stats.totalItems.toLocaleString(),           color:"#8b5cf6" },
              { icon:"⚠️", label:"Low Stock Alerts", value: stats.lowStockCount.toLocaleString(),        color:"#f59e0b" },
            ].map(s=>(
              <div key={s.label} className="flex flex-col gap-1 p-4 rounded-2xl" style={{background:tokens.card, border:`1px solid ${tokens.border}`}}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl mb-1" style={{background:`${s.color}18`}}>{s.icon}</div>
                <p className="text-xs" style={{color:tokens.muted}}>{s.label}</p>
                <p className="text-xl font-extrabold" style={{color:s.color}}>{s.value || "—"}</p>
              </div>
            ))}
          </div>

          {/* Recent activity log */}
          <div className="rounded-2xl p-6" style={{background:tokens.card, border:`1px solid ${tokens.border}`}}>
            <h3 className="font-bold mb-4" style={{color:tokens.text}}>Recent Activity</h3>
            <div className="space-y-3">
              {[
                { icon:"🔐", text:"Admin logged in",              time:"Just now",    color:"#3b82f6" },
                { icon:"📦", text:"Viewed inventory list",        time:"2 min ago",  color:"#10b981" },
                { icon:"📊", text:"Generated inventory report",   time:"15 min ago", color:"#8b5cf6" },
                { icon:"👥", text:"Managed staff accounts",       time:"1 hour ago", color:"#f59e0b" },
                { icon:"🔲", text:"Generated QR codes for items", time:"2 hours ago",color:"#ec4899" },
                { icon:"⚙️", text:"Updated profile settings",    time:"Yesterday",  color:"#06b6d4" },
              ].map((a, i)=>(
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{background:tokens.cardHover}}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{background:`${a.color}18`}}>{a.icon}</div>
                  <p className="text-sm flex-1" style={{color:tokens.text}}>{a.text}</p>
                  <p className="text-xs flex-shrink-0" style={{color:tokens.muted}}>{a.time}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Reports quick links */}
          <div className="rounded-2xl p-6" style={{background:tokens.card, border:`1px solid ${tokens.border}`}}>
            <h3 className="font-bold mb-4" style={{color:tokens.text}}>Quick Report Access</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label:"Inventory Report",  href:"/admin/reports/inventory", icon:"📋", color:"#3b82f6" },
                { label:"Low Stock Report",  href:"/admin/reports/low-stock", icon:"⚠️", color:"#f59e0b" },
                { label:"Stock History",     href:"/admin/stock/history",     icon:"📈", color:"#10b981" },
                { label:"Manage Staff",      href:"/admin/users/manage",      icon:"👥", color:"#8b5cf6" },
              ].map(r=>(
                <button key={r.label} onClick={()=>navigate(r.href)}
                  className="flex items-center gap-3 p-3 rounded-xl text-left transition-colors hover:brightness-95"
                  style={{background:tokens.cardHover, border:`1px solid ${tokens.border}`}}>
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

export default AdminProfile;
