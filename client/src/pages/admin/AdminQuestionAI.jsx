import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import QuestionFormModal from "../../components/QuestionFormModal";
import { listTests, addQuestion, generateQuestions } from "../../api/tests";
import { bulkAddQuestions } from "../../api/admin";
import { ADMIN_LINKS } from "./adminLinks";
import { Sparkles, CheckCircle, Edit3, Trash2, Check } from "lucide-react";

const navigateAdmin = (navigate) => (k) => {
  if (k === "overview") navigate("/admin");
  else if (k === "tests") navigate("/admin/tests");
  else navigate(`/admin/${k}`);
};

const stampBtn = "bg-accent text-white rounded-lg px-5 py-2.5 font-semibold text-[13.5px] hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5";
const ghostBtn = "border-[1.5px] border-line rounded-lg px-4 py-2 font-semibold text-[13px] text-ink hover:border-accent transition-colors flex items-center justify-center gap-1.5";
const dangerBtn = "border-[1.5px] border-danger/40 text-danger rounded-lg px-3.5 py-2 font-semibold text-xs hover:bg-danger/10 transition-colors flex items-center gap-1";
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
  const [topic, setTopic] = useState("Logical Reasoning");
  const [subtopic, setSubtopic] = useState("");
  const [promptInstructions, setPromptInstructions] = useState("Generate campus placement assessment questions with detailed step-by-step explanations.");
  const [difficulty, setDifficulty] = useState("Medium");
  const [marks, setMarks] = useState(2);
  const [count, setCount] = useState(3);
  const [languages, setLanguages] = useState(["python", "java", "cpp"]);
  const [loading, setLoading] = useState(false);
  const [testsLoading, setTestsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [drafts, setDrafts] = useState([]);
  const [selectedDraftIds, setSelectedDraftIds] = useState([]);
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
      setError("Enter a topic — e.g. \"Logical Reasoning\", \"Quantitative Aptitude\", \"Binary Search\".");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      // Use existing generateQuestions backend logic
      const targetId = selectedTestId || (tests.length > 0 ? tests[0]._id : null);
      if (!targetId) {
        throw new Error("No test found in system. Create a test or placement test first.");
      }
      const { drafts: newDrafts } = await generateQuestions(targetId, {
        type,
        topic: subtopic ? `${topic} - ${subtopic}` : topic,
        difficulty,
        marks: Number(marks),
        count: Number(count),
        languages: type === "coding" ? languages : undefined,
        instructions: promptInstructions,
      });

      const enriched = newDrafts.map((d) => ({
        ...d,
        _draftId: nextDraftId(),
        topic,
        subtopic,
        source: "ai",
        status: "pending_review",
      }));

      setDrafts((prev) => [...prev, ...enriched]);
      setSelectedDraftIds((prev) => [...prev, ...enriched.map((x) => x._draftId)]);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not generate questions. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectDraft = (id) => {
    setSelectedDraftIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const updateDraftStatus = (draftId, status) => {
    setDrafts((prev) =>
      prev.map((d) => (d._draftId === draftId ? { ...d, status } : d))
    );
  };

  const handleSaveDraftModal = async (payload) => {
    if (selectedTestId) {
      await addQuestion(selectedTestId, payload);
    }
    if (modalState?._draftId) {
      setDrafts((prev) =>
        prev.map((d) => (d._draftId === modalState._draftId ? { ...d, ...payload, status: "approved" } : d))
      );
    }
    setModalState(null);
  };

  const discardDraft = (draftId) => {
    setDrafts((d) => d.filter((x) => x._draftId !== draftId));
    setSelectedDraftIds((prev) => prev.filter((i) => i !== draftId));
  };

  const handleBatchApproveAndAdd = async () => {
    const toAdd = drafts.filter((d) => selectedDraftIds.includes(d._draftId) && d.status !== "rejected");
    if (toAdd.length === 0) {
      alert("Select at least one AI question to add.");
      return;
    }

    try {
      const formatted = toAdd.map((d) => ({
        ...d,
        status: "approved",
        testId: selectedTestId || null,
      }));

      await bulkAddQuestions(formatted, selectedTestId || null);
      setSuccess(`Successfully added ${toAdd.length} AI question(s) to Question Bank!`);
      setDrafts((prev) => prev.filter((d) => !selectedDraftIds.includes(d._draftId)));
      setSelectedDraftIds([]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to batch add AI questions");
    }
  };

  return (
    <DashboardLayout active="questions/ai" links={ADMIN_LINKS} onNavigate={navigateAdmin(navigate)}>
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={22} className="text-accent" />
          <h1 className="font-display text-[26px] font-bold">AI Question Generator</h1>
        </div>
        <p className="text-ink-soft text-[13.5px]">
          Generate high-quality MCQs or Coding problems using AI prompt engineering. Review and approve before adding to Question Bank.
        </p>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger text-[13px] px-4 py-3 rounded-lg mb-5">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-[13px] px-4 py-3 rounded-lg mb-5">
          {success}
        </div>
      )}

      <div className="bg-white border border-line rounded-xl p-6 max-w-3xl mb-8 shadow-sm">
        <form onSubmit={handleGenerate}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelCls}>Topic</label>
              <input
                className={input}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder='e.g. "Logical Reasoning", "Quantitative Aptitude"'
              />
            </div>
            <div>
              <label className={labelCls}>Subtopic (Optional)</label>
              <input
                className={input}
                value={subtopic}
                onChange={(e) => setSubtopic(e.target.value)}
                placeholder='e.g. "Blood Relations", "Dynamic Programming"'
              />
            </div>
          </div>

          <div className="mb-4">
            <label className={labelCls}>Target Test (Optional)</label>
            {testsLoading ? (
              <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
            ) : (
              <select className={input} value={selectedTestId} onChange={(e) => setSelectedTestId(e.target.value)}>
                <option value="">Add to Central Question Bank directly</option>
                {tests.map((t) => (
                  <option key={t._id} value={t._id}>{t.title} — {t.category}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setType("mcq")}
              className={`px-4 py-2 border-[1.5px] rounded-lg text-[13px] font-semibold transition-colors ${
                type === "mcq" ? "border-accent text-ink bg-accent/5" : "border-line text-ink-soft"
              }`}
            >
              MCQ Questions
            </button>
            <button
              type="button"
              onClick={() => setType("coding")}
              className={`px-4 py-2 border-[1.5px] rounded-lg text-[13px] font-semibold transition-colors ${
                type === "coding" ? "border-accent text-ink bg-accent/5" : "border-line text-ink-soft"
              }`}
            >
              Coding Problem
            </button>
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
              <label className={labelCls}>How many questions</label>
              <input type="number" min={1} max={5} className={input} value={count} onChange={(e) => setCount(e.target.value)} />
            </div>
          </div>

          {type === "coding" && (
            <div className="mb-4">
              <label className={labelCls}>Supported Languages</label>
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

          <div className="mb-5">
            <label className={labelCls}>Additional Prompt Instructions</label>
            <textarea
              rows={2}
              className={input}
              value={promptInstructions}
              onChange={(e) => setPromptInstructions(e.target.value)}
              placeholder="e.g. Include real-world campus placement interview scenario..."
            />
          </div>

          <button type="submit" disabled={loading} className={`${stampBtn} w-full`}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating AI Questions…
              </span>
            ) : (
              "✨ Generate AI Questions"
            )}
          </button>
        </form>
      </div>

      {/* Review AI Drafts Table */}
      {drafts.length > 0 && (
        <div className="bg-white border border-line rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="font-display text-lg font-bold">
                AI Questions Pending Admin Review ({drafts.length})
              </h2>
              <p className="text-xs text-ink-soft">Review generated questions, options, explanations, and approve before adding to Question Bank.</p>
            </div>
            <button className={stampBtn} onClick={handleBatchApproveAndAdd}>
              <CheckCircle size={16} /> Approve & Add Selected ({selectedDraftIds.length})
            </button>
          </div>

          <div className="space-y-4">
            {drafts.map((d, idx) => {
              const isSel = selectedDraftIds.includes(d._draftId);
              return (
                <div
                  key={d._draftId}
                  className={`border rounded-xl p-4 transition-all ${
                    d.status === "approved" ? "border-emerald-300 bg-emerald-50/20" :
                    d.status === "rejected" ? "border-rose-200 bg-rose-50/20 opacity-60" :
                    "border-line bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => toggleSelectDraft(d._draftId)}
                      className="mt-1 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10.5px] uppercase font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">
                            {d.type}
                          </span>
                          <span className="text-xs font-semibold text-ink font-mono">Topic: {d.topic}</span>
                          {d.subtopic && <span className="text-xs text-ink-soft">({d.subtopic})</span>}
                          <span className="text-xs text-ink-soft">· {d.difficulty} · {d.marks} Marks</span>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          d.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                          d.status === "rejected" ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>
                          {d.status}
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-ink mb-2">{idx + 1}. {d.questionText}</p>

                      {/* Options for MCQ */}
                      {d.type === "mcq" && d.options && (
                        <div className="grid grid-cols-2 gap-2 mb-2 bg-slate-50 p-2.5 rounded-lg text-xs">
                          {d.options.map((opt, oIdx) => (
                            <div key={oIdx} className={`p-1.5 rounded border ${oIdx === d.correctOptionIndex ? "border-emerald-500 bg-emerald-100 text-emerald-900 font-bold" : "border-slate-200 text-ink-soft"}`}>
                              {String.fromCharCode(65 + oIdx)}. {opt} {oIdx === d.correctOptionIndex && "✓ (Correct)"}
                            </div>
                          ))}
                        </div>
                      )}

                      {d.explanation && (
                        <div className="text-xs text-ink-soft bg-blue-50/50 border border-blue-100 p-2 rounded-lg mb-2">
                          <strong>Explanation:</strong> {d.explanation}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button className={ghostBtn} onClick={() => setModalState(d)}>
                        <Edit3 size={14} /> Edit
                      </button>
                      <button
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        onClick={() => updateDraftStatus(d._draftId, "approved")}
                      >
                        Approve
                      </button>
                      <button
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200"
                        onClick={() => updateDraftStatus(d._draftId, "rejected")}
                      >
                        Reject
                      </button>
                      <button className={dangerBtn} onClick={() => discardDraft(d._draftId)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {modalState && (
        <QuestionFormModal
          initial={modalState}
          onSave={handleSaveDraftModal}
          onClose={() => setModalState(null)}
        />
      )}
    </DashboardLayout>
  );
}
