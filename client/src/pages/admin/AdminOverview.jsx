import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { getOverview } from "../../api/tests";
import { ADMIN_LINKS } from "./adminLinks";
import {
  Users, ClipboardList, CheckCircle, BarChart3,
  TrendingUp, Clock, ArrowRight, UserPlus, FileText,
} from "lucide-react";

import { PageSkeleton } from "../../components/common/SkeletonLoader";

const navigateAdmin = (navigate) => (k) => {
  if (k === "overview") navigate("/admin");
  else if (k === "tests") navigate("/admin/tests");
  else navigate(`/admin/${k}`);
};

export default function AdminOverview() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOverview()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const statCards = data
    ? [
        {
          label: "Total Students",
          value: data.totalStudents,
          icon: Users,
          color: "from-blue-500 to-blue-600",
          shadow: "shadow-blue-500/25",
        },
        {
          label: "Total Tests",
          value: data.totalTests,
          icon: ClipboardList,
          color: "from-violet-500 to-violet-600",
          shadow: "shadow-violet-500/25",
        },
        {
          label: "Active Tests",
          value: data.activeTests,
          icon: CheckCircle,
          color: "from-emerald-500 to-emerald-600",
          shadow: "shadow-emerald-500/25",
        },
        {
          label: "Submissions",
          value: data.totalAttempts,
          icon: FileText,
          color: "from-amber-500 to-amber-600",
          shadow: "shadow-amber-500/25",
        },
        {
          label: "Avg. Score",
          value: data.averagePercent !== null ? `${data.averagePercent}%` : "—",
          icon: TrendingUp,
          color: "from-cyan-500 to-cyan-600",
          shadow: "shadow-cyan-500/25",
        },
        {
          label: "Active Students",
          value: data.totalStudents,
          icon: Users,
          color: "from-emerald-500 to-emerald-600",
          shadow: "shadow-emerald-500/25",
        },
      ]
    : [];

  const quickActions = [
    { label: "Create Placement Test", target: "official-placement-test", icon: ClipboardList },
    { label: "View Results", target: "results", icon: BarChart3 },
    { label: "Student Management", target: "students", icon: Users },
  ];


  return (
    <DashboardLayout active="overview" links={ADMIN_LINKS} onNavigate={navigateAdmin(navigate)}>
      <div className="mb-8">
        <h1 className="font-display text-2xl lg:text-3xl font-bold mb-1 text-slate-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Welcome back! Here's an overview of your placement assessment platform.
        </p>
      </div>

      {loading ? (
        <PageSkeleton />
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 mb-8">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="bg-white border border-line rounded-xl p-5 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-soft">
                      {card.label}
                    </span>
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${card.color} ${card.shadow} shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon size={16} className="text-white" />
                    </div>
                  </div>
                  <div className="font-display text-[30px] font-bold text-ink leading-none">
                    {card.value}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="font-display text-lg font-semibold mb-3">Quick Actions</h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => navigateAdmin(navigate)(action.target)}
                    className="flex items-center gap-3 bg-white border border-line rounded-xl px-5 py-4 hover:border-accent hover:shadow-md transition-all duration-200 group text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <Icon size={18} className="text-accent" />
                    </div>
                    <span className="text-[13.5px] font-semibold text-ink flex-1">{action.label}</span>
                    <ArrowRight size={16} className="text-ink-soft group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Registrations */}
            <div className="bg-white border border-line rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-line">
                <h3 className="font-display text-[15px] font-semibold">Recent Registrations</h3>
                <button
                  onClick={() => navigateAdmin(navigate)("registrations")}
                  className="text-accent text-[12px] font-semibold hover:underline flex items-center gap-1"
                >
                  View all <ArrowRight size={12} />
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {data.recentStudents && data.recentStudents.length > 0 ? (
                  data.recentStudents.map((s) => (
                    <div key={s._id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {s.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-ink truncate">{s.name}</div>
                        <div className="text-[11px] text-ink-soft">{s.branch} · {s.erpNumber}</div>
                      </div>
                      <span className={`text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        s.status === "approved" ? "bg-success/10 text-success" :
                        s.status === "pending" ? "bg-amber-100 text-amber-700" :
                        "bg-danger/10 text-danger"
                      }`}>
                        {s.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-8 text-center text-ink-soft text-[13px]">No registrations yet</div>
                )}
              </div>
            </div>

            {/* Recent Submissions */}
            <div className="bg-white border border-line rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-line">
                <h3 className="font-display text-[15px] font-semibold">Recent Submissions</h3>
                <button
                  onClick={() => navigateAdmin(navigate)("results")}
                  className="text-accent text-[12px] font-semibold hover:underline flex items-center gap-1"
                >
                  View all <ArrowRight size={12} />
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {data.recentAttempts && data.recentAttempts.length > 0 ? (
                  data.recentAttempts.map((a) => (
                    <div key={a._id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        <Clock size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-ink truncate">
                          {a.student?.name || "Unknown"}
                        </div>
                        <div className="text-[11px] text-ink-soft">{a.test?.title || "—"}</div>
                      </div>
                      <span className="text-[12px] font-semibold text-ink">
                        {a.totalScore}/{a.maxScore}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-8 text-center text-ink-soft text-[13px]">No submissions yet</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
