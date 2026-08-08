import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/common/Logo";
import {
  Sparkles,
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
  Award,
  Zap,
  Sun,
  Moon,
  Menu,
  X,
  MapPin,
  ChevronRight,
  Lock,
  Layers,
  Server,
  Database,
} from "lucide-react";

// â”€â”€â”€ Shared data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const FEATURES = [
  { icon: Cpu,        title: "AI Question Generator",  desc: "Generates high-quality MCQ & coding question drafts tailored by topic and difficulty." },
  { icon: Code2,      title: "Coding Assessments",      desc: "Runs code securely against sample and hidden test cases with proportional mark allocation." },
  { icon: Target,     title: "Aptitude Tests",          desc: "Topic-wise aptitude, verbal, and logical reasoning evaluations." },
  { icon: Brain,      title: "Psychometric Tests",      desc: "Evaluates workplace traits, cognitive thinking, and problem-solving readiness." },
  { icon: BookOpen,   title: "Study Materials",         desc: "Searchable reference hub with PDF preview, category filters, and bookmarks." },
  { icon: BarChart3,  title: "Performance Analytics",  desc: "Visual graphs mapping student accuracy, pace index, and class ranking." },
  { icon: Sparkles,   title: "AI Self-Test Generator", desc: "Dynamic self-assessments tailored automatically to student weak areas." },
  { icon: ShieldCheck,title: "AI Proctoring",           desc: "Browser tab monitoring, facial presence detection, and violation logging." },
];

const STEPS = [
  { step: "01", title: "Register",       desc: "Sign up with ERP details" },
  { step: "02", title: "Admin Approval", desc: "Verified by Placement Cell" },
  { step: "03", title: "Study",          desc: "Access curated prep notes" },
  { step: "04", title: "Assess",         desc: "Attempt topic assessments" },
  { step: "05", title: "Code",           desc: "Solve multi-language problems" },
  { step: "06", title: "AI Analysis",    desc: "Get readiness scorecard" },
  { step: "07", title: "Placed!",        desc: "Excel in corporate drives" },
];

const TECH_STACK = [
  { name: "React.js",   tag: "Frontend",    icon: Code2 },
  { name: "Node.js",    tag: "Runtime",     icon: Server },
  { name: "Express.js", tag: "API",         icon: Layers },
  { name: "MongoDB",    tag: "Database",    icon: Database },
  { name: "JWT Auth",   tag: "Security",    icon: Lock },
  { name: "AI LLMs",    tag: "Hugging Face",icon: Cpu },
  { name: "Tailwind",   tag: "Styling",     icon: Zap },
];

