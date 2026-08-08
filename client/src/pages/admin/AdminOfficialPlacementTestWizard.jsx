import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { ADMIN_LINKS } from "./adminLinks";
import { createTest, updateTest, getTest, listTests, toggleTest, deleteTest } from "../../api/tests";
import {
  generateTestBlueprintApi,
  generateAptitudeQuestionsApi,
  generateLogicalQuestionsApi,
  generateVerbalQuestionsApi,
  generateCodingQuestionsApi,
  extractQuestionsFromPDF,
  bulkAddQuestions,
} from "../../api/admin";
import {
  Sparkles, FileUp, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight,
  Edit3, Trash2, Check, X, Eye, FileText, Layers, Clock, Award, Plus,
  ShieldCheck, RefreshCw, List, PlusCircle, Power, ChevronRight
} from "lucide-react";

const STEPS = [
  { id: 1, name: "Test Details" },
  { id: 2, name: "Question Source" },
  { id: 3, name: "Generate & Extract" },
  { id: 4, name: "Review Questions" },
  { id: 5, name: "Test Preview" },
  { id: 6, name: "Publish" },
];

const PRESET_PROMPTS = [
  {
    title: "Final Year Campus Recruitment Test",
    prompt: "Create a medium-level placement test for final-year engineering students. The test should contain aptitude, logical reasoning, verbal ability, DSA and coding. Duration should be 60 minutes. Include approximately 30 multiple-choice questions and 2 coding questions. Give higher weight to aptitude, logical reasoning and DSA. Questions should be suitable for campus placement preparation.",
  },
  {
    title: "Software Engineering Core Assessment",
    prompt: "Design a 45-minute placement assessment for software engineering roles focusing on Data Structures, Algorithms, Computer Networks, DBMS, and 1 Coding challenge. Total 25 questions.",
  },
  {
    title: "Aptitude & Analytical Speed Test",
    prompt: "Create a 30-minute high-speed screening test containing 20 Quantitative Aptitude and 15 Logical Reasoning MCQs of Medium difficulty.",
  },
];

