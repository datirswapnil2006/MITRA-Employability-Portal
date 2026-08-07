import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import PsychometricRadarChart from "../../components/psychometric/PsychometricRadarChart";
import { getPsychometricAttemptAnalysis } from "../../api/student";
import { downloadPsychometricPDF } from "../../utils/psychometricReportPdf";
import { STUDENT_LINKS } from "./studentLinks";
import {
  Brain,
  Download,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  MessageSquare,
  ShieldAlert,
  Compass,
  User,
  Layers,
  Briefcase,
} from "lucide-react";

export default function StudentPsychometricReport() {
  const { id: attemptId } = useParams();
  const navigate = useNavigate();

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getPsychometricAttemptAnalysis(attemptId)
      .then(setAnalysis)
      .catch((err) => setError(err.response?.data?.message || "Failed to load psychometric analysis report"))
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return (
      <DashboardLayout active="psychometric" links={STUDENT_LINKS} onNavigate={(k) => navigate(`/student/${k}`)}>
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-9 h-9 border-3 border-accent/30 border-t-accent rounded-full animate-spin mb-4" />
          <p className="font-display text-sm font-semibold text-ink">Analyzing candidate psychometric profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !analysis) {
    return (
      <DashboardLayout active="psychometric" links={STUDENT_LINKS} onNavigate={(k) => navigate(`/student/${k}`)}>
        <div className="bg-white border border-line rounded-2xl p-8 max-w-lg mx-auto text-center my-12 shadow-sm">
          <AlertTriangle size={40} className="mx-auto text-danger mb-3" />
          <h2 className="font-display text-lg font-bold text-ink mb-2">Report Error</h2>
          <p className="text-xs text-ink-soft mb-6">{error || "Analysis not available"}</p>
          <button
            onClick={() => navigate("/student/psychometric")}
            className="bg-accent text-white px-5 py-2.5 rounded-xl text-xs font-semibold"
          >
            Back to Psychometric Hub
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const { student, test, completedAt, personalityProfile, traitBreakdown, strengths, developmentAreas, workplaceStyle, careerRecommendations } = analysis;

  const dateStr = completedAt
    ? new Date(completedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "Completed";

  return (
    <DashboardLayout
      active="psychometric"
      links={STUDENT_LINKS}
      onNavigate={(k) => navigate(k === "tests" ? "/student" : `/student/${k}`)}
    >
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => navigate("/student/psychometric")}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mb-2"
          >
            <ArrowLeft size={14} /> Back to Psychometric Hub
          </button>
          <div className="flex items-center gap-2.5">
            <Brain size={26} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
              Psychometric & Behavioral Dossier
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Candidate: <strong className="text-slate-700 dark:text-slate-200">{student?.name}</strong> ({student?.erpNumber || "ERP"}) · {student?.branch} · Evaluated: {dateStr}
          </p>
        </div>

        <button
          onClick={() => downloadPsychometricPDF(analysis)}
          className="bg-blue-600 dark:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-sm shrink-0"
        >
          <Download size={15} /> Download PDF Report
        </button>
      </div>

      {/* BEHAVIORAL ARCHETYPE HERO CARD */}
      <div className="bg-gradient-to-r from-blue-600/10 via-indigo-50/70 to-slate-50 dark:from-indigo-950/60 dark:via-slate-900 dark:to-slate-900/90 border border-blue-500/20 dark:border-blue-500/30 rounded-2xl p-5 sm:p-6 mb-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="font-mono text-[11px] uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400">
                Primary Behavioral Archetype
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 mb-1.5 break-words">
              {personalityProfile?.archetype || "Adaptive Professional"}
            </h2>
            <p className="font-semibold text-blue-700 dark:text-blue-300 text-sm mb-3 italic break-words">
              "{personalityProfile?.tagline || "Versatile team member with balanced behavioral competencies."}"
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl break-words">
              {personalityProfile?.description}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800/80 border border-blue-500/20 dark:border-slate-700 rounded-2xl p-4 shadow-sm text-center shrink-0 min-w-[200px]">
            <Award size={36} className="mx-auto text-blue-600 dark:text-blue-400 mb-1" />
            <div className="font-mono text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400">Assessment Target</div>
            <div className="font-display font-bold text-sm text-slate-900 dark:text-slate-100 truncate max-w-[220px]">{test?.title}</div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1">{traitBreakdown?.length || 0} Evaluated Traits</div>
          </div>
        </div>
      </div>

      {/* RADAR CHART & TRAIT BREAKDOWN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Radar Chart Visual */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-center shadow-sm overflow-hidden">
          <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 text-center w-full flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <span>Behavioral Trait Polygon</span>
            <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 uppercase bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded font-bold">0 - 100% Scale</span>
          </h3>

          <PsychometricRadarChart data={traitBreakdown} size={320} />
        </div>

        {/* Trait Percentage Bars */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
          <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
            Detailed Trait Mastery Breakdown
          </h3>

          <div className="space-y-4">
            {traitBreakdown?.map((t) => (
              <div key={t.key}>
                <div className="flex items-center justify-between text-xs mb-1.5 font-semibold">
                  <span className="text-slate-900 dark:text-slate-200">{t.name}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded-full font-bold ${
                        t.percentage >= 75
                          ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : t.percentage >= 50
                          ? "bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                          : "bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {t.level}
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{t.percentage}%</span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      t.percentage >= 75
                        ? "bg-emerald-600 dark:bg-emerald-500"
                        : t.percentage >= 50
                        ? "bg-blue-600 dark:bg-blue-500"
                        : "bg-amber-500"
                    }`}
                    style={{ width: `${t.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STRENGTHS & DEVELOPMENT AREAS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Strengths */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
          <h3 className="font-display text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" /> Candidate Behavioral Strengths
          </h3>

          <ul className="space-y-3">
            {strengths?.map((s, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                  ✓
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Development Areas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
          <h3 className="font-display text-sm font-bold text-amber-700 dark:text-amber-400 mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Compass size={18} className="text-amber-600 dark:text-amber-400" /> Growth & Development Areas
          </h3>

          <ul className="space-y-3">
            {developmentAreas?.map((a, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                  →
                </span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* WORKPLACE & TEAM DYNAMICS CARDS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm mb-6">
        <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <MessageSquare size={16} className="text-blue-600 dark:text-blue-400" /> Workplace & Team Collaboration Style
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-4">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wide mb-1">Communication Style</div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">{workplaceStyle?.communication}</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-4">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wide mb-1">Stress Composure</div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">{workplaceStyle?.stressResponse}</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-4">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wide mb-1">Decision Making</div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">{workplaceStyle?.decisionMaking}</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-4">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wide mb-1">Ideal Team Role</div>
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 leading-snug">{workplaceStyle?.teamRole}</div>
          </div>
        </div>
      </div>

      {/* RECOMMENDED CAREER PATHS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
          <Briefcase size={16} className="text-blue-600 dark:text-blue-400" /> Recommended Career & Role Alignments
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Based on candidate behavioral trait scores and archetype profiling, the candidate is well suited for:
        </p>

        <div className="flex flex-wrap gap-2.5">
          {careerRecommendations?.map((role, idx) => (
            <span
              key={idx}
              className="bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 dark:border-blue-500/40 text-blue-600 dark:text-blue-400 font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5"
            >
              <Sparkles size={13} /> {role}
            </span>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
