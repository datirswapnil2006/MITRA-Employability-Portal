import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { getTest, createTest, updateTest, toggleTest } from "../../api/tests";
import { getQuestionBank } from "../../api/admin";
import { ADMIN_LINKS } from "./adminLinks";
import {
  FileCheck2, Plus, Trash2, Edit3, CheckCircle, Save, Eye, Layers, AlertCircle, ArrowLeft, Search, Check, Sparkles
} from "lucide-react";

const input = "w-full px-3.5 py-2.5 border-[1.5px] border-line rounded-lg bg-white text-sm text-ink outline-none focus:border-accent transition-colors";
const labelCls = "block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5";
const stampBtn = "bg-accent text-white rounded-lg px-5 py-2.5 font-semibold text-[13.5px] hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2";
const ghostBtn = "border-[1.5px] border-line rounded-lg px-4 py-2 font-semibold text-[13px] text-ink hover:border-accent transition-colors flex items-center justify-center gap-1.5";
const dangerBtn = "border-[1.5px] border-danger/40 text-danger rounded-lg px-3 py-1.5 font-semibold text-xs hover:bg-danger/10 transition-colors flex items-center gap-1";

const DEFAULT_SECTIONS = [
  { name: "Aptitude", topic: "Quantitative Aptitude", questionCount: 10, durationMinutes: 15, marks: 10, instructions: "Solve all quantitative aptitude questions.", questions: [] },
  { name: "Logical Reasoning", topic: "Logical Reasoning", questionCount: 10, durationMinutes: 15, marks: 10, instructions: "Analytical and logical reasoning problems.", questions: [] },
  { name: "Verbal Ability", topic: "Verbal Ability", questionCount: 10, durationMinutes: 10, marks: 10, instructions: "Grammar, comprehension, and vocabulary.", questions: [] },
  { name: "Coding & Programming", topic: "Data Structures & Algorithms", questionCount: 2, durationMinutes: 20, marks: 20, instructions: "Solve using Python, Java, or C++.", questions: [] },
];

