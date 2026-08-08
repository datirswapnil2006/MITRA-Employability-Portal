import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { getEnabledTests } from "../../api/tests";
import { getMyAttempts } from "../../api/student";
import { generateSelfTest } from "../../api/selfTest";
import { STUDENT_LINKS } from "./studentLinks";
import { ClipboardList, Clock, Award, CheckCircle2, ArrowRight, Layers, Sparkles, Zap, Brain, Code, RefreshCw } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";
import { CardSkeleton } from "../../components/common/SkeletonLoader";
import StudentTestInstructionsModal from "../../components/test/StudentTestInstructionsModal";

const PRACTICE_TOPICS = [
  { name: "Quantitative Aptitude", icon: Award, category: "Quantitative Aptitude", count: 10, time: 15 },
  { name: "Logical Reasoning", icon: Brain, category: "Logical Reasoning", count: 10, time: 15 },
  { name: "Verbal Ability", icon: ClipboardList, category: "Verbal Ability", count: 10, time: 10 },
  { name: "Data Structures & DSA", icon: Code, category: "Data Structures & Algorithms", count: 5, time: 20 },
];

export default function StudentAvailableTests() {
  const [tests, setTests] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTestForModal, setSelectedTestForModal] = useState(null);
  const [launchingTopic, setLaunchingTopic] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getEnabledTests(), getMyAttempts()])
      .then(([t, a]) => {
        setTests(t);
        setAttempts(a);
      })
      .finally(() => setLoading(false));
  }, []);

  const getAttemptForTest = (testId) => attempts.find((a) => String(a.test?._id || a.test) === String(testId));

  const handleStartTestClick = (t) => {
    setSelectedTestForModal(t);
  };

  const handleProceedToAttempt = () => {
    if (selectedTestForModal) {
      const tId = selectedTestForModal._id;
      setSelectedTestForModal(null);
      navigate(`/student/attempt/${tId}`);
    }
  };

  const handleLaunchQuickPractice = async (topicObj) => {
    setLaunchingTopic(topicObj.name);
    try {
      const res = await generateSelfTest({
        category: topicObj.category,
        difficulty: "Medium",
        questionCount: topicObj.count,
        questionType: topicObj.category.includes("Algorithms") ? "coding" : "mcq",
      });
      if (res?.attemptId) {
        navigate(`/student/self-test/attempt/${res.attemptId}`);
      } else {
        navigate("/student/self-test");
      }
    } catch (err) {
      navigate("/student/self-test");
    } finally {
      setLaunchingTopic("");
    }
  };

  return (
    <DashboardLayout
      active="available-tests/official"
      links={STUDENT_LINKS}
      onNavigate={(path) => navigate(path)}
    >
      <div className="mb-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <ClipboardList size={24} className="text-accent" />
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-ink">Available Assessments</h1>
          </div>
          <p className="text-ink-soft text-sm">
            Campus placement tests scheduled by Training & Placement Cell and instant AI self-practice assessments.
          </p>
        </div>

        <button
          onClick={() => navigate("/student/self-test")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
        >
          <Sparkles size={16} /> Open AI Self-Test Generator
        </button>
      </div>

      {/* Section 1: Official Campus Placement Assessments */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
            ✨ Scheduled Official Placement Tests
          </h2>
          <span className="text-xs font-semibold text-ink-soft bg-slate-100 px-2.5 py-1 rounded-full">
            {tests.length} Active
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <CardSkeleton count={3} />
          </div>
        ) : tests.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No Active Placement Tests Right Now"
            description="There are no scheduled assessments available for your branch right now. You can take an instant AI Self-Test below!"
          />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(310px,1fr))] gap-5">
            {tests.map((t) => {
              const attempt = getAttemptForTest(t._id);
              const isCompleted = attempt && attempt.status === "submitted";
              const isPlacement = t.testType === "placement";

              return (
                <div
                  key={t._id}
                  className={`bg-white border rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition-all duration-200 group ${
                    isPlacement ? "border-indigo-200 ring-1 ring-indigo-500/10" : "border-line"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                      <span className={`font-mono text-[11px] tracking-wide uppercase font-semibold px-2 py-0.5 rounded ${
                        isPlacement ? "bg-indigo-100 text-indigo-700" : "bg-accent/10 text-accent"
                      }`}>
                        {isPlacement ? "✨ Official Placement Test" : t.category}
                      </span>
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={12} /> Completed
                        </span>
                      )}
                    </div>

                    <h3 className="font-display text-lg font-bold text-ink mb-1 group-hover:text-accent transition-colors">
                      {t.title}
                    </h3>
                    {t.description && (
                      <p className="text-[13px] text-ink-soft mb-3 line-clamp-2">{t.description}</p>
                    )}

                    {/* Section badges if placement test */}
                    {isPlacement && t.sections && t.sections.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {t.sections.map((sec, idx) => (
                          <span key={idx} className="text-[10.5px] font-medium bg-slate-100 text-ink px-2 py-0.5 rounded border border-slate-200">
                            {sec.name} ({sec.questionCount || (sec.questions ? sec.questions.length : 0)}Q)
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-[12.5px] text-ink-soft mb-4">
                      <span className="flex items-center gap-1">
                        <Clock size={14} /> {t.durationMinutes} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Award size={14} /> {t.totalMarks} marks
                      </span>
                      {isPlacement && t.sections && (
                        <span className="flex items-center gap-1 font-semibold text-indigo-600">
                          <Layers size={14} /> {t.sections.length} Sections
                        </span>
                      )}
                    </div>
                  </div>

                  {isCompleted ? (
                    <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between border border-slate-200">
                      <div>
                        <div className="text-[11px] text-ink-soft">Your Final Score</div>
                        <div className="text-[15px] font-bold text-ink">
                          {attempt.totalScore} / {attempt.maxScore}
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/student/result/${attempt._id}`)}
                        className="text-accent text-[12.5px] font-semibold flex items-center gap-1 hover:underline"
                      >
                        View Report <ArrowRight size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      className={`w-full text-white rounded-lg px-4.5 py-2.5 font-semibold text-[13.5px] transition-colors shadow-sm ${
                        isPlacement ? "bg-indigo-600 hover:bg-indigo-700" : "bg-accent hover:bg-accent-hover"
                      }`}
                      onClick={() => handleStartTestClick(t)}
                    >
                      Start Placement Exam
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Instant AI Self-Test & Practice Generator */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
              🤖 Instant AI Self-Test & Topic Practice
            </h2>
            <p className="text-xs text-ink-soft">Generate instant custom practice tests powered by AI for targeted preparation.</p>
          </div>

          <button
            onClick={() => navigate("/student/self-test/hub")}
            className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
          >
            Practice Hub & XP <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PRACTICE_TOPICS.map((pt, idx) => {
            const Icon = pt.icon;
            const isLaunching = launchingTopic === pt.name;

            return (
              <div
                key={idx}
                className="bg-white border border-line rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-bold text-ink text-sm mb-1">{pt.name}</h3>
                  <p className="text-xs text-ink-soft mb-4">{pt.count} Practice Qs • {pt.time} mins</p>
                </div>

                <button
                  onClick={() => handleLaunchQuickPractice(pt)}
                  disabled={!!launchingTopic}
                  className="w-full bg-slate-900 hover:bg-indigo-600 text-white text-xs font-semibold py-2.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLaunching ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Generating…
                    </>
                  ) : (
                    <>
                      <Zap size={14} /> Start AI Practice
                    </>
                  )}
                </button>
              </div>
            );
          })}
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

