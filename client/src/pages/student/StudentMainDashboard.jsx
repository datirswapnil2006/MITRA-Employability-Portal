import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { getEnabledTests } from "../../api/tests";
import { getMyAttempts, getStudentPsychometric } from "../../api/student";
import { getStudentSelfTestDashboard } from "../../api/selfTest";
import { useAuth } from "../../context/AuthContext";
import { STUDENT_LINKS } from "./studentLinks";
import {
  Target,
  CheckCircle2,
  Dumbbell,
  Award,
  Sparkles,
  ArrowRight,
  Clock,
  Brain,
  FileCheck,
  Zap,
  TrendingUp,
} from "lucide-react";
import StudentTestInstructionsModal from "../../components/test/StudentTestInstructionsModal";

export default function StudentMainDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tests, setTests] = useState([]);
  const [psychometrics, setPsychometrics] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [practiceStats, setPracticeStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTestForModal, setSelectedTestForModal] = useState(null);

  useEffect(() => {
    Promise.all([
      getEnabledTests().catch(() => []),
      getStudentPsychometric().catch(() => []),
      getMyAttempts().catch(() => []),
      getStudentSelfTestDashboard().catch(() => null),
    ])
      .then(([t, p, a, s]) => {
        setTests(t || []);
        setPsychometrics(p || []);
        setAttempts(a || []);
        setPracticeStats(s);
      })
      .finally(() => setLoading(false));
  }, []);

  const completedAttempts = attempts.filter((a) => a.status === "submitted");
  const practiceAttemptsCount = practiceStats?.recentAttempts?.length || 0;

  // Calculate Average Score
  const totalScoreSum = completedAttempts.reduce((acc, a) => acc + (a.totalScore || 0), 0);
  const totalMaxSum = completedAttempts.reduce((acc, a) => acc + (a.maxScore || 0), 0);
  const avgScore = totalMaxSum ? Math.round((totalScoreSum / totalMaxSum) * 100) : 0;

  // Uncompleted official placement tests
  const pendingPlacementTests = tests.filter((t) => {
    const att = attempts.find((a) => String(a.test?._id || a.test) === String(t._id));
    return !att || att.status !== "submitted";
  });

  // Uncompleted psychometric tests
  const pendingPsychometric = psychometrics.filter((p) => p.attemptStatus !== "submitted");

  const totalAvailableCount = pendingPlacementTests.length + pendingPsychometric.length;

  const handleStartPlacement = (t) => {
    setSelectedTestForModal(t);
  };

  const handleProceedToAttempt = () => {
    if (selectedTestForModal) {
      const tId = selectedTestForModal._id;
      setSelectedTestForModal(null);
      navigate(`/student/attempt/${tId}`);
    }
  };

  return (
    <DashboardLayout
      active="dashboard"
      links={STUDENT_LINKS}
      onNavigate={(path) => navigate(path)}
    >
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 mb-8 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-semibold mb-3">
              <Sparkles size={13} className="text-indigo-400 animate-pulse" />
              MITRA Employability Portal
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">
              Welcome back, {user?.name?.split(" ")[0] || "Student"} 👋
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
              Track your upcoming placement assessments, view performance analytics, and continue practicing to boost your employability readiness score.
            </p>
          </div>

          <button
            onClick={() => navigate("/student/practice")}
            className="self-start md:self-auto inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-2xl px-5 py-3 font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] shrink-0"
          >
            <Zap size={16} /> Continue Practice
          </button>
        </div>
      </div>

      {/* KPI Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Available Tests
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Target size={17} />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {loading ? "..." : totalAvailableCount}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Official & Psychometric</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Completed Tests
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={17} />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {loading ? "..." : completedAttempts.length}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Assessments Submitted</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Practice Sessions
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Dumbbell size={17} />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {loading ? "..." : practiceAttemptsCount}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">AI Self-Tests & Drills</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Average Score
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp size={17} />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {loading ? "..." : `${avgScore}%`}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Aggregate Accuracy</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Main Column: Available Tests Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Available Tests Preview Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Target size={20} className="text-indigo-600 dark:text-indigo-400" />
                  Available Assessments
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Official Placement Assessments & Psychometric Profiling assigned to you.
                </p>
              </div>

              <button
                onClick={() => navigate("/student/available-tests")}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                View All <ArrowRight size={14} />
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400 animate-pulse font-mono">
                Loading available assessments…
              </div>
            ) : pendingPlacementTests.length === 0 && pendingPsychometric.length === 0 ? (
              <div className="py-10 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
                <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">All Assigned Assessments Completed!</h4>
                <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">
                  Great job! You have completed all active tests. Sharpen your skills with practice mode.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {/* Official Placement Test Preview Cards */}
                {pendingPlacementTests.slice(0, 2).map((t) => (
                  <div
                    key={t._id}
                    className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-indigo-400"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/20 px-2 py-0.5 rounded">
                          Official Placement Test
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          {t.category}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                        {t.title}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="flex items-center gap-1"><Clock size={13} /> {t.durationMinutes} mins</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Award size={13} /> {t.totalMarks} marks</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartPlacement(t)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm shrink-0 flex items-center justify-center gap-1.5"
                    >
                      <FileCheck size={14} /> Start Placement Test
                    </button>
                  </div>
                ))}

                {/* Psychometric Assessment Preview Cards */}
                {pendingPsychometric.slice(0, 2).map((p) => (
                  <div
                    key={p._id}
                    className="p-4 rounded-2xl border border-blue-200 dark:border-blue-500/30 bg-blue-50/30 dark:bg-blue-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-blue-400"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20 px-2 py-0.5 rounded">
                          Psychometric Assessment
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                        {p.title}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="flex items-center gap-1"><Clock size={13} /> {p.durationMinutes || 15} mins</span>
                        <span>•</span>
                        <span>{p.questions?.length || 0} Questions</span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate("/student/available-tests/psychometric")}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm shrink-0 flex items-center justify-center gap-1.5"
                    >
                      <Brain size={14} /> View Instructions
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Results Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award size={20} className="text-amber-500" />
                  Recent Assessment Results
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Latest scores and evaluation breakdown.
                </p>
              </div>

              <button
                onClick={() => navigate("/student/results")}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                View All Results <ArrowRight size={14} />
              </button>
            </div>

            {completedAttempts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No submitted assessment results yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {completedAttempts.slice(0, 3).map((a) => {
                  const percent = a.maxScore ? Math.round((a.totalScore / a.maxScore) * 100) : 0;
                  return (
                    <div key={a._id} className="py-3.5 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {a.test?.title || "Assessment"}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {a.test?.category || "Placement"} • {new Date(a.submittedAt || Date.now()).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {a.totalScore} / {a.maxScore}
                          </div>
                          <span className={`text-xs font-bold ${percent >= 60 ? "text-emerald-600" : "text-amber-600"}`}>
                            {percent}%
                          </span>
                        </div>

                        <button
                          onClick={() => navigate(`/student/result/${a._id}`)}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
                          title="View Result Report"
                        >
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Column: Practice Progress & Hub */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Dumbbell size={16} className="text-indigo-600 dark:text-indigo-400" />
              Practice Progress & Readiness
            </h3>

            <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-blue-500/10 border border-indigo-500/20 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex justify-between items-center font-bold text-indigo-700 dark:text-indigo-300">
                <span>Placement Readiness Index</span>
                <span>{practiceStats?.recommendations?.readinessScore ?? 75}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${practiceStats?.recommendations?.readinessScore ?? 75}%` }}
                />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed pt-1">
                Take practice drills across Aptitude, Logical Reasoning, Verbal, and Coding to raise your score.
              </p>
            </div>

            <button
              onClick={() => navigate("/student/practice")}
              className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-indigo-600 text-white rounded-xl py-3 text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              Open Practice Studio <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {selectedTestForModal && (
        <StudentTestInstructionsModal
          test={selectedTestForModal}
          onStart={handleProceedToAttempt}
          onClose={() => setSelectedTestForModal(null)}
        />
      )}
    </DashboardLayout>
  );
}