export default function AdminPlacementTestBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");

  // Form State
  const [testId, setTestId] = useState(id || null);
  const [title, setTitle] = useState("Official Campus Placement Test 2026");
  const [category, setCategory] = useState("Official Placement Test");
  const [difficulty, setDifficulty] = useState("Medium");
  const [description, setDescription] = useState("Standard placement evaluation test covering Aptitude, Logical Reasoning, Verbal Ability, and Coding.");
  const [instructions, setInstructions] = useState("1. Keep camera enabled throughout the test.\n2. Do not leave the browser tab or minimize the window.\n3. Section time limits apply.");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [passingMarks, setPassingMarks] = useState(30);
  const [isEnabled, setIsEnabled] = useState(false);

  // Dynamic Sections
  const [sections, setSections] = useState(DEFAULT_SECTIONS);

  // Section Question Picker Modal state
  const [activeSectionIndex, setActiveSectionIndex] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [bankQuestions, setBankQuestions] = useState([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerType, setPickerType] = useState("");
  const [pickerDifficulty, setPickerDifficulty] = useState("");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);

  // Preview Modal
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (id) {
      getTest(id)
        .then((t) => {
          setTestId(t._id);
          setTitle(t.title);
          setCategory(t.category);
          setDifficulty(t.difficulty || "Medium");
          setDescription(t.description || "");
          setInstructions(t.instructions || "");
          setDurationMinutes(t.durationMinutes);
          setPassingMarks(t.passingMarks || 0);
          setIsEnabled(t.isEnabled);
          if (t.sections && t.sections.length > 0) {
            setSections(
              t.sections.map((s) => ({
                _id: s._id,
                name: s.name,
                topic: s.topic || "",
                questionCount: s.questionCount || (s.questions ? s.questions.length : 0),
                durationMinutes: s.durationMinutes || 0,
                marks: s.marks || 0,
                instructions: s.instructions || "",
                questions: (s.questions || []).map((q) => (typeof q === "object" ? q : { _id: q })),
              }))
            );
          }
        })
        .catch(() => setError("Could not load test details"))
        .finally(() => setLoading(false));
    }
  }, [id]);

  // Derived total marks
  const calculatedTotalMarks = sections.reduce((sum, sec) => {
    const secQMarks = (sec.questions || []).reduce((qSum, q) => qSum + (q.marks || 1), 0);
    return sum + (secQMarks > 0 ? secQMarks : sec.marks || 0);
  }, 0);

  const calculatedTotalQuestions = sections.reduce((sum, sec) => {
    return sum + (sec.questions?.length || sec.questionCount || 0);
  }, 0);

  // Section Handlers
  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        name: `Section ${prev.length + 1}`,
        topic: "Core Computer Science",
        questionCount: 5,
        durationMinutes: 10,
        marks: 10,
        instructions: "Answer all questions in this section.",
        questions: [],
      },
    ]);
  };

  const removeSection = (index) => {
    if (sections.length <= 1) {
      alert("Placement test must contain at least one section.");
      return;
    }
    setSections((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSectionField = (index, field, value) => {
    setSections((prev) =>
      prev.map((sec, i) => (i === index ? { ...sec, [field]: value } : sec))
    );
  };

  // Open Question Picker for a specific section
  const openQuestionPicker = async (index) => {
    setActiveSectionIndex(index);
    const sec = sections[index];
    setSelectedQuestionIds((sec.questions || []).map((q) => q._id || q));
    setPickerOpen(true);
    setBankLoading(true);

    try {
      const res = await getQuestionBank({
        topic: sec.topic || undefined,
        limit: 100,
      });
      setBankQuestions(res.questions || []);
    } catch (e) {
      alert("Failed to load question bank for this section topic");
    } finally {
      setBankLoading(false);
    }
  };

  const handleSearchBank = async () => {
    setBankLoading(true);
    try {
      const sec = activeSectionIndex !== null ? sections[activeSectionIndex] : null;
      const res = await getQuestionBank({
        topic: sec?.topic || undefined,
        type: pickerType || undefined,
        difficulty: pickerDifficulty || undefined,
        search: pickerSearch || undefined,
        limit: 100,
      });
      setBankQuestions(res.questions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setBankLoading(false);
    }
  };

  const toggleSelectQuestion = (qObj) => {
    const qId = qObj._id;
    setSelectedQuestionIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  const saveSelectedQuestionsForSection = () => {
    if (activeSectionIndex === null) return;
    const selectedObjs = bankQuestions.filter((q) => selectedQuestionIds.includes(q._id));

    setSections((prev) =>
      prev.map((sec, i) => {
        if (i === activeSectionIndex) {
          const existingMap = new Map((sec.questions || []).map((q) => [q._id || q, q]));
          selectedQuestionIds.forEach((id) => {
            if (!existingMap.has(id)) {
              const foundInBank = selectedObjs.find((q) => q._id === id);
              if (foundInBank) existingMap.set(id, foundInBank);
            }
          });
          const newQList = selectedQuestionIds.map((id) => existingMap.get(id) || { _id: id });
          return {
            ...sec,
            questions: newQList,
            questionCount: newQList.length,
          };
        }
        return sec;
      })
    );

    setPickerOpen(false);
  };

  // Real-time Validation
  const validateForm = () => {
    const errs = [];
    if (!title.trim()) errs.push("Test name is required.");
    if (Number(durationMinutes) <= 0) errs.push("Total duration must be greater than 0 minutes.");
    if (sections.length === 0) errs.push("At least one section must be added.");

    sections.forEach((sec, i) => {
      if (!sec.name.trim()) errs.push(`Section #${i + 1} name is required.`);
      if ((sec.questions || []).length === 0) {
        errs.push(`Section "${sec.name || `#${i + 1}`}" has no selected questions.`);
      }
      if (sec.questionCount && sec.questions && sec.questions.length < sec.questionCount) {
        errs.push(`Section "${sec.name}" requires ${sec.questionCount} questions, but only ${sec.questions.length} selected.`);
      }
    });

    setValidationErrors(errs);
    return errs.length === 0;
  };

  const handleSave = async (shouldPublish = false) => {
    setError("");
    setSuccessMessage("");

    const isValid = validateForm();
    if (shouldPublish && !isValid) {
      setError("Please fix the validation errors before publishing.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title,
        category: "Official Placement Test",
        testType: "placement",
        difficulty,
        description,
        instructions,
        durationMinutes: Number(durationMinutes),
        totalMarks: calculatedTotalMarks,
        passingMarks: Number(passingMarks),
        sections: sections.map((sec) => ({
          _id: sec._id,
          name: sec.name,
          topic: sec.topic,
          questionCount: sec.questions ? sec.questions.length : sec.questionCount,
          durationMinutes: Number(sec.durationMinutes),
          marks: (sec.questions || []).reduce((sum, q) => sum + (q.marks || 1), 0) || Number(sec.marks),
          instructions: sec.instructions,
          questions: (sec.questions || []).map((q) => q._id || q),
        })),
        isEnabled: shouldPublish ? true : isEnabled,
      };

      let savedTest;
      if (testId) {
        savedTest = await updateTest(testId, payload);
      } else {
        savedTest = await createTest(payload);
      }

      setTestId(savedTest._id);
      setIsEnabled(savedTest.isEnabled);

      if (shouldPublish && !savedTest.isEnabled) {
        const toggled = await toggleTest(savedTest._id);
        setIsEnabled(toggled.isEnabled);
      }

      setSuccessMessage(
        shouldPublish
          ? "Placement Test published successfully!"
          : "Placement Test draft saved."
      );
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save placement test");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout active="tests" links={ADMIN_LINKS} onNavigate={(k) => navigate(`/admin/${k}`)}>
        <div className="p-12 text-center text-ink-soft">Loading test builder…</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout active="tests" links={ADMIN_LINKS} onNavigate={(k) => navigate(`/admin/${k}`)}>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate("/admin/tests")}
            className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-accent mb-2 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Tests
          </button>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-accent/10 text-accent rounded-lg">
              <FileCheck2 size={24} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">
                {testId ? "Edit Placement Test" : "Create Official Placement Test"}
              </h1>
              <p className="text-ink-soft text-xs">
                Configure multi-section placement assessments, timing, topics, and question selection.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className={ghostBtn} onClick={() => setPreviewOpen(true)}>
            <Eye size={16} /> Preview Test
          </button>
          <button className={ghostBtn} disabled={saving} onClick={() => handleSave(false)}>
            <Save size={16} /> Save Draft
          </button>
          <button className={stampBtn} disabled={saving} onClick={() => handleSave(true)}>
            <CheckCircle size={16} /> Publish Placement Test
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger text-xs px-4 py-3 rounded-xl mb-5 flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs px-4 py-3 rounded-xl mb-5 flex items-center gap-2">
          <Check size={16} /> {successMessage}
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-800 text-xs p-4 rounded-xl mb-6">
          <strong className="block mb-1 font-semibold flex items-center gap-1.5 text-amber-900">
            <AlertCircle size={14} /> Action Required Before Publishing:
          </strong>
          <ul className="list-disc pl-5 space-y-0.5">
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Basic Information */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-line rounded-xl p-5 shadow-sm">
            <h2 className="font-display text-base font-bold text-ink mb-4 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Layers size={18} className="text-accent" /> Basic Test Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>Test Title</label>
                <input
                  className={input}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Official Placement Test 2026"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Difficulty</label>
                  <select className={input} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                    <option>Mixed</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <input className={input} value={category} readOnly disabled />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Total Duration (min)</label>
                  <input
                    type="number"
                    min={1}
                    className={input}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Passing Marks</label>
                  <input
                    type="number"
                    min={0}
                    className={input}
                    value={passingMarks}
                    onChange={(e) => setPassingMarks(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  rows={2}
                  className={input}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className={labelCls}>Test Instructions</label>
                <textarea
                  rows={4}
                  className={input}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </div>

              {/* Stat Summary Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between text-ink-soft">
                  <span>Calculated Total Questions:</span>
                  <strong className="text-ink">{calculatedTotalQuestions} Qs</strong>
                </div>
                <div className="flex justify-between text-ink-soft">
                  <span>Calculated Total Marks:</span>
                  <strong className="text-accent font-bold">{calculatedTotalMarks} Marks</strong>
                </div>
                <div className="flex justify-between text-ink-soft">
                  <span>Status:</span>
                  <span className={`font-semibold ${isEnabled ? "text-success" : "text-amber-600"}`}>
                    {isEnabled ? "● Published" : "Draft"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Section Builder */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-line rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2.5">
              <div>
                <h2 className="font-display text-base font-bold text-ink flex items-center gap-2">
                  <Sparkles size={18} className="text-accent" /> Test Sections & Question Sources
                </h2>
                <p className="text-xs text-ink-soft">Configure section topics, target questions, and select questions from Question Bank.</p>
              </div>
              <button className={ghostBtn} onClick={addSection}>
                <Plus size={15} /> Add Section
              </button>
            </div>

            <div className="space-y-5">
              {sections.map((sec, idx) => {
                const selectedCount = (sec.questions || []).length;
                const totalSecMarks = (sec.questions || []).reduce((sum, q) => sum + (q.marks || 1), 0) || sec.marks;

                return (
                  <div
                    key={sec._id || idx}
                    className="border border-line rounded-xl p-4 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-accent/10 text-accent font-bold text-xs flex items-center justify-center font-mono">
                          {idx + 1}
                        </span>
                        <input
                          className="font-display text-base font-bold text-ink bg-transparent border-b border-dashed border-slate-300 focus:border-accent outline-none px-1 py-0.5"
                          value={sec.name}
                          onChange={(e) => updateSectionField(idx, "name", e.target.value)}
                          placeholder="Section Name"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className={ghostBtn}
                          onClick={() => openQuestionPicker(idx)}
                        >
                          <Edit3 size={14} /> Select Questions ({selectedCount})
                        </button>
                        <button className={dangerBtn} onClick={() => removeSection(idx)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className={labelCls}>Topic / Subtopic</label>
                        <input
                          className={input}
                          value={sec.topic}
                          onChange={(e) => updateSectionField(idx, "topic", e.target.value)}
                          placeholder="e.g. Aptitude, Coding, Core CS"
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Required Questions</label>
                        <input
                          type="number"
                          min={1}
                          className={input}
                          value={sec.questionCount}
                          onChange={(e) => updateSectionField(idx, "questionCount", Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Duration (min)</label>
                        <input
                          type="number"
                          min={1}
                          className={input}
                          value={sec.durationMinutes}
                          onChange={(e) => updateSectionField(idx, "durationMinutes", Number(e.target.value))}
                        />
                      </div>
                    </div>

                    {/* Selected Questions Preview Badges */}
                    {selectedCount > 0 ? (
                      <div className="bg-white border border-slate-200 rounded-lg p-3">
                        <div className="flex items-center justify-between text-xs font-semibold text-ink-soft mb-2">
                          <span>Attached Questions ({selectedCount}):</span>
                          <span>Section Marks: {totalSecMarks}</span>
                        </div>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                          {sec.questions.map((q, qIdx) => (
                            <div key={q._id || qIdx} className="flex items-center justify-between text-xs text-ink bg-slate-50 px-2.5 py-1 rounded border border-slate-100">
                              <span className="truncate max-w-[80%] font-medium">
                                {qIdx + 1}. {q.questionText ? q.questionText.slice(0, 70) + (q.questionText.length > 70 ? "…" : "") : `Question ID: ${q._id || q}`}
                              </span>
                              <span className="font-mono text-[10.5px] uppercase text-accent bg-accent/10 px-1.5 py-0.5 rounded shrink-0">
                                {q.type || "mcq"} · {q.marks || 1}m
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center text-xs text-amber-700">
                        No questions selected yet. Click <strong>"Select Questions"</strong> to pick from the Question Bank.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Question Selector Modal */}
      {pickerOpen && activeSectionIndex !== null && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-line">
            <div className="p-5 border-b border-line flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-display text-lg font-bold">
                  Select Questions for Section: "{sections[activeSectionIndex]?.name}"
                </h3>
                <p className="text-xs text-ink-soft">
                  Topic Filter: <strong>{sections[activeSectionIndex]?.topic || "All Topics"}</strong> · Selected: {selectedQuestionIds.length} questions
                </p>
              </div>
              <button
                className="p-1 rounded-lg text-ink-soft hover:bg-slate-200"
                onClick={() => setPickerOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Modal Filter Controls */}
            <div className="p-4 border-b border-line flex flex-wrap gap-3 bg-white">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
                  <input
                    className={`${input} pl-9`}
                    placeholder="Search question text…"
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                  />
                </div>
              </div>
              <select className={input} style={{ width: 130 }} value={pickerType} onChange={(e) => setPickerType(e.target.value)}>
                <option value="">All Types</option>
                <option value="mcq">MCQ</option>
                <option value="coding">Coding</option>
              </select>
              <select className={input} style={{ width: 130 }} value={pickerDifficulty} onChange={(e) => setPickerDifficulty(e.target.value)}>
                <option value="">All Diff</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              <button className={ghostBtn} onClick={handleSearchBank}>
                Filter
              </button>
            </div>

            {/* Questions Table */}
            <div className="flex-1 overflow-y-auto p-4">
              {bankLoading ? (
                <div className="text-center py-12 text-ink-soft text-xs">Loading Question Bank…</div>
              ) : bankQuestions.length === 0 ? (
                <div className="text-center py-12 text-ink-soft text-xs">
                  No approved questions found matching this section's topic. You can generate questions using AI or PDF upload first.
                </div>
              ) : (
                <div className="space-y-2">
                  {bankQuestions.map((q) => {
                    const isSel = selectedQuestionIds.includes(q._id);
                    return (
                      <div
                        key={q._id}
                        onClick={() => toggleSelectQuestion(q)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isSel ? "border-accent bg-accent/5 shadow-sm" : "border-line hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center mt-0.5 shrink-0 ${
                          isSel ? "bg-accent border-accent text-white" : "border-slate-300"
                        }`}>
                          {isSel && <Check size={12} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-mono text-[10.5px] uppercase font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">
                              {q.type}
                            </span>
                            <span className="text-xs font-semibold text-ink-soft">{q.topic || "General"}</span>
                            <span className="text-xs text-ink-soft">· {q.difficulty} · {q.marks} Marks</span>
                          </div>
                          <p className="text-xs text-ink leading-relaxed font-medium">{q.questionText}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-line flex items-center justify-between bg-slate-50">
              <span className="text-xs font-semibold text-ink">
                {selectedQuestionIds.length} question(s) selected
              </span>
              <div className="flex gap-2">
                <button className={ghostBtn} onClick={() => setPickerOpen(false)}>
                  Cancel
                </button>
                <button className={stampBtn} onClick={saveSelectedQuestionsForSection}>
                  Attach Selected Questions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-line">
            <div className="p-5 border-b border-line flex items-center justify-between bg-slate-900 text-white">
              <div>
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded">
                  Official Placement Test Preview
                </span>
                <h3 className="font-display text-xl font-bold mt-1">{title}</h3>
              </div>
              <button className="text-slate-400 hover:text-white" onClick={() => setPreviewOpen(false)}>
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl text-center text-xs">
                <div>
                  <div className="text-ink-soft">Duration</div>
                  <strong className="text-sm font-bold text-ink">{durationMinutes} Min</strong>
                </div>
                <div>
                  <div className="text-ink-soft">Total Questions</div>
                  <strong className="text-sm font-bold text-ink">{calculatedTotalQuestions}</strong>
                </div>
                <div>
                  <div className="text-ink-soft">Total Marks</div>
                  <strong className="text-sm font-bold text-accent">{calculatedTotalMarks}</strong>
                </div>
                <div>
                  <div className="text-ink-soft">Sections</div>
                  <strong className="text-sm font-bold text-ink">{sections.length}</strong>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-xs text-ink-soft uppercase tracking-wide mb-2">Instructions</h4>
                <p className="text-xs text-ink leading-relaxed whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {instructions || "Standard placement guidelines apply."}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-xs text-ink-soft uppercase tracking-wide mb-3">Section Breakdown</h4>
                <div className="space-y-3">
                  {sections.map((sec, idx) => (
                    <div key={idx} className="border border-line rounded-xl p-4 bg-white">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-ink">{idx + 1}. {sec.name}</span>
                        <span className="text-xs font-semibold text-accent font-mono bg-accent/10 px-2.5 py-0.5 rounded-full">
                          {sec.questions?.length || sec.questionCount} Questions · {sec.durationMinutes} Min
                        </span>
                      </div>
                      <div className="text-xs text-ink-soft">Topic: {sec.topic || "General"}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-line flex justify-end bg-slate-50">
              <button className={stampBtn} onClick={() => setPreviewOpen(false)}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
