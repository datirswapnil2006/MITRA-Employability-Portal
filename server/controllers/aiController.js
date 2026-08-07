import { aiService } from "../services/ai/AIService.js";

/**
 * @route POST /api/ai/aptitude
 * @access Private (Admin / Student)
 */
export const generateAptitude = async (req, res) => {
  try {
    const { topic, difficulty, count, marks } = req.body;
    const result = await aiService.generateAptitudeQuestions({
      topic,
      difficulty,
      count: Number(count) || 3,
      marks: Number(marks) || 2,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to generate Aptitude questions",
      error: err.message,
    });
  }
};

/**
 * @route POST /api/ai/logical
 * @access Private
 */
export const generateLogical = async (req, res) => {
  try {
    const { topic, difficulty, count, marks } = req.body;
    const result = await aiService.generateLogicalQuestions({
      topic,
      difficulty,
      count: Number(count) || 3,
      marks: Number(marks) || 2,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to generate Logical reasoning questions",
      error: err.message,
    });
  }
};

/**
 * @route POST /api/ai/verbal
 * @access Private
 */
export const generateVerbal = async (req, res) => {
  try {
    const { topic, difficulty, count, marks } = req.body;
    const result = await aiService.generateVerbalQuestions({
      topic,
      difficulty,
      count: Number(count) || 3,
      marks: Number(marks) || 2,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to generate Verbal ability questions",
      error: err.message,
    });
  }
};

/**
 * @route POST /api/ai/coding
 * @access Private
 */
export const generateCoding = async (req, res) => {
  try {
    const { topic, difficulty, count, marks, languages } = req.body;
    const result = await aiService.generateCodingQuestions({
      topic,
      difficulty,
      count: Number(count) || 1,
      marks: Number(marks) || 10,
      languages,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to generate Coding problems",
      error: err.message,
    });
  }
};

/**
 * @route POST /api/ai/explain
 * @access Private
 */
export const generateExplanation = async (req, res) => {
  try {
    const { questionText, options, correctOption, studentAnswer, code, testCases } = req.body;
    if (!questionText) {
      return res.status(400).json({ success: false, message: "questionText is required" });
    }

    const result = await aiService.generateExplanations({
      questionText,
      options,
      correctOption,
      studentAnswer,
      code,
      testCases,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to generate explanation",
      error: err.message,
    });
  }
};
