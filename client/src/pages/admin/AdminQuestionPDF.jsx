import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import QuestionFormModal from "../../components/QuestionFormModal";
import { listTests, addQuestion } from "../../api/tests";
import { extractQuestionsFromPDF, bulkAddQuestions } from "../../api/admin";
import { ADMIN_LINKS } from "./adminLinks";
import { FileUp, Upload, FileText, X, CheckCircle, Check, Trash2, Edit3, Sparkles } from "lucide-react";

const navigateAdmin = (navigate) => (k) => {
  if (k === "overview") navigate("/admin");
  else if (k === "tests") navigate("/admin/tests");
  else navigate(`/admin/${k}`);
};

const stampBtn = "bg-accent text-white rounded-lg px-5 py-2.5 font-semibold text-[13.5px] hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5";
const ghostBtn = "border-[1.5px] border-line rounded-lg px-4 py-2 font-semibold text-[13px] text-ink hover:border-accent transition-colors flex items-center justify-center gap-1.5";
const dangerBtn = "border-[1.5px] border-danger/40 text-danger rounded-lg px-3 py-1.5 font-semibold text-xs hover:bg-danger/10 transition-colors flex items-center gap-1";

let draftCounter = 0;
const nextDraftId = () => `pdf-draft-${Date.now()}-${draftCounter++}`;

