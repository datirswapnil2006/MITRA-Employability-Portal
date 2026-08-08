import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { getStudentSelfTestDashboard, getBookmarks, generateSelfTest } from "../../api/selfTest";
import { STUDENT_LINKS } from "./studentLinks";
import {
  Trophy, Flame, Zap, Award, Target, Bookmark, Sparkles, Clock,
  ArrowRight, BarChart2, CheckCircle2, RefreshCw, BookOpen, Layers, Check,
  TrendingUp, TrendingDown, Minus, Play, ShieldAlert, Compass, Activity,
  Sliders, MessageSquare, AlertCircle, Dumbbell
} from "lucide-react";

const TOPIC_CATEGORIES = [
  "Data Structures & Algorithms",
  "Quantitative Aptitude",
  "Logical Reasoning",
  "Verbal Ability",
  "Core Computer Science",
  "Cloud Computing",
  "Mixed",
];

export default function StudentSelfTestDashboard({ embedded = false }) {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Generator form state
  const [selectedTopic, setSelectedTopic] = useState("Data Structures & Algorithms");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionCount, setQuestionCount] = useState(10);
  const [questionType, setQuestionType] = useState("Mixed");
  const [customPrompt, setCustomPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatorError, setGeneratorError] = useState("");

  const [launchingTopic, setLaunchingTopic] = useState("");

  useEffect(() => {
    Promise.all([getStudentSelfTestDashboard(), getBookmarks()])
      .then(([dash, bms]) => {
        setDashboardData(dash);
        setBookmarks(bms.bookmarks || (Array.isArray(bms) ? bms : []));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleGenerateTest = async (overrideParams = {}) => {
    setGenerating(true);
    setGeneratorError("");

    const topicVal = overrideParams.topic || selectedTopic;
    const diffVal = overrideParams.difficulty || difficulty;
    const countVal = overrideParams.questionCount || questionCount;
    const typeVal = overrideParams.questionType || questionType;
    const promptVal = overrideParams.prompt !== undefined ? overrideParams.prompt : customPrompt;

    try {
      const payload = {
        topics: topicVal === "Mixed" ? [] : [topicVal],
        difficulty: diffVal,
        questionCount: Number(countVal),
        questionType: typeVal,
        prompt: promptVal,
        mode: "practice",
      };

      const res = await generateSelfTest(payload);
      if (res?.attemptId) {
        navigate(`/student/self-test/attempt/${res.attemptId}`);
      } else {
        setGeneratorError("Failed to initialize test attempt. Please try again.");
      }
    } catch (err) {
      setGeneratorError(err.response?.data?.message || "Could not generate practice test. Please adjust your topic or filters.");
    } finally {
      setGenerating(false);
      setLaunchingTopic("");
    }
  };

  const handleGenerateSimilarTest = (att) => {
    const topicName = att.config?.topics?.[0] || "Mixed";
    const diff = att.config?.difficulty || "Medium";
    setLaunchingTopic(att._id);
    handleGenerateTest({
      topic: topicName,
      difficulty: diff,
      questionCount: att.config?.questionCount || 10,
      questionType: att.config?.questionType || "Mixed",
      prompt: `Generate a similar practice test for ${topicName} at ${diff} difficulty`,
    });
  };

  const handlePracticeWeakTopic = (weakTopic) => {
    setLaunchingTopic(weakTopic);
    handleGenerateTest({
      topic: weakTopic,
      difficulty: "Medium",
      questionCount: 10,
      questionType: "Mixed",
      prompt: `Generate a practice test focused on improving weak topic: ${weakTopic}`,
    });
  };

  if (loading) {
    const loader = (
      <div className="p-16 text-center text-slate-500 animate-pulse font-mono text-xs">
        Loading Practice Hub & Readiness Metrics…
      </div>
    );
    if (embedded) return loader;
    return (
      <DashboardLayout
        active="practice/tests"
        links={STUDENT_LINKS}
        onNavigate={(path) => navigate(path)}
      >
        {loader}
      </DashboardLayout>
    );
  }

  const { stats, recommendations, recentAttempts } = dashboardData || {};

  const readinessScore = recommendations?.readinessScore ?? stats?.readinessScore ?? 0;
  const readinessTier = recommendations?.readinessTier || { title: "Needs Foundational Practice", color: "rose" };
  const weakTopics = recommendations?.weakTopics || [];
  const weakestTopic = weakTopics[0] || (stats?.topicStats && stats.topicStats.length > 0 ? [...stats.topicStats].sort((a,b)=>a.accuracy - b.accuracy)[0]?.topic : "Quantitative Aptitude");

  const mainContent = (
    <div className="space-y-8">
      {/* Practice Hub Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white">
              <Dumbbell size={20} />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Practice Hub
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            Improve your skills through personalized AI practice, track readiness scores, and earn XP.
          </p>
        </div>
      </div>

      {/* Gamification Bar (4 Summary Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: XP */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-amber-500/15 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-100">
              ⭐ XP
            </span>
            <Zap size={18} className="text-amber-100" />
          </div>
          <div className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
            {(stats?.xp || 0).toLocaleString()} XP
          </div>
          <p className="text-[11px] text-amber-100 mt-1 font-mono">Total Practice Earned</p>
        </div>

        {/* Card 2: Level */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-indigo-600/15 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-200">
              🏆 Level
            </span>
            <Trophy size={18} className="text-indigo-200" />
          </div>
          <div className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
            Level {stats?.level || 1}
          </div>
          <p className="text-[11px] text-indigo-200 mt-1 font-mono">Readiness: {readinessScore}%</p>
        </div>

        {/* Card 3: Streak */}
        <div className="bg-gradient-to-br from-rose-500 to-red-600 text-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-rose-500/15 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-100">
              🔥 Streak
            </span>
            <Flame size={18} className="text-rose-100" />
          </div>
          <div className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
            {stats?.streak?.currentStreak || 0} Days
          </div>
          <p className="text-[11px] text-rose-100 mt-1 font-mono">Best: {stats?.streak?.maxStreak || 0} Days</p>
        </div>

        {/* Card 4: Tests Completed */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-emerald-600/15 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-100">
              📝 Tests Completed
            </span>
            <CheckCircle2 size={18} className="text-emerald-100" />
          </div>
          <div className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
            {stats?.totalSelfTests || 0}
          </div>
          <p className="text-[11px] text-emerald-100 mt-1 font-mono">{stats?.totalQuestionsCorrect || 0} Correct Answers</p>
        </div>
      </div>

      {/* Main Grid: Create Your Own Test Generator Card & Progress Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (7 cols): Create Your Own Test Generator */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                    ✨ CREATE YOUR OWN TEST
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Configure your personalized AI self-practice session.
                  </p>
                </div>
              </div>
            </div>

            {generatorError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                {generatorError}
              </div>
            )}

            <div className="space-y-4">
              {/* Field 1: Topic */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Topic
                </label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  {TOPIC_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 2 & 3: Difficulty & Question Count */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  >
                    {["Easy", "Medium", "Hard", "Mixed"].map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Number of Questions
                  </label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  >
                    {[5, 10, 15, 20].map((n) => (
                      <option key={n} value={n}>
                        {n} Questions
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Field 4: Question Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Question Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["Mixed", "MCQ", "Coding"].map((qt) => (
                    <button
                      key={qt}
                      type="button"
                      onClick={() => setQuestionType(qt)}
                      className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                        questionType === qt
                          ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20"
                          : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                      }`}
                    >
                      {qt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 5: Optional Custom Prompt */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare size={13} className="text-indigo-500" /> Optional Custom Prompt
                </label>
                <textarea
                  rows={2}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g. Create a medium-level DSA practice test focusing on arrays, strings and sliding window."
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                />
              </div>

              {/* Action: Generate Button */}
              <button
                onClick={() => handleGenerateTest()}
                disabled={generating}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-2xl py-3.5 font-extrabold text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Generating AI Practice Test…
                  </>
                ) : (
                  <>
                    🚀 Generate Test
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Progress & Weakest Topic Highlight */}
        <div className="lg:col-span-5 space-y-6">
          {/* Your Progress */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart2 size={18} className="text-indigo-600 dark:text-indigo-400" />
                📈 YOUR PROGRESS
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Topic accuracy scores based on completed practice tests.
              </p>
            </div>

            <div className="space-y-3.5">
              {stats?.topicStats && stats.topicStats.length > 0 ? (
                stats.topicStats.map((ts) => (
                  <div key={ts.topic} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800 dark:text-slate-200">{ts.topic}</span>
                      <span className="font-mono text-slate-500 dark:text-slate-400">{ts.accuracy}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          ts.accuracy >= 80
                            ? "bg-emerald-500"
                            : ts.accuracy >= 60
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                        style={{ width: `${Math.max(5, ts.accuracy)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 font-mono">
                  No topic metrics available yet. Take a self-test to start generating progress bars!
                </div>
              )}
            </div>

            {/* Weakest Topic CTA */}
            {weakestTopic && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Weakest Topic: <strong className="text-rose-600 dark:text-rose-400 font-bold">{weakestTopic}</strong>
                </div>
                <button
                  onClick={() => handlePracticeWeakTopic(weakestTopic)}
                  disabled={launchingTopic === weakestTopic}
                  className="w-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 rounded-2xl py-2.5 px-4 font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {launchingTopic === weakestTopic ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Generating Session…
                    </>
                  ) : (
                    <>
                      🎯 Practice {weakestTopic}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Control for History & Bookmarks */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "overview"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          📚 Recent Practice ({recentAttempts?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("bookmarks")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "bookmarks"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          🔖 Bookmarks & Notes ({bookmarks.length})
        </button>
      </div>

      {/* Section 1: Recent Practice List */}
      {activeTab === "overview" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock size={18} className="text-indigo-600 dark:text-indigo-400" />
              📚 RECENT PRACTICE HISTORY
            </h3>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentAttempts && recentAttempts.length > 0 ? (
              recentAttempts.map((att) => {
                const topicLabel = att.config?.topics?.[0] || "Mixed Practice";
                const diffLabel = att.config?.difficulty || "Medium";
                const qCount = att.config?.questionCount || 10;
                const isLaunching = launchingTopic === att._id;

                return (
                  <div
                    key={att._id}
                    className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2.5 mb-1">
                        <span className="font-extrabold text-slate-900 dark:text-white text-base">
                          {topicLabel}
                        </span>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {diffLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
                        <span>{qCount} Questions</span>
                        <span>&bull;</span>
                        <span>Completed {new Date(att.completedAt || att.startedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                          Score: {att.percentage}%
                        </div>
                        <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                          +{att.xpEarned} XP
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/student/self-test/attempt/${att._id}`)}
                          className="bg-slate-900 dark:bg-slate-800 hover:bg-indigo-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-sm"
                        >
                          View Result
                        </button>
                        <button
                          onClick={() => handleGenerateSimilarTest(att)}
                          disabled={isLaunching}
                          className="bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors disabled:opacity-50"
                        >
                          {isLaunching ? "Generating…" : "Generate Similar Test"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs font-mono">
                No practice tests completed yet. Use the Create Your Own Test generator above to start practicing!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section 2: Bookmarks & Notes */}
      {activeTab === "bookmarks" && (
        <div className="space-y-4">
          {bookmarks.length > 0 ? (
            bookmarks.map((bm) => (
              <div
                key={bm._id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3 hover:border-indigo-500/60 transition-all"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono uppercase bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 rounded-full font-bold">
                    {bm.question?.type}
                  </span>
                  <span className="font-semibold">{bm.question?.difficulty}</span>
                </div>
                <p className="text-sm text-slate-900 dark:text-slate-100 font-medium leading-relaxed">
                  {bm.question?.questionText}
                </p>
                {bm.note && (
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl p-3.5 text-xs text-amber-900 dark:text-amber-300 font-mono">
                    <strong>My Note:</strong> {bm.note}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl py-16 text-center text-slate-400 text-xs">
              No bookmarked questions yet. Click the bookmark icon during practice sessions to save questions here!
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (embedded) return mainContent;

  return (
    <DashboardLayout
      active="practice/tests"
      links={STUDENT_LINKS}
      onNavigate={(path) => navigate(path)}
    >
      {mainContent}
    </DashboardLayout>
  );
}
