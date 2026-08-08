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
  Cpu,
  Mail,
  Sun,
  Moon,
  Menu,
  X,
  ClipboardList,
  UserPlus,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

/* ── Data ────────────────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: Cpu,
    title: "AI Test Generator",
    desc: "Generate customized practice questions based on topic and difficulty.",
  },
  {
    icon: Code2,
    title: "Coding Assessments",
    desc: "Solve coding problems with automated evaluation.",
  },
  {
    icon: Target,
    title: "Aptitude Practice",
    desc: "Practice quantitative, verbal, and logical reasoning topics.",
  },
  {
    icon: Brain,
    title: "Psychometric Assessment",
    desc: "Understand behavioral traits, thinking patterns, and workplace readiness.",
  },
  {
    icon: ClipboardList,
    title: "Practice Hub",
    desc: "Create or take practice tests and identify weak areas.",
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    desc: "Track accuracy, progress, strengths, and improvement areas.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Register",
    desc: "Create your student account using your institutional details.",
    icon: UserPlus,
  },
  {
    step: "02",
    title: "Get Approved",
    desc: "Complete the registration process and get access to the platform.",
    icon: ShieldCheck,
  },
  {
    step: "03",
    title: "Practice & Assess",
    desc: "Practice aptitude, coding, AI-generated tests, and psychometric assessments.",
    icon: BookOpen,
  },
  {
    step: "04",
    title: "Track Your Readiness",
    desc: "Review your performance, identify weak areas, and improve continuously.",
    icon: TrendingUp,
  },
];

const STATS = [
  { value: "10K+", label: "Questions" },
  { value: "500+", label: "Students" },
  { value: "250+", label: "Assessments" },
  { value: "2K+", label: "Coding Problems" },
];

const NAV_ITEMS = [
  { label: "Home", id: "#top" },
  { label: "Features", id: "#features" },
  { label: "How It Works", id: "#how" },
  { label: "Contact", id: "#contact" },
];

/* ── Component ───────────────────────────────────────────────────────── */

