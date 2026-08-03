import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { getEnabledTests } from "../../api/tests";
import { getMyAttempts } from "../../api/student";
import { STUDENT_LINKS } from "./studentLinks";
import { Dumbbell, Clock, Award, RotateCcw, Play } from "lucide-react";

export default function StudentTopicPractice() {
  const [practiceTests, setPracticeTests] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getEnabledTests(), getMyAttempts()])
      .then(([t, a]) => {
        setPracticeTests(t.filter((x) => x.isPractice));
        setAttempts(a);
      })
      .finally(() => setLoading(false));
  }, []);

  const getAttemptsForTest = (testId) =>
    attempts.filter((a) => String(a.test?._id || a.test) === String(testId) && a.status === "submitted");

  return (
    <DashboardLayout
      active="practice"
      links={STUDENT_LINKS}
      onNavigate={(k) => navigate(k === "tests" ? "/student" : `/student/${k}`)}
    >
      <div className="mb-7">
        <div className="flex items-center gap-2.5 mb-1">
          <Dumbbell size={24} className="text-accent" />
          <h1 className="font-display text-[26px] font-bold">Topic-wise Practice</h1>
        </div>
        <p className="text-ink-soft text-[13.5px]">
          Sharpen your skills with unlimited practice sets across different core placement topics.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4.5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-line rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-24 mb-3" />
              <div className="h-6 bg-slate-200 rounded w-48 mb-3" />
              <div className="h-10 bg-slate-200 rounded w-full mt-4" />
            </div>
          ))}
        </div>
      ) : practiceTests.length === 0 ? (
        <div className="bg-white border border-line rounded-xl text-center py-12 text-ink-soft">
          <Dumbbell size={36} className="mx-auto text-ink-soft/40 mb-3" />
          <p className="text-[14px]">No practice modules currently published. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
          {practiceTests.map((t) => {
            const pastAttempts = getAttemptsForTest(t._id);
            const bestScore = pastAttempts.length > 0
              ? Math.max(...pastAttempts.map((a) => a.totalScore))
              : null;

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
                    <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 font-semibold px-2 py-0.5 rounded">
                      Retakes Allowed
                    </span>
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

                <div className="pt-3 border-t border-line">
                  {pastAttempts.length > 0 && (
                    <div className="flex items-center justify-between text-[12px] text-ink-soft mb-3">
                      <span>Attempts: <strong>{pastAttempts.length}</strong></span>
                      <span>Best Score: <strong className="text-accent">{bestScore} / {t.totalMarks}</strong></span>
                    </div>
                  )}
                  <button
                    className="w-full bg-accent text-white rounded-lg px-4.5 py-2.5 font-semibold text-[13.5px] hover:bg-accent-hover transition-colors flex items-center justify-center gap-2"
                    onClick={() => navigate(`/student/attempt/${t._id}`)}
                  >
                    {pastAttempts.length > 0 ? (
                      <>
                        <RotateCcw size={15} /> Practice Again
                      </>
                    ) : (
                      <>
                        <Play size={15} /> Start Practice
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
