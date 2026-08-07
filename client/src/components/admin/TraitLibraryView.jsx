import { useState, useEffect } from "react";
import {
  getPsychometricTraits,
  createPsychometricTrait,
  updatePsychometricTrait,
  deletePsychometricTrait,
  seedPsychometricTraits,
} from "../../api/admin";
import {
  Layers,
  Plus,
  Search,
  Edit3,
  Trash2,
  Sparkles,
  CheckCircle2,
  X,
  Sliders,
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

export default function TraitLibraryView() {
  const [traits, setTraits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [weight, setWeight] = useState(1.0);

  const fetchTraits = async () => {
    setLoading(true);
    try {
      const data = await getPsychometricTraits({ search, category: categoryFilter });
      setTraits(data);
    } catch (err) {
      setError("Failed to fetch trait library");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTraits();
  }, [search, categoryFilter]);

  const handleSeed = async () => {
    try {
      const res = await seedPsychometricTraits();
      setSuccessMsg(res.message || "Seeded default traits");
      fetchTraits();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Could not seed default traits");
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
    setCategory(CATEGORIES[0]);
    setWeight(1.0);
    setError("");
    setShowModal(true);
  };

  const handleOpenEdit = (t) => {
    setEditingId(t._id);
    setName(t.name);
    setSlug(t.slug);
    setDescription(t.description || "");
    setCategory(t.category || CATEGORIES[0]);
    setWeight(t.weight || 1.0);
    setError("");
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Trait name is required");
      return;
    }
    try {
      const payload = { name, slug, description, category, weight: Number(weight) };
      if (editingId) {
        await updatePsychometricTrait(editingId, payload);
        setSuccessMsg("Trait updated successfully");
      } else {
        await createPsychometricTrait(payload);
        setSuccessMsg("Trait created in library");
      }
      setShowModal(false);
      fetchTraits();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save trait");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this trait from the library?")) return;
    try {
      await deletePsychometricTrait(id);
      setSuccessMsg("Trait deleted");
      fetchTraits();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete trait");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-line rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers size={22} className="text-accent" />
            <h2 className="font-display text-lg font-bold text-ink">Central Trait Library</h2>
          </div>
          <p className="text-xs text-ink-soft">
            Manage reusable psychometric dimensions, scoring weights, and category mappings across tests.
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
            <Plus size={16} /> Add New Trait
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-success/10 border border-success/30 text-success text-xs px-4 py-3 rounded-xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="flex flex-wrap gap-3 bg-white border border-line rounded-2xl p-3.5 shadow-sm">
        <div className="flex-1 min-w-[220px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            className="w-full pl-9 pr-3 py-2 border border-line rounded-xl text-xs outline-none focus:border-accent"
            placeholder="Search traits by name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 border border-line rounded-xl text-xs bg-white outline-none focus:border-accent min-w-[180px]"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Traits Grid */}
      {loading ? (
        <div className="bg-white border border-line rounded-2xl p-12 text-center">
          <div className="w-7 h-7 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-ink-soft">Loading trait library...</p>
        </div>
      ) : traits.length === 0 ? (
        <div className="bg-white border border-line rounded-2xl p-10 text-center text-xs text-ink-soft">
          No traits found in library. Click "Seed Defaults" or "Add New Trait" to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {traits.map((t) => (
            <div
              key={t._id}
              className="bg-white border border-line rounded-2xl p-4.5 flex flex-col justify-between hover:shadow-md transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-[10px] uppercase font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">
                    {t.category}
                  </span>
                  <span className="font-mono text-[10px] text-ink-soft bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
                    <Sliders size={11} /> Weight: {t.weight ?? 1.0}
                  </span>
                </div>

                <h3 className="font-display text-base font-bold text-ink mb-1 group-hover:text-accent transition-colors">
                  {t.name}
                </h3>
                <div className="font-mono text-[11px] text-slate-500 mb-2">key: {t.slug}</div>
                {t.description && <p className="text-xs text-ink-soft line-clamp-2 mb-3">{t.description}</p>}
              </div>

              <div className="pt-3 border-t border-line flex items-center justify-between text-xs">
                <span className="text-[11px] text-ink-soft font-mono">Scale: {t.minScore || 1} - {t.maxScore || 5}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="p-1.5 border border-line rounded-lg hover:border-accent text-ink hover:text-accent transition-colors"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(t._id)}
                    className="p-1.5 border border-danger/30 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trait Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-desk/60 flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-display text-base font-bold text-ink">
                {editingId ? "Edit Trait" : "Create New Trait"}
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
                <label className={labelCls}>Trait Name *</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Conscientiousness"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingId) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "_"));
                  }}
                />
              </div>

              <div>
                <label className={labelCls}>Trait Slug / Key *</label>
                <input
                  className={inputCls + " font-mono text-accent bg-slate-50"}
                  placeholder="e.g. conscientiousness"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>

              <div>
                <label className={labelCls}>Category</label>
                <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Scoring Weight</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10"
                  className={inputCls}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  className={`${inputCls} min-h-[60px]`}
                  placeholder="Core behavior traits evaluated..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-line rounded-xl text-ink font-semibold">
                  Cancel
                </button>
                <button type="submit" className={stampBtn}>
                  Save Trait
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
