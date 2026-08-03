import { AlertTriangle, CheckCircle2, Bookmark, HelpCircle, X } from "lucide-react";

export default function SubmitConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  questions = [],
  answers = {},
  markedForReview = {},
  submitting = false,
}) {
  if (!isOpen) return null;

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

  const totalQuestions = questions.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative overflow-hidden text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-colors"
        >
          <X size={16} />
        </button>

        {/* Modal Icon */}
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
          <AlertTriangle size={24} />
        </div>

        <h3 className="font-display text-xl font-bold mb-2">Submit Assessment?</h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-6">
          Please review your attempt summary below before final submission. Once submitted, answers cannot be changed.
        </p>

        {/* Breakdown Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6 font-mono text-center">
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl">
            <div className="text-[10px] uppercase font-bold text-emerald-400 mb-1 flex items-center justify-center gap-1">
              <CheckCircle2 size={12} /> Answered
            </div>
            <div className="text-xl font-extrabold text-white">{answeredCount}</div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl">
            <div className="text-[10px] uppercase font-bold text-amber-400 mb-1 flex items-center justify-center gap-1">
              <Bookmark size={12} /> Flagged
            </div>
            <div className="text-xl font-extrabold text-white">{reviewCount}</div>
          </div>

          <div className="bg-slate-800 border border-slate-700 p-3 rounded-2xl">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center justify-center gap-1">
              <HelpCircle size={12} /> Left
            </div>
            <div className="text-xl font-extrabold text-white">{unansweredCount}</div>
          </div>
        </div>

        {unansweredCount > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 mb-6 text-xs text-amber-300 leading-relaxed font-medium flex items-start gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>
              You have <strong>{unansweredCount} unanswered questions</strong>. Are you sure you want to finish now?
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl py-3 text-xs font-bold transition-colors"
          >
            Return to Test
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 text-xs font-bold transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Confirm Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
