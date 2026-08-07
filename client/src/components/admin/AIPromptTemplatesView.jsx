import { useState, useEffect } from "react";
import {
  getPsychometricPromptTemplates,
  createPsychometricPromptTemplate,
  updatePsychometricPromptTemplate,
  deletePsychometricPromptTemplate,
  seedPsychometricPromptTemplates,
} from "../../api/admin";
import {
  Sparkles,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  X,
  Cpu,
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

export default function AIPromptTemplatesView() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [modelPreference, setModelPreference] = useState("auto");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const data = await getPsychometricPromptTemplates({ category: categoryFilter });
      setTemplates(data);
    } catch (err) {
      setError("Failed to fetch AI prompt templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [categoryFilter]);

  const handleSeed = async () => {
    try {
      const res = await seedPsychometricPromptTemplates();
      setSuccessMsg(res.message || "Seeded default prompt templates");
      fetchTemplates();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError("Failed to seed default prompt templates");
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle("");
    setCategory(CATEGORIES[0]);
    setModelPreference("auto");
    setSystemPrompt("You are an expert psychometrician. Generate high-quality behavioral assessment questions.");
    setCustomInstructions("");
    setIsDefault(false);
    setError("");
    setShowModal(true);
  };

  const handleOpenEdit = (tmpl) => {
    setEditingId(tmpl._id);
    setTitle(tmpl.title);
    setCategory(tmpl.category);
    setModelPreference(tmpl.modelPreference || "auto");
    setSystemPrompt(tmpl.systemPrompt);
    setCustomInstructions(tmpl.customInstructions || "");
    setIsDefault(Boolean(tmpl.isDefault));
    setError("");
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !systemPrompt.trim()) {
      setError("Title and System Prompt are required");
      return;
    }

    try {
      const payload = {
        title,
        category,
        modelPreference,
        systemPrompt,
        customInstructions,
        isDefault,
      };

      if (editingId) {
        await updatePsychometricPromptTemplate(editingId, payload);
        setSuccessMsg("Prompt template updated");
      } else {
        await createPsychometricPromptTemplate(payload);
        setSuccessMsg("Prompt template created");
      }

      setShowModal(false);
      fetchTemplates();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save prompt template");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this prompt template?")) return;
    try {
      await deletePsychometricPromptTemplate(id);
      setSuccessMsg("Prompt template deleted");
      fetchTemplates();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete prompt template");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-line rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={22} className="text-accent" />
            <h2 className="font-display text-lg font-bold text-ink">AI Prompt Templates</h2>
          </div>
          <p className="text-xs text-ink-soft">
            Manage reusable category system prompts and model preferences for automatic question generation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSeed}
            className="border border-line hover:border-accent text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors bg-slate-50"
          >
            <Sparkles size={14} className="text-accent" /> Seed Defaults
          </button>
          <button onClick={handleOpenCreate} className={stampBtn}>
            <Plus size={16} /> New Template
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-success/10 border border-success/30 text-success text-xs px-4 py-3 rounded-xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white border border-line rounded-2xl p-3.5 shadow-sm">
        <select
          className="px-3 py-2 border border-line rounded-xl text-xs bg-white outline-none focus:border-accent min-w-[200px]"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="bg-white border border-line rounded-2xl p-12 text-center">
          <div className="w-7 h-7 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-ink-soft">Loading AI prompt templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white border border-line rounded-2xl p-10 text-center text-xs text-ink-soft">
          No AI prompt templates found. Click "Seed Defaults" to load standard psychometric prompts.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tmpl) => (
            <div
              key={tmpl._id}
              className="bg-white border border-line rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-all group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">
                    {tmpl.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                      <Cpu size={12} /> {tmpl.modelPreference || "auto"}
                    </span>
                    {tmpl.isDefault && (
                      <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                        Default
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-display text-base font-bold text-ink group-hover:text-accent transition-colors">
                  {tmpl.title}
                </h3>

                <p className="text-xs text-ink-soft bg-slate-50 border border-line p-3 rounded-xl line-clamp-3 font-mono">
                  {tmpl.systemPrompt}
                </p>

                {tmpl.customInstructions && (
                  <p className="text-[11px] text-slate-600 font-medium">
                    <span className="font-semibold text-accent">Instructions:</span> {tmpl.customInstructions}
                  </p>
                )}
              </div>

              <div className="pt-4 mt-3 border-t border-line flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEdit(tmpl)}
                  className="p-1.5 border border-line rounded-lg hover:border-accent text-ink hover:text-accent transition-colors text-xs font-semibold flex items-center gap-1"
                >
                  <Edit3 size={14} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(tmpl._id)}
                  className="p-1.5 border border-danger/30 text-danger hover:bg-danger/10 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
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
              <h3 className="font-display text-base font-bold text-ink">
                {editingId ? "Edit AI Prompt Template" : "New AI Prompt Template"}
              </h3>
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
              <div>
                <label className={labelCls}>Template Title *</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Standard Big Five Evaluator"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Category</label>
                  <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>AI Model Preference</label>
                  <select className={inputCls} value={modelPreference} onChange={(e) => setModelPreference(e.target.value)}>
                    <option value="auto">Auto Fallback</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="groq">Groq Llama 3</option>
                    <option value="huggingface">Hugging Face</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>System Prompt *</label>
                <textarea
                  className={`${inputCls} min-h-[90px] font-mono`}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                />
              </div>

              <div>
                <label className={labelCls}>Custom Instructions (Optional)</label>
                <textarea
                  className={`${inputCls} min-h-[50px]`}
                  placeholder="Additional context or audience guidelines..."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="tmplDef"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="accent-accent"
                />
                <label htmlFor="tmplDef" className="font-semibold text-ink">Set as Default Template for Category</label>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-line rounded-xl text-ink font-semibold">
                  Cancel
                </button>
                <button type="submit" className={stampBtn}>
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
