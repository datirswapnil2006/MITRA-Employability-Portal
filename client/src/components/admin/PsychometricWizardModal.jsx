import { useState, useEffect } from "react";
import AssessmentNavigationSettings, { DEFAULT_NAVIGATION_POLICY_SETTINGS } from "./AssessmentNavigationSettings";
import {
  getPsychometricTraits,
  getPsychometricPromptTemplates,
  generateAIPsychometric,
  regenerateSinglePsychometricQuestionApi,
  createPsychometric,
  updatePsychometric,
  getPsychometric,
  savePsychometricQuestionBankItem,
} from "../../api/admin";
import {
  X,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  FileText,
  Layers,
  HelpCircle,
  Send,
  Edit3,
  Trash2,
  RefreshCw,
  Plus,
  AlertCircle,
  Zap,
  Sliders,
  Award,
  Globe,
  Brain,
} from "lucide-react";

const CATEGORIES = [
  "Personality Traits",
  "Emotional Intelligence",
  "Behavioral Assessment",
  "Workplace Styles",
  "Leadership Potential",
  "Situational Judgment",
];

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
const LANGUAGES = ["English", "Hindi", "Spanish", "French", "German"];
const SCORING_METHODS = [
  "Normative Trait Aggregate",
  "Ipsative Forced Choice",
  "Behavioral Competency Index",
  "Likert Weighted Score",
];

const inputCls = "w-full px-3.5 py-2.5 border border-line rounded-xl bg-white text-sm text-ink outline-none focus:border-accent transition-colors placeholder:text-ink-soft/40";
const labelCls = "block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5";
const stampBtn = "bg-accent text-white rounded-xl px-5 py-2.5 font-semibold text-xs hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const ghostBtn = "border border-line rounded-xl px-4 py-2.5 font-semibold text-xs text-ink hover:border-accent transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

