import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import QuestionFormModal from "../../components/QuestionFormModal";
import { listTests, addQuestion } from "../../api/tests";
import { extractQuestionsFromPDF } from "../../api/admin";
import { ADMIN_LINKS } from "./adminLinks";
import { FileUp, Upload, FileText, X, CheckCircle } from "lucide-react";

const navigateAdmin = (navigate) => (k) => {
  if (k === "overview") navigate("/admin");
  else if (k === "tests") navigate("/admin/tests");
  else navigate(`/admin/${k}`);
};

const stampBtn = "bg-accent text-white rounded-lg px-5 py-2.5 font-semibold text-[13.5px] hover:bg-accent-hover transition-colors disabled:opacity-50";
const ghostBtn = "border-[1.5px] border-line rounded-lg px-4 py-2 font-semibold text-[13px] text-ink hover:border-accent transition-colors";
const dangerBtn = "border-[1.5px] border-danger/40 text-danger rounded-lg px-3.5 py-2 font-semibold text-xs hover:bg-danger/10 transition-colors";
const input = "w-full px-3 py-2.5 border-[1.5px] border-line rounded-lg bg-white text-sm text-ink outline-none focus:border-accent transition-colors";
const label = "block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5";

let draftCounter = 0;
const nextDraftId = () => `pdf-draft-${Date.now()}-${draftCounter++}`;

export default function AdminQuestionPDF() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [tests, setTests] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState("");
  const [type, setType] = useState("mcq");
  const [difficulty, setDifficulty] = useState("Medium");
  const [marks, setMarks] = useState(2);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testsLoading, setTestsLoading] = useState(true);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState([]);
  const [modalState, setModalState] = useState(null);
  const [extractPreview, setExtractPreview] = useState("");

  useEffect(() => {
    listTests().then((t) => {
      setTests(t);
      if (t.length) setSelectedTestId(t[0]._id);
    }).finally(() => setTestsLoading(false));
  }, []);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f && f.type === "application/pdf") {
      setFile(f);
      setError("");
    } else {
      setError("Please select a valid PDF file");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type === "application/pdf") {
      setFile(f);
      setError("");
    } else {
      setError("Please drop a valid PDF file");
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedTestId) return;
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("pdf", file);
      formData.append("testId", selectedTestId);
      formData.append("type", type);
      formData.append("difficulty", difficulty);
      formData.append("marks", marks);

      const result = await extractQuestionsFromPDF(formData);
      setDrafts(result.drafts.map((d) => ({ ...d, _draftId: nextDraftId() })));
      if (result.extractedText) setExtractPreview(result.extractedText);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to extract questions from PDF");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async (payload) => {
    const created = await addQuestion(selectedTestId, payload);
    if (modalState?._draftId) {
      setDrafts((d) => d.filter((x) => x._draftId !== modalState._draftId));
    }
    setModalState(null);
  };

  const discardDraft = (draftId) => setDrafts((d) => d.filter((x) => x._draftId !== draftId));

  return (
    <DashboardLayout active="questions/pdf" links={ADMIN_LINKS} onNavigate={navigateAdmin(navigate)}>
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-1">
          <FileUp size={22} className="text-accent" />
          <h1 className="font-display text-[26px] font-bold">Upload PDF</h1>
        </div>
        <p className="text-ink-soft text-[13.5px]">
          Upload a PDF document and AI will extract questions from it for your review.
        </p>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger text-[13px] px-4 py-3 rounded-lg mb-5">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Upload Area */}
        <div className="bg-white border border-line rounded-xl p-6">
          <h2 className="font-display text-lg font-semibold mb-4">Upload Document</h2>

          <div className="mb-4">
            <label className={label}>Target Test</label>
            {testsLoading ? (
              <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
            ) : (
              <select className={input} value={selectedTestId} onChange={(e) => setSelectedTestId(e.target.value)}>
                {tests.map((t) => (
                  <option key={t._id} value={t._id}>{t.title}</option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className={label}>Type</label>
              <select className={input} value={type} onChange={(e) => setType(e.target.value)}>
                <option value="mcq">MCQ</option>
                <option value="coding">Coding</option>
              </select>
            </div>
            <div>
              <label className={label}>Difficulty</label>
              <select className={input} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
            <div>
              <label className={label}>Marks</label>
              <input type="number" min={1} className={input} value={marks} onChange={(e) => setMarks(e.target.value)} />
            </div>
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
              file ? "border-accent bg-accent/5" : "border-line hover:border-accent/50 hover:bg-slate-50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText size={24} className="text-accent" />
                <div className="text-left">
                  <div className="text-[13.5px] font-semibold text-ink">{file.name}</div>
                  <div className="text-[12px] text-ink-soft">{(file.size / 1024).toFixed(1)} KB</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="ml-2 p-1 rounded hover:bg-slate-100"
                >
                  <X size={16} className="text-ink-soft" />
                </button>
              </div>
            ) : (
              <>
                <Upload size={32} className="mx-auto text-ink-soft mb-3" />
                <div className="text-[13.5px] font-medium text-ink mb-1">
                  Drop your PDF here or click to browse
                </div>
                <div className="text-[12px] text-ink-soft">Max 50MB · Text-based PDFs only</div>
              </>
            )}
          </div>

          <button
            className={`${stampBtn} w-full mt-4`}
            disabled={!file || !selectedTestId || loading}
            onClick={handleUpload}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Extracting questions…
              </span>
            ) : (
              "Extract Questions with AI"
            )}
          </button>
        </div>

        {/* Preview */}
        {extractPreview && (
          <div className="bg-white border border-line rounded-xl p-6">
            <h2 className="font-display text-lg font-semibold mb-3">Extracted Text Preview</h2>
            <div className="bg-slate-50 rounded-lg p-4 max-h-[400px] overflow-y-auto text-[12.5px] text-ink-soft font-mono whitespace-pre-wrap leading-relaxed">
              {extractPreview}
            </div>
          </div>
        )}
      </div>

      {/* Drafts */}
      {drafts.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-semibold mb-1">
            <span className="text-accent">{drafts.length}</span> Draft Questions — Pending Review
          </h2>
          <p className="text-ink-soft text-[13px] mb-4">
            Review and save each question. Nothing is added to the test until you approve it.
          </p>

          <div className="space-y-3">
            {drafts.map((d) => (
              <div key={d._draftId} className="bg-white border border-line rounded-xl p-4 flex items-start gap-4 hover:shadow-sm transition-shadow">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10.5px] uppercase tracking-wide text-accent bg-accent/10 px-2 py-0.5 rounded">
                      {d.type}
                    </span>
                    <span className="text-[11px] text-ink-soft">{d.difficulty} · {d.marks} marks</span>
                  </div>
                  <p className="text-[13px] text-ink">{d.questionText?.slice(0, 120)}{d.questionText?.length > 120 ? "…" : ""}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button className={stampBtn} onClick={() => setModalState(d)}>Review & Save</button>
                  <button className={dangerBtn} onClick={() => discardDraft(d._draftId)}>Discard</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {modalState && (
        <QuestionFormModal
          initial={modalState}
          onSave={handleSaveDraft}
          onClose={() => setModalState(null)}
        />
      )}
    </DashboardLayout>
  );
}
