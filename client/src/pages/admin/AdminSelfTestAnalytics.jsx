import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { getAdminSelfTestAnalytics } from "../../api/selfTest";
import { ADMIN_LINKS } from "./adminLinks";
import {
  BarChart3, Users, Award, Target, Trophy, Flame, Zap, CheckCircle, TrendingUp,
  Download, PieChart, AlertTriangle, HelpCircle, FileSpreadsheet, FileJson,
  Layers, ArrowUpRight, Percent, Activity
} from "lucide-react";

export default function AdminSelfTestAnalytics() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminSelfTestAnalytics()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const navigateAdmin = (k) => {
    if (k === "overview") navigate("/admin");
    else if (k === "tests") navigate("/admin/tests");
    else navigate(`/admin/${k}`);
  };

  const exportCSV = () => {
    if (!data) return;
    let csv = "Topic,Attempts,Correct,Accuracy (%)\n";
    (data.topicOverview || []).forEach((t) => {
      csv += `"${t.topic}",${t.totalAttempted},${t.totalCorrect},${t.accuracy}%\n`;
    });
    csv += "\nLeaderboard Rank,Student,ERP,Branch,XP,Readiness Score (%)\n";
    (data.leaderboard || []).forEach((s, idx) => {
      csv += `${idx + 1},"${s.name}","${s.erpNumber}","${s.branch}",${s.xp},${s.readinessScore}%\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Self_Test_Analytics_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    if (!data) return;
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Self_Test_Analytics_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <DashboardLayout active="self-test-analytics" links={ADMIN_LINKS} onNavigate={navigateAdmin}>
        <div className="p-16 text-center text-slate-500 font-mono text-xs animate-pulse">
          Loading Aggregated Self-Test Analytics & Institutional Metrics…
        </div>
      </DashboardLayout>
    );
  }

  const {
    totalGenerated = 0,
    totalCompletedCount = 0,
    completionRate = 0,
    dailyActiveStudents = 0,
    avgReadinessScore = 0,
    avgScorePercentage = 0,
    totalStudentsPracticing = 0,
    totalXP = 0,
    topicPopularity = [],
    topicOverview = [],
    weakestTopics = [],
    questionPerformance = [],
    leaderboard = [],
  } = data || {};

  return (
    <DashboardLayout active="self-test-analytics" links={ADMIN_LINKS} onNavigate={navigateAdmin}>
      {/* Header with Export CTA */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white">
              <BarChart3 size={20} />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
              Self-Test Institutional Analytics
            </h1>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm">
            Comprehensive usage breakdown, topic popularity, completion rates, daily active users, and question performance.
          </p>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 rounded-2xl px-4 py-2.5 font-bold text-xs shadow-sm transition-all"
          >
            <FileSpreadsheet size={15} className="text-emerald-600" /> Export CSV
          </button>
          <button
            onClick={exportJSON}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-4 py-2.5 font-bold text-xs shadow-sm transition-all"
          >
            <FileJson size={15} className="text-indigo-400" /> Export JSON
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Total Generated vs Completed */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Tests Generated
            </span>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-md shadow-indigo-500/20 flex items-center justify-center text-white">
              <CheckCircle size={16} />
            </div>
          </div>
          <div className="font-display text-3xl font-extrabold text-slate-900 leading-none mb-1">
            {totalGenerated}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {totalCompletedCount} Completed ({completionRate}% Completion Rate)
          </div>
        </div>

        {/* Daily Active Students (7d) */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Practice Users (7d)
            </span>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-md shadow-violet-500/20 flex items-center justify-center text-white">
              <Activity size={16} />
            </div>
          </div>
          <div className="font-display text-3xl font-extrabold text-slate-900 leading-none mb-1">
            {dailyActiveStudents}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {totalStudentsPracticing} Total Practicing Students
          </div>
        </div>

        {/* Institutional Readiness Index */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Avg Readiness Index
            </span>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md shadow-emerald-500/20 flex items-center justify-center text-white">
              <Target size={16} />
            </div>
          </div>
          <div className="font-display text-3xl font-extrabold text-slate-900 leading-none mb-1">
            {avgReadinessScore}%
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Avg Score: {avgScorePercentage}% Across Tests
          </div>
        </div>

        {/* Total Practice XP */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Practice XP
            </span>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-md shadow-amber-500/20 flex items-center justify-center text-white">
              <Zap size={16} />
            </div>
          </div>
          <div className="font-display text-3xl font-extrabold text-slate-900 leading-none mb-1">
            {totalXP} XP
          </div>
          <div className="text-[11px] text-amber-600 font-bold font-mono">
            Cumulative Student Practice Gamification
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Topic Popularity Breakdown */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-sm">
          <h2 className="font-display text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
            <PieChart size={18} className="text-indigo-600" />
            Topic Popularity (Selection Volume)
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Distribution of topics selected by students in self-test configurations.
          </p>

          <div className="space-y-4">
            {topicPopularity.map((tp) => {
              const maxCount = Math.max(...topicPopularity.map((t) => t.count), 1);
              const percentage = Math.round((tp.count / maxCount) * 100);

              return (
                <div key={tp.topic} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800">{tp.topic}</span>
                    <span className="font-mono text-indigo-600">{tp.count} Selection(s)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full transition-all"
                      style={{ width: `${Math.max(4, percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Institutional Weakest Topics */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-sm">
          <h2 className="font-display text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
            <AlertTriangle size={18} className="text-rose-500" />
            Weakest Topics (Institutional Accuracy)
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Topics sorted by lowest overall student accuracy requiring placement intervention.
          </p>

          <div className="space-y-4">
            {weakestTopics.map((wt) => (
              <div key={wt.topic} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-800">{wt.topic}</span>
                  <span className={`font-mono ${wt.accuracy < 60 ? "text-rose-600" : "text-slate-600"}`}>
                    {wt.accuracy}% Accuracy ({wt.totalCorrect}/{wt.totalAttempted})
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      wt.accuracy >= 75
                        ? "bg-emerald-500"
                        : wt.accuracy >= 55
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${Math.max(4, wt.accuracy)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Hardest Questions Performance Table */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-sm">
          <h2 className="font-display text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
            <HelpCircle size={18} className="text-amber-500" />
            Hardest Questions Performance
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Questions with the lowest accuracy rates across all dynamic self-tests.
          </p>

          <div className="divide-y divide-slate-100">
            {questionPerformance.length > 0 ? (
              questionPerformance.map((q) => (
                <div key={q.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate mb-1">
                      {q.text}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold uppercase">
                        {q.type}
                      </span>
                      <span>{q.category}</span>
                      <span>•</span>
                      <span>{q.difficulty}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`text-xs font-bold font-mono ${q.accuracy < 50 ? "text-rose-600" : "text-amber-600"}`}>
                      {q.accuracy}% Accuracy
                    </div>
                    <div className="text-[10.5px] text-slate-400 font-mono">
                      {q.correct}/{q.attempted} Correct
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 font-mono">
                No question performance data collected yet.
              </div>
            )}
          </div>
        </div>

        {/* Top Practice XP Leaderboard */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-sm">
          <h2 className="font-display text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Trophy size={18} className="text-amber-500" />
            Top Practice Leaderboard
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Students earning the highest Practice XP through dynamic self-tests.
          </p>

          <div className="divide-y divide-slate-100">
            {leaderboard.length > 0 ? (
              leaderboard.map((student, idx) => (
                <div key={student.studentId || idx} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${
                        idx === 0
                          ? "bg-amber-100 text-amber-800 ring-2 ring-amber-400/40"
                          : idx === 1
                          ? "bg-slate-200 text-slate-700"
                          : idx === 2
                          ? "bg-amber-800/10 text-amber-900"
                          : "text-slate-400 bg-slate-100"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{student.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {student.erpNumber} &middot; {student.branch}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-amber-600">+{student.xp} XP</div>
                    <div className="text-[10.5px] text-slate-400 font-mono">
                      Readiness: {student.readinessScore}%
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 font-mono">
                No leaderboard data yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
