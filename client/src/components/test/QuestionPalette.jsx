import { useState } from "react";
import { Check, Bookmark, Circle, Send } from "lucide-react";

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
    <aside className="w-full lg:w-72 shrink-0 bg-white border-r md:border-r-0 md:border-l border-slate-200 p-5 flex flex-col justify-between h-[calc(100vh-65px)] sticky top-[65px] shadow-2xs">
      <div className="space-y-5 overflow-y-auto pr-0.5">
        {/* Navigator Header */}
        <div>
          <h2 className="font-display text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
            <span>Question Navigator</span>
            <span className="font-mono text-xs font-bold text-slate-700">
              {questions.length} Qs
            </span>
          </h2>

          {/* Status Counter Chips */}
          <div className="grid grid-cols-2 gap-2 mb-4 text-xs font-mono">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between">
              <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                <Check size={13} /> Answered
              </span>
              <span className="font-bold text-emerald-900">{answeredCount}</span>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center justify-between">
              <span className="text-amber-700 font-semibold flex items-center gap-1.5">
                <Bookmark size={13} /> Review
              </span>
              <span className="font-bold text-amber-900">{reviewCount}</span>
            </div>

            <div className="bg-slate-100 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between col-span-2">
              <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                <Circle size={13} /> Unanswered
              </span>
              <span className="font-bold text-slate-900">{unansweredCount}</span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 mb-4 text-xs font-medium">
            <button
              onClick={() => setFilter("all")}
              className={`flex-1 py-1.5 text-center rounded-lg transition-colors cursor-pointer ${
                filter === "all" ? "bg-indigo-600 text-white font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("answered")}
              className={`flex-1 py-1.5 text-center rounded-lg transition-colors cursor-pointer ${
                filter === "answered" ? "bg-emerald-600 text-white font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Done ({answeredCount})
            </button>
            <button
              onClick={() => setFilter("review")}
              className={`flex-1 py-1.5 text-center rounded-lg transition-colors cursor-pointer ${
                filter === "review" ? "bg-amber-600 text-white font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Flag ({reviewCount})
            </button>
          </div>
        </div>

        {/* Questions Grid */}
        <div>
          <div className="grid grid-cols-5 gap-2">
            {filteredQuestions.map(({ q, idx }) => {
              const a = answers[q._id];
              const isAnswered =
                q.type === "mcq"
                  ? a?.selectedOptionIndex !== null && a?.selectedOptionIndex !== undefined
                  : !!a?.code?.trim();
              const isReview = !!markedForReview[q._id];
              const isCurrent = idx === current;

              let style = "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50";

              if (isCurrent) {
                style = "border-indigo-600 bg-indigo-600 text-white font-bold ring-2 ring-indigo-500/30 shadow-xs scale-105";
              } else if (isReview && isAnswered) {
                style = "bg-amber-100 border-amber-300 text-amber-900 font-bold";
              } else if (isReview) {
                style = "bg-amber-50 border-amber-300 text-amber-800 font-bold";
              } else if (isAnswered) {
                style = "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold";
              }

              return (
                <button
                  key={q._id}
                  onClick={() => onSelectQuestion(idx)}
                  className={`h-9 rounded-xl font-mono text-xs border transition-all flex items-center justify-center relative cursor-pointer ${style}`}
                >
                  {idx + 1}
                  {isReview && !isCurrent && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-white" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Complete / Submit Action */}
      <div className="pt-4 border-t border-slate-200">
        <button
          onClick={onSubmitClick}
          disabled={submitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 px-4 font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <Send size={14} />
          {submitting ? "Submitting..." : "Submit & Finish Test"}
        </button>
      </div>
    </aside>
  );
}
