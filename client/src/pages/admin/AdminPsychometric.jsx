import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import PsychometricWizardModal from "../../components/admin/PsychometricWizardModal";
import TraitLibraryView from "../../components/admin/TraitLibraryView";
import PsychometricQuestionBankView from "../../components/admin/PsychometricQuestionBankView";
import AIPromptTemplatesView from "../../components/admin/AIPromptTemplatesView";
import PsychometricRadarChart from "../../components/psychometric/PsychometricRadarChart";
import {
  listPsychometric,
  togglePsychometric,
  deletePsychometric,
  getPsychometricAdminAnalytics,
} from "../../api/admin";
import { getPsychometricAttemptAnalysis } from "../../api/student";
import { exportPsychometricCSV } from "../../utils/psychometricCsvExport";
import { downloadPsychometricPDF } from "../../utils/psychometricReportPdf";
import { ADMIN_LINKS } from "./adminLinks";
import {
  Brain,
  Plus,
  Search,
  FileText,
  Trash2,
  Edit3,
  Clock,
  Layers,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Download,
  Eye,
  Award,
  Filter,
  Sliders,
  HelpCircle,
} from "lucide-react";

const navigateAdmin = (navigate) => (k) => {
  if (k === "overview") navigate("/admin");
  else if (k === "tests") navigate("/admin/tests");
  else navigate(`/admin/${k}`);
};

const CATEGORIES = [
  "Personality Traits",
  "Emotional Intelligence",
  "Behavioral Assessment",
  "Workplace Styles",
  "Leadership Potential",
  "Situational Judgment",
];

const BRANCHES = [
  "All Branches",
  "Computer Engineering",
  "Information Technology",
  "Electronics & Telecom",
  "Mechanical Engineering",
  "Civil Engineering",
];

const stampBtn = "bg-accent text-white rounded-xl px-4.5 py-2.5 font-bold text-xs hover:bg-accent-hover transition-colors flex items-center gap-1.5 shadow-sm";
const dangerBtn = "border border-danger/40 text-danger rounded-xl px-3 py-1.5 font-semibold text-xs hover:bg-danger/10 transition-colors flex items-center gap-1";

