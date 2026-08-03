import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { updateStudentProfile } from "../../api/student";
import { STUDENT_LINKS } from "./studentLinks";
import { User, Shield, Check, Lock } from "lucide-react";

export default function StudentProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || "");
  const [gender, setGender] = useState(user?.gender || "Male");
  const [section, setSection] = useState(user?.section || "A");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await updateStudentProfile({
        name,
        gender,
        section,
        password: password || undefined,
      });
      setSaved(true);
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      active="profile"
      links={STUDENT_LINKS}
      onNavigate={(k) => navigate(k === "tests" ? "/student" : `/student/${k}`)}
    >
      <div className="mb-7">
        <div className="flex items-center gap-2.5 mb-1">
          <User size={24} className="text-accent" />
          <h1 className="font-display text-[26px] font-bold">My Profile</h1>
        </div>
        <p className="text-ink-soft text-[13.5px]">
          Your registered student credential details and account security settings.
        </p>
      </div>

      {saved && (
        <div className="bg-success/10 border border-success/30 text-success text-[13.5px] px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
          <Check size={16} /> Profile updated successfully!
        </div>
      )}

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger text-[13.5px] px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Hall Ticket Card */}
        <div className="bg-white border border-line rounded-xl p-6 shadow-sm flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-blue-400 text-white font-bold text-2xl flex items-center justify-center mb-4 shadow-md shadow-accent/20">
            {user?.name?.charAt(0)?.toUpperCase() || "S"}
          </div>

          <h2 className="font-display text-lg font-bold text-ink">{user?.name}</h2>
          <div className="font-mono text-[12px] text-accent font-semibold mb-2">{user?.erpNumber || "ERP: —"}</div>

          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wide uppercase px-3 py-1 rounded-full bg-success/10 text-success font-semibold mb-6">
            <Shield size={12} /> Approved Student
          </span>

          <div className="w-full text-left space-y-3 pt-4 border-t border-line text-[13px]">
            <div className="flex justify-between">
              <span className="text-ink-soft">Department:</span>
              <span className="font-semibold text-ink">{user?.branch || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-soft">Academic Year:</span>
              <span className="font-semibold text-ink">{user?.year || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-soft">Section:</span>
              <span className="font-semibold text-ink">{user?.section || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-soft">Email:</span>
              <span className="font-semibold text-ink truncate max-w-[170px]">{user?.email}</span>
            </div>
          </div>
        </div>

        {/* Edit Profile & Password Form */}
        <div className="lg:col-span-2 bg-white border border-line rounded-xl p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-ink mb-5">Update Information</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5">
                Full Name
              </label>
              <input
                className="w-full px-3.5 py-2.5 border-[1.5px] border-line rounded-lg bg-white text-sm text-ink outline-none focus:border-accent transition-colors"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5">
                  Gender
                </label>
                <select
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-line rounded-lg bg-white text-sm text-ink outline-none focus:border-accent transition-colors"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5">
                  Section
                </label>
                <select
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-line rounded-lg bg-white text-sm text-ink outline-none focus:border-accent transition-colors"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-line">
              <h3 className="font-display text-base font-bold text-ink mb-3 flex items-center gap-2">
                <Lock size={16} className="text-accent" /> Change Password (Optional)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-line rounded-lg bg-white text-sm text-ink outline-none focus:border-accent transition-colors"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-line rounded-lg bg-white text-sm text-ink outline-none focus:border-accent transition-colors"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-accent text-white rounded-lg px-6 py-2.5 font-semibold text-[13.5px] hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                {saving ? "Saving Changes…" : "Save Profile Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
