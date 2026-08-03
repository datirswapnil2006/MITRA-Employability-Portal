import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BRANCHES, YEARS, SECTIONS } from "../api/tests";
import Logo from "../components/common/Logo";
import {
  IdCard,
  User,
  Mail,
  Users,
  Calendar,
  BookOpen,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  ArrowRight,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

const initialState = {
  erpNumber: "",
  name: "",
  email: "",
  gender: "",
  branch: "",
  year: "",
  section: "",
  password: "",
};

export default function Register() {
  const [form, setForm] = useState(initialState);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const passwordChecks = {
    length: form.password.length >= 8,
    upper: /[A-Z]/.test(form.password),
    lower: /[a-z]/.test(form.password),
    numberOrSymbol: /[0-9!@#$%^&*(),.?":{}|<>_\-+=]/.test(form.password),
  };
  const passwordValid = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!passwordValid) {
      setError("Your password does not meet all security requirements below.");
      return;
    }

    if (form.password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.gender) delete payload.gender;
      await register(payload);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Check your ERP number and email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Background Shapes & Ambient Gradient Orbs */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.12),transparent)] pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Top Banner Notice */}
      <header className="relative z-10 w-full border-b border-slate-200/60 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md px-4 py-2 text-center text-xs text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2">
        <Sparkles size={14} className="text-amber-500 animate-pulse" />
        <span className="font-semibold text-slate-800 dark:text-slate-200">Student Portal Registration</span>
        <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
        <span className="hidden sm:inline font-mono text-[11px] text-blue-600 dark:text-blue-400 font-semibold">ERP Verified Accounts</span>
      </header>

      {/* Main Centered Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-[620px]">
          {/* Centered Logo & Branding Header */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-block hover:scale-105 transition-transform duration-200 mb-2">
              <Logo size="lg" showSubtitle={true} subtitleText="AI-Based Employability & Placement Assessment Portal" />
            </Link>
          </div>

          {/* Centered Registration Card (600px wide, 20px rounded) */}
          <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-6 sm:p-8">
            {submitted ? (
              /* Success Screen */
              <div className="text-center py-6 animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <CheckCircle2 size={36} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  🎉 Registration Submitted Successfully!
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto mb-6">
                  Your account has been submitted for approval. You will receive access after the Placement Cell Administrator approves your registration.
                </p>

                {/* Submitted Summary */}
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 text-left text-xs space-y-2 mb-6 font-sans">
                  <div className="flex justify-between"><span className="text-slate-500">Student Name:</span><span className="font-semibold text-slate-900 dark:text-white">{form.name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">ERP Number:</span><span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{form.erpNumber}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Department:</span><span className="font-semibold text-slate-900 dark:text-white">{form.branch}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Academic Year / Section:</span><span className="font-semibold text-slate-900 dark:text-white">{form.year} / Section {form.section}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Status:</span><span className="font-bold text-amber-600 dark:text-amber-400 uppercase">Pending Approval</span></div>
                </div>

                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/25 transition-all"
                >
                  Return to Login <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              /* Registration Form */
              <div>
                {/* Form Header */}
                <div className="text-center mb-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1 block">
                    Welcome to
                  </span>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">
                    MITRA Employability Portal
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Create your student account to begin your placement preparation journey.
                  </p>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 text-xs p-3.5 rounded-2xl mb-5 flex items-start gap-2.5 animate-fadeIn">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Two Column Grid on Desktop, Single Column on Mobile */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          required
                          value={form.name}
                          onChange={update("name")}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>
                    </div>

                    {/* ERP Number */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        ERP Number *
                      </label>
                      <div className="relative">
                        <IdCard size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          required
                          value={form.erpNumber}
                          onChange={update("erpNumber")}
                          placeholder="e.g. 2024CSE101"
                          className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                        />
                      </div>
                    </div>

                    {/* Email Address */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={update("email")}
                          placeholder="student@college.edu"
                          className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>
                    </div>

                    {/* Branch */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Branch / Department *
                      </label>
                      <div className="relative">
                        <BookOpen size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select
                          required
                          value={form.branch}
                          onChange={update("branch")}
                          className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600 dark:focus:border-blue-500 transition-all font-medium"
                        >
                          <option value="">Select Branch</option>
                          {BRANCHES.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Academic Year */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Academic Year *
                      </label>
                      <div className="relative">
                        <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select
                          required
                          value={form.year}
                          onChange={update("year")}
                          className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600 dark:focus:border-blue-500 transition-all font-medium"
                        >
                          <option value="">Select Year</option>
                          {YEARS.map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Section & Gender */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Section *
                      </label>
                      <div className="relative">
                        <Users size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select
                          required
                          value={form.section}
                          onChange={update("section")}
                          className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600 dark:focus:border-blue-500 transition-all font-medium"
                        >
                          <option value="">Select Section</option>
                          {SECTIONS.map((s) => (
                            <option key={s} value={s}>Section {s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Password & Confirm Password Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Password */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Password *
                      </label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={form.password}
                          onChange={update("password")}
                          placeholder="Min 8 characters"
                          className="w-full pl-9 pr-10 py-2.5 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type={showConfirm ? "text" : "password"}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat password"
                          className="w-full pl-9 pr-10 py-2.5 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                        >
                          {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Password Strength Checklist */}
                  {form.password && (
                    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-3 text-xs space-y-1.5 animate-fadeIn">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">Password Requirements:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                        <div className={`flex items-center gap-1.5 ${passwordChecks.length ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-400"}`}>
                          {passwordChecks.length ? <Check size={13} /> : <X size={13} />} Minimum 8 characters
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordChecks.upper ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-400"}`}>
                          {passwordChecks.upper ? <Check size={13} /> : <X size={13} />} One uppercase letter
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordChecks.lower ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-400"}`}>
                          {passwordChecks.lower ? <Check size={13} /> : <X size={13} />} One lowercase letter
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordChecks.numberOrSymbol ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-400"}`}>
                          {passwordChecks.numberOrSymbol ? <Check size={13} /> : <X size={13} />} One number or special character
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Full-width Blue Create Account Button */}
                  <button
                    type="submit"
                    disabled={loading || !passwordValid}
                    className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 text-xs mt-3"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating Account…
                      </span>
                    ) : (
                      <>
                        <UserPlus size={16} />
                        Create Account
                      </>
                    )}
                  </button>
                </form>

                {/* Sign In Link Prompt */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Already have an account?{" "}
                    <Link to="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                      Sign In
                    </Link>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="relative z-10 border-t border-slate-200/60 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        &copy; {new Date().getFullYear()} MITRA Employability Portal • AI-Based Employability & Placement Assessment Portal • Version 2.4
      </footer>
    </div>
  );
}
