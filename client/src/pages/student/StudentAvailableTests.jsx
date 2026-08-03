import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { getEnabledTests } from "../../api/tests";
import { getMyAttempts } from "../../api/student";
import { STUDENT_LINKS } from "./studentLinks";
import { ClipboardList, Clock, Award, CheckCircle2, ArrowRight } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";
import { CardSkeleton } from "../../components/common/SkeletonLoader";

export default function StudentAvailableTests() {
  const [tests, setTests] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getEnabledTests(), getMyAttempts()])
      .then(([t, a]) => {
        setTests(t.filter((x) => !x.isPractice));
        setAttempts(a);
      })
      .finally(() => setLoading(false));
  }, []);

  const getAttemptForTest = (testId) => attempts.find((a) => String(a.test?._id || a.test) === String(testId));

  return (
    <DashboardLayout
      active="tests"
      links={STUDENT_LINKS}
      onNavigate={(k) => navigate(k === "tests" ? "/student" : `/student/${k}`)}
    >
      <div className="mb-7">
        <div className="flex items-center gap-2.5 mb-1">
          <ClipboardList size={24} className="text-blue-600 dark:text-blue-400" />
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">Available Tests</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Assessments enabled by the placement cell. Each test can be attempted according to assessment policy.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <CardSkeleton count={3} />
        </div>
      ) : tests.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No Active Placement Tests"
          description="There are no scheduled assessments available for your branch/year right now. Check back soon!"
        />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
          {tests.map((t) => {
            const attempt = getAttemptForTest(t._id);
            const isCompleted = attempt && attempt.status === "submitted";

            return (
              <div
                key={t._id}
                className="bg-white border border-line rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition-all duration-200 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[11px] tracking-wide uppercase text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded">
                      {t.category}
                    </span>
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={12} /> Completed
                      </span>
                    )}
                  </div>

                  <h3 className="font-display text-[17px] font-bold text-ink mb-1 group-hover:text-accent transition-colors">
                    {t.title}
                  </h3>
                  {t.description && (
                    <p className="text-[13px] text-ink-soft mb-3 line-clamp-2">{t.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-[12.5px] text-ink-soft mb-4">
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> {t.durationMinutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Award size={14} /> {t.totalMarks} marks
                    </span>
                  </div>
                </div>

                {isCompleted ? (
                  <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-ink-soft">Your Score</div>
                      <div className="text-[15px] font-bold text-ink">
                        {attempt.totalScore} / {attempt.maxScore}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/student/result/${attempt._id}`)}
                      className="text-accent text-[12.5px] font-semibold flex items-center gap-1 hover:underline"
                    >
                      View Analysis <ArrowRight size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    className="w-full bg-accent text-white rounded-lg px-4.5 py-2.5 font-semibold text-[13.5px] hover:bg-accent-hover transition-colors shadow-sm"
                    onClick={() => navigate(`/student/attempt/${t._id}`)}
                  >
                    Start Test
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
