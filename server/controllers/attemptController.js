import Attempt from "../models/Attempt.js";
import Test from "../models/Test.js";
import Question from "../models/Question.js";
import { runAgainstTestCases } from "../services/codeRunner.js";

const sanitizeQuestion = (q) => ({
  _id: q._id,
  type: q.type,
  questionText: q.questionText,
  marks: q.marks,
  difficulty: q.difficulty,
  options: q.type === "mcq" ? q.options : undefined,
  languages: q.type === "coding" ? q.languages : undefined,
  sampleTestCases: q.type === "coding" ? q.sampleTestCases : undefined,
  // correctOptionIndex and hiddenTestCases are intentionally omitted
});

const isExpired = (attempt) => new Date() > new Date(attempt.endsAt);

// @route POST /api/tests/:id/start   (student)
export const startAttempt = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);
    if (!test || !test.isEnabled) {
      return res.status(404).json({ message: "Test not available" });
    }

    // Atomic upsert: if two requests race (e.g. React StrictMode firing the
    // start effect twice), MongoDB guarantees only one document is ever
    // created for this student+test pair — no duplicate-key crash.
    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + test.durationMinutes * 60 * 1000);

    const attempt = await Attempt.findOneAndUpdate(
      { student: req.user._id, test: test._id },
      {
        $setOnInsert: {
          student: req.user._id,
          test: test._id,
          startedAt,
          endsAt,
          maxScore: test.totalMarks,
        },
      },
      { upsert: true, new: true }
    );

    if (attempt.status === "submitted") {
      return res.status(409).json({ message: "You have already submitted this test" });
    }
    if (isExpired(attempt)) {
      attempt.status = "submitted";
      attempt.submittedAt = new Date();
      await attempt.save();
      return res.status(409).json({ message: "Your time for this test has expired" });
    }

    const questions = await Question.find({ test: test._id }).sort({ createdAt: 1 });

    res.json({
      attemptId: attempt._id,
      endsAt: attempt.endsAt,
      test: {
        _id: test._id,
        title: test.title,
        category: test.category,
        durationMinutes: test.durationMinutes,
        navigationPolicySettings: test.navigationPolicySettings,
      },
      questions: questions.map(sanitizeQuestion),
      existingAnswers: attempt.answers.map((a) => ({
        question: a.question,
        selectedOptionIndex: a.selectedOptionIndex,
        code: a.code,
        language: a.language,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to start test", error: err.message });
  }
};

const getOwnedActiveAttempt = async (req, res) => {
  const attempt = await Attempt.findById(req.params.attemptId);
  if (!attempt || String(attempt.student) !== String(req.user._id)) {
    res.status(404).json({ message: "Attempt not found" });
    return null;
  }
  if (attempt.status === "submitted") {
    res.status(409).json({ message: "This test has already been submitted" });
    return null;
  }
  if (isExpired(attempt)) {
    attempt.status = "submitted";
    attempt.submittedAt = new Date();
    await attempt.save();
    res.status(409).json({ message: "Time is up for this test" });
    return null;
  }
  return attempt;
};

// @route PUT /api/attempts/:attemptId/answers/:questionId   (student) - autosave
export const saveAnswer = async (req, res) => {
  try {
    const attempt = await getOwnedActiveAttempt(req, res);
    if (!attempt) return;

    const question = await Question.findById(req.params.questionId);
    if (!question || String(question.test) !== String(attempt.test)) {
      return res.status(404).json({ message: "Question not found in this test" });
    }

    const { selectedOptionIndex, code, language } = req.body;
    const existing = attempt.answers.find((a) => String(a.question) === req.params.questionId);

    if (existing) {
      if (selectedOptionIndex !== undefined) existing.selectedOptionIndex = selectedOptionIndex;
      if (code !== undefined) existing.code = code;
      if (language !== undefined) existing.language = language;
    } else {
      attempt.answers.push({
        question: question._id,
        type: question.type,
        selectedOptionIndex: selectedOptionIndex ?? null,
        code: code || "",
        language: language || null,
      });
    }

    await attempt.save();
    res.json({ saved: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to save answer", error: err.message });
  }
};

// @route POST /api/attempts/:attemptId/run-sample/:questionId   (student)
// Runs the student's current code against sample test cases only — no marks, just feedback.
export const runSample = async (req, res) => {
  try {
    const attempt = await getOwnedActiveAttempt(req, res);
    if (!attempt) return;

    const question = await Question.findById(req.params.questionId);
    if (!question || question.type !== "coding") {
      return res.status(400).json({ message: "This is not a coding question" });
    }

    const { code, language } = req.body;
    if (!code || !language) {
      return res.status(400).json({ message: "code and language are required" });
    }

    const results = await runAgainstTestCases({
      sourceCode: code,
      language,
      testCases: question.sampleTestCases,
    });

    res.json({ results });
  } catch (err) {
    res.status(500).json({ message: "Failed to run code", error: err.message });
  }
};

// Grades every answer on an attempt and marks it submitted. Shared by the
// normal student-initiated submit route and the proctoring auto-submit
// trigger, so both paths score identically.
export const gradeAttempt = async (attempt) => {
  const questions = await Question.find({ test: attempt.test });
  const questionMap = new Map(questions.map((q) => [String(q._id), q]));

  let totalScore = 0;

  for (const answer of attempt.answers) {
    const question = questionMap.get(String(answer.question));
    if (!question) continue;

    if (question.type === "mcq") {
      answer.isCorrect = answer.selectedOptionIndex === question.correctOptionIndex;
      answer.marksAwarded = answer.isCorrect ? question.marks : 0;
    }

    if (question.type === "coding" && answer.code && answer.language) {
      const allCases = [...question.sampleTestCases, ...question.hiddenTestCases];
      const results = await runAgainstTestCases({
        sourceCode: answer.code,
        language: answer.language,
        testCases: allCases,
      });

      answer.testCaseResults = results.map((r, i) => ({
        ...r,
        hidden: i >= question.sampleTestCases.length,
      }));

      const passedCount = results.filter((r) => r.passed).length;
      answer.marksAwarded = allCases.length
        ? Math.round((question.marks * passedCount) / allCases.length)
        : 0;
    }

    totalScore += answer.marksAwarded;
  }

  attempt.totalScore = totalScore;
  attempt.status = "submitted";
  attempt.submittedAt = new Date();
  await attempt.save();
  return attempt;
};

// @route POST /api/attempts/:attemptId/submit   (student)
export const submitAttempt = async (req, res) => {
  try {
    const attempt = await getOwnedActiveAttempt(req, res);
    if (!attempt) return;

    const { exitReason, violationCount, auditLogs } = req.body || {};
    if (exitReason) attempt.exitReason = exitReason;
    if (typeof violationCount === "number") attempt.violationCount = violationCount;
    if (Array.isArray(auditLogs) && auditLogs.length > 0) {
      attempt.auditLogs.push(...auditLogs);
    }

    await gradeAttempt(attempt);

    res.json({
      totalScore: attempt.totalScore,
      maxScore: attempt.maxScore,
      submittedAt: attempt.submittedAt,
      exitReason: attempt.exitReason,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to submit test", error: err.message });
  }
};

// @route GET /api/tests/:testId/leaderboard   (admin)
// Rank-wise leaderboard: highest score first, earlier submission breaks ties.
// @route GET /api/tests/:testId/leaderboard?branch=CSE   (admin)
// Rank-wise leaderboard: highest score first, earlier submission breaks ties.
// Optional ?branch=CSE filters to one department; rank is recomputed within
// that filtered set, so "#1" means top of that branch, not the overall test.
export const getLeaderboard = async (req, res) => {
  try {
    const attempts = await Attempt.find({ test: req.params.testId, status: "submitted" })
      .populate("student", "name erpNumber branch year section")
      .sort({ totalScore: -1, submittedAt: 1 });

    const filtered = req.query.branch
      ? attempts.filter((a) => a.student?.branch === req.query.branch)
      : attempts;

    const leaderboard = filtered.map((a, idx) => ({
      rank: idx + 1,
      student: a.student,
      totalScore: a.totalScore,
      maxScore: a.maxScore,
      percent: a.maxScore ? Math.round((a.totalScore / a.maxScore) * 100) : 0,
      submittedAt: a.submittedAt,
      attemptId: a._id,
    }));

    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch leaderboard", error: err.message });
  }
};

// @route GET /api/attempts/my-attempts   (student)
export const getMyAttempts = async (req, res) => {
  try {
    const attempts = await Attempt.find({ student: req.user._id })
      .populate("test", "title category totalMarks durationMinutes isPractice")
      .sort({ createdAt: -1 });
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch student attempts", error: err.message });
  }
};

// @route GET /api/attempts/:attemptId   (student — own attempt; admin — any)
export const getAttempt = async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.attemptId).populate("test", "title category totalMarks");
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    if (req.user.role === "student" && String(attempt.student) !== String(req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    res.json(attempt);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch attempt", error: err.message });
  }
};
