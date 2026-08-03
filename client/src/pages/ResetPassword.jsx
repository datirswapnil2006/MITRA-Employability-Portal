import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Lock, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { resetPassword } from "../api/auth";

const fieldLabel = "block text-sm font-semibold text-ink mb-1.5";
const iconInput =
  "w-full pl-10 pr-10 py-2.5 border-[1.5px] border-line rounded-lg bg-white text-sm text-ink outline-none focus:border-accent transition-colors";
const inputIcon = "absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const passwordChecks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    numberOrSymbol: /[0-9!@#$%^&*(),.?":{}|<>_\-+=]/.test(password),
  };
  const passwordValid = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!passwordValid) {
      setError("Your password doesn't meet all the requirements below.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || "Could not reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-desk bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),radial-gradient(ellipse_900px_600px_at_50%_0%,rgba(37,99,235,0.25),transparent_60%)] bg-[length:40px_40px,40px_40px,auto]">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
          <KeyRound size={22} className="text-accent" />
        </div>

        {done ? (
          <>
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <ShieldCheck size={22} className="text-success" />
            </div>
            <h1 className="font-display text-xl font-bold text-ink mb-2">Password reset</h1>
            <p className="text-ink-soft text-sm leading-relaxed mb-7">
              Your password has been changed. You can now sign in with your new password.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3 bg-gradient-to-r from-accent to-purple-600 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Go to sign in
            </button>
          </>
        ) : (
          <>
            <h1 className="font-display text-xl font-bold text-ink mb-1">Set a new password</h1>
            <p className="text-ink-soft text-sm mb-6">Choose a new password for your account.</p>

            {error && (
              <div className="bg-danger/10 border border-danger/30 text-danger text-[13px] px-3.5 py-2.5 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={fieldLabel} htmlFor="password">New Password</label>
                <div className="relative">
                  <Lock size={16} className={inputIcon} />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    required
                    className={iconInput}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className={fieldLabel} htmlFor="confirmPassword">Confirm New Password</label>
                <div className="relative">
                  <Lock size={16} className={inputIcon} />
                  <input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    className={iconInput}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="bg-accent/5 border border-accent/20 rounded-lg px-4 py-3.5">
                <div className="font-semibold text-ink text-[13px] mb-1.5">Password must contain:</div>
                <ul className="space-y-1 text-[13px]">
                  {[
                    ["length", "At least 8 characters"],
                    ["upper", "One uppercase letter"],
                    ["lower", "One lowercase letter"],
                    ["numberOrSymbol", "One number or special character"],
                  ].map(([key, text]) => (
                    <li
                      key={key}
                      className={`flex items-center gap-1.5 ${passwordChecks[key] ? "text-accent" : "text-ink-soft"}`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] shrink-0 ${
                          passwordChecks[key] ? "bg-accent text-white" : "bg-ink-soft/20 text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                      {text}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-accent to-purple-600 text-white rounded-lg font-semibold text-sm hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
              >
                {loading ? "Resetting…" : "Reset Password"}
              </button>
            </form>

            <p className="text-center text-sm text-ink-soft mt-6">
              <Link to="/login" className="font-semibold text-accent">Back to sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
