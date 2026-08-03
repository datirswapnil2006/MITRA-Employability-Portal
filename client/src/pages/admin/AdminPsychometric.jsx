import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { listPsychometric, createPsychometric, togglePsychometric, deletePsychometric } from "../../api/admin";
import { ADMIN_LINKS } from "./adminLinks";
import { Brain, Plus, X } from "lucide-react";

const navigateAdmin = (navigate) => (k) => {
  if (k === "overview") navigate("/admin");
  else if (k === "tests") navigate("/admin/tests");
  else navigate(`/admin/${k}`);
};

const CATEGORIES = [
  "Personality Traits",
  "Cognitive Ability",
  "Emotional Intelligence",
  "Aptitude Profiling",
  "Behavioral Assessment",
];

const stampBtn = "bg-accent text-white rounded-lg px-5 py-2.5 font-semibold text-[13.5px] hover:bg-accent-hover transition-colors";
const ghostBtn = "border-[1.5px] border-line rounded-lg px-4 py-2 font-semibold text-[13px] text-ink hover:border-accent transition-colors";
const dangerBtn = "border-[1.5px] border-danger/40 text-danger rounded-lg px-3.5 py-2 font-semibold text-xs hover:bg-danger/10 transition-colors";
const input = "w-full px-3 py-2.5 border-[1.5px] border-line rounded-lg bg-white text-sm text-ink outline-none focus:border-accent transition-colors";
const labelCls = "block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5";

export default function AdminPsychometric() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [scales, setScales] = useState([{ name: "", description: "", minScore: 1, maxScore: 5 }]);

  const load = () => {
    setLoading(true);
    listPsychometric().then(setTests).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const addScale = () => setScales((s) => [...s, { name: "", description: "", minScore: 1, maxScore: 5 }]);
  const removeScale = (idx) => setScales((s) => s.filter((_, i) => i !== idx));
  const updateScale = (idx, field, val) =>
    setScales((s) => s.map((sc, i) => (i === idx ? { ...sc, [field]: val } : sc)));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required"); return; }
    setError("");
    try {
      const created = await createPsychometric({
        title,
        description,
        category,
        scales: scales.filter((s) => s.name.trim()),
      });
      setTests((t) => [created, ...t]);
      setShowModal(false);
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory(CATEGORIES[0]);
    setScales([{ name: "", description: "", minScore: 1, maxScore: 5 }]);
  };

  const handleToggle = async (id) => {
    const updated = await togglePsychometric(id);
    setTests((t) => t.map((x) => (x._id === id ? updated : x)));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this psychometric assessment?")) return;
    await deletePsychometric(id);
    setTests((t) => t.filter((x) => x._id !== id));
  };

  return (
    <DashboardLayout active="psychometric" links={ADMIN_LINKS} onNavigate={navigateAdmin(navigate)}>
      <div className="flex items-start justify-between mb-7">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain size={22} className="text-accent" />
            <h1 className="font-display text-[26px] font-bold">Psychometric Management</h1>
          </div>
          <p className="text-ink-soft text-[13.5px]">
            Create and manage psychometric assessments for personality and aptitude profiling.
          </p>
        </div>
        <button className={stampBtn} onClick={() => setShowModal(true)}>+ New Assessment</button>
      </div>

      {loading ? (
        <div className="bg-white border border-line rounded-xl p-12 text-center">
          <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-ink-soft text-[13px]">Loading…</p>
        </div>
      ) : tests.length === 0 ? (
        <div className="bg-white border border-line rounded-xl text-center py-12">
          <Brain size={36} className="mx-auto text-ink-soft/40 mb-3" />
          <p className="text-ink-soft text-[13.5px]">No psychometric assessments yet. Create your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
          {tests.map((t) => (
            <div key={t._id} className="bg-white border border-line rounded-xl p-5 hover:shadow-md transition-all duration-200 group">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-display text-[16px] font-semibold text-ink group-hover:text-accent transition-colors">
                    {t.title}
                  </h3>
                  <span className="inline-block text-[11px] font-mono uppercase tracking-wide text-accent bg-accent/10 px-2 py-0.5 rounded mt-1">
                    {t.category}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wide uppercase px-2 py-0.5 rounded-full ${
                    t.isEnabled ? "bg-success/10 text-success" : "bg-ink-soft/10 text-ink-soft"
                  }`}
                >
                  <span className="text-[7px]">●</span>
                  {t.isEnabled ? "Active" : "Draft"}
                </span>
              </div>
              {t.description && (
                <p className="text-[12.5px] text-ink-soft mb-3 line-clamp-2">{t.description}</p>
              )}
              <div className="text-[11px] text-ink-soft mb-4">
                {t.scales?.length || 0} scale(s) · {t.questions?.length || 0} question(s)
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(t._id)}
                  className={`relative w-[42px] h-6 rounded-full shrink-0 transition-colors ${t.isEnabled ? "bg-success" : "bg-slate-300"}`}
                >
                  <span className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${t.isEnabled ? "translate-x-[18px]" : ""}`} />
                </button>
                <div className="flex-1" />
                <button className={dangerBtn} onClick={() => handleDelete(t._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-desk/60 flex items-center justify-center p-6 z-50" onClick={() => setShowModal(false)}>
          <div className="bg-surface rounded-xl max-w-lg w-full max-h-[88vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl font-semibold mb-4">New Psychometric Assessment</h2>

            {error && (
              <div className="bg-danger/10 border border-danger/30 text-danger text-[13px] px-3 py-2 rounded-lg mb-4">{error}</div>
            )}

            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className={labelCls}>Title</label>
                <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Big Five Personality Test" />
              </div>
              <div className="mb-4">
                <label className={labelCls}>Description</label>
                <textarea className={`${input} min-h-[80px]`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the assessment…" />
              </div>
              <div className="mb-4">
                <label className={labelCls}>Category</label>
                <select className={input} value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className={labelCls}>Scoring Scales</label>
                  <button type="button" onClick={addScale} className="text-accent text-[12px] font-semibold hover:underline flex items-center gap-1">
                    <Plus size={12} /> Add Scale
                  </button>
                </div>
                <div className="space-y-3">
                  {scales.map((s, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-lg p-3 relative">
                      {scales.length > 1 && (
                        <button type="button" onClick={() => removeScale(idx)} className="absolute top-2 right-2 text-ink-soft hover:text-danger">
                          <X size={14} />
                        </button>
                      )}
                      <input
                        className={`${input} mb-2`}
                        placeholder="Scale name (e.g. Openness)"
                        value={s.name}
                        onChange={(e) => updateScale(idx, "name", e.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-ink-soft">Min Score</label>
                          <input type="number" className={input} value={s.minScore} onChange={(e) => updateScale(idx, "minScore", Number(e.target.value))} />
                        </div>
                        <div>
                          <label className="text-[10px] text-ink-soft">Max Score</label>
                          <input type="number" className={input} value={s.maxScore} onChange={(e) => updateScale(idx, "maxScore", Number(e.target.value))} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button type="button" className={ghostBtn} onClick={() => { setShowModal(false); resetForm(); }}>Cancel</button>
                <button type="submit" className={stampBtn}>Create Assessment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
