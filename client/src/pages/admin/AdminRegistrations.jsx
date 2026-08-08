import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { getRegistrations, approveRegistration, rejectRegistration, BRANCHES } from "../../api/tests";
import { ADMIN_LINKS } from "./adminLinks";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const stampBtn = "bg-accent text-white rounded px-4.5 py-2.5 font-semibold text-[13.5px] hover:bg-accent-hover transition-colors";
const dangerBtn = "border-[1.5px] border-danger/40 text-danger rounded px-3.5 py-2 font-semibold text-xs hover:bg-danger/10 transition-colors";
const th = "text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-soft bg-slate-100 px-4 py-3 border-b border-line";
const td = "px-4 py-3.5 border-b border-slate-100 text-[13.5px]";
const selectCls =
  "px-3 py-2 border-[1.5px] border-line rounded bg-white text-sm text-ink outline-none focus:border-accent transition-colors";

export default function AdminRegistrations() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("approved");
  const [branch, setBranch] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = (status, branchFilter) => {
    setLoading(true);
    getRegistrations(status, branchFilter).then(setStudents).finally(() => setLoading(false));
  };

  useEffect(() => { load(tab, branch); }, [tab, branch]);

  const handleApprove = async (id) => {
    await approveRegistration(id);
    setStudents((s) => s.filter((x) => x._id !== id));
  };

  const handleReject = async (id) => {
    if (!window.confirm("Reject this registration?")) return;
    await rejectRegistration(id);
    setStudents((s) => s.filter((x) => x._id !== id));
  };

  return (
    <DashboardLayout active="registrations" links={ADMIN_LINKS} onNavigate={(k) => navigate(k === "overview" ? "/admin" : `/admin/${k}`)}>
      <div className="mb-7">
        <h1 className="font-display text-[26px] mb-1">Registrations</h1>
        <p className="text-ink-soft text-[13.5px] m-0">Every student submits once. Approve to let them log in, or reject with no account created.</p>
      </div>

      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 border-[1.5px] rounded text-[13px] font-semibold transition-colors ${
                tab === t.key ? "border-accent text-ink bg-accent/5" : "border-line text-ink-soft"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <select className={selectCls} value={branch} onChange={(e) => setBranch(e.target.value)}>
          <option value="">All Branches</option>
          {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : students.length === 0 ? (
        <div className="bg-white border border-line rounded text-center py-12 text-ink-soft">
          No {tab} registrations{branch ? ` in ${branch}` : ""}.
        </div>
      ) : (
        <table className="w-full border-collapse bg-white rounded overflow-hidden shadow-sm">
          <thead>
            <tr>
              {["Name", "ERP Number", "Email", "Branch", "Year / Section", "Submitted", tab === "pending" ? "" : null]
                .filter((h) => h !== null)
                .map((h) => <th key={h} className={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s._id} className="hover:bg-slate-50">
                <td className={td}><strong>{s.name}</strong></td>
                <td className={`${td} font-mono`}>{s.erpNumber}</td>
                <td className={td}>{s.email}</td>
                <td className={td}>{s.branch}</td>
                <td className={td}>{s.year} / {s.section}</td>
                <td className={td}>{new Date(s.createdAt).toLocaleDateString()}</td>
                {tab === "pending" && (
                  <td className={td}>
                    <div className="flex gap-2 justify-end">
                      <button className={stampBtn} onClick={() => handleApprove(s._id)}>Approve</button>
                      <button className={dangerBtn} onClick={() => handleReject(s._id)}>Reject</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </DashboardLayout>
  );
}
