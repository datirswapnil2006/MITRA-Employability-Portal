import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ShieldCheck, KeyRound } from "lucide-react";
import { requestPasswordReset } from "../api/auth";

const fieldLabel = "block text-sm font-semibold text-ink mb-1.5";
const iconInput =
  "w-full pl-10 pr-3 py-2.5 border-[1.5px] border-line rounded-lg bg-white text-sm text-ink outline-none focus:border-accent transition-colors";
const inputIcon = "absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Try again.");
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

        {submitted ? (
          <>
            <h1 className="font-display text-xl font-bold text-ink mb-2">Check your email</h1>
            <p className="text-ink-soft text-sm leading-relaxed mb-7">
              If an account exists for <strong>{email}</strong>, we've sent a link to reset your password.
              It's valid for 1 hour.
            </p>
            <Link
              to="/login"
              className="block text-center w-full py-3 bg-gradient-to-r from-accent to-purple-600 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <h1 className="font-display text-xl font-bold text-ink mb-1">Forgot your password?</h1>
            <p className="text-ink-soft text-sm mb-6">
              Enter your account email and we'll send you a link to reset it.
            </p>

            {error && (
              <div className="bg-danger/10 border border-danger/30 text-danger text-[13px] px-3.5 py-2.5 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={fieldLabel} htmlFor="email">Email</label>
                <div className="relative">
                  <Mail size={16} className={inputIcon} />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@college.edu"
                    required
                    className={iconInput}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-accent to-purple-600 text-white rounded-lg font-semibold text-sm hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>

            <p className="text-center text-sm text-ink-soft mt-6 flex items-center justify-center gap-1.5">
              <ShieldCheck size={14} className="text-accent" />
              <Link to="/login" className="font-semibold text-accent">Back to sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
