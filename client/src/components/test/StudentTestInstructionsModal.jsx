import { useState } from "react";
import { Clock, Award, ShieldAlert, Layers, CheckCircle2, X } from "lucide-react";

export default function StudentTestInstructionsModal({ test, onStart, onClose }) {
  const [agreed, setAgreed] = useState(false);

  if (!test) return null;

  const sections = test.sections || [];
  const isPlacement = test.testType === "placement";

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-line animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-line bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-start justify-between">
          <div>
            <span className="font-mono text-[10.5px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-500/20 px-2.5 py-1 rounded-md">
              {isPlacement ? "Official Campus Placement Test" : test.category || "Assessment"}
            </span>
            <h2 className="font-display text-2xl font-bold mt-2">{test.title}</h2>
            <p className="text-slate-300 text-xs mt-1">{test.description || "Campus placement evaluation exam."}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-ink">

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 border border-slate-200 p-4 rounded-xl text-center text-xs">
            <div className="flex flex-col items-center">
              <span className="text-ink-soft flex items-center gap-1 mb-1"><Clock size={14} className="text-accent" /> Total Time</span>
              <strong className="text-sm font-bold text-ink">{test.durationMinutes} Minutes</strong>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-ink-soft flex items-center gap-1 mb-1"><Award size={14} className="text-accent" /> Total Marks</span>
              <strong className="text-sm font-bold text-accent">{test.totalMarks} Marks</strong>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-ink-soft flex items-center gap-1 mb-1"><Layers size={14} className="text-accent" /> Test Structure</span>
              <strong className="text-sm font-bold text-ink">{sections.length > 0 ? `${sections.length} Sections` : `${test.questionCount || 0} Questions`}</strong>
            </div>
          </div>

          {/* Section Breakdown if Placement Test */}
          {sections.length > 0 && (
            <div>
              <h3 className="font-display text-sm font-bold text-ink mb-3 flex items-center gap-1.5">
                <Layers size={16} className="text-accent" /> Section Breakdown & Timing
              </h3>
              <div className="space-y-2">
                {sections.map((sec, idx) => (
                  <div key={sec._id || idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-ink">{idx + 1}. {sec.name}</div>
                      <div className="text-[11px] text-ink-soft">Topic: {sec.topic || "General"}</div>
                    </div>
                    <div className="text-right font-mono text-[11px]">
                      <span className="text-accent font-semibold">{sec.questionCount || sec.questions?.length || 0} Qs</span> · <span>{sec.durationMinutes} min</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rules & Integrity Instructions */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-900">
            <h4 className="font-bold flex items-center gap-1.5 text-amber-950 mb-2">
              <ShieldAlert size={16} /> Placement Examination Policy & Proctoring Guidelines:
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-amber-900/90 leading-relaxed">
              <li>Keep webcam enabled throughout the exam. Tab switches & background applications are monitored.</li>
              <li>You can navigate between sections using the section tabs during the test.</li>
              <li>Your answers are continuously auto-saved.</li>
              <li>When section or total time expires, your exam will automatically submit.</li>
            </ul>
          </div>

          {/* Checkbox Agreement */}
          <label className="flex items-start gap-2.5 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-accent focus:ring-accent"
            />
            <span className="text-xs text-ink-soft leading-snug">
              I certify that I am taking this exam independently without any unauthorized aids or external assistance. I agree to abide by the assessment rules.
            </span>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-line flex items-center justify-between bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-ink-soft hover:text-ink transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!agreed}
            onClick={onStart}
            className="bg-accent text-white rounded-xl px-6 py-2.5 font-bold text-sm hover:bg-accent-hover transition-colors disabled:opacity-40 flex items-center gap-2 shadow-sm"
          >
            <CheckCircle2 size={16} /> Begin Placement Exam
          </button>
        </div>
      </div>
    </div>
  );
}
