import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { getStudentMaterials } from "../../api/student";
import { STUDENT_LINKS } from "./studentLinks";
import { BookOpen, FileText, Link as LinkIcon, Download, Search, ExternalLink, X } from "lucide-react";

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

export default function StudentStudyMaterials({ embedded = false }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [selectedNote, setSelectedNote] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    getStudentMaterials({ category, type, search })
      .then(setMaterials)
      .finally(() => setLoading(false));
  }, [category, type, search]);

  const categories = Array.from(new Set(materials.map((m) => m.category))).filter(Boolean);

  const mainContent = (
    <>
      <div className="mb-7">
        <div className="flex items-center gap-2.5 mb-1">
          <BookOpen size={24} className="text-accent" />
          <h1 className="font-display text-[26px] font-bold">Study Materials</h1>
        </div>
        <p className="text-ink-soft text-[13.5px]">
          Access official placement prep documents, reference guides, external links, and study notes.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="min-w-[180px]">
          <select
            className="w-full px-3.5 py-2.5 border-[1.5px] border-line rounded-lg bg-white text-sm text-ink outline-none focus:border-accent transition-colors"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Topics</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="min-w-[140px]">
          <select
            className="w-full px-3.5 py-2.5 border-[1.5px] border-line rounded-lg bg-white text-sm text-ink outline-none focus:border-accent transition-colors"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">All Formats</option>
            <option value="pdf">PDF File</option>
            <option value="link">External Link</option>
            <option value="note">Study Note</option>
          </select>
        </div>

        <div className="flex-1 min-w-[220px] relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            className="w-full pl-10 pr-3.5 py-2.5 border-[1.5px] border-line rounded-lg bg-white text-sm text-ink outline-none focus:border-accent transition-colors"
            placeholder="Search notes, subjects, or keywords…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4.5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-line rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-20 mb-3" />
              <div className="h-6 bg-slate-200 rounded w-40 mb-3" />
              <div className="h-10 bg-slate-200 rounded w-full mt-4" />
            </div>
          ))}
        </div>
      ) : materials.length === 0 ? (
        <div className="bg-white border border-line rounded-xl text-center py-12 text-ink-soft">
          <BookOpen size={36} className="mx-auto text-ink-soft/40 mb-3" />
          <p className="text-[14px]">No study materials match your search filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
          {materials.map((m) => {
            const TypeIcon = TYPE_ICONS[m.type] || FileText;

            return (
              <div
                key={m._id}
                className="bg-white border border-line rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition-all duration-200 group"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${TYPE_COLORS[m.type]}`}>
                      <TypeIcon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-mono uppercase tracking-wide text-accent bg-accent/10 px-2 py-0.5 rounded font-semibold">
                        {m.category}
                      </span>
                      <h3 className="font-semibold text-[15px] text-ink truncate group-hover:text-accent transition-colors mt-1">
                        {m.title}
                      </h3>
                    </div>
                  </div>

                  {m.description && (
                    <p className="text-[13px] text-ink-soft mb-4 line-clamp-2">{m.description}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-line">
                  {m.type === "pdf" && m.fileUrl && (
                    <a
                      href={m.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-accent text-white rounded-lg px-4 py-2.5 font-semibold text-[13px] hover:bg-accent-hover transition-colors flex items-center justify-center gap-2"
                    >
                      <Download size={15} /> Download PDF
                    </a>
                  )}

                  {m.type === "link" && m.fileUrl && (
                    <a
                      href={m.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full border-[1.5px] border-line text-ink rounded-lg px-4 py-2.5 font-semibold text-[13px] hover:border-accent hover:text-accent transition-colors flex items-center justify-center gap-2"
                    >
                      <ExternalLink size={15} /> Open Resource
                    </a>
                  )}

                  {m.type === "note" && (
                    <button
                      onClick={() => setSelectedNote(m)}
                      className="w-full bg-slate-100 text-ink rounded-lg px-4 py-2.5 font-semibold text-[13px] hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <FileText size={15} /> Read Note
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Note View Modal */}
      {selectedNote && (
        <div className="fixed inset-0 bg-desk/60 flex items-center justify-center p-6 z-50" onClick={() => setSelectedNote(null)}>
          <div className="bg-surface rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 border-b border-line pb-3">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wide text-accent bg-accent/10 px-2 py-0.5 rounded font-semibold">
                  {selectedNote.category}
                </span>
                <h2 className="font-display text-xl font-bold text-ink mt-1">{selectedNote.title}</h2>
              </div>
              <button onClick={() => setSelectedNote(null)} className="p-1.5 rounded-lg text-ink-soft hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            {selectedNote.description && (
              <p className="text-[13.5px] text-ink-soft mb-4 italic">{selectedNote.description}</p>
            )}
            <div className="bg-white border border-line rounded-lg p-5 text-[14px] text-ink whitespace-pre-wrap font-mono leading-relaxed">
              {selectedNote.content || "No content provided for this note."}
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (embedded) return mainContent;

  return (
    <DashboardLayout
      active="practice/materials"
      links={STUDENT_LINKS}
      onNavigate={(path) => navigate(path)}
    >
      {mainContent}
    </DashboardLayout>
  );
}
