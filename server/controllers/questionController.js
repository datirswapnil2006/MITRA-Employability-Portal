import Question from "../models/Question.js";
import Test from "../models/Test.js";
import { generateQuestionDrafts } from "../services/aiQuestionGenerator.js";

const recalcTotalMarks = async (testId) => {
  const questions = await Question.find({ test: testId }).select("marks");
  const total = questions.reduce((sum, q) => sum + q.marks, 0);
  await Test.findByIdAndUpdate(testId, { totalMarks: total });
};

// @route POST /api/tests/:testId/questions/generate   (admin)
// Drafts questions with AI for the admin to review. Nothing is saved here —
// the response is a list of drafts; the admin edits and saves each one
// individually through the normal addQuestion endpoint.
export const generateQuestions = async (req, res) => {
  try {
    const { testId } = req.params;
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: "Test not found" });

    const { type, topic, difficulty, marks, count, languages } = req.body;
    if (!type || !topic || !difficulty || !marks || !count) {
      return res.status(400).json({ message: "type, topic, difficulty, marks and count are required" });
    }
    if (count > 5) {
      return res.status(400).json({ message: "Generate at most 5 questions at a time" });
    }

    const drafts = await generateQuestionDrafts({
      type,
      category: test.category,
      topic,
      difficulty,
      marks: Number(marks),
      count: Number(count),
      languages,
    });

    if (drafts.length === 0) {
      return res.status(502).json({ message: "AI did not return any usable questions — try again" });
    }

    res.json({ drafts });
  } catch (err) {
    // Gemini's error responses carry the real reason (e.g. which quota was
    // hit) in err.response.data.error.message — surface that instead of
    // Axios's generic "Request failed with status code ###".
    const geminiMessage = err.response?.data?.error?.message;
    const status = err.response?.status;

    if (status === 429) {
      return res.status(429).json({
        message: "Gemini rate limit hit — wait a minute and try again, or generate fewer questions at once.",
        error: geminiMessage || err.message,
      });
    }

    res.status(500).json({ message: "Failed to generate questions", error: geminiMessage || err.message });
  }
};

// @route POST /api/questions   (admin: standalone Question Bank question)
export const createQuestionInBank = async (req, res) => {
  try {
    const {
      type, questionText, marks, difficulty,
      topic, subtopic, source, status, sourcePdf, explanation,
      options, correctOptionIndex,
      languages, inputFormat, outputFormat, constraints, sampleTestCases, hiddenTestCases,
      testId,
    } = req.body;

    if (!type || !questionText || !marks) {
      return res.status(400).json({ message: "type, questionText and marks are required" });
    }
    if (type === "mcq" && (!options || options.length < 2 || correctOptionIndex === undefined)) {
      return res.status(400).json({ message: "MCQ questions need options and a correctOptionIndex" });
    }
    if (type === "coding" && (!languages || languages.length === 0)) {
      return res.status(400).json({ message: "Coding questions need at least one supported language" });
    }

    const question = await Question.create({
      test: testId || null,
      type,
      questionText,
      marks: Number(marks),
      difficulty: difficulty || "Medium",
      topic: topic || "General",
      subtopic: subtopic || "",
      source: source || "manual",
      status: status || "approved",
      sourcePdf: sourcePdf || "",
      explanation: explanation || "",
      options,
      correctOptionIndex,
      languages,
      inputFormat,
      outputFormat,
      constraints,
      sampleTestCases,
      hiddenTestCases,
    });

    if (testId) {
      await recalcTotalMarks(testId);
    }

    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ message: "Failed to create question in bank", error: err.message });
  }
};

// @route POST /api/tests/:testId/questions   (admin)
export const addQuestion = async (req, res) => {
  try {
    const { testId } = req.params;
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: "Test not found" });

    const {
      type, questionText, marks, difficulty,
      topic, subtopic, source, status, sourcePdf, explanation,
      options, correctOptionIndex,
      languages, inputFormat, outputFormat, constraints, sampleTestCases, hiddenTestCases,
    } = req.body;

    if (!type || !questionText || !marks) {
      return res.status(400).json({ message: "type, questionText and marks are required" });
    }
    if (type === "mcq" && (!options || options.length < 2 || correctOptionIndex === undefined)) {
      return res.status(400).json({ message: "MCQ questions need options and a correctOptionIndex" });
    }
    if (type === "coding" && (!languages || languages.length === 0)) {
      return res.status(400).json({ message: "Coding questions need at least one supported language" });
    }

    const question = await Question.create({
      test: testId,
      type, questionText, marks, difficulty,
      topic: topic || test.category || "General",
      subtopic: subtopic || "",
      source: source || "manual",
      status: status || "approved",
      sourcePdf: sourcePdf || "",
      explanation: explanation || "",
      options, correctOptionIndex,
      languages, inputFormat, outputFormat, constraints, sampleTestCases, hiddenTestCases,
    });

    await recalcTotalMarks(testId);
    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ message: "Failed to add question", error: err.message });
  }
};

// @route GET /api/tests/:testId/questions   (admin: full detail incl. hidden cases + correct answers)
export const getQuestionsForTest = async (req, res) => {
  try {
    const questions = await Question.find({ test: req.params.testId }).sort({ createdAt: 1 });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch questions", error: err.message });
  }
};

// @route PUT /api/questions/:id   (admin)
export const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!question) return res.status(404).json({ message: "Question not found" });
    if (question.test) {
      await recalcTotalMarks(question.test);
    }
    res.json(question);
  } catch (err) {
    res.status(500).json({ message: "Failed to update question", error: err.message });
  }
};

// @route DELETE /api/questions/:id   (admin)
export const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) return res.status(404).json({ message: "Question not found" });
    if (question.test) {
      await recalcTotalMarks(question.test);
    }
    res.json({ message: "Question deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete question", error: err.message });
  }
};