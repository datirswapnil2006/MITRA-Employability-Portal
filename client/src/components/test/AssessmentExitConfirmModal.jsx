import React from "react";
import { ShieldAlert } from "lucide-react";

export default function AssessmentExitConfirmModal({
  isOpen,
  title = "Confirm Exit",
  message = "You are attempting to leave the assessment. This action may result in your assessment being submitted automatically.",
  onContinue,
  onLeave,
  isWarningOnly = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={28} />
        </div>

        <h3 className="font-display text-xl font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6 bg-slate-50 border border-slate-200 p-4 rounded-xl">
          {message}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onContinue}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-3 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            Continue Assessment
          </button>
          {!isWarningOnly && (
            <button
              onClick={onLeave}
              className="flex-1 border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-rose-600 rounded-xl px-5 py-3 text-xs font-semibold transition-all cursor-pointer bg-white"
            >
              Leave Assessment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
