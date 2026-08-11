import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { listTests, BRANCHES, getFlaggedAttempts, clearFlaggedAttempts, deleteFlaggedAttemptById } from "../../api/tests";
import { getProctorEvents } from "../../api/proctor";
import { ADMIN_LINKS } from "./adminLinks";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  User,
  FileText,
  X,
  Eye,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
} from "lucide-react";

const EVENT_LABEL = {
  tab_switch: "Tab switched",
  fullscreen_exit: "Full-screen exited",
  copy_attempt: "Copy attempt",
  paste_attempt: "Paste attempt",
  right_click: "Right-click attempt",
  no_face: "No face detected",
  multiple_faces: "Multiple faces detected",
  suspicious_gaze: "Suspicious gaze / Secondary device",
  camera_frozen: "Camera stream static / frozen",
  camera_unavailable: "Camera unavailable",
  screen_share_interrupted: "Screen share interrupted",
  prolonged_no_face: "Prolonged face absence",
};

const SEVERITY_STYLES = {
  Low: "bg-slate-100 text-slate-700 border-slate-200",
  Medium: "bg-amber-50 text-amber-800 border-amber-200",
  High: "bg-orange-50 text-orange-800 border-orange-200",
  Critical: "bg-rose-50 text-rose-800 border-rose-200 font-bold",
};

const STATUS_BADGE_STYLES = {
  Secure: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Warning: "bg-amber-50 text-amber-800 border-amber-200",
  Suspicious: "bg-orange-50 text-orange-800 border-orange-200",
  Critical: "bg-rose-50 text-rose-800 border-rose-200 font-bold animate-pulse",
};

const input =
  "px-3 py-2 border-[1.5px] border-line rounded-xl bg-white text-xs text-ink outline-none focus:border-accent transition-colors";
const label = "block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5";
const th = "text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-soft bg-slate-100 px-4 py-3 border-b border-line";
const td = "px-4 py-3.5 border-b border-slate-100 text-[13.5px]";

const AUTO_REFRESH_MS = 15000;

