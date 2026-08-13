import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function ProtectedRoute({ role, children }) {
  const { user, logout } = useAuth();
  // "checking" | "valid" | "invalid" — starts fresh on every mount, which is
  // exactly what happens when the browser restores a page via back/forward
  // navigation (including from the bfcache), so a stale session can never
  // silently render protected content without a fresh server-side check.
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setStatus("invalid");
      return;
    }

    api
      .get("/auth/me")
      .then(({ data }) => {
        if (cancelled) return;
        if (role && data.user.role !== role) {
          setStatus("invalid");
        } else {
          setStatus("valid");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.response?.status === 401) {
          logout();
          setStatus("invalid");
        } else {
          setStatus(user ? "valid" : "invalid");
        }
      });

    return () => {
      cancelled = true;
    };
    // Re-verify every time this route mounts (e.g. navigating back to it).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Independent of the one-time mount check above: if the user is ever null
  // at render time — most commonly right after clicking "Log out" — bail out
  // immediately instead of trusting a stale "valid" status from earlier.
  if (!user) return <Navigate to="/login" replace />;

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-desk text-on-desk-soft text-sm">
        Verifying session…
      </div>
    );
  }

  if (status === "invalid") return <Navigate to="/login" replace />;

  return children;
}