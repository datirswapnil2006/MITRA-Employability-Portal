import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { listTests } from "../../api/tests";
import { getQuestionBank, bulkDeleteQuestions, bulkUpdateQuestionStatus, moveQuestions } from "../../api/admin";
import { ADMIN_LINKS } from "./adminLinks";
import { Library, Search, Trash2, ArrowRightLeft, ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react";

const navigateAdmin = (navigate) => (k) => {
  if (k === "overview") navigate("/admin");
  else if (k === "tests") navigate("/admin/tests");
  else navigate(`/admin/${k}`);
};

const input = "px-3 py-2.5 border-[1.5px] border-line rounded-lg bg-white text-sm text-ink outline-none focus:border-accent transition-colors";
const labelCls = "block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5";
const th = "text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-soft bg-slate-100 px-4 py-3 border-b border-line";
const td = "px-4 py-3.5 border-b border-slate-100 text-[13.5px]";
const stampBtn = "bg-accent text-white rounded-lg px-4 py-2 font-semibold text-[13px] hover:bg-accent-hover transition-colors disabled:opacity-50";
const ghostBtn = "border-[1.5px] border-line rounded-lg px-4 py-2 font-semibold text-[13px] text-ink hover:border-accent transition-colors";

export default function AdminQuestionBank() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [data, setData] = useState({ questions: [], total: 0, page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({ test: "", type: "", difficulty: "", topic: "", source: "", status: "", search: "" });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [moveTestId, setMoveTestId] = useState("");
  const [showMoveModal, setShowMoveModal] = useState(false);

  useEffect(() => { listTests().then(setTests); }, []);

  useEffect(() => {
    setLoading(true);
    getQuestionBank({ ...filters, page, limit: 20 })
      .then(setData)
      .finally(() => setLoading(false));
  }, [filters, page]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === data.questions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(data.questions.map((q) => q._id)));
    }
  };

  const handleBulkDelete = async () => {
    if (!selected.size) return;
    if (!window.confirm(`Delete ${selected.size} question(s)? This cannot be undone.`)) return;
    await bulkDeleteQuestions([...selected]);
    setSelected(new Set());
    const refreshed = await getQuestionBank({ ...filters, page, limit: 20 });
    setData(refreshed);
  };

  const handleBulkStatus = async (status) => {
    if (!selected.size) return;
    await bulkUpdateQuestionStatus([...selected], status);
    setSelected(new Set());
    const refreshed = await getQuestionBank({ ...filters, page, limit: 20 });
    setData(refreshed);
  };

  const handleMove = async () => {
    if (!selected.size || !moveTestId) return;
    await moveQuestions([...selected], moveTestId);
    setSelected(new Set());
    setShowMoveModal(false);
    const refreshed = await getQuestionBank({ ...filters, page, limit: 20 });
    setData(refreshed);
  };

  return (
    <DashboardLayout active="questions/bank" links={ADMIN_LINKS} onNavigate={navigateAdmin(navigate)}>
      <div className="flex items-start justify-between mb-7 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Library size={22} className="text-accent" />
            <h1 className="font-display text-[26px] font-bold">Central Question Bank</h1>
          </div>
          <p className="text-ink-soft text-[13.5px]">
            Browse, filter, review, and manage questions sourced via manual entry, PDF extraction, or AI generation.
          </p>
        </div>
        <div className="text-[13px] text-ink-soft font-mono">
          {data.total} total question{data.total !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        <div>
          <label className={labelCls}>Topic</label>
          <input
            className={`${input} w-full`}
            placeholder="e.g. Aptitude, Coding"
            value={filters.topic}
            onChange={(e) => { setFilters((f) => ({ ...f, topic: e.target.value })); setPage(1); }}
          />
        </div>
        <div>
          <label className={labelCls}>Source</label>
          <select className={`${input} w-full`} value={filters.source} onChange={(e) => { setFilters((f) => ({ ...f, source: e.target.value })); setPage(1); }}>
            <option value="">All Sources</option>
            <option value="manual">Manual</option>
            <option value="pdf">PDF Extraction</option>
            <option value="ai">AI Generation</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <select className={`${input} w-full`} value={filters.status} onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending_review">Pending Review</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Type</label>
          <select className={`${input} w-full`} value={filters.type} onChange={(e) => { setFilters((f) => ({ ...f, type: e.target.value })); setPage(1); }}>
            <option value="">All Types</option>
            <option value="mcq">MCQ</option>
            <option value="coding">Coding</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Difficulty</label>
          <select className={`${input} w-full`} value={filters.difficulty} onChange={(e) => { setFilters((f) => ({ ...f, difficulty: e.target.value })); setPage(1); }}>
            <option value="">All Diff</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Search</label>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input
              className={`${input} w-full pl-9`}
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1); }}
            />
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 bg-accent/5 border border-accent/20 rounded-xl px-4 py-3 flex-wrap">
          <span className="text-[13px] font-semibold text-accent">{selected.size} selected</span>
          <button
            onClick={() => handleBulkStatus("approved")}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <CheckCircle size={14} /> Approve Selected
          </button>
          <button
            onClick={() => handleBulkStatus("rejected")}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <XCircle size={14} /> Reject Selected
          </button>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-danger hover:bg-danger/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Trash2 size={14} /> Delete
          </button>
          <button
            onClick={() => setShowMoveModal(true)}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-ink hover:bg-white px-3 py-1.5 rounded-lg transition-colors"
          >
            <ArrowRightLeft size={14} /> Move to Test
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="bg-white border border-line rounded-xl p-12 text-center">
          <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-ink-soft text-[13px]">Loading questions…</p>
        </div>
      ) : data.questions.length === 0 ? (
        <div className="bg-white border border-line rounded-xl text-center py-12 text-ink-soft text-[13.5px]">
          No questions match these filters.
        </div>
      ) : (
        <>
          <div className="bg-white border border-line rounded-xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={th} style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      checked={selected.size === data.questions.length && data.questions.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </th>
                  {["Type", "Topic", "Question", "Source", "Status", "Difficulty", "Marks"].map((h) => (
                    <th key={h} className={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.questions.map((q) => (
                  <tr key={q._id} className={`hover:bg-slate-50 ${selected.has(q._id) ? "bg-accent/5" : ""}`}>
                    <td className={td}>
                      <input
                        type="checkbox"
                        checked={selected.has(q._id)}
                        onChange={() => toggleSelect(q._id)}
                        className="rounded"
                      />
                    </td>
                    <td className={`${td} uppercase font-mono text-[11px]`}>{q.type}</td>
                    <td className={`${td} font-semibold text-ink`}>{q.topic || "General"}</td>
                    <td className={td}>{q.questionText?.slice(0, 75)}{q.questionText?.length > 75 ? "…" : ""}</td>
                    <td className={`${td} font-mono text-[11px] capitalize`}>{q.source || "manual"}</td>
                    <td className={td}>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                        q.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                        q.status === "rejected" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {q.status || "approved"}
                      </span>
                    </td>
                    <td className={td}>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                        q.difficulty === "Easy" ? "bg-emerald-100 text-emerald-700" :
                        q.difficulty === "Medium" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className={td}>{q.marks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <span className="text-[12px] text-ink-soft">
              Page {data.page} of {data.totalPages} · {data.total} total
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-lg border border-line hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-lg border border-line hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Move Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-desk/60 flex items-center justify-center p-6 z-50" onClick={() => setShowMoveModal(false)}>
          <div className="bg-surface rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-lg font-semibold mb-3">Move {selected.size} Question(s)</h2>
            <div className="mb-4">
              <label className={labelCls}>Target Test</label>
              <select className={`${input} w-full`} value={moveTestId} onChange={(e) => setMoveTestId(e.target.value)}>
                <option value="">Select a test…</option>
                {tests.map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button className={ghostBtn} onClick={() => setShowMoveModal(false)}>Cancel</button>
              <button className={stampBtn} disabled={!moveTestId} onClick={handleMove}>Move</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
