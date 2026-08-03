import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { listTests, getLeaderboard, getOverview, BRANCHES } from "../../api/tests";
import { ADMIN_LINKS } from "./adminLinks";

const input =
  "w-full px-3 py-2.5 border-[1.5px] border-line rounded bg-white text-sm text-ink outline-none focus:border-accent transition-colors";
const label = "block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5";
const th = "text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-soft bg-slate-100 px-4 py-3 border-b border-line";
const td = "px-4 py-3.5 border-b border-slate-100 text-[13.5px]";

export default function AdminResults() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState("");
  const [branch, setBranch] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [boardLoading, setBoardLoading] = useState(false);

  useEffect(() => {
    Promise.all([listTests(), getOverview()]).then(([t, ov]) => {
      setTests(t);
      setOverview(ov);
      if (t.length) setSelectedTestId(t[0]._id);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedTestId) return;
    setBoardLoading(true);
    getLeaderboard(selectedTestId, branch).then(setLeaderboard).finally(() => setBoardLoading(false));
  }, [selectedTestId, branch]);

  return (
    <DashboardLayout active="results" links={ADMIN_LINKS} onNavigate={(k) => navigate(k === "overview" ? "/admin" : `/admin/${k}`)}>
      <div className="mb-7">
        <h1 className="font-display text-[26px] mb-1">Results & Analytics</h1>
        <p className="text-ink-soft text-[13.5px] m-0">Rank-wise leaderboards per test, plus a quick pulse on overall placement readiness.</p>
      </div>

      {overview && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4.5 mb-7">
          <div className="bg-white border border-line rounded p-6">
            <div className="font-mono text-[10.5px] tracking-wide uppercase text-accent">Registered</div>
            <div className="font-display text-[32px] font-bold text-accent">{overview.totalStudents}</div>
            <div className="text-ink-soft text-[13px]">Students</div>
          </div>
          <div className="bg-white border border-line rounded p-6">
            <div className="font-mono text-[10.5px] tracking-wide uppercase text-accent">Completed</div>
            <div className="font-display text-[32px] font-bold text-accent">{overview.totalAttempts}</div>
            <div className="text-ink-soft text-[13px]">Test submissions</div>
          </div>
          <div className="bg-white border border-line rounded p-6">
            <div className="font-mono text-[10.5px] tracking-wide uppercase text-accent">Overall</div>
            <div className="font-display text-[32px] font-bold text-accent">
              {overview.averagePercent !== null ? `${overview.averagePercent}%` : "—"}
            </div>
            <div className="text-ink-soft text-[13px]">Average score</div>
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : tests.length === 0 ? (
        <div className="bg-white border border-line rounded text-center py-12 text-ink-soft">Create a test first to see results here.</div>
      ) : (
        <>
          <div className="flex flex-wrap gap-4 mb-5">
            <div className="max-w-[360px] flex-1 min-w-[220px]">
              <label className={label}>Test</label>
              <select className={input} value={selectedTestId} onChange={(e) => setSelectedTestId(e.target.value)}>
                {tests.map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
              </select>
            </div>
            <div className="max-w-[220px] flex-1 min-w-[180px]">
              <label className={label}>Branch</label>
              <select className={input} value={branch} onChange={(e) => setBranch(e.target.value)}>
                <option value="">All Branches</option>
                {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          {boardLoading ? (
            <p>Loading leaderboard…</p>
          ) : leaderboard.length === 0 ? (
            <div className="bg-white border border-line rounded text-center py-12 text-ink-soft">
              No submissions{branch ? ` from ${branch}` : ""} for this test yet.
            </div>
          ) : (
            <table className="w-full border-collapse bg-white rounded overflow-hidden shadow-sm">
              <thead>
                <tr>
                  {["Rank", "Student", "ERP Number", "Branch / Section", "Score", "Percent", "Submitted"].map((h) => (
                    <th key={h} className={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row) => (
                  <tr key={row.attemptId} className="hover:bg-slate-50">
                    <td className={td}><strong>#{row.rank}</strong></td>
                    <td className={td}>{row.student?.name}</td>
                    <td className={`${td} font-mono`}>{row.student?.erpNumber}</td>
                    <td className={td}>{row.student?.branch} / {row.student?.section}</td>
                    <td className={td}>{row.totalScore} / {row.maxScore}</td>
                    <td className={td}>{row.percent}%</td>
                    <td className={td}>{row.submittedAt ? new Date(row.submittedAt).toLocaleString() : "—"}</td>
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
