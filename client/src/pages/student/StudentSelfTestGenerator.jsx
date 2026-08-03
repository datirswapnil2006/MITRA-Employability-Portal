import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { getSelfTestTopics, generateSelfTest } from "../../api/selfTest";
import { STUDENT_LINKS } from "./studentLinks";
import {
  Sparkles, Zap, Flame, Clock, Award, Sliders, CheckCircle2,
  AlertCircle, Dumbbell, ShieldAlert, RotateCcw, Play, Layers, Code, Target,
  Check, ArrowRight, Compass, Filter
} from "lucide-react";

export default function StudentSelfTestGenerator() {
  const navigate = useNavigate();

  const [topics, setTopics] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [difficulty, setDifficulty] = useState("Mixed");
  const [questionCount, setQuestionCount] = useState(10);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [mode, setMode] = useState("practice");
  const [questionType, setQuestionType] = useState("Mixed");
  const [language, setLanguage] = useState("python");
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [negativeMarkRatio, setNegativeMarkRatio] = useState(0.25);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [prioritizeWrong, setPrioritizeWrong] = useState(false);

  const [loadingTopics, setLoadingTopics] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getSelfTestTopics()
      .then((data) => {
        setTopics(data.topics || []);
        if (data.topics) {
          setSelectedTopics(data.topics.map((t) => t.name));
        }
      })
      .catch(() => setError("Failed to load topics"))
      .finally(() => setLoadingTopics(false));
  }, []);

  const toggleTopic = (name) => {
    setSelectedTopics((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  };

  const applyPreset = (preset) => {
    if (preset === "quick") {
      setQuestionCount(5);
      setDurationMinutes(5);
      setMode("practice");
      setDifficulty("Easy");
      setQuestionType("MCQ");
    } else if (preset === "weak") {
      setQuestionCount(10);
      setDurationMinutes(15);
      setMode("practice");
      setDifficulty("Mixed");
      setPrioritizeWrong(true);
      const weak = topics.filter((t) => t.accuracy < 65).map((t) => t.name);
      if (weak.length > 0) setSelectedTopics(weak);
    } else if (preset === "exam") {
      setQuestionCount(20);
      setDurationMinutes(30);
      setMode("exam");
      setDifficulty("Hard");
      setQuestionType("Mixed");
      setNegativeMarking(true);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (selectedTopics.length === 0) {
      setError("Please select at least one topic for your practice test.");
      return;
    }
    setError("");
    setGenerating(true);

    try {
      const res = await generateSelfTest({
        topics: selectedTopics,
        difficulty,
        questionCount: Number(questionCount),
        durationMinutes: Number(durationMinutes),
        mode,
        questionType,
        language,
        negativeMarking,
        negativeMarkRatio: Number(negativeMarkRatio),
        shuffleOptions,
        prioritizeWrong,
      });

      navigate(`/student/self-test/attempt/${res.attemptId}`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not generate test. Adjust your topic or filter choices.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <DashboardLayout
      active="self-test"
      links={STUDENT_LINKS}
      onNavigate={(k) => navigate(k === "tests" ? "/student" : `/student/${k}`)}
    >
      {/* Modern Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 mb-8 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-medium mb-3">
              <Sparkles size={13} className="text-indigo-400 animate-pulse" />
              AI-Powered Self Test Studio
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
              Generate Your Custom Practice Test
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Dynamically assemble targeted practice sessions from your institutional Question Bank. Hone your weak spots, track accuracy, and boost your readiness score.
            </p>
          </div>

          <button
            onClick={() => navigate("/student/self-test/hub")}
            className="self-start md:self-auto inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md px-4 py-2.5 rounded-2xl text-xs font-semibold text-white transition-all shadow-sm shrink-0"
          >
            <Award size={16} className="text-amber-400" />
            Practice Hub & Analytics
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm px-4 py-3 rounded-2xl mb-6 flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle size={18} className="shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Smart Presets */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Zap size={14} className="text-amber-500" />
            Smart One-Click Presets
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => applyPreset("quick")}
            className="group relative bg-white border border-slate-200/80 hover:border-indigo-500/60 rounded-2xl p-5 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-display font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                ⚡ 5-Min Warmup
              </span>
              <span className="text-[11px] font-mono font-semibold bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                5 Questions
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Rapid MCQ refresher to test fundamentals before an interview or class.
            </p>
          </div>

          <div
            onClick={() => applyPreset("weak")}
            className="group relative bg-white border border-slate-200/80 hover:border-indigo-500/60 rounded-2xl p-5 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-display font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                🎯 Weak Topics Booster
              </span>
              <span className="text-[11px] font-mono font-semibold bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full border border-rose-200/60">
                AI Target
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Focuses specifically on topics where your historical accuracy is below 65%.
            </p>
          </div>

          <div
            onClick={() => applyPreset("exam")}
            className="group relative bg-white border border-slate-200/80 hover:border-indigo-500/60 rounded-2xl p-5 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-display font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                🏆 Placement Simulator
              </span>
              <span className="text-[11px] font-mono font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200/60">
                Hard · 30m
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Timed simulation with negative marking and mixed coding/MCQ challenges.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleGenerate}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Controls: Topics & Format */}
          <div className="lg:col-span-2 space-y-6">
            {/* Topic Selector Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                    <Compass size={18} className="text-indigo-600" />
                    Select Topics ({selectedTopics.length} / {topics.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click to toggle topics for your practice session.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedTopics(
                      selectedTopics.length === topics.length ? [] : topics.map((t) => t.name)
                    )
                  }
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  {selectedTopics.length === topics.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              {loadingTopics ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {topics.map((t) => {
                    const isSelected = selectedTopics.includes(t.name);
                    const isWeak = t.accuracy < 60 && t.attempted > 0;
                    const isMastered = t.accuracy >= 80 && t.attempted > 0;

                    return (
                      <div
                        key={t.name}
                        onClick={() => toggleTopic(t.name)}
                        className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-3.5 ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/40 shadow-sm ring-1 ring-indigo-600/20"
                            : "border-slate-200/80 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div
                          className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                            isSelected
                              ? "bg-indigo-600 border-indigo-600 text-white"
                              : "border-slate-300 bg-white group-hover:border-slate-400"
                          }`}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {t.name}
                            </span>
                            {isWeak && (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200 shrink-0">
                                Weak Topic
                              </span>
                            )}
                            {isMastered && (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                                Mastered
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                            <span>{t.attempted} Attempted</span>
                            <span>•</span>
                            <span className={t.accuracy >= 75 ? "text-emerald-600 font-semibold" : t.accuracy < 60 && t.attempted > 0 ? "text-rose-600 font-semibold" : ""}>
                              {t.accuracy}% Accuracy
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Test Format & Rules */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
              <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                <Filter size={18} className="text-indigo-600" />
                Test Format & Engine Rules
              </h2>

              {/* Mode & Question Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Test Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => setMode("practice")}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                        mode === "practice"
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      💡 Practice Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("exam")}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                        mode === "exam"
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      ⏱️ Exam Mode
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Question Type
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 transition-colors"
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value)}
                  >
                    <option value="Mixed">Mixed (MCQ + Coding)</option>
                    <option value="MCQ">MCQ Only</option>
                    <option value="Coding">Coding Only</option>
                  </select>
                </div>
              </div>

              {/* Difficulty & Count & Timer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Difficulty
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 transition-colors"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option value="Mixed">Mixed Difficulty</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Question Count
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 transition-colors"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                  >
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                    <option value={20}>20 Questions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Duration
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 transition-colors"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  >
                    <option value={5}>5 Minutes</option>
                    <option value={10}>10 Minutes</option>
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                  </select>
                </div>
              </div>

              {/* Language Selector */}
              {(questionType === "Coding" || questionType === "Mixed") && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Preferred Coding Language
                  </label>
                  <div className="flex gap-3">
                    {["python", "java", "cpp"].map((lang) => (
                      <button
                        type="button"
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all capitalize border ${
                          language === lang
                            ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm"
                            : "bg-white border-slate-200/80 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {lang === "cpp" ? "C++" : lang}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Advanced Toggles & Generate CTA */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders size={16} className="text-indigo-600" />
                Advanced Testing Parameters
              </h3>

              {/* Negative Marking Toggle */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div>
                  <div className="text-xs font-bold text-slate-900">Negative Marking</div>
                  <div className="text-[11px] text-slate-500">-25% deduction for wrong answers</div>
                </div>
                <button
                  type="button"
                  onClick={() => setNegativeMarking(!negativeMarking)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    negativeMarking ? "bg-indigo-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      negativeMarking ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Focus on Mistakes */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div>
                  <div className="text-xs font-bold text-slate-900">Focus on Weak Questions</div>
                  <div className="text-[11px] text-slate-500">Include previously missed questions</div>
                </div>
                <button
                  type="button"
                  onClick={() => setPrioritizeWrong(!prioritizeWrong)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    prioritizeWrong ? "bg-indigo-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      prioritizeWrong ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Shuffle Options */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-xs font-bold text-slate-900">Shuffle MCQ Choices</div>
                  <div className="text-[11px] text-slate-500">Randomize option position</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShuffleOptions(!shuffleOptions)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    shuffleOptions ? "bg-indigo-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      shuffleOptions ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Launch CTA Box */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800">
              <div className="flex items-center gap-2 font-mono text-[11px] tracking-widest text-indigo-400 uppercase font-bold mb-2">
                <Sparkles size={14} /> Ready to Practice
              </div>
              <h3 className="font-display text-xl font-bold mb-2">Generate Dynamic Test</h3>
              <p className="text-slate-300 text-xs leading-relaxed mb-6">
                Your test will be dynamically sampled from the Question Bank. Complete tests to gain XP and raise your placement readiness score!
              </p>

              <button
                type="submit"
                disabled={generating}
                className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold text-xs py-3.5 rounded-2xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {generating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating Test…
                  </span>
                ) : (
                  <>
                    <Play size={16} fill="currentColor" /> Start Practice Session
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
