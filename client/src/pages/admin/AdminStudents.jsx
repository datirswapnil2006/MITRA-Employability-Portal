import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { getAllStudents } from "../../api/tests";
import { ADMIN_LINKS } from "./adminLinks";

const ghostBtn = "border-[1.5px] border-line rounded px-4 py-2 font-semibold text-[13px] text-ink hover:border-accent transition-colors";
const th = "text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-soft bg-slate-100 px-4 py-3 border-b border-line";
const td = "px-4 py-3.5 border-b border-slate-100 text-[13.5px]";

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getAllStudents().then(setStudents).finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout active="students" links={ADMIN_LINKS} onNavigate={(k) => navigate(k === "overview" ? "/admin" : `/admin/${k}`)}>
      <div className="mb-7">
        <h1 className="font-display text-[26px] mb-1">Students</h1>
        <p className="text-ink-soft text-[13.5px] m-0">Every registered student, with a quick read on tests taken and average performance.</p>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : students.length === 0 ? (
        <div className="bg-white border border-line rounded text-center py-12 text-ink-soft">No students have registered yet.</div>
      ) : (
        <table className="w-full border-collapse bg-white rounded overflow-hidden shadow-sm">
          <thead>
            <tr>
              {["Name", "ERP Number", "Branch", "Year / Section", "Tests Taken", "Avg. Score", ""].map((h) => (
                <th key={h} className={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s._id} className="hover:bg-slate-50">
                <td className={td}>
                  <strong>{s.name}</strong><br />
                  <span className="text-ink-soft text-xs">{s.email}</span>
                </td>
                <td className={`${td} font-mono`}>{s.erpNumber}</td>
                <td className={td}>{s.branch}</td>
                <td className={td}>{s.year} / {s.section}</td>
                <td className={td}>{s.testsTaken}</td>
                <td className={td}>{s.averagePercent !== null ? `${s.averagePercent}%` : "—"}</td>
                <td className={td}>
                  <button className={ghostBtn} onClick={() => navigate(`/admin/students/${s._id}`)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </DashboardLayout>
  );
}
