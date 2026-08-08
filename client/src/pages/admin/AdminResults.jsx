import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { listTests, getLeaderboard, getOverview, BRANCHES } from "../../api/tests";
import { getPlacementAnalytics } from "../../api/admin";
import { ADMIN_LINKS } from "./adminLinks";
import { Award, Clock, Users, CheckCircle, BarChart2 } from "lucide-react";

const input =
  "w-full px-3 py-2.5 border-[1.5px] border-line rounded bg-white text-sm text-ink outline-none focus:border-accent transition-colors";
const label = "block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5";
const th = "text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-soft bg-slate-100 px-4 py-3 border-b border-line";
const td = "px-4 py-3.5 border-b border-slate-100 text-[13.5px]";

export default function AdminResults() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState("");
  const [selectedTestObj, setSelectedTestObj] = useState(null);
  const [branch, setBranch] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [placementAnalytics, setPlacementAnalytics] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [boardLoading, setBoardLoading] = useState(false);

  useEffect(() => {
    Promise.all([listTests(), getOverview()]).then(([t, ov]) => {
      setTests(t);
      setOverview(ov);
      if (t.length) {
        setSelectedTestId(t[0]._id);
        setSelectedTestObj(t[0]);
      }
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedTestId) return;
    const currentT = tests.find((x) => x._id === selectedTestId);
    setSelectedTestObj(currentT || null);

    setBoardLoading(true);

    if (currentT?.testType === "placement") {
      getPlacementAnalytics(selectedTestId)
        .then(setPlacementAnalytics)
        .catch(() => setPlacementAnalytics(null));

      getLeaderboard(selectedTestId, branch)
        .then(setLeaderboard)
        .finally(() => setBoardLoading(false));
    } else {
      setPlacementAnalytics(null);
      getLeaderboard(selectedTestId, branch)
        .then(setLeaderboard)
        .finally(() => setBoardLoading(false));
    }
  }, [selectedTestId, branch, tests]);

  return (
    <DashboardLayout active="results" links={ADMIN_LINKS} onNavigate={(k) => navigate(k === "overview" ? "/admin" : `/admin/${k}`)}>
      <div className="mb-7">
        <h1 className="font-display text-[26px] mb-1">Results & Placement Analytics</h1>
        <p className="text-ink-soft text-[13.5px] m-0">
          Monitor performance, section-wise accuracy, pass rates, and student leaderboards.
        </p>
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
                {tests.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.title} {t.testType === "placement" ? "(Placement)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="max-w-[220px] flex-1 min-w-[180px]">
              <label className={label}>Branch Filter</label>
              <select className={input} value={branch} onChange={(e) => setBranch(e.target.value)}>
                <option value="">All Branches</option>
                {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          {/* Official Placement Test Analytics Summary Cards */}
          {placementAnalytics && (
            <div className="mb-8 space-y-6">
              <div className="bg-white border border-line rounded-xl p-5 shadow-sm">
                <h3 className="font-display text-lg font-bold text-ink mb-4 flex items-center gap-2">
                  <BarChart2 size={20} className="text-accent" /> Official Placement Performance Overview
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-xs text-ink-soft flex items-center gap-1.5"><Users size={14} /> Total Attempts</div>
                    <div className="text-2xl font-bold text-ink mt-1">{placementAnalytics.summary?.totalAttempts || 0}</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-xs text-ink-soft flex items-center gap-1.5"><CheckCircle size={14} /> Pass Rate</div>
                    <div className="text-2xl font-bold text-emerald-600 mt-1">{placementAnalytics.summary?.passRate || 0}%</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-xs text-ink-soft flex items-center gap-1.5"><Award size={14} /> Avg Score</div>
                    <div className="text-2xl font-bold text-accent mt-1">
                      {placementAnalytics.summary?.avgScore || 0} / {placementAnalytics.test?.totalMarks || 0}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-xs text-ink-soft flex items-center gap-1.5"><Clock size={14} /> Avg Time Taken</div>
                    <div className="text-2xl font-bold text-ink mt-1">
                      {Math.round((placementAnalytics.summary?.avgTimeSeconds || 0) / 60)} min
                    </div>
                  </div>
                </div>

                {/* Section Performance Breakdown */}
                {placementAnalytics.sectionPerformance && placementAnalytics.sectionPerformance.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-xs text-ink-soft uppercase tracking-wide mb-3">Section-wise Performance Breakdown</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {placementAnalytics.sectionPerformance.map((sec) => (
                        <div key={sec.sectionId} className="border border-line rounded-xl p-3.5 bg-slate-50/50">
                          <div className="text-xs font-bold text-ink mb-1">{sec.name}</div>
                          <div className="text-xs text-ink-soft mb-2">Topic: {sec.topic || "General"}</div>
                          <div className="w-full bg-slate-200 rounded-full h-2 mb-2 overflow-hidden">
                            <div
                              className="bg-accent h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(100, sec.avgPercentage || 0)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-ink-soft">Avg: {sec.avgScore} / {sec.maxMarks}m</span>
                            <span className="text-accent">{sec.avgPercentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {boardLoading ? (
            <p>Loading leaderboard…</p>
          ) : leaderboard.length === 0 ? (
            <div className="bg-white border border-line rounded text-center py-12 text-ink-soft">
              No submissions{branch ? ` from ${branch}` : ""} for this test yet.
            </div>
          ) : (
            <div className="bg-white border border-line rounded-xl overflow-hidden shadow-sm">
              <table className="w-full border-collapse">
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
                      <td className={td}><strong>{row.totalScore}</strong> / {row.maxScore}</td>
                      <td className={td}>
                        <span className={`font-semibold ${row.percent >= 50 ? "text-emerald-600" : "text-amber-600"}`}>
                          {row.percent}%
                        </span>
                      </td>
                      <td className={td}>{row.submittedAt ? new Date(row.submittedAt).toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
