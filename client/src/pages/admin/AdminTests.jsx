import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import TestFormModal from "../../components/TestFormModal";
import { listTests, createTest, toggleTest, deleteTest } from "../../api/tests";
import { ADMIN_LINKS } from "./adminLinks";

const stampBtn = "bg-accent text-white rounded px-4.5 py-2.5 font-semibold text-[13.5px] hover:bg-accent-hover transition-colors";
const ghostBtn = "border-[1.5px] border-line rounded px-4 py-2 font-semibold text-[13px] text-ink hover:border-accent transition-colors";
const dangerBtn = "border-[1.5px] border-danger/40 text-danger rounded px-3.5 py-2 font-semibold text-xs hover:bg-danger/10 transition-colors";

export default function AdminTests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      setTests(await listTests());
    } catch (e) {
      setErr("Could not load tests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (payload) => {
    const test = await createTest(payload);
    setShowModal(false);
    setTests((t) => [test, ...t]);
  };

  const handleToggle = async (id) => {
    const updated = await toggleTest(id).catch((e) => {
      alert(e.response?.data?.message || "Could not toggle test");
      return null;
    });
    if (updated) setTests((t) => t.map((x) => (x._id === id ? { ...x, isEnabled: updated.isEnabled } : x)));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this test and all its questions?")) return;
    await deleteTest(id);
    setTests((t) => t.filter((x) => x._id !== id));
  };

  return (
    <DashboardLayout active="tests" links={ADMIN_LINKS} onNavigate={(k) => navigate(k === "overview" ? "/admin" : `/admin/${k}`)}>
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="font-display text-[26px] mb-1">Tests</h1>
          <p className="text-ink-soft text-[13.5px] m-0">Every new test is disabled by default. Enable it once questions are ready.</p>
        </div>
        <button className={stampBtn} onClick={() => setShowModal(true)}>+ New Test</button>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : err ? (
        <div className="bg-danger/10 border border-danger/30 text-danger text-[13px] px-3 py-2.5 rounded">{err}</div>
      ) : tests.length === 0 ? (
        <div className="bg-white border border-line rounded text-center py-12 text-ink-soft">No tests yet. Create your first one.</div>
      ) : (
        <table className="w-full border-collapse bg-white rounded overflow-hidden shadow-sm">
          <thead>
            <tr>
              {["Title", "Category", "Duration", "Marks", "Questions", "Status", ""].map((h) => (
                <th key={h} className="text-left font-mono text-[10.5px] tracking-wide uppercase text-ink-soft bg-slate-100 px-4 py-3 border-b border-line">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tests.map((t) => (
              <tr key={t._id} className="hover:bg-slate-50">
                <td className="px-4 py-3.5 border-b border-slate-100 text-[13.5px]"><strong>{t.title}</strong></td>
                <td className="px-4 py-3.5 border-b border-slate-100 text-[13.5px]">{t.category}</td>
                <td className="px-4 py-3.5 border-b border-slate-100 text-[13.5px]">{t.durationMinutes} min</td>
                <td className="px-4 py-3.5 border-b border-slate-100 text-[13.5px]">{t.totalMarks}</td>
                <td className="px-4 py-3.5 border-b border-slate-100 text-[13.5px]">{t.questionCount}</td>
                <td className="px-4 py-3.5 border-b border-slate-100 text-[13.5px]">
                  <span
                    className={`inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wide uppercase px-2.5 py-1 rounded-full ${
                      t.isEnabled ? "bg-success/10 text-success" : "bg-ink-soft/10 text-ink-soft"
                    }`}
                  >
                    <span className="text-[8px]">●</span>
                    {t.isEnabled ? "Enabled" : "Disabled"}
                  </span>
                </td>
                <td className="px-4 py-3.5 border-b border-slate-100 text-[13.5px]">
                  <div className="flex gap-2 justify-end items-center">
                    <button
                      onClick={() => handleToggle(t._id)}
                      title={t.isEnabled ? "Disable" : "Enable"}
                      className={`relative w-[42px] h-6 rounded-full shrink-0 transition-colors ${t.isEnabled ? "bg-success" : "bg-slate-300"}`}
                    >
                      <span
                        className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${
                          t.isEnabled ? "translate-x-[18px]" : ""
                        }`}
                      />
                    </button>
                    <button className={ghostBtn} onClick={() => navigate(`/admin/tests/${t._id}`)}>Questions</button>
                    <button className={dangerBtn} onClick={() => handleDelete(t._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && <TestFormModal onSave={handleCreate} onClose={() => setShowModal(false)} />}
    </DashboardLayout>
  );
}
