import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { listMaterials, createMaterial, toggleMaterial, deleteMaterial, getMaterialCategories, downloadMaterialApi } from "../../api/admin";
import { ADMIN_LINKS } from "./adminLinks";
import { BookOpen, Upload, Link as LinkIcon, FileText, Eye, EyeOff, Download, Trash2, X, ExternalLink } from "lucide-react";
import { getFileUrl } from "../../utils/fileUrl";

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
  const [previewPdf, setPreviewPdf] = useState(null);
  const [previewNote, setPreviewNote] = useState(null);
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

  const handleDownload = async (m) => {
    try {
      const res = await downloadMaterialApi(m._id);
      if (res?.downloadCount !== undefined) {
        setMaterials((prev) => prev.map((item) => (item._id === m._id ? { ...item, downloadCount: res.downloadCount } : item)));
      }
    } catch (e) {
      console.error(e);
    }
    if (m.type === "pdf" && m.fileUrl) {
      const fullUrl = getFileUrl(m.fileUrl);
      const link = document.createElement("a");
      link.href = fullUrl;
      link.target = "_blank";
      link.download = `${m.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (m.type === "link" && m.fileUrl) {
      window.open(m.fileUrl, "_blank");
    }
  };

  const handlePreview = (m) => {
    if (m.type === "pdf") {
      setPreviewPdf(m);
    } else if (m.type === "note") {
      setPreviewNote(m);
    } else if (m.type === "link" && m.fileUrl) {
      window.open(m.fileUrl, "_blank");
    }
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
              <div key={m._id} className="bg-white border border-line rounded-xl p-5 hover:shadow-md transition-all duration-200 group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${TYPE_COLORS[m.type]}`}>
                        <TypeIcon size={16} />
                      </div>
                      <span className="text-[11px] font-mono uppercase tracking-wide text-accent bg-accent/10 px-1.5 py-0.5 rounded font-semibold">
                        {m.type}
                      </span>
                    </div>
                    {/* Visibility Toggle Badge */}
                    <button
                      onClick={() => handleToggle(m._id)}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors ${
                        m.isVisible
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                      title={m.isVisible ? "Click to hide from students" : "Click to show to students"}
                    >
                      {m.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                      {m.isVisible ? "Visible" : "Hidden"}
                    </button>
                  </div>

                  <h3 className="font-semibold text-[14.5px] text-ink truncate group-hover:text-accent transition-colors">
                    {m.title}
                  </h3>
                  <p className="text-[11.5px] text-ink-soft mb-2">{m.category}</p>

                  {m.description && (
                    <p className="text-[12.5px] text-ink-soft mb-3 line-clamp-2">{m.description}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-line">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-[11px] text-ink-soft">
                      <Download size={12} />
                      <span>{m.downloadCount} downloads</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handlePreview(m)}
                        className="px-2.5 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors text-[12px] font-semibold flex items-center gap-1"
                        title="Preview Material"
                      >
                        <Eye size={14} /> Preview
                      </button>

                      {m.type === "pdf" && (
                        <button
                          onClick={() => handleDownload(m)}
                          className="p-1.5 rounded-lg text-ink-soft hover:text-accent hover:bg-accent/10 transition-colors"
                          title="Download PDF"
                        >
                          <Download size={15} />
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(m._id)}
                        className="p-1.5 rounded-lg text-ink-soft hover:text-danger hover:bg-danger/10 transition-colors"
                        title="Delete Material"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PDF Preview Modal */}
      {previewPdf && (
        <div className="fixed inset-0 bg-desk/70 flex items-center justify-center p-4 sm:p-6 z-50" onClick={() => setPreviewPdf(null)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-line bg-slate-50">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wide text-accent bg-accent/10 px-2 py-0.5 rounded font-semibold">
                  {previewPdf.category} • PDF
                </span>
                <h2 className="font-display text-lg font-bold text-ink mt-0.5">{previewPdf.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.open(getFileUrl(previewPdf.fileUrl), "_blank")}
                  className="px-3 py-1.5 rounded-lg border border-line text-ink hover:bg-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink size={14} /> Open in New Tab
                </button>
                <button
                  onClick={() => handleDownload(previewPdf)}
                  className="px-3 py-1.5 rounded-lg bg-accent text-white hover:bg-accent-hover text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download size={14} /> Download
                </button>
                <button onClick={() => setPreviewPdf(null)} className="p-1.5 rounded-lg text-ink-soft hover:bg-slate-200">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-900 p-2 min-h-[60vh]">
              <iframe
                src={getFileUrl(previewPdf.fileUrl)}
                className="w-full h-full min-h-[60vh] rounded-lg border-0 bg-white"
                title={previewPdf.title}
              />
            </div>
          </div>
        </div>
      )}

      {/* Note Preview Modal */}
      {previewNote && (
        <div className="fixed inset-0 bg-desk/60 flex items-center justify-center p-6 z-50" onClick={() => setPreviewNote(null)}>
          <div className="bg-surface rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 border-b border-line pb-3">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wide text-accent bg-accent/10 px-2 py-0.5 rounded font-semibold">
                  {previewNote.category} • NOTE
                </span>
                <h2 className="font-display text-xl font-bold text-ink mt-1">{previewNote.title}</h2>
              </div>
              <button onClick={() => setPreviewNote(null)} className="p-1.5 rounded-lg text-ink-soft hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            {previewNote.description && (
              <p className="text-[13.5px] text-ink-soft mb-4 italic">{previewNote.description}</p>
            )}
            <div className="bg-white border border-line rounded-lg p-5 text-[14px] text-ink whitespace-pre-wrap font-mono leading-relaxed">
              {previewNote.content || "No content provided for this note."}
            </div>
          </div>
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
