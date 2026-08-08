import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { getMyAttempts } from "../../api/student";
import { STUDENT_LINKS } from "./studentLinks";
import { BarChart2, TrendingUp, Award, CheckCircle, Target } from "lucide-react";

export default function StudentAnalytics({ embedded = false }) {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getMyAttempts()
      .then((data) => setAttempts(data.filter((a) => a.status === "submitted")))
      .finally(() => setLoading(false));
  }, []);

  // Compute metrics
  const totalCompleted = attempts.length;
  const totalScoreSum = attempts.reduce((acc, a) => acc + (a.totalScore || 0), 0);
  const totalMaxSum = attempts.reduce((acc, a) => acc + (a.maxScore || 0), 0);
  const overallPercent = totalMaxSum ? Math.round((totalScoreSum / totalMaxSum) * 100) : 0;
  const highestPercent = attempts.length > 0
    ? Math.max(...attempts.map((a) => (a.maxScore ? Math.round((a.totalScore / a.maxScore) * 100) : 0)))
    : 0;

  // Category breakdown
  const categoryStats = {};
  attempts.forEach((a) => {
    const cat = a.test?.category || "General";
    if (!categoryStats[cat]) {
      categoryStats[cat] = { totalScore: 0, maxScore: 0, count: 0 };
    }
    categoryStats[cat].totalScore += a.totalScore || 0;
    categoryStats[cat].maxScore += a.maxScore || 0;
    categoryStats[cat].count += 1;
  });

  const mainContent = (
    <>
      <div className="mb-7">
        <div className="flex items-center gap-2.5 mb-1">
          <BarChart2 size={24} className="text-accent" />
          <h1 className="font-display text-[26px] font-bold">Performance Analytics</h1>
        </div>
        <p className="text-ink-soft text-[13.5px]">
          Track your placement preparedness, topic strengths, and test score trends over time.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-line rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-24 mb-3" />
              <div className="h-8 bg-slate-200 rounded w-16" />
            </div>
          ))}
        </div>
      ) : attempts.length === 0 ? (
        <div className="bg-white border border-line rounded-xl text-center py-12 text-ink-soft">
          <BarChart2 size={36} className="mx-auto text-ink-soft/40 mb-3" />
          <p className="text-[14px]">No test analytics available yet. Complete tests to unlock performance insights.</p>
        </div>
      ) : (
        <>
          {/* Key Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5 mb-8">
            <div className="bg-white border border-line rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wide">Tests Completed</span>
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <CheckCircle size={16} />
                </div>
              </div>
              <div className="font-display text-[28px] font-bold text-ink">{totalCompleted}</div>
            </div>

            <div className="bg-white border border-line rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wide">Overall Average</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <TrendingUp size={16} />
                </div>
              </div>
              <div className="font-display text-[28px] font-bold text-ink">{overallPercent}%</div>
            </div>

            <div className="bg-white border border-line rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wide">Highest Score</span>
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Award size={16} />
                </div>
              </div>
              <div className="font-display text-[28px] font-bold text-ink">{highestPercent}%</div>
            </div>

            <div className="bg-white border border-line rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wide">Topics Evaluated</span>
                <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
                  <Target size={16} />
                </div>
              </div>
              <div className="font-display text-[28px] font-bold text-ink">{Object.keys(categoryStats).length}</div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white border border-line rounded-xl p-6 mb-8">
            <h2 className="font-display text-lg font-bold text-ink mb-4">Topic-wise Mastery Breakdown</h2>
            <div className="space-y-4">
              {Object.entries(categoryStats).map(([cat, stats]) => {
                const catPercent = stats.maxScore ? Math.round((stats.totalScore / stats.maxScore) * 100) : 0;

                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-[13px] font-medium mb-1.5">
                      <span className="text-ink font-semibold">{cat}</span>
                      <span className="text-ink-soft">{stats.totalScore} / {stats.maxScore} ({catPercent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          catPercent >= 75 ? "bg-emerald-500" :
                          catPercent >= 50 ? "bg-accent" :
                          "bg-amber-500"
                        }`}
                        style={{ width: `${catPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Attempts Score History */}
          <div className="bg-white border border-line rounded-xl p-6">
            <h2 className="font-display text-lg font-bold text-ink mb-4">Recent Test Performance History</h2>
            <div className="divide-y divide-slate-100">
              {attempts.slice(0, 5).map((a) => {
                const percent = a.maxScore ? Math.round((a.totalScore / a.maxScore) * 100) : 0;

                return (
                  <div key={a._id} className="py-3.5 flex items-center justify-between">
                    <div>
                      <div className="text-[14px] font-semibold text-ink">{a.test?.title || "Assessment"}</div>
                      <div className="text-[12px] text-ink-soft">{a.test?.category} · {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : ""}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[14px] font-bold text-ink">{a.totalScore} / {a.maxScore}</div>
                      <div className={`text-[12px] font-semibold ${percent >= 60 ? "text-success" : "text-amber-600"}`}>
                        {percent}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );

  if (embedded) return mainContent;

  return (
    <DashboardLayout
      active="results"
      links={STUDENT_LINKS}
      onNavigate={(path) => navigate(path)}
    >
      {mainContent}
    </DashboardLayout>
  );
}