export default function HomePage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
      {/* Entrance animation keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-fade-in-up {
          animation: fadeInUp 0.7s cubic-bezier(0.16,1,0.3,1) both;
        }
        .anim-delay-100 { animation-delay: 0.1s; }
        .anim-delay-200 { animation-delay: 0.2s; }
      `}</style>

      {/* ── STICKY NAVBAR ── */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#080d1a]/90 backdrop-blur-lg border-b border-slate-200/60 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-[68px]">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <Logo size="md" showSubtitle={true} subtitleText="AI Placement Portal" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8 text-[13px] font-semibold">
            {NAV_ITEMS.map((n) => (
              <button
                key={n.id}
                onClick={() => scrollTo(n.id)}
                className={`relative py-1 transition-colors duration-200 ${
                  n.id === "#top"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
              >
                {n.label}
                {/* Active indicator for Home */}
                {n.id === "#top" && (
                  <span className="absolute -bottom-[22px] left-0 right-0 h-[2px] bg-blue-600 dark:bg-blue-400 rounded-full" />
                )}
              </button>
            ))}
          </nav>

          {/* CTA + Theme toggle */}
          <div className="hidden lg:flex items-center gap-2.5">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all duration-200"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? (
                <Sun size={16} className="text-amber-400" />
              ) : (
                <Moon size={16} className="text-indigo-500" />
              )}
            </button>
            <Link
              to="/login"
              className="px-4 py-2 text-[13px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200"
            >
              Student Login
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-[13px] font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200"
            >
              Register
            </Link>
          </div>

          {/* Mobile controls */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? (
                <Sun size={18} className="text-amber-400" />
              ) : (
                <Moon size={18} className="text-indigo-500" />
              )}
            </button>
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileNavOpen && (
          <div className="lg:hidden border-t border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0c1222] px-5 py-4 space-y-1 text-sm font-semibold">
            {NAV_ITEMS.map((n) => (
              <button
                key={n.id}
                onClick={() => scrollTo(n.id)}
                className={`block w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                  n.id === "#top"
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {n.label}
              </button>
            ))}
            <div className="pt-3 mt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col gap-2">
              <Link
                to="/login"
                className="w-full text-center py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Student Login
              </Link>
              <Link
                to="/register"
                className="w-full text-center py-2.5 rounded-lg bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20"
              >
                Create Account
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO + STATS ── */}
      <section className="relative overflow-hidden pt-10 pb-8 lg:pt-14 lg:pb-10">
        {/* Background decorative glows */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(37,99,235,0.08),transparent)] pointer-events-none" />
        <div className="absolute top-16 left-1/4 w-64 h-64 bg-indigo-500/[0.04] dark:bg-indigo-500/[0.06] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-6 right-1/4 w-52 h-52 bg-blue-500/[0.04] dark:bg-blue-500/[0.06] rounded-full blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
            {/* Left — Copy */}
            <div className="anim-fade-in-up">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/50 mb-5">
                <Sparkles size={11} />
                AI-Powered Placement Preparation
              </span>

              <h1 className="text-[1.85rem] sm:text-[2.25rem] lg:text-[3.3rem] font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.0] mb-4">
                Prepare Smarter.{" "}
                <br className="hidden sm:block" />
                Get{" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Placement Ready
                </span>
                .
              </h1>

              <p className="text-[15px] text-slate-600 dark:text-slate-400 leading-[1.6] mb-6 max-w-[620px]">
                MITRA helps students prepare for placements through AI-powered
                assessments, coding practice, aptitude preparation, psychometric
                evaluation, and performance insights.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-3 mb-6">
                <Link
                  to="/login"
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-px transition-all duration-200 flex items-center gap-2"
                >
                  Student Login <ArrowRight size={15} />
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-lg border-2 border-slate-900 dark:border-slate-200 text-slate-900 dark:text-white font-semibold text-sm hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 hover:-translate-y-px transition-all duration-200"
                >
                  Create Account
                </Link>
              </div>

              {/* Inline stats */}
              <div className="flex flex-wrap gap-x-6 gap-y-3 pt-4 border-t border-slate-200/60 dark:border-slate-800/50">
                {STATS.map((s, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-lg font-extrabold font-mono text-blue-600 dark:text-blue-400 leading-tight">
                      {s.value}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Dashboard Preview */}
            <div className="relative rounded-2xl p-[2px] bg-gradient-to-br from-blue-500/20 via-slate-400/10 to-indigo-500/15 dark:from-blue-500/15 dark:via-slate-700/15 dark:to-indigo-500/10 shadow-2xl anim-fade-in-up anim-delay-200">
              <div className="bg-slate-900 rounded-[14px] overflow-hidden text-white p-4 sm:p-5 border border-slate-800">
                {/* Window chrome */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500/80" />
                    <span className="w-2 h-2 rounded-full bg-amber-500/80" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 font-mono text-[10px] text-slate-500">
                      MITRA / Student Dashboard
                    </span>
                  </div>
                  <span className="text-[9px] font-semibold uppercase bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 tracking-wider">
                    Student Dashboard
                  </span>
                </div>

                {/* Placement Readiness */}
                <div className="bg-slate-800/70 rounded-xl p-3.5 border border-slate-700/50 mb-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-slate-400 font-medium">
                      Placement Readiness
                    </span>
                    <TrendingUp size={14} className="text-amber-400" />
                  </div>
                  <div className="text-xl font-bold text-white mb-1.5">
                    87.5%
                  </div>
                  <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full w-[87.5%] rounded-full" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                  {/* Coding progress */}
                  <div className="bg-slate-800/70 rounded-xl p-3 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-slate-400 font-medium">
                        Coding Progress
                      </span>
                      <Code2 size={12} className="text-blue-400" />
                    </div>
                    <div className="text-sm font-bold text-white mb-1">
                      42 / 60
                    </div>
                    <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full w-[70%] rounded-full" />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Problems Solved
                    </span>
                  </div>

                  {/* AI Test */}
                  <div className="bg-slate-800/70 rounded-xl p-3 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-slate-400 font-medium">
                        AI Practice Test
                      </span>
                      <Sparkles size={12} className="text-indigo-400" />
                    </div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <CheckCircle2
                        size={11}
                        className="text-emerald-400"
                      />
                      <span className="text-[11px] font-semibold text-emerald-400">
                        Completed
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      Score: 82% · 15 Qs
                    </span>
                  </div>
                </div>

                {/* Performance summary */}
                <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/40">
                  <div className="text-[10px] text-slate-400 mb-2 font-semibold uppercase tracking-wider">
                    Performance Summary
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Aptitude", val: "78%", color: "text-blue-400" },
                      { label: "Coding", val: "85%", color: "text-emerald-400" },
                      { label: "Overall", val: "81%", color: "text-amber-400" },
                    ].map((p) => (
                      <div key={p.label} className="text-center">
                        <div className={`text-sm font-bold ${p.color}`}>
                          {p.val}
                        </div>
                        <div className="text-[9px] text-slate-500">
                          {p.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section
        id="features"
        className="py-10 bg-white dark:bg-slate-900/40 border-y border-slate-200/60 dark:border-slate-800/60"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Platform Features
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
              Everything You Need for Placement Preparation
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-lg mx-auto">
              Practice, assess, improve, and track your readiness in one
              platform.
            </p>
          </div>

          {/* 3-column feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="group bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/50 hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/5 dark:hover:shadow-blue-900/20 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    {f.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Getting Started
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
              How MITRA Works
            </h2>
          </div>

          {/* Desktop: horizontal timeline */}
          <div className="hidden md:block relative">
            {/* Connector line */}
            <div className="absolute top-8 left-[12%] right-[12%] h-px bg-gradient-to-r from-blue-400/30 via-blue-400/50 to-blue-400/30 dark:from-blue-600/30 dark:via-blue-600/50 dark:to-blue-600/30" />

            <div className="grid grid-cols-4 gap-6">
              {STEPS.map((s, idx) => {
                const StepIcon = s.icon;
                return (
                  <div
                    key={idx}
                    className="relative flex flex-col items-center text-center"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/25 z-10 relative">
                      <StepIcon size={22} className="text-white" />
                    </div>
                    <div className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 mb-1">
                      Step {s.step}
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                      {s.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[200px]">
                      {s.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile: vertical compact timeline */}
          <div className="md:hidden space-y-4">
            {STEPS.map((s, idx) => {
              const StepIcon = s.icon;
              return (
                <div key={idx} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
                    <StepIcon size={18} className="text-white" />
                  </div>
                  <div className="pt-0.5">
                    <div className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                      Step {s.step}
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {s.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {s.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CONTACT CTA ── */}
      <section
        id="contact"
        className="py-10 bg-white dark:bg-slate-900/40 border-t border-slate-200/60 dark:border-slate-800/60"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950 rounded-2xl p-8 sm:p-10 text-center relative overflow-hidden">
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-2">
                Need Help With Your Placement Preparation?
              </h2>
              <p className="text-sm text-slate-300 max-w-xl mx-auto mb-6 leading-relaxed">
                Connect with the Training & Placement Cell for registration and
                platform-related assistance.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
                <a
                  href="mailto:nnkhalsa@mitra.ac.in"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-md flex items-center gap-2"
                >
                  <Mail size={14} />
                  Contact Placement Cell
                </a>
                <Link
                  to="/login"
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors border border-white/20"
                >
                  Student Login
                </Link>
              </div>

              <div className="text-xs text-slate-400">
                <span className="font-medium text-slate-300">
                  Dr. N. N. Khalsa
                </span>{" "}
                · Associate Professor & Dean (Training & Placement) ·{" "}
                <a
                  href="mailto:nnkhalsa@mitra.ac.in"
                  className="text-blue-400 hover:underline"
                >
                  nnkhalsa@mitra.ac.in
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            {/* Brand */}
            <div className="sm:col-span-1">
              <Logo
                variant="dark"
                size="md"
                showSubtitle={true}
                subtitleText="AI-Based Employability & Placement Portal"
              />
              <p className="text-[11px] text-slate-500 mt-2 max-w-xs leading-relaxed">
                A placement preparation platform for students to practice,
                assess, and track their employability readiness.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-white mb-3">
                Quick Links
              </div>
              <div className="space-y-2 text-xs">
                {NAV_ITEMS.map((n) => (
                  <div key={n.id}>
                    <button
                      onClick={() => scrollTo(n.id)}
                      className="hover:text-white transition-colors"
                    >
                      {n.label}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Legal */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-white mb-3">
                Legal & Policies
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <Link
                    to="/privacy"
                    className="hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </div>
                <div>
                  <Link
                    to="/terms"
                    className="hover:text-white transition-colors"
                  >
                    Terms & Conditions
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <div>
              &copy; {new Date().getFullYear()} MITRA Employability Portal. All
              Rights Reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
