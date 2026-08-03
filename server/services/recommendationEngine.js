import SelfTestAttempt from "../models/SelfTestAttempt.js";
import StudentStats from "../models/StudentStats.js";
import Question from "../models/Question.js";
import Test, { CATEGORIES } from "../models/Test.js";

/**
 * Computes deep rule-based recommendations & placement readiness metrics for a student.
 */
export const computeStudentRecommendations = async (studentId) => {
  const [stats, recentAttempts] = await Promise.all([
    StudentStats.findOne({ student: studentId }).lean(),
    SelfTestAttempt.find({ student: studentId, status: "completed" })
      .sort({ completedAt: -1 })
      .limit(10)
      .lean(),
  ]);

  if (!stats) {
    return {
      readinessScore: 0,
      readinessTier: { title: "Needs Foundational Practice", color: "rose" },
      accuracyTrend: "no_data", // "improving" | "stagnant" | "declining" | "no_data"
      timePaceIndex: "normal", // "fast" | "normal" | "slow"
      weakTopics: CATEGORIES,
      masteredTopics: [],
      nextBestTest: {
        title: "Quantitative Aptitude Warmup",
        reason: "Start your placement preparation journey with a quick 5-question quantitative warmup.",
        suggestedConfig: {
          topics: ["Quantitative Aptitude"],
          difficulty: "Easy",
          questionCount: 5,
          durationMinutes: 10,
          questionType: "MCQ",
          mode: "practice",
        },
      },
      readinessBreakdown: {
        topicAccuracyFactor: 0,
        timeEfficiencyFactor: 0,
        consistencyFactor: 0,
        difficultyFactor: 0,
      },
    };
  }

  // 1. Analyze Weak Topics (<60% accuracy) & Mastered Topics (>=80%)
  const topicStatsMap = new Map();
  if (stats.topicStats) {
    stats.topicStats.forEach((ts) => topicStatsMap.set(ts.topic, ts));
  }

  const weakTopics = [];
  const masteredTopics = [];
  const unattemptedTopics = [];

  CATEGORIES.forEach((cat) => {
    const ts = topicStatsMap.get(cat);
    if (!ts || ts.totalAttempted === 0) {
      unattemptedTopics.push(cat);
      weakTopics.push(cat);
    } else if (ts.accuracy < 60) {
      weakTopics.push(cat);
    } else if (ts.accuracy >= 80) {
      masteredTopics.push(cat);
    }
  });

  // 2. Accuracy Trend Analysis (Recent 3 vs Overall)
  let accuracyTrend = "no_data";
  if (recentAttempts.length >= 3) {
    const recent3Avg = Math.round(
      recentAttempts.slice(0, 3).reduce((sum, a) => sum + (a.percentage || 0), 0) / 3
    );
    const overallAvg = Math.round(
      recentAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / recentAttempts.length
    );

    if (recent3Avg >= overallAvg + 8) accuracyTrend = "improving";
    else if (recent3Avg <= overallAvg - 8) accuracyTrend = "declining";
    else accuracyTrend = "stagnant";
  }

  // 3. Time Spent & Pace Analysis
  let totalTimeSec = 0;
  let totalAnsweredCount = 0;

  recentAttempts.forEach((att) => {
    if (att.answers) {
      att.answers.forEach((ans) => {
        if (ans.timeSpentSeconds) {
          totalTimeSec += ans.timeSpentSeconds;
          totalAnsweredCount += 1;
        }
      });
    }
  });

  const avgSecPerQuestion = totalAnsweredCount > 0 ? Math.round(totalTimeSec / totalAnsweredCount) : 45;
  let timePaceIndex = "normal";
  if (avgSecPerQuestion < 15) timePaceIndex = "fast";
  else if (avgSecPerQuestion > 90) timePaceIndex = "slow";

  // 4. Rule-Based Placement Readiness Score Calculation (0-100)
  // Weight Breakdown:
  // - 40%: Weighted Topic Accuracy across all categories
  // - 25%: Time Efficiency Factor (target 30-60 sec per Q)
  // - 20%: Gamification & Streak Consistency (capped at 500 XP & 7-day streak)
  // - 15%: Difficulty Mastery Factor (ratio of hard/medium attempts)

  const overallAccuracy =
    stats.totalQuestionsAttempted > 0
      ? Math.round((stats.totalQuestionsCorrect / stats.totalQuestionsAttempted) * 100)
      : 0;

  const topicAccuracyFactor = Math.round(overallAccuracy * 0.4);

  // Time Efficiency: score 100% if avgSecPerQuestion is between 25 and 75 seconds
  let timeFactorRaw = 100;
  if (avgSecPerQuestion < 15) timeFactorRaw = 60; // Too fast, likely guessing
  else if (avgSecPerQuestion > 90) timeFactorRaw = 70; // Too slow
  const timeEfficiencyFactor = Math.round((timeFactorRaw / 100) * 25);

  // Consistency & Streak Factor
  const streakBonus = Math.min(100, ((stats.streak?.currentStreak || 0) / 7) * 50 + Math.min(50, (stats.xp / 500) * 50));
  const consistencyFactor = Math.round((streakBonus / 100) * 20);

  // Difficulty Factor
  const hardAttempts = recentAttempts.filter((a) => a.config?.difficulty === "Hard").length;
  const mediumAttempts = recentAttempts.filter((a) => a.config?.difficulty === "Medium").length;
  const diffScore = Math.min(100, (hardAttempts * 30 + mediumAttempts * 15 + recentAttempts.length * 5));
  const difficultyFactor = Math.round((diffScore / 100) * 15);

  const readinessScore = Math.min(100, topicAccuracyFactor + timeEfficiencyFactor + consistencyFactor + difficultyFactor);

  // Determine Placement Readiness Tier
  let readinessTier = { title: "Needs Foundational Practice", level: "Tier 4", color: "rose" };
  if (readinessScore >= 85) {
    readinessTier = { title: "High Placement Ready (Tier 1 Product Companies)", level: "Tier 1", color: "emerald" };
  } else if (readinessScore >= 70) {
    readinessTier = { title: "Placement Ready (IT Services & Mid-Size Firms)", level: "Tier 2", color: "indigo" };
  } else if (readinessScore >= 50) {
    readinessTier = { title: "Moderate Readiness (Target Weak Topics)", level: "Tier 3", color: "amber" };
  }

  // 5. Compute "Next Best Test" Recommendation
  let targetTopic = weakTopics[0] || CATEGORIES[0];
  let recommendedDifficulty = "Medium";
  let recommendedType = "Mixed";
  let reason = "";

  if (overallAccuracy >= 80) {
    recommendedDifficulty = "Hard";
    reason = `Your accuracy is high (${overallAccuracy}%). We recommend a Hard difficulty test in ${targetTopic} to challenge your problem-solving under time pressure.`;
  } else if (weakTopics.length > 0) {
    recommendedDifficulty = "Medium";
    reason = `Based on your recent accuracy, ${targetTopic} needs reinforcement. Practice 10 targeted questions to raise your topic confidence.`;
  } else if (unattemptedTopics.length > 0) {
    targetTopic = unattemptedTopics[0];
    recommendedDifficulty = "Easy";
    reason = `You haven't attempted ${targetTopic} yet. Take a quick introductory practice session to establish your baseline score.`;
  } else {
    reason = `Maintain your daily streak with a 15-minute mixed practice test to keep your placement readiness index above ${readinessScore}%.`;
  }

  const nextBestTest = {
    title: `Next Best Test: ${targetTopic}`,
    reason,
    suggestedConfig: {
      topics: [targetTopic],
      difficulty: recommendedDifficulty,
      questionCount: 10,
      durationMinutes: 15,
      questionType: recommendedType,
      mode: "practice",
    },
  };

  return {
    readinessScore,
    readinessTier,
    accuracyTrend,
    timePaceIndex,
    avgSecPerQuestion,
    weakTopics,
    masteredTopics,
    nextBestTest,
    readinessBreakdown: {
      topicAccuracyFactor,
      timeEfficiencyFactor,
      consistencyFactor,
      difficultyFactor,
    },
  };
};
