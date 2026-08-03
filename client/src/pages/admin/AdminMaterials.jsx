import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { listMaterials, createMaterial, toggleMaterial, deleteMaterial, getMaterialCategories } from "../../api/admin";
import { ADMIN_LINKS } from "./adminLinks";
import { BookOpen, Upload, Link as LinkIcon, FileText, Eye, EyeOff, Download, Trash2, X } from "lucide-react";

const navigateAdmin = (navigate) => (k) => {
  if (k === "overview") navigate("/admin");
  else if (k === "tests") navigate("/admin/tests");
  else navigate(`/admin/${k}`);
};

const stampBtn = "bg-accent text-white rounded-lg px-5 py-2.5 font-semibold text-[13.5px] hover:bg-accent-hover transition-colors disabled:opacity-50";
const ghostBtn = "border-[1.5px] border-line rounded-lg px-4 py-2 font-semibold text-[13px] text-ink hover:border-accent transition-colors";
const dangerBtn = "border-[1.5px] border-danger/40 text-danger rounded-lg px-3.5 py-2 font-semibold text-xs hover:bg-danger/10 transition-colors";
const input = "w-full px-3 py-2.5 border-[1.5px] border-line rounded-lg bg-white text-sm text-ink outline-none focus:border-accent transition-colors";
const labelCls = "block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5";

const TYPE_ICONS = {
  pdf: FileText,
  link: LinkIcon,
  note: FileText,
};
const TYPE_COLORS = {
  pdf: "bg-red-100 text-red-600",
  link: "bg-blue-100 text-blue-600",
  note: "bg-emerald-100 text-emerald-600",
};

