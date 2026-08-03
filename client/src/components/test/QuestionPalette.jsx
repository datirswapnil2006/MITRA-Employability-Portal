import { useState } from "react";
import { Check, Bookmark, Circle, Filter, Send } from "lucide-react";

export default function QuestionPalette({
  questions = [],
  answers = {},
  markedForReview = {},
  current = 0,
  onSelectQuestion,
  onSubmitClick,
  submitting = false,
}) {
  const [filter, setFilter] = useState("all"); // "all" | "answered" | "review" | "unanswered"

  // Counts
  let answeredCount = 0;
  let reviewCount = 0;
  let unansweredCount = 0;

  questions.forEach((q) => {
    const a = answers[q._id];
    const isAnswered =
      q.type === "mcq"
        ? a?.selectedOptionIndex !== null && a?.selectedOptionIndex !== undefined
        : !!a?.code?.trim();
    const isReview = !!markedForReview[q._id];

    if (isAnswered) answeredCount++;
    if (isReview) reviewCount++;
    if (!isAnswered) unansweredCount++;
  });

  const filteredQuestions = questions.map((q, idx) => ({ q, idx })).filter(({ q }) => {
    const a = answers[q._id];
    const isAnswered =
      q.type === "mcq"
        ? a?.selectedOptionIndex !== null && a?.selectedOptionIndex !== undefined
        : !!a?.code?.trim();
    const isReview = !!markedForReview[q._id];

    if (filter === "answered") return isAnswered;
    if (filter === "review") return isReview;
    if (filter === "unanswered") return !isAnswered;
    return true;
  });

  return (
    <aside className="w-full lg:w-72 shrink-0 bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between h-[calc(100vh-65px)] sticky top-[65px]">
      <div className="space-y-5 overflow-y-auto">
        {/* Navigator Header */}
        <div>
          <h2 className="font-display text-sm font-bold text-white uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
            <span>Question Navigator</span>
            <span className="font-mono text-xs font-semibold text-slate-300">
              {questions.length} Questions
            </span>
          </h2>

          {/* Status Counter Chips */}
          <div className="grid grid-cols-2 gap-2 mb-4 text-xs font-mono">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2 flex items-center justify-between">
              <span className="text-emerald-400 flex items-center gap-1.5">
                <Check size={13} /> Answered
              </span>
              <span className="font-bold text-white">{answeredCount}</span>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2 flex items-center justify-between">
              <span className="text-amber-400 flex items-center gap-1.5">
                <Bookmark size={13} /> Review
              </span>
              <span className="font-bold text-white">{reviewCount}</span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-2 flex items-center justify-between col-span-2">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Circle size={13} /> Unanswered
              </span>
              <span className="font-bold text-white">{unansweredCount}</span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 mb-4 text-xs font-medium">
            <button
              onClick={() => setFilter("all")}
              className={`flex-1 py-1 text-center rounded-lg transition-colors ${
                filter === "all" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("answered")}
              className={`flex-1 py-1 text-center rounded-lg transition-colors ${
                filter === "answered" ? "bg-emerald-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Done ({answeredCount})
            </button>
            <button
              onClick={() => setFilter("review")}
              className={`flex-1 py-1 text-center rounded-lg transition-colors ${
                filter === "review" ? "bg-amber-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Flag ({reviewCount})
            </button>
          </div>
        </div>

        {/* Questions Grid */}
        <div>
          <div className="grid grid-cols-5 gap-2.5">
            {filteredQuestions.map(({ q, idx }) => {
              const a = answers[q._id];
              const isAnswered =
                q.type === "mcq"
                  ? a?.selectedOptionIndex !== null && a?.selectedOptionIndex !== undefined
                  : !!a?.code?.trim();
              const isReview = !!markedForReview[q._id];
              const isCurrent = idx === current;

              let style = "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700";

              if (isCurrent) {
                style = "border-indigo-500 bg-indigo-500/20 text-white ring-2 ring-indigo-500/40 font-bold scale-105";
              } else if (isReview && isAnswered) {
                style = "bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold";
              } else if (isReview) {
                style = "bg-amber-500/10 border-amber-500/30 text-amber-400 font-bold";
              } else if (isAnswered) {
                style = "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold";
              }

              return (
                <button
                  key={q._id}
                  onClick={() => onSelectQuestion(idx)}
                  className={`h-9 rounded-xl font-mono text-xs border transition-all flex items-center justify-center relative ${style}`}
                >
                  {idx + 1}
                  {isReview && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-slate-900" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Complete / Submit Action */}
      <div className="pt-4 border-t border-slate-800">
        <button
          onClick={onSubmitClick}
          disabled={submitting}
          className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl py-3 px-4 font-bold text-xs transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Send size={14} />
          {submitting ? "Submitting Test…" : "Submit & Finish Test"}
        </button>
      </div>
    </aside>
  );
}
