import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import QuestionFormModal from "../../components/QuestionFormModal";
import { listTests, addQuestion } from "../../api/tests";
import { ADMIN_LINKS } from "./adminLinks";
import { PenLine, ChevronDown } from "lucide-react";

const navigateAdmin = (navigate) => (k) => {
  if (k === "overview") navigate("/admin");
  else if (k === "tests") navigate("/admin/tests");
  else navigate(`/admin/${k}`);
};

const stampBtn = "bg-accent text-white rounded-lg px-5 py-2.5 font-semibold text-[13.5px] hover:bg-accent-hover transition-colors";
const input = "w-full px-3 py-2.5 border-[1.5px] border-line rounded-lg bg-white text-sm text-ink outline-none focus:border-accent transition-colors";
const label = "block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5";

export default function AdminQuestionManual() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    listTests().then((t) => {
      setTests(t);
      if (t.length) setSelectedTestId(t[0]._id);
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async (payload) => {
    if (!selectedTestId) {
      alert("Please select a test first");
      return;
    }
    await addQuestion(selectedTestId, payload);
    setShowModal(false);
    setSuccess("Question added successfully!");
    setTimeout(() => setSuccess(""), 3000);
  };

  const selectedTest = tests.find((t) => t._id === selectedTestId);

  return (
    <DashboardLayout active="questions/manual" links={ADMIN_LINKS} onNavigate={navigateAdmin(navigate)}>
      <div className="flex items-start justify-between mb-7 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <PenLine size={22} className="text-accent" />
            <h1 className="font-display text-[26px] font-bold">Manual Entry</h1>
          </div>
          <p className="text-ink-soft text-[13.5px]">
            Create questions manually and assign them to a test.
          </p>
        </div>
      </div>

      {success && (
        <div className="bg-success/10 border border-success/30 text-success text-[13px] px-4 py-3 rounded-lg mb-5 flex items-center gap-2">
          <span className="text-[8px]">●</span> {success}
        </div>
      )}

      <div className="bg-white border border-line rounded-xl p-6 mb-6 max-w-xl">
        <div className="mb-5">
          <label className={label}>Select Target Test</label>
          {loading ? (
            <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
          ) : tests.length === 0 ? (
            <p className="text-ink-soft text-[13px]">No tests available. Create a test first.</p>
          ) : (
            <select className={input} value={selectedTestId} onChange={(e) => setSelectedTestId(e.target.value)}>
              {tests.map((t) => (
                <option key={t._id} value={t._id}>{t.title} — {t.category}</option>
              ))}
            </select>
          )}
        </div>

        {selectedTest && (
          <div className="bg-slate-50 rounded-lg p-4 mb-5 text-[13px]">
            <div className="font-semibold text-ink mb-1">{selectedTest.title}</div>
            <div className="text-ink-soft">
              {selectedTest.category} · {selectedTest.durationMinutes} min · {selectedTest.totalMarks} marks · {selectedTest.questionCount || 0} questions
            </div>
          </div>
        )}

        <button
          className={stampBtn}
          disabled={!selectedTestId}
          onClick={() => setShowModal(true)}
        >
          + Add Question
        </button>
      </div>

      {showModal && (
        <QuestionFormModal
          initial={null}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </DashboardLayout>
  );
}
