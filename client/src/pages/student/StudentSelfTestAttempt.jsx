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
  Clock, Bookmark, FileText, CheckCircle2, XCircle, AlertCircle,
  HelpCircle, ArrowLeft, ArrowRight, Play, Sparkles, Trophy, Zap, Award,
  Code, ChevronRight, MessageSquare
} from "lucide-react";

const LANGUAGE_LABEL = { java: "Java", python: "Python", cpp: "C++" };

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
  const [current, setCurrent] = useState(0);
  const [remainingSec, setRemainingSec] = useState(0);
  const [sampleResults, setSampleResults] = useState({});
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);

  // Practice mode states
  const [revealedAnswers, setRevealedAnswers] = useState({});
  const [bookmarks, setBookmarks] = useState({});
  const [activeNoteDrawer, setActiveNoteDrawer] = useState(false);
  const [noteInput, setNoteInput] = useState("");

  const saveTimers = useRef({});

  useEffect(() => {
    getSelfTestAttempt(id)
      .then((data) => {
        setAttempt(data.attempt);
        setQuestions(data.questions);
        setBookmarks(data.bookmarks || {});

        const map = {};
        data.questions.forEach((q) => {
          const existing = data.existingAnswers.find((a) => String(a.question) === String(q._id));
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
          const totalSec = data.attempt.config.durationMinutes * 60;
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
      const res = await toggleBookmark({ questionId, note: noteInput });
      setBookmarks((prev) => ({
        ...prev,
        [questionId]: { isBookmarked: res.isBookmarked, note: res.note || "" },
      }));
    } catch (e) {
      alert("Failed to update bookmark");
    }
  };

  const handleSaveNote = async (questionId) => {
    try {
      const res = await saveNote({ questionId, note: noteInput });
      setBookmarks((prev) => ({
        ...prev,
        [questionId]: { ...prev[questionId], isBookmarked: true, note: res.note },
      }));
      setActiveNoteDrawer(false);
    } catch (e) {
      alert("Failed to save note");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <div className="text-sm font-medium text-slate-400">Loading Practice Environment…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="max-w-md text-center bg-slate-800 border border-slate-700 p-8 rounded-3xl">
          <AlertCircle size={36} className="text-rose-500 mx-auto mb-3" />
          <div className="text-base font-bold mb-2">{error}</div>
          <button
            onClick={() => navigate("/student/self-test")}
            className="mt-4 bg-indigo-600 text-white rounded-xl px-5 py-2.5 text-xs font-semibold hover:bg-indigo-700 transition-colors"
          >
            Back to Generator
          </button>
        </div>
      </div>
    );
  }

  // Submitted Summary Modal
  if (submittedResult) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
          
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20 text-white">
            <Trophy size={32} />
          </div>

          <h1 className="font-display text-2xl font-extrabold mb-1">Session Complete!</h1>
          <p className="text-slate-400 text-xs mb-6">Your practice results have been saved to your hub profile.</p>

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
  const ans = answers[q._id] || {};
  const isPracticeMode = attempt.mode === "practice";

  const mm = String(Math.floor(remainingSec / 60)).padStart(2, "0");
  const ss = String(remainingSec % 60).padStart(2, "0");

  const currentBm = bookmarks[q._id] || {};

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar Navigation */}
      <aside className="w-64 shrink-0 bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between">
        <div className="space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10.5px] font-mono font-bold uppercase tracking-wider mb-2">
              {isPracticeMode ? "💡 Practice Mode" : "⏱️ Exam Mode"}
            </div>
            <h2 className="font-display text-sm font-bold text-white truncate">Self-Test Session</h2>
          </div>

          {/* Countdown Clock */}
          <div
            className={`font-mono text-2xl font-bold text-center rounded-2xl p-3.5 border transition-all ${
              remainingSec < 60
                ? "bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse"
                : "bg-slate-800/80 border-slate-700/80 text-indigo-300"
            }`}
          >
            {mm}:{ss}
          </div>

          {/* Questions Grid */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Question Navigator ({questions.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {questions.map((qq, idx) => {
                const a = answers[qq._id];
                const answered =
                  qq.type === "mcq"
                    ? a?.selectedOptionIndex !== null && a?.selectedOptionIndex !== undefined
                    : !!a?.code?.trim();

                return (
                  <button
                    key={qq._id}
                    onClick={() => {
                      setCurrent(idx);
                      setNoteInput(bookmarks[qq._id]?.note || "");
                    }}
                    className={`w-8 h-8 rounded-xl font-mono text-xs font-bold border transition-all ${
                      idx === current
                        ? "border-indigo-500 bg-indigo-500/30 text-white ring-2 ring-indigo-500/30 scale-105"
                        : answered
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                        : "border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Complete Action */}
        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 font-bold text-xs transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Finish & Grade Session"}
          </button>
        </div>
      </aside>

      {/* Question Content */}
      <main className="flex-1 bg-slate-950 p-6 sm:p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {/* Header Bar */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5 text-xs font-mono">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold px-2.5 py-0.5 rounded-full uppercase">
                Q{current + 1} of {questions.length}
              </span>
              <span className="text-slate-400 capitalize">{q.type}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{q.difficulty}</span>
              <span className="text-slate-500">•</span>
              <span className="text-amber-400 font-semibold">{q.marks} Marks</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleBookmark(q._id)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                  currentBm.isBookmarked
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                    : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700"
                }`}
              >
                <Bookmark size={14} className={currentBm.isBookmarked ? "fill-amber-400 text-amber-400" : ""} />
                {currentBm.isBookmarked ? "Bookmarked" : "Bookmark"}
              </button>

              <button
                onClick={() => {
                  setNoteInput(currentBm.note || "");
                  setActiveNoteDrawer(!activeNoteDrawer);
                }}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 transition-all"
              >
                <MessageSquare size={14} /> Note
              </button>
            </div>
          </div>

          {/* Note Drawer */}
          {activeNoteDrawer && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 space-y-2.5">
              <div className="text-xs font-bold text-amber-400">Personal Note / Reference</div>
              <textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Write formulas, shortcuts, or notes for this question…"
                className="w-full text-xs p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500/60 min-h-[70px]"
              />
              <button
                onClick={() => handleSaveNote(q._id)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs transition-colors"
              >
                Save Note
              </button>
            </div>
          )}

          {/* Question Text Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-lg mb-6">
            <p className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed whitespace-pre-wrap">
              {q.questionText}
            </p>
          </div>

          {/* MCQ Options */}
          {q.type === "mcq" && (
            <div className="space-y-3 mb-6">
              {q.options.map((opt, idx) => {
                const isSelected = ans.selectedOptionIndex === idx;
                const isRevealed = revealedAnswers[q._id];
                const isCorrectOption = q.correctOptionIndex === idx;

                let optionStyle = "border-slate-800/80 bg-slate-900 hover:border-indigo-500/60 text-slate-200";
                if (isSelected) optionStyle = "border-indigo-500 bg-indigo-500/10 text-white font-semibold ring-1 ring-indigo-500/30";

                if (isRevealed) {
                  if (isCorrectOption) {
                    optionStyle = "border-emerald-500 bg-emerald-500/15 text-emerald-200 font-semibold";
                  } else if (isSelected && !isCorrectOption) {
                    optionStyle = "border-rose-500 bg-rose-500/15 text-rose-200 font-semibold";
                  }
                }

                return (
                  <label
                    key={idx}
                    className={`flex items-center gap-3.5 px-5 py-4 rounded-2xl border cursor-pointer transition-all ${optionStyle}`}
                  >
                    <input
                      type="radio"
                      checked={isSelected}
                      onChange={() => scheduleSave(q._id, { selectedOptionIndex: idx })}
                      className="w-4 h-4 accent-indigo-500"
                    />
                    <span className="text-xs sm:text-sm flex-1">{opt}</span>
                    {isRevealed && isCorrectOption && (
                      <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                    )}
                    {isRevealed && isSelected && !isCorrectOption && (
                      <XCircle size={18} className="text-rose-400 shrink-0" />
                    )}
                  </label>
                );
              })}

              {/* Practice Hint Check */}
              {isPracticeMode && (
                <div className="pt-2">
                  <button
                    onClick={() =>
                      setRevealedAnswers((prev) => ({ ...prev, [q._id]: !prev[q._id] }))
                    }
                    className="text-xs font-semibold text-indigo-400 hover:underline flex items-center gap-1.5"
                  >
                    <HelpCircle size={14} />
                    {revealedAnswers[q._id] ? "Hide Solution Check" : "Check Answer & Explanation"}
                  </button>

                  {revealedAnswers[q._id] && (
                    <div className="mt-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4 text-xs text-indigo-200 leading-relaxed font-mono">
                      <strong>Correct Choice:</strong> Option {q.correctOptionIndex + 1} (
                      {q.options[q.correctOptionIndex]})
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Coding Sandbox */}
          {q.type === "coding" && (
            <div className="space-y-4 mb-6">
              <div className="flex gap-2">
                {(q.languages || ["python", "java", "cpp"]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() =>
                      scheduleSave(q._id, {
                        language: lang,
                        code: ans.code?.trim() ? ans.code : STARTER[lang],
                      })
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all capitalize ${
                      ans.language === lang
                        ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                        : "border-slate-800 bg-slate-900 text-slate-400"
                    }`}
                  >
                    {LANGUAGE_LABEL[lang]}
                  </button>
                ))}
              </div>

              {/* Code Editor */}
              <textarea
                value={ans.code || ""}
                onChange={(e) => scheduleSave(q._id, { code: e.target.value })}
                spellCheck={false}
                placeholder="Write your code solution..."
                className="w-full min-h-[260px] font-mono text-xs bg-slate-900 border border-slate-800 rounded-2xl p-4 text-slate-100 outline-none focus:border-indigo-500/60 leading-relaxed resize-y"
              />

              <button
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50"
                onClick={() => handleRunSample(q)}
                disabled={running}
              >
                {running ? "Executing Code..." : "Run against sample cases"}
              </button>

              {/* Execution Feedback */}
              {sampleResults[q._id] && (
                <div className="mt-3 space-y-2">
                  {sampleResults[q._id].map((r, idx) => (
                    <div
                      key={idx}
                      className={`rounded-xl p-3 text-xs font-mono border ${
                        r.passed
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                          : "border-rose-500/40 bg-rose-500/10 text-rose-300"
                      }`}
                    >
                      <div className="font-bold uppercase">
                        Sample {idx + 1} — {r.passed ? "PASSED" : "FAILED"}
                      </div>
                      {!r.passed && (
                        <div className="mt-1 text-[11px]">
                          Expected: {r.expected} | Got: {r.stdout || r.stderr}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Previous / Next Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-800">
            <button
              disabled={current === 0}
              onClick={() => {
                setCurrent((c) => c - 1);
                setNoteInput(bookmarks[questions[current - 1]?._id]?.note || "");
              }}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 disabled:opacity-30 transition-all flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> Previous
            </button>

            <button
              disabled={current === questions.length - 1}
              onClick={() => {
                setCurrent((c) => c + 1);
                setNoteInput(bookmarks[questions[current + 1]?._id]?.note || "");
              }}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 disabled:opacity-30 transition-all flex items-center gap-1.5"
            >
              Next <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
