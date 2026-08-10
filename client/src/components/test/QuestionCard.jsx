import { useState } from "react";
import CodeEditor from "./CodeEditor";
import {
  Bookmark,
  CheckCircle2,
  XCircle,
  Play,
  HelpCircle,
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
    easy: "bg-emerald-50 border-emerald-200 text-emerald-700",
    medium: "bg-amber-50 border-amber-200 text-amber-800",
    hard: "bg-rose-50 border-rose-200 text-rose-700",
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
            className="my-3 p-4 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs text-indigo-300 overflow-x-auto"
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
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        {/* Question Info Badges */}
        <div className="flex items-center gap-2.5 text-xs font-mono">
          <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold px-3 py-1 rounded-xl shadow-2xs">
            Question {questionIndex + 1} of {totalQuestions}
          </span>
          <span className="bg-slate-100 border border-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded-xl uppercase">
            {question.type === "mcq" ? "Multiple Choice" : "Coding Problem"}
          </span>
          <span
            className={`border font-semibold px-2.5 py-1 rounded-xl capitalize ${
              difficultyColors[question.difficulty?.toLowerCase()] || difficultyColors.medium
            }`}
          >
            {question.difficulty || "Medium"}
          </span>
          <span className="bg-slate-100 border border-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded-xl">
            +{question.marks || 1} Marks
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Mark for Review Button */}
          <button
            onClick={onToggleReview}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              isMarkedForReview
                ? "bg-amber-50 border-amber-300 text-amber-800 shadow-2xs"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
            }`}
          >
            <Bookmark size={14} className={isMarkedForReview ? "fill-amber-600 text-amber-600" : ""} />
            {isMarkedForReview ? "Flagged for Review" : "Mark for Review"}
          </button>

          {/* Clear Response Button (for MCQ) */}
          {question.type === "mcq" && answer.selectedOptionIndex !== null && answer.selectedOptionIndex !== undefined && (
            <button
              onClick={() => onSaveAnswer({ selectedOptionIndex: null })}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-rose-600 hover:border-rose-300 transition-all cursor-pointer"
            >
              Clear Choice
            </button>
          )}

          {/* Practice Note Button */}
          {isPracticeMode && onSaveNote && (
            <button
              onClick={() => setNoteDrawer(!noteDrawer)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-slate-300 transition-all cursor-pointer"
            >
              <MessageSquare size={14} /> Notes
            </button>
          )}
        </div>
      </div>

      {/* Note Drawer (Practice Mode) */}
      {isPracticeMode && noteDrawer && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2.5">
          <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
            <MessageSquare size={14} /> Personal Note / Formula Reference
          </div>
          <textarea
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="Save notes or formulas for this question..."
            className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-amber-500 min-h-[70px]"
          />
          <button
            onClick={() => {
              onSaveNote(question._id, noteInput);
              setNoteDrawer(false);
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
          >
            Save Note
          </button>
        </div>
      )}

      {/* Question Text Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className={`font-medium text-slate-900 ${fontSizes[fontSize]}`}>
          {renderQuestionText(question.questionText)}
        </div>
      </div>

      {/* MCQ Options Rendering */}
      {question.type === "mcq" && (
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-1">
            Select one option:
          </div>

          <div className="grid grid-cols-1 gap-3">
            {question.options.map((opt, idx) => {
              const isSelected = answer.selectedOptionIndex === idx;
              const isRevealed = revealedSolution;
              const isCorrectChoice = question.correctOptionIndex === idx;

              let optionStyle =
                "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 text-slate-900";

              if (isSelected) {
                optionStyle =
                  "border-indigo-600 bg-indigo-50/60 text-slate-900 font-semibold ring-2 ring-indigo-600/20 shadow-xs";
              }

              if (isRevealed) {
                if (isCorrectChoice) {
                  optionStyle = "border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold ring-2 ring-emerald-600/20";
                } else if (isSelected && !isCorrectChoice) {
                  optionStyle = "border-rose-600 bg-rose-50 text-rose-950 font-semibold ring-2 ring-rose-600/20";
                }
              }

              return (
                <label
                  key={idx}
                  onClick={() => onSaveAnswer({ selectedOptionIndex: idx })}
                  className={`group flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${optionStyle}`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl font-mono text-xs font-bold flex items-center justify-center shrink-0 border transition-all ${
                      isSelected
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 group-hover:border-indigo-400 group-hover:text-indigo-700"
                    }`}
                  >
                    {OPTION_LETTERS[idx] || idx + 1}
                  </div>

                  <span className={`flex-1 pt-0.5 ${fontSizes[fontSize]}`}>{opt}</span>

                  {isRevealed && isCorrectChoice && (
                    <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  {isRevealed && isSelected && !isCorrectChoice && (
                    <XCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
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
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
              >
                <HelpCircle size={15} />
                {revealedSolution ? "Hide Solution Explanation" : "Check Answer & Explanation"}
              </button>

              {revealedSolution && (
                <div className="mt-3 bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-xs text-indigo-950 leading-relaxed font-mono space-y-1">
                  <div>
                    <strong>Correct Choice:</strong> Option {OPTION_LETTERS[question.correctOptionIndex]} (
                    {question.options[question.correctOptionIndex]})
                  </div>
                  {question.explanation && (
                    <div className="pt-2 border-t border-indigo-200 text-slate-700 font-sans text-xs">
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
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-2.5 text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Play size={14} className={runningSample ? "animate-spin" : "fill-current"} />
              {runningSample ? "Executing Code..." : "Run against sample test cases"}
            </button>
          </div>

          {/* Sample Test Case Execution Feedback */}
          {sampleResults && (
            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
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
                        ? "border-emerald-200 bg-emerald-50/50"
                        : "border-rose-200 bg-rose-50/50"
                    }`}
                  >
                    <div
                      className={`px-4 py-2.5 font-mono text-xs font-bold uppercase flex items-center justify-between ${
                        isPassed ? "text-emerald-800 bg-emerald-100/60" : "text-rose-800 bg-rose-100/60"
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
                            <div className="text-slate-600 mb-1 text-[11px] font-bold">Compiler Error Log:</div>
                            <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-rose-300 overflow-x-auto whitespace-pre-wrap">
                              {res.stderr}
                            </pre>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <div className="text-slate-600 mb-1 text-[11px] font-bold">Expected Output:</div>
                              <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                                {res.expected || "(empty)"}
                              </pre>
                            </div>
                            <div>
                              <div className="text-slate-600 mb-1 text-[11px] font-bold">Your Output:</div>
                              <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-rose-300 overflow-x-auto whitespace-pre-wrap">
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
