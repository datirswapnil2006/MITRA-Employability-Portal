/**
 * Utility functions to generate structured prompts for AI models.
 */

export const buildMcqPrompt = ({ category, topic, difficulty, count, marks }) => {
  const catTitle = (category || "Aptitude").toUpperCase();

  return `You are an expert ${catTitle} test creator for university recruitment and employability assessments.
Generate exactly ${count} multiple-choice question(s) on the following specifications:
- Category: ${catTitle}
- Topic: ${topic}
- Difficulty: ${difficulty}
- Marks per Question: ${marks}

CRITICAL RULES:
1. Provide accurate, clear, and unambiguous questions.
2. For each question, provide EXACTLY 4 distractor choices in the "options" array.
3. "correctOptionIndex" must be a 0-based integer (0, 1, 2, or 3) indicating the single correct option.
4. Include a concise step-by-step "explanation" explaining why the correct answer is right.
5. Return ONLY a raw JSON object formatted as follows, with no markdown code fences, backticks, or preamble:

{
  "questions": [
    {
      "type": "mcq",
      "questionText": "...",
      "difficulty": "${difficulty}",
      "marks": ${marks},
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOptionIndex": 0,
      "explanation": "Step-by-step solution..."
    }
  ]
}`;
};

export const buildCodingPrompt = ({ topic, difficulty, count, marks, languages }) => {
  const langList = Array.isArray(languages) && languages.length > 0 ? languages : ["python", "java", "cpp"];

  return `You are a technical interview software designer for college placement assessments.
Generate exactly ${count} coding problem(s) based on:
- Topic: ${topic}
- Difficulty: ${difficulty}
- Marks per Question: ${marks}
- Supported Languages: ${langList.join(", ")}

CRITICAL RULES:
1. Each problem must be solvable by reading input from STDIN and outputting to STDOUT.
2. Provide 1 to 2 "sampleTestCases" for illustration.
3. Provide 3 to 5 "hiddenTestCases" covering edge cases, zero/negative bounds, and large inputs.
4. Provide a clear "explanation" of optimal time and space complexity.
5. Return ONLY a raw JSON object formatted as follows, with no markdown code fences, backticks, or preamble:

{
  "questions": [
    {
      "type": "coding",
      "questionText": "Clear problem statement with constraints and expected input/output format.",
      "difficulty": "${difficulty}",
      "marks": ${marks},
      "languages": ${JSON.stringify(langList)},
      "sampleTestCases": [
        { "input": "sample_in", "output": "sample_out" }
      ],
      "hiddenTestCases": [
        { "input": "hidden_in1", "output": "hidden_out1" }
      ],
      "explanation": "Algorithmic breakdown and optimal solution strategy..."
    }
  ]
}`;
};

export const buildExplanationPrompt = ({ questionText, options, correctOption, studentAnswer, code, testCases }) => {
  let contextDetails = `Question: ${questionText}\n`;
  if (options && options.length > 0) {
    contextDetails += `Options:\n${options.map((opt, i) => `${i + 1}. ${opt}`).join("\n")}\n`;
  }
  if (correctOption !== undefined) {
    contextDetails += `Correct Option / Expected Answer: ${correctOption}\n`;
  }
  if (studentAnswer !== undefined) {
    contextDetails += `Student's Provided Answer: ${studentAnswer}\n`;
  }
  if (code) {
    contextDetails += `Submitted Code:\n\`\`\`\n${code}\n\`\`\`\n`;
  }
  if (testCases) {
    contextDetails += `Test Case Results: ${JSON.stringify(testCases)}\n`;
  }

  return `You are a friendly computer science & aptitude tutor providing detailed explanations for assessment feedback.

Context:
${contextDetails}

Return ONLY a raw JSON object, no markdown backticks, no preamble or postscript:
{
  "explanation": "Comprehensive yet easy to understand explanation of the solution...",
  "keyConcepts": ["Concept 1", "Concept 2"],
  "stepByStep": ["Step 1...", "Step 2..."],
  "tipsForImprovement": "Custom actionable advice for the student..."
}`;
};
