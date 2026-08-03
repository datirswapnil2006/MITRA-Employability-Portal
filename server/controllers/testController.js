import Test from "../models/Test.js";
import Question from "../models/Question.js";

// @route POST /api/tests   (admin)
export const createTest = async (req, res) => {
  try {
    const { title, category, description, durationMinutes } = req.body;
    if (!title || !category || !durationMinutes) {
      return res.status(400).json({ message: "title, category and durationMinutes are required" });
    }
    const test = await Test.create({
      title,
      category,
      description,
      durationMinutes,
      isEnabled: false, // always disabled on creation
      createdBy: req.user._id,
    });
    res.status(201).json(test);
  } catch (err) {
    res.status(500).json({ message: "Failed to create test", error: err.message });
  }
};

// @route GET /api/tests   (admin: all tests, with question counts)
export const getAllTests = async (req, res) => {
  try {
    const tests = await Test.find().sort({ createdAt: -1 }).lean();
    const withCounts = await Promise.all(
      tests.map(async (t) => ({
        ...t,
        questionCount: await Question.countDocuments({ test: t._id }),
      }))
    );
    res.json(withCounts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tests", error: err.message });
  }
};

// @route GET /api/tests/enabled   (student: only enabled tests)
export const getEnabledTests = async (req, res) => {
  try {
    const tests = await Test.find({ isEnabled: true }).sort({ createdAt: -1 });
    res.json(tests);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tests", error: err.message });
  }
};

// @route GET /api/tests/:id
export const getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found" });
    res.json(test);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch test", error: err.message });
  }
};

// @route PUT /api/tests/:id   (admin)
export const updateTest = async (req, res) => {
  try {
    const { title, category, description, durationMinutes } = req.body;
    const test = await Test.findByIdAndUpdate(
      req.params.id,
      { title, category, description, durationMinutes },
      { new: true, runValidators: true }
    );
    if (!test) return res.status(404).json({ message: "Test not found" });
    res.json(test);
  } catch (err) {
    res.status(500).json({ message: "Failed to update test", error: err.message });
  }
};

// @route PATCH /api/tests/:id/toggle   (admin) - enable/disable with one click
export const toggleTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found" });

    if (!test.isEnabled) {
      const questionCount = await Question.countDocuments({ test: test._id });
      if (questionCount === 0) {
        return res.status(400).json({ message: "Add at least one question before enabling this test" });
      }
    }

    test.isEnabled = !test.isEnabled;
    await test.save();
    res.json(test);
  } catch (err) {
    res.status(500).json({ message: "Failed to toggle test", error: err.message });
  }
};

// @route DELETE /api/tests/:id   (admin)
export const deleteTest = async (req, res) => {
  try {
    const test = await Test.findByIdAndDelete(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found" });
    await Question.deleteMany({ test: test._id });
    res.json({ message: "Test deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete test", error: err.message });
  }
};
