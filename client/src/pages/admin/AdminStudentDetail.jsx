import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { getStudentDetail } from "../../api/tests";
import { ADMIN_LINKS } from "./adminLinks";

const ghostBtn = "border-[1.5px] border-line rounded px-4 py-2 font-semibold text-[13px] text-ink hover:border-accent transition-colors";
const th = "text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-soft bg-slate-100 px-4 py-3 border-b border-line";
const td = "px-4 py-3.5 border-b border-slate-100 text-[13.5px]";

export default function AdminStudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentDetail(id).then(setData).finally(() => setLoading(false));
  }, [id]);

  return (
    <DashboardLayout active="students" links={ADMIN_LINKS} onNavigate={(k) => navigate(k === "overview" ? "/admin" : `/admin/${k}`)}>
      <button className={`${ghostBtn} mb-5`} onClick={() => navigate("/admin/students")}>
        ← Back to students
      </button>

      {loading ? (
        <p>Loading…</p>
      ) : !data ? (
        <div className="bg-white border border-line rounded text-center py-12 text-ink-soft">Student not found.</div>
      ) : (
        <>
          <div className="mb-7">
            <h1 className="font-display text-[26px] mb-1">{data.student.name}</h1>
            <p className="text-ink-soft text-[13.5px] m-0">
              {data.student.erpNumber} &middot; {data.student.email} &middot; {data.student.branch}{" "}
              &middot; {data.student.year} / {data.student.section}
            </p>
          </div>

          {data.attempts.length === 0 ? (
            <div className="bg-white border border-line rounded text-center py-12 text-ink-soft">This student hasn't attempted any tests yet.</div>
          ) : (
            <table className="w-full border-collapse bg-white rounded overflow-hidden shadow-sm">
              <thead>
                <tr>
                  {["Test", "Category", "Status", "Score", "Percent", "Submitted"].map((h) => (
                    <th key={h} className={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.attempts.map((a) => (
                  <tr key={a._id} className="hover:bg-slate-50">
                    <td className={td}><strong>{a.test?.title}</strong></td>
                    <td className={td}>{a.test?.category}</td>
                    <td className={td}>
                      <span
                        className={`inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wide uppercase px-2.5 py-1 rounded-full ${
                          a.status === "submitted" ? "bg-success/10 text-success" : "bg-ink-soft/10 text-ink-soft"
                        }`}
                      >
                        <span className="text-[8px]">●</span>
                        {a.status}
                      </span>
                    </td>
                    <td className={td}>{a.totalScore} / {a.maxScore}</td>
                    <td className={td}>{a.maxScore ? Math.round((a.totalScore / a.maxScore) * 100) : 0}%</td>
                    <td className={td}>{a.submittedAt ? new Date(a.submittedAt).toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
