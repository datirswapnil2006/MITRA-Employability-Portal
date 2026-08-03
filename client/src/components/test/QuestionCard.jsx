import { useState } from "react";
import CodeEditor from "./CodeEditor";
import {
  Bookmark,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  HelpCircle,
  Code,
  FileText,
  Sparkles,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";

export default function QuestionCard({
  question,
  questionIndex,
  totalQuestions,
  answer = {},
  onSaveAnswer,
  isMarkedForReview = false,
  onToggleReview,
  fontSize = "base",
  isPracticeMode = false,
  sampleResults = null,
  runningSample = false,
  onRunSample,
  // Optional practice mode props
  currentBookmark = {},
  onToggleBookmark,
  onSaveNote,
}) {
  const [revealedSolution, setRevealedSolution] = useState(false);
  const [noteDrawer, setNoteDrawer] = useState(false);
  const [noteInput, setNoteInput] = useState(currentBookmark.note || "");

  if (!question) return null;

  const fontSizes = {
    sm: "text-xs leading-relaxed",
    base: "text-sm sm:text-base leading-relaxed",
    lg: "text-base sm:text-lg leading-relaxed",
  };

  const difficultyColors = {
    easy: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    medium: "bg-amber-500/15 border-amber-500/30 text-amber-400",
    hard: "bg-rose-500/15 border-rose-500/30 text-rose-400",
  };

  const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

  // Formatter for question text to highlight inline code blocks
  const renderQuestionText = (text) => {
    if (!text) return null;
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const codeContent = part.slice(3, -3).replace(/^[a-z]+\n/, "");
        return (
          <pre
            key={index}
            className="my-3 p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-indigo-300 overflow-x-auto"
          >
            <code>{codeContent}</code>
          </pre>
        );
      }
      return (
        <span key={index} className="whitespace-pre-wrap">
          {part}
        </span>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Meta Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        {/* Question Info Badges */}
        <div className="flex items-center gap-2.5 text-xs font-mono">
          <span className="bg-indigo-600 text-white font-bold px-3 py-1 rounded-xl shadow-sm">
            Question {questionIndex + 1} of {totalQuestions}
          </span>
          <span className="bg-slate-800 border border-slate-700 text-slate-300 font-semibold px-2.5 py-1 rounded-xl uppercase">
            {question.type === "mcq" ? "Multiple Choice" : "Coding Problem"}
          </span>
          <span
            className={`border font-semibold px-2.5 py-1 rounded-xl capitalize ${
              difficultyColors[question.difficulty?.toLowerCase()] || difficultyColors.medium
            }`}
          >
            {question.difficulty || "Medium"}
          </span>
          <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold px-2.5 py-1 rounded-xl">
            +{question.marks || 1} Marks
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Mark for Review Button */}
          <button
            onClick={onToggleReview}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
              isMarkedForReview
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm"
                : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            <Bookmark size={14} className={isMarkedForReview ? "fill-amber-400 text-amber-400" : ""} />
            {isMarkedForReview ? "Flagged for Review" : "Mark for Review"}
          </button>

          {/* Clear Response Button (for MCQ) */}
          {question.type === "mcq" && answer.selectedOptionIndex !== null && answer.selectedOptionIndex !== undefined && (
            <button
              onClick={() => onSaveAnswer({ selectedOptionIndex: null })}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-all"
            >
              Clear Choice
            </button>
          )}

          {/* Practice Note Button */}
          {isPracticeMode && onSaveNote && (
            <button
              onClick={() => setNoteDrawer(!noteDrawer)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 transition-all"
            >
              <MessageSquare size={14} /> Notes
            </button>
          )}
        </div>
      </div>

      {/* Note Drawer (Practice Mode) */}
      {isPracticeMode && noteDrawer && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-2.5">
          <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
            <MessageSquare size={14} /> Personal Note / Formula Reference
          </div>
          <textarea
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="Save notes or formulas for this question..."
            className="w-full text-xs p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 outline-none focus:border-amber-500/60 min-h-[70px]"
          />
          <button
            onClick={() => {
              onSaveNote(question._id, noteInput);
              setNoteDrawer(false);
            }}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs transition-colors"
          >
            Save Note
          </button>
        </div>
      )}

      {/* Question Text Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-lg">
        <div className={`font-medium text-slate-100 ${fontSizes[fontSize]}`}>
          {renderQuestionText(question.questionText)}
        </div>
      </div>

      {/* MCQ Options Rendering */}
      {question.type === "mcq" && (
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
            Select one option:
          </div>

          <div className="grid grid-cols-1 gap-3">
            {question.options.map((opt, idx) => {
              const isSelected = answer.selectedOptionIndex === idx;
              const isRevealed = revealedSolution;
              const isCorrectChoice = question.correctOptionIndex === idx;

              let optionStyle =
                "border-slate-800/80 bg-slate-900 hover:border-indigo-500/50 hover:bg-slate-900/90 text-slate-200";

              if (isSelected) {
                optionStyle =
                  "border-indigo-500 bg-indigo-500/10 text-white font-semibold ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/5";
              }

              if (isRevealed) {
                if (isCorrectChoice) {
                  optionStyle = "border-emerald-500 bg-emerald-500/15 text-emerald-200 font-semibold ring-2 ring-emerald-500/30";
                } else if (isSelected && !isCorrectChoice) {
                  optionStyle = "border-rose-500 bg-rose-500/15 text-rose-200 font-semibold ring-2 ring-rose-500/30";
                }
              }

              return (
                <label
                  key={idx}
                  onClick={() => onSaveAnswer({ selectedOptionIndex: idx })}
                  className={`group flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${optionStyle}`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl font-mono text-xs font-bold flex items-center justify-center shrink-0 border transition-all ${
                      isSelected
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-slate-800 border-slate-700 text-slate-400 group-hover:border-indigo-500/60 group-hover:text-indigo-300"
                    }`}
                  >
                    {OPTION_LETTERS[idx] || idx + 1}
                  </div>

                  <span className={`flex-1 pt-0.5 ${fontSizes[fontSize]}`}>{opt}</span>

                  {isRevealed && isCorrectChoice && (
                    <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  {isRevealed && isSelected && !isCorrectChoice && (
                    <XCircle size={20} className="text-rose-400 shrink-0 mt-0.5" />
                  )}
                </label>
              );
            })}
          </div>

          {/* Practice Explanation Toggle */}
          {isPracticeMode && (
            <div className="pt-2">
              <button
                onClick={() => setRevealedSolution(!revealedSolution)}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/30 px-3.5 py-2 rounded-xl transition-all"
              >
                <HelpCircle size={15} />
                {revealedSolution ? "Hide Solution Explanation" : "Check Answer & Explanation"}
              </button>

              {revealedSolution && (
                <div className="mt-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4 text-xs text-indigo-200 leading-relaxed font-mono space-y-1">
                  <div>
                    <strong>Correct Choice:</strong> Option {OPTION_LETTERS[question.correctOptionIndex]} (
                    {question.options[question.correctOptionIndex]})
                  </div>
                  {question.explanation && (
                    <div className="pt-2 border-t border-indigo-500/20 text-slate-300 font-sans text-xs">
                      <strong>Explanation:</strong> {question.explanation}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Coding Question Interface */}
      {question.type === "coding" && (
        <div className="space-y-5">
          <CodeEditor
            code={answer.code || ""}
            language={answer.language || question.languages?.[0] || "python"}
            availableLanguages={question.languages || ["python", "java", "cpp"]}
            onChangeCode={(newCode) => onSaveAnswer({ code: newCode })}
            onChangeLanguage={(newLang) => onSaveAnswer({ language: newLang })}
          />

          {/* Run Code Control */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => onRunSample(question)}
              disabled={runningSample}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl px-5 py-2.5 text-xs font-bold transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Play size={14} className={runningSample ? "animate-spin" : "fill-current"} />
              {runningSample ? "Executing Code..." : "Run against sample test cases"}
            </button>
          </div>

          {/* Sample Test Case Execution Feedback */}
          {sampleResults && (
            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Execution Results
              </div>

              {sampleResults.map((res, idx) => {
                const isPassed = res.passed;
                const statusText = isPassed
                  ? "PASSED"
                  : res.outcome === "compile_error"
                  ? "COMPILATION ERROR"
                  : res.outcome === "runtime_error"
                  ? "RUNTIME ERROR"
                  : res.outcome === "timeout"
                  ? "TIME LIMIT EXCEEDED"
                  : "WRONG ANSWER";

                return (
                  <div
                    key={idx}
                    className={`rounded-2xl border overflow-hidden transition-all ${
                      isPassed
                        ? "border-emerald-500/40 bg-emerald-500/10"
                        : "border-rose-500/40 bg-rose-500/10"
                    }`}
                  >
                    <div
                      className={`px-4 py-2.5 font-mono text-xs font-bold uppercase flex items-center justify-between ${
                        isPassed ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {isPassed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        Sample Case {idx + 1} — {statusText}
                      </span>
                    </div>

                    {!isPassed && (
                      <div className="p-4 space-y-3 font-mono text-xs">
                        {res.stderr ? (
                          <div>
                            <div className="text-slate-400 mb-1 text-[11px] font-bold">Compiler Error Log:</div>
                            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-rose-300 overflow-x-auto whitespace-pre-wrap">
                              {res.stderr}
                            </pre>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <div className="text-slate-400 mb-1 text-[11px] font-bold">Expected Output:</div>
                              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                                {res.expected || "(empty)"}
                              </pre>
                            </div>
                            <div>
                              <div className="text-slate-400 mb-1 text-[11px] font-bold">Your Output:</div>
                              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-rose-300 overflow-x-auto whitespace-pre-wrap">
                                {res.stdout || "(empty)"}
                              </pre>
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
    </div>
  );
}
