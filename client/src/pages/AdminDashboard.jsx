import { useAuth } from "../context/AuthContext";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  return (
    <div style={{ padding: 40, fontFamily: "var(--font-body)" }}>
      <h1 style={{ fontFamily: "var(--font-display)" }}>Admin Dashboard</h1>
      <p>Signed in as {user?.name} ({user?.email})</p>
      <p style={{ color: "var(--on-desk-soft)" }}>
        Test management, question banks, and analytics will live here next.
      </p>
      <button
  className="w-full px-5 py-3 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 transition duration-200"
  onClick={logout}
   >
     Log out (Placement Cell Admin)
  </button>
    </div>
  );
}
