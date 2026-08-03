import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import QuestionFormModal from "../../components/QuestionFormModal";
import AIQuestionGeneratorModal from "../../components/AIQuestionGeneratorModal";
import { getTest, listQuestions, addQuestion, updateQuestion, deleteQuestion } from "../../api/tests";
import { ADMIN_LINKS } from "./adminLinks";

const stampBtn = "bg-accent text-white rounded px-4.5 py-2.5 font-semibold text-[13.5px] hover:bg-accent-hover transition-colors";
const ghostBtn = "border-[1.5px] border-line rounded px-4 py-2 font-semibold text-[13px] text-ink hover:border-accent transition-colors";
const dangerBtn = "border-[1.5px] border-danger/40 text-danger rounded px-3.5 py-2 font-semibold text-xs hover:bg-danger/10 transition-colors";
const th = "text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-soft bg-slate-100 px-4 py-3 border-b border-line";
const td = "px-4 py-3.5 border-b border-slate-100 text-[13.5px]";

let draftCounter = 0;
const nextDraftId = () => `draft-${Date.now()}-${draftCounter++}`;

export default function AdminTestQuestions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [modalState, setModalState] = useState(null); // null | "new" | question object | draft object
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [drafts, setDrafts] = useState([]); // AI-generated, not yet saved
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [t, qs] = await Promise.all([getTest(id), listQuestions(id)]);
    setTest(t);
    setQuestions(qs);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const isDraft = (item) => item && item._draftId;

  const handleSave = async (payload) => {
    if (modalState && modalState !== "new" && !isDraft(modalState)) {
      // Editing an already-saved question
      const updated = await updateQuestion(modalState._id, payload);
      setQuestions((qs) => qs.map((q) => (q._id === updated._id ? updated : q)));
    } else {
      // Either a brand-new manual question, or an AI draft being approved for the first time
      const created = await addQuestion(id, payload);
      setQuestions((qs) => [...qs, created]);
      if (isDraft(modalState)) {
        setDrafts((d) => d.filter((x) => x._draftId !== modalState._draftId));
      }
    }
    setModalState(null);
    const refreshed = await getTest(id);
    setTest(refreshed);
  };

  const handleDelete = async (qid) => {
    if (!window.confirm("Delete this question?")) return;
    await deleteQuestion(qid);
    setQuestions((qs) => qs.filter((q) => q._id !== qid));
    setTest(await getTest(id));
  };

  const handleDraftsGenerated = (newDrafts) => {
    setDrafts((d) => [...d, ...newDrafts.map((draft) => ({ ...draft, _draftId: nextDraftId() }))]);
    setAiModalOpen(false);
  };

  const discardDraft = (draftId) => setDrafts((d) => d.filter((x) => x._draftId !== draftId));

  if (loading || !test) {
    return (
      <DashboardLayout active="tests" links={ADMIN_LINKS} onNavigate={(k) => navigate(k === "overview" ? "/admin" : `/admin/${k}`)}>
        <p>Loading…</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout active="tests" links={ADMIN_LINKS} onNavigate={(k) => navigate(k === "overview" ? "/admin" : `/admin/${k}`)}>
      <button className={`${ghostBtn} mb-5`} onClick={() => navigate("/admin/tests")}>
        ← Back to tests
      </button>

      <div className="flex items-start justify-between mb-7 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-[26px] mb-1">{test.title}</h1>
          <p className="text-ink-soft text-[13.5px] flex items-center gap-2 flex-wrap">
            {test.category} &middot; {test.durationMinutes} min &middot; {test.totalMarks} marks total &middot;
            <span
              className={`inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wide uppercase px-2.5 py-1 rounded-full ${
                test.isEnabled ? "bg-success/10 text-success" : "bg-ink-soft/10 text-ink-soft"
              }`}
            >
              <span className="text-[8px]">●</span>
              {test.isEnabled ? "Enabled" : "Disabled"}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <button className={ghostBtn} onClick={() => setAiModalOpen(true)}>✨ Generate with AI</button>
          <button className={stampBtn} onClick={() => setModalState("new")}>+ Add Question</button>
        </div>
      </div>

      {drafts.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-lg font-semibold mb-1">AI Drafts — Pending Review</h2>
          <p className="text-ink-soft text-[13px] mb-3">
            Nothing here is part of the test yet. Review and save each one you want to keep.
          </p>
          <table className="w-full border-collapse bg-white rounded overflow-hidden shadow-sm border border-accent/20">
            <thead>
              <tr>
                {["Type", "Question", "Difficulty", "Marks", ""].map((h) => (
                  <th key={h} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {drafts.map((d) => (
                <tr key={d._draftId} className="hover:bg-slate-50">
                  <td className={`${td} uppercase font-mono text-[11px]`}>{d.type}</td>
                  <td className={td}>{d.questionText.slice(0, 70)}{d.questionText.length > 70 ? "…" : ""}</td>
                  <td className={td}>{d.difficulty}</td>
                  <td className={td}>{d.marks}</td>
                  <td className={td}>
                    <div className="flex gap-2 justify-end">
                      <button className={stampBtn} onClick={() => setModalState(d)}>Review & Save</button>
                      <button className={dangerBtn} onClick={() => discardDraft(d._draftId)}>Discard</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {questions.length === 0 ? (
        <div className="bg-white border border-line rounded text-center py-12 text-ink-soft">
          No questions yet. {test.isEnabled ? "" : "Add at least one before enabling this test."}
        </div>
      ) : (
        <table className="w-full border-collapse bg-white rounded overflow-hidden shadow-sm">
          <thead>
            <tr>
              {["#", "Type", "Question", "Difficulty", "Marks", ""].map((h) => (
                <th key={h} className={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {questions.map((q, idx) => (
              <tr key={q._id} className="hover:bg-slate-50">
                <td className={td}>{idx + 1}</td>
                <td className={`${td} uppercase font-mono text-[11px]`}>{q.type}</td>
                <td className={td}>{q.questionText.slice(0, 70)}{q.questionText.length > 70 ? "…" : ""}</td>
                <td className={td}>{q.difficulty}</td>
                <td className={td}>{q.marks}</td>
                <td className={td}>
                  <div className="flex gap-2 justify-end">
                    <button className={ghostBtn} onClick={() => setModalState(q)}>Edit</button>
                    <button className={dangerBtn} onClick={() => handleDelete(q._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalState && (
        <QuestionFormModal
          initial={modalState === "new" ? null : modalState}
          onSave={handleSave}
          onClose={() => setModalState(null)}
        />
      )}

      {aiModalOpen && (
        <AIQuestionGeneratorModal
          testId={id}
          onDrafts={handleDraftsGenerated}
          onClose={() => setAiModalOpen(false)}
        />
      )}
    </DashboardLayout>
  );
}
