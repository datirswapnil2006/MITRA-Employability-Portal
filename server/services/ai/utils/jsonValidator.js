/**
 * Utilities to safely extract and validate JSON responses from AI models.
 */

/**
 * Clean and parse raw JSON text from model response
 * @param {string} text
 * @returns {any}
 */
export const parseJsonResponse = (text) => {
  if (!text || typeof text !== "string") {
    throw new Error("Empty or non-string response received from AI provider");
  }

  // Remove markdown code fences if present
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Fallback: try regex extraction for JSON object or array
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        return JSON.parse(objMatch[0]);
      } catch (innerErr) {
        // continue
      }
    }

    const arrMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrMatch) {
      try {
        return JSON.parse(arrMatch[0]);
      } catch (innerErr) {
        // continue
      }
    }

    throw new Error(`Failed to parse AI output as valid JSON: ${cleaned.substring(0, 150)}...`);
  }
};

/**
 * Validates MCQ question objects array
 * @param {any} parsedData
 * @param {number} expectedCount
 * @returns {Array<object>}
 */
export const validateMcqQuestions = (parsedData, expectedCount = 1) => {
  const items = Array.isArray(parsedData)
    ? parsedData
    : Array.isArray(parsedData?.questions)
    ? parsedData.questions
    : null;

  if (!items || items.length === 0) {
    throw new Error("Parsed JSON does not contain a valid questions array");
  }

  const validItems = items.filter((q) => {
    return (
      q &&
      typeof q.questionText === "string" &&
      q.questionText.trim().length > 0 &&
      Array.isArray(q.options) &&
      q.options.length >= 2 &&
      typeof q.correctOptionIndex === "number" &&
      q.correctOptionIndex >= 0 &&
      q.correctOptionIndex < q.options.length
    );
  }).map((q) => ({
    type: "mcq",
    questionText: q.questionText.trim(),
    difficulty: q.difficulty || "medium",
    marks: Number(q.marks) || 1,
    options: q.options.map((opt) => String(opt).trim()),
    correctOptionIndex: Number(q.correctOptionIndex),
    explanation: q.explanation ? String(q.explanation).trim() : "",
  }));

  if (validItems.length === 0) {
    throw new Error("No MCQ items in AI output passed schema validation");
  }

  return validItems;
};

/**
 * Validates Coding question objects array
 * @param {any} parsedData
 * @returns {Array<object>}
 */
export const validateCodingQuestions = (parsedData) => {
  const items = Array.isArray(parsedData)
    ? parsedData
    : Array.isArray(parsedData?.questions)
    ? parsedData.questions
    : null;

  if (!items || items.length === 0) {
    throw new Error("Parsed JSON does not contain a valid coding questions array");
  }

  const validItems = items.filter((q) => {
    return (
      q &&
      typeof q.questionText === "string" &&
      q.questionText.trim().length > 0 &&
      Array.isArray(q.languages) &&
      q.languages.length > 0 &&
      Array.isArray(q.sampleTestCases) &&
      q.sampleTestCases.length > 0 &&
      Array.isArray(q.hiddenTestCases) &&
      q.hiddenTestCases.length > 0
    );
  }).map((q) => ({
    type: "coding",
    questionText: q.questionText.trim(),
    difficulty: q.difficulty || "medium",
    marks: Number(q.marks) || 10,
    languages: q.languages.map((l) => String(l).toLowerCase().trim()),
    sampleTestCases: q.sampleTestCases.map((tc) => ({
      input: String(tc.input ?? ""),
      output: String(tc.output ?? ""),
    })),
    hiddenTestCases: q.hiddenTestCases.map((tc) => ({
      input: String(tc.input ?? ""),
      output: String(tc.output ?? ""),
    })),
    explanation: q.explanation ? String(q.explanation).trim() : "",
  }));

  if (validItems.length === 0) {
    throw new Error("No Coding items in AI output passed schema validation");
  }

  return validItems;
};

/**
 * Validates Explanation response object
 * @param {any} parsedData
 * @returns {object}
 */
export const validateExplanation = (parsedData) => {
  if (!parsedData || typeof parsedData !== "object") {
    throw new Error("Parsed explanation response is not an object");
  }

  return {
    explanation: String(parsedData.explanation || parsedData.text || "No explanation available.").trim(),
    keyConcepts: Array.isArray(parsedData.keyConcepts) ? parsedData.keyConcepts.map(String) : [],
    stepByStep: Array.isArray(parsedData.stepByStep) ? parsedData.stepByStep.map(String) : [],
    tipsForImprovement: parsedData.tipsForImprovement ? String(parsedData.tipsForImprovement).trim() : "",
  };
};
