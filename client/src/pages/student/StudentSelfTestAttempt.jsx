import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getSelfTestAttempt,
  saveSelfTestAnswer,
  submitSelfTest,
  generateSelfTest,
  toggleBookmark,
  saveNote,
} from "../../api/selfTest";
import { runSample } from "../../api/tests";
import {
  Trophy, Zap, Award, AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, RefreshCw, Sparkles, Target, Eye
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

  const [reviewMode, setReviewMode] = useState(false);
  const [generatingNext, setGeneratingNext] = useState(false);

  const handleQuickGenerate = async (topicName, diff) => {
    setGeneratingNext(true);
    try {
      const res = await generateSelfTest({
        topics: [topicName],
        difficulty: diff || "Medium",
        questionCount: 10,
        questionType: "Mixed",
        mode: "practice",
      });
      if (res?.attemptId) {
        navigate(`/student/self-test/attempt/${res.attemptId}`);
        window.location.reload();
      }
    } catch (e) {
      alert(e.response?.data?.message || "Could not generate session");
    } finally {
      setGeneratingNext(false);
    }
  };

  // Submitted Summary Screen
  if (submittedResult) {
    const topicTitle = attempt?.config?.topics?.[0] || "AI Practice Test";
    const currentDiff = attempt?.config?.difficulty || "Medium";
    const correctCount = submittedResult.answers
      ? submittedResult.answers.filter((a) => a.isCorrect).length
      : questions.filter((qq) => {
          const a = answers[qq._id];
          return qq.type === "mcq" ? Number(a?.selectedOptionIndex) === Number(qq.correctOptionIndex) : false;
        }).length;

    const baseXP = Math.max(10, Math.floor(submittedResult.xpEarned - Math.floor(submittedResult.percentage / 10)));
    const scoreBonusXP = Math.floor(submittedResult.percentage / 10);

    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Result Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20 text-white">
              <Trophy size={32} />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">🎯 Practice Result</h1>
            <p className="text-slate-400 text-xs sm:text-sm font-medium">
              {topicTitle} &bull; <span className="font-mono text-indigo-400 font-bold">{currentDiff} Difficulty</span>
            </p>
          </div>

          {/* Result Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 text-center">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Score Accuracy</div>
              <div className="text-xl sm:text-2xl font-extrabold text-indigo-400">{submittedResult.percentage}%</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{submittedResult.totalScore} / {submittedResult.maxScore} Marks</div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 text-center">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Correct Questions</div>
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-400">{correctCount} / {questions.length}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Answered</div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 text-center">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 mb-1">XP Earned</div>
              <div className="text-xl sm:text-2xl font-extrabold text-amber-400 flex items-center justify-center gap-1">
                <Zap size={18} /> +{submittedResult.xpEarned}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Level Updated</div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 text-center">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Readiness Index</div>
              <div className="text-xl sm:text-2xl font-extrabold text-violet-400">{submittedResult.readinessScore || 75}%</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Profile Updated</div>
            </div>
          </div>

          {/* XP Breakdown Card */}
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-4 space-y-2">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap size={15} /> XP Breakdown
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1 text-slate-300">
              <div>Completed Session: <strong className="text-white">+{baseXP} XP</strong></div>
              <div>Score Bonus: <strong className="text-white">+{scoreBonusXP} XP</strong></div>
              <div className="text-amber-400 font-bold">Total: +{submittedResult.xpEarned} XP</div>
            </div>
          </div>

          {/* Strengths & Weaknesses Analysis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-2xl p-4 space-y-1">
              <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] block">Strength</span>
              <p className="text-slate-200">{submittedResult.percentage >= 70 ? `${topicTitle} Problem Solving` : "Attempting Practice Drills Regularly"}</p>
            </div>
            <div className="bg-rose-950/30 border border-rose-800/50 rounded-2xl p-4 space-y-1">
              <span className="font-bold text-rose-400 uppercase tracking-wider text-[11px] block">Needs Improvement</span>
              <p className="text-slate-200">{submittedResult.percentage < 70 ? `${topicTitle} Time & Accuracy` : "Speed under timed conditions"}</p>
            </div>
          </div>

          {/* Unlocked Achievements */}
          {submittedResult.unlockedAchievements && submittedResult.unlockedAchievements.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-left space-y-2">
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

          {/* Detailed Question Review Mode */}
          {reviewMode && (
            <div className="text-left space-y-4 pt-4 border-t border-slate-800 max-h-80 overflow-y-auto pr-2">
              <h3 className="font-bold text-sm text-indigo-300">Question Answer Key & Explanations:</h3>
              {questions.map((question, idx) => {
                const ans = submittedResult.answers?.find((a) => String(a.question) === String(question._id)) || {};
                const isCorrect = ans.isCorrect;
                return (
                  <div key={question._id} className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-400">Q{idx + 1}. ({question.type?.toUpperCase()})</span>
                      <span className={`font-bold px-2 py-0.5 rounded-full ${isCorrect ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                        {isCorrect ? "Correct" : "Incorrect / Unanswered"}
                      </span>
                    </div>
                    <p className="font-medium text-white">{question.questionText}</p>
                    {question.explanation && (
                      <div className="text-slate-400 text-[11px] bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 font-mono">
                        💡 <strong>Explanation:</strong> {question.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Action CTAs */}
          <div className="space-y-2.5 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => setReviewMode(!reviewMode)}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl py-3 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Eye size={15} /> {reviewMode ? "Hide Answers" : "Review Answers"}
              </button>

              <button
                onClick={() => handleQuickGenerate(topicTitle, currentDiff)}
                disabled={generatingNext}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 font-bold text-xs transition-colors shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {generatingNext ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
                Generate Similar Test
              </button>

              <button
                onClick={() => handleQuickGenerate(topicTitle, "Medium")}
                disabled={generatingNext}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-3 font-bold text-xs transition-colors shadow-lg shadow-rose-600/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Target size={15} /> Practice Weak Topic
              </button>
            </div>

            <button
              onClick={() => navigate("/student/practice")}
              className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl py-3 font-bold text-xs transition-colors"
            >
              Back to Practice Hub
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
