import Question from "../models/Question.js";
import Test from "../models/Test.js";

// @route GET /api/questions/bank   (admin)
// Supports filtering by ?test=<id>&type=mcq|coding&difficulty=Easy|Medium|Hard&topic=<text>&subtopic=<text>&source=manual|pdf|ai&status=draft|pending_review|approved|rejected&marks=<num>&search=<text>
export const getQuestionBank = async (req, res) => {
  try {
    const filter = {};
    if (req.query.test) filter.test = req.query.test;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    if (req.query.topic) filter.topic = { $regex: req.query.topic, $options: "i" };
    if (req.query.subtopic) filter.subtopic = { $regex: req.query.subtopic, $options: "i" };
    if (req.query.source) filter.source = req.query.source;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.marks) filter.marks = Number(req.query.marks);
    if (req.query.search) {
      filter.questionText = { $regex: req.query.search, $options: "i" };
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .populate("test", "title category testType")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Question.countDocuments(filter),
    ]);

    res.json({
      questions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch question bank", error: err.message });
  }
};

// @route POST /api/questions/bulk-delete   (admin)
export const bulkDeleteQuestions = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Provide an array of question IDs" });
    }
    const result = await Question.deleteMany({ _id: { $in: ids } });
    res.json({ message: `Deleted ${result.deletedCount} question(s)` });
  } catch (err) {
    res.status(500).json({ message: "Failed to bulk delete", error: err.message });
  }
};

// @route PATCH /api/questions/bulk-status   (admin)
export const bulkUpdateStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || !status) {
      return res.status(400).json({ message: "Provide question IDs and target status" });
    }
    await Question.updateMany({ _id: { $in: ids } }, { status });
    res.json({ message: `Updated status for ${ids.length} question(s) to ${status}` });
  } catch (err) {
    res.status(500).json({ message: "Failed to bulk update status", error: err.message });
  }
};

// @route POST /api/questions/bulk-create   (admin)
export const bulkAddQuestions = async (req, res) => {
  try {
    const { questions, testId } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "Provide an array of question objects" });
    }

    const docs = questions.map((q) => ({
      test: testId || q.testId || null,
      type: q.type || "mcq",
      questionText: q.questionText,
      marks: Number(q.marks) || 1,
      difficulty: q.difficulty || "Medium",
      topic: q.topic || "General",
      subtopic: q.subtopic || "",
      source: q.source || "manual",
      status: q.status || "approved",
      sourcePdf: q.sourcePdf || "",
      explanation: q.explanation || "",
      options: q.options || [],
      correctOptionIndex: q.correctOptionIndex,
      languages: q.languages || [],
      inputFormat: q.inputFormat || "",
      outputFormat: q.outputFormat || "",
      constraints: q.constraints || "",
      sampleTestCases: q.sampleTestCases || [],
      hiddenTestCases: q.hiddenTestCases || [],
    }));

    const created = await Question.insertMany(docs);
    res.status(201).json({ message: `Added ${created.length} questions to Question Bank`, questions: created });
  } catch (err) {
    res.status(500).json({ message: "Failed to bulk add questions", error: err.message });
  }
};

// @route PATCH /api/questions/move   (admin)
export const moveQuestions = async (req, res) => {
  try {
    const { ids, targetTestId } = req.body;
    if (!Array.isArray(ids) || !targetTestId) {
      return res.status(400).json({ message: "Provide question IDs and a target test ID" });
    }
    await Question.updateMany({ _id: { $in: ids } }, { test: targetTestId });
    res.json({ message: `Moved ${ids.length} question(s) to new test` });
  } catch (err) {
    res.status(500).json({ message: "Failed to move questions", error: err.message });
  }
};

// @route PATCH /api/questions/attach-section   (admin)
export const attachQuestionsToSection = async (req, res) => {
  try {
    const { testId, sectionId, questionIds } = req.body;
    if (!testId || !sectionId || !Array.isArray(questionIds)) {
      return res.status(400).json({ message: "testId, sectionId, and questionIds array are required" });
    }

    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: "Test not found" });

    const section = test.sections.id(sectionId);
    if (!section) return res.status(404).json({ message: "Section not found in this test" });

    section.questions = Array.from(new Set([...section.questions.map((q) => String(q)), ...questionIds]));
    section.questionCount = section.questions.length;

    await test.save();
    res.json({ message: `Attached ${questionIds.length} question(s) to section "${section.name}"`, test });
  } catch (err) {
    res.status(500).json({ message: "Failed to attach questions to section", error: err.message });
  }
};
