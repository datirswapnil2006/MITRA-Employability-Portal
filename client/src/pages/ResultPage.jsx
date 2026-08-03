import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { getAttempt } from "../api/tests";

export default function ResultPage() {
  const { attemptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(location.state || null);
  const [loading, setLoading] = useState(!location.state);

  useEffect(() => {
    if (attempt) return;
    getAttempt(attemptId).then(setAttempt).finally(() => setLoading(false));
  }, [attemptId, attempt]);

  if (loading) return <div className="p-16">Loading result…</div>;

  const percent = attempt.maxScore ? Math.round((attempt.totalScore / attempt.maxScore) * 100) : 0;
  const isFlagged = attempt.flagged || attempt.autoSubmitted;
  const reasonText = attempt.flagReason || attempt.reason;

  return (
    <div className="min-h-screen bg-surface text-ink">
      <div className="text-center py-12 px-5">
        {isFlagged && (
          <div className="max-w-lg mx-auto mb-8 bg-danger/10 border border-danger/30 text-danger text-sm rounded px-5 py-4 text-left">
            <strong className="block mb-1">Flagged for review</strong>
            This test was automatically submitted due to a suspected test-integrity violation.
            {reasonText && <span className="block mt-1 text-danger/80">{reasonText}</span>}
          </div>
        )}
        <div className="font-mono text-xs uppercase tracking-wide text-ink-soft">Test Submitted</div>
        <div className="font-display text-[56px] font-bold text-accent">{attempt.totalScore} / {attempt.maxScore}</div>
        <p className="text-ink-soft">You scored {percent}%.</p>
        <button
          className="bg-accent text-white rounded px-4.5 py-2.5 font-semibold text-[13.5px] hover:bg-accent-hover transition-colors"
          onClick={() => navigate("/student")}
        >
          Back to dashboard
        </button>
      </div>
    </div>
  );
}