export default function AdminProctoring() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [testId, setTestId] = useState("");
  const [severity, setSeverity] = useState("");
  const [branch, setBranch] = useState("");
  const [events, setEvents] = useState([]);
  const [flagged, setFlagged] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttemptAudit, setSelectedAttemptAudit] = useState(null);

  useEffect(() => {
    listTests().then(setTests);
  }, []);

  const loadFlagged = useCallback(() => {
    getFlaggedAttempts().then(setFlagged);
  }, []);

  const handleClearAllFlagged = async () => {
    if (!window.confirm("Are you sure you want to clear all auto-submitted cheating records?")) return;
    try {
      await clearFlaggedAttempts();
      setFlagged([]);
    } catch (err) {
      alert("Failed to clear flagged records");
    }
  };

  const handleClearSingle = async (id) => {
    try {
      await deleteFlaggedAttemptById(id);
      setFlagged((prev) => prev.filter((item) => item._id !== id));
      if (selectedAttemptAudit?.attemptId === id) setSelectedAttemptAudit(null);
    } catch (err) {
      alert("Failed to delete record");
    }
  };

  const load = useCallback(() => {
    getProctorEvents({ testId, severity, branch }).then(setEvents).finally(() => setLoading(false));
  }, [testId, severity, branch]);

  useEffect(() => {
    setLoading(true);
    load();
    loadFlagged();
    const interval = setInterval(() => {
      load();
      loadFlagged();
    }, AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [load, loadFlagged]);

  const criticalCount = events.filter((e) => e.severity === "Critical").length;
  const highCount = events.filter((e) => e.severity === "High").length;
  const mediumCount = events.filter((e) => e.severity === "Medium").length;
  const lowCount = events.filter((e) => e.severity === "Low").length;

  const openAuditDetails = (eventItem) => {
    const attemptId = eventItem.attempt?._id || eventItem.attempt;
    const attemptEvents = events.filter((e) => (e.attempt?._id || e.attempt) === attemptId);

    const hasCritical = attemptEvents.some((e) => e.severity === "Critical") || eventItem.attempt?.autoSubmitted;
    const hasHigh = attemptEvents.some((e) => e.severity === "High");

    let status = "Secure";
    if (hasCritical) status = "Critical";
    else if (hasHigh || attemptEvents.length >= 4) status = "Suspicious";
    else if (attemptEvents.length > 0) status = "Warning";

    setSelectedAttemptAudit({
      attemptId,
      student: eventItem.student,
      test: eventItem.test,
      attempt: eventItem.attempt,
      status,
      events: attemptEvents.sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt)),
    });
  };

  return (
    <DashboardLayout active="proctoring" links={ADMIN_LINKS} onNavigate={(k) => navigate(k === "overview" ? "/admin" : `/admin/${k}`)}>
      <div className="flex items-start justify-between mb-7 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert size={26} className="text-indigo-600 shrink-0" />
            <h1 className="font-display text-[26px] font-bold text-slate-900">Proctoring & Integrity Reports</h1>
          </div>
          <p className="text-slate-500 text-[13.5px]">
            Live candidate integrity signals, face visibility logs, and auto-submitted violation reports. Refreshes every 15s.
          </p>
        </div>

        {/* Proctoring Status Summary Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold">
            <AlertTriangle size={13} /> {criticalCount} Critical
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase px-3 py-1.5 rounded-xl bg-orange-50 text-orange-700 border border-orange-200 font-semibold">
            {highCount} High
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-medium">
            {mediumCount} Medium
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 font-medium">
            {lowCount} Low
          </span>
        </div>
      </div>

      {/* Flagged Cheating Attempts Banner */}
      {flagged.length > 0 && (
        <div className="mb-8 bg-rose-50/50 border border-rose-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert size={20} className="text-rose-600" />
              <h2 className="font-display text-base font-bold text-slate-900">Auto-Submitted Integrity Violations ({flagged.length})</h2>
            </div>
            <button
              onClick={handleClearAllFlagged}
              className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-white border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={13} /> Clear All Records
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-rose-200/80 bg-white">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["Candidate", "Assessment", "Score", "Reason", "Submitted", "Actions"].map((h) => (
                    <th key={h} className={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {flagged.map((a) => (
                  <tr key={a._id} className="hover:bg-slate-50 border-b border-slate-100">
                    <td className={td}>
                      <strong className="text-slate-900">{a.student?.name || "Deleted Candidate"}</strong>
                      <br />
                      <span className="text-slate-500 text-xs font-mono">
                        {a.student ? `${a.student.erpNumber} · ${a.student.branch}` : "Record removed"}
                      </span>
                    </td>
                    <td className={td}>{a.test?.title || "Deleted Test"}</td>
                    <td className={`${td} whitespace-nowrap font-mono font-bold`}>{a.totalScore} / {a.maxScore}</td>
                    <td className={`${td} text-rose-700 text-xs font-medium max-w-xs truncate`}>{a.flagReason}</td>
                    <td className={`${td} whitespace-nowrap font-mono text-xs text-slate-500`}>
                      {a.submittedAt ? new Date(a.submittedAt).toLocaleString() : "—"}
                    </td>
                    <td className={`${td} whitespace-nowrap`}>
                      <button
                        onClick={() => handleClearSingle(a._id)}
                        className="px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <h2 className="font-display text-base font-bold text-slate-900 mb-3">Live Violation Stream</h2>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="min-w-[200px] flex-1 max-w-[300px]">
          <label className={label}>Assessment</label>
          <select className={input + " w-full"} value={testId} onChange={(e) => setTestId(e.target.value)}>
            <option value="">All Assessments</option>
            {tests.map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
          </select>
        </div>
        <div className="min-w-[160px] flex-1 max-w-[200px]">
          <label className={label}>Severity</label>
          <select className={input + " w-full"} value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="">All Severities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
        <div className="min-w-[160px] flex-1 max-w-[200px]">
          <label className={label}>Branch</label>
          <select className={input + " w-full"} value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="">All Branches</option>
            {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl text-center py-12 text-slate-500 font-mono text-xs">
          Loading proctoring signals...
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl text-center py-12 text-slate-500 font-body">
          <ShieldCheck size={36} className="mx-auto text-emerald-500 mb-2" />
          <p className="font-semibold text-slate-700 text-sm">No integrity violations recorded for this filter.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Timestamp", "Candidate", "Assessment", "Signal", "Severity", "Audit Timeline"].map((h) => (
                  <th key={h} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e._id} className="hover:bg-slate-50/80 border-b border-slate-100">
                  <td className={`${td} font-mono text-xs text-slate-500 whitespace-nowrap`}>
                    {new Date(e.occurredAt).toLocaleTimeString()}
                  </td>
                  <td className={td}>
                    <strong className="text-slate-900">{e.student?.name || "Candidate"}</strong>
                    <br />
                    <span className="text-slate-500 text-xs font-mono">{e.student?.erpNumber} &middot; {e.student?.branch}</span>
                  </td>
                  <td className={td}>{e.test?.title || "Assessment"}</td>
                  <td className={td}>
                    <span className="font-medium text-slate-800">{EVENT_LABEL[e.type] || e.type}</span>
                    {e.detail && <span className="text-slate-500 text-xs"> — {e.detail}</span>}
                  </td>
                  <td className={td}>
                    <span className={`inline-flex items-center gap-1 font-mono text-[10px] tracking-wide uppercase px-2.5 py-1 rounded-full border ${SEVERITY_STYLES[e.severity]}`}>
                      {e.severity}
                    </span>
                  </td>
                  <td className={td}>
                    <button
                      onClick={() => openAuditDetails(e)}
                      className="px-3 py-1 rounded-lg border border-slate-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye size={13} /> View Log
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Candidate Attempt Audit Drawer Modal */}
      {selectedAttemptAudit && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 z-50 animate-fadeIn" onClick={() => setSelectedAttemptAudit(null)}>
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 text-slate-900" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-indigo-400 bg-indigo-950 border border-indigo-800 px-2 py-0.5 rounded">
                  Proctoring Audit Summary
                </span>
                <h3 className="font-display text-lg font-bold mt-1 text-white">
                  {selectedAttemptAudit.student?.name}
                </h3>
                <p className="text-xs font-mono text-slate-400">
                  {selectedAttemptAudit.student?.erpNumber} &middot; {selectedAttemptAudit.student?.branch}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${STATUS_BADGE_STYLES[selectedAttemptAudit.status]}`}>
                  Status: {selectedAttemptAudit.status}
                </span>
                <button onClick={() => setSelectedAttemptAudit(null)} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-2 gap-4 text-xs font-medium">
                <div>
                  <span className="text-slate-500 block font-mono uppercase text-[10px] text-slate-400">Assessment Title</span>
                  <strong className="text-slate-900 font-bold">{selectedAttemptAudit.test?.title || "Assessment"}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block font-mono uppercase text-[10px] text-slate-400">Total Violations</span>
                  <strong className="text-slate-900 font-bold">{selectedAttemptAudit.events.length} Events Logged</strong>
                </div>
              </div>

              <div>
                <h4 className="font-display text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Chronological Violation Timeline</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedAttemptAudit.events.map((ev, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[11px] text-slate-500">{new Date(ev.occurredAt).toLocaleTimeString()}</span>
                        <span className="font-semibold text-slate-800">{EVENT_LABEL[ev.type] || ev.type}</span>
                        {ev.detail && <span className="text-slate-500 text-[11px]">({ev.detail})</span>}
                      </div>
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full border ${SEVERITY_STYLES[ev.severity]}`}>
                        {ev.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
              <button
                onClick={() => setSelectedAttemptAudit(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Close Audit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
