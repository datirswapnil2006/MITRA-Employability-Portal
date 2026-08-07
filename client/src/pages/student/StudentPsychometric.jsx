import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { getStudentPsychometric } from "../../api/student";
import { STUDENT_LINKS } from "./studentLinks";
import {
  Brain,
  CheckCircle2,
  ArrowRight,
  Clock,
  FileText,
  Layers,
  X,
  Sparkles,
  Info,
  RotateCcw,
} from "lucide-react";

export default function StudentPsychometric() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getStudentPsychometric()
      .then((data) => setAssessments(data || []))
      .catch(() => setAssessments([]))
      .finally(() => setLoading(false));
  }, []);

  const handleStartAttempt = (id) => {
    setActiveModal(null);
    navigate(`/student/psychometric/attempt/${id}`);
  };

  return (
    <DashboardLayout
      active="psychometric"
      links={STUDENT_LINKS}
      onNavigate={(k) => navigate(k === "tests" ? "/student" : `/student/${k}`)}
    >
      <div className="mb-7">
        <div className="flex items-center gap-2.5 mb-1">
          <Brain size={26} className="text-accent" />
          <h1 className="font-display text-[26px] font-bold">Psychometric & Behavioral Profiling</h1>
        </div>
        <p className="text-ink-soft text-[13.5px]">
          Evaluate cognitive style, workplace behaviors, and personality traits required by top recruitment partners.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-line rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-24 mb-3" />
              <div className="h-6 bg-slate-200 rounded w-48 mb-3" />
              <div className="h-10 bg-slate-200 rounded w-full mt-4" />
            </div>
          ))}
        </div>
      ) : assessments.length === 0 ? (
        <div className="bg-white border border-line rounded-2xl text-center py-14 p-6">
          <Brain size={42} className="mx-auto text-ink-soft/40 mb-3" />
          <h3 className="font-display text-lg font-bold text-ink mb-1">No Active Assessments</h3>
          <p className="text-[13.5px] text-ink-soft max-w-sm mx-auto">
            There are currently no psychometric assessments published by the Placement Cell. Check back soon!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {assessments.map((item) => {
            const isCompleted = item.attemptStatus === "submitted";
            const isInProgress = item.attemptStatus === "in_progress";
            const qCount = item.questions?.length || 0;
            const tCount = item.traits?.length || 0;

            return (
              <div
                key={item._id}
                className="bg-white border border-line rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-all duration-200 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-[11px] uppercase tracking-wide text-accent font-bold bg-accent/10 px-2.5 py-0.5 rounded">
                      {item.category}
                    </span>
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={12} /> Completed
                      </span>
                    )}
                  </div>

                  <h3 className="font-display text-[17px] font-bold text-ink mb-1.5 group-hover:text-accent transition-colors">
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="text-[13px] text-ink-soft mb-4 line-clamp-2">{item.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-[12px] text-ink-soft mb-4 pt-2 border-t border-line">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock size={13} /> {item.durationMinutes || 15} mins
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <FileText size={13} /> {qCount} Questions
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Layers size={13} /> {tCount} Traits
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-line">
                  {isCompleted ? (
                    <button
                      onClick={() => navigate(`/student/psychometric/report/${item.attemptId}`)}
                      className="w-full bg-accent/10 border border-accent/20 text-accent rounded-xl px-4 py-2.5 font-bold text-xs hover:bg-accent hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                      <Sparkles size={14} /> View Full Report & Insights
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveModal(item)}
                      className="w-full bg-accent text-white rounded-xl px-4 py-2.5 font-bold text-xs hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      {isInProgress ? "Resume Assessment" : "Begin Assessment"} <ArrowRight size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PRE-ASSESSMENT BRIEFING MODAL */}
      {activeModal && (
        <div
          className="fixed inset-0 bg-desk/60 flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-ink-soft hover:bg-slate-100"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[11px] uppercase font-bold text-accent bg-accent/10 px-2.5 py-0.5 rounded">
                {activeModal.category}
              </span>
            </div>

            <h2 className="font-display text-xl font-bold text-ink mb-2">
              {activeModal.title}
            </h2>

            {activeModal.description && (
              <p className="text-xs text-ink-soft mb-4">{activeModal.description}</p>
            )}

            {/* Candidate Guidelines Box */}
            <div className="bg-slate-50 border border-line rounded-xl p-4 mb-5 text-xs text-ink space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-accent uppercase text-[11px]">
                <Info size={14} /> Candidate Instructions & Rules
              </div>
              <p className="leading-relaxed text-ink-soft">
                {activeModal.instructions || "Answer all questions candidly according to your natural workplace preferences. There are no right or wrong answers."}
              </p>
              <div className="flex items-center gap-4 text-xs font-semibold pt-2 text-ink border-t border-line">
                <span>⏱ Duration: <strong>{activeModal.durationMinutes || 15} Mins</strong></span>
                <span>❓ Total Items: <strong>{activeModal.questions?.length || 0}</strong></span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 py-2.5 border border-line rounded-xl text-xs font-semibold text-ink hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleStartAttempt(activeModal._id)}
                className="flex-1 py-2.5 bg-accent text-white rounded-xl text-xs font-bold hover:bg-accent-hover transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                Start Candidate Attempt <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </DashboardLayout>
  );
}
