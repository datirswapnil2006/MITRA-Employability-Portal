import SelfTestAttempt from "../models/SelfTestAttempt.js";
import StudentStats from "../models/StudentStats.js";
import BookmarkNote from "../models/BookmarkNote.js";
import Question from "../models/Question.js";
import Test, { CATEGORIES } from "../models/Test.js";
import {
  sampleQuestions,
  evaluateSelfTest,
  updateStudentGamification,
} from "../services/selfTestGenerator.js";
import { computeStudentRecommendations } from "../services/recommendationEngine.js";

// @route GET /api/self-test/topics (student)
export const getSelfTestTopics = async (req, res) => {
  try {
    const stats = await StudentStats.findOne({ student: req.user._id }).lean();
    const topicStatsMap = new Map();
    if (stats && stats.topicStats) {
      stats.topicStats.forEach((ts) => topicStatsMap.set(ts.topic, ts));
    }

    const topicsWithMetrics = CATEGORIES.map((cat) => {
      const metric = topicStatsMap.get(cat) || { totalAttempted: 0, totalCorrect: 0, accuracy: 0 };
      let recommendation = null;
      if (metric.totalAttempted === 0) {
        recommendation = "Not Yet Attempted";
      } else if (metric.accuracy < 60) {
        recommendation = "Weak Topic — Needs Practice";
      } else if (metric.accuracy >= 80) {
        recommendation = "Mastered Topic";
      } else {
        recommendation = "Moderate Confidence";
      }

      return {
        name: cat,
        attempted: metric.totalAttempted,
        correct: metric.totalCorrect,
        accuracy: metric.accuracy,
        recommendation,
      };
    });

    res.json({ topics: topicsWithMetrics });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch self-test topics", error: err.message });
  }
};