const STATS = [
  { value: "10K+",  label: "Questions" },
  { value: "500+",  label: "Students" },
  { value: "250+",  label: "Assessments" },
  { value: "2K+",   label: "Coding Qs" },
  { value: "99.9%", label: "Uptime", accent: "emerald" },
];

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
    <div
      id="top"
      className="min-h-screen bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200"
    >
      {/* â”€â”€ STICKY NAVBAR â”€â”€ */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-[#080d1a]/85 backdrop-blur-xl transition-colors">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo size="md" showSubtitle={true} subtitleText="AI Placement Portal" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {[
              { label: "Home",         id: "#top" },
              { label: "Features",     id: "#features" },
              { label: "How It Works", id: "#how" },
              { label: "T&P Cell",     id: "#tp-cell" },
              { label: "Contact",      id: "#contact" },
            ].map((n) => (
              <button key={n.id} onClick={() => scrollTo(n.id)} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {n.label}
              </button>
            ))}
          </nav>

          {/* CTA + Theme toggle */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-indigo-600" />}
            </button>
            <Link to="/login" className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
              Student Login
            </Link>
            <Link to="/register" className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all">
              Register
            </Link>
          </div>

          {/* Mobile controls */}
          <div className="flex items-center gap-2 lg:hidden">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
              {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-600" />}
            </button>
            <button onClick={() => setMobileNavOpen(!mobileNavOpen)} className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
              {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileNavOpen && (
          <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4 space-y-3 text-xs font-semibold">
            {[
              { label: "Home",         id: "#top" },
              { label: "Features",     id: "#features" },
              { label: "How It Works", id: "#how" },
              { label: "T&P Cell",     id: "#tp-cell" },
              { label: "Contact",      id: "#contact" },
            ].map((n) => (
              <button key={n.id} onClick={() => scrollTo(n.id)} className="block w-full text-left py-1 text-slate-700 dark:text-slate-300">
                {n.label}
              </button>
            ))}
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

      {/* â”€â”€ HERO + STATS (single viewport-height section) â”€â”€ */}
      <section className="relative overflow-hidden pt-14 pb-12 lg:pt-20 lg:pb-16">
        {/* Background decorative glows */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,rgba(37,99,235,0.13),transparent)] pointer-events-none" />
        <div className="absolute top-24 left-1/4 w-80 h-80 bg-indigo-500/5 dark:bg-indigo-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-1/4 w-60 h-60 bg-blue-500/5 dark:bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">

            {/* Left â€“ Copy */}
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 mb-5">
                <Sparkles size={12} className="animate-pulse" />
                Official AI Placement Preparation Platform
              </span>

              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-4">
                Prepare for Your Dream Career
                {" "}with{" "}
                <span className="bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Artificial Intelligence
                </span>
              </h1>

              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-7 max-w-lg">
                MITRA Employability Portal is an AI-powered placement preparation platform that helps students improve their employability skills through coding assessments, aptitude practice, AI-generated tests, study materials, psychometric evaluations, and performance analytics.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-3 mb-8">
                <Link to="/login" className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xl shadow-blue-500/30 transition-all flex items-center gap-2">
                  Student Login <ArrowRight size={14} />
                </Link>
                <Link to="/register" className="px-5 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-md">
                  Register Account
                </Link>
                <button onClick={() => scrollTo("#features")} className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all">
                  Explore Features
                </button>
              </div>

              {/* Inline stats â€“ replaces the old dedicated stats section */}
              <div className="flex flex-wrap gap-x-7 gap-y-3 pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
                {STATS.map((s, i) => (
                  <div key={i} className="flex flex-col">
                    <span className={`text-xl font-extrabold font-mono ${s.accent === "emerald" ? "text-emerald-500 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"}`}>
                      {s.value}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right â€“ Dashboard Mockup */}
            <div className="relative rounded-2xl p-[2px] bg-gradient-to-br from-blue-500/25 via-slate-400/10 to-indigo-500/20 dark:from-blue-500/20 dark:via-slate-700/20 dark:to-indigo-500/15 shadow-2xl">
              <div className="bg-slate-900 rounded-[14px] overflow-hidden text-white p-5 border border-slate-800">
                {/* Window chrome */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="ml-2 font-mono text-[10px] text-slate-400">mitra-portal.edu / student-dashboard</span>
                  </div>
                  <span className="text-[9px] font-mono uppercase bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">
                    AI Proctoring Active
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  {/* Readiness score â€“ full width */}
                  <div className="col-span-3 bg-slate-800/80 rounded-xl p-4 border border-slate-700/60">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400">Placement Readiness Score</span>
                      <Award size={15} className="text-amber-400" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-2">87.5%</div>
                    <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full w-[87.5%] rounded-full" />
                    </div>
                    <div className="flex justify-between mt-1.5 text-[10px] text-slate-500">
                      <span>Tier 2 Ready</span>
                      <span className="text-emerald-400 font-semibold">Tier 1 Target: 90%</span>
                    </div>
                  </div>

                  {/* Coding sandbox */}
                  <div className="col-span-2 bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-slate-400">Coding Sandbox</span>
                      <Code2 size={13} className="text-blue-400" />
                    </div>
                    <div className="text-[11px] font-mono text-emerald-400 mb-0.5">âœ“ Passed (5/5 Cases)</div>
                    <span className="text-[10px] text-slate-500">Python 3.10 â€¢ Piston Engine</span>
                  </div>

                  {/* AI test */}
                  <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-slate-400">AI Test</span>
                      <Sparkles size={13} className="text-indigo-400" />
                    </div>
                    <div className="text-[10px] font-semibold text-slate-200">Adaptive Quant</div>
                    <span className="text-[10px] text-slate-500">10 Qs â€¢ Easyâ†’Hard</span>
                  </div>
                </div>

                {/* Mini leaderboard */}
                <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
                  <div className="text-[10px] text-slate-400 mb-2 font-semibold uppercase tracking-wider">Class Leaderboard</div>
                  <div className="space-y-1.5">
                    {[
                      { rank: "01", name: "Priya S.",  score: "94.2%" },
                      { rank: "02", name: "Rahul K.",  score: "91.7%" },
                      { rank: "03", name: "Anjali M.", score: "89.1%" },
                    ].map((r) => (
                      <div key={r.rank} className="flex items-center gap-2 text-[10px]">
                        <span className="font-mono text-blue-400 w-4">{r.rank}</span>
                        <span className="flex-1 text-slate-300">{r.name}</span>
                        <span className="text-emerald-400 font-semibold">{r.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ FEATURES (merged About + Features into one section) â”€â”€ */}
      <section id="features" className="py-12 bg-white dark:bg-slate-900/40 border-y border-slate-200/60 dark:border-slate-800/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Comprehensive Platform Capabilities
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                Everything You Need to Succeed
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs sm:text-right leading-relaxed">
              Built for college students & faculty placement administrators to streamline recruitment preparation.
            </p>
          </div>

          {/* 4-column feature grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="group bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/50 hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/5 dark:hover:shadow-blue-900/20 transition-all duration-300"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Icon size={18} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-1">{f.title}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Tech stack pills â€“ replaces the old dedicated tech section */}
          <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Built with:</span>
              {TECH_STACK.map((t, i) => {
                const Icon = t.icon;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-blue-400/50 transition-colors"
                  >
                    <Icon size={11} className="text-blue-500" />
                    {t.name}
                    <span className="text-[9px] text-slate-400">Â· {t.tag}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ HOW IT WORKS â”€â”€ */}
      <section id="how" className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Structured Preparation Journey
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                How It Works
              </h2>
            </div>
          </div>

          {/* Horizontal stepper */}
          <div className="relative">
            {/* Connector line (desktop only) */}
            <div className="hidden lg:block absolute top-7 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/30 dark:via-blue-600/30 to-transparent mx-14" />

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
              {STEPS.map((s, idx) => (
                <div key={idx} className="relative flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/25 z-10 relative">
                    <span className="font-mono font-bold text-white text-sm">{s.step}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">{s.title}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{s.desc}</div>
                  {idx < STEPS.length - 1 && (
                    <ChevronRight size={14} className="hidden lg:block absolute -right-3 top-[16px] text-blue-400/50 z-20" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ T&P CELL + CONTACT (merged into a single 2-column section) â”€â”€ */}
      <section id="tp-cell" className="py-12 bg-white dark:bg-slate-900/40 border-t border-slate-200/60 dark:border-slate-800/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* T&P Cell card */}
            <div className="bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950 rounded-3xl p-7 text-white border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 mb-4">
                <Building2 size={12} /> Training & Placement Cell
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold mb-3">Dedicated Institutional Support</h3>
              <p className="text-slate-300 text-xs leading-relaxed mb-5">
                MITRA Employability Portal has been developed to support students in enhancing their employability skills through AI-powered assessments, coding practice, aptitude preparation, psychometric evaluations, and performance analytics.
              </p>

              {/* Dean card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-base text-white shrink-0">
                    NK
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Dr. N. N. Khalsa</h4>
                    <p className="text-[11px] text-blue-400 font-medium">Associate Professor & Dean (Training & Placement)</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-300 mb-4">
                  <div className="flex items-center gap-2"><Mail size={13} className="text-blue-400" /><span>nnkhalsa@mitra.ac.in</span></div>
                  <div className="flex items-center gap-2"><Phone size={13} className="text-blue-400" /><span>+91 9823793943</span></div>
                </div>
                <a
                  href="mailto:nnkhalsa@mitra.ac.in"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-md"
                >
                  Contact Placement Cell <ArrowRight size={13} />
                </a>
              </div>
            </div>

            {/* Contact details card */}
            <div id="contact" className="flex flex-col gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Get In Touch</span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1 mb-2">
                  Placement Cell Contact
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Have questions regarding student registration, placement drives, or technical assessment queries? Reach out to the Placement Cell desk.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { icon: MapPin, label: "Office Location",  value: "Training & Placement Cell Block, Main Campus Building", sub: "PRMITR Campus â€¢ Badnera, Amravati" },
                  { icon: Clock,  label: "Office Hours",     value: "Monday â€“ Friday: 9:00 AM â€“ 5:00 PM IST" },
                  { icon: Mail,   label: "Email",            value: "nnkhalsa@mitra.ac.in", link: "mailto:nnkhalsa@mitra.ac.in" },
                  { icon: Phone,  label: "Phone",            value: "+91 9823793943" },
                ].map((c, i) => {
                  const Icon = c.icon;
                  return (
                    <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Icon size={15} />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-900 dark:text-white mb-0.5">{c.label}</div>
                        {c.link
                          ? <a href={c.link} className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline">{c.value}</a>
                          : <div className="text-[11px] text-slate-500 dark:text-slate-400">{c.value}</div>
                        }
                        {c.sub && <div className="text-[10px] text-slate-400 mt-0.5">{c.sub}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ FOOTER â”€â”€ */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-7">
            <div className="md:col-span-2">
              <Logo variant="dark" size="md" showSubtitle={true} subtitleText="AI-Based Employability & Placement Assessment Portal" />
              <p className="text-[11px] text-slate-500 mt-3 max-w-sm leading-relaxed">
                Empowering college students with automated AI question drafting, Piston multi-language coding compilation, facial proctoring, and placement readiness analytics.
              </p>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-white mb-3">Quick Links</div>
              <div className="space-y-2 text-xs">
                <div><Link to="/login" className="hover:text-white transition-colors">Student Login</Link></div>
                <div><Link to="/register" className="hover:text-white transition-colors">Register Account</Link></div>
                <div><button onClick={() => scrollTo("#features")} className="hover:text-white transition-colors">Features</button></div>
                <div><button onClick={() => scrollTo("#contact")} className="hover:text-white transition-colors">Contact</button></div>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-white mb-3">Legal & Policies</div>
              <div className="space-y-2 text-xs">
                <div><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></div>
                <div><Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></div>
                <div><button onClick={() => scrollTo("#tp-cell")} className="hover:text-white transition-colors">Training & Placement Cell</button></div>
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <div>&copy; {new Date().getFullYear()} MITRA Employability Portal. All Rights Reserved.</div>
            <div className="font-mono text-[10px]">Version 2.4 Enterprise</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
