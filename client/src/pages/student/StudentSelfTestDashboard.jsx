import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { getStudentSelfTestDashboard, getBookmarks, generateSelfTest } from "../../api/selfTest";
import { STUDENT_LINKS } from "./studentLinks";
import {
  Trophy, Flame, Zap, Award, Target, Bookmark, Sparkles, Clock,
  ArrowRight, BarChart2, CheckCircle2, RefreshCw, BookOpen, Layers, Check,
  TrendingUp, TrendingDown, Minus, Play, ShieldAlert, Compass, Activity
} from "lucide-react";

export default function StudentSelfTestDashboard() {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [launchingRecommended, setLaunchingRecommended] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    Promise.all([getStudentSelfTestDashboard(), getBookmarks()])
      .then(([dash, bms]) => {
        setDashboardData(dash);
        setBookmarks(bms.bookmarks || (Array.isArray(bms) ? bms : []));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLaunchNextBestTest = async () => {
    const nextConfig = dashboardData?.recommendations?.nextBestTest?.suggestedConfig;
    if (!nextConfig) {
      navigate("/student/self-test");
      return;
    }

    setLaunchingRecommended(true);
    try {
      const res = await generateSelfTest(nextConfig);
      navigate(`/student/self-test/attempt/${res.attemptId}`);
    } catch (err) {
      navigate("/student/self-test");
    } finally {
      setLaunchingRecommended(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        active="self-test/hub"
        links={STUDENT_LINKS}
        onNavigate={(k) => navigate(k === "tests" ? "/student" : `/student/${k}`)}
      >
        <div className="p-16 text-center text-slate-500 animate-pulse font-mono text-xs">
          Loading Practice Hub & Rule-Based Recommendation Engine…
        </div>
      </DashboardLayout>
    );
  }

  const { stats, recommendations, recentAttempts } = dashboardData || {};

  const readinessScore = recommendations?.readinessScore ?? stats?.readinessScore ?? 0;
  const readinessTier = recommendations?.readinessTier || { title: "Needs Foundational Practice", color: "rose" };
  const accuracyTrend = recommendations?.accuracyTrend || "no_data";
  const timePaceIndex = recommendations?.timePaceIndex || "normal";
  const avgSecPerQuestion = recommendations?.avgSecPerQuestion || 45;
  const readinessBreakdown = recommendations?.readinessBreakdown || {
    topicAccuracyFactor: 0,
    timeEfficiencyFactor: 0,
    consistencyFactor: 0,
    difficultyFactor: 0,
  };

  return (
    <DashboardLayout
      active="self-test/hub"
      links={STUDENT_LINKS}
      onNavigate={(k) => navigate(k === "tests" ? "/student" : `/student/${k}`)}
    >
      {/* Header Banner */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white">
              <Trophy size={20} />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
              Practice Hub & AI Recommendations
            </h1>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm">
            Rule-based placement readiness index, next best test recommendations, accuracy trends, and study notes.
          </p>
        </div>

        <button
          onClick={() => navigate("/student/self-test")}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-2xl px-5 py-2.5 font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02]"
        >
          <Sparkles size={16} /> Custom Test Studio
        </button>
      </div>

      {/* Hero Recommendation Card: Next Best Test */}
      {recommendations?.nextBestTest && (
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 mb-8 shadow-xl border border-slate-800">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider">
                <Compass size={13} className="text-amber-400 animate-spin" /> AI Next Best Test Recommendation
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-white">
                {recommendations.nextBestTest.title}
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                {recommendations.nextBestTest.reason}
              </p>

              <div className="flex items-center gap-3 pt-2 text-xs text-indigo-300 font-mono">
                <span className="bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-500/30 font-bold">
                  {recommendations.nextBestTest.suggestedConfig?.difficulty} Difficulty
                </span>
                <span>&bull;</span>
                <span>{recommendations.nextBestTest.suggestedConfig?.questionCount} Questions</span>
                <span>&bull;</span>
                <span>{recommendations.nextBestTest.suggestedConfig?.durationMinutes} Mins</span>
              </div>
            </div>

            <button
              onClick={handleLaunchNextBestTest}
              disabled={launchingRecommended}
              className="self-start md:self-auto inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 px-6 py-3.5 rounded-2xl text-xs font-extrabold shadow-lg shadow-amber-500/20 transition-all shrink-0 disabled:opacity-50"
            >
              {launchingRecommended ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  Generating Test…
                </span>
              ) : (
                <>
                  <Play size={16} fill="currentColor" /> Launch Recommended Test
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Placement Readiness Score */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 text-white rounded-3xl p-6 shadow-xl shadow-indigo-600/15">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">
              Placement Readiness Index
            </span>
            <Target size={18} className="text-indigo-200" />
          </div>
          <div className="font-display text-4xl font-extrabold tracking-tight mb-2">
            {readinessScore}%
          </div>
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-md">
            {readinessTier.title}
          </span>
        </div>

        {/* Accuracy Trend Indicator */}
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-violet-700 to-purple-800 text-white rounded-3xl p-6 shadow-xl shadow-violet-600/15">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-violet-200">
              Accuracy Trend
            </span>
            {accuracyTrend === "improving" ? (
              <TrendingUp size={18} className="text-emerald-300" />
            ) : accuracyTrend === "declining" ? (
              <TrendingDown size={18} className="text-rose-300" />
            ) : (
              <Minus size={18} className="text-violet-200" />
            )}
          </div>
          <div className="font-display text-3xl font-extrabold tracking-tight mb-2 capitalize">
            {accuracyTrend === "improving" ? "📈 Improving" : accuracyTrend === "declining" ? "📉 Declining" : "➖ Steady"}
          </div>
          <p className="text-[11px] text-violet-200">Compared to historical average</p>
        </div>

        {/* Time Pace Efficiency */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white rounded-3xl p-6 shadow-xl shadow-amber-500/15">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-100">
              Time Pace Index
            </span>
            <Activity size={18} className="text-amber-100" />
          </div>
          <div className="font-display text-3xl font-extrabold tracking-tight mb-2">
            {avgSecPerQuestion}s / Q
          </div>
          <p className="text-[11px] text-amber-100 font-mono">
            {timePaceIndex === "fast" ? "⚡ Fast Pace (Check Accuracy)" : timePaceIndex === "slow" ? "🐢 Slow Pace (Build Speed)" : "🎯 Target Optimal Pace"}
          </p>
        </div>

        {/* Active Streak & Level */}
        <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 via-rose-600 to-red-600 text-white rounded-3xl p-6 shadow-xl shadow-rose-500/15">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-100">
              Streak & Practice Level
            </span>
            <Flame size={18} className="text-rose-100" />
          </div>
          <div className="font-display text-3xl font-extrabold tracking-tight mb-2">
            {stats?.streak?.currentStreak || 0} Days Streak
          </div>
          <p className="text-[11px] text-rose-100">Level {stats?.level || 1} &bull; {stats?.xp || 0} XP</p>
        </div>
      </div>

      {/* Tabs Control */}
      <div className="flex gap-2 mb-6 border-b border-slate-200/80 pb-3">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "overview"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Readiness Model & Topic Mastery
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "history"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Practice History ({recentAttempts?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("bookmarks")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "bookmarks"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Bookmarks & Notes ({bookmarks.length})
        </button>
      </div>

      {/* Tab 1: Readiness Model & Topic Mastery */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Readiness Score Component Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">Placement Readiness Factor Model</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rule-based breakdown evaluating your accuracy, solving speed, consistency, and problem difficulty.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3.5 text-center">
                  <div className="text-[10.5px] font-bold uppercase text-slate-500 mb-1">Accuracy (40%)</div>
                  <div className="text-xl font-extrabold text-indigo-600">{readinessBreakdown.topicAccuracyFactor} / 40</div>
                </div>

                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3.5 text-center">
                  <div className="text-[10.5px] font-bold uppercase text-slate-500 mb-1">Time Pace (25%)</div>
                  <div className="text-xl font-extrabold text-amber-600">{readinessBreakdown.timeEfficiencyFactor} / 25</div>
                </div>

                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3.5 text-center">
                  <div className="text-[10.5px] font-bold uppercase text-slate-500 mb-1">Consistency (20%)</div>
                  <div className="text-xl font-extrabold text-emerald-600">{readinessBreakdown.consistencyFactor} / 20</div>
                </div>

                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3.5 text-center">
                  <div className="text-[10.5px] font-bold uppercase text-slate-500 mb-1">Difficulty (15%)</div>
                  <div className="text-xl font-extrabold text-violet-600">{readinessBreakdown.difficultyFactor} / 15</div>
                </div>
              </div>
            </div>

            {/* Topic Mastery Progress Bars */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">Topic Mastery Breakdown</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calculated accuracy metrics per topic category across all your practice sessions.
                </p>
              </div>

              <div className="space-y-4">
                {stats?.topicStats && stats.topicStats.length > 0 ? (
                  stats.topicStats.map((ts) => (
                    <div key={ts.topic} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-800">{ts.topic}</span>
                        <span className="font-mono text-slate-500">
                          {ts.accuracy}% ({ts.totalCorrect}/{ts.totalAttempted} Qs)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            ts.accuracy >= 80
                              ? "bg-emerald-500"
                              : ts.accuracy >= 60
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                          style={{ width: `${Math.max(5, ts.accuracy)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400 font-mono">
                    No topic metrics available yet. Take a self-test to start generating accuracy metrics!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Focus Topics & Achievements */}
          <div className="space-y-6">
            {/* Weak Topics Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-3">
              <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert size={16} className="text-rose-500" />
                Detected Weak Topics ({recommendations?.weakTopics?.length || 0})
              </h3>
              <div className="space-y-2">
                {recommendations?.weakTopics?.map((top) => (
                  <div
                    key={top}
                    className="p-3 rounded-2xl bg-rose-50 border border-rose-200/60 text-xs font-bold text-rose-800 flex items-center justify-between"
                  >
                    <span>{top}</span>
                    <span className="text-[10px] uppercase font-mono bg-rose-200/60 px-2 py-0.5 rounded-md">
                      Needs Practice
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
              <h3 className="font-display text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Award size={16} className="text-amber-500" />
                Unlocked Achievements ({stats?.achievements?.length || 0})
              </h3>
              <div className="space-y-2.5">
                {stats?.achievements && stats.achievements.length > 0 ? (
                  stats.achievements.map((ach) => (
                    <div
                      key={ach.key}
                      className="p-3 bg-amber-50 border border-amber-200/60 rounded-2xl flex items-center gap-3 text-xs"
                    >
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                        🏆
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{ach.title}</div>
                        <div className="text-[11px] text-slate-500">{ach.description}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 text-center py-6">
                    Complete tests and build streaks to unlock achievement badges!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Practice History */}
      {activeTab === "history" && (
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-left font-mono text-[10.5px] uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Mode</th>
                <th className="px-6 py-3.5">Difficulty</th>
                <th className="px-6 py-3.5">Score</th>
                <th className="px-6 py-3.5">XP Earned</th>
                <th className="px-6 py-3.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {recentAttempts && recentAttempts.length > 0 ? (
                recentAttempts.map((att) => (
                  <tr key={att._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-500">
                      {new Date(att.completedAt || att.startedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 capitalize font-bold text-slate-900">
                      {att.mode}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{att.config?.difficulty}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {att.totalScore} / {att.maxScore} ({att.percentage}%)
                    </td>
                    <td className="px-6 py-4 text-amber-600 font-bold">
                      +{att.xpEarned} XP
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/student/self-test/attempt/${att._id}`)}
                        className="text-indigo-600 hover:text-indigo-700 font-bold text-xs hover:underline"
                      >
                        View Summary
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No practice history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Bookmarks & Notes */}
      {activeTab === "bookmarks" && (
        <div className="space-y-4">
          {bookmarks.length > 0 ? (
            bookmarks.map((bm) => (
              <div
                key={bm._id}
                className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-3 hover:border-indigo-500/60 transition-all"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono uppercase bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full font-bold">
                    {bm.question?.type}
                  </span>
                  <span className="font-semibold">{bm.question?.difficulty}</span>
                </div>
                <p className="text-sm text-slate-900 font-medium leading-relaxed">
                  {bm.question?.questionText}
                </p>
                {bm.note && (
                  <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-3.5 text-xs text-amber-900 font-mono">
                    <strong>My Note:</strong> {bm.note}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-3xl py-16 text-center text-slate-400 text-xs">
              No bookmarked questions yet. Click the bookmark icon during practice sessions to save questions here!
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
