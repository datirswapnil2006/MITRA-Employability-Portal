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

export const buildBlueprintPrompt = ({ prompt }) => {
  return `You are a senior campus placement director and curriculum engineer.
Analyze the following natural language request for a placement assessment and generate a structured TEST BLUEPRINT.

User Request / Prompt:
"${prompt}"

CRITICAL INSTRUCTIONS:
1. Extract title, concise description, recommended duration in minutes (e.g. 45, 60, 90), and difficulty (Easy, Medium, Hard, or Mixed).
2. Deconstruct the test into 3 to 6 logical sections based on the prompt (e.g. Quantitative Aptitude, Logical Reasoning, Verbal Ability, Data Structures & Algorithms, Coding & Programming).
3. For each section, specify target topic, expected number of MCQ questions, expected number of Coding questions, marks per MCQ (e.g. 1 or 2), and marks per Coding question (e.g. 10 or 20).
4. Total MCQ + Coding count should reasonably match what the user requested (or standard 25-45 questions for 60 min).
5. Return ONLY a raw JSON object matching this structure, with no markdown code fences, backticks, or extra text:

{
  "title": "Official Campus Placement Assessment 2026",
  "description": "Comprehensive evaluation covering Aptitude, Logical Reasoning, Verbal Ability, and Coding.",
  "durationMinutes": 60,
  "difficulty": "Medium",
  "sections": [
    {
      "name": "Quantitative Aptitude",
      "topic": "Quantitative Aptitude",
      "mcqCount": 8,
      "codingCount": 0,
      "marksPerMcq": 1,
      "marksPerCoding": 0,
      "instructions": "Solve all quantitative aptitude questions."
    },
    {
      "name": "Logical Reasoning",
      "topic": "Logical Reasoning",
      "mcqCount": 7,
      "codingCount": 0,
      "marksPerMcq": 1,
      "marksPerCoding": 0,
      "instructions": "Analytical and logical reasoning problems."
    },
    {
      "name": "Verbal Ability",
      "topic": "Verbal Ability",
      "mcqCount": 5,
      "codingCount": 0,
      "marksPerMcq": 1,
      "marksPerCoding": 0,
      "instructions": "Grammar, comprehension, and vocabulary."
    },
    {
      "name": "DSA & CS Fundamentals",
      "topic": "Data Structures & Algorithms",
      "mcqCount": 10,
      "codingCount": 0,
      "marksPerMcq": 1,
      "marksPerCoding": 0,
      "instructions": "Core computer science and algorithm concepts."
    },
    {
      "name": "Coding Problems",
      "topic": "Coding",
      "mcqCount": 0,
      "codingCount": 2,
      "marksPerMcq": 0,
      "marksPerCoding": 10,
      "instructions": "Solve using Python, Java, or C++."
    }
  ]
}`;
};