export default function AdminMaterials() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState({ category: "", type: "", search: "" });
  const [error, setError] = useState("");

  // Form
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formType, setFormType] = useState("pdf");
  const [formUrl, setFormUrl] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formFile, setFormFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([listMaterials(filter), getMaterialCategories()])
      .then(([m, c]) => { setMaterials(m); setCategories(c); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const resetForm = () => {
    setFormTitle(""); setFormDesc(""); setFormCategory(""); setFormType("pdf");
    setFormUrl(""); setFormContent(""); setFormFile(null); setError("");
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formCategory.trim()) {
      setError("Title and category are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("title", formTitle);
      formData.append("description", formDesc);
      formData.append("category", formCategory);
      formData.append("type", formType);
      if (formType === "link") formData.append("fileUrl", formUrl);
      if (formType === "note") formData.append("content", formContent);
      if (formType === "pdf" && formFile) formData.append("file", formFile);

      const created = await createMaterial(formData);
      setMaterials((m) => [created, ...m]);
      setShowModal(false);
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create material");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    const updated = await toggleMaterial(id);
    setMaterials((m) => m.map((x) => (x._id === id ? updated : x)));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this study material?")) return;
    await deleteMaterial(id);
    setMaterials((m) => m.filter((x) => x._id !== id));
  };

  return (
    <DashboardLayout active="materials" links={ADMIN_LINKS} onNavigate={navigateAdmin(navigate)}>
      <div className="flex items-start justify-between mb-7 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={22} className="text-accent" />
            <h1 className="font-display text-[26px] font-bold">Study Materials</h1>
          </div>
          <p className="text-ink-soft text-[13.5px]">
            Upload PDFs, add links, or write notes for students to study.
          </p>
        </div>
        <button className={stampBtn} onClick={() => setShowModal(true)}>+ Add Material</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="min-w-[180px]">
          <select
            className={`${input}`}
            value={filter.category}
            onChange={(e) => setFilter((f) => ({ ...f, category: e.target.value }))}
          >
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="min-w-[140px]">
          <select
            className={`${input}`}
            value={filter.type}
            onChange={(e) => setFilter((f) => ({ ...f, type: e.target.value }))}
          >
            <option value="">All Types</option>
            <option value="pdf">PDF</option>
            <option value="link">Link</option>
            <option value="note">Note</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <input
            className={input}
            placeholder="Search materials…"
            value={filter.search}
            onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
          />
        </div>
      </div>

      {/* Materials Grid */}
      {loading ? (
        <div className="bg-white border border-line rounded-xl p-12 text-center">
          <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-3" />
        </div>
      ) : materials.length === 0 ? (
        <div className="bg-white border border-line rounded-xl text-center py-12">
          <BookOpen size={36} className="mx-auto text-ink-soft/40 mb-3" />
          <p className="text-ink-soft text-[13.5px]">No study materials yet. Add your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
          {materials.map((m) => {
            const TypeIcon = TYPE_ICONS[m.type] || FileText;
            return (
              <div key={m._id} className="bg-white border border-line rounded-xl p-5 hover:shadow-md transition-all duration-200 group">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${TYPE_COLORS[m.type]}`}>
                    <TypeIcon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[14px] text-ink truncate group-hover:text-accent transition-colors">
                      {m.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-mono uppercase tracking-wide text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                        {m.type}
                      </span>
                      <span className="text-[11px] text-ink-soft">{m.category}</span>
                    </div>
                  </div>
                </div>

                {m.description && (
                  <p className="text-[12.5px] text-ink-soft mb-3 line-clamp-2">{m.description}</p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-ink-soft">
                    <Download size={12} />
                    <span>{m.downloadCount} downloads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(m._id)}
                      className={`p-1.5 rounded-lg transition-colors ${m.isVisible ? "text-success hover:bg-success/10" : "text-ink-soft hover:bg-slate-100"}`}
                      title={m.isVisible ? "Visible to students" : "Hidden from students"}
                    >
                      {m.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button onClick={() => handleDelete(m._id)} className="p-1.5 rounded-lg text-ink-soft hover:text-danger hover:bg-danger/10 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-desk/60 flex items-center justify-center p-6 z-50" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="bg-surface rounded-xl max-w-lg w-full max-h-[88vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl font-semibold mb-4">Add Study Material</h2>

            {error && (
              <div className="bg-danger/10 border border-danger/30 text-danger text-[13px] px-3 py-2 rounded-lg mb-4">{error}</div>
            )}

            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className={labelCls}>Title</label>
                <input className={input} value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Material title" />
              </div>

              <div className="mb-4">
                <label className={labelCls}>Description</label>
                <textarea className={`${input} min-h-[70px]`} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Brief description…" />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className={labelCls}>Category</label>
                  <input className={input} value={formCategory} onChange={(e) => setFormCategory(e.target.value)} placeholder="e.g. Mathematics" list="cat-suggestions" />
                  <datalist id="cat-suggestions">
                    {categories.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div>
                  <label className={labelCls}>Type</label>
                  <select className={input} value={formType} onChange={(e) => setFormType(e.target.value)}>
                    <option value="pdf">PDF Upload</option>
                    <option value="link">External Link</option>
                    <option value="note">Text Note</option>
                  </select>
                </div>
              </div>

              {formType === "pdf" && (
                <div className="mb-4">
                  <label className={labelCls}>PDF File</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-line rounded-xl p-6 text-center cursor-pointer hover:border-accent/50 transition-colors"
                  >
                    <input ref={fileInputRef} type="file" accept="application/pdf" onChange={(e) => setFormFile(e.target.files?.[0])} className="hidden" />
                    {formFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText size={18} className="text-accent" />
                        <span className="text-[13px] font-medium">{formFile.name}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setFormFile(null); }}>
                          <X size={14} className="text-ink-soft" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload size={24} className="mx-auto text-ink-soft mb-2" />
                        <p className="text-[13px] text-ink-soft">Click to upload (max 50MB)</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {formType === "link" && (
                <div className="mb-4">
                  <label className={labelCls}>URL</label>
                  <input className={input} value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder="https://example.com/resource" />
                </div>
              )}

              {formType === "note" && (
                <div className="mb-4">
                  <label className={labelCls}>Content</label>
                  <textarea className={`${input} min-h-[120px] font-mono text-[13px]`} value={formContent} onChange={(e) => setFormContent(e.target.value)} placeholder="Write your study notes here…" />
                </div>
              )}

              <div className="flex gap-2 mt-5">
                <button type="button" className={ghostBtn} onClick={() => { setShowModal(false); resetForm(); }}>Cancel</button>
                <button type="submit" disabled={saving} className={stampBtn}>
                  {saving ? "Saving…" : "Add Material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