export default function AdminOfficialPlacementTestWizard() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Top view tab: "list" (manage existing tests) vs "wizard" (create/edit test)
  const [viewMode, setViewMode] = useState(id ? "wizard" : "list");

  // Created Tests List State
  const [createdTests, setCreatedTests] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Step 1: Test Details
  const [title, setTitle] = useState("Official Campus Placement Assessment 2026");
  const [description, setDescription] = useState("Comprehensive campus placement evaluation covering Aptitude, Logical Reasoning, Verbal Ability, DSA, and Coding.");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [difficulty, setDifficulty] = useState("Medium");
  const [instructions, setInstructions] = useState("1. Keep camera enabled throughout the test.\n2. Do not leave the browser tab or minimize the window.\n3. Section time limits apply.");

  // Step 2: Source selection & AI Prompt
  const [selectedSources, setSelectedSources] = useState({ ai: true, pdf: false });
  const [aiPrompt, setAiPrompt] = useState(PRESET_PROMPTS[0].prompt);
  const [blueprint, setBlueprint] = useState(null);
  const [isGeneratingBlueprint, setIsGeneratingBlueprint] = useState(false);
  const [isEditingBlueprint, setIsEditingBlueprint] = useState(false);

  // PDF uploads
  const [pdfFiles, setPdfFiles] = useState([]);
  const [isExtractingPdfs, setIsExtractingPdfs] = useState(false);

  // Step 3 & 4: Questions Review Pool
  const [questions, setQuestions] = useState([]); // [{ tempId, questionText, type, topic, subtopic, difficulty, marks, source, status, options, correctOptionIndex, languages, sampleTestCases, hiddenTestCases, explanation }]
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [reviewFilter, setReviewFilter] = useState("all"); // all, ai, pdf, pending_review, approved, rejected
  const [selectedQTempIds, setSelectedQTempIds] = useState([]);

  // Step 5: Test Build & Student Preview Modal
  const [builtSections, setBuiltSections] = useState([]);
  const [studentPreviewOpen, setStudentPreviewOpen] = useState(false);
  const [studentPreviewQIndex, setStudentPreviewQIndex] = useState(0);

  // Step 6: Validation & Publishing
  const [publishing, setPublishing] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // Load list of created placement tests
  const fetchCreatedTests = async () => {
    setLoadingList(true);
    try {
      const all = await listTests();
      setCreatedTests(all || []);
    } catch (err) {
      console.error("Failed to load tests list:", err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchCreatedTests();
  }, []);

  // Load existing test if ID provided
  useEffect(() => {
    if (id) {
      setViewMode("wizard");
      setLoading(true);
      getTest(id)
        .then((t) => {
          setTitle(t.title);
          setDescription(t.description || "");
          setDurationMinutes(t.durationMinutes);
          setDifficulty(t.difficulty || "Medium");
          setInstructions(t.instructions || "");
          if (t.sections && t.sections.length > 0) {
            const extractedQs = [];
            const secs = t.sections.map((s) => {
              const qList = (s.questions || []).map((q) => {
                const qObj = typeof q === "object" ? q : { _id: q };
                const tempId = qObj._id || `loaded-${Math.random()}`;
                extractedQs.push({
                  ...qObj,
                  tempId,
                  status: qObj.status || "approved",
                  source: qObj.source || "manual",
                });
                return tempId;
              });
              return {
                id: s._id || `sec-${Math.random()}`,
                name: s.name,
                topic: s.topic || s.name,
                mcqCount: qList.filter(id => extractedQs.find(q => q.tempId === id)?.type !== "coding").length,
                codingCount: qList.filter(id => extractedQs.find(q => q.tempId === id)?.type === "coding").length,
                marksPerMcq: 1,
                marksPerCoding: 10,
                instructions: s.instructions || "",
                assignedQTempIds: qList,
              };
            });
            setQuestions(extractedQs);
            setBuiltSections(secs);
          }
        })
        .catch(() => setError("Could not load placement test details"))
        .finally(() => setLoading(false));
    }
  }, [id]);

  // Handle Enable / Disable Toggle
  const handleToggleTest = async (testId) => {
    try {
      const updated = await toggleTest(testId);
      if (updated) {
        setCreatedTests((prev) =>
          prev.map((t) => (t._id === testId ? { ...t, isEnabled: updated.isEnabled } : t))
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to toggle test status");
    }
  };

  // Handle Delete Test
  const handleDeleteTest = async (testId) => {
    if (!window.confirm("Are you sure you want to delete this placement test and all its questions?")) return;
    try {
      await deleteTest(testId);
      setCreatedTests((prev) => prev.filter((t) => t._id !== testId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete test");
    }
  };

  // Handle Blueprint Generation
  const handleGenerateBlueprint = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingBlueprint(true);
    setError("");
    try {
      const res = await generateTestBlueprintApi(aiPrompt);
      if (res?.data) {
        setBlueprint(res.data);
        if (res.data.title) setTitle(res.data.title);
        if (res.data.description) setDescription(res.data.description);
        if (res.data.durationMinutes) setDurationMinutes(res.data.durationMinutes);
        if (res.data.difficulty) setDifficulty(res.data.difficulty);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to generate test blueprint");
    } finally {
      setIsGeneratingBlueprint(false);
    }
  };

  // Handle Question Generation & PDF extraction step trigger
  const handleStartGenerationAndExtraction = async () => {
    setError("");
    setCurrentStep(3);
    setIsGeneratingQuestions(true);

    const generated = [];

    try {
      // 1. AI Generation based on Blueprint or prompt
      if (selectedSources.ai && blueprint?.sections) {
        for (const sec of blueprint.sections) {
          if (sec.mcqCount > 0) {
            let apiCall = generateAptitudeQuestionsApi;
            const topLower = (sec.topic || sec.name).toLowerCase();
            if (topLower.includes("logical") || topLower.includes("reasoning")) {
              apiCall = generateLogicalQuestionsApi;
            } else if (topLower.includes("verbal") || topLower.includes("english")) {
              apiCall = generateVerbalQuestionsApi;
            }

            try {
              const res = await apiCall({
                topic: sec.topic || sec.name,
                difficulty,
                count: sec.mcqCount,
                marks: sec.marksPerMcq || 1,
              });
              if (res?.data && Array.isArray(res.data)) {
                res.data.forEach((q) => {
                  generated.push({
                    ...q,
                    tempId: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                    topic: sec.topic || sec.name,
                    source: "ai",
                    status: "pending_review",
                  });
                });
              }
            } catch (secErr) {
              console.warn(`Error generating MCQs for section ${sec.name}:`, secErr);
            }
          }

          if (sec.codingCount > 0) {
            try {
              const res = await generateCodingQuestionsApi({
                topic: sec.topic || "Data Structures & Algorithms",
                difficulty,
                count: sec.codingCount,
                marks: sec.marksPerCoding || 10,
                languages: ["python", "java", "cpp"],
              });
              if (res?.data && Array.isArray(res.data)) {
                res.data.forEach((q) => {
                  generated.push({
                    ...q,
                    tempId: `ai-code-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                    topic: sec.topic || "Data Structures & Algorithms",
                    source: "ai",
                    status: "pending_review",
                  });
                });
              }
            } catch (secErr) {
              console.warn(`Error generating coding problems for section ${sec.name}:`, secErr);
            }
          }
        }
      }

      // 2. PDF Extraction
      if (selectedSources.pdf && pdfFiles.length > 0) {
        setIsExtractingPdfs(true);
        for (const fileObj of pdfFiles) {
          const formData = new FormData();
          formData.append("pdf", fileObj.file);
          formData.append("topic", fileObj.topic || "General");
          formData.append("type", fileObj.type || "mcq");
          formData.append("difficulty", difficulty);
          formData.append("marks", 1);

          try {
            const pdfRes = await extractQuestionsFromPDF(formData);
            if (pdfRes?.drafts && Array.isArray(pdfRes.drafts)) {
              pdfRes.drafts.forEach((q) => {
                generated.push({
                  ...q,
                  tempId: `pdf-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                  source: "pdf",
                  status: "pending_review",
                });
              });
            }
          } catch (pdfErr) {
            console.warn(`Error extracting from PDF ${fileObj.file.name}:`, pdfErr);
          }
        }
        setIsExtractingPdfs(false);
      }

      setQuestions((prev) => [...prev, ...generated]);
    } catch (err) {
      setError("Some questions could not be automatically generated. You can edit or add questions manually.");
    } finally {
      setIsGeneratingQuestions(false);
      // Automatically advance to Review Questions step
      setCurrentStep(4);
    }
  };

  // Review Questions state logic
  const approvedCount = questions.filter((q) => q.status === "approved").length;
  const pendingCount = questions.filter((q) => q.status === "pending_review").length;
  const rejectedCount = questions.filter((q) => q.status === "rejected").length;

  const filteredQuestions = questions.filter((q) => {
    if (reviewFilter === "ai") return q.source === "ai";
    if (reviewFilter === "pdf") return q.source === "pdf";
    if (reviewFilter === "pending_review") return q.status === "pending_review";
    if (reviewFilter === "approved") return q.status === "approved";
    if (reviewFilter === "rejected") return q.status === "rejected";
    return true;
  });

  const handleUpdateStatus = (tempId, newStatus) => {
    setQuestions((prev) =>
      prev.map((q) => (q.tempId === tempId ? { ...q, status: newStatus } : q))
    );
  };

  const handleBulkStatus = (newStatus) => {
    setQuestions((prev) =>
      prev.map((q) => (selectedQTempIds.includes(q.tempId) ? { ...q, status: newStatus } : q))
    );
    setSelectedQTempIds([]);
  };

  // Build Sections automatically based on approved questions
  const handleAutoBuildSections = () => {
    const approvedQs = questions.filter((q) => q.status === "approved");
    const grouped = {};

    approvedQs.forEach((q) => {
      const top = q.topic || "General Aptitude";
      if (!grouped[top]) {
        grouped[top] = [];
      }
      grouped[top].push(q);
    });

    const newSections = Object.keys(grouped).map((topicName, idx) => {
      const qList = grouped[topicName];
      const mcqs = qList.filter((q) => q.type === "mcq");
      const coding = qList.filter((q) => q.type === "coding");

      return {
        id: `build-sec-${idx}`,
        name: topicName,
        topic: topicName,
        mcqCount: mcqs.length,
        codingCount: coding.length,
        assignedQTempIds: qList.map((q) => q.tempId),
        instructions: `Complete all questions in the ${topicName} section.`,
      };
    });

    setBuiltSections(newSections);
    setCurrentStep(5);
  };

  // Validation logic before publishing
  const validateBeforePublish = () => {
    const errs = [];
    if (!title.trim()) errs.push("Test Name is required");
    if (!durationMinutes || durationMinutes <= 0) errs.push("Duration must be greater than 0 minutes");

    const approvedQs = questions.filter((q) => q.status === "approved");
    if (approvedQs.length === 0) errs.push("Add and approve at least 1 question for the test");

    approvedQs.forEach((q, idx) => {
      if (q.type === "mcq") {
        if (!q.options || q.options.length < 2) errs.push(`Question #${idx + 1} has less than 2 options`);
        if (q.correctOptionIndex === undefined || q.correctOptionIndex === null) errs.push(`Question #${idx + 1} has no correct answer selected`);
      }
      if (q.type === "coding") {
        if (!q.sampleTestCases || q.sampleTestCases.length === 0) errs.push(`Coding Question #${idx + 1} lacks sample test cases`);
      }
    });

    setValidationErrors(errs);
    return errs.length === 0;
  };

  // Handle Publish
  const handlePublishTest = async () => {
    if (!validateBeforePublish()) {
      setCurrentStep(6);
      return;
    }

    setPublishing(true);
    setError("");

    try {
      const approvedQs = questions.filter((q) => q.status === "approved");
      
      // Step 1: Bulk add approved questions to DB
      const bulkRes = await bulkAddQuestions(approvedQs, id || null);
      const savedQuestionDocs = bulkRes.questions || [];

      // Map tempId to saved Mongo _id
      const idMap = {};
      approvedQs.forEach((q, i) => {
        if (savedQuestionDocs[i]) {
          idMap[q.tempId] = savedQuestionDocs[i]._id;
        }
      });

      // Assemble final section array with DB ObjectIds
      const finalSections = builtSections.map((sec) => {
        const qIds = sec.assignedQTempIds.map((tid) => idMap[tid]).filter(Boolean);
        const secQuestions = savedQuestionDocs.filter((sqd) => qIds.includes(sqd._id));
        const totalMarks = secQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);

        return {
          name: sec.name,
          topic: sec.topic,
          questionCount: qIds.length,
          durationMinutes: Math.round(durationMinutes / (builtSections.length || 1)),
          marks: totalMarks,
          instructions: sec.instructions,
          questions: qIds,
        };
      });

      const totalMarksSum = finalSections.reduce((sum, s) => sum + s.marks, 0);

      const payload = {
        title,
        category: "Official Placement Test",
        testType: "placement",
        difficulty,
        description,
        instructions,
        durationMinutes: Number(durationMinutes),
        totalMarks: totalMarksSum || approvedQs.reduce((s, q) => s + (q.marks || 1), 0),
        passingMarks: Math.round((totalMarksSum || 50) * 0.4),
        sections: finalSections,
        isEnabled: true, // published immediately!
      };

      if (id) {
        await updateTest(id, payload);
      } else {
        await createTest(payload);
      }

      setSuccessMessage("Official Placement Test successfully published and made available to students!");
      fetchCreatedTests();
      setTimeout(() => {
        setViewMode("list");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to publish test");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <DashboardLayout
      active="official-placement-test"
      links={ADMIN_LINKS}
      onNavigate={(k) => navigate(`/admin/${k}`)}
    >
      {/* View Switcher Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
            <Sparkles size={16} /> Campus Recruitment Module
          </div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
            Official Placement Tests
          </h1>
        </div>

        {/* View mode toggle tabs */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-line dark:border-slate-700">
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              viewMode === "list"
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <List size={16} />
            Official Tests ({createdTests.length})
          </button>
          <button
            onClick={() => {
              setViewMode("wizard");
              setCurrentStep(1);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              viewMode === "wizard"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <PlusCircle size={16} />
            + Create New Test
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: CREATED TESTS LIST */}
      {viewMode === "list" && (
        <div className="space-y-6">
          {/* Summary Stat Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 border border-line dark:border-slate-700 rounded-xl p-5">
              <div className="text-xs font-semibold uppercase text-slate-400 mb-1">Total Official Tests</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{createdTests.length}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-line dark:border-slate-700 rounded-xl p-5">
              <div className="text-xs font-semibold uppercase text-slate-400 mb-1">Active / Enabled Tests</div>
              <div className="text-2xl font-bold text-emerald-600">{createdTests.filter((t) => t.isEnabled).length}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-line dark:border-slate-700 rounded-xl p-5">
              <div className="text-xs font-semibold uppercase text-slate-400 mb-1">Total Placement Questions</div>
              <div className="text-2xl font-bold text-indigo-600">
                {createdTests.reduce((sum, t) => sum + (t.questionCount || 0), 0)}
              </div>
            </div>
          </div>

          {/* Tests List Table */}
          <div className="bg-white dark:bg-slate-800 border border-line dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-line dark:border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-base">Published & Draft Placement Assessments</h2>
                <p className="text-xs text-slate-500">Official campus recruitment evaluations active for student attempts.</p>
              </div>

              <button
                onClick={() => {
                  setViewMode("wizard");
                  setCurrentStep(1);
                }}
                className="bg-indigo-600 text-white font-semibold text-xs px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
              >
                <Plus size={16} /> Create Official Test
              </button>
            </div>

            {loadingList ? (
              <div className="p-12 text-center text-slate-500 text-sm">Loading created tests…</div>
            ) : createdTests.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                <FileText size={36} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                No Official Placement Tests created yet.
                <div className="mt-3">
                  <button
                    onClick={() => setViewMode("wizard")}
                    className="text-xs text-indigo-600 font-semibold hover:underline"
                  >
                    + Create your first test now
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-mono uppercase tracking-wider border-b border-line">
                    <tr>
                      <th className="px-5 py-3.5">Test Title</th>
                      <th className="px-5 py-3.5">Difficulty</th>
                      <th className="px-5 py-3.5">Duration</th>
                      <th className="px-5 py-3.5">Sections / Qs</th>
                      <th className="px-5 py-3.5">Marks</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {createdTests.map((t) => (
                      <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span>{t.title}</span>
                            {t.testType === "placement" && (
                              <span className="text-[10px] uppercase font-mono font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded">
                                Placement
                              </span>
                            )}
                          </div>
                          {t.description && (
                            <div className="text-[11px] font-normal text-slate-400 line-clamp-1 mt-0.5">{t.description}</div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300 font-semibold">{t.difficulty || "Medium"}</td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{t.durationMinutes} min</td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                          <span className="font-semibold text-indigo-600">{t.sections ? t.sections.length : 1} Secs</span> ({t.questionCount || 0} Qs)
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300 font-semibold">{t.totalMarks || 0} pts</td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase px-2.5 py-1 rounded-full ${
                              t.isEnabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${t.isEnabled ? "bg-emerald-600" : "bg-slate-400"}`} />
                            {t.isEnabled ? "Active" : "Disabled"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleTest(t._id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                                t.isEnabled ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            >
                              <Power size={13} /> {t.isEnabled ? "Disable" : "Enable"}
                            </button>
                            <button
                              onClick={() => navigate(`/admin/official-placement-test/${t._id}`)}
                              className="px-3 py-1.5 border border-line text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors flex items-center gap-1"
                            >
                              <Edit3 size={13} /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTest(t._id)}
                              className="px-2.5 py-1.5 border border-rose-200 text-rose-600 rounded-lg text-xs hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: UNIFIED 6-STEP WIZARD */}
      {viewMode === "wizard" && (
        <div className="space-y-6">
          {/* Back button to list */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setViewMode("list")}
              className="text-xs font-semibold text-indigo-600 flex items-center gap-1 hover:underline"
            >
              <ArrowLeft size={14} /> Back to Official Tests List
            </button>
          </div>

          {/* Notifications */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
              <AlertCircle size={20} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
              <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Step Tracker Indicator */}
          <div className="bg-white dark:bg-slate-800 border border-line dark:border-slate-700 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between overflow-x-auto gap-2 pb-1">
              {STEPS.map((s, idx) => {
                const isActive = currentStep === s.id;
                const isDone = currentStep > s.id;

                return (
                  <div key={s.id} className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => isDone && setCurrentStep(s.id)}
                      disabled={!isDone && !isActive}
                      className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                          : isDone
                          ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300"
                          : "text-slate-400 dark:text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                        isActive ? "bg-white text-indigo-600" : isDone ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                      }`}>
                        {isDone ? <Check size={12} /> : s.id}
                      </span>
                      <span>{s.name}</span>
                    </button>
                    {idx < STEPS.length - 1 && (
                      <ArrowRight size={14} className="text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 1: Test Details */}
          {currentStep === 1 && (
            <div className="bg-white dark:bg-slate-800 border border-line dark:border-slate-700 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Step 1: Test Details</h2>
              <div className="space-y-4 max-w-3xl">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Test Name *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Official Campus Placement Test 2026"
                    className="w-full px-4 py-2.5 border border-line rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short summary of test scope and requirements..."
                    className="w-full px-4 py-2.5 border border-line rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Duration (Minutes) *</label>
                    <input
                      type="number"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      min={1}
                      className="w-full px-4 py-2.5 border border-line rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full px-4 py-2.5 border border-line rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                      <option value="Mixed">Mixed</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Candidate Instructions</label>
                  <textarea
                    rows={3}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full px-4 py-2.5 border border-line rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="bg-indigo-600 text-white font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  Next: Question Source <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Question Source & Prompt Mode */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 border border-line dark:border-slate-700 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">How would you like to create questions?</h2>
                <p className="text-slate-500 text-sm mb-6">Choose one or combine both sources for your placement assessment.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div
                    onClick={() => setSelectedSources((prev) => ({ ...prev, ai: !prev.ai }))}
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedSources.ai ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20" : "border-line dark:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                          <Sparkles size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-base">🤖 Generate with AI</h3>
                          <p className="text-xs text-slate-500">Create questions using a prompt & blueprint</p>
                        </div>
                      </div>
                      <input type="checkbox" checked={selectedSources.ai} onChange={() => {}} className="w-5 h-5 accent-indigo-600" />
                    </div>
                  </div>

                  <div
                    onClick={() => setSelectedSources((prev) => ({ ...prev, pdf: !prev.pdf }))}
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedSources.pdf ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20" : "border-line dark:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-violet-600 text-white flex items-center justify-center">
                          <FileUp size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-base">📄 Upload PDF</h3>
                          <p className="text-xs text-slate-500">Extract questions from PDF documents</p>
                        </div>
                      </div>
                      <input type="checkbox" checked={selectedSources.pdf} onChange={() => {}} className="w-5 h-5 accent-indigo-600" />
                    </div>
                  </div>
                </div>

                {/* AI Prompt Section */}
                {selectedSources.ai && (
                  <div className="border-t border-line dark:border-slate-700 pt-6">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-3">AI Assessment Prompt</h3>
                    <p className="text-xs text-slate-500 mb-3">Describe the test requirements in plain English:</p>

                    {/* Preset chips */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {PRESET_PROMPTS.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => setAiPrompt(p.prompt)}
                          className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-500 transition-colors text-left"
                        >
                          💡 {p.title}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={5}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="w-full px-4 py-3 border border-line rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 mb-4"
                    />

                    <button
                      onClick={handleGenerateBlueprint}
                      disabled={isGeneratingBlueprint || !aiPrompt.trim()}
                      className="bg-indigo-600 text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      {isGeneratingBlueprint ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      {isGeneratingBlueprint ? "Analyzing Prompt & Creating Blueprint…" : "Generate Test Blueprint"}
                    </button>

                    {/* Generated Blueprint display */}
                    {blueprint && (
                      <div className="mt-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-base">{blueprint.title}</h4>
                            <p className="text-xs text-slate-500">{blueprint.description} • {blueprint.durationMinutes} min • {blueprint.difficulty}</p>
                          </div>
                          <button
                            onClick={() => setIsEditingBlueprint(!isEditingBlueprint)}
                            className="text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:underline"
                          >
                            <Edit3 size={14} /> {isEditingBlueprint ? "Done Editing" : "Edit Blueprint"}
                          </button>
                        </div>

                        <div className="space-y-2 mb-4">
                          {blueprint.sections?.map((sec, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-line flex items-center justify-between text-xs">
                              <div className="font-semibold text-slate-900 dark:text-white">{sec.name}</div>
                              <div className="flex items-center gap-4 text-slate-500">
                                <span>MCQs: {sec.mcqCount}</span>
                                <span>Coding: {sec.codingCount}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PDF Upload Section */}
                {selectedSources.pdf && (
                  <div className="border-t border-line dark:border-slate-700 pt-6 mt-6">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2">Upload Question PDFs</h3>
                    <p className="text-xs text-slate-500 mb-3">Upload one or more PDF files containing question banks or past papers.</p>

                    <input
                      type="file"
                      multiple
                      accept="application/pdf"
                      onChange={(e) => {
                        const files = Array.from(e.target.files).map((f) => ({
                          file: f,
                          topic: f.name.replace(".pdf", ""),
                          type: "mcq",
                        }));
                        setPdfFiles((prev) => [...prev, ...files]);
                      }}
                      className="mb-4 text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />

                    {pdfFiles.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {pdfFiles.map((pf, idx) => (
                          <div key={idx} className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-line flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <FileText size={16} className="text-indigo-600" />
                              <span className="font-semibold text-slate-900 dark:text-white">{pf.file.name}</span>
                            </div>
                            <button
                              onClick={() => setPdfFiles((prev) => prev.filter((_, i) => i !== idx))}
                              className="text-rose-600 hover:text-rose-700"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="border border-line text-slate-700 dark:text-slate-300 font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <ArrowLeft size={16} /> Back
                </button>

                <button
                  onClick={handleStartGenerationAndExtraction}
                  disabled={(!selectedSources.ai || !blueprint) && (!selectedSources.pdf || pdfFiles.length === 0)}
                  className="bg-indigo-600 text-white font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  Generate Questions & Review <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Generation & Loading */}
          {currentStep === 3 && (
            <div className="bg-white dark:bg-slate-800 border border-line dark:border-slate-700 rounded-xl p-12 text-center shadow-sm">
              <RefreshCw size={40} className="animate-spin text-indigo-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Generating & Extracting Questions…</h2>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Our AI engine is reading your blueprint and PDF documents to generate structured questions for your review.
              </p>
            </div>
          )}

          {/* STEP 4: Review Questions */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 border border-line dark:border-slate-700 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Review Questions</h2>
                    <p className="text-xs text-slate-500">{questions.length} Questions Found in Review Pool</p>
                  </div>

                  {/* Status Summary Bar */}
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full flex items-center gap-1">
                      ✓ Approved: {approvedCount}
                    </span>
                    <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full flex items-center gap-1">
                      ⚠ Needs Review: {pendingCount}
                    </span>
                    <span className="bg-rose-100 text-rose-800 px-3 py-1 rounded-full flex items-center gap-1">
                      ✕ Rejected: {rejectedCount}
                    </span>
                  </div>
                </div>

                {/* Filter Tabs & Bulk Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line dark:border-slate-700 pb-4 mb-6">
                  <div className="flex items-center gap-1 overflow-x-auto">
                    {["all", "ai", "pdf", "pending_review", "approved", "rejected"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setReviewFilter(tab)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                          reviewFilter === tab ? "bg-indigo-600 text-white" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                        }`}
                      >
                        {tab.replace("_", " ")}
                      </button>
                    ))}
                  </div>

                  {selectedQTempIds.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">{selectedQTempIds.length} selected</span>
                      <button
                        onClick={() => handleBulkStatus("approved")}
                        className="bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-700"
                      >
                        Approve Selected
                      </button>
                      <button
                        onClick={() => handleBulkStatus("rejected")}
                        className="bg-rose-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-rose-700"
                      >
                        Reject Selected
                      </button>
                    </div>
                  )}
                </div>

                {/* Question Cards List */}
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {filteredQuestions.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm">No questions in this filter view.</div>
                  ) : (
                    filteredQuestions.map((q, idx) => (
                      <div
                        key={q.tempId}
                        className={`p-4 rounded-xl border transition-all ${
                          q.status === "approved"
                            ? "border-emerald-200 bg-emerald-50/20"
                            : q.status === "rejected"
                            ? "border-rose-200 bg-rose-50/20 opacity-60"
                            : "border-line bg-white dark:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedQTempIds.includes(q.tempId)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedQTempIds((prev) => [...prev, q.tempId]);
                                else setSelectedQTempIds((prev) => prev.filter((id) => id !== q.tempId));
                              }}
                              className="w-4 h-4 accent-indigo-600"
                            />
                            <span className="font-bold text-xs text-slate-400">#{idx + 1}</span>
                            <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                              {q.topic || "General"}
                            </span>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                              q.source === "ai" ? "bg-indigo-100 text-indigo-700" : "bg-violet-100 text-violet-700"
                            }`}>
                              {q.source === "ai" ? "🤖 AI Generated" : "📄 PDF Extracted"}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500">{q.difficulty}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateStatus(q.tempId, "approved")}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                                q.status === "approved" ? "bg-emerald-600 text-white" : "border border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                              }`}
                            >
                              <Check size={14} /> Approved
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(q.tempId, "rejected")}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                                q.status === "rejected" ? "bg-rose-600 text-white" : "border border-rose-600 text-rose-600 hover:bg-rose-50"
                              }`}
                            >
                              <X size={14} /> Reject
                            </button>
                          </div>
                        </div>

                        <p className="font-medium text-slate-900 dark:text-white text-sm mb-3">{q.questionText}</p>

                        {/* MCQ Options preview */}
                        {q.type === "mcq" && q.options && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                            {q.options.map((opt, optIdx) => (
                              <div
                                key={optIdx}
                                className={`p-2 rounded-lg text-xs border ${
                                  optIdx === q.correctOptionIndex
                                    ? "bg-emerald-50 border-emerald-400 font-semibold text-emerald-900"
                                    : "bg-slate-50 border-slate-200 text-slate-700"
                                }`}
                              >
                                <span className="font-bold mr-1.5">{String.fromCharCode(65 + optIdx)}.</span> {opt}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="border border-line text-slate-700 dark:text-slate-300 font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <ArrowLeft size={16} /> Back
                </button>

                <button
                  onClick={handleAutoBuildSections}
                  disabled={approvedCount === 0}
                  className="bg-indigo-600 text-white font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  Build Test & Preview ({approvedCount} Approved) <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Test Build & Student Preview */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 border border-line dark:border-slate-700 rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Official Placement Test Preview</h2>
                <p className="text-xs text-slate-500 mb-6">Review section layout and preview student exam experience.</p>

                <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-line mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100 px-2.5 py-1 rounded">
                      ✨ Official Placement Test
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{difficulty} Difficulty</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{title}</h3>
                  <p className="text-xs text-slate-500 mb-4">{description}</p>

                  <div className="flex items-center gap-6 text-xs text-slate-700 dark:text-slate-300 font-semibold">
                    <span className="flex items-center gap-1.5"><Clock size={16} className="text-indigo-600" /> {durationMinutes} Minutes</span>
                    <span className="flex items-center gap-1.5"><Layers size={16} className="text-indigo-600" /> {builtSections.length} Sections</span>
                    <span className="flex items-center gap-1.5"><Award size={16} className="text-indigo-600" /> {questions.filter(q => q.status === "approved").length} Approved Questions</span>
                  </div>
                </div>

                {/* Sections List */}
                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-3">Section Breakdown</h3>
                <div className="space-y-3 mb-6">
                  {builtSections.map((sec, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-line flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{sec.name}</h4>
                        <p className="text-xs text-slate-500">{sec.mcqCount} MCQs • {sec.codingCount} Coding Problems</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                          {sec.assignedQTempIds.length} Questions
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setStudentPreviewOpen(true)}
                  className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Eye size={16} /> Preview as Student
                </button>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(4)}
                  className="border border-line text-slate-700 dark:text-slate-300 font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <ArrowLeft size={16} /> Edit Questions
                </button>

                <button
                  onClick={() => setCurrentStep(6)}
                  className="bg-indigo-600 text-white font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  Proceed to Publish <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: Publish */}
          {currentStep === 6 && (
            <div className="bg-white dark:bg-slate-800 border border-line dark:border-slate-700 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Publish Official Placement Test</h2>
              <p className="text-xs text-slate-500 mb-6">Pre-flight validation check before making the test available to students.</p>

              {validationErrors.length > 0 ? (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs mb-6 space-y-1">
                  <div className="font-bold flex items-center gap-1 text-sm"><AlertCircle size={16} /> Action Required:</div>
                  {validationErrors.map((err, i) => (
                    <div key={i}>• {err}</div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs mb-6 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <span className="font-semibold">All pre-flight checks passed! The test is ready for release.</span>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(5)}
                  className="border border-line text-slate-700 dark:text-slate-300 font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <ArrowLeft size={16} /> Back to Preview
                </button>

                <button
                  onClick={handlePublishTest}
                  disabled={publishing}
                  className="bg-indigo-600 text-white font-semibold text-sm px-8 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/25"
                >
                  {publishing ? <RefreshCw size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                  {publishing ? "Publishing Test…" : "Publish Official Placement Test"}
                </button>
              </div>
            </div>
          )}

          {/* Student Preview Modal */}
          {studentPreviewOpen && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 text-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-700">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-indigo-400 font-mono font-bold">
                    🎯 Student Experience Preview Mode
                  </div>
                  <button onClick={() => setStudentPreviewOpen(false)} className="text-slate-400 hover:text-white">
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                  <div className="bg-slate-800/60 p-4 rounded-xl mb-4 border border-slate-700/50 flex justify-between items-center text-xs">
                    <span>Total Time: {durationMinutes} min</span>
                    <span>Question {studentPreviewQIndex + 1} of {questions.filter(q => q.status === "approved").length}</span>
                  </div>

                  {questions.filter(q => q.status === "approved")[studentPreviewQIndex] && (
                    <div className="space-y-4">
                      <h4 className="font-bold text-base">
                        {questions.filter(q => q.status === "approved")[studentPreviewQIndex].questionText}
                      </h4>

                      {questions.filter(q => q.status === "approved")[studentPreviewQIndex].type === "mcq" && (
                        <div className="space-y-2">
                          {questions.filter(q => q.status === "approved")[studentPreviewQIndex].options.map((opt, oIdx) => (
                            <div key={oIdx} className="p-3 rounded-lg border border-slate-700 bg-slate-800 text-xs font-medium">
                              {String.fromCharCode(65 + oIdx)}. {opt}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-slate-800 flex justify-between">
                  <button
                    disabled={studentPreviewQIndex === 0}
                    onClick={() => setStudentPreviewQIndex(p => Math.max(0, p - 1))}
                    className="px-4 py-2 bg-slate-800 text-xs font-semibold rounded-lg disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <button
                    disabled={studentPreviewQIndex >= questions.filter(q => q.status === "approved").length - 1}
                    onClick={() => setStudentPreviewQIndex(p => p + 1)}
                    className="px-4 py-2 bg-indigo-600 text-xs font-semibold rounded-lg disabled:opacity-30"
                  >
                    Next Question
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
