import { aiService } from "./ai/AIService.js";

/**
 * Drafts test questions using the unified AIService (Gemini -> Groq -> Hugging Face fallback chain).
 * This endpoint returns draft JSON for an admin to review before saving to the question bank.
 */
export const generateQuestionDrafts = async ({ type, category, topic, difficulty, marks, count, languages }) => {
  let result;

  if (type === "coding") {
    result = await aiService.generateCodingQuestions({
      topic: `${category ? category + ": " : ""}${topic}`,
      difficulty,
      count: Number(count) || 1,
      marks: Number(marks) || 10,
      languages,
    });
  } else {
    // MCQ type (Aptitude, Logical, Verbal, or general)
    const categoryLower = String(category || "").toLowerCase();
    if (categoryLower.includes("logical")) {
      result = await aiService.generateLogicalQuestions({ topic, difficulty, count: Number(count) || 3, marks: Number(marks) || 2 });
    } else if (categoryLower.includes("verbal")) {
      result = await aiService.generateVerbalQuestions({ topic, difficulty, count: Number(count) || 3, marks: Number(marks) || 2 });
    } else {
      result = await aiService.generateAptitudeQuestions({ topic, difficulty, count: Number(count) || 3, marks: Number(marks) || 2 });
    }
  }

  return result?.data || [];
};