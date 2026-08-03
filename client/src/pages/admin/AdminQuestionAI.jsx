import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import QuestionFormModal from "../../components/QuestionFormModal";
import { listTests, addQuestion, generateQuestions } from "../../api/tests";
import { ADMIN_LINKS } from "./adminLinks";
import { Sparkles } from "lucide-react";

const navigateAdmin = (navigate) => (k) => {
  if (k === "overview") navigate("/admin");
  else if (k === "tests") navigate("/admin/tests");
  else navigate(`/admin/${k}`);
};

const stampBtn = "bg-accent text-white rounded-lg px-5 py-2.5 font-semibold text-[13.5px] hover:bg-accent-hover transition-colors disabled:opacity-50";
const dangerBtn = "border-[1.5px] border-danger/40 text-danger rounded-lg px-3.5 py-2 font-semibold text-xs hover:bg-danger/10 transition-colors";
const input = "w-full px-3 py-2.5 border-[1.5px] border-line rounded-lg bg-white text-sm text-ink outline-none focus:border-accent transition-colors";
const labelCls = "block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5";

const LANGUAGES = ["java", "python", "cpp"];
const LANGUAGE_LABEL = { java: "Java", python: "Python", cpp: "C++" };

let draftCounter = 0;
const nextDraftId = () => `ai-draft-${Date.now()}-${draftCounter++}`;

export default function AdminQuestionAI() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState("");
  const [type, setType] = useState("mcq");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [marks, setMarks] = useState(2);
  const [count, setCount] = useState(3);
  const [languages, setLanguages] = useState(["python", "java", "cpp"]);
  const [loading, setLoading] = useState(false);
  const [testsLoading, setTestsLoading] = useState(true);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState([]);
  const [modalState, setModalState] = useState(null);

  useEffect(() => {
    listTests().then((t) => {
      setTests(t);
      if (t.length) setSelectedTestId(t[0]._id);
    }).finally(() => setTestsLoading(false));
  }, []);

  const toggleLanguage = (lang) =>
    setLanguages((prev) => (prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]));

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError("Enter a topic — e.g. \"Arrays\", \"Percentages\", \"Polymorphism\".");
      return;
    }
    if (!selectedTestId) {
      setError("Please select a target test.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { drafts: newDrafts } = await generateQuestions(selectedTestId, {
        type,
        topic,
        difficulty,
        marks: Number(marks),
        count: Number(count),
        languages: type === "coding" ? languages : undefined,
      });
      setDrafts((d) => [...d, ...newDrafts.map((draft) => ({ ...draft, _draftId: nextDraftId() }))]);
    } catch (err) {
      setError(err.response?.data?.message || "Could not generate questions. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async (payload) => {
    await addQuestion(selectedTestId, payload);
    if (modalState?._draftId) {
      setDrafts((d) => d.filter((x) => x._draftId !== modalState._draftId));
    }
    setModalState(null);
  };

  const discardDraft = (draftId) => setDrafts((d) => d.filter((x) => x._draftId !== draftId));

  return (
    <DashboardLayout active="questions/ai" links={ADMIN_LINKS} onNavigate={navigateAdmin(navigate)}>
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={22} className="text-accent" />
          <h1 className="font-display text-[26px] font-bold">AI Question Generator</h1>
        </div>
        <p className="text-ink-soft text-[13.5px]">
          Use AI to generate draft questions. Review and edit before adding them to a test.
        </p>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger text-[13px] px-4 py-3 rounded-lg mb-5">
          {error}
        </div>
      )}

      <div className="bg-white border border-line rounded-xl p-6 max-w-2xl mb-8">
        <form onSubmit={handleGenerate}>
          <div className="mb-4">
            <label className={labelCls}>Target Test</label>
            {testsLoading ? (
              <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
            ) : (
              <select className={input} value={selectedTestId} onChange={(e) => setSelectedTestId(e.target.value)}>
                {tests.map((t) => (
                  <option key={t._id} value={t._id}>{t.title} — {t.category}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex gap-1.5 mb-4">
            <button
              type="button"
              onClick={() => setType("mcq")}
              className={`px-4 py-2 border-[1.5px] rounded-lg text-[13px] font-semibold transition-colors ${
                type === "mcq" ? "border-accent text-ink bg-accent/5" : "border-line text-ink-soft"
              }`}
            >
              MCQ
            </button>
            <button
              type="button"
              onClick={() => setType("coding")}
              className={`px-4 py-2 border-[1.5px] rounded-lg text-[13px] font-semibold transition-colors ${
                type === "coding" ? "border-accent text-ink bg-accent/5" : "border-line text-ink-soft"
              }`}
            >
              Coding
            </button>
          </div>

          <div className="mb-4">
            <label className={labelCls}>Topic</label>
            <input
              className={input}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder='e.g. "Arrays", "Percentages", "Polymorphism", "Binary Search"'
            />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className={labelCls}>Difficulty</label>
              <select className={input} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Marks each</label>
              <input type="number" min={1} className={input} value={marks} onChange={(e) => setMarks(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>How many</label>
              <input type="number" min={1} max={5} className={input} value={count} onChange={(e) => setCount(e.target.value)} />
            </div>
          </div>

          {type === "coding" && (
            <div className="mb-4">
              <label className={labelCls}>Languages</label>
              <div className="flex gap-2 flex-wrap">
                {LANGUAGES.map((lang) => (
                  <button
                    type="button"
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border-[1.5px] transition-colors ${
                      languages.includes(lang) ? "border-accent text-ink bg-accent/5" : "border-line text-ink-soft"
                    }`}
                  >
                    {LANGUAGE_LABEL[lang]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className={`${stampBtn} w-full`}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating…
              </span>
            ) : (
              "✨ Generate Draft Questions"
            )}
          </button>
        </form>
      </div>

      {/* Drafts */}
      {drafts.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-semibold mb-1">
            <span className="text-accent">{drafts.length}</span> Draft Questions — Pending Review
          </h2>
          <p className="text-ink-soft text-[13px] mb-4">
            Review and save each question. Nothing is added to the test until you approve it.
          </p>
          <div className="space-y-3">
            {drafts.map((d) => (
              <div key={d._draftId} className="bg-white border border-line rounded-xl p-4 flex items-start gap-4 hover:shadow-sm transition-shadow">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10.5px] uppercase tracking-wide text-accent bg-accent/10 px-2 py-0.5 rounded">
                      {d.type}
                    </span>
                    <span className="text-[11px] text-ink-soft">{d.difficulty} · {d.marks} marks</span>
                  </div>
                  <p className="text-[13px] text-ink">{d.questionText?.slice(0, 120)}{d.questionText?.length > 120 ? "…" : ""}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button className={stampBtn} onClick={() => setModalState(d)}>Review & Save</button>
                  <button className={dangerBtn} onClick={() => discardDraft(d._draftId)}>Discard</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {modalState && (
        <QuestionFormModal
          initial={modalState}
          onSave={handleSaveDraft}
          onClose={() => setModalState(null)}
        />
      )}
    </DashboardLayout>
  );
}
