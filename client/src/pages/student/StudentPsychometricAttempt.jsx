import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  startPsychometricAttempt,
  savePsychometricAnswer,
  submitPsychometricAttempt,
} from "../../api/student";
import useProctoring from "../../hooks/useProctoring";
import LiveProctorCamera from "../../components/test/LiveProctorCamera";
import useAssessmentBehavior from "../../hooks/useAssessmentBehavior";
import AssessmentExitConfirmModal from "../../components/test/AssessmentExitConfirmModal";
import PreTestSecurityCheckModal from "../../components/test/PreTestSecurityCheckModal";
import {
  Brain,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Check,
  FileText,
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
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [saveStatus, setSaveStatus] = useState("saved");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef(null);

  const [showPreTestModal, setShowPreTestModal] = useState(false);
  const [securityVerified, setSecurityVerified] = useState(false);
  const [initialCamStream, setInitialCamStream] = useState(null);
  const [initialScreenStream, setInitialScreenStream] = useState(null);

  // Continuous AI Proctoring & Live Camera Feed
  const proctorState = useProctoring(attemptId, {
    enabled: securityVerified && !loading && !error && !submitting && Boolean(attemptId),
    initialStream: initialCamStream,
    initialScreenStream,
    onAutoSubmit: (result) => handleAutoSubmitWithReason("Auto-submitted due to proctoring violations", result?.auditLogs || []),
  });

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
        setShowPreTestModal(true);
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center text-slate-900">
        <div className="w-10 h-10 border-3 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="font-display font-semibold text-slate-700 text-sm">Preparing candidate assessment session...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md shadow-xl">
          <AlertTriangle size={36} className="text-rose-600 mx-auto mb-3" />
          <h2 className="font-display text-lg font-bold text-slate-900 mb-1">Assessment Unavailable</h2>
          <p className="text-xs text-slate-600 mb-5">{error}</p>
          <button
            onClick={() => navigate("/student/psychometric")}
            className="bg-indigo-600 text-white rounded-xl px-5 py-2.5 text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer"
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-body flex flex-col">
      {/* EXAM TOP HEADER */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold">
            <Brain size={20} />
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase font-bold tracking-wide text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
              {test?.category}
            </span>
            <h1 className="font-display text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
              {test?.title}
            </h1>
          </div>
        </div>

        {/* Status Indicator & Timer */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold">
            {saveStatus === "saving" ? (
              <span className="text-amber-700 flex items-center gap-1.5 font-medium">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" /> Saving response...
              </span>
            ) : saveStatus === "error" ? (
              <span className="text-rose-600 flex items-center gap-1">
                <AlertTriangle size={13} /> Auto-save failed
              </span>
            ) : (
              <span className="text-emerald-700 flex items-center gap-1">
                <CheckCircle2 size={13} /> Auto-saved
              </span>
            )}
          </div>

          <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-sm px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-2xs">
            <Clock size={15} className="text-indigo-600" />
            {formatTimer(timeLeftSeconds)}
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer shadow-2xs"
          >
            Submit Assessment
          </button>
        </div>
      </header>

      {/* PROGRESS BAR */}
      <div className="w-full bg-slate-200 h-1.5">
        <div
          className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* MAIN QUESTION DISPLAY */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-between">
        {currentQ && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs mb-6 flex-1 flex flex-col justify-between">
            <div>
              {/* Candidate Header */}
              <div className="flex items-center justify-between gap-2 mb-5 pb-3.5 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <span className="font-display font-bold text-xs text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200 shadow-2xs">
                    Statement {currentIndex + 1} of {questions.length}
                  </span>
                  {answers[currentQ._id] !== undefined && (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                      <CheckCircle2 size={12} /> Answered
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold text-slate-500 font-mono">
                  {progressPercent}% Completed
                </span>
              </div>

              {/* Scenario Context Card */}
              {currentQ.situationContext && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 mb-5 text-xs sm:text-sm text-slate-800 leading-relaxed">
                  <div className="flex items-center gap-1.5 text-indigo-700 font-semibold text-[11px] mb-1.5 uppercase tracking-wider">
                    <FileText size={14} /> Scenario Context
                  </div>
                  <p className="italic text-slate-700">{currentQ.situationContext}</p>
                </div>
              )}

              {/* Question Text */}
              <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 mb-6 leading-snug">
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
                        className={`p-3.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                          isSelected
                            ? "bg-indigo-50/60 border-2 border-indigo-600 text-indigo-950 font-bold shadow-xs scale-[1.02]"
                            : "bg-slate-50/50 border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-slate-50"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-[11px] ${
                            isSelected ? "bg-indigo-600 text-white shadow-2xs" : "bg-slate-200 text-slate-700"
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
                        className={`w-full p-4 rounded-xl border text-xs font-medium text-left flex items-start gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-50/60 border-2 border-indigo-600 text-slate-950 font-semibold shadow-xs"
                            : "bg-slate-50/50 border-slate-200 text-slate-800 hover:border-indigo-400 hover:bg-slate-50"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isSelected ? "border-indigo-600 bg-indigo-600 text-white shadow-2xs" : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check size={12} />}
                        </div>
                        <span className="flex-1 leading-normal">{typeof opt === "string" ? opt : opt.optionText}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Question Controls */}
            <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-200 mt-6">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft size={16} /> Previous
              </button>

              <div className="font-mono text-xs text-slate-500 font-medium">
                Answered {answeredCount} / {questions.length}
              </div>

              {currentIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
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
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <Brain size={40} className="mx-auto text-indigo-600 mb-3" />
            <h3 className="font-display text-lg font-bold text-slate-900 mb-1">Submit Assessment?</h3>
            <p className="text-xs text-slate-600 mb-4">
              You have answered <strong className="text-slate-900">{answeredCount}</strong> out of <strong className="text-slate-900">{questions.length}</strong> questions.
            </p>

            {answeredCount < questions.length && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3.5 rounded-xl mb-4 text-left font-medium">
                <strong>Note:</strong> You have {questions.length - answeredCount} unanswered items. Unanswered items will be scored at baseline.
              </div>
            )}

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer bg-white"
              >
                Back to Test
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
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

      {/* Mandatory Pre-Test Security & System Check Wizard */}
      <PreTestSecurityCheckModal
        isOpen={showPreTestModal && !securityVerified}
        testTitle={test?.title || "Psychometric Profiling Assessment"}
        requireScreenShare={Boolean(test?.navigationPolicySettings?.requireScreenShare)}
        onStartTest={({ cameraStream, screenStream }) => {
          setInitialCamStream(cameraStream);
          setInitialScreenStream(screenStream);
          setSecurityVerified(true);
          setShowPreTestModal(false);
          document.documentElement.requestFullscreen?.().catch(() => {});
        }}
      />

      {/* Live Proctoring Floating Camera Overlay */}
      {!loading && !error && !submitting && securityVerified && Boolean(attemptId) && (
        <LiveProctorCamera
          stream={proctorState.stream}
          cameraStatus={proctorState.cameraStatus}
          faceCount={proctorState.faceCount}
          gazeStatus={proctorState.gazeStatus}
          violationCount={proctorState.violationCount}
          warningMessage={proctorState.warningMessage}
          onDismissWarning={proctorState.dismissWarning}
        />
      )}
    </div>
  );
}
