import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { listTests, BRANCHES, getFlaggedAttempts, clearFlaggedAttempts, deleteFlaggedAttemptById } from "../../api/tests";
import { getProctorEvents } from "../../api/proctor";
import { ADMIN_LINKS } from "./adminLinks";

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
};

const SEVERITY_STYLES = {
  Low: "bg-slate-100 text-slate-600",
  Medium: "bg-amber-100 text-amber-700",
  High: "bg-orange-100 text-orange-700",
  Critical: "bg-danger/15 text-danger font-bold",
};

const input =
  "px-3 py-2 border-[1.5px] border-line rounded bg-white text-sm text-ink outline-none focus:border-accent transition-colors";
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

  return (
    <DashboardLayout active="proctoring" links={ADMIN_LINKS} onNavigate={(k) => navigate(k === "overview" ? "/admin" : `/admin/${k}`)}>
      <div className="flex items-start justify-between mb-7 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-[26px] mb-1">Proctoring</h1>
          <p className="text-ink-soft text-[13.5px] m-0">
            Live cheating-detection signals from active and completed test attempts. Refreshes automatically every 15s.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wide uppercase px-2.5 py-1 rounded-full bg-danger/15 text-danger font-bold">
            {criticalCount} Critical
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wide uppercase px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">
            {highCount} High
          </span>
        </div>
      </div>

      {flagged.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold">Auto-Submitted for Suspected Cheating</h2>
            <button
              onClick={handleClearAllFlagged}
              className="px-3 py-1 text-xs font-semibold text-danger border border-danger/30 rounded hover:bg-danger/10 transition-colors"
            >
              Clear All Flagged Records
            </button>
          </div>
          <table className="w-full border-collapse bg-white rounded overflow-hidden shadow-sm border border-danger/20">
            <thead>
              <tr>
                {["Student", "Test", "Score", "Reason", "Submitted", "Actions"].map((h) => (
                  <th key={h} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {flagged.map((a) => (
                <tr key={a._id} className="hover:bg-slate-50">
                  <td className={td}>
                    <strong>{a.student?.name || "Deleted Student"}</strong>
                    <br />
                    <span className="text-ink-soft text-xs font-mono">
                      {a.student ? `${a.student.erpNumber} · ${a.student.branch}` : "Student record removed"}
                    </span>
                  </td>
                  <td className={td}>{a.test?.title || "Deleted Test"}</td>
                  <td className={`${td} whitespace-nowrap font-semibold`}>{a.totalScore} / {a.maxScore}</td>
                  <td className={`${td} text-danger font-medium`}>{a.flagReason}</td>
                  <td className={`${td} whitespace-nowrap font-mono text-xs text-slate-600`}>
                    {a.submittedAt ? new Date(a.submittedAt).toLocaleString() : "—"}
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    <button
                      onClick={() => handleClearSingle(a._id)}
                      className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-danger hover:bg-danger/10 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="font-display text-lg font-semibold mb-3">All Proctoring Events</h2>

      <div className="flex flex-wrap gap-4 mb-5">
        <div className="min-w-[220px] flex-1 max-w-[320px]">
          <label className={label}>Test</label>
          <select className={input + " w-full"} value={testId} onChange={(e) => setTestId(e.target.value)}>
            <option value="">All Tests</option>
            {tests.map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
          </select>
        </div>
        <div className="min-w-[180px] flex-1 max-w-[220px]">
          <label className={label}>Severity</label>
          <select className={input + " w-full"} value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="">All Severities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
        <div className="min-w-[180px] flex-1 max-w-[220px]">
          <label className={label}>Branch</label>
          <select className={input + " w-full"} value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="">All Branches</option>
            {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : events.length === 0 ? (
        <div className="bg-white border border-line rounded text-center py-12 text-ink-soft">
          No proctoring events match these filters.
        </div>
      ) : (
        <table className="w-full border-collapse bg-white rounded overflow-hidden shadow-sm">
          <thead>
            <tr>
              {["Time", "Student", "Test", "Event", "Severity"].map((h) => (
                <th key={h} className={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e._id} className="hover:bg-slate-50">
                <td className={`${td} font-mono`}>{new Date(e.occurredAt).toLocaleTimeString()}</td>
                <td className={td}>
                  <strong>{e.student?.name}</strong>
                  <br />
                  <span className="text-ink-soft text-xs font-mono">{e.student?.erpNumber} &middot; {e.student?.branch}</span>
                </td>
                <td className={td}>{e.test?.title}</td>
                <td className={td}>
                  {EVENT_LABEL[e.type] || e.type}
                  {e.detail && <span className="text-ink-soft text-xs"> — {e.detail}</span>}
                </td>
                <td className={td}>
                  <span className={`inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wide uppercase px-2.5 py-1 rounded-full ${SEVERITY_STYLES[e.severity]}`}>
                    {e.severity}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </DashboardLayout>
  );
}
