import Question from "../models/Question.js";

// @route GET /api/questions/bank   (admin)
// Returns all questions across all tests with populated test title.
// Supports filtering by ?test=<id>&type=mcq|coding&difficulty=Easy|Medium|Hard&search=<text>
export const getQuestionBank = async (req, res) => {
  try {
    const filter = {};
    if (req.query.test) filter.test = req.query.test;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    if (req.query.search) {
      filter.questionText = { $regex: req.query.search, $options: "i" };
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .populate("test", "title category")
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

// @route PATCH /api/questions/move   (admin)
// Move questions to a different test
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
