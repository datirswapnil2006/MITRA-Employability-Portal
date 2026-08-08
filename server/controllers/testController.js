import Test from "../models/Test.js";
import Question from "../models/Question.js";

// @route POST /api/tests   (admin)
export const createTest = async (req, res) => {
  try {
    const {
      title,
      category,
      testType,
      difficulty,
      description,
      instructions,
      durationMinutes,
      totalMarks,
      passingMarks,
      sections,
      navigationPolicySettings,
    } = req.body;

    if (!title || !category || !durationMinutes) {
      return res.status(400).json({ message: "title, category and durationMinutes are required" });
    }

    const test = await Test.create({
      title,
      category,
      testType: testType || "standard",
      difficulty: difficulty || "Medium",
      description,
      instructions,
      durationMinutes,
      totalMarks: totalMarks || 0,
      passingMarks: passingMarks || 0,
      sections: sections || [],
      isEnabled: false, // always disabled on creation
      navigationPolicySettings: navigationPolicySettings || {},
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
      tests.map(async (t) => {
        let questionCount = 0;
        if (t.testType === "placement" && Array.isArray(t.sections) && t.sections.length > 0) {
          questionCount = t.sections.reduce(
            (sum, s) => sum + (Array.isArray(s.questions) ? s.questions.length : s.questionCount || 0),
            0
          );
        } else {
          questionCount = await Question.countDocuments({ test: t._id });
        }
        return {
          ...t,
          questionCount,
        };
      })
    );
    res.json(withCounts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tests", error: err.message });
  }
};

// @route GET /api/tests/enabled   (student: only enabled tests)
export const getEnabledTests = async (req, res) => {
  try {
    const tests = await Test.find({ isEnabled: true })
      .populate("sections.questions", "_id type questionText marks difficulty topic subtopic options languages sampleTestCases inputFormat outputFormat constraints")
      .sort({ createdAt: -1 });

    res.json(tests);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tests", error: err.message });
  }
};

// @route GET /api/tests/:id
export const getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate("sections.questions", "_id type questionText marks difficulty topic subtopic options correctOptionIndex languages sampleTestCases hiddenTestCases inputFormat outputFormat constraints explanation source status");
    if (!test) return res.status(404).json({ message: "Test not found" });
    res.json(test);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch test", error: err.message });
  }
};

// @route PUT /api/tests/:id   (admin)
export const updateTest = async (req, res) => {
  try {
    const {
      title,
      category,
      testType,
      difficulty,
      description,
      instructions,
      durationMinutes,
      totalMarks,
      passingMarks,
      sections,
      navigationPolicySettings,
    } = req.body;

    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found" });

    if (title !== undefined) test.title = title;
    if (category !== undefined) test.category = category;
    if (testType !== undefined) test.testType = testType;
    if (difficulty !== undefined) test.difficulty = difficulty;
    if (description !== undefined) test.description = description;
    if (instructions !== undefined) test.instructions = instructions;
    if (durationMinutes !== undefined) test.durationMinutes = durationMinutes;
    if (totalMarks !== undefined) test.totalMarks = totalMarks;
    if (passingMarks !== undefined) test.passingMarks = passingMarks;
    if (sections !== undefined) test.sections = sections;
    if (navigationPolicySettings !== undefined) test.navigationPolicySettings = navigationPolicySettings;

    await test.save();
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
      if (test.testType === "placement") {
        if (!test.sections || test.sections.length === 0) {
          return res.status(400).json({ message: "Add at least one section before enabling this Placement Test" });
        }
        let totalAssigned = 0;
        for (const s of test.sections) {
          if (!s.questions || s.questions.length === 0) {
            return res.status(400).json({ message: `Section "${s.name}" has no questions selected` });
          }
          totalAssigned += s.questions.length;
        }
        if (totalAssigned === 0) {
          return res.status(400).json({ message: "Add questions to your sections before enabling this test" });
        }
      } else {
        const questionCount = await Question.countDocuments({ test: test._id });
        if (questionCount === 0) {
          return res.status(400).json({ message: "Add at least one question before enabling this test" });
        }
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
