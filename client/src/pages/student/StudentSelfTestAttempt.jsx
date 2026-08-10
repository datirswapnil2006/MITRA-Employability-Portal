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
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <div className="text-sm font-medium text-slate-600">Loading Practice Sandbox Environment...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md text-center bg-white border border-slate-200 p-8 rounded-2xl shadow-xl">
          <AlertCircle size={36} className="text-rose-600 mx-auto mb-3" />
          <div className="text-base font-bold mb-2 text-slate-900">{error}</div>
          <button
            onClick={() => navigate("/student/self-test")}
            className="mt-4 bg-indigo-600 text-white rounded-xl px-5 py-2.5 text-xs font-bold hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer"
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
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
          {/* Result Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto shadow-2xs text-amber-600">
              <Trophy size={32} />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">🎯 Practice Result</h1>
            <p className="text-slate-600 text-xs sm:text-sm font-medium">
              {topicTitle} &bull; <span className="font-mono text-indigo-600 font-bold">{currentDiff} Difficulty</span>
            </p>
          </div>

          {/* Result Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Score Accuracy</div>
              <div className="text-xl sm:text-2xl font-extrabold text-indigo-600">{submittedResult.percentage}%</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">{submittedResult.totalScore} / {submittedResult.maxScore} Marks</div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Correct Questions</div>
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-600">{correctCount} / {questions.length}</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Answered</div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 mb-1">XP Earned</div>
              <div className="text-xl sm:text-2xl font-extrabold text-amber-600 flex items-center justify-center gap-1">
                <Zap size={18} /> +{submittedResult.xpEarned}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Level Updated</div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Readiness Index</div>
              <div className="text-xl sm:text-2xl font-extrabold text-indigo-700">{submittedResult.readinessScore || 75}%</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Profile Updated</div>
            </div>
          </div>

          {/* XP Breakdown Card */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-2">
            <div className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <Zap size={15} /> XP Breakdown
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1 text-slate-700">
              <div>Completed Session: <strong className="text-slate-900">+{baseXP} XP</strong></div>
              <div>Score Bonus: <strong className="text-slate-900">+{scoreBonusXP} XP</strong></div>
              <div className="text-amber-800 font-bold">Total: +{submittedResult.xpEarned} XP</div>
            </div>
          </div>

          {/* Strengths & Weaknesses Analysis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-1">
              <span className="font-bold text-emerald-800 uppercase tracking-wider text-[11px] block">Strength</span>
              <p className="text-emerald-950 font-medium">{submittedResult.percentage >= 70 ? `${topicTitle} Problem Solving` : "Attempting Practice Drills Regularly"}</p>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-1">
              <span className="font-bold text-rose-800 uppercase tracking-wider text-[11px] block">Needs Improvement</span>
              <p className="text-rose-950 font-medium">{submittedResult.percentage < 70 ? `${topicTitle} Time & Accuracy` : "Speed under timed conditions"}</p>
            </div>
          </div>

          {/* Unlocked Achievements */}
          {submittedResult.unlockedAchievements && submittedResult.unlockedAchievements.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Award size={16} /> New Achievements Unlocked!
              </div>
              {submittedResult.unlockedAchievements.map((ach) => (
                <div key={ach.key} className="text-xs text-slate-800">
                  🏆 <strong>{ach.title}</strong> — {ach.description}
                </div>
              ))}
            </div>
          )}

          {/* Detailed Question Review Mode */}
          {reviewMode && (
            <div className="text-left space-y-4 pt-4 border-t border-slate-200 max-h-80 overflow-y-auto pr-2">
              <h3 className="font-bold text-sm text-indigo-700">Question Answer Key & Explanations:</h3>
              {questions.map((question, idx) => {
                const ans = submittedResult.answers?.find((a) => String(a.question) === String(question._id)) || {};
                const isCorrect = ans.isCorrect;
                return (
                  <div key={question._id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-600">Q{idx + 1}. ({question.type?.toUpperCase()})</span>
                      <span className={`font-bold px-2 py-0.5 rounded-full ${isCorrect ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-rose-100 text-rose-800 border border-rose-200"}`}>
                        {isCorrect ? "Correct" : "Incorrect / Unanswered"}
                      </span>
                    </div>
                    <p className="font-medium text-slate-900">{question.questionText}</p>
                    {question.explanation && (
                      <div className="text-slate-700 text-[11px] bg-white p-2.5 rounded-xl border border-slate-200 font-mono">
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
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl py-3 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Eye size={15} /> {reviewMode ? "Hide Answers" : "Review Answers"}
              </button>

              <button
                onClick={() => handleQuickGenerate(topicTitle, currentDiff)}
                disabled={generatingNext}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 font-bold text-xs transition-colors shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {generatingNext ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
                Generate Similar Test
              </button>

              <button
                onClick={() => handleQuickGenerate(topicTitle, "Medium")}
                disabled={generatingNext}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-3 font-bold text-xs transition-colors shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Target size={15} /> Practice Weak Topic
              </button>
            </div>

            <button
              onClick={() => navigate("/student/practice")}
              className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl py-3 font-bold text-xs transition-colors cursor-pointer"
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
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
      <div className="flex-1 flex flex-col lg:flex-row bg-slate-50">
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
        <main className="flex-1 bg-slate-50 p-4 sm:p-8 overflow-y-auto">
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