export default function AdminQuestionPDF() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [tests, setTests] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState("");
  const [topic, setTopic] = useState("Aptitude");
  const [type, setType] = useState("mcq");
  const [difficulty, setDifficulty] = useState("Medium");
  const [marks, setMarks] = useState(2);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testsLoading, setTestsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [drafts, setDrafts] = useState([]);
  const [selectedDraftIds, setSelectedDraftIds] = useState([]);
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
    if (!file) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const formData = new FormData();
      formData.append("pdf", file);
      if (selectedTestId) formData.append("testId", selectedTestId);
      formData.append("topic", topic);
      formData.append("type", type);
      formData.append("difficulty", difficulty);
      formData.append("marks", marks);

      const result = await extractQuestionsFromPDF(formData);
      const newDrafts = result.drafts.map((d) => ({
        ...d,
        _draftId: nextDraftId(),
        status: "pending_review",
        sourcePdf: file.name,
      }));
      setDrafts(newDrafts);
      setSelectedDraftIds(newDrafts.map((d) => d._draftId));
      if (result.extractedText) setExtractPreview(result.extractedText);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to extract questions from PDF");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectDraft = (id) => {
    setSelectedDraftIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const updateDraftStatus = (draftId, status) => {
    setDrafts((prev) =>
      prev.map((d) => (d._draftId === draftId ? { ...d, status } : d))
    );
  };

  const handleSaveDraftModal = (payload) => {
    if (modalState?._draftId) {
      setDrafts((prev) =>
        prev.map((d) => (d._draftId === modalState._draftId ? { ...d, ...payload, status: "approved" } : d))
      );
    }
    setModalState(null);
  };

  const discardDraft = (draftId) => {
    setDrafts((d) => d.filter((x) => x._draftId !== draftId));
    setSelectedDraftIds((prev) => prev.filter((i) => i !== draftId));
  };

  const handleBatchApproveAndAdd = async () => {
    const toAdd = drafts.filter((d) => selectedDraftIds.includes(d._draftId) && d.status !== "rejected");
    if (toAdd.length === 0) {
      alert("Select at least one question to add.");
      return;
    }

    try {
      const formatted = toAdd.map((d) => ({
        ...d,
        status: "approved",
        testId: selectedTestId || null,
      }));

      await bulkAddQuestions(formatted, selectedTestId || null);
      setSuccess(`Successfully added ${toAdd.length} approved question(s) to Question Bank!`);
      setDrafts((prev) => prev.filter((d) => !selectedDraftIds.includes(d._draftId)));
      setSelectedDraftIds([]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to batch add questions");
    }
  };

  return (
    <DashboardLayout active="questions/pdf" links={ADMIN_LINKS} onNavigate={navigateAdmin(navigate)}>
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-1">
          <FileUp size={22} className="text-accent" />
          <h1 className="font-display text-[26px] font-bold">PDF Question Extraction</h1>
        </div>
        <p className="text-ink-soft text-[13.5px]">
          Upload question papers or study PDFs. AI extracts questions, options, and explanations for your review before publishing.
        </p>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger text-[13px] px-4 py-3 rounded-lg mb-5">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-[13px] px-4 py-3 rounded-lg mb-5">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Upload Area */}
        <div className="bg-white border border-line rounded-xl p-6">
          <h2 className="font-display text-lg font-semibold mb-4">Upload PDF Document</h2>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5">
              Topic / Section
            </label>
            <input
              className="w-full px-3 py-2 border border-line rounded-lg text-sm outline-none focus:border-accent"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Aptitude, Logical Reasoning, Java"
            />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5">Type</label>
              <select className="w-full px-3 py-2 border border-line rounded-lg text-sm" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="mcq">MCQ</option>
                <option value="coding">Coding</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5">Difficulty</label>
              <select className="w-full px-3 py-2 border border-line rounded-lg text-sm" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5">Marks</label>
              <input type="number" min={1} className="w-full px-3 py-2 border border-line rounded-lg text-sm" value={marks} onChange={(e) => setMarks(e.target.value)} />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5">Target Test (Optional)</label>
            {testsLoading ? (
              <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
            ) : (
              <select className="w-full px-3 py-2 border border-line rounded-lg text-sm" value={selectedTestId} onChange={(e) => setSelectedTestId(e.target.value)}>
                <option value="">None (Add to Question Bank directly)</option>
                {tests.map((t) => (
                  <option key={t._id} value={t._id}>{t.title}</option>
                ))}
              </select>
            )}
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              file ? "border-accent bg-accent/5" : "border-line hover:border-accent/50 hover:bg-slate-50"
            }`}
          >
            <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText size={24} className="text-accent" />
                <div className="text-left">
                  <div className="text-[13.5px] font-semibold text-ink">{file.name}</div>
                  <div className="text-[12px] text-ink-soft">{(file.size / 1024).toFixed(1)} KB</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="ml-2 p-1 rounded hover:bg-slate-100">
                  <X size={16} className="text-ink-soft" />
                </button>
              </div>
            ) : (
              <>
                <Upload size={32} className="mx-auto text-ink-soft mb-3" />
                <div className="text-[13.5px] font-medium text-ink mb-1">Drop your PDF here or click to browse</div>
                <div className="text-[12px] text-ink-soft">Max 50MB · Text-based PDFs only</div>
              </>
            )}
          </div>

          <button className={`${stampBtn} w-full mt-4`} disabled={!file || loading} onClick={handleUpload}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Extracting questions…
              </span>
            ) : (
              "Extract Questions with AI"
            )}
          </button>
        </div>

        {/* Text Preview */}
        {extractPreview && (
          <div className="bg-white border border-line rounded-xl p-6">
            <h2 className="font-display text-lg font-semibold mb-3">Extracted Text Preview</h2>
            <div className="bg-slate-50 rounded-lg p-4 max-h-[380px] overflow-y-auto text-[12.5px] text-ink-soft font-mono whitespace-pre-wrap leading-relaxed border border-slate-100">
              {extractPreview}
            </div>
          </div>
        )}
      </div>

      {/* Review Extracted Questions Table */}
      {drafts.length > 0 && (
        <div className="bg-white border border-line rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="font-display text-lg font-bold">
                Review Extracted Questions ({drafts.length})
              </h2>
              <p className="text-xs text-ink-soft">Review topic, options, correct answers, and explanations before adding to Question Bank.</p>
            </div>
            <button className={stampBtn} onClick={handleBatchApproveAndAdd}>
              <CheckCircle size={16} /> Approve & Add Selected ({selectedDraftIds.length})
            </button>
          </div>

          <div className="space-y-4">
            {drafts.map((d, idx) => {
              const isSel = selectedDraftIds.includes(d._draftId);
              return (
                <div
                  key={d._draftId}
                  className={`border rounded-xl p-4 transition-all ${
                    d.status === "approved" ? "border-emerald-300 bg-emerald-50/20" :
                    d.status === "rejected" ? "border-rose-200 bg-rose-50/20 opacity-60" :
                    "border-line bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => toggleSelectDraft(d._draftId)}
                      className="mt-1 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10.5px] uppercase font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">
                            {d.type}
                          </span>
                          <span className="text-xs font-semibold text-ink font-mono">Topic: {d.topic}</span>
                          <span className="text-xs text-ink-soft">· {d.difficulty} · {d.marks} Marks</span>
                          <span className="text-xs text-ink-soft font-mono">Source PDF: {d.sourcePdf}</span>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          d.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                          d.status === "rejected" ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>
                          {d.status}
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-ink mb-2">{idx + 1}. {d.questionText}</p>

                      {/* Options for MCQ */}
                      {d.type === "mcq" && d.options && (
                        <div className="grid grid-cols-2 gap-2 mb-2 bg-slate-50 p-2.5 rounded-lg text-xs">
                          {d.options.map((opt, oIdx) => (
                            <div key={oIdx} className={`p-1.5 rounded border ${oIdx === d.correctOptionIndex ? "border-emerald-500 bg-emerald-100 text-emerald-900 font-bold" : "border-slate-200 text-ink-soft"}`}>
                              {String.fromCharCode(65 + oIdx)}. {opt} {oIdx === d.correctOptionIndex && "✓ (Correct)"}
                            </div>
                          ))}
                        </div>
                      )}

                      {d.explanation && (
                        <div className="text-xs text-ink-soft bg-blue-50/50 border border-blue-100 p-2 rounded-lg mb-2">
                          <strong>Explanation:</strong> {d.explanation}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button className={ghostBtn} onClick={() => setModalState(d)}>
                        <Edit3 size={14} /> Edit
                      </button>
                      <button
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        onClick={() => updateDraftStatus(d._draftId, "approved")}
                      >
                        Approve
                      </button>
                      <button
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200"
                        onClick={() => updateDraftStatus(d._draftId, "rejected")}
                      >
                        Reject
                      </button>
                      <button className={dangerBtn} onClick={() => discardDraft(d._draftId)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {modalState && (
        <QuestionFormModal
          initial={modalState}
          onSave={handleSaveDraftModal}
          onClose={() => setModalState(null)}
        />
      )}
    </DashboardLayout>
  );
}
