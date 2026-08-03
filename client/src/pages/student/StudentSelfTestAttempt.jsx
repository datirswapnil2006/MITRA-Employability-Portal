import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getSelfTestAttempt,
  saveSelfTestAnswer,
  submitSelfTest,
  toggleBookmark,
  saveNote,
} from "../../api/selfTest";
import { runSample } from "../../api/tests";
import {
  Trophy, Zap, Award, AlertCircle, ArrowLeft, ArrowRight, CheckCircle2
} from "lucide-react";

// Modern Test Components
import TestHeader from "../../components/test/TestHeader";
import QuestionPalette from "../../components/test/QuestionPalette";
import QuestionCard from "../../components/test/QuestionCard";
import SubmitConfirmModal from "../../components/test/SubmitConfirmModal";

const STARTER = {
  python: "# write your solution here\n",
  java: "// write your solution here\npublic class Main {\n    public static void main(String[] args) {\n\n    }\n}\n",
  cpp: "// write your solution here\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n\n    return 0;\n}\n",
};

export default function StudentSelfTestAttempt() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [current, setCurrent] = useState(0);
  const [remainingSec, setRemainingSec] = useState(0);
  const [sampleResults, setSampleResults] = useState({});
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);
  const [bookmarks, setBookmarks] = useState({});
  const [fontSize, setFontSize] = useState("base");
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const saveTimers = useRef({});

  useEffect(() => {
    getSelfTestAttempt(id)
      .then((data) => {
        setAttempt(data.attempt);
        setQuestions(data.questions);
        setBookmarks(data.bookmarks || {});

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

        if (data.attempt.status === "completed") {
          setSubmittedResult(data.attempt);
        } else {
          const elapsed = Math.floor((new Date() - new Date(data.attempt.startedAt)) / 1000);
          const totalSec = (data.attempt.config?.durationMinutes || 30) * 60;
          setRemainingSec(Math.max(0, totalSec - elapsed));
        }
      })
      .catch((e) => setError(e.response?.data?.message || "Could not load practice session"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = useCallback(async () => {
    if (!id || submitting) return;
    setSubmitting(true);

    try {
      const payloadAnswers = Object.entries(answers).map(([qId, a]) => ({
        question: qId,
        selectedOptionIndex: a.selectedOptionIndex,
        code: a.code,
        language: a.language,
      }));

      const res = await submitSelfTest(id, { answers: payloadAnswers });
      setSubmittedResult(res);
    } catch (e) {
      alert(e.response?.data?.message || "Could not submit self-test");
      setSubmitting(false);
    }
  }, [id, submitting, answers]);

  // Countdown timer
  useEffect(() => {
    if (loading || error || submittedResult || !attempt) return;
    if (remainingSec <= 0 && attempt.mode === "exam") {
      handleSubmit();
      return;
    }
    const t = setTimeout(() => setRemainingSec((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [remainingSec, loading, error, submittedResult, attempt, handleSubmit]);

  const scheduleSave = (questionId, patch) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], ...patch } }));
    clearTimeout(saveTimers.current[questionId]);
    saveTimers.current[questionId] = setTimeout(() => {
      const merged = { ...answers[questionId], ...patch };
      saveSelfTestAnswer(id, {
        questionId,
        selectedOptionIndex: merged.selectedOptionIndex,
        code: merged.code,
        language: merged.language,
      }).catch(() => {});
    }, 600);
  };

  const handleRunSample = async (question) => {
    setRunning(true);
    try {
      const { results } = await runSample(id, question._id, {
        code: answers[question._id]?.code,
        language: answers[question._id]?.language,
      });
      setSampleResults((prev) => ({ ...prev, [question._id]: results }));
    } catch (e) {
      alert(e.response?.data?.message || "Could not execute code sample");
    } finally {
      setRunning(false);
    }
  };

  const handleToggleBookmark = async (questionId) => {
    try {
      const res = await toggleBookmark({ questionId });
      setBookmarks((prev) => ({
        ...prev,
        [questionId]: { isBookmarked: res.isBookmarked, note: res.note || "" },
      }));
    } catch (e) {
      alert("Failed to update bookmark");
    }
  };

  const handleSaveNote = async (questionId, noteText) => {
    try {
      const res = await saveNote({ questionId, note: noteText });
      setBookmarks((prev) => ({
        ...prev,
        [questionId]: { ...prev[questionId], isBookmarked: true, note: res.note },
      }));
    } catch (e) {
      alert("Failed to save note");
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
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <div className="text-sm font-medium text-slate-400">Loading Practice Sandbox Environment…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md text-center bg-slate-900 border border-slate-800 p-8 rounded-3xl">
          <AlertCircle size={36} className="text-rose-500 mx-auto mb-3" />
          <div className="text-base font-bold mb-2 text-white">{error}</div>
          <button
            onClick={() => navigate("/student/self-test")}
            className="mt-4 bg-indigo-600 text-white rounded-xl px-5 py-2.5 text-xs font-bold hover:bg-indigo-700 transition-colors"
          >
            Back to Practice Generator
          </button>
        </div>
      </div>
    );
  }

  // Submitted Summary Screen
  if (submittedResult) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20 text-white">
            <Trophy size={32} />
          </div>

          <h1 className="font-display text-2xl font-extrabold mb-1">Session Complete!</h1>
          <p className="text-slate-400 text-xs mb-6">Your practice performance has been recorded to your readiness profile.</p>

          <div className="grid grid-cols-2 gap-3.5 mb-6">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 text-center">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Score</div>
              <div className="text-2xl font-extrabold text-indigo-400">
                {submittedResult.totalScore} / {submittedResult.maxScore}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">{submittedResult.percentage}% Accuracy</div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 text-center">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">XP Earned</div>
              <div className="text-2xl font-extrabold text-amber-400 flex items-center justify-center gap-1">
                <Zap size={20} /> +{submittedResult.xpEarned}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">Readiness: {submittedResult.readinessScore}%</div>
            </div>
          </div>

          {submittedResult.unlockedAchievements && submittedResult.unlockedAchievements.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 text-left space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Award size={16} /> New Achievements Unlocked!
              </div>
              {submittedResult.unlockedAchievements.map((ach) => (
                <div key={ach.key} className="text-xs text-slate-200">
                  🏆 <strong>{ach.title}</strong> — {ach.description}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/student/self-test/hub")}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 font-bold text-xs transition-colors shadow-lg shadow-indigo-600/20"
            >
              Go to Practice Hub
            </button>
            <button
              onClick={() => navigate("/student/self-test")}
              className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl py-3 font-bold text-xs transition-colors"
            >
              Take Another Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const ans = answers[q?._id] || {};
  const isPracticeMode = attempt?.mode === "practice";

  const answeredCount = questions.filter((qq) => {
    const a = answers[qq._id];
    return qq.type === "mcq"
      ? a?.selectedOptionIndex !== null && a?.selectedOptionIndex !== undefined
      : !!a?.code?.trim();
  }).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header Navigation */}
      <TestHeader
        title={attempt?.title || "Self-Test Practice Session"}
        mode={isPracticeMode ? "practice" : "exam"}
        remainingSec={remainingSec}
        totalQuestions={questions.length}
        answeredCount={answeredCount}
        fontSize={fontSize}
        setFontSize={setFontSize}
        isProctored={false}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar Question Palette */}
        <QuestionPalette
          questions={questions}
          answers={answers}
          markedForReview={markedForReview}
          current={current}
          onSelectQuestion={(idx) => setCurrent(idx)}
          onSubmitClick={() => setShowSubmitModal(true)}
          submitting={submitting}
        />

        {/* Question Workspace */}
        <main className="flex-1 bg-slate-950 p-4 sm:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            <QuestionCard
              question={q}
              questionIndex={current}
              totalQuestions={questions.length}
              answer={ans}
              onSaveAnswer={(patch) => scheduleSave(q._id, patch)}
              isMarkedForReview={!!markedForReview[q._id]}
              onToggleReview={() => toggleReview(q._id)}
              fontSize={fontSize}
              isPracticeMode={isPracticeMode}
              sampleResults={sampleResults[q?._id]}
              runningSample={running}
              onRunSample={handleRunSample}
              currentBookmark={bookmarks[q?._id] || {}}
              onToggleBookmark={handleToggleBookmark}
              onSaveNote={handleSaveNote}
            />

            {/* Bottom Controls */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-800">
              <button
                disabled={current === 0}
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 px-5 py-3 rounded-2xl text-xs font-bold text-slate-300 disabled:opacity-30 transition-all flex items-center gap-2 shadow-sm"
              >
                <ArrowLeft size={16} /> Previous Question
              </button>

              {current < questions.length - 1 ? (
                <button
                  onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                >
                  Save & Next <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-6 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  Finish Session <CheckCircle2 size={16} />
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Confirmation Modal */}
      <SubmitConfirmModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={handleSubmit}
        questions={questions}
        answers={answers}
        markedForReview={markedForReview}
        submitting={submitting}
      />
    </div>
  );
}
