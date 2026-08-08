import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { getAttempt } from "../api/tests";
import { CheckCircle2, XCircle, Award, Layers, AlertTriangle, ArrowLeft } from "lucide-react";

export default function ResultPage() {
  const { attemptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(location.state || null);
  const [loading, setLoading] = useState(!location.state);

  useEffect(() => {
    if (attempt) return;
    getAttempt(attemptId).then(setAttempt).finally(() => setLoading(false));
  }, [attemptId, attempt]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 font-mono text-xs">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-3" />
        Loading assessment result…
      </div>
    );
  }

  const percent = attempt.maxScore ? Math.round((attempt.totalScore / attempt.maxScore) * 100) : 0;
  const isFlagged = attempt.flagged || attempt.autoSubmitted;
  const reasonText = attempt.flagReason || attempt.reason;
  const isPassed = attempt.test?.passingMarks
    ? attempt.totalScore >= attempt.test.passingMarks
    : percent >= 40;

  const sectionResults = attempt.sectionResults || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center">
      <div className="max-w-3xl w-full my-auto space-y-6">

        {/* Top Header Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-accent" />
          
          <button
            onClick={() => navigate("/student")}
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 mb-4 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>

          {isFlagged && (
            <div className="mb-6 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl p-4 text-left flex items-start gap-3">
              <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-rose-200 font-bold mb-0.5">Assessment Integrity Alert</strong>
                This attempt was automatically submitted due to a proctoring or tab-switch rule violation.
                {reasonText && <span className="block mt-1 font-mono text-rose-400">{reasonText}</span>}
              </div>
            </div>
          )}

          <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-800 text-slate-300">
            <Award size={14} className="text-accent" /> Official Placement Assessment Result
          </div>

          <div className="font-display text-5xl sm:text-6xl font-bold text-accent my-3">
            {attempt.totalScore} <span className="text-2xl text-slate-500 font-normal">/ {attempt.maxScore}</span>
          </div>

          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="font-mono text-lg font-bold text-slate-200">{percent}% Aggregate Score</span>
            <span className={`inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
              isPassed ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
            }`}>
              {isPassed ? <><CheckCircle2 size={14} /> Qualified</> : <><XCircle size={14} /> Needs Improvement</>}
            </span>
          </div>

          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {attempt.test?.title || "Placement Assessment"} · Submitted on {new Date(attempt.createdAt || Date.now()).toLocaleString()}
          </p>
        </div>

        {/* Section Breakdown */}
        {sectionResults.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="font-display text-base font-bold text-white mb-4 flex items-center gap-2">
              <Layers size={18} className="text-accent" /> Section-wise Performance Analysis
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sectionResults.map((sec, idx) => {
                const secPercent = sec.maxScore ? Math.round((sec.totalScore / sec.maxScore) * 100) : 0;
                return (
                  <div key={sec.sectionId || idx} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-sm text-slate-200">{sec.sectionName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          ✓ {sec.correctCount} Correct · ✗ {sec.incorrectCount} Incorrect · ○ {sec.unattemptedCount} Unattempted
                        </div>
                      </div>
                      <span className="font-mono text-sm font-bold text-accent">
                        {sec.totalScore} / {sec.maxScore}m
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-accent h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, secPercent)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-xs text-slate-400 font-mono">
                      <span>Accuracy Ratio</span>
                      <span className="text-slate-200 font-semibold">{secPercent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="text-center pt-2">
          <button
            className="bg-accent hover:bg-accent-hover text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-lg shadow-accent/20"
            onClick={() => navigate("/student")}
          >
            Return to Student Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
