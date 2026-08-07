import React from "react";
import { AlertTriangle, ShieldAlert, ArrowLeft } from "lucide-react";

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
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={28} />
        </div>

        <h3 className="font-display text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6 bg-slate-950/50 border border-slate-800 p-3.5 rounded-2xl">
          {message}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onContinue}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-3 text-xs font-bold transition-all shadow-lg shadow-indigo-600/20"
          >
            Continue Assessment
          </button>
          {!isWarningOnly && (
            <button
              onClick={onLeave}
              className="flex-1 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-400 rounded-xl px-5 py-3 text-xs font-semibold transition-all"
            >
              Leave Assessment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
