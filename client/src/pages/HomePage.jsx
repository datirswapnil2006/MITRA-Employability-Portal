import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/common/Logo";
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Code2,
  Brain,
  BookOpen,
  BarChart3,
  Target,
  ShieldCheck,
  Cpu,
  Clock,
  Mail,
  Phone,
  Building2,
  Users,
  Award,
  Zap,
  Check,
  Sun,
  Moon,
  Menu,
  X,
  MapPin,
  ChevronRight,
  FileText,
  Lock,
  Layers,
  Server,
  Database,
  Terminal,
} from "lucide-react";

export default function HomePage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("student");
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark" || false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const scrollTo = (id) => {
    setMobileNavOpen(false);
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div id="top" className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* ── 1. STICKY NAVBAR ── */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
          {/* Left: Logo & Branding */}
          <Link to="/" className="flex items-center gap-2.5">
            <Logo size="md" showSubtitle={true} subtitleText="AI Placement Portal" />
          </Link>

          {/* Desktop Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <button onClick={() => scrollTo("#top")} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</button>
            <button onClick={() => scrollTo("#about")} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About</button>
            <button onClick={() => scrollTo("#features")} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</button>
            <button onClick={() => scrollTo("#tech")} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Technology</button>
            <button onClick={() => scrollTo("#tp-cell")} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">T&P Cell</button>
            <button onClick={() => scrollTo("#contact")} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact</button>
          </nav>

          {/* Action Buttons & Theme Switcher */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-indigo-600" />}
            </button>
            <Link
              to="/login"
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Student Login
            </Link>
            <Link
              to="/register"
              className="px-4.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 transition-all"
            >
              Register
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-600" />}
            </button>
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileNavOpen && (
          <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4 space-y-3 text-xs font-semibold animate-fadeIn">
            <button onClick={() => scrollTo("#top")} className="block w-full text-left py-1 text-slate-700 dark:text-slate-300">Home</button>
            <button onClick={() => scrollTo("#about")} className="block w-full text-left py-1 text-slate-700 dark:text-slate-300">About</button>
            <button onClick={() => scrollTo("#features")} className="block w-full text-left py-1 text-slate-700 dark:text-slate-300">Features</button>
            <button onClick={() => scrollTo("#tech")} className="block w-full text-left py-1 text-slate-700 dark:text-slate-300">Technology</button>
            <button onClick={() => scrollTo("#tp-cell")} className="block w-full text-left py-1 text-slate-700 dark:text-slate-300">T&P Cell</button>
            <button onClick={() => scrollTo("#contact")} className="block w-full text-left py-1 text-slate-700 dark:text-slate-300">Contact</button>
            <div className="pt-2 flex flex-col gap-2">
              <Link to="/login" className="w-full text-center py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white">
                Student Login
              </Link>
              <Link to="/register" className="w-full text-center py-2.5 rounded-xl bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20">
                Register Account
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── 2. HERO SECTION ── */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.15),transparent)] pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 mb-6">
              <Sparkles size={14} className="animate-pulse" /> Official AI Placement Preparation Platform
            </span>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15] mb-6">
              Prepare for Your Dream Career with{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Artificial Intelligence
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
              MITRA Employability Portal is an AI-powered placement preparation platform that helps students improve their employability skills through coding assessments, aptitude practice, AI-generated tests, study materials, psychometric evaluations, and performance analytics.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/login"
                className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xl shadow-blue-500/25 transition-all flex items-center gap-2"
              >
                Student Login <ArrowRight size={15} />
              </Link>
              <Link
                to="/register"
                className="px-6 py-3.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-md"
              >
                Register Account
              </Link>
              <button
                onClick={() => scrollTo("#features")}
                className="px-6 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
              >
                Explore Features
              </button>
            </div>
          </div>

          {/* Hero Device Frame Mockup Preview */}
          <div className="max-w-5xl mx-auto relative rounded-2xl p-2 bg-gradient-to-b from-slate-200 dark:from-slate-800 to-transparent border border-slate-200/80 dark:border-slate-800 shadow-2xl">
            <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 text-white p-4 sm:p-6 shadow-2xl">
              {/* Window Chrome */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="ml-2 font-mono text-[11px] text-slate-400">mitra-portal.edu / student-dashboard</span>
                </div>
                <span className="text-[10px] font-mono uppercase bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">
                  AI Proctoring Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">Placement Readiness</span>
                    <Award size={16} className="text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">87.5%</div>
                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full w-[87.5%]" />
                  </div>
                </div>

                <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">Coding Sandbox</span>
                    <Code2 size={16} className="text-blue-400" />
                  </div>
                  <div className="text-xs font-mono text-emerald-400 mb-1">Passed (5/5 Cases)</div>
                  <span className="text-[11px] text-slate-400">Python 3.10 • Piston Sandbox</span>
                </div>

                <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">AI Self-Test Generator</span>
                    <Sparkles size={16} className="text-indigo-400" />
                  </div>
                  <div className="text-xs font-semibold text-slate-200">Adaptive Quantitative Test</div>
                  <span className="text-[11px] text-slate-400">10 Questions • Easy to Hard</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. PORTAL STATISTICS ── */}
      <section className="py-12 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            <div className="p-4">
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">10,000+</div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Question Bank</div>
            </div>
            <div className="p-4">
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">500+</div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Students</div>
            </div>
            <div className="p-4">
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">250+</div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Practice Tests</div>
            </div>
            <div className="p-4">
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">2,000+</div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Coding Questions</div>
            </div>
            <div className="p-4 col-span-2 md:col-span-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">99.9%</div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">System Availability</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. ABOUT SECTION ── */}
      <section id="about" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
              Centralized Placement Preparation
            </h2>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
              About MITRA Employability Portal
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              MITRA Employability Portal is a centralized placement preparation platform designed to enhance students' technical, aptitude, coding, and soft skills using Artificial Intelligence and modern web technologies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Cpu, title: "AI Question Generation", desc: "Automated LLM question drafting with human-in-the-loop admin review." },
              { icon: Code2, title: "Coding Assessments", desc: "Multi-language online compiler for Python, Java, C++ with test cases." },
              { icon: Target, title: "Practice Tests", desc: "Topic-wise aptitude, verbal, and logical reasoning evaluations." },
              { icon: Sparkles, title: "AI Self-Test Generator", desc: "Custom adaptive practice test generator targeted at weak topics." },
              { icon: BookOpen, title: "Study Materials", desc: "Curated repository of placement notes, interview prep PDFs, & guides." },
              { icon: Brain, title: "Psychometric Tests", desc: "Personality, logical aptitude, and corporate behavioral profile evaluations." },
              { icon: BarChart3, title: "Performance Analytics", desc: "Real-time accuracy trends, rank leaderboards, and readiness scoring." },
              { icon: ShieldCheck, title: "AI Proctoring", desc: "Facial detection, missing face alerts, and tab switch monitoring." },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-500/50 transition-all duration-300 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon size={20} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">{item.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 5. FEATURES SECTION ── */}
      <section id="features" className="py-20 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
              Comprehensive Platform Capabilities
            </h2>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
              Everything You Need to Succeed
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Built for college students and faculty placement administrators to streamline recruitment preparation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { emoji: "🤖", title: "AI Question Generator", desc: "Generates high-quality MCQ & Coding question drafts tailored by topic and difficulty." },
              { emoji: "💻", title: "Coding Assessments", desc: "Runs code securely against sample and hidden test cases with proportional mark allocation." },
              { emoji: "📚", title: "Study Materials", desc: "Searchable reference material hub with PDF preview, category filters, and note bookmarks." },
              { emoji: "🧠", title: "Psychometric Tests", desc: "Evaluates workplace traits, cognitive thinking, and problem-solving readiness." },
              { emoji: "📊", title: "Performance Analytics", desc: "Visual graphs mapping student accuracy, pace index, and class ranking." },
              { emoji: "🎯", title: "AI Self-Test Generator", desc: "Dynamic self-assessments tailored automatically to student weak areas." },
              { emoji: "🔒", title: "AI Proctoring", desc: "Browser tab monitoring, facial presence detection, and violation logging." },
              { emoji: "📈", title: "Placement Readiness", desc: "Rule-based readiness index (0-100) mapping students to tier 1/2 placement tiers." },
            ].map((f, i) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/60 hover:shadow-lg transition-all duration-300">
                <div className="text-3xl mb-3">{f.emoji}</div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">{f.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. HOW IT WORKS ── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
              Structured Preparation Journey
            </h2>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              How It Works
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
            {[
              { step: "01", title: "Student Registration", desc: "Register using ERP details." },
              { step: "02", title: "Admin Approval", desc: "Verified by Placement Cell." },
              { step: "03", title: "Study Materials", desc: "Access curated prep notes." },
              { step: "04", title: "Practice Tests", desc: "Attempt topic assessments." },
              { step: "05", title: "Coding Assessment", desc: "Solve multi-language code." },
              { step: "06", title: "AI Analysis", desc: "Get readiness scorecard." },
              { step: "07", title: "Placement Ready", desc: "Excel in corporate drives." },
            ].map((s, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 text-center relative">
                <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 mb-1">{s.step}</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white mb-1">{s.title}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. TECHNOLOGY STACK ── */}
      <section id="tech" className="py-20 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
              Modern Enterprise Architecture
            </h2>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Technology Stack
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 text-center">
            {[
              { name: "React.js", icon: Code2, tag: "Frontend" },
              { name: "Node.js", icon: Server, tag: "Runtime" },
              { name: "Express.js", icon: Layers, tag: "Backend API" },
              { name: "MongoDB", icon: Database, tag: "Database" },
              { name: "JWT Auth", icon: Lock, tag: "Security" },
              { name: "AI LLMs", icon: Cpu, tag: "Hugging Face" },
              { name: "Responsive", icon: Zap, tag: "Tailwind CSS" },
            ].map((t, i) => {
              const Icon = t.icon;
              return (
                <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60">
                  <Icon size={24} className="mx-auto text-blue-600 dark:text-blue-400 mb-2" />
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{t.name}</div>
                  <div className="text-[10px] text-slate-400">{t.tag}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 8. TRAINING & PLACEMENT CELL SECTION ── */}
      <section id="tp-cell" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950 rounded-3xl p-8 sm:p-12 text-white border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 mb-4">
                <Building2 size={14} /> Training & Placement Cell
              </span>

              <h3 className="text-2xl sm:text-4xl font-extrabold mb-4">
                Dedicated Institutional Support
              </h3>

              <p className="text-slate-300 text-sm leading-relaxed mb-8">
                MITRA Employability Portal has been developed to support students in enhancing their employability skills through AI-powered assessments, coding practice, aptitude preparation, psychometric evaluations, and performance analytics. The platform is intended to assist students in becoming industry-ready and improving their placement opportunities.
              </p>

              {/* T&P Dean Card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 max-w-md backdrop-blur-md">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-lg text-white">
                    NK
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Dr. N. N. Khalsa</h4>
                    <p className="text-xs text-blue-400 font-medium">Associate Professor & Dean (Training & Placement)</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-blue-400" />
                    <span>nnkhalsa@mitra.ac.in</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-blue-400" />
                    <span>+91 9823793943</span>
                  </div>
                </div>

                <a
                  href="mailto:nnkhalsa@mitra.ac.in"
                  className="mt-5 inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-md"
                >
                  Contact Placement Cell <ArrowRight size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. CONTACT SECTION ── */}
      <section id="contact" className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
                Get In Touch
              </h2>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
                Placement Cell Contact
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                Have questions regarding student registration, placement drives, or technical assessment queries? Reach out to the Placement Cell desk.
              </p>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                  <MapPin size={18} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Office Location</div>
                    <div className="text-slate-500 dark:text-slate-400">Training & Placement Cell Block, Main Campus Building</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                  <Clock size={18} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Office Hours</div>
                    <div className="text-slate-500 dark:text-slate-400">Monday – Friday: 9:00 AM – 5:00 PM IST</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/80 text-center flex flex-col justify-center min-h-[300px]">
              <Building2 size={48} className="mx-auto text-blue-600 dark:text-blue-400 mb-3 opacity-60" />
              <div className="text-sm font-bold text-slate-900 dark:text-white">Campus Location Map</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                PRMITR Campus Placement Office • Badnera, Amravati
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. FOOTER ── */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2">
              <Logo variant="dark" size="md" showSubtitle={true} subtitleText="AI-Based Employability & Placement Assessment Portal" />
              <p className="text-xs text-slate-500 mt-3 max-w-sm leading-relaxed">
                Empowering college students with automated AI question drafting, Piston multi-language coding compilation, facial proctoring, and placement readiness analytics.
              </p>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-white mb-3">Quick Links</div>
              <div className="space-y-2 text-xs">
                <div><Link to="/login" className="hover:text-white transition-colors">Student Login</Link></div>
                <div><Link to="/register" className="hover:text-white transition-colors">Register Account</Link></div>
                <div><button onClick={() => scrollTo("#about")} className="hover:text-white transition-colors">About Portal</button></div>
                <div><button onClick={() => scrollTo("#contact")} className="hover:text-white transition-colors">Contact</button></div>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-white mb-3">Legal & Policies</div>
              <div className="space-y-2 text-xs">
                <div><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></div>
                <div><Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></div>
                <div><button onClick={() => scrollTo("#tp-cell")} className="hover:text-white transition-colors">Training & Placement Cell</button></div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              &copy; {new Date().getFullYear()} MITRA Employability Portal. All Rights Reserved.
            </div>
            <div className="font-mono text-[11px]">
              Version 2.4 Enterprise
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}