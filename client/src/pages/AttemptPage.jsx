import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { startAttempt, saveAnswer, runSample, submitAttempt } from "../api/tests";
import useProctoring from "../hooks/useProctoring";

const LANGUAGE_LABEL = { java: "Java", python: "Python", cpp: "C++" };

const STARTER = {
  python: "# write your solution here\n",
  java: "// write your solution here\npublic class Main {\n    public static void main(String[] args) {\n\n    }\n}\n",
  cpp: "// write your solution here\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n\n    return 0;\n}\n",
};

const ghostBtn = "border-[1.5px] border-line rounded px-4 py-2 font-semibold text-[13px] text-ink hover:border-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

export default function AttemptPage() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attemptId, setAttemptId] = useState(null);
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // questionId -> { selectedOptionIndex, code, language }
  const [current, setCurrent] = useState(0);
  const [remainingSec, setRemainingSec] = useState(0);
  const [sampleResults, setSampleResults] = useState({}); // questionId -> results
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [terminated, setTerminated] = useState(null); // { reason, totalScore, maxScore } | null

  const saveTimers = useRef({});

  // Proctoring only activates once we have a real attemptId (i.e. the test
  // has actually started) and stops the moment the page unmounts or submits.
  useProctoring(attemptId, {
    enabled: !loading && !error && !submitting && !terminated,
    onAutoSubmit: (result) => setTerminated(result),
  });

  useEffect(() => {
    startAttempt(testId)
      .then((data) => {
        setAttemptId(data.attemptId);
        setTest(data.test);
        setQuestions(data.questions);

        const map = {};
        data.questions.forEach((q) => {
          const existing = data.existingAnswers.find((a) => a.question === q._id);
          map[q._id] = {
            selectedOptionIndex: existing?.selectedOptionIndex ?? null,
            code: existing?.code || STARTER[q.languages?.[0]] || "",
            language: existing?.language || q.languages?.[0] || null,
          };
        });
        setAnswers(map);

        const remaining = Math.max(0, Math.floor((new Date(data.endsAt) - new Date()) / 1000));
        setRemainingSec(remaining);
      })
      .catch((e) => setError(e.response?.data?.message || "Could not start this test"))
      .finally(() => setLoading(false));
  }, [testId]);

  const handleSubmit = useCallback(async () => {
    if (!attemptId || submitting) return;
    setSubmitting(true);
    try {
      const result = await submitAttempt(attemptId);
      navigate(`/student/result/${attemptId}`, { state: result });
    } catch (e) {
      alert(e.response?.data?.message || "Could not submit test");
      setSubmitting(false);
    }
  }, [attemptId, submitting, navigate]);

  // Countdown timer, auto-submits at zero
  useEffect(() => {
    if (loading || error || terminated) return;
    if (remainingSec <= 0) {
      handleSubmit();
      return;
    }
    const t = setTimeout(() => setRemainingSec((s) => s - 1), 1000);
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
        code: answers[question._id].code,
        language: answers[question._id].language,
      });
      setSampleResults((prev) => ({ ...prev, [question._id]: results }));
    } catch (e) {
      alert(e.response?.data?.message || "Could not run code");
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <div className="p-16 text-on-desk">Loading test…</div>;
  if (error) return <div className="p-16 text-on-desk">{error}</div>;

  if (terminated) {
    return (
      <div className="min-h-screen bg-desk text-on-desk flex items-center justify-center p-8">
        <div className="max-w-lg text-center">
          <div className="font-mono text-[11px] tracking-widest uppercase text-danger mb-4">
            Test Integrity Violation
          </div>
          <h1 className="font-display text-3xl font-semibold mb-4">Your test has been submitted</h1>
          <p className="text-on-desk-soft leading-relaxed mb-3">
            This test was automatically submitted because our proctoring system detected repeated or
            serious violations of test rules (such as leaving full-screen, switching tabs, attempting to
            copy content, or multiple faces being visible on camera).
          </p>
          <p className="text-on-desk-soft text-sm mb-8">
            This has been flagged for the placement cell's review. If you believe this was a mistake,
            contact your placement cell with your ERP number and the time of this test.
          </p>
          <button
            className="bg-accent text-white rounded px-6 py-3 font-semibold text-sm hover:bg-accent-hover transition-colors"
            onClick={() => navigate(`/student/result/${attemptId}`, { state: terminated })}
          >
            View my result
          </button>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const ans = answers[q._id] || {};
  const mm = String(Math.floor(remainingSec / 60)).padStart(2, "0");
  const ss = String(remainingSec % 60).padStart(2, "0");

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 bg-desk-raised p-4 flex flex-col gap-4">
        <div className="font-display text-on-desk text-[15px] font-bold">{test.title}</div>

        <div
          className={`font-mono text-[22px] font-semibold text-center rounded px-3 py-2.5 border ${
            remainingSec < 60
              ? "bg-danger/20 border-danger/45 text-red-300"
              : "bg-accent/20 border-accent/40 text-on-desk"
          }`}
        >
          {mm}:{ss}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {questions.map((qq, idx) => {
            const a = answers[qq._id];
            const answered = qq.type === "mcq" ? a?.selectedOptionIndex !== null && a?.selectedOptionIndex !== undefined : !!a?.code?.trim();
            return (
              <button
                key={qq._id}
                onClick={() => setCurrent(idx)}
                className={`w-8 h-8 rounded-full font-mono text-xs border-[1.5px] transition-colors ${
                  idx === current
                    ? "border-accent text-on-desk"
                    : answered
                    ? "bg-success/30 border-transparent text-on-desk"
                    : "border-white/15 text-on-desk-soft"
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        <button
          className="bg-accent text-white rounded px-4.5 py-2.5 font-semibold text-[13.5px] hover:bg-accent-hover disabled:opacity-60 transition-colors"
          onClick={() => {
            if (window.confirm("Submit the test now? You cannot change answers after this.")) handleSubmit();
          }}
          disabled={submitting}
        >
          {submitting ? "Submitting…" : "Submit Test"}
        </button>
      </aside>

      <main className="flex-1 bg-surface text-ink p-9 overflow-y-auto">
        <div className="max-w-[760px]">
          <div className="flex gap-3 mb-2.5 font-mono text-[11px] uppercase text-ink-soft">
            <span>Q{current + 1} of {questions.length}</span>
            <span>{q.type === "mcq" ? "Objective" : "Coding"}</span>
            <span>{q.difficulty}</span>
            <span>{q.marks} marks</span>
          </div>
          <p className="text-[17px] leading-relaxed mb-6 whitespace-pre-wrap">{q.questionText}</p>

          {q.type === "mcq" && (
            <div>
              {q.options.map((opt, idx) => (
                <label
                  key={idx}
                  className={`flex items-center gap-3 px-4 py-3.5 border-[1.5px] rounded mb-2.5 cursor-pointer bg-white transition-colors ${
                    ans.selectedOptionIndex === idx ? "border-accent bg-accent/5" : "border-line hover:border-accent"
                  }`}
                >
                  <input
                    type="radio"
                    checked={ans.selectedOptionIndex === idx}
                    onChange={() => scheduleSave(q._id, { selectedOptionIndex: idx })}
                    className="w-4 h-4 accent-accent"
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}

          {q.type === "coding" && (
            <div>
              <div className="flex gap-2.5 mb-3">
                {q.languages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => scheduleSave(q._id, { language: lang, code: ans.code?.trim() ? ans.code : STARTER[lang] })}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border-[1.5px] transition-colors ${
                      ans.language === lang ? "border-accent text-ink bg-accent/5" : "border-line text-ink-soft"
                    }`}
                  >
                    {LANGUAGE_LABEL[lang]}
                  </button>
                ))}
              </div>

              {q.sampleTestCases?.map((tc, idx) => (
                <div key={idx} className="bg-white border border-line rounded px-3.5 py-3 mb-2 font-mono text-[12.5px]">
                  <strong>Sample {idx + 1}</strong><br />
                  Input: {tc.input || "(none)"}<br />
                  Expected output: {tc.output}
                </div>
              ))}

              <textarea
                value={ans.code || ""}
                onChange={(e) => scheduleSave(q._id, { code: e.target.value })}
                spellCheck={false}
                className="w-full min-h-[260px] font-mono text-[13px] bg-desk text-on-desk border-none rounded p-4 leading-relaxed resize-y"
              />

              <div className="mt-2.5">
                <button className={ghostBtn} onClick={() => handleRunSample(q)} disabled={running}>
                  {running ? "Running…" : "Run against sample cases"}
                </button>
              </div>

              {sampleResults[q._id] && (
                <div className="mt-3">
                  {sampleResults[q._id].map((r, idx) => {
                    const label = {
                      passed: "Passed",
                      compile_error: "Compilation Error",
                      runtime_error: "Runtime Error",
                      timeout: "Time Limit Exceeded",
                      wrong_answer: "Wrong Answer",
                    }[r.outcome || (r.passed ? "passed" : "wrong_answer")];

                    return (
                      <div
                        key={idx}
                        className={`rounded mb-2.5 overflow-hidden border ${
                          r.passed ? "border-success/30 bg-success/5" : "border-danger/30 bg-danger/5"
                        }`}
                      >
                        <div
                          className={`px-3.5 py-2 font-mono text-[12px] font-semibold uppercase tracking-wide ${
                            r.passed ? "text-success" : "text-danger"
                          }`}
                        >
                          Sample {idx + 1} — {label}
                        </div>

                        {!r.passed && (
                          <div className="px-3.5 pb-3 space-y-2 text-[12.5px] font-mono">
                            {(r.outcome === "compile_error" || r.outcome === "runtime_error" || r.outcome === "timeout") && r.stderr ? (
                              // Syntax/runtime errors: show the compiler's own message verbatim,
                              // in a monospace block — that's the most useful thing a student can see.
                              <div>
                                <div className="text-ink-soft mb-1">Compiler output:</div>
                                <pre className="whitespace-pre-wrap bg-desk text-red-300 rounded p-2.5 overflow-x-auto">{r.stderr}</pre>
                              </div>
                            ) : (
                              // Wrong answer: show expected vs actual side by side instead of the raw error.
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <div className="text-ink-soft mb-1">Expected:</div>
                                  <pre className="whitespace-pre-wrap bg-white border border-line rounded p-2.5 overflow-x-auto">{r.expected || "(empty)"}</pre>
                                </div>
                                <div>
                                  <div className="text-ink-soft mb-1">Got:</div>
                                  <pre className="whitespace-pre-wrap bg-white border border-line rounded p-2.5 overflow-x-auto">{r.stdout || "(empty)"}</pre>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between mt-7 max-w-[760px]">
            <button className={ghostBtn} disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>
              ← Previous
            </button>
            <button className={ghostBtn} disabled={current === questions.length - 1} onClick={() => setCurrent((c) => c + 1)}>
              Next →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