export default function PsychometricWizardModal({
  isOpen,
  onClose,
  initialData = null,
  onSaved,
  onSwitchToTraitLibrary,
}) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchingAssessment, setFetchingAssessment] = useState(false);
  const [existingAssessment, setExistingAssessment] = useState(null);
  const [singleRegenIdx, setSingleRegenIdx] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [targetAudience, setTargetAudience] = useState("Entry-Level Campus Recruitment");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [targetQuestionCount, setTargetQuestionCount] = useState(10);
  const [instructions, setInstructions] = useState("Answer all statements candidly. There are no right or wrong answers.");
  const [navigationPolicySettings, setNavigationPolicySettings] = useState(DEFAULT_NAVIGATION_POLICY_SETTINGS);

  const [availableLibraryTraits, setAvailableLibraryTraits] = useState([]);
  const [selectedTraitKeys, setSelectedTraitKeys] = useState([]);
  const [traitSearch, setTraitSearch] = useState("");

  const [aiDifficulty, setAiDifficulty] = useState("Intermediate");
  const [aiQuestionCount, setAiQuestionCount] = useState(10);
  const [aiLanguage, setAiLanguage] = useState("English");
  const [questionStyle, setQuestionStyle] = useState("mixed");
  const [autoBalanceTraits, setAutoBalanceTraits] = useState(true);
  const [customPrompt, setCustomPrompt] = useState("");

  const [questions, setQuestions] = useState([]);
  const [showManualAddModal, setShowManualAddModal] = useState(false);

  const [mqText, setMqText] = useState("");
  const [mqType, setMqType] = useState("likert");
  const [mqTraitKey, setMqTraitKey] = useState("");
  const [mqReverse, setMqReverse] = useState(false);
  const [mqContext, setMqContext] = useState("");

  const [scoringMethod, setScoringMethod] = useState(SCORING_METHODS[0]);

  useEffect(() => {
    if (!isOpen) return;

    loadLibraryData();

    if (initialData && initialData._id) {
      setFetchingAssessment(true);
      setError("");
      getPsychometric(initialData._id)
        .then((data) => {
          setExistingAssessment(data);
          setTitle(data.title || "");
          setCategory(data.category || CATEGORIES[0]);
          setDescription(data.description || "");
          setDurationMinutes(data.durationMinutes || 15);
          setTargetAudience(data.targetAudience || "Entry-Level Campus Recruitment");
          setDifficulty(data.difficulty || "Intermediate");
          setTargetQuestionCount(data.targetQuestionCount || 10);
          setInstructions(data.instructions || "Answer all statements candidly. There are no right or wrong answers.");
          setScoringMethod(data.scoringMethod || SCORING_METHODS[0]);
          setAiLanguage(data.language || "English");
          setAiDifficulty(data.difficulty || "Intermediate");
          setNavigationPolicySettings(data.navigationPolicySettings || DEFAULT_NAVIGATION_POLICY_SETTINGS);
          setQuestions(data.questions || []);
          setAiQuestionCount(data.questions?.length || data.targetQuestionCount || 10);

          if (data.traits && data.traits.length > 0) {
            setSelectedTraitKeys(data.traits.map((t) => t.key));
          } else {
            setSelectedTraitKeys([]);
          }

          // Open directly at STEP 4 — Review Items
          setStep(4);
        })
        .catch((err) => {
          console.error("Failed to fetch psychometric assessment", err);
          setError(err.response?.data?.message || "Failed to load existing assessment details");
        })
        .finally(() => {
          setFetchingAssessment(false);
        });
    } else {
      setExistingAssessment(null);
      resetWizard();
    }
  }, [isOpen, initialData]);

  const loadLibraryData = async () => {
    try {
      const [tData] = await Promise.all([
        getPsychometricTraits(),
        getPsychometricPromptTemplates(),
      ]);
      setAvailableLibraryTraits(tData);

      if (!initialData && tData.length > 0) {
        setSelectedTraitKeys(tData.slice(0, 5).map((t) => t.slug));
      }
    } catch (err) {
      console.warn("Could not load trait library", err);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setTitle("");
    setCategory(CATEGORIES[0]);
    setDescription("");
    setDurationMinutes(15);
    setTargetAudience("Entry-Level Campus Recruitment");
    setDifficulty("Intermediate");
    setTargetQuestionCount(10);
    setInstructions("Answer all statements candidly. There are no right or wrong answers.");
    setSelectedTraitKeys([]);
    setQuestions([]);
    setError("");
  };

  if (!isOpen) return null;

  const toggleTraitSelection = (key) => {
    setSelectedTraitKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const selectAllTraits = () => {
    setSelectedTraitKeys(availableLibraryTraits.map((t) => t.slug));
  };

  const handleGenerateQuestionsWithAI = async () => {
    const numCount = Number(aiQuestionCount);
    if (isNaN(numCount) || numCount < 1 || numCount > 50) {
      setError("Question count must be between 1 and 50.");
      return;
    }

    if (selectedTraitKeys.length === 0) {
      setError("Please select at least one target trait in Step 2");
      return;
    }
    setError("");
    setLoading(true);

    const targetTraitsObj = availableLibraryTraits
      .filter((t) => selectedTraitKeys.includes(t.slug))
      .map((t) => ({ key: t.slug, name: t.name, description: t.description }));

    try {
      const res = await generateAIPsychometric({
        category,
        targetTraits: targetTraitsObj,
        questionType: questionStyle,
        count: numCount,
        seniorityLevel: targetAudience,
        difficulty: aiDifficulty,
        language: aiLanguage,
        autoBalanceTraits,
        customPrompt,
      });

      if (res.drafts && res.drafts.length > 0) {
        setQuestions(res.drafts);
        setSuccessMsg(`Successfully generated ${res.drafts.length} AI questions!`);
        setTimeout(() => setSuccessMsg(""), 3000);
        setStep(4);
      } else {
        setError("AI did not return usable question drafts. Please try again.");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "AI question generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateSingleQuestion = async (idx) => {
    const targetQ = questions[idx];
    if (!targetQ) return;
    setSingleRegenIdx(idx);

    const targetTraitsObj = availableLibraryTraits
      .filter((t) => selectedTraitKeys.includes(t.slug))
      .map((t) => ({ key: t.slug, name: t.name }));

    try {
      const res = await regenerateSinglePsychometricQuestionApi({
        category,
        targetTraits: targetTraitsObj,
        existingQuestion: targetQ,
        difficulty: aiDifficulty,
        language: aiLanguage,
      });

      if (res.question) {
        setQuestions((prev) => prev.map((q, i) => (i === idx ? res.question : q)));
        setSuccessMsg(`Regenerated Q${idx + 1} with AI!`);
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      alert("Failed to regenerate single question: " + (err.response?.data?.message || err.message));
    } finally {
      setSingleRegenIdx(null);
    }
  };

  const handleSaveQuestionToBank = async (q) => {
    try {
      await savePsychometricQuestionBankItem({
        questionText: q.questionText,
        type: q.type,
        traitKey: q.traitKey,
        isReverseScored: q.isReverseScored,
        situationContext: q.situationContext,
        options: q.options,
        difficulty,
        language: aiLanguage,
        category,
        source: "ai_generated",
      });
      setSuccessMsg("Question saved to Question Bank!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      alert("Failed to save to Question Bank: " + (err.response?.data?.message || err.message));
    }
  };

  const handleAddManualQuestion = () => {
    if (!mqText.trim()) return;
    const newQ = {
      type: mqType,
      traitKey: mqTraitKey || selectedTraitKeys[0] || "openness",
      questionText: mqText,
      isReverseScored: mqReverse,
      situationContext: mqContext,
      options: [],
    };
    setQuestions((prev) => [...prev, newQ]);
    setMqText("");
    setMqContext("");
    setShowManualAddModal(false);
  };

  const handleFinalSaveAssessment = async (targetStatus = "published") => {
    if (!title.trim()) {
      setError("Assessment Title is required");
      setStep(1);
      return;
    }
    if (selectedTraitKeys.length === 0) {
      setError("Please select traits for assessment evaluation");
      setStep(2);
      return;
    }

    setLoading(true);
    setError("");

    const traitsPayload = selectedTraitKeys.map((key) => {
      const libTrait = availableLibraryTraits.find((t) => t.slug === key);
      const existTrait = (existingAssessment?.traits || initialData?.traits || []).find((t) => t.key === key);
      return {
        name: libTrait ? libTrait.name : existTrait ? existTrait.name : key,
        key: key,
        description: libTrait ? libTrait.description : existTrait ? existTrait.description || "" : "",
        minScore: libTrait ? libTrait.minScore : existTrait ? existTrait.minScore || 1 : 1,
        maxScore: libTrait ? libTrait.maxScore : existTrait ? existTrait.maxScore || 5 : 5,
      };
    });

    const sanitizedQuestions = questions.map((q) => {
      const copy = { ...q };
      if (copy._id && typeof copy._id === "string" && !/^[0-9a-fA-F]{24}$/.test(copy._id)) {
        delete copy._id;
      }
      return copy;
    });

    const payload = {
      title,
      description,
      instructions,
      durationMinutes: Number(durationMinutes),
      category,
      targetAudience,
      difficulty,
      scoringMethod,
      language: aiLanguage,
      targetQuestionCount: Number(targetQuestionCount),
      status: targetStatus,
      isEnabled: targetStatus === "published",
      traits: traitsPayload,
      questions: sanitizedQuestions,
      navigationPolicySettings,
    };

    try {
      if (initialData && initialData._id) {
        await updatePsychometric(initialData._id, payload);
      } else {
        await createPsychometric(payload);
      }

      onSaved && onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save assessment");
    } finally {
      setLoading(false);
    }
  };

  const filteredTraits = availableLibraryTraits.filter(
    (t) =>
      t.name.toLowerCase().includes(traitSearch.toLowerCase()) ||
      t.slug.toLowerCase().includes(traitSearch.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 bg-desk/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-line"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-line bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center shadow-xs">
              <Brain size={22} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-ink">
                {initialData?._id ? "Edit Assessment" : "AI Assessment Creation Wizard"}
              </h2>
              <p className="text-xs text-ink-soft">
                {initialData?._id
                  ? `Review & Edit Existing Assessment · ID: ${initialData._id}`
                  : "Psychometric & Behavioral Management · 5-Step AI Workflow"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-ink-soft hover:bg-slate-100 hover:text-ink transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="bg-slate-50 border-b border-line px-6 py-3 shrink-0 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[640px] gap-2">
            {[
              { id: 1, label: "Basic Info", icon: FileText },
              { id: 2, label: "Select Traits", icon: Layers },
              { id: 3, label: "AI Generator", icon: Sparkles },
              { id: 4, label: "Review Items", icon: HelpCircle },
              { id: 5, label: "Publish", icon: Send },
            ].map((s, idx) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isDone = step > s.id;

              return (
                <div key={s.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(s.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-accent text-white shadow-xs font-bold"
                        : isDone
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold"
                        : "bg-white text-ink-soft border border-line hover:border-accent"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : isDone
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {isDone ? "✓" : s.id}
                    </span>
                    <Icon size={14} />
                    <span>{s.label}</span>
                  </button>
                  {idx < 4 && <ChevronRight size={14} className="text-slate-300 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6">
          {fetchingAssessment ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
              <p className="font-bold text-sm text-ink">Loading assessment...</p>
              <p className="text-xs text-ink-soft">Fetching complete assessment details, traits, and questions.</p>
            </div>
          ) : (
            <>
          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-xs px-4 py-3 rounded-xl flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {successMsg && (
            <div className="bg-success/10 border border-success/30 text-success text-xs px-4 py-3 rounded-xl flex items-center gap-2">
              <CheckCircle2 size={16} /> {successMsg}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-line pb-3">
                <h3 className="font-display text-base font-bold text-ink">Step 1: Assessment Basic Information</h3>
                <p className="text-xs text-ink-soft mt-0.5">
                  Set target role metadata, category classification, time limits, and candidate instructions.
                </p>
              </div>

              <div className="grid grid-cols-12 gap-5">
                <div className="col-span-12">
                  <label className={labelCls}>
                    Assessment Title <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    className={inputCls}
                    placeholder="e.g. Big Five Personality & Leadership Competency Profile"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="col-span-12 md:col-span-6">
                  <label className={labelCls}>
                    Category <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-12 md:col-span-6">
                  <label className={labelCls}>
                    Target Audience / Seniority <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    className={inputCls}
                    placeholder="e.g. Entry-Level Campus Recruitment"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                  />
                </div>

                <div className="col-span-12 md:col-span-4">
                  <label className={labelCls}>Difficulty Level</label>
                  <select className={inputCls} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-12 md:col-span-4">
                  <label className={labelCls}>Duration (Minutes)</label>
                  <input
                    type="number"
                    min={1}
                    className={inputCls}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  />
                </div>

                <div className="col-span-12 md:col-span-4">
                  <label className={labelCls}>Target Question Count</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    className={inputCls}
                    value={targetQuestionCount}
                    onChange={(e) => setTargetQuestionCount(Number(e.target.value))}
                  />
                </div>

                <div className="col-span-12">
                  <label className={labelCls}>Description</label>
                  <textarea
                    className={`${inputCls} min-h-[85px] resize-y`}
                    placeholder="Briefly describe what this psychometric assessment evaluates..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="col-span-12">
                  <label className={labelCls}>Candidate Instructions</label>
                  <textarea
                    className={`${inputCls} min-h-[85px] resize-y`}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                  />
                </div>
              </div>

              <AssessmentNavigationSettings
                value={navigationPolicySettings}
                onChange={setNavigationPolicySettings}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
                <div>
                  <h3 className="font-display text-base font-bold text-ink">Step 2: Select Trait Dimensions</h3>
                  <p className="text-xs text-ink-soft mt-0.5">
                    Select traits from the central Trait Library to measure in this assessment.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={selectAllTraits}
                    className="text-xs text-accent font-bold hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={onSwitchToTraitLibrary}
                    className="border border-line hover:border-accent text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 bg-white transition-colors cursor-pointer"
                  >
                    <Sliders size={13} /> Manage Trait Library
                  </button>
                </div>
              </div>

              <input
                className={inputCls}
                placeholder="Search trait library by name or key..."
                value={traitSearch}
                onChange={(e) => setTraitSearch(e.target.value)}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTraits.map((t) => {
                  const isChecked = selectedTraitKeys.includes(t.slug);

                  return (
                    <div
                      key={t.slug}
                      onClick={() => toggleTraitSelection(t.slug)}
                      className={`border rounded-xl p-4 cursor-pointer transition-all ${
                        isChecked
                          ? "bg-accent/5 border-accent shadow-xs"
                          : "bg-white border-line hover:border-slate-300 hover:shadow-2xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="font-display text-sm font-bold text-ink truncate">{t.name}</span>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 transition-colors ${
                            isChecked ? "bg-accent text-white" : "border border-slate-300 bg-white"
                          }`}
                        >
                          {isChecked && "✓"}
                        </div>
                      </div>

                      <div className="font-mono text-[10px] text-accent bg-accent/10 px-2 py-0.5 rounded w-fit font-bold mb-2">
                        {t.slug}
                      </div>

                      <p className="text-xs text-ink-soft leading-relaxed line-clamp-2">
                        {t.description || "Psychometric behavioral dimension"}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="text-xs text-ink-soft font-semibold pt-3 border-t border-line">
                Selected <span className="text-accent font-bold">{selectedTraitKeys.length}</span> trait(s) for evaluation.
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="border-b border-line pb-3">
                <h3 className="font-display text-base font-bold text-ink flex items-center gap-2">
                  <Sparkles size={18} className="text-accent" /> Step 3: Generate Questions
                </h3>
                <p className="text-xs text-ink-soft mt-0.5">
                  Configure question format, question volume, language, and trait balancing parameters.
                </p>
              </div>

              <div className="grid grid-cols-12 gap-5">
                <div className="col-span-12 md:col-span-6">
                  <label className={labelCls}>Question Type / Format</label>
                  <select
                    className={inputCls}
                    value={questionStyle}
                    onChange={(e) => setQuestionStyle(e.target.value)}
                  >
                    <option value="likert">Likert Scale</option>
                    <option value="forced_choice">Forced Choice Pairs</option>
                    <option value="situational_judgment">Situational Judgment (SJT)</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>

                <div className="col-span-12 md:col-span-6">
                  <label className={labelCls}>Number of Questions (1 - 50)</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    className={inputCls}
                    value={aiQuestionCount}
                    onChange={(e) => setAiQuestionCount(e.target.value)}
                  />
                  {(Number(aiQuestionCount) < 1 || Number(aiQuestionCount) > 50 || isNaN(Number(aiQuestionCount))) && (
                    <p className="text-[11px] text-danger mt-1 font-semibold">
                      Question count must be between 1 and 50.
                    </p>
                  )}
                </div>

                <div className="col-span-12 md:col-span-6">
                  <label className={labelCls}>Language</label>
                  <select className={inputCls} value={aiLanguage} onChange={(e) => setAiLanguage(e.target.value)}>
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-12 md:col-span-6">
                  <label className={labelCls}>Difficulty</label>
                  <select className={inputCls} value={aiDifficulty} onChange={(e) => setAiDifficulty(e.target.value)}>
                    <option value="Easy">Easy</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div className="col-span-12">
                  <label className={labelCls}>Optional AI Instructions</label>
                  <textarea
                    className={`${inputCls} min-h-[85px] font-mono text-xs resize-y`}
                    placeholder="Provide additional requirements or guidelines for AI question generation (Optional)..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                  />
                </div>

                <div className="col-span-12 bg-slate-50 border border-line p-4 rounded-xl flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="autoBalanceToggle"
                    checked={autoBalanceTraits}
                    onChange={(e) => setAutoBalanceTraits(e.target.checked)}
                    className="w-4 h-4 accent-accent cursor-pointer"
                  />
                  <div>
                    <label htmlFor="autoBalanceToggle" className="font-bold text-xs text-ink cursor-pointer">
                      Automatically balance questions across selected traits
                    </label>
                    <p className="text-[11px] text-ink-soft leading-tight mt-0.5">
                      Distributes the requested question count as evenly as possible across selected traits.
                    </p>
                  </div>
                </div>

                <div className="col-span-12 pt-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleGenerateQuestionsWithAI}
                    className="w-full bg-accent hover:bg-accent-hover text-white rounded-xl h-11 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating {aiQuestionCount} Psychometric Items with AI...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} /> Generate Questions with AI
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-fadeIn">
              {initialData?._id && (
                <div className="bg-accent/10 border border-accent/30 text-accent text-xs px-4 py-2.5 rounded-xl font-medium flex items-center justify-between">
                  <span>Editing existing assessment questions. Changes will update the assessment without regenerating items.</span>
                  <span className="font-mono text-[10px] bg-accent/20 px-2 py-0.5 rounded font-bold uppercase">Edit Mode</span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
                <div>
                  <h3 className="font-display text-base font-bold text-ink">
                    Step 4: Review Authored Items ({questions.length})
                  </h3>
                  <p className="text-xs text-ink-soft mt-0.5">
                    Inspect generated cards, edit statements, regenerate individual items, or add manually.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowManualAddModal(true)}
                    className="border border-line hover:border-accent text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 bg-white transition-colors cursor-pointer"
                  >
                    <Plus size={14} /> Add New Question
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateQuestionsWithAI}
                    disabled={loading}
                    className="bg-accent/10 text-accent font-bold hover:bg-accent hover:text-white text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Regenerate All
                  </button>
                </div>
              </div>

              {questions.length === 0 ? (
                <div className="bg-white border border-line rounded-2xl p-10 text-center text-xs text-ink-soft">
                  No questions yet. Click "Regenerate All" or go back to Step 3 to generate items with AI.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {questions.map((q, idx) => {
                    const isRegening = singleRegenIdx === idx;

                    return (
                      <div
                        key={idx}
                        className="bg-white border border-line rounded-xl p-4.5 hover:shadow-xs transition-all space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-xs text-ink">Q{idx + 1}.</span>
                            <span className="font-mono text-[10px] uppercase font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">
                              {q.type}
                            </span>
                            <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Trait: {q.traitKey}
                            </span>
                            {q.isReverseScored && (
                              <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                Reverse Scored
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleRegenerateSingleQuestion(idx)}
                              disabled={isRegening}
                              className="p-1.5 border border-line rounded-lg hover:border-accent text-ink-soft hover:text-accent transition-colors text-[11px] flex items-center gap-1 cursor-pointer"
                              title="Regenerate single question with AI"
                            >
                              <RefreshCw size={13} className={isRegening ? "animate-spin" : ""} />
                              {isRegening ? "AI..." : "Regen"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveQuestionToBank(q)}
                              className="p-1.5 border border-line rounded-lg hover:border-accent text-ink-soft hover:text-accent transition-colors text-[11px] cursor-pointer"
                              title="Save to Question Bank"
                            >
                              Bank
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to remove Question ${idx + 1}?`)) {
                                  setQuestions((prev) => prev.filter((_, i) => i !== idx));
                                }
                              }}
                              className="p-1.5 border border-danger/30 text-danger hover:bg-danger/10 rounded-lg transition-colors cursor-pointer"
                              title="Delete Question"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {q.situationContext && (
                          <p className="text-xs text-slate-600 italic bg-slate-50 border-l-2 border-accent pl-3 py-2 rounded-r">
                            Scenario: "{q.situationContext}"
                          </p>
                        )}

                        <textarea
                          className="w-full text-xs font-medium text-ink bg-slate-50/50 border border-line rounded-xl p-2.5 outline-none focus:bg-white focus:border-accent transition-colors"
                          value={q.questionText}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQuestions((prev) => prev.map((x, i) => (i === idx ? { ...x, questionText: val } : x)));
                          }}
                        />

                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} className="bg-slate-50 border border-line rounded-lg p-2 text-[11px] flex justify-between">
                                <span>{typeof opt === "string" ? opt : opt.optionText}</span>
                                <span className="font-mono text-accent font-bold">+{typeof opt === "string" ? oIdx + 1 : opt.score}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="border-b border-line pb-3">
                <h3 className="font-display text-base font-bold text-ink">Step 5: Assessment Summary & Publish</h3>
                <p className="text-xs text-ink-soft mt-0.5">
                  Review final assessment details before saving draft or making live for candidate attempts.
                </p>
              </div>

              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-accent bg-accent/20 px-2 py-0.5 rounded uppercase">
                      {category}
                    </span>
                    <h3 className="font-display text-xl font-bold mt-1 text-white">{title || "Untitled Assessment"}</h3>
                  </div>

                  <span className="font-mono text-xs text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
                    {difficulty} Level
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <div className="text-slate-400 text-[11px] font-semibold uppercase">Question Count</div>
                    <div className="font-display text-lg font-bold text-accent">{questions.length} Items</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[11px] font-semibold uppercase">Duration</div>
                    <div className="font-display text-lg font-bold text-white">{durationMinutes} Mins</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[11px] font-semibold uppercase">Target Audience</div>
                    <div className="font-semibold text-slate-200 truncate">{targetAudience}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[11px] font-semibold uppercase">Language</div>
                    <div className="font-semibold text-slate-200">{aiLanguage}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                    Scoring Engine Method
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-slate-700 rounded-xl bg-slate-800 text-xs text-white outline-none focus:border-accent"
                    value={scoringMethod}
                    onChange={(e) => setScoringMethod(e.target.value)}
                  >
                    {SCORING_METHODS.map((sm) => (
                      <option key={sm} value={sm}>{sm}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="text-xs text-slate-400 font-semibold mb-2">Evaluated Personality & Behavioral Traits:</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTraitKeys.map((k) => {
                      const tr = availableLibraryTraits.find((t) => t.slug === k);
                      return (
                        <span key={k} className="bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2.5 py-1 rounded-lg font-medium">
                          ✓ {tr ? tr.name : k}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
          </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-line bg-white/95 backdrop-blur-md flex items-center justify-between shrink-0 sticky bottom-0 z-20">
          <button
            type="button"
            disabled={step === 1 || loading}
            onClick={() => setStep((s) => s - 1)}
            className={ghostBtn + " flex items-center gap-1.5"}
          >
            <ChevronLeft size={16} /> Back
          </button>

          <div className="flex items-center gap-2">
            {step < 5 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className={stampBtn}
              >
                Next Step <ChevronRight size={16} />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleFinalSaveAssessment("draft")}
                  className={ghostBtn}
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleFinalSaveAssessment("published")}
                  className={stampBtn}
                >
                  {loading ? "Publishing..." : "Publish Assessment"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showManualAddModal && (
        <div className="fixed inset-0 bg-desk/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-line">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-display text-base font-bold text-ink">Add Manual Question</h3>
              <button onClick={() => setShowManualAddModal(false)} className="text-ink-soft hover:text-ink cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className={labelCls}>Format</label>
                <select className={inputCls} value={mqType} onChange={(e) => setMqType(e.target.value)}>
                  <option value="likert">Likert Scale</option>
                  <option value="forced_choice">Forced Choice</option>
                  <option value="situational_judgment">Situational Judgment</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Target Trait</label>
                <select className={inputCls} value={mqTraitKey} onChange={(e) => setMqTraitKey(e.target.value)}>
                  {selectedTraitKeys.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Question Text *</label>
                <textarea
                  className={`${inputCls} min-h-[70px] resize-y`}
                  value={mqText}
                  onChange={(e) => setMqText(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowManualAddModal(false)} className={ghostBtn}>
                  Cancel
                </button>
                <button type="button" onClick={handleAddManualQuestion} className={stampBtn}>
                  Add Question
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
