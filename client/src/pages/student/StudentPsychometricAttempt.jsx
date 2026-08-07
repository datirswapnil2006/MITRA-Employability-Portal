import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  startPsychometricAttempt,
  savePsychometricAnswer,
  submitPsychometricAttempt,
} from "../../api/student";
import useAssessmentBehavior from "../../hooks/useAssessmentBehavior";
import AssessmentExitConfirmModal from "../../components/test/AssessmentExitConfirmModal";
import {
  Brain,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Check,
} from "lucide-react";

const LIKERT_LABELS = [
  "Strongly Disagree",
  "Disagree",
  "Neutral",
  "Agree",
  "Strongly Agree",
];

export default function StudentPsychometricAttempt() {
  const { id: testId } = useParams();
  const navigate = useNavigate();

  const [attemptId, setAttemptId] = useState(null);
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [saveStatus, setSaveStatus] = useState("saved");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);

  const timerRef = useRef(null);

  const handleAutoSubmitWithReason = useCallback(
    async (exitReason = "Manual Submission", auditLogs = [], violationCount = 0) => {
      if (!attemptId || submitting) return;
      setSubmitting(true);
      try {
        await submitPsychometricAttempt(attemptId, { exitReason, auditLogs, violationCount });
        navigate("/student/psychometric");
      } catch (err) {
        alert(err.response?.data?.message || "Assessment submission error");
        navigate("/student/psychometric");
      }
    },
    [attemptId, submitting, navigate]
  );

  const {
    showExitModal,
    modalConfig,
    handleContinueAssessment,
    handleConfirmLeaveAssessment,
  } = useAssessmentBehavior({
    attemptId,
    settings: test?.navigationPolicySettings,
    enabled: !loading && !error && !submitting,
    onSaveAnswers: async () => {
      const q = questions[currentIndex];
      if (q && answers[q._id] !== undefined) {
        await savePsychometricAnswer(attemptId, {
          questionId: q._id,
          selectedOptionIndex: answers[q._id],
          timeSpentSeconds: 5,
        }).catch(() => {});
      }
    },
    onSubmitAssessment: handleAutoSubmitWithReason,
  });

  useEffect(() => {
    startPsychometricAttempt(testId)
      .then((data) => {
        setAttemptId(data.attemptId);
        setTest(data.test);
        setQuestions(data.questions || []);

        const ansMap = {};
        if (data.existingAnswers && Array.isArray(data.existingAnswers)) {
          data.existingAnswers.forEach((a) => {
            ansMap[a.questionId] = a.selectedOptionIndex;
          });
        }
        setAnswers(ansMap);

        const endsAt = new Date(data.endsAt).getTime();
        const diff = Math.max(0, Math.floor((endsAt - Date.now()) / 1000));
        setTimeLeftSeconds(diff);
      })
      .catch((err) => {
        if (err.response?.status === 409 && err.response?.data?.attemptId) {
          navigate("/student/psychometric");
        } else {
          setError(err.response?.data?.message || "Failed to start psychometric assessment");
        }
      })
      .finally(() => setLoading(false));
  }, [testId, navigate]);

  useEffect(() => {
    if (timeLeftSeconds <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmitWithReason("Time Expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeftSeconds, handleAutoSubmitWithReason]);

  const handleSelectOption = async (qId, optionIdx) => {
    setAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
    setSaveStatus("saving");

    try {
      await savePsychometricAnswer(attemptId, {
        questionId: qId,
        selectedOptionIndex: optionIdx,
        timeSpentSeconds: 5,
      });
      setSaveStatus("saved");
    } catch (err) {
      setSaveStatus("error");
    }
  };

  const handleSubmit = async () => {
    await handleAutoSubmitWithReason("Manual Submission");
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-100">
        <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="font-display font-semibold text-slate-300 text-sm">Preparing candidate assessment session...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center max-w-md shadow-lg">
          <AlertTriangle size={36} className="text-rose-500 mx-auto mb-3" />
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Assessment Unavailable</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">{error}</p>
          <button
            onClick={() => navigate("/student/psychometric")}
            className="bg-blue-600 dark:bg-blue-500 text-white rounded-xl px-5 py-2.5 text-xs font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Back to Assessment List
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-body flex flex-col">
      {/* EXAM TOP HEADER */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
            <Brain size={20} />
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase font-bold tracking-wide text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded">
              {test?.category}
            </span>
            <h1 className="font-display text-sm font-bold text-slate-100 truncate max-w-xs sm:max-w-md">
              {test?.title}
            </h1>
          </div>
        </div>

        {/* Status Indicator & Timer */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold">
            {saveStatus === "saving" ? (
              <span className="text-amber-400 flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" /> Saving response...
              </span>
            ) : saveStatus === "error" ? (
              <span className="text-rose-400 flex items-center gap-1">
                <AlertTriangle size={12} /> Auto-save failed
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={13} /> Auto-saved
              </span>
            )}
          </div>

          <div className="bg-slate-800 text-white font-mono text-sm px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-sm border border-slate-700">
            <Clock size={15} className="text-blue-400" />
            {formatTimer(timeLeftSeconds)}
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-500 transition-colors"
          >
            Submit Assessment
          </button>
        </div>
      </header>

      {/* PROGRESS BAR */}
      <div className="w-full bg-slate-800 h-1.5">
        <div
          className="bg-blue-500 h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* MAIN QUESTION DISPLAY */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-between">
        {currentQ && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm mb-6 flex-1 flex flex-col justify-between">
            <div>
              {/* Question Metadata Badge Bar */}
              <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-xs text-slate-200 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span className="font-mono text-[10px] uppercase font-bold text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded">
                    {currentQ.type}
                  </span>
                </div>
                <span className="font-mono text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded">
                  Evaluating: {currentQ.traitKey}
                </span>
              </div>

              {/* Situational Context Card if SJT */}
              {currentQ.type === "situational_judgment" && currentQ.situationContext && (
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 mb-5 text-xs text-slate-200 leading-relaxed italic">
                  <span className="font-bold uppercase text-[10px] text-slate-400 block not-italic mb-1">
                    Scenario Context:
                  </span>
                  "{currentQ.situationContext}"
                </div>
              )}

              {/* Question Text */}
              <h2 className="font-display text-base sm:text-lg font-bold text-slate-100 mb-6 leading-snug">
                {currentQ.questionText}
              </h2>

              {/* INTERACTIVE RESPONSE OPTIONS */}

              {/* TYPE 1: LIKERT 5-POINT SCALE */}
              {currentQ.type === "likert" && (
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mt-4">
                  {LIKERT_LABELS.map((label, optIdx) => {
                    const isSelected = answers[currentQ._id] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(currentQ._id, optIdx)}
                        className={`p-3.5 rounded-xl border-2 text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                          isSelected
                            ? "bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm scale-[1.02]"
                            : "bg-slate-800/80 border-slate-700 text-slate-200 hover:border-blue-500/50 hover:bg-slate-800"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-[11px] ${
                            isSelected ? "bg-blue-500 text-white" : "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {optIdx + 1}
                        </div>
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* TYPE 2: FORCED CHOICE OR SITUATIONAL CHOICE OPTIONS */}
              {(currentQ.type === "forced_choice" || currentQ.type === "situational_judgment") && (
                <div className="space-y-3 mt-4">
                  {(currentQ.options && currentQ.options.length > 0
                    ? currentQ.options
                    : [
                        { optionText: "Choice A: Primary effective action" },
                        { optionText: "Choice B: Alternative situational response" },
                      ]
                  ).map((opt, optIdx) => {
                    const isSelected = answers[currentQ._id] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(currentQ._id, optIdx)}
                        className={`w-full p-4 rounded-xl border-2 text-xs font-medium text-left flex items-start gap-3 transition-all ${
                          isSelected
                            ? "bg-blue-600/20 border-blue-500 text-blue-200 shadow-sm"
                            : "bg-slate-800/80 border-slate-700 text-slate-200 hover:border-blue-500/50 hover:bg-slate-800"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected ? "border-blue-500 bg-blue-500 text-white" : "border-slate-600"
                          }`}
                        >
                          {isSelected && <Check size={12} />}
                        </div>
                        <span className="flex-1 leading-normal">{opt.optionText}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Question Controls */}
            <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-800 mt-6">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                className="px-4 py-2 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronLeft size={16} /> Previous
              </button>

              <div className="font-mono text-xs text-slate-400">
                Answered {answeredCount} / {questions.length}
              </div>

              {currentIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-500 transition-colors flex items-center gap-1"
                >
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-500 transition-colors flex items-center gap-1"
                >
                  Finish & Review
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* CONFIRMATION SUBMIT MODAL */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Brain size={40} className="mx-auto text-blue-400 mb-3" />
            <h3 className="font-display text-lg font-bold text-slate-100 mb-1">Submit Assessment?</h3>
            <p className="text-xs text-slate-400 mb-4">
              You have answered <strong className="text-slate-200">{answeredCount}</strong> out of <strong className="text-slate-200">{questions.length}</strong> questions.
            </p>

            {answeredCount < questions.length && (
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs p-3 rounded-xl mb-4 text-left">
                <strong>Note:</strong> You have {questions.length - answeredCount} unanswered items. Unanswered items will be scored at baseline.
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Back to Test
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {submitting ? "Submitting..." : "Confirm & Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Policy Exit Warning Modal */}
      <AssessmentExitConfirmModal
        isOpen={showExitModal}
        title={modalConfig.title}
        message={modalConfig.message}
        onContinue={handleContinueAssessment}
        onLeave={handleConfirmLeaveAssessment}
        isWarningOnly={modalConfig.isWarningOnly}
      />
    </div>
  );
}
