import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import TestFormModal from "../../components/TestFormModal";
import { listTests, createTest, toggleTest, deleteTest } from "../../api/tests";
import { ADMIN_LINKS } from "./adminLinks";
import { Dumbbell } from "lucide-react";

const navigateAdmin = (navigate) => (k) => {
  if (k === "overview") navigate("/admin");
  else if (k === "tests") navigate("/admin/tests");
  else navigate(`/admin/${k}`);
};

const stampBtn = "bg-accent text-white rounded-lg px-5 py-2.5 font-semibold text-[13.5px] hover:bg-accent-hover transition-colors";
const ghostBtn = "border-[1.5px] border-line rounded-lg px-4 py-2 font-semibold text-[13px] text-ink hover:border-accent transition-colors";
const dangerBtn = "border-[1.5px] border-danger/40 text-danger rounded-lg px-3.5 py-2 font-semibold text-xs hover:bg-danger/10 transition-colors";

export default function AdminPracticeTests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const allTests = await listTests();
      setTests(allTests.filter((t) => t.isPractice));
    } catch (e) {
      setErr("Could not load practice tests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (payload) => {
    const test = await createTest({ ...payload, isPractice: true, allowRetake: true });
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
    if (!window.confirm("Delete this practice test and all its questions?")) return;
    await deleteTest(id);
    setTests((t) => t.filter((x) => x._id !== id));
  };

  return (
    <DashboardLayout active="practice" links={ADMIN_LINKS} onNavigate={navigateAdmin(navigate)}>
      <div className="flex items-start justify-between mb-7">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Dumbbell size={22} className="text-accent" />
            <h1 className="font-display text-[26px] font-bold">Practice Tests</h1>
          </div>
          <p className="text-ink-soft text-[13.5px]">
            Practice tests can be retaken by students. No time limits enforced.
          </p>
        </div>
        <button className={stampBtn} onClick={() => setShowModal(true)}>+ New Practice Test</button>
      </div>

      {loading ? (
        <div className="bg-white border border-line rounded-xl p-12 text-center">
          <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-ink-soft text-[13px]">Loading…</p>
        </div>
      ) : err ? (
        <div className="bg-danger/10 border border-danger/30 text-danger text-[13px] px-4 py-3 rounded-lg">{err}</div>
      ) : tests.length === 0 ? (
        <div className="bg-white border border-line rounded-xl text-center py-12">
          <Dumbbell size={36} className="mx-auto text-ink-soft/40 mb-3" />
          <p className="text-ink-soft text-[13.5px]">No practice tests yet. Create your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
          {tests.map((t) => (
            <div key={t._id} className="bg-white border border-line rounded-xl p-5 hover:shadow-md transition-all duration-200 group">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-display text-[16px] font-semibold text-ink group-hover:text-accent transition-colors">
                  {t.title}
                </h3>
                <span
                  className={`inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wide uppercase px-2 py-0.5 rounded-full ${
                    t.isEnabled ? "bg-success/10 text-success" : "bg-ink-soft/10 text-ink-soft"
                  }`}
                >
                  <span className="text-[7px]">●</span>
                  {t.isEnabled ? "Active" : "Draft"}
                </span>
              </div>
              <div className="text-[12px] text-ink-soft mb-4 space-y-1">
                <div>{t.category}</div>
                <div>{t.durationMinutes} min · {t.totalMarks} marks · Retakes allowed</div>
              </div>
              <div className="flex items-center gap-2">
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
            </div>
          ))}
        </div>
      )}

      {showModal && <TestFormModal onSave={handleCreate} onClose={() => setShowModal(false)} />}
    </DashboardLayout>
  );
}