// @route POST /api/self-test/generate (student)
export const generateSelfTest = async (req, res) => {
  try {
    const {
      topics = [],
      difficulty = "Mixed",
      questionCount = 10,
      durationMinutes = 15,
      mode = "practice",
      questionType = "Mixed",
      language = "python",
      negativeMarking = false,
      negativeMarkRatio = 0.25,
      shuffleOptions = true,
      prioritizeWrong = false,
    } = req.body;

    const stats = await StudentStats.findOne({ student: req.user._id }).lean();
    const wrongQuestionIds = stats ? stats.wrongQuestionIds : [];

    const selectedQuestions = await sampleQuestions({
      topics,
      difficulty,
      questionCount: Number(questionCount),
      questionType,
      language,
      prioritizeWrong,
      wrongQuestionIds,
    });

    if (selectedQuestions.length === 0) {
      return res.status(404).json({ message: "No questions found matching your selected criteria. Try broadening your topic or difficulty filters." });
    }

    const questionIds = selectedQuestions.map((q) => q._id);

    const attempt = await SelfTestAttempt.create({
      student: req.user._id,
      mode,
      config: {
        topics,
        difficulty,
        questionCount: selectedQuestions.length,
        durationMinutes: Number(durationMinutes),
        questionType,
        language,
        negativeMarking,
        negativeMarkRatio: Number(negativeMarkRatio),
        shuffleOptions,
        prioritizeWrong,
      },
      questions: questionIds,
      answers: [],
      status: "in-progress",
      startedAt: new Date(),
    });

    res.status(201).json({
      attemptId: attempt._id,
      mode: attempt.mode,
      config: attempt.config,
      durationMinutes: attempt.config.durationMinutes,
      questionCount: selectedQuestions.length,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to generate self-test", error: err.message });
  }
};

// @route GET /api/self-test/attempt/:id (student)
export const getSelfTestAttempt = async (req, res) => {
  try {
    const attempt = await SelfTestAttempt.findById(req.params.id)
      .populate({
        path: "questions",
        populate: { path: "test", select: "title category" },
      })
      .lean();

    if (!attempt || String(attempt.student) !== String(req.user._id)) {
      return res.status(404).json({ message: "Self-test attempt not found" });
    }

    // Process questions: hide correct answers if still in-progress in exam mode
    const sanitizedQuestions = attempt.questions.map((q) => {
      if (attempt.status === "in-progress" && attempt.mode === "exam") {
        delete q.correctOptionIndex;
      }
      return q;
    });

    // Check bookmarks for current student
    const bookmarks = await BookmarkNote.find({
      student: req.user._id,
      question: { $in: attempt.questions.map((q) => q._id) },
    }).lean();

    const bookmarkMap = new Map();
    bookmarks.forEach((b) => bookmarkMap.set(String(b.question), b));

    res.json({
      attempt: {
        _id: attempt._id,
        mode: attempt.mode,
        config: attempt.config,
        status: attempt.status,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
        totalScore: attempt.totalScore,
        maxScore: attempt.maxScore,
        percentage: attempt.percentage,
        xpEarned: attempt.xpEarned,
      },
      questions: sanitizedQuestions,
      existingAnswers: attempt.answers || [],
      bookmarks: Array.from(bookmarkMap.entries()).reduce((acc, [qId, b]) => {
        acc[qId] = { isBookmarked: true, note: b.note };
        return acc;
      }, {}),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch attempt", error: err.message });
  }
};

// @route POST /api/self-test/attempt/:id/answer (student)
export const saveSelfTestAnswer = async (req, res) => {
  try {
    const { questionId, selectedOptionIndex, code, language, timeSpentSeconds } = req.body;
    const attempt = await SelfTestAttempt.findById(req.params.id);

    if (!attempt || String(attempt.student) !== String(req.user._id)) {
      return res.status(404).json({ message: "Attempt not found" });
    }

    if (attempt.status !== "in-progress") {
      return res.status(400).json({ message: "Test already submitted" });
    }

    const q = await Question.findById(questionId).lean();
    if (!q) return res.status(404).json({ message: "Question not found" });

    const existingIdx = attempt.answers.findIndex((a) => String(a.question) === String(questionId));

    const patchData = {
      question: q._id,
      type: q.type,
      selectedOptionIndex: selectedOptionIndex !== undefined ? selectedOptionIndex : null,
      code: code || "",
      language: language || q.languages?.[0] || null,
      timeSpentSeconds: timeSpentSeconds || 0,
    };

    if (existingIdx >= 0) {
      attempt.answers[existingIdx] = { ...attempt.answers[existingIdx].toObject(), ...patchData };
    } else {
      attempt.answers.push(patchData);
    }

    await attempt.save();
    res.json({ message: "Answer saved" });
  } catch (err) {
    res.status(500).json({ message: "Failed to save answer", error: err.message });
  }
};

// @route POST /api/self-test/attempt/:id/submit (student)
export const submitSelfTest = async (req, res) => {
  try {
    const attempt = await SelfTestAttempt.findById(req.params.id).populate({
      path: "questions",
      populate: { path: "test", select: "title category" },
    });

    if (!attempt || String(attempt.student) !== String(req.user._id)) {
      return res.status(404).json({ message: "Attempt not found" });
    }

    if (attempt.status === "completed") {
      return res.json({
        message: "Attempt already submitted",
        attempt,
      });
    }

    const rawAnswers = req.body.answers || attempt.answers || [];

    // Evaluate answers
    const evaluation = await evaluateSelfTest(attempt, attempt.questions, rawAnswers);

    attempt.answers = evaluation.processedAnswers;
    attempt.totalScore = evaluation.totalScore;
    attempt.maxScore = evaluation.maxScore;
    attempt.percentage = evaluation.percentage;
    attempt.xpEarned = evaluation.xpEarned;
    attempt.status = "completed";
    attempt.completedAt = new Date();

    await attempt.save();

    // Update Student Gamification & Stats
    const updatedStats = await updateStudentGamification(req.user._id, evaluation, attempt.questions);

    res.json({
      attemptId: attempt._id,
      totalScore: attempt.totalScore,
      maxScore: attempt.maxScore,
      percentage: attempt.percentage,
      xpEarned: attempt.xpEarned,
      newStreak: updatedStats.streak.currentStreak,
      newLevel: updatedStats.level,
      readinessScore: updatedStats.readinessScore,
      unlockedAchievements: updatedStats.achievements,
      answers: attempt.answers,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to submit self-test", error: err.message });
  }
};

// @route GET /api/self-test/dashboard (student)
export const getStudentDashboard = async (req, res) => {
  try {
    let stats = await StudentStats.findOne({ student: req.user._id }).lean();
    if (!stats) {
      stats = await StudentStats.create({ student: req.user._id });
      stats = stats.toObject();
    }

    const [recentAttempts, bookmarksCount, recommendations] = await Promise.all([
      SelfTestAttempt.find({ student: req.user._id, status: "completed" })
        .sort({ completedAt: -1 })
        .limit(10)
        .lean(),
      BookmarkNote.countDocuments({ student: req.user._id }),
      computeStudentRecommendations(req.user._id),
    ]);

    res.json({
      stats: {
        xp: stats.xp,
        level: stats.level,
        readinessScore: recommendations.readinessScore || stats.readinessScore,
        streak: stats.streak,
        achievements: stats.achievements,
        totalSelfTests: stats.totalSelfTests,
        totalQuestionsAttempted: stats.totalQuestionsAttempted,
        totalQuestionsCorrect: stats.totalQuestionsCorrect,
        topicStats: stats.topicStats,
        wrongCount: stats.wrongQuestionIds?.length || 0,
      },
      recommendedTopics: recommendations.weakTopics || [],
      recommendations,
      recentAttempts,
      bookmarksCount,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch student dashboard", error: err.message });
  }
};

// @route POST /api/self-test/bookmark (student)
export const toggleBookmark = async (req, res) => {
  try {
    const { questionId, note } = req.body;
    const existing = await BookmarkNote.findOne({ student: req.user._id, question: questionId });

    if (existing) {
      await BookmarkNote.findByIdAndDelete(existing._id);
      return res.json({ isBookmarked: false, message: "Bookmark removed" });
    } else {
      const newBm = await BookmarkNote.create({
        student: req.user._id,
        question: questionId,
        note: note || "",
      });
      return res.json({ isBookmarked: true, note: newBm.note, message: "Bookmarked successfully" });
    }
  } catch (err) {
    res.status(500).json({ message: "Failed to toggle bookmark", error: err.message });
  }
};

// @route POST /api/self-test/note (student)
export const saveNote = async (req, res) => {
  try {
    const { questionId, note } = req.body;
    let bm = await BookmarkNote.findOne({ student: req.user._id, question: questionId });

    if (bm) {
      bm.note = note;
      await bm.save();
    } else {
      bm = await BookmarkNote.create({
        student: req.user._id,
        question: questionId,
        note,
      });
    }

    res.json({ message: "Note saved", note: bm.note });
  } catch (err) {
    res.status(500).json({ message: "Failed to save note", error: err.message });
  }
};

// @route GET /api/self-test/bookmarks (student) with pagination
export const getBookmarks = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      BookmarkNote.find({ student: req.user._id })
        .populate({
          path: "question",
          populate: { path: "test", select: "title category" },
        })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BookmarkNote.countDocuments({ student: req.user._id }),
    ]);

    res.json({
      bookmarks,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch bookmarks", error: err.message });
  }
};

// @route GET /api/self-test/admin-analytics (admin)
export const getAdminSelfTestAnalytics = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalGenerated,
      completedAttempts,
      totalStudentsPracticing,
      allStats,
      allAttempts,
      activeStudentsRaw,
    ] = await Promise.all([
      SelfTestAttempt.countDocuments({}),
      SelfTestAttempt.find({ status: "completed" }).select("totalScore maxScore percentage xpEarned config questions answers").lean(),
      StudentStats.countDocuments({ totalSelfTests: { $gt: 0 } }),
      StudentStats.find({}).populate("student", "name erpNumber branch").lean(),
      SelfTestAttempt.find({}).select("config status").lean(),
      SelfTestAttempt.distinct("student", { completedAt: { $gte: sevenDaysAgo } }),
    ]);

    const totalCompletedCount = completedAttempts.length;
    const completionRate = totalGenerated > 0 ? Math.round((totalCompletedCount / totalGenerated) * 100) : 0;
    const dailyActiveStudents = activeStudentsRaw.length;

    const avgReadinessScore =
      allStats.length > 0
        ? Math.round(allStats.reduce((sum, s) => sum + (s.readinessScore || 0), 0) / allStats.length)
        : 0;

    const avgScorePercentage =
      totalCompletedCount > 0
        ? Math.round(completedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / totalCompletedCount)
        : 0;

    const totalXP = allStats.reduce((sum, s) => sum + (s.xp || 0), 0);

    // Topic popularity: Count selected topics across all attempts
    const topicPopularityMap = new Map();
    CATEGORIES.forEach((cat) => topicPopularityMap.set(cat, 0));
    allAttempts.forEach((att) => {
      if (att.config && Array.isArray(att.config.topics)) {
        att.config.topics.forEach((top) => {
          topicPopularityMap.set(top, (topicPopularityMap.get(top) || 0) + 1);
        });
      }
    });

    const topicPopularity = [];
    topicPopularityMap.forEach((count, topic) => {
      topicPopularity.push({ topic, count });
    });
    topicPopularity.sort((a, b) => b.count - a.count);

    // Topic performance aggregation across institution
    const topicAggregation = new Map();
    CATEGORIES.forEach((cat) => topicAggregation.set(cat, { totalAttempted: 0, totalCorrect: 0 }));

    allStats.forEach((s) => {
      if (s.topicStats) {
        s.topicStats.forEach((ts) => {
          const curr = topicAggregation.get(ts.topic) || { totalAttempted: 0, totalCorrect: 0 };
          curr.totalAttempted += ts.totalAttempted || 0;
          curr.totalCorrect += ts.totalCorrect || 0;
          topicAggregation.set(ts.topic, curr);
        });
      }
    });

    const topicOverview = [];
    topicAggregation.forEach((val, key) => {
      const accuracy = val.totalAttempted > 0 ? Math.round((val.totalCorrect / val.totalAttempted) * 100) : 0;
      topicOverview.push({
        topic: key,
        totalAttempted: val.totalAttempted,
        totalCorrect: val.totalCorrect,
        accuracy,
      });
    });

    // Weakest Topics (sorted by lowest accuracy)
    const weakestTopics = [...topicOverview].sort((a, b) => a.accuracy - b.accuracy);

    // Question Performance: Calculate accuracy for top attempted questions
    const questionStatsMap = new Map();
    completedAttempts.forEach((att) => {
      if (att.answers) {
        att.answers.forEach((ans) => {
          const qIdStr = String(ans.question);
          const curr = questionStatsMap.get(qIdStr) || { attempted: 0, correct: 0 };
          curr.attempted += 1;
          if (ans.isCorrect) curr.correct += 1;
          questionStatsMap.set(qIdStr, curr);
        });
      }
    });

    const questionIds = Array.from(questionStatsMap.keys());
    const questionDocs = await Question.find({ _id: { $in: questionIds } })
      .populate("test", "category")
      .lean();

    const questionPerformance = questionDocs.map((q) => {
      const stat = questionStatsMap.get(String(q._id)) || { attempted: 0, correct: 0 };
      const accuracy = stat.attempted > 0 ? Math.round((stat.correct / stat.attempted) * 100) : 0;
      return {
        id: q._id,
        text: q.questionText,
        type: q.type,
        category: q.test?.category || "General",
        difficulty: q.difficulty,
        attempted: stat.attempted,
        correct: stat.correct,
        accuracy,
      };
    });

    // Sort questions by lowest accuracy (hardest questions)
    questionPerformance.sort((a, b) => a.accuracy - b.accuracy);

    // Top students by practice XP
    const leaderboard = allStats
      .map((s) => ({
        studentId: s.student?._id,
        name: s.student?.name || "Unknown",
        erpNumber: s.student?.erpNumber || "—",
        branch: s.student?.branch || "—",
        xp: s.xp || 0,
        level: s.level || 1,
        readinessScore: s.readinessScore || 0,
        streak: s.streak?.currentStreak || 0,
        totalSelfTests: s.totalSelfTests || 0,
      }))
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 10);

    res.json({
      totalGenerated,
      totalCompletedCount,
      completionRate,
      dailyActiveStudents,
      avgReadinessScore,
      avgScorePercentage,
      totalStudentsPracticing,
      totalXP,
      topicPopularity,
      topicOverview,
      weakestTopics,
      questionPerformance: questionPerformance.slice(0, 10),
      leaderboard,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch admin self-test analytics", error: err.message });
  }
};