export default function AdminPsychometric() {
  const navigate = useNavigate();

  // Top Page View: "manage" | "traits" | "question_bank" | "prompt_templates" | "analytics"
  const [activeView, setActiveView] = useState("manage");

  // Assessments & Filters
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Analytics View State
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState("All Branches");
  const [selectedTestFilter, setSelectedTestFilter] = useState("");
  const [viewingDossierAnalysis, setViewingDossierAnalysis] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await listPsychometric({
        search,
        category: categoryFilter,
        status: statusFilter,
      });
      setTests(data);
    } catch (err) {
      setError("Failed to load psychometric assessments");
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const data = await getPsychometricAdminAnalytics({
        branch: selectedBranchFilter === "All Branches" ? "" : selectedBranchFilter,
        testId: selectedTestFilter,
      });
      setAnalytics(data);
    } catch (err) {
      setError("Failed to load admin psychometric analytics");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (activeView === "manage") loadData();
    else if (activeView === "analytics") loadAnalytics();
  }, [activeView, search, categoryFilter, statusFilter, selectedBranchFilter, selectedTestFilter]);

  const handleOpenCreateWizard = () => {
    setEditingAssessment(null);
    setShowWizardModal(true);
  };

  const handleOpenEditWizard = (item) => {
    setEditingAssessment(item);
    setShowWizardModal(true);
  };

  const handleToggleStatus = async (id) => {
    try {
      const updated = await togglePsychometric(id);
      setTests((prev) => prev.map((x) => (x._id === id ? updated : x)));
      setSuccessMsg(`Status updated to ${updated.status.toUpperCase()}`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      alert(err.response?.data?.message || "Could not publish assessment");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this psychometric assessment?")) return;
    try {
      await deletePsychometric(id);
      setTests((prev) => prev.filter((x) => x._id !== id));
      setSuccessMsg("Assessment deleted successfully");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete assessment");
    }
  };

  const handleViewDossier = async (attemptId) => {
    try {
      const data = await getPsychometricAttemptAnalysis(attemptId);
      setViewingDossierAnalysis(data);
    } catch (err) {
      alert("Failed to load candidate dossier");
    }
  };

  return (
    <DashboardLayout active="psychometric" links={ADMIN_LINKS} onNavigate={navigateAdmin(navigate)}>
      {/* Top Header & Page Navigation Tabs */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Brain size={26} className="text-accent" />
            <h1 className="font-display text-[26px] font-bold">Psychometric & Behavioral Management</h1>
          </div>
          <p className="text-ink-soft text-[13.5px]">
            Build AI-powered assessments, curate reusable trait libraries & question banks, and analyze campus behavioral profiles.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-line shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveView("manage")}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === "manage" ? "bg-white text-accent shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            <Layers size={14} /> Assessments
          </button>

          <button
            onClick={() => setActiveView("traits")}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === "traits" ? "bg-white text-accent shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            <Sliders size={14} /> Trait Library
          </button>

          <button
            onClick={() => setActiveView("question_bank")}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === "question_bank" ? "bg-white text-accent shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            <HelpCircle size={14} /> Question Bank
          </button>

          <button
            onClick={() => setActiveView("prompt_templates")}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === "prompt_templates" ? "bg-white text-accent shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            <Sparkles size={14} /> Prompt Templates
          </button>

          <button
            onClick={() => setActiveView("analytics")}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === "analytics" ? "bg-white text-accent shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            <BarChart3 size={14} /> Institutional Analytics
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="bg-success/10 border border-success/30 text-success text-[13.5px] px-4 py-3 rounded-xl mb-6 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* ========================================== */}
      {/* MODULE 1: ASSESSMENT CREATION & MANAGEMENT */}
      {/* ========================================== */}
      {activeView === "manage" && (
        <div>
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="text-xs font-semibold text-ink-soft uppercase tracking-wide">
              Registered Psychometric Assessments ({tests.length})
            </div>
            <button className={stampBtn} onClick={handleOpenCreateWizard}>
              <Plus size={16} /> Launch Assessment Wizard
            </button>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap gap-3 mb-6 bg-white border border-line rounded-2xl p-3.5 shadow-sm">
            <div className="flex-1 min-w-[200px] relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                className="w-full pl-9 pr-3 py-2 border border-line rounded-xl text-xs outline-none focus:border-accent"
                placeholder="Search by assessment title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border border-line rounded-xl text-xs bg-white outline-none focus:border-accent min-w-[170px]"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 border border-line rounded-xl text-xs bg-white outline-none focus:border-accent min-w-[140px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="published">Enabled</option>
              <option value="draft">Disabled</option>
            </select>
          </div>

          {/* Assessment Cards Grid */}
          {loading ? (
            <div className="bg-white border border-line rounded-2xl p-12 text-center">
              <div className="w-7 h-7 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-ink-soft text-xs">Loading psychometric assessments...</p>
            </div>
          ) : tests.length === 0 ? (
            <div className="bg-white border border-line rounded-2xl text-center py-14 p-6">
              <Brain size={40} className="mx-auto text-ink-soft/40 mb-3" />
              <h3 className="font-display text-lg font-bold text-ink mb-1">No Psychometric Assessments Found</h3>
              <p className="text-ink-soft text-xs max-w-md mx-auto mb-5">
                Create your first assessment to evaluate personality traits, behavioral competencies, and workplace styles.
              </p>
              <button className={stampBtn + " mx-auto"} onClick={handleOpenCreateWizard}>
                <Plus size={16} /> Launch Assessment Wizard
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tests.map((item) => {
                const isPub = item.status === "published" || item.isEnabled;
                const qCount = item.questions?.length || 0;
                const tCount = item.traits?.length || 0;

                return (
                  <div
                    key={item._id}
                    className="bg-white border border-line rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-all duration-200 group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-mono text-[11px] uppercase tracking-wide font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 font-mono text-[10px] tracking-wide uppercase px-2.5 py-0.5 rounded-full font-bold ${
                            isPub ? "bg-success/10 text-success" : "bg-ink-soft/10 text-ink-soft"
                          }`}
                        >
                          <span className="text-[6px]">●</span>
                          {isPub ? "Enabled" : "Disabled"}
                        </span>
                      </div>

                      <h3 className="font-display text-[17px] font-bold text-ink mb-1.5 group-hover:text-accent transition-colors">
                        {item.title}
                      </h3>

                      {item.description && (
                        <p className="text-[13px] text-ink-soft mb-3 line-clamp-2">{item.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-[12px] text-ink-soft mb-4 pt-2 border-t border-line">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock size={13} /> {item.durationMinutes || 15} mins
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <FileText size={13} /> {qCount} Questions
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <Layers size={13} /> {tCount} Traits
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-line flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(item._id)}
                          title={isPub ? "Disable Assessment" : "Enable Assessment"}
                          className={`relative w-[42px] h-6 rounded-full shrink-0 transition-colors ${
                            isPub ? "bg-success" : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${
                              isPub ? "translate-x-[18px]" : ""
                            }`}
                          />
                        </button>
                        <span className="text-[11px] font-semibold text-ink-soft">
                          {isPub ? "Enabled" : "Disabled"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 border border-line rounded-xl hover:border-accent text-ink hover:text-accent transition-colors"
                          onClick={() => handleOpenEditWizard(item)}
                          title="Edit Assessment & Questions"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          className={dangerBtn}
                          onClick={() => handleDelete(item._id)}
                          title="Delete Assessment"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* MODULE 2: CENTRAL TRAIT LIBRARY           */}
      {/* ========================================== */}
      {activeView === "traits" && <TraitLibraryView />}

      {/* ========================================== */}
      {/* MODULE 3: PSYCHOMETRIC QUESTION BANK       */}
      {/* ========================================== */}
      {activeView === "question_bank" && <PsychometricQuestionBankView />}

      {/* ========================================== */}
      {/* MODULE 4: AI PROMPT TEMPLATES              */}
      {/* ========================================== */}
      {activeView === "prompt_templates" && <AIPromptTemplatesView />}

      {/* ========================================== */}
      {/* MODULE 5: INSTITUTIONAL ANALYTICS & REPORTS*/}
      {/* ========================================== */}
      {activeView === "analytics" && (
        <div className="space-y-6">
          {analyticsLoading ? (
            <div className="bg-white border border-line rounded-2xl p-12 text-center">
              <div className="w-8 h-8 border-3 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-ink-soft">Aggregating campus psychometric analytics...</p>
            </div>
          ) : !analytics ? (
            <div className="bg-white border border-line rounded-2xl p-8 text-center text-xs text-ink-soft">
              No analytics data available.
            </div>
          ) : (
            <>
              {/* KPI Metrics Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-line rounded-2xl p-5 shadow-sm">
                  <div className="text-[11px] font-bold text-ink-soft uppercase tracking-wide mb-1">Total Assessments</div>
                  <div className="font-display text-2xl font-extrabold text-ink">{analytics.summary?.totalAssessments || 0}</div>
                  <div className="text-[11px] text-success font-semibold mt-1">{analytics.summary?.totalPublished || 0} Published Active</div>
                </div>

                <div className="bg-white border border-line rounded-2xl p-5 shadow-sm">
                  <div className="text-[11px] font-bold text-ink-soft uppercase tracking-wide mb-1">Completed Attempts</div>
                  <div className="font-display text-2xl font-extrabold text-accent">{analytics.summary?.totalCompletedAttempts || 0}</div>
                  <div className="text-[11px] text-ink-soft font-semibold mt-1">Submitted sessions</div>
                </div>

                <div className="bg-white border border-line rounded-2xl p-5 shadow-sm">
                  <div className="text-[11px] font-bold text-ink-soft uppercase tracking-wide mb-1">Tested Candidates</div>
                  <div className="font-display text-2xl font-extrabold text-emerald-600">{analytics.summary?.uniqueStudentsCount || 0}</div>
                  <div className="text-[11px] text-ink-soft font-semibold mt-1">Unique participating students</div>
                </div>

                <div className="bg-white border border-line rounded-2xl p-5 shadow-sm">
                  <div className="text-[11px] font-bold text-ink-soft uppercase tracking-wide mb-1">Data Export</div>
                  <button
                    onClick={() => exportPsychometricCSV(analytics.attemptLogs)}
                    className="w-full bg-accent text-white rounded-xl py-2 font-bold text-xs hover:bg-accent-hover transition-colors flex items-center justify-center gap-1.5 shadow-sm mt-1"
                  >
                    <Download size={14} /> Export CSV Report
                  </button>
                </div>
              </div>

              {/* Analytics Filters */}
              <div className="bg-white border border-line rounded-2xl p-4 flex flex-wrap gap-4 items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-accent" />
                  <span className="font-bold text-xs text-ink">Institutional Filters:</span>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    className="px-3 py-2 border border-line rounded-xl text-xs bg-white font-semibold outline-none focus:border-accent"
                    value={selectedBranchFilter}
                    onChange={(e) => setSelectedBranchFilter(e.target.value)}
                  >
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>

                  <select
                    className="px-3 py-2 border border-line rounded-xl text-xs bg-white font-semibold outline-none focus:border-accent max-w-xs"
                    value={selectedTestFilter}
                    onChange={(e) => setSelectedTestFilter(e.target.value)}
                  >
                    <option value="">All Assessments</option>
                    {tests.map((t) => (
                      <option key={t._id} value={t._id}>{t.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CAMPUS ARCHETYPE DISTRIBUTION GRID */}
              <div className="bg-white border border-line rounded-2xl p-6 shadow-sm">
                <h3 className="font-display text-sm font-bold text-ink mb-1 flex items-center gap-2">
                  <Sparkles size={16} className="text-accent" /> Campus Personality Archetype Distribution
                </h3>
                <p className="text-xs text-ink-soft mb-4">
                  Breakdown of candidate behavioral profiles evaluated across participating departments.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {analytics.archetypeDistribution?.map((item) => (
                    <div key={item.archetype} className="bg-slate-50 border border-line rounded-xl p-4 text-center">
                      <Award size={22} className="mx-auto text-accent mb-1.5" />
                      <div className="font-bold text-xs text-ink mb-1 truncate">{item.archetype}</div>
                      <div className="font-display font-extrabold text-lg text-accent">{item.percentage}%</div>
                      <div className="text-[10px] text-ink-soft font-semibold">{item.count} Candidates</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DEPARTMENT TRAIT SCORE AVERAGE TABLE */}
              <div className="bg-white border border-line rounded-2xl p-6 shadow-sm">
                <h3 className="font-display text-sm font-bold text-ink mb-1">
                  Department-Wise Trait Average Comparisons
                </h3>
                <p className="text-xs text-ink-soft mb-4">
                  Average normalized trait percentages (0-100%) grouped by academic branch.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-line bg-slate-50 text-ink-soft font-bold uppercase text-[10px]">
                        <th className="p-3">Department / Branch</th>
                        <th className="p-3">Candidates</th>
                        <th className="p-3">Openness</th>
                        <th className="p-3">Conscientiousness</th>
                        <th className="p-3">Extraversion</th>
                        <th className="p-3">Agreeableness</th>
                        <th className="p-3">Emotional Stability</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.departmentTraitAnalytics?.map((dept) => {
                        const traitLookup = {};
                        dept.traitAverages.forEach((t) => {
                          traitLookup[t.key] = t.averagePercentage;
                        });

                        return (
                          <tr key={dept.branch} className="border-b border-line hover:bg-slate-50">
                            <td className="p-3 font-bold text-ink">{dept.branch}</td>
                            <td className="p-3 font-mono font-semibold text-accent">{dept.candidateCount}</td>
                            <td className="p-3 font-mono">{traitLookup.openness !== undefined ? `${traitLookup.openness}%` : "—"}</td>
                            <td className="p-3 font-mono">{traitLookup.conscientiousness !== undefined ? `${traitLookup.conscientiousness}%` : "—"}</td>
                            <td className="p-3 font-mono">{traitLookup.extraversion !== undefined ? `${traitLookup.extraversion}%` : "—"}</td>
                            <td className="p-3 font-mono">{traitLookup.agreeableness !== undefined ? `${traitLookup.agreeableness}%` : "—"}</td>
                            <td className="p-3 font-mono">{traitLookup.emotional_stability !== undefined ? `${traitLookup.emotional_stability}%` : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CANDIDATE ATTEMPT AUDIT TABLE */}
              <div className="bg-white border border-line rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-display text-sm font-bold text-ink">Candidate Attempt Audit Logs</h3>
                    <p className="text-xs text-ink-soft">Recent completed candidate assessment sessions.</p>
                  </div>

                  <button
                    onClick={() => exportPsychometricCSV(analytics.attemptLogs)}
                    className="border border-line hover:border-accent text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1"
                  >
                    <Download size={13} /> Export CSV
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-line bg-slate-50 text-ink-soft font-bold uppercase text-[10px]">
                        <th className="p-3">Candidate</th>
                        <th className="p-3">ERP / Branch</th>
                        <th className="p-3">Assessment Title</th>
                        <th className="p-3">Primary Archetype</th>
                        <th className="p-3">Completion Date</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.attemptLogs?.map((log) => (
                        <tr key={log.attemptId} className="border-b border-line hover:bg-slate-50">
                          <td className="p-3 font-bold text-ink">{log.studentName}</td>
                          <td className="p-3 text-ink-soft">
                            <span className="font-mono">{log.erpNumber}</span> · {log.branch}
                          </td>
                          <td className="p-3 font-medium text-ink truncate max-w-xs">{log.testTitle}</td>
                          <td className="p-3">
                            <span className="font-mono text-[10px] uppercase font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">
                              {log.archetype}
                            </span>
                          </td>
                          <td className="p-3 text-ink-soft font-mono text-[11px]">
                            {log.completedAt ? new Date(log.completedAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleViewDossier(log.attemptId)}
                              className="text-xs font-bold text-accent hover:underline flex items-center gap-1 ml-auto"
                            >
                              <Eye size={13} /> View Dossier
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* 5-STEP AI ASSESSMENT WIZARD MODAL */}
      <PsychometricWizardModal
        isOpen={showWizardModal}
        onClose={() => setShowWizardModal(false)}
        initialData={editingAssessment}
        onSaved={loadData}
        onSwitchToTraitLibrary={() => {
          setShowWizardModal(false);
          setActiveView("traits");
        }}
      />

      {/* CANDIDATE DOSSIER INSPECTION MODAL */}
      {viewingDossierAnalysis && (
        <div
          className="fixed inset-0 bg-desk/60 flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={() => setViewingDossierAnalysis(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setViewingDossierAnalysis(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-ink-soft hover:bg-slate-100"
            >
              <FileText size={18} />
            </button>

            <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">
                  Candidate Dossier Inspection
                </span>
                <h2 className="font-display text-xl font-bold text-ink mt-1">
                  {viewingDossierAnalysis.student?.name}
                </h2>
                <p className="text-xs text-ink-soft">
                  ERP: {viewingDossierAnalysis.student?.erpNumber} · {viewingDossierAnalysis.student?.branch}
                </p>
              </div>

              <button
                onClick={() => downloadPsychometricPDF(viewingDossierAnalysis)}
                className="bg-accent text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0"
              >
                <Download size={14} /> Export PDF
              </button>
            </div>

            {/* Trait Radar */}
            <div className="bg-slate-50 border border-line rounded-xl p-4 mb-4 flex items-center justify-center">
              <PsychometricRadarChart data={viewingDossierAnalysis.traitBreakdown} size={260} />
            </div>

            {/* Archetype */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
              <div className="text-[10px] font-bold uppercase text-accent">Behavioral Archetype</div>
              <div className="font-display text-lg font-bold text-indigo-900">
                {viewingDossierAnalysis.personalityProfile?.archetype}
              </div>
              <div className="text-xs text-indigo-700 font-semibold mb-1">
                "{viewingDossierAnalysis.personalityProfile?.tagline}"
              </div>
              <div className="text-xs text-slate-700">
                {viewingDossierAnalysis.personalityProfile?.description}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </DashboardLayout>
  );
}
