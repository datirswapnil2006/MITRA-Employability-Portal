import { useState, useEffect } from "react";
import {
  getPsychometricQuestionBank,
  savePsychometricQuestionBankItem,
  deletePsychometricQuestionBankItem,
  getPsychometricTraits,
} from "../../api/admin";
import {
  HelpCircle,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  AlertCircle,
} from "lucide-react";

const CATEGORIES = [
  "Personality Traits",
  "Emotional Intelligence",
  "Behavioral Assessment",
  "Workplace Styles",
  "Leadership Potential",
  "Situational Judgment",
];

const inputCls = "w-full px-3 py-2.5 border border-line rounded-xl bg-white text-xs text-ink outline-none focus:border-accent transition-colors";
const labelCls = "block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5";
const stampBtn = "bg-accent text-white rounded-xl px-4 py-2 font-bold text-xs hover:bg-accent-hover transition-colors flex items-center gap-1.5 shadow-sm";

export default function PsychometricQuestionBankView() {
  const [items, setItems] = useState([]);
  const [traits, setTraits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form State
  const [questionText, setQuestionText] = useState("");
  const [type, setType] = useState("likert");
  const [traitKey, setTraitKey] = useState("");
  const [isReverseScored, setIsReverseScored] = useState(false);
  const [situationContext, setSituationContext] = useState("");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [category, setCategory] = useState(CATEGORIES[0]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bankData, traitsData] = await Promise.all([
        getPsychometricQuestionBank({ search, category: categoryFilter, type: typeFilter }),
        getPsychometricTraits(),
      ]);
      setItems(bankData);
      setTraits(traitsData);
      if (traitsData.length > 0 && !traitKey) setTraitKey(traitsData[0].slug);
    } catch (err) {
      setError("Failed to load question bank");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, categoryFilter, typeFilter]);

  const handleOpenCreate = () => {
    setQuestionText("");
    setType("likert");
    setTraitKey(traits[0]?.slug || "openness");
    setIsReverseScored(false);
    setSituationContext("");
    setDifficulty("Intermediate");
    setCategory(CATEGORIES[0]);
    setError("");
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) {
      setError("Question statement is required");
      return;
    }
    try {
      await savePsychometricQuestionBankItem({
        questionText,
        type,
        traitKey,
        isReverseScored,
        situationContext,
        difficulty,
        category,
        source: "manual",
      });
      setSuccessMsg("Question added to Question Bank!");
      setShowModal(false);
      loadData();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save question");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove question from Question Bank?")) return;
    try {
      await deletePsychometricQuestionBankItem(id);
      setSuccessMsg("Question deleted");
      loadData();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete question");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-line rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle size={22} className="text-accent" />
            <h2 className="font-display text-lg font-bold text-ink">Psychometric Question Bank</h2>
          </div>
          <p className="text-xs text-ink-soft">
            Search, filter, and curate reusable AI-generated and manually authored behavioral items.
          </p>
        </div>

        <button onClick={handleOpenCreate} className={stampBtn}>
          <Plus size={16} /> Add Question
        </button>
      </div>

      {successMsg && (
        <div className="bg-success/10 border border-success/30 text-success text-xs px-4 py-3 rounded-xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-wrap gap-3 bg-white border border-line rounded-2xl p-3.5 shadow-sm">
        <div className="flex-1 min-w-[220px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            className="w-full pl-9 pr-3 py-2 border border-line rounded-xl text-xs outline-none focus:border-accent"
            placeholder="Search questions by keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 border border-line rounded-xl text-xs bg-white outline-none focus:border-accent min-w-[170px]"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          className="px-3 py-2 border border-line rounded-xl text-xs bg-white outline-none focus:border-accent min-w-[150px]"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Formats</option>
          <option value="likert">Likert Scale</option>
          <option value="forced_choice">Forced Choice</option>
          <option value="situational_judgment">Situational Judgment</option>
        </select>
      </div>

      {/* Questions Stack */}
      {loading ? (
        <div className="bg-white border border-line rounded-2xl p-12 text-center">
          <div className="w-7 h-7 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-ink-soft">Loading Question Bank items...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-line rounded-2xl p-10 text-center text-xs text-ink-soft">
          No saved questions in the Question Bank. Add new questions or save AI drafts directly during assessment creation.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((q, idx) => (
            <div
              key={q._id}
              className="bg-white border border-line rounded-2xl p-4.5 hover:shadow-md transition-all flex items-start justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-xs text-ink">#{idx + 1}</span>
                  <span className="font-mono text-[10px] text-accent bg-accent/10 px-2 py-0.5 rounded font-bold uppercase">
                    {q.type}
                  </span>
                  <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                    Trait: {q.traitKey}
                  </span>
                  {q.isReverseScored && (
                    <span className="font-mono text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold">
                      Reverse Scored
                    </span>
                  )}
                  <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-semibold">
                    {q.difficulty}
                  </span>
                  <span className="font-mono text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-semibold">
                    {q.category}
                  </span>
                </div>

                {q.situationContext && (
                  <p className="text-xs text-slate-600 italic bg-slate-50 border-l-2 border-accent pl-3 py-1.5 rounded-r">
                    Scenario: "{q.situationContext}"
                  </p>
                )}

                <p className="text-xs font-medium text-ink">{q.questionText}</p>

                {(() => {
                  const displayOptions = (q.options && q.options.length > 0)
                    ? q.options
                    : [
                        { optionText: "Strongly Disagree", score: q.isReverseScored ? 5 : 1 },
                        { optionText: "Disagree", score: q.isReverseScored ? 4 : 2 },
                        { optionText: "Neutral", score: 3 },
                        { optionText: "Agree", score: q.isReverseScored ? 2 : 4 },
                        { optionText: "Strongly Agree", score: q.isReverseScored ? 1 : 5 },
                      ];

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1.5 pt-1">
                      {displayOptions.map((opt, oIdx) => (
                        <div key={oIdx} className="bg-slate-50 border border-line rounded-lg p-2 text-[11px] flex justify-between items-center">
                          <span className="truncate font-medium">{typeof opt === "string" ? opt : opt.optionText}</span>
                          <span className="font-mono text-accent font-bold pl-1">+{typeof opt === "string" ? oIdx + 1 : opt.score}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <button
                onClick={() => handleDelete(q._id)}
                className="p-1.5 text-ink-soft hover:text-danger hover:bg-danger/10 rounded-lg transition-colors shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-desk/60 flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-display text-base font-bold text-ink">Add Question to Bank</h3>
              <button onClick={() => setShowModal(false)} className="text-ink-soft hover:text-ink">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="bg-danger/10 text-danger text-xs p-2.5 rounded-xl flex items-center gap-1.5">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Format</label>
                  <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="likert">Likert Scale</option>
                    <option value="forced_choice">Forced Choice</option>
                    <option value="situational_judgment">Situational Judgment</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Mapped Trait Key *</label>
                  <select className={inputCls + " font-mono text-accent"} value={traitKey} onChange={(e) => setTraitKey(e.target.value)}>
                    {traits.map((t) => (
                      <option key={t.slug} value={t.slug}>{t.name} ({t.slug})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Category</label>
                <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {type === "situational_judgment" && (
                <div>
                  <label className={labelCls}>Scenario Context</label>
                  <textarea
                    className={`${inputCls} min-h-[50px]`}
                    placeholder="Describe workplace pressure scenario..."
                    value={situationContext}
                    onChange={(e) => setSituationContext(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className={labelCls}>Question Statement *</label>
                <textarea
                  className={`${inputCls} min-h-[60px]`}
                  placeholder="e.g. I actively seek out innovative technical solutions under ambiguity."
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="bankRev"
                  checked={isReverseScored}
                  onChange={(e) => setIsReverseScored(e.target.checked)}
                  className="accent-accent"
                />
                <label htmlFor="bankRev" className="font-semibold text-ink">Reverse Scored Item</label>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-line rounded-xl text-ink font-semibold">
                  Cancel
                </button>
                <button type="submit" className={stampBtn}>
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
