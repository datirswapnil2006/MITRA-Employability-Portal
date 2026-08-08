import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { STUDENT_LINKS } from "./studentLinks";
import { generateSelfTest } from "../../api/selfTest";
import StudentSelfTestGenerator from "./StudentSelfTestGenerator";
import StudentSelfTestDashboard from "./StudentSelfTestDashboard";
import StudentStudyMaterials from "./StudentStudyMaterials";
import {
  Code2,
  Dumbbell,
  BookOpen,
  Zap,
  Sparkles,
  Play,
  Terminal,
  Award,
  Layers,
  RefreshCw,
  ArrowRight,
  Brain,
  CheckCircle2,
} from "lucide-react";

const CODING_TOPICS = [
  { name: "Arrays & Strings", category: "Data Structures & Algorithms", count: 5, difficulty: "Easy" },
  { name: "Trees & Graphs", category: "Data Structures & Algorithms", count: 5, difficulty: "Medium" },
  { name: "Dynamic Programming", category: "Data Structures & Algorithms", count: 5, difficulty: "Hard" },
  { name: "Sorting & Searching", category: "Data Structures & Algorithms", count: 5, difficulty: "Easy" },
];

export default function StudentPracticeContainer() {
  const navigate = useNavigate();
  const location = useLocation();

  let activeTab = "tests";
  if (location.pathname.includes("/coding")) {
    activeTab = "coding";
  } else if (location.pathname.includes("/materials")) {
    activeTab = "materials";
  } else if (location.pathname.includes("/tests")) {
    activeTab = "tests";
  }

  const [selectedLanguage, setSelectedLanguage] = useState("python");
  const [launchingTopic, setLaunchingTopic] = useState("");

  const handleLaunchCodingPractice = async (topicObj) => {
    setLaunchingTopic(topicObj.name);
    try {
      const res = await generateSelfTest({
        category: topicObj.category,
        difficulty: topicObj.difficulty,
        questionCount: topicObj.count,
        questionType: "coding",
        language: selectedLanguage,
      });
      if (res?.attemptId) {
        navigate(`/student/self-test/attempt/${res.attemptId}`);
      } else {
        navigate("/student/practice/tests");
      }
    } catch (err) {
      navigate("/student/practice/tests");
    } fontFinally: {
      setLaunchingTopic("");
    }
  };

  return (
    <DashboardLayout
      active={`practice/${activeTab}`}
      links={STUDENT_LINKS}
      onNavigate={(path) => navigate(path)}
    >
      {/* Practice Header */}
      <div className="mb-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Code2 size={26} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white">
              Placement Preparation & Practice Studio
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Self-paced practice tests, live multi-language coding compiler drills, and study notes.
          </p>
        </div>

        {/* Sub-navigation tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/60 self-start md:self-auto overflow-x-auto">
          <button
            onClick={() => navigate("/student/practice/tests")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "tests"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Dumbbell size={15} /> Practice Tests
          </button>
          <button
            onClick={() => navigate("/student/practice/coding")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "coding"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Code2 size={15} /> Coding Practice
          </button>
          <button
            onClick={() => navigate("/student/practice/materials")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "materials"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <BookOpen size={15} /> Study Materials
          </button>
        </div>
      </div>

      {/* Tab 1: Practice Tests (Self-Test Hub / Generator) */}
      {activeTab === "tests" && (
        <div className="space-y-8 animate-fadeIn">
          <StudentSelfTestDashboard embedded={true} />
        </div>
      )}

      {/* Tab 2: Coding Practice Studio */}
      {activeTab === "coding" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Coding Hero */}
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-semibold mb-3">
                  <Terminal size={14} className="text-indigo-400" /> Multi-Language Online Judge & IDE Engine
                </div>
                <h2 className="font-display text-2xl font-extrabold mb-2">
                  DSA & Coding Practice Studio
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  Solve coding challenges with live execution against test cases. Write code in Python, Java, or C++, run against sample inputs, and evaluate edge cases.
                </p>
              </div>

              {/* Language Selector */}
              <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-2xl space-y-2 shrink-0">
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-300">
                  Select Preferred Language:
                </label>
                <div className="flex gap-2">
                  {["python", "java", "cpp"].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border ${
                        selectedLanguage === lang
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30"
                          : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
                      }`}
                    >
                      {lang === "cpp" ? "C++" : lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Coding Problem Categories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CODING_TOPICS.map((pt, idx) => {
              const isLaunching = launchingTopic === pt.name;

              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md hover:border-indigo-400 transition-all group"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                      <Code2 size={20} />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1 group-hover:text-indigo-600 transition-colors">
                      {pt.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                      {pt.count} Problem Sets • {pt.difficulty} Difficulty
                    </p>
                  </div>

                  <button
                    onClick={() => handleLaunchCodingPractice(pt)}
                    disabled={!!launchingTopic}
                    className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-indigo-600 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                  >
                    {isLaunching ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" /> Launching Compiler…
                      </>
                    ) : (
                      <>
                        <Play size={14} fill="currentColor" /> Solve Coding Problem
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Study Materials */}
      {activeTab === "materials" && (
        <div className="animate-fadeIn">
          <StudentStudyMaterials embedded={true} />
        </div>
      )}
    </DashboardLayout>
  );
}
