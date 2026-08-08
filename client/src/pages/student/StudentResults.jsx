import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { getMyAttempts, getStudentPsychometric } from "../../api/student";
import { getStudentSelfTestDashboard } from "../../api/selfTest";
import StudentAnalytics from "./StudentAnalytics";
import { STUDENT_LINKS } from "./studentLinks";
import {
  Award,
  ArrowRight,
  Filter,
  BarChart2,
  CheckCircle2,
  FileCheck,
  Brain,
  Dumbbell,
  Code2,
} from "lucide-react";

export default function StudentResults() {
  const navigate = useNavigate();

  const [officialAttempts, setOfficialAttempts] = useState([]);
  const [psychometricTests, setPsychometricTests] = useState([]);
  const [practiceAttempts, setPracticeAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeFilter, setActiveFilter] = useState("all");
  const [activeViewMode, setActiveViewMode] = useState("list"); // 'list' or 'analytics'

  useEffect(() => {
    Promise.all([
      getMyAttempts().catch(() => []),
      getStudentPsychometric().catch(() => []),
      getStudentSelfTestDashboard().catch(() => null),
    ])
      .then(([off, psych, selfDash]) => {
        setOfficialAttempts(off.filter((a) => a.status === "submitted"));
        setPsychometricTests((psych || []).filter((p) => p.attemptStatus === "submitted"));
        setPracticeAttempts(selfDash?.recentAttempts || []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Map into unified items
  const unifiedResults = [
    ...officialAttempts.map((a) => ({
      id: a._id,
      title: a.test?.title || "Official Placement Test",
      category: a.test?.category || "Official Placement",
      type: "official",
      score: a.totalScore,
      maxScore: a.maxScore,
      percentage: a.maxScore ? Math.round((a.totalScore / a.maxScore) * 100) : 0,
      date: a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : "—",
      rawDate: a.submittedAt ? new Date(a.submittedAt) : new Date(0),
      link: `/student/result/${a._id}`,
      actionText: "View Result",
    })),
    ...psychometricTests.map((p) => ({
      id: p.attemptId || p._id,
      title: p.title || "Psychometric Assessment",
      category: p.category || "Behavioral & Personality",
      type: "psychometric",
      score: null,
      maxScore: null,
      percentage: 100,
      date: p.completedAt ? new Date(p.completedAt).toLocaleDateString() : "Completed",
      rawDate: p.completedAt ? new Date(p.completedAt) : new Date(0),
      link: `/student/psychometric/report/${p.attemptId}`,
      actionText: "View Report",
    })),
    ...practiceAttempts.map((p) => ({
      id: p._id,
      title: `${p.mode === "exam" ? "Exam Simulation" : "Practice Drill"} (${p.config?.difficulty || "Mixed"})`,
      category: p.config?.topics?.join(", ") || "General Practice",
      type: p.config?.questionType === "coding" ? "coding" : "practice",
      score: p.totalScore,
      maxScore: p.maxScore,
      percentage: p.percentage || (p.maxScore ? Math.round((p.totalScore / p.maxScore) * 100) : 0),
      date: p.completedAt ? new Date(p.completedAt).toLocaleDateString() : "—",
      rawDate: p.completedAt ? new Date(p.completedAt) : new Date(0),
      link: `/student/self-test/attempt/${p._id}`,
      actionText: "View Summary",
    })),
  ].sort((a, b) => b.rawDate - a.rawDate);

  const filteredResults = unifiedResults.filter((r) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "official") return r.type === "official";
    if (activeFilter === "psychometric") return r.type === "psychometric";
    if (activeFilter === "practice") return r.type === "practice";
    if (activeFilter === "coding") return r.type === "coding";
    return true;
  });

  return (
    <DashboardLayout
      active="results"
      links={STUDENT_LINKS}
      onNavigate={(path) => navigate(path)}
    >
      <div className="mb-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Award size={26} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white">
              My Assessment Results & History
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Centralized history of all completed Official Placement Tests, Psychometric Assessments, and Practice drills.
          </p>
        </div>

        {/* View Mode Toggle: List vs Performance Analytics */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/60 self-start md:self-auto">
          <button
            onClick={() => setActiveViewMode("list")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeViewMode === "list"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Award size={15} /> Result History ({unifiedResults.length})
          </button>
          <button
            onClick={() => setActiveViewMode("analytics")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeViewMode === "analytics"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <BarChart2 size={15} /> Topic Analytics
          </button>
        </div>
      </div>

      {activeViewMode === "analytics" ? (
        <div className="animate-fadeIn">
          <StudentAnalytics />
        </div>
      ) : (
        <div className="space-y-6 animate-fadeIn">
          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 items-center pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-2">
              <Filter size={14} /> Filter By:
            </span>
            {[
              { id: "all", label: "All Results", icon: Award },
              { id: "official", label: "Official Placement Tests", icon: FileCheck },
              { id: "psychometric", label: "Psychometric", icon: Brain },
              { id: "practice", label: "Practice Drills", icon: Dumbbell },
              { id: "coding", label: "Coding Practice", icon: Code2 },
            ].map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                    activeFilter === tab.id
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                  }`}
                >
                  <TabIcon size={14} /> {tab.label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
              <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-500 text-xs font-mono">Fetching unified assessment results…</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center py-14 p-6">
              <Award size={40} className="mx-auto text-slate-400 mb-3" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">No Results Found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No completed test attempts match the selected filter tab.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-left font-mono text-[10.5px] uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-3.5">Assessment Title</th>
                      <th className="px-6 py-3.5">Module Type</th>
                      <th className="px-6 py-3.5">Score</th>
                      <th className="px-6 py-3.5">Percentage / Status</th>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                    {filteredResults.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 dark:text-white text-sm">{r.title}</div>
                          <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">{r.category}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center font-mono text-[10px] uppercase font-bold px-2.5 py-0.5 rounded ${
                              r.type === "official"
                                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400"
                                : r.type === "psychometric"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                                : r.type === "coding"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                            }`}
                          >
                            {r.type === "official"
                              ? "Official Placement"
                              : r.type === "psychometric"
                              ? "Psychometric"
                              : r.type === "coding"
                              ? "Coding Practice"
                              : "Practice Drill"}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                          {r.score !== null ? `${r.score} / ${r.maxScore}` : "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded text-[11px] ${
                              r.percentage >= 75
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                                : r.percentage >= 50
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                                : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                            }`}
                          >
                            <CheckCircle2 size={12} /> {r.percentage}%
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-500">{r.date}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => navigate(r.link)}
                            className="bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors inline-flex items-center gap-1"
                          >
                            {r.actionText} <ArrowRight size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
