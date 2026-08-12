import Attempt from "../models/Attempt.js";
import Test from "../models/Test.js";
import Question from "../models/Question.js";
import { runAgainstTestCases } from "../services/codeRunner.js";

const sanitizeQuestion = (q, sectionInfo = {}) => ({
  _id: q._id,
  type: q.type,
  questionText: q.questionText,
  marks: q.marks,
  difficulty: q.difficulty,
  topic: q.topic || "General",
  subtopic: q.subtopic || "",
  explanation: q.explanation || "",
  inputFormat: q.inputFormat || "",
  outputFormat: q.outputFormat || "",
  constraints: q.constraints || "",
  options: q.type === "mcq" ? q.options : undefined,
  languages: q.type === "coding" ? q.languages : undefined,
  sampleTestCases: q.type === "coding" ? q.sampleTestCases : undefined,
  sectionId: sectionInfo.sectionId || null,
  sectionName: sectionInfo.sectionName || null,
});

const isExpired = (attempt) => new Date() > new Date(attempt.endsAt);

// @route POST /api/tests/:id/start   (student)
export const startAttempt = async (req, res) => {
  try {
    let test = await Test.findById(req.params.testId).populate(
      "sections.questions",
      "_id type questionText marks difficulty topic subtopic options languages sampleTestCases inputFormat outputFormat constraints"
    );

    // Fallback: If req.params.testId is an attemptId instead of testId, resume that attempt
    if (!test) {
      const existing = await Attempt.findById(req.params.testId);
      if (existing && String(existing.student) === String(req.user._id)) {
        test = await Test.findById(existing.test).populate(
          "sections.questions",
          "_id type questionText marks difficulty topic subtopic options languages sampleTestCases inputFormat outputFormat constraints"
        );
      }
    }

    if (!test) {
      return res.status(404).json({ message: "Test not available" });
    }

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

    let questions = [];
    let sectionsData = [];

    if (test.testType === "placement" && test.sections && test.sections.length > 0) {
      sectionsData = test.sections.map((s) => ({
        _id: s._id,
        name: s.name,
        topic: s.topic,
        questionCount: s.questionCount,
        durationMinutes: s.durationMinutes,
        marks: s.marks,
        instructions: s.instructions,
        questions: (s.questions || []).map((q) => sanitizeQuestion(q, { sectionId: String(s._id), sectionName: s.name })),
      }));

      // Flatten unique questions in section order
      const qMap = new Map();
      test.sections.forEach((sec) => {
        (sec.questions || []).forEach((q) => {
          if (!qMap.has(String(q._id))) {
            qMap.set(String(q._id), sanitizeQuestion(q, { sectionId: String(sec._id), sectionName: sec.name }));
          }
        });
      });
      questions = Array.from(qMap.values());
    } else {
      const dbQuestions = await Question.find({ test: test._id }).sort({ createdAt: 1 });
      questions = dbQuestions.map((q) => sanitizeQuestion(q));
    }

    res.json({
      attemptId: attempt._id,
      endsAt: attempt.endsAt,
      test: {
        _id: test._id,
        title: test.title,
        category: test.category,
        testType: test.testType,
        difficulty: test.difficulty,
        description: test.description,
        instructions: test.instructions,
        durationMinutes: test.durationMinutes,
        totalMarks: test.totalMarks,
        passingMarks: test.passingMarks,
        sections: sectionsData,
        navigationPolicySettings: test.navigationPolicySettings,
      },
      questions,
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
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
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

// Grades every answer on an attempt and marks it submitted.
export const gradeAttempt = async (attempt) => {
  const test = await Test.findById(attempt.test).populate("sections.questions");
  let questions = [];

  if (test && test.testType === "placement" && test.sections && test.sections.length > 0) {
    const qSet = new Set();
    test.sections.forEach((sec) => {
      (sec.questions || []).forEach((q) => {
        if (!qSet.has(String(q._id))) {
          qSet.add(String(q._id));
          questions.push(q);
        }
      });
    });
  } else {
    questions = await Question.find({ test: attempt.test });
  }

  const questionMap = new Map(questions.map((q) => [String(q._id), q]));
  const answerMap = new Map(attempt.answers.map((a) => [String(a.question), a]));

  let totalScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;
  let codingScore = 0;
  let codingMaxScore = 0;

  for (const question of questions) {
    const qIdStr = String(question._id);
    let answer = answerMap.get(qIdStr);

    if (!answer) {
      unattemptedCount++;
      if (question.type === "coding") {
        codingMaxScore += question.marks;
      }
      continue;
    }

    if (question.type === "mcq") {
      if (answer.selectedOptionIndex === null || answer.selectedOptionIndex === undefined) {
        unattemptedCount++;
      } else {
        answer.isCorrect = answer.selectedOptionIndex === question.correctOptionIndex;
        answer.marksAwarded = answer.isCorrect ? question.marks : 0;
        if (answer.isCorrect) correctCount++;
        else incorrectCount++;
      }
    }

    if (question.type === "coding") {
      codingMaxScore += question.marks;
      if (!answer.code || !answer.code.trim()) {
        unattemptedCount++;
      } else {
        const allCases = [...(question.sampleTestCases || []), ...(question.hiddenTestCases || [])];
        const results = await runAgainstTestCases({
          sourceCode: answer.code,
          language: answer.language || "python",
          testCases: allCases,
        });

        answer.testCaseResults = results.map((r, i) => ({
          ...r,
          hidden: i >= (question.sampleTestCases || []).length,
        }));

        const passedCount = results.filter((r) => r.passed).length;
        answer.marksAwarded = allCases.length
          ? Math.round((question.marks * passedCount) / allCases.length)
          : 0;

        codingScore += answer.marksAwarded;
        if (passedCount === allCases.length) correctCount++;
        else incorrectCount++;
      }
    }

    totalScore += answer.marksAwarded || 0;
  }

  // Calculate Section-wise Breakdown if test has sections
  const sectionResults = [];
  if (test && test.sections && test.sections.length > 0) {
    for (const sec of test.sections) {
      let secScore = 0;
      let secMaxScore = 0;
      let secCorrect = 0;
      let secIncorrect = 0;
      let secUnattempted = 0;

      (sec.questions || []).forEach((q) => {
        const qObj = typeof q === "object" ? q : questionMap.get(String(q));
        if (!qObj) return;
        secMaxScore += qObj.marks || 0;

        const ans = answerMap.get(String(qObj._id));
        if (!ans || (qObj.type === "mcq" && (ans.selectedOptionIndex === null || ans.selectedOptionIndex === undefined)) || (qObj.type === "coding" && !ans.code?.trim())) {
          secUnattempted++;
        } else if (ans.marksAwarded === qObj.marks) {
          secCorrect++;
          secScore += ans.marksAwarded;
        } else {
          secIncorrect++;
          secScore += ans.marksAwarded || 0;
        }
      });

      sectionResults.push({
        sectionId: String(sec._id),
        sectionName: sec.name,
        totalScore: secScore,
        maxScore: secMaxScore || sec.marks || 0,
        correctCount: secCorrect,
        incorrectCount: secIncorrect,
        unattemptedCount: secUnattempted,
        timeSpentSeconds: 0,
      });
    }
  }

  const now = new Date();
  const timeTakenSeconds = Math.max(0, Math.floor((now - new Date(attempt.startedAt)) / 1000));
  const maxScore = test ? test.totalMarks : attempt.maxScore;

  attempt.totalScore = totalScore;
  attempt.maxScore = maxScore;
  attempt.status = "submitted";
  attempt.submittedAt = now;
  attempt.sectionResults = sectionResults;
  attempt.summary = {
    totalQuestions: questions.length,
    correctCount,
    incorrectCount,
    unattemptedCount,
    percentage: maxScore ? Math.round((totalScore / maxScore) * 100) : 0,
    codingScore,
    codingMaxScore,
    timeTakenSeconds,
  };

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
      attemptId: attempt._id,
      totalScore: attempt.totalScore,
      maxScore: attempt.maxScore,
      submittedAt: attempt.submittedAt,
      exitReason: attempt.exitReason,
      sectionResults: attempt.sectionResults,
      summary: attempt.summary,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to submit test", error: err.message });
  }
};

// @route GET /api/tests/:testId/leaderboard   (admin)
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
      summary: a.summary,
    }));

    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch leaderboard", error: err.message });
  }
};

