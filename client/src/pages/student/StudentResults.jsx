import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { getMyAttempts } from "../../api/student";
import { STUDENT_LINKS } from "./studentLinks";
import { Award, ArrowRight } from "lucide-react";

export default function StudentResults() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getMyAttempts()
      .then((data) => setAttempts(data.filter((a) => a.status === "submitted")))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout
      active="results"
      links={STUDENT_LINKS}
      onNavigate={(k) => navigate(k === "tests" ? "/student" : `/student/${k}`)}
    >
      <div className="mb-7">
        <div className="flex items-center gap-2.5 mb-1">
          <Award size={24} className="text-accent" />
          <h1 className="font-display text-[26px] font-bold">My Results</h1>
        </div>
        <p className="text-ink-soft text-[13.5px]">
          History of all completed tests and practice assessments with detailed score breakdowns.
        </p>
      </div>

      {loading ? (
        <div className="bg-white border border-line rounded-xl p-12 text-center">
          <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-ink-soft text-[13px]">Loading results…</p>
        </div>
      ) : attempts.length === 0 ? (
        <div className="bg-white border border-line rounded-xl text-center py-12 text-ink-soft">
          <Award size={36} className="mx-auto text-ink-soft/40 mb-3" />
          <p className="text-[14px]">You haven't submitted any test attempts yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-line rounded-xl overflow-hidden shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Test Title", "Category", "Score", "Percentage", "Submitted Date", ""].map((h) => (
                  <th key={h} className="text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-soft bg-slate-100 px-5 py-3.5 border-b border-line">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => {
                const percent = a.maxScore ? Math.round((a.totalScore / a.maxScore) * 100) : 0;

                return (
                  <tr key={a._id} className="hover:bg-slate-50 border-b border-slate-100">
                    <td className="px-5 py-4 text-[13.5px]">
                      <strong>{a.test?.title || "Test"}</strong>
                      {a.test?.isPractice && (
                        <span className="ml-2 font-mono text-[10px] uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          Practice
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[13.5px] text-ink-soft">
                      {a.test?.category || "—"}
                    </td>
                    <td className="px-5 py-4 text-[13.5px] font-semibold text-ink">
                      {a.totalScore} / {a.maxScore}
                    </td>
                    <td className="px-5 py-4 text-[13.5px]">
                      <span className={`inline-flex items-center font-semibold px-2.5 py-0.5 rounded text-[12px] ${
                        percent >= 75 ? "bg-emerald-100 text-emerald-700" :
                        percent >= 50 ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {percent}%
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[13px] text-ink-soft">
                      {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-4 text-[13.5px] text-right">
                      <button
                        onClick={() => navigate(`/student/result/${a._id}`)}
                        className="text-accent hover:underline font-semibold text-[13px] inline-flex items-center gap-1"
                      >
                        View Breakdown <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
