import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { getStudentPsychometric } from "../../api/student";
import { STUDENT_LINKS } from "./studentLinks";
import { Brain, CheckCircle2, ArrowRight } from "lucide-react";

export default function StudentPsychometric() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getStudentPsychometric()
      .then((data) => setAssessments(data.filter((a) => a.isEnabled)))
      .finally(() => setLoading(false));
  }, []);

  const handleOpenAssessment = (item) => {
    setActiveModal(item);
    setAnswers({});
    setSubmitted(false);
  };

  const handleSelectOption = (questionIndex, value) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: value }));
  };

  const handleSubmitAssessment = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <DashboardLayout
      active="psychometric"
      links={STUDENT_LINKS}
      onNavigate={(k) => navigate(k === "tests" ? "/student" : `/student/${k}`)}
    >
      <div className="mb-7">
        <div className="flex items-center gap-2.5 mb-1">
          <Brain size={24} className="text-accent" />
          <h1 className="font-display text-[26px] font-bold">Psychometric Assessment</h1>
        </div>
        <p className="text-ink-soft text-[13.5px]">
          Evaluate cognitive style, personality traits, and situational judgment required by top hiring partners.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4.5">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white border border-line rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-24 mb-3" />
              <div className="h-6 bg-slate-200 rounded w-48 mb-3" />
              <div className="h-10 bg-slate-200 rounded w-full mt-4" />
            </div>
          ))}
        </div>
      ) : assessments.length === 0 ? (
        <div className="bg-white border border-line rounded-xl text-center py-12 text-ink-soft">
          <Brain size={36} className="mx-auto text-ink-soft/40 mb-3" />
          <p className="text-[14px]">No psychometric assessments active at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
          {assessments.map((item) => (
            <div
              key={item._id}
              className="bg-white border border-line rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition-all duration-200 group"
            >
              <div>
                <span className="font-mono text-[11px] tracking-wide uppercase text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded">
                  {item.category}
                </span>
                <h3 className="font-display text-[17px] font-bold text-ink mt-2 mb-1 group-hover:text-accent transition-colors">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-[13px] text-ink-soft mb-3 line-clamp-2">{item.description}</p>
                )}

                <div className="text-[12px] text-ink-soft mb-4">
                  {item.questions?.length || 0} Questions · {item.scales?.length || 0} Trait Scales
                </div>
              </div>

              <button
                onClick={() => handleOpenAssessment(item)}
                className="w-full bg-accent text-white rounded-lg px-4.5 py-2.5 font-semibold text-[13.5px] hover:bg-accent-hover transition-colors flex items-center justify-center gap-2"
              >
                Take Assessment <ArrowRight size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Assessment Modal */}
      {activeModal && (
        <div className="fixed inset-0 bg-desk/60 flex items-center justify-center p-6 z-50" onClick={() => setActiveModal(null)}>
          <div className="bg-surface rounded-xl max-w-xl w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-line pb-3 mb-4">
              <span className="font-mono text-[11px] uppercase tracking-wide text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded">
                {activeModal.category}
              </span>
              <h2 className="font-display text-xl font-bold text-ink mt-1">{activeModal.title}</h2>
            </div>

            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle2 size={48} className="mx-auto text-success mb-3" />
                <h3 className="font-display text-lg font-bold text-ink mb-1">Assessment Completed!</h3>
                <p className="text-[13.5px] text-ink-soft mb-5">
                  Your behavioral response profile has been saved.
                </p>
                <button
                  onClick={() => setActiveModal(null)}
                  className="bg-accent text-white rounded-lg px-5 py-2.5 font-semibold text-[13.5px]"
                >
                  Done
                </button>
              </div>
            ) : activeModal.questions && activeModal.questions.length > 0 ? (
              <form onSubmit={handleSubmitAssessment} className="space-y-5">
                {activeModal.questions.map((q, idx) => (
                  <div key={q._id || idx} className="bg-white border border-line rounded-lg p-4">
                    <p className="text-[13.5px] font-semibold text-ink mb-3">
                      {idx + 1}. {q.questionText}
                    </p>
                    <div className="space-y-2">
                      {(q.options && q.options.length > 0
                        ? q.options
                        : ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
                      ).map((opt, optIdx) => (
                        <label
                          key={optIdx}
                          className={`flex items-center gap-2.5 p-2.5 rounded-lg border border-line text-[13px] cursor-pointer transition-colors ${
                            answers[idx] === opt ? "bg-accent/10 border-accent font-medium text-accent" : "hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${idx}`}
                            checked={answers[idx] === opt}
                            onChange={() => handleSelectOption(idx, opt)}
                            className="accent-accent"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2.5 border border-line rounded-lg text-[13px] font-semibold">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 bg-accent text-white rounded-lg px-4.5 py-2.5 font-semibold text-[13.5px]">
                    Submit Answers
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8 text-ink-soft">
                <p>No questions configured for this assessment yet.</p>
                <button onClick={() => setActiveModal(null)} className="mt-4 px-4 py-2 border border-line rounded-lg text-[13px]">
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
