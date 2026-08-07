import { useState, useEffect } from "react";
import AssessmentNavigationSettings, { DEFAULT_NAVIGATION_POLICY_SETTINGS } from "./AssessmentNavigationSettings";
import {
  getPsychometricTraits,
  getPsychometricPromptTemplates,
  generateAIPsychometric,
  regenerateSinglePsychometricQuestionApi,
  createPsychometric,
  updatePsychometric,
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

const inputCls = "w-full px-3 py-2.5 border border-line rounded-xl bg-white text-xs text-ink outline-none focus:border-accent transition-colors";
const labelCls = "block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5";
const stampBtn = "bg-accent text-white rounded-xl px-5 py-2.5 font-bold text-xs hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 shadow-sm";
const ghostBtn = "border border-line rounded-xl px-4 py-2 font-semibold text-xs text-ink hover:border-accent transition-colors";

export default function PsychometricWizardModal({
  isOpen,
  onClose,
  initialData = null,
  onSaved,
  onSwitchToTraitLibrary,
}) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [singleRegenIdx, setSingleRegenIdx] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Step 1: Basic Info
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [targetAudience, setTargetAudience] = useState("Entry-Level Campus Recruitment");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [targetQuestionCount, setTargetQuestionCount] = useState(10);
  const [instructions, setInstructions] = useState("Answer all statements candidly. There are no right or wrong answers.");
  const [navigationPolicySettings, setNavigationPolicySettings] = useState(DEFAULT_NAVIGATION_POLICY_SETTINGS);

  // Step 2: Select Traits
  const [availableLibraryTraits, setAvailableLibraryTraits] = useState([]);
  const [selectedTraitKeys, setSelectedTraitKeys] = useState([]);
  const [traitSearch, setTraitSearch] = useState("");

  // Step 3: AI Question Generation Config
  const [aiModel, setAiModel] = useState("auto");
  const [aiDifficulty, setAiDifficulty] = useState("Intermediate");
  const [aiQuestionCount, setAiQuestionCount] = useState(10);
  const [aiLanguage, setAiLanguage] = useState("English");
  const [questionStyle, setQuestionStyle] = useState("mixed");
  const [includeReverseScored, setIncludeReverseScored] = useState(true);
  const [customPrompt, setCustomPrompt] = useState("");
  const [promptTemplates, setPromptTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  // Step 4: Questions Review & Authoring
  const [questions, setQuestions] = useState([]);
  const [editingQuestionIdx, setEditingQuestionIdx] = useState(null);
  const [editingQuestionObj, setEditingQuestionObj] = useState(null);
  const [showManualAddModal, setShowManualAddModal] = useState(false);

  // Manual Question Builder
  const [mqText, setMqText] = useState("");
  const [mqType, setMqType] = useState("likert");
  const [mqTraitKey, setMqTraitKey] = useState("");
  const [mqReverse, setMqReverse] = useState(false);
  const [mqContext, setMqContext] = useState("");

  // Step 5: Publish Summary
  const [scoringMethod, setScoringMethod] = useState(SCORING_METHODS[0]);

  useEffect(() => {
    if (!isOpen) return;

    // Load trait library & prompt templates
    loadLibraryData();

    if (initialData) {
      setTitle(initialData.title || "");
      setCategory(initialData.category || CATEGORIES[0]);
      setDescription(initialData.description || "");
      setDurationMinutes(initialData.durationMinutes || 15);
      setTargetAudience(initialData.targetAudience || "Entry-Level Campus Recruitment");
      setDifficulty(initialData.difficulty || "Intermediate");
      setTargetQuestionCount(initialData.targetQuestionCount || 10);
      setInstructions(initialData.instructions || "Answer all statements candidly.");
      setScoringMethod(initialData.scoringMethod || SCORING_METHODS[0]);
      setQuestions(initialData.questions || []);

      if (initialData.traits && initialData.traits.length > 0) {
        setSelectedTraitKeys(initialData.traits.map((t) => t.key));
      }
    } else {
      resetWizard();
    }
  }, [isOpen, initialData]);

  const loadLibraryData = async () => {
    try {
      const [tData, pData] = await Promise.all([
        getPsychometricTraits(),
        getPsychometricPromptTemplates(),
      ]);
      setAvailableLibraryTraits(tData);
      setPromptTemplates(pData);

      if (!initialData && tData.length > 0) {
        setSelectedTraitKeys(tData.slice(0, 5).map((t) => t.slug));
      }
    } catch (err) {
      console.warn("Could not load trait library or prompt templates", err);
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

  const handleSelectTemplate = (tmplId) => {
    setSelectedTemplateId(tmplId);
    const tmpl = promptTemplates.find((p) => p._id === tmplId);
    if (tmpl) {
      setCustomPrompt(tmpl.systemPrompt + (tmpl.customInstructions ? `\nInstructions: ${tmpl.customInstructions}` : ""));
      if (tmpl.modelPreference) setAiModel(tmpl.modelPreference);
    }
  };

  const handleGenerateQuestionsWithAI = async () => {
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
        count: Number(aiQuestionCount),
        seniorityLevel: targetAudience,
        difficulty: aiDifficulty,
        language: aiLanguage,
        includeReverseScored,
        customPrompt,
        modelPreference: aiModel,
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
        modelPreference: aiModel,
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

    const traitsPayload = availableLibraryTraits
      .filter((t) => selectedTraitKeys.includes(t.slug))
      .map((t) => ({
        name: t.name,
        key: t.slug,
        description: t.description || "",
        minScore: t.minScore || 1,
        maxScore: t.maxScore || 5,
      }));

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
      className="fixed inset-0 bg-desk/60 flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Wizard Header */}
        <div className="px-6 py-4 border-b border-line bg-gradient-to-r from-accent/10 via-white to-accent/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center shadow-md">
              <Brain size={22} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-ink">AI Assessment Creation Wizard</h2>
              <p className="text-xs text-ink-soft">
                Psychometric & Behavioral Management · 5-Step AI Workflow
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-xl text-ink-soft hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* PROGRESS STEPPER HEADER */}
        <div className="bg-slate-50 border-b border-line px-6 py-3 shrink-0 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[600px]">
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
                    onClick={() => setStep(s.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-accent text-white shadow-sm"
                        : isDone
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-white text-ink-soft border border-line hover:border-accent"
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                      {isDone ? "✓" : s.id}
                    </span>
                    <Icon size={14} />
                    <span>{s.label}</span>
                  </button>
                  {idx < 4 && <ChevronRight size={14} className="text-slate-300" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP CONTENT BODY */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-xs px-4 py-2.5 rounded-xl mb-4 flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {successMsg && (
            <div className="bg-success/10 border border-success/30 text-success text-xs px-4 py-2.5 rounded-xl mb-4 flex items-center gap-2">
              <CheckCircle2 size={16} /> {successMsg}
            </div>
          )}

          {/* ========================================== */}
          {/* STEP 1: BASIC INFORMATION                  */}
          {/* ========================================== */}
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b border-line pb-3 mb-4">
                <h3 className="font-display text-base font-bold text-ink">Step 1: Assessment Basic Information</h3>
                <p className="text-xs text-ink-soft">
                  Set target role metadata, category classification, time limits, and instructions.
                </p>
              </div>

              <div>
                <label className={labelCls}>Assessment Title *</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Big Five Personality & Leadership Competency Profile"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Category *</label>
                  <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Target Audience / Seniority *</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. Entry-Level Campus Recruitment"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Difficulty Level</label>
                  <select className={inputCls} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Duration (Minutes)</label>
                  <input
                    type="number"
                    min={1}
                    className={inputCls}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  />
                </div>

                <div>
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
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  className={`${inputCls} min-h-[70px]`}
                  placeholder="Briefly describe what this psychometric assessment evaluates..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className={labelCls}>Candidate Instructions</label>
                <textarea
                  className={`${inputCls} min-h-[70px]`}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </div>

              {/* Assessment Navigation & Behavior Policy Settings */}
              <AssessmentNavigationSettings
                value={navigationPolicySettings}
                onChange={setNavigationPolicySettings}
              />
            </div>
          )}

          {/* ========================================== */}
          {/* STEP 2: SELECT TRAITS                      */}
          {/* ========================================== */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
                <div>
                  <h3 className="font-display text-base font-bold text-ink">Step 2: Select Trait Dimensions</h3>
                  <p className="text-xs text-ink-soft">
                    Select traits from the central Trait Library to measure in this assessment.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllTraits}
                    className="text-xs text-accent font-bold hover:underline"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={onSwitchToTraitLibrary}
                    className="border border-line hover:border-accent text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1 bg-white"
                  >
                    <Sliders size={13} /> Manage Trait Library
                  </button>
                </div>
              </div>

              {/* Traits Filter Input */}
              <input
                className={inputCls}
                placeholder="Search trait library by name or key..."
                value={traitSearch}
                onChange={(e) => setTraitSearch(e.target.value)}
              />

              {/* Trait Card Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                {filteredTraits.map((t) => {
                  const isChecked = selectedTraitKeys.includes(t.slug);

                  return (
                    <div
                      key={t.slug}
                      onClick={() => toggleTraitSelection(t.slug)}
                      className={`border rounded-2xl p-4 cursor-pointer transition-all ${
                        isChecked
                          ? "bg-accent/5 border-accent shadow-sm"
                          : "bg-white border-line hover:border-slate-300"
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

                      <p className="text-[11px] text-ink-soft line-clamp-2">{t.description || "Psychometric dimension"}</p>
                    </div>
                  );
                })}
              </div>

              <div className="text-xs text-ink-soft font-semibold pt-2 border-t border-line">
                Selected <span className="text-accent font-bold">{selectedTraitKeys.length}</span> trait(s) for evaluation.
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* STEP 3: AI QUESTION GENERATION CONFIG      */}
          {/* ========================================== */}
          {step === 3 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="border-b border-line pb-3">
                <h3 className="font-display text-base font-bold text-ink flex items-center gap-2">
                  <Sparkles size={18} className="text-accent" /> Step 3: AI Question Generation Configuration
                </h3>
                <p className="text-xs text-ink-soft">
                  Configure AI prompt parameters, model execution, question styles, and reverse-score balancing.
                </p>
              </div>

              {/* Prompt Template Preset Selector */}
              {promptTemplates.length > 0 && (
                <div className="bg-slate-50 border border-line rounded-2xl p-3.5">
                  <label className={labelCls}>Load AI Prompt Template (Optional)</label>
                  <select
                    className={inputCls}
                    value={selectedTemplateId}
                    onChange={(e) => handleSelectTemplate(e.target.value)}
                  >
                    <option value="">Choose pre-saved template...</option>
                    {promptTemplates.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.title} ({p.category})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>AI Engine Provider</label>
                  <select className={inputCls} value={aiModel} onChange={(e) => setAiModel(e.target.value)}>
                    <option value="auto">Auto Multi-Provider Fallback</option>
                    <option value="gemini">Google Gemini 1.5</option>
                    <option value="groq">Groq Llama-3 70B</option>
                    <option value="huggingface">Hugging Face API</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Question Style / Format</label>
                  <select className={inputCls} value={questionStyle} onChange={(e) => setQuestionStyle(e.target.value)}>
                    <option value="mixed">Mixed Formats</option>
                    <option value="likert">Likert 5-Point Scale</option>
                    <option value="forced_choice">Forced Choice Pairs</option>
                    <option value="situational_judgment">Situational Judgment</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Question Count (1-20)</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    className={inputCls}
                    value={aiQuestionCount}
                    onChange={(e) => setAiQuestionCount(Math.min(20, Math.max(1, Number(e.target.value))))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Question Language</label>
                  <select className={inputCls} value={aiLanguage} onChange={(e) => setAiLanguage(e.target.value)}>
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Assessment Difficulty</label>
                  <select className={inputCls} value={aiDifficulty} onChange={(e) => setAiDifficulty(e.target.value)}>
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 border border-line p-3.5 rounded-xl">
                <input
                  type="checkbox"
                  id="revToggle"
                  checked={includeReverseScored}
                  onChange={(e) => setIncludeReverseScored(e.target.checked)}
                  className="w-4 h-4 accent-accent"
                />
                <div>
                  <label htmlFor="revToggle" className="font-bold text-xs text-ink cursor-pointer">
                    Balance Positive & Reverse-Scored Questions
                  </label>
                  <p className="text-[11px] text-ink-soft">
                    Detect acquiscence bias by automatically generating inverted behavioral statements.
                  </p>
                </div>
              </div>

              <div>
                <label className={labelCls}>Custom AI Prompt Guidelines (Optional)</label>
                <textarea
                  className={`${inputCls} min-h-[80px] font-mono`}
                  placeholder="e.g. Focus on high-stress software engineering incidents and team collaboration..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                />
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleGenerateQuestionsWithAI}
                className="w-full bg-gradient-to-r from-accent via-indigo-600 to-accent text-white rounded-xl py-3.5 font-bold text-sm hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating {aiQuestionCount} Psychometric Items with AI...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> ✨ Generate Questions with AI
                  </>
                )}
              </button>
            </div>
          )}

          {/* ========================================== */}
          {/* STEP 4: REVIEW QUESTIONS                  */}
          {/* ========================================== */}
          {step === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
                <div>
                  <h3 className="font-display text-base font-bold text-ink">
                    Step 4: Review Authored Items ({questions.length})
                  </h3>
                  <p className="text-xs text-ink-soft">
                    Inspect generated cards, edit statements, regenerate individual items, or add manually.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowManualAddModal(true)}
                    className="border border-line hover:border-accent text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1 bg-white"
                  >
                    <Plus size={14} /> Add New Question
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateQuestionsWithAI}
                    disabled={loading}
                    className="bg-accent/10 text-accent font-bold hover:bg-accent hover:text-white text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Regenerate All
                  </button>
                </div>
              </div>

              {/* Questions Cards List */}
              {questions.length === 0 ? (
                <div className="bg-white border border-line rounded-2xl p-10 text-center text-xs text-ink-soft">
                  No questions yet. Click "Regenerate All" or go back to Step 3 to generate items with AI.
                </div>
              ) : (
                <div className="space-y-3 max-h-[52vh] overflow-y-auto pr-1">
                  {questions.map((q, idx) => {
                    const isRegening = singleRegenIdx === idx;

                    return (
                      <div
                        key={idx}
                        className="bg-white border border-line rounded-2xl p-4.5 hover:shadow-md transition-all space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-xs text-ink">Q{idx + 1}.</span>
                            <span className="font-mono text-[10px] uppercase font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">
                              {q.type}
                            </span>
                            <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              Trait: {q.traitKey}
                            </span>
                            {q.isReverseScored && (
                              <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                                Reverse Scored
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleRegenerateSingleQuestion(idx)}
                              disabled={isRegening}
                              className="p-1.5 border border-line rounded-lg hover:border-accent text-ink-soft hover:text-accent transition-colors text-[11px] flex items-center gap-1"
                              title="Regenerate single question with AI"
                            >
                              <RefreshCw size={13} className={isRegening ? "animate-spin" : ""} />
                              {isRegening ? "AI..." : "Regen"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveQuestionToBank(q)}
                              className="p-1.5 border border-line rounded-lg hover:border-accent text-ink-soft hover:text-accent transition-colors text-[11px]"
                              title="Save to Question Bank"
                            >
                              Bank
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== idx))}
                              className="p-1.5 border border-danger/30 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {q.situationContext && (
                          <p className="text-xs text-slate-600 italic bg-slate-50 border-l-2 border-accent pl-3 py-1.5 rounded-r">
                            Scenario: "{q.situationContext}"
                          </p>
                        )}

                        {/* Inline Editable Question Text */}
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
                                <span>{opt.optionText}</span>
                                <span className="font-mono text-accent font-bold">+{opt.score}</span>
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

          {/* ========================================== */}
          {/* STEP 5: PUBLISH & SUMMARY                 */}
          {/* ========================================== */}
          {step === 5 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="border-b border-line pb-3">
                <h3 className="font-display text-base font-bold text-ink">Step 5: Assessment Summary & Publish</h3>
                <p className="text-xs text-ink-soft">
                  Review final assessment details before saving draft or making live for candidate attempts.
                </p>
              </div>

              {/* Assessment Summary Card */}
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

                {/* Scoring Method */}
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

                {/* Selected Traits Badges */}
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
        </div>

        {/* STEPPER FOOTER BUTTONS */}
        <div className="px-6 py-4 border-t border-line bg-white flex items-center justify-between shrink-0">
          <button
            type="button"
            disabled={step === 1 || loading}
            onClick={() => setStep((s) => s - 1)}
            className={ghostBtn + " flex items-center gap-1 disabled:opacity-40"}
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

      {/* Manual Add Question Drawer */}
      {showManualAddModal && (
        <div className="fixed inset-0 bg-desk/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-display text-base font-bold text-ink">Add Manual Question</h3>
              <button onClick={() => setShowManualAddModal(false)} className="text-ink-soft hover:text-ink">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
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
                  className={`${inputCls} min-h-[60px]`}
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
