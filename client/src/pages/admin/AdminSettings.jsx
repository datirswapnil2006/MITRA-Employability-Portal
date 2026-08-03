import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { ADMIN_LINKS } from "./adminLinks";
import { Settings as SettingsIcon, User, Shield, Key, Palette, Check } from "lucide-react";

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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [saved, setSaved] = useState(false);

  // Profile
  const [name, setName] = useState(user?.name || "");
  const [email] = useState(user?.email || "");

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // System
  const [defaultDuration, setDefaultDuration] = useState(60);
  const [autoApprove, setAutoApprove] = useState(false);
  const [proctoringThreshold, setProctoringThreshold] = useState(5);

  // Theme
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    showSaved();
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    showSaved();
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSaveSystem = (e) => {
    e.preventDefault();
    showSaved();
  };

  const handleThemeChange = (t) => {
    setTheme(t);
    localStorage.setItem("theme", t);
    showSaved();
  };

  const tabs = [
    { key: "profile", label: "Profile", icon: User },
    { key: "security", label: "Security", icon: Shield },
    { key: "system", label: "System", icon: SettingsIcon },
    { key: "api", label: "API Keys", icon: Key },
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
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-blue-400 flex items-center justify-center text-white text-xl font-bold">
                    {name.charAt(0)?.toUpperCase() || "A"}
                  </div>
                  <div>
                    <div className="font-semibold text-ink">{name}</div>
                    <div className="text-[13px] text-ink-soft">{email}</div>
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
                <button type="submit" className={stampBtn}>Save Profile</button>
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
                <button type="submit" className={stampBtn}>Update Password</button>
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

          {activeTab === "api" && (
            <div className="bg-white border border-line rounded-xl p-6">
              <h2 className="font-display text-lg font-semibold mb-4">API Keys</h2>
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-[13px] text-ink">HuggingFace API</div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wide text-success bg-success/10 px-2 py-0.5 rounded-full">
                      <span className="text-[7px]">●</span> Connected
                    </span>
                  </div>
                  <div className="text-[12px] text-ink-soft font-mono">hf_****************************Lkjw</div>
                  <p className="text-[11px] text-ink-soft mt-2">
                    Used for AI question generation and PDF text extraction. Configured via server .env file.
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-[13px] text-ink">Online Compiler API</div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wide text-success bg-success/10 px-2 py-0.5 rounded-full">
                      <span className="text-[7px]">●</span> Connected
                    </span>
                  </div>
                  <div className="text-[12px] text-ink-soft font-mono">12f9****************************29d</div>
                  <p className="text-[11px] text-ink-soft mt-2">
                    Used for running code submissions against test cases. Configured via server .env file.
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-[13px] text-ink">SMTP (Email)</div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wide text-success bg-success/10 px-2 py-0.5 rounded-full">
                      <span className="text-[7px]">●</span> Configured
                    </span>
                  </div>
                  <div className="text-[12px] text-ink-soft font-mono">dati*****@gmail.com</div>
                  <p className="text-[11px] text-ink-soft mt-2">
                    Used for password reset emails. Configured via server .env file.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="bg-white border border-line rounded-xl p-6">
              <h2 className="font-display text-lg font-semibold mb-4">Appearance</h2>
              <p className="text-[13px] text-ink-soft mb-4">Choose your preferred theme.</p>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <button
                  onClick={() => handleThemeChange("light")}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    theme === "light" ? "border-accent bg-accent/5" : "border-line hover:border-accent/30"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-white border border-line mb-2" />
                  <div className="text-[13px] font-semibold text-ink">Light</div>
                  <div className="text-[11px] text-ink-soft">Clean and bright</div>
                </button>
                <button
                  onClick={() => handleThemeChange("dark")}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    theme === "dark" ? "border-accent bg-accent/5" : "border-line hover:border-accent/30"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 mb-2" />
                  <div className="text-[13px] font-semibold text-ink">Dark</div>
                  <div className="text-[11px] text-ink-soft">Easy on the eyes</div>
                </button>
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
