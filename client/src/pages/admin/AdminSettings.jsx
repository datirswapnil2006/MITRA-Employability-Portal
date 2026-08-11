import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { ADMIN_LINKS } from "./adminLinks";
import { Settings as SettingsIcon, User, Shield, Palette, Check, Sun, Moon, Laptop, LayoutList, Columns, Camera, Upload, Trash2 } from "lucide-react";
import { getFileUrl } from "../../utils/fileUrl";
import { uploadAdminPhotoApi, deleteAdminPhotoApi, updateAdminProfileApi } from "../../api/admin";

const navigateAdmin = (navigate) => (k) => {
  if (k === "overview") navigate("/admin");
  else if (k === "tests") navigate("/admin/tests");
  else navigate(`/admin/${k}`);
};

const input = "w-full px-3 py-2.5 border-[1.5px] border-line rounded-lg bg-white text-sm text-ink outline-none focus:border-accent transition-colors";
const labelCls = "block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5";
const stampBtn = "bg-accent text-white rounded-lg px-5 py-2.5 font-semibold text-[13.5px] hover:bg-accent-hover transition-colors";

export default function AdminSettings() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const avatarInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [saved, setSaved] = useState(false);

  // Profile
  const [name, setName] = useState(user?.name || "");
  const [email] = useState(user?.email || "");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [photoError, setPhotoError] = useState("");

  // Sync state whenever user object changes in AuthContext
  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user?.name]);

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setPhotoError("");
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await uploadAdminPhotoApi(formData);
      if (res?.user && updateUser) {
        updateUser(res.user);
      }
      showSaved();
    } catch (err) {
      setPhotoError(err.response?.data?.message || "Failed to upload profile photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm("Remove your profile photo?")) return;
    setUploadingPhoto(true);
    setPhotoError("");
    try {
      const res = await deleteAdminPhotoApi();
      if (res?.user && updateUser) {
        updateUser(res.user);
      }
      showSaved();
    } catch (err) {
      setPhotoError(err.response?.data?.message || "Failed to remove profile photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // System
  const [defaultDuration, setDefaultDuration] = useState(60);
  const [autoApprove, setAutoApprove] = useState(false);
  const [proctoringThreshold, setProctoringThreshold] = useState(5);

  // Appearance
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("sidebar_collapsed") === "true";
  });

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSavingProfile(true);
    setPhotoError("");
    try {
      const res = await updateAdminProfileApi({ name: name.trim() });
      if (res?.user && updateUser) {
        updateUser(res.user);
      }
      showSaved();
    } catch (err) {
      setPhotoError(err.response?.data?.message || "Failed to update profile name");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await updateAdminProfileApi({ password: newPassword });
      if (res?.user && updateUser) {
        updateUser(res.user);
      }
      showSaved();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveSystem = (e) => {
    e.preventDefault();
    showSaved();
  };

  const handleThemeChange = (t) => {
    setTheme(t);
    localStorage.setItem("theme", t);
    if (t === "dark") {
      document.documentElement.classList.add("dark");
    } else if (t === "light") {
      document.documentElement.classList.remove("dark");
    } else if (t === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    window.dispatchEvent(new Event("themeChange"));
    showSaved();
  };

  const handleSidebarChange = (collapsed) => {
    setSidebarCollapsed(collapsed);
    localStorage.setItem("sidebar_collapsed", JSON.stringify(collapsed));
    window.dispatchEvent(new Event("sidebarChange"));
    showSaved();
  };

  const tabs = [
    { key: "profile", label: "Profile", icon: User },
    { key: "security", label: "Security", icon: Shield },
    { key: "system", label: "System", icon: SettingsIcon },
    { key: "appearance", label: "Appearance", icon: Palette },
  ];

  return (
    <DashboardLayout active="settings" links={ADMIN_LINKS} onNavigate={navigateAdmin(navigate)}>
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-1">
          <SettingsIcon size={22} className="text-accent" />
          <h1 className="font-display text-[26px] font-bold">Settings</h1>
        </div>
        <p className="text-ink-soft text-[13.5px]">
          Manage your profile, security, and system preferences.
        </p>
      </div>

      {/* Success toast */}
      {saved && (
        <div className="fixed top-6 right-6 z-50 bg-success text-white px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-fadeIn">
          <Check size={16} /> Settings saved
        </div>
      )}

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Tab nav */}
        <div className="lg:w-52 shrink-0">
          <div className="bg-white border border-line rounded-xl overflow-hidden">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2.5 w-full px-4 py-3 text-[13px] font-medium transition-colors border-b border-line last:border-b-0 ${
                    activeTab === tab.key
                      ? "bg-accent/5 text-accent"
                      : "text-ink-soft hover:text-ink hover:bg-slate-50"
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 max-w-2xl">
          {activeTab === "profile" && (
            <div className="bg-white border border-line rounded-xl p-6">
              <h2 className="font-display text-lg font-semibold mb-4">Profile Information</h2>
              <form onSubmit={handleSaveProfile}>
                <div className="flex items-center gap-5 mb-6 pb-6 border-b border-line">
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-accent to-blue-400 flex items-center justify-center text-white text-2xl font-bold border-2 border-line shadow-sm">
                      {user?.profileImage ? (
                        <img src={getFileUrl(user.profileImage)} alt={name} className="w-full h-full object-cover object-top" />
                      ) : (
                        name.charAt(0)?.toUpperCase() || "A"
                      )}
                    </div>
                    {user?.role === "admin" && (
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 bg-accent text-white p-1.5 rounded-full shadow hover:bg-accent-hover transition-colors"
                        title="Upload Profile Photo"
                      >
                        <Camera size={14} />
                      </button>
                    )}
                  </div>

                  <div>
                    <div className="font-bold text-base text-ink">{name}</div>
                    <div className="text-[13px] text-ink-soft mb-2.5">{email}</div>

                    {user?.role === "admin" && (
                      <div className="flex items-center gap-2">
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoSelect}
                        />
                        <button
                          type="button"
                          disabled={uploadingPhoto}
                          onClick={() => avatarInputRef.current?.click()}
                          className="px-3.5 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Upload size={13} /> {uploadingPhoto ? "Uploading..." : "Upload Photo"}
                        </button>

                        {user?.profileImage && (
                          <button
                            type="button"
                            disabled={uploadingPhoto}
                            onClick={handleRemovePhoto}
                            className="px-3.5 py-1.5 rounded-lg border border-line text-ink-soft hover:text-danger hover:border-danger/30 transition-colors text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Trash2 size={13} /> Remove
                          </button>
                        )}
                      </div>
                    )}

                    {photoError && (
                      <p className="text-[11.5px] text-danger mt-1.5 font-medium">{photoError}</p>
                    )}
                  </div>
                </div>
                <div className="mb-4">
                  <label className={labelCls}>Name</label>
                  <input className={input} value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="mb-4">
                  <label className={labelCls}>Email</label>
                  <input className={`${input} bg-slate-50`} value={email} readOnly />
                  <p className="text-[11px] text-ink-soft mt-1">Email cannot be changed</p>
                </div>
                <button type="submit" disabled={savingProfile} className={`${stampBtn} disabled:opacity-50`}>
                  {savingProfile ? "Saving Profile..." : "Save Profile"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "security" && (
            <div className="bg-white border border-line rounded-xl p-6">
              <h2 className="font-display text-lg font-semibold mb-4">Change Password</h2>
              <form onSubmit={handleSavePassword}>
                <div className="mb-4">
                  <label className={labelCls}>Current Password</label>
                  <input type="password" className={input} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                </div>
                <div className="mb-4">
                  <label className={labelCls}>New Password</label>
                  <input type="password" className={input} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <div className="mb-4">
                  <label className={labelCls}>Confirm New Password</label>
                  <input type="password" className={input} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
                <button type="submit" disabled={savingPassword} className={`${stampBtn} disabled:opacity-50`}>
                  {savingPassword ? "Updating Password..." : "Update Password"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "system" && (
            <div className="bg-white border border-line rounded-xl p-6">
              <h2 className="font-display text-lg font-semibold mb-4">System Settings</h2>
              <form onSubmit={handleSaveSystem}>
                <div className="mb-4">
                  <label className={labelCls}>Default Test Duration (minutes)</label>
                  <input type="number" min={1} className={input} value={defaultDuration} onChange={(e) => setDefaultDuration(Number(e.target.value))} />
                </div>
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className={labelCls}>Auto-approve Registrations</label>
                      <p className="text-[12px] text-ink-soft -mt-1">Skip the approval queue for new students</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoApprove(!autoApprove)}
                      className={`relative w-[42px] h-6 rounded-full shrink-0 transition-colors ${autoApprove ? "bg-success" : "bg-slate-300"}`}
                    >
                      <span className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${autoApprove ? "translate-x-[18px]" : ""}`} />
                    </button>
                  </div>
                </div>
                <div className="mb-4">
                  <label className={labelCls}>Proctoring Event Threshold (before auto-submit)</label>
                  <input type="number" min={1} max={20} className={input} value={proctoringThreshold} onChange={(e) => setProctoringThreshold(Number(e.target.value))} />
                  <p className="text-[11px] text-ink-soft mt-1">Number of critical events before a test is auto-submitted</p>
                </div>
                <button type="submit" className={stampBtn}>Save Settings</button>
              </form>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="bg-white border border-line rounded-xl p-6 space-y-6">
              <div>
                <h2 className="font-display text-lg font-semibold mb-1">Theme Mode</h2>
                <p className="text-[13px] text-ink-soft mb-4">Choose how the portal interface looks to you.</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleThemeChange("light")}
                    className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col justify-between ${
                      theme === "light" ? "border-accent bg-accent/5" : "border-line hover:border-accent/30"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-amber-500 mb-3 border border-slate-200">
                      <Sun size={18} />
                    </div>
                    <div>
                      <div className="text-[13.5px] font-semibold text-ink flex items-center justify-between">
                        Light {theme === "light" && <Check size={14} className="text-accent" />}
                      </div>
                      <div className="text-[11.5px] text-ink-soft mt-0.5">Clean & bright view</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleThemeChange("dark")}
                    className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col justify-between ${
                      theme === "dark" ? "border-accent bg-accent/5" : "border-line hover:border-accent/30"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-indigo-400 mb-3 border border-slate-700">
                      <Moon size={18} />
                    </div>
                    <div>
                      <div className="text-[13.5px] font-semibold text-ink flex items-center justify-between">
                        Dark {theme === "dark" && <Check size={14} className="text-accent" />}
                      </div>
                      <div className="text-[11.5px] text-ink-soft mt-0.5">Sleek dark theme</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleThemeChange("system")}
                    className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col justify-between ${
                      theme === "system" ? "border-accent bg-accent/5" : "border-line hover:border-accent/30"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 mb-3 border border-slate-300">
                      <Laptop size={18} />
                    </div>
                    <div>
                      <div className="text-[13.5px] font-semibold text-ink flex items-center justify-between">
                        System {theme === "system" && <Check size={14} className="text-accent" />}
                      </div>
                      <div className="text-[11.5px] text-ink-soft mt-0.5">Match OS theme</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-5 border-t border-line">
                <h3 className="font-semibold text-sm text-ink mb-1">Navigation Sidebar Layout</h3>
                <p className="text-[12.5px] text-ink-soft mb-3">Select your preferred default sidebar navigation view.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                  <button
                    type="button"
                    onClick={() => handleSidebarChange(false)}
                    className={`p-3.5 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                      !sidebarCollapsed ? "border-accent bg-accent/5" : "border-line hover:border-accent/30"
                    }`}
                  >
                    <LayoutList size={20} className={!sidebarCollapsed ? "text-accent" : "text-ink-soft"} />
                    <div>
                      <div className="text-[13px] font-semibold text-ink">Expanded View</div>
                      <div className="text-[11px] text-ink-soft">Full labels & icons</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSidebarChange(true)}
                    className={`p-3.5 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                      sidebarCollapsed ? "border-accent bg-accent/5" : "border-line hover:border-accent/30"
                    }`}
                  >
                    <Columns size={20} className={sidebarCollapsed ? "text-accent" : "text-ink-soft"} />
                    <div>
                      <div className="text-[13px] font-semibold text-ink">Compact View</div>
                      <div className="text-[11px] text-ink-soft">Icon-only mode</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </DashboardLayout>
  );
}

