import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { startAttempt, saveAnswer, runSample, submitAttempt } from "../api/tests";
import useProctoring from "../hooks/useProctoring";
import useAssessmentBehavior from "../hooks/useAssessmentBehavior";
import AssessmentExitConfirmModal from "../components/test/AssessmentExitConfirmModal";

// Modern Test Components
import TestHeader from "../components/test/TestHeader";
import QuestionPalette from "../components/test/QuestionPalette";
import QuestionCard from "../components/test/QuestionCard";
import SubmitConfirmModal from "../components/test/SubmitConfirmModal";
import { ArrowLeft, ArrowRight, ShieldAlert, CheckCircle2 } from "lucide-react";

const STARTER = {
  python: "# write your solution here\n",
  java: "// write your solution here\npublic class Main {\n    public static void main(String[] args) {\n\n    }\n}\n",
  cpp: "// write your solution here\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n\n    return 0;\n}\n",
};

export default function AttemptPage() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attemptId, setAttemptId] = useState(null);
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // questionId -> { selectedOptionIndex, code, language }
  const [markedForReview, setMarkedForReview] = useState({}); // questionId -> boolean
  const [current, setCurrent] = useState(0);
  const [remainingSec, setRemainingSec] = useState(0);
  const [sampleResults, setSampleResults] = useState({});
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [terminated, setTerminated] = useState(null);
  const [fontSize, setFontSize] = useState("base");
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const saveTimers = useRef({});

  // Proctoring active during attempt
  useProctoring(attemptId, {
    enabled: !loading && !error && !submitting && !terminated,
    onAutoSubmit: (result) => setTerminated(result),
  });

  const handleSubmit = useCallback(async (exitReason = "Manual Submission") => {
    if (!attemptId || submitting) return;
    setSubmitting(true);
    try {
      const result = await submitAttempt(attemptId, { exitReason });
      navigate(`/student/result/${attemptId}`, { state: result });
    } catch (e) {
      alert(e.response?.data?.message || "Could not submit test");
      setSubmitting(false);
    }
  }, [attemptId, submitting, navigate]);

  const handleAutoSubmitWithReason = useCallback(async (exitReason, auditLogs, violationCount) => {
    if (!attemptId || submitting) return;
    setSubmitting(true);
    try {
      const result = await submitAttempt(attemptId, { exitReason, auditLogs, violationCount });
      navigate(`/student/result/${attemptId}`, { state: result });
    } catch (e) {
      alert(e.response?.data?.message || "Could not submit test");
      setSubmitting(false);
    }
  }, [attemptId, submitting, navigate]);

  const {
    showExitModal,
    modalConfig,
    handleContinueAssessment,
    handleConfirmLeaveAssessment,
  } = useAssessmentBehavior({
    attemptId,
    settings: test?.navigationPolicySettings,
    enabled: !loading && !error && !submitting && !terminated,
    onSaveAnswers: async () => {
      const q = questions[current];
      if (q && answers[q._id]) {
        await saveAnswer(attemptId, q._id, answers[q._id]).catch(() => {});
      }
    },
    onSubmitAssessment: handleAutoSubmitWithReason,
  });

  useEffect(() => {
    startAttempt(testId)
      .then((data) => {
        setAttemptId(data.attemptId);
        setTest(data.test);
        setQuestions(data.questions);

        const map = {};
        data.questions.forEach((q) => {
          const existing = data.existingAnswers?.find((a) => String(a.question) === String(q._id));
          map[q._id] = {
            selectedOptionIndex: existing?.selectedOptionIndex ?? null,
            code: existing?.code || STARTER[q.languages?.[0] || "python"] || "",
            language: existing?.language || q.languages?.[0] || "python",
          };
        });
        setAnswers(map);

        const remaining = Math.max(0, Math.floor((new Date(data.endsAt) - new Date()) / 1000));
        setRemainingSec(remaining);
      })
      .catch((e) => setError(e.response?.data?.message || "Could not start this test"))
      .finally(() => setLoading(false));
  }, [testId]);

  // Countdown timer auto-submits at 0
  useEffect(() => {
    if (loading || error || terminated) return;
    if (remainingSec <= 0) {
      handleSubmit("Time Expired");
      return;
    }
    const t = setTimeout(() => setRemainingSec((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [remainingSec, loading, error, terminated, handleSubmit]);

  const scheduleSave = (questionId, patch) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], ...patch } }));
    clearTimeout(saveTimers.current[questionId]);
    saveTimers.current[questionId] = setTimeout(() => {
      const merged = { ...answers[questionId], ...patch };
      saveAnswer(attemptId, questionId, merged).catch(() => {});
    }, 600);
  };

  const handleRunSample = async (question) => {
    setRunning(true);
    try {
      const { results } = await runSample(attemptId, question._id, {
        code: answers[question._id]?.code,
        language: answers[question._id]?.language,
      });
      setSampleResults((prev) => ({ ...prev, [question._id]: results }));
    } catch (e) {
      alert(e.response?.data?.message || "Could not run code execution");
    } finally {
      setRunning(false);
    }
  };

  const toggleReview = (questionId) => {
    setMarkedForReview((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <div className="text-sm font-medium text-slate-600">Initializing Proctored Test Environment...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md text-center bg-white border border-slate-200 p-8 rounded-2xl shadow-xl">
          <ShieldAlert size={40} className="text-rose-600 mx-auto mb-4" />
          <div className="text-base font-bold text-slate-900 mb-2">{error}</div>
          <button
            onClick={() => navigate("/student")}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-2.5 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (terminated) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
        <div className="max-w-lg text-center bg-white border border-slate-200 p-8 sm:p-10 rounded-2xl shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto mb-4">
            <ShieldAlert size={32} />
          </div>
          <div className="font-mono text-xs font-bold uppercase tracking-widest text-rose-600 mb-2">
            Test Integrity Flagged
          </div>
          <h1 className="font-display text-2xl font-bold mb-3 text-slate-900">Test Automatically Submitted</h1>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6">
            This attempt was submitted automatically due to repeated integrity violations detected by the proctoring engine (e.g. exiting fullscreen mode, switching windows, or face detection anomalies).
          </p>
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-3 font-bold text-xs transition-all shadow-xs cursor-pointer"
            onClick={() => navigate(`/student/result/${attemptId}`, { state: terminated })}
          >
            View Result Details
          </button>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const ans = answers[q?._id] || {};
  const answeredCount = questions.filter((qq) => {
    const a = answers[qq._id];
    return qq.type === "mcq"
      ? a?.selectedOptionIndex !== null && a?.selectedOptionIndex !== undefined
      : !!a?.code?.trim();
  }).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navigation Header */}
      <TestHeader
        title={test?.title}
        mode="exam"
        remainingSec={remainingSec}
        totalQuestions={questions.length}
        answeredCount={answeredCount}
        fontSize={fontSize}
        setFontSize={setFontSize}
        isProctored={true}
      />

      {/* Official Placement Test Section Navigation Tabs */}
      {test?.testType === "placement" && test?.sections && test?.sections.length > 0 && (
        <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-2.5 flex items-center gap-2 overflow-x-auto shadow-2xs">
          <span className="text-xs font-mono uppercase tracking-wider text-indigo-700 font-bold mr-2 shrink-0">
            Sections:
          </span>
          {test.sections.map((sec, secIdx) => {
            const secQIds = (sec.questions || []).map((q) => (typeof q === "object" ? q._id : q));
            const startQIndex = questions.findIndex((q) => secQIds.includes(q._id));
            const isActiveSec = current >= startQIndex && (secIdx === test.sections.length - 1 || current < questions.findIndex((q) => (test.sections[secIdx + 1]?.questions || []).map((x) => (typeof x === "object" ? x._id : x)).includes(q._id)));

            return (
              <button
                key={sec._id || secIdx}
                onClick={() => {
                  if (startQIndex !== -1) setCurrent(startQIndex);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                  isActiveSec
                    ? "bg-indigo-600 text-white shadow-2xs font-bold"
                    : "bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                <span>{sec.name}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${isActiveSec ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                  {sec.questionCount || secQIds.length} Qs
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row bg-slate-50">
        {/* Sidebar Question Palette Navigator */}
        <QuestionPalette
          questions={questions}
          answers={answers}
          markedForReview={markedForReview}
          current={current}
          onSelectQuestion={(idx) => setCurrent(idx)}
          onSubmitClick={() => setShowSubmitModal(true)}
          submitting={submitting}
        />

        {/* Question Display Workspace */}
        <main className="flex-1 bg-slate-50 p-4 sm:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Active Question Card */}
            <QuestionCard
              question={q}
              questionIndex={current}
              totalQuestions={questions.length}
              answer={ans}
              onSaveAnswer={(patch) => scheduleSave(q._id, patch)}
              isMarkedForReview={!!markedForReview[q._id]}
              onToggleReview={() => toggleReview(q._id)}
              fontSize={fontSize}
              isPracticeMode={false}
              sampleResults={sampleResults[q._id]}
              runningSample={running}
              onRunSample={handleRunSample}
            />

            {/* Bottom Next / Prev Controls */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
              <button
                disabled={current === 0}
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                className="bg-white border border-slate-200 hover:border-slate-300 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40 transition-all flex items-center gap-2 shadow-2xs cursor-pointer"
              >
                <ArrowLeft size={16} /> Previous Question
              </button>

              {current < questions.length - 1 ? (
                <button
                  onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  Save & Next <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  Review & Submit <CheckCircle2 size={16} />
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Confirmation Modal before Submit */}
      <SubmitConfirmModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={() => handleSubmit("Manual Submission")}
        questions={questions}
        answers={answers}
        markedForReview={markedForReview}
        submitting={submitting}
      />

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