// @route GET /api/tests/:testId/placement-analytics   (admin)
export const getPlacementAnalytics = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId).populate("sections.questions");
    if (!test) return res.status(404).json({ message: "Test not found" });

    const attempts = await Attempt.find({ test: test._id, status: "submitted" })
      .populate("student", "name erpNumber branch year section email")
      .sort({ totalScore: -1 });

    const totalAttempts = attempts.length;
    const completedCount = totalAttempts;
    const passingMarks = test.passingMarks || 0;
    const passedCount = attempts.filter((a) => a.totalScore >= passingMarks).length;
    const passRate = totalAttempts ? Math.round((passedCount / totalAttempts) * 100) : 0;

    const scores = attempts.map((a) => a.totalScore);
    const avgScore = totalAttempts ? Math.round(scores.reduce((a, b) => a + b, 0) / totalAttempts) : 0;
    const highestScore = totalAttempts ? Math.max(...scores) : 0;
    const lowestScore = totalAttempts ? Math.min(...scores) : 0;

    const times = attempts.map((a) => a.summary?.timeTakenSeconds || 0);
    const avgTimeSeconds = totalAttempts ? Math.round(times.reduce((a, b) => a + b, 0) / totalAttempts) : 0;

    // Section-wise aggregates
    const sectionStatsMap = new Map();
    (test.sections || []).forEach((s) => {
      sectionStatsMap.set(String(s._id), {
        sectionId: String(s._id),
        name: s.name,
        topic: s.topic,
        maxMarks: s.marks || 0,
        totalScoreSum: 0,
        totalCorrectSum: 0,
        totalAttempts: 0,
      });
    });

    attempts.forEach((att) => {
      (att.sectionResults || []).forEach((sr) => {
        const item = sectionStatsMap.get(String(sr.sectionId));
        if (item) {
          item.totalScoreSum += sr.totalScore || 0;
          item.totalCorrectSum += sr.correctCount || 0;
          item.totalAttempts++;
        }
      });
    });

    const sectionPerformance = Array.from(sectionStatsMap.values()).map((s) => ({
      ...s,
      avgScore: s.totalAttempts ? Math.round(s.totalScoreSum / s.totalAttempts) : 0,
      avgPercentage: s.totalAttempts && s.maxMarks ? Math.round((s.totalScoreSum / (s.totalAttempts * s.maxMarks)) * 100) : 0,
    }));

    res.json({
      test: {
        _id: test._id,
        title: test.title,
        category: test.category,
        totalMarks: test.totalMarks,
        passingMarks: test.passingMarks,
        durationMinutes: test.durationMinutes,
      },
      summary: {
        totalAttempts,
        completedCount,
        passedCount,
        passRate,
        avgScore,
        highestScore,
        lowestScore,
        avgTimeSeconds,
      },
      sectionPerformance,
      students: attempts.map((a) => ({
        attemptId: a._id,
        student: a.student,
        totalScore: a.totalScore,
        maxScore: a.maxScore,
        percentage: a.summary?.percentage || (a.maxScore ? Math.round((a.totalScore / a.maxScore) * 100) : 0),
        passed: a.totalScore >= passingMarks,
        submittedAt: a.submittedAt,
        timeTakenSeconds: a.summary?.timeTakenSeconds || 0,
        sectionResults: a.sectionResults,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch placement analytics", error: err.message });
  }
};

// @route GET /api/attempts/my-attempts   (student)
export const getMyAttempts = async (req, res) => {
  try {
    const attempts = await Attempt.find({ student: req.user._id })
      .populate("test", "title category testType totalMarks durationMinutes sections")
      .sort({ createdAt: -1 });
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch student attempts", error: err.message });
  }
};

// @route GET /api/attempts/:attemptId   (student — own attempt; admin — any)
export const getAttempt = async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.attemptId)
      .populate("test", "title category testType totalMarks passingMarks durationMinutes instructions sections")
      .populate("answers.question");

    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    if (req.user.role === "student" && String(attempt.student) !== String(req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    res.json(attempt);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch attempt", error: err.message });
  }
};
