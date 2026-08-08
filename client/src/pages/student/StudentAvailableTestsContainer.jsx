import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { getEnabledTests } from "../../api/tests";
import { getMyAttempts, getStudentPsychometric } from "../../api/student";
import { STUDENT_LINKS } from "./studentLinks";
import {
  Target,
  FileCheck,
  Brain,
  Clock,
  Award,
  CheckCircle2,
  ArrowRight,
  Layers,
  Sparkles,
  Info,
  X,
  FileText,
} from "lucide-react";
import EmptyState from "../../components/common/EmptyState";
import { CardSkeleton } from "../../components/common/SkeletonLoader";
import StudentTestInstructionsModal from "../../components/test/StudentTestInstructionsModal";

export default function StudentAvailableTestsContainer() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine sub-tab from path (official vs psychometric vs all)
  const isPsychometricTab = location.pathname.includes("/psychometric");
  const isOfficialTab = location.pathname.includes("/official");

  const [activeSubTab, setActiveSubTab] = useState(
    isPsychometricTab ? "psychometric" : "official"
  );

  useEffect(() => {
    if (location.pathname.includes("/psychometric")) {
      setActiveSubTab("psychometric");
    } else if (location.pathname.includes("/official")) {
      setActiveSubTab("official");
    }
  }, [location.pathname]);

  const [tests, setTests] = useState([]);
  const [psychometrics, setPsychometrics] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTestForModal, setSelectedTestForModal] = useState(null);
  const [activePsychModal, setActivePsychModal] = useState(null);

  useEffect(() => {
    Promise.all([
      getEnabledTests().catch(() => []),
      getStudentPsychometric().catch(() => []),
      getMyAttempts().catch(() => []),
    ])
      .then(([t, p, a]) => {
        setTests(t || []);
        setPsychometrics(p || []);
        setAttempts(a || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const getAttemptForTest = (testId) =>
    attempts.find((a) => String(a.test?._id || a.test) === String(testId));

  const handleStartPlacementClick = (t) => {
    setSelectedTestForModal(t);
  };

  const handleProceedToAttempt = () => {
    if (selectedTestForModal) {
      const tId = selectedTestForModal._id;
      setSelectedTestForModal(null);
      navigate(`/student/attempt/${tId}`);
    }
  };

  const handleStartPsychAttempt = (id) => {
    setActivePsychModal(null);
    navigate(`/student/psychometric/attempt/${id}`);
  };

  return (
    <DashboardLayout
      active={
        activeSubTab === "psychometric"
          ? "available-tests/psychometric"
          : "available-tests/official"
      }
      links={STUDENT_LINKS}
      onNavigate={(path) => navigate(path)}
    >
      {/* Header */}
      <div className="mb-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Target size={26} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white">
              Available Assessments
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Official assessments published by Training & Placement Cell and psychometric evaluations.
          </p>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/60 self-start md:self-auto">
          <button
            onClick={() => {
              setActiveSubTab("official");
              navigate("/student/available-tests/official");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === "official"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <FileCheck size={15} /> Official Placement Tests ({tests.length})
          </button>
          <button
            onClick={() => {
              setActiveSubTab("psychometric");
              navigate("/student/available-tests/psychometric");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === "psychometric"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Brain size={15} /> Psychometric Assessment ({psychometrics.length})
          </button>
        </div>
      </div>

      {/* Official Placement Test Tab */}
      {activeSubTab === "official" && (
        <div className="animate-fadeIn">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <CardSkeleton count={3} />
            </div>
          ) : tests.length === 0 ? (
            <EmptyState
              icon={FileCheck}
              title="No Scheduled Placement Tests Right Now"
              description="There are currently no active placement assessments assigned for your branch or year. Check back later!"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tests.map((t) => {
                const attempt = getAttemptForTest(t._id);
                const isCompleted = attempt && attempt.status === "submitted";
                const isPlacement = t.testType === "placement";

                return (
                  <div
                    key={t._id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-all group border-l-4 border-l-indigo-600"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                        <span className="font-mono text-[10.5px] uppercase font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/20 px-2.5 py-0.5 rounded">
                          {isPlacement ? "✨ Official Placement" : t.category || "Placement Test"}
                        </span>
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={12} /> Completed
                          </span>
                        )}
                      </div>

                      <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {t.title}
                      </h3>
                      {t.description && (
                        <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
                          {t.description}
                        </p>
                      )}

                      {/* Sections info */}
                      {t.sections && t.sections.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {t.sections.map((sec, idx) => (
                            <span
                              key={idx}
                              className="text-[10.5px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700"
                            >
                              {sec.name} ({sec.questionCount || (sec.questions ? sec.questions.length : 0)}Q)
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock size={13} /> {t.durationMinutes} mins
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <Award size={13} /> {t.totalMarks} marks
                        </span>
                        {t.sections && (
                          <span className="flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400">
                            <Layers size={13} /> {t.sections.length} Sec
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                      <button
                        onClick={() => handleStartPlacementClick(t)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2.5 font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        {isCompleted ? "View Instructions & Attempt" : "View Instructions & Start Test"} <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Psychometric Assessment Tab */}
      {activeSubTab === "psychometric" && (
        <div className="animate-fadeIn">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <CardSkeleton count={3} />
            </div>
          ) : psychometrics.length === 0 ? (
            <EmptyState
              icon={Brain}
              title="No Active Psychometric Assessments"
              description="There are currently no psychometric assessments published by the Placement Cell. Check back soon!"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {psychometrics.map((item) => {
                const isCompleted = item.attemptStatus === "submitted";
                const isInProgress = item.attemptStatus === "in_progress";
                const qCount = item.questions?.length || 0;
                const tCount = item.traits?.length || 0;

                return (
                  <div
                    key={item._id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-all group border-l-4 border-l-blue-600"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-[10.5px] uppercase font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/20 px-2.5 py-0.5 rounded">
                          {item.category || "Behavioral"}
                        </span>
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={12} /> Completed
                          </span>
                        )}
                      </div>

                      <h3 className="font-display text-[17px] font-bold text-slate-900 dark:text-slate-100 mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.title}
                      </h3>

                      {item.description && (
                        <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock size={13} /> {item.durationMinutes || 15} mins
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <FileText size={13} /> {qCount} Questions
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <Layers size={13} /> {tCount} Traits
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                      {isCompleted ? (
                        <button
                          onClick={() => navigate(`/student/psychometric/report/${item.attemptId}`)}
                          className="w-full bg-blue-50 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/40 text-blue-600 dark:text-blue-400 rounded-xl px-4 py-2.5 font-bold text-xs hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center gap-2"
                        >
                          <Sparkles size={14} /> View Full Report & Insights
                        </button>
                      ) : (
                        <button
                          onClick={() => setActivePsychModal(item)}
                          className="w-full bg-blue-600 dark:bg-blue-500 text-white rounded-xl px-4 py-2.5 font-bold text-xs hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                          {isInProgress ? "Resume Assessment" : "View Instructions & Start"} <ArrowRight size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Official Placement Test Instructions Modal */}
      {selectedTestForModal && (
        <StudentTestInstructionsModal
          test={selectedTestForModal}
          onStart={handleProceedToAttempt}
          onClose={() => setSelectedTestForModal(null)}
        />
      )}

      {/* Psychometric Pre-assessment Briefing Modal */}
      {activePsychModal && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={() => setActivePsychModal(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActivePsychModal(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[11px] uppercase font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/20 px-2.5 py-0.5 rounded">
                {activePsychModal.category}
              </span>
            </div>

            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-2">
              {activePsychModal.title}
            </h2>

            {activePsychModal.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{activePsychModal.description}</p>
            )}

            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 mb-5 text-xs space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-blue-600 dark:text-blue-400 uppercase text-[11px]">
                <Info size={14} /> Candidate Instructions & Rules
              </div>
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                {activePsychModal.instructions ||
                  "Answer all questions candidly according to your natural workplace preferences. There are no right or wrong answers."}
              </p>
              <div className="flex items-center gap-4 text-xs font-semibold pt-2 text-slate-700 dark:text-slate-200 border-t border-slate-200/80 dark:border-slate-700/60">
                <span>⏱ Duration: <strong>{activePsychModal.durationMinutes || 15} Mins</strong></span>
                <span>❓ Questions: <strong>{activePsychModal.questions?.length || 0}</strong></span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActivePsychModal(null)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleStartPsychAttempt(activePsychModal._id)}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                Start Candidate Attempt <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
