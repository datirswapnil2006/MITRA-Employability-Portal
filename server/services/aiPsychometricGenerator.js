import axios from "axios";
import { AIService } from "./ai/AIService.js";

const aiServiceInstance = new AIService();

const client = axios.create({
  baseURL: "https://router.huggingface.co/v1",
  timeout: 60000,
});

const MODEL_CANDIDATES = [
  "meta-llama/Llama-3.3-70B-Instruct:fastest",
  "Qwen/Qwen2.5-72B-Instruct:fastest",
  "mistralai/Mistral-7B-Instruct-v0.3:fastest",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildPsychometricPrompt = ({
  category,
  targetTraits,
  questionType = "mixed",
  count = 10,
  seniorityLevel = "Entry-Level Campus Recruitment",
  difficulty = "Intermediate",
  language = "English",
  autoBalanceTraits = true,
  includeReverseScored = true,
  customPrompt = "",
  avoidQuestionTexts = [],
}) => {
  const traitKeysList = targetTraits.map((t) => `"${t.key}"`).join(", ");

  // Calculate trait distribution allocation
  let traitAllocationText = "";
  if (autoBalanceTraits && targetTraits.length > 0) {
    const numTraits = targetTraits.length;
    const basePerTrait = Math.floor(count / numTraits);
    let remainder = count % numTraits;

    const allocations = targetTraits.map((t) => {
      const traitCount = basePerTrait + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;
      return `- Key "${t.key}" (${t.name}): ${traitCount} question(s)`;
    });

    traitAllocationText = `REQUIRED TRAIT QUESTION ALLOCATION:\n${allocations.join("\n")}\nYou MUST generate exactly the requested question count per trait as specified above.`;
  } else {
    const traitsFormatted = targetTraits
      .map((t) => `- Key: "${t.key}", Name: "${t.name}" (Desc: ${t.description || "N/A"})`)
      .join("\n");
    traitAllocationText = `TARGET TRAITS TO EVALUATE:\n${traitsFormatted}`;
  }

  // Calculate format distribution for mixed
  let formatDistributionText = "";
  if (questionType === "mixed") {
    const likertCount = Math.ceil(count * 0.4);
    const forcedChoiceCount = Math.floor(count * 0.3);
    const sjtCount = count - likertCount - forcedChoiceCount;
    formatDistributionText = `FORMAT MIXED DISTRIBUTION REQUIREMENT:
- Likert Scale ("likert"): approximately ${likertCount} questions
- Forced Choice Pairs ("forced_choice"): approximately ${forcedChoiceCount} questions
- Situational Judgment ("situational_judgment"): approximately ${sjtCount} questions`;
  } else if (questionType === "likert") {
    formatDistributionText = `FORMAT REQUIREMENT: Every single generated question must be of type "likert".`;
  } else if (questionType === "forced_choice") {
    formatDistributionText = `FORMAT REQUIREMENT: Every single generated question must be of type "forced_choice".`;
  } else if (questionType === "situational_judgment") {
    formatDistributionText = `FORMAT REQUIREMENT: Every single generated question must be of type "situational_judgment".`;
  }

  const avoidText = avoidQuestionTexts.length > 0
    ? `DO NOT DUPLICATE OR REPEAT ANY OF THESE EXISTING QUESTIONS:\n${avoidQuestionTexts.map((q) => `- "${q}"`).join("\n")}`
    : "";

  return `You are an expert Organizational Psychologist and Behavioral Assessment Designer.
Generate EXACTLY ${count} high-quality psychometric & behavioral assessment question(s) for candidate evaluation.

ASSESSMENT METADATA:
- Category: ${category}
- Seniority Level / Target Audience: ${seniorityLevel}
- Difficulty Level: ${difficulty}
- Language: ${language}
- Question Format: ${questionType}
- Reverse-Score Balancing: ${includeReverseScored ? "Yes, automatically include balanced reverse-scored items where appropriate" : "No"}
${customPrompt ? `- Custom Admin Instructions: ${customPrompt}` : ""}

${traitAllocationText}

${formatDistributionText}

${avoidText}

CRITICAL PSYCHOMETRIC RULES:
1. THIS IS STRICTLY A PSYCHOMETRIC & BEHAVIORAL TEST. DO NOT generate math, coding, general knowledge, or aptitude questions.
2. Every item must evaluate behavioral tendencies, personality traits, emotional intelligence, or situational decision making.
3. Assign each question a "traitKey" selected strictly from allowed set: [ ${traitKeysList} ].
4. All text output must be in ${language}.
5. For Likert items ("likert"):
   - Provide a clear self-report statement.
   - If "isReverseScored" is true, agreement indicates a LOWER level of the trait.
   - Include options array as standard 5-point scale or empty array (the system auto-maps 5-point scale: Strongly Disagree to Strongly Agree).
6. For Forced Choice items ("forced_choice"):
   - Provide 2 realistic behavioral statements in options array:
     Option 1: { "optionText": "Statement indicating high trait level", "traitKey": "allowed_trait_key", "score": 5 }
     Option 2: { "optionText": "Statement indicating alternative or lower trait level", "traitKey": "allowed_trait_key", "score": 1 }
   - Social Desirability Rule: Avoid making one choice obviously more desirable than the other. Both choices should feel realistic and professional.
7. For Situational Judgment items ("situational_judgment"):
   - Provide a detailed 2-3 sentence scenario context in "situationContext".
   - Provide 3 or 4 response options with varying effectiveness scores (e.g. 5 for optimal, 3 for moderate, 1 for counterproductive).

FORMAT SPECIFICATION:
Return ONLY a raw JSON array. Do not include markdown formatting, backticks (\`\`\`json), or preamble text.

JSON SHAPES:
Shape for "likert":
{
  "type": "likert",
  "questionText": "Clear self-report statement",
  "traitKey": "allowed_trait_key",
  "isReverseScored": boolean,
  "situationContext": "",
  "options": [
    { "optionText": "Strongly Disagree", "score": 1 },
    { "optionText": "Disagree", "score": 2 },
    { "optionText": "Neutral", "score": 3 },
    { "optionText": "Agree", "score": 4 },
    { "optionText": "Strongly Agree", "score": 5 }
  ]
}

Shape for "forced_choice":
{
  "type": "forced_choice",
  "questionText": "Which statement best describes your workplace behavior?",
  "traitKey": "allowed_trait_key",
  "isReverseScored": false,
  "situationContext": "",
  "options": [
    { "optionText": "First realistic behavioral statement", "traitKey": "allowed_trait_key", "score": 5 },
    { "optionText": "Second realistic behavioral statement", "traitKey": "allowed_trait_key", "score": 1 }
  ]
}

Shape for "situational_judgment":
{
  "type": "situational_judgment",
  "questionText": "What would be your most effective response in this scenario?",
  "traitKey": "allowed_trait_key",
  "isReverseScored": false,
  "situationContext": "Detailed workplace or team crisis scenario...",
  "options": [
    { "optionText": "Optimal action choice", "traitKey": "allowed_trait_key", "score": 5 },
    { "optionText": "Moderately effective choice", "traitKey": "allowed_trait_key", "score": 3 },
    { "optionText": "Counterproductive choice", "traitKey": "allowed_trait_key", "score": 1 }
  ]
}`;
};

const extractJsonArray = (text) => {
  const match = text.match(/\[[\s\S]*\]/);
  if (match) return JSON.parse(match[0]);
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    const parsed = JSON.parse(objMatch[0]);
    if (Array.isArray(parsed)) return parsed;
    if (parsed.questions && Array.isArray(parsed.questions)) return parsed.questions;
    if (parsed.drafts && Array.isArray(parsed.drafts)) return parsed.drafts;
    return [parsed];
  }
  throw new Error("AI response did not contain a valid JSON array or object");
};

const askHuggingFace = async (prompt) => {
  let lastError;
  for (const model of MODEL_CANDIDATES) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { data } = await client.post(
          "/chat/completions",
          {
            model,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 4000,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.HF_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );
        const responseText = data.choices?.[0]?.message?.content || "";
        if (responseText.trim()) return responseText;
        lastError = new Error(`Empty response from ${model}`);
      } catch (err) {
        lastError = err;
        if (err.response?.status === 503 && attempt === 0) {
          await sleep(3000);
          continue;
        }
        break;
      }
    }
  }
  throw lastError || new Error("All Hugging Face model candidates failed");
};

const executeCompletion = async (prompt, modelPreference = "auto") => {
  let rawText = "";
  if (modelPreference !== "huggingface") {
    try {
      const res = await aiServiceInstance._executeWithFallback(
        () => prompt,
        (parsed) => parsed,
        { temperature: 0.7 }
      );
      if (res && res.data) {
        rawText = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
      }
    } catch (err) {
      console.warn("[aiPsychometricGenerator] Multi-provider AIService attempt failed. Fallback to HF API:", err.message);
    }
  }

  if (!rawText && process.env.HF_TOKEN) {
    rawText = await askHuggingFace(prompt);
  }

  if (!rawText) {
    throw new Error("Failed to generate AI questions across available providers.");
  }

  return rawText;
};

export const generatePsychometricDrafts = async ({
  category,
  targetTraits,
  questionType = "mixed",
  count = 10,
  seniorityLevel = "Entry-Level Campus Recruitment",
  difficulty = "Intermediate",
  language = "English",
  autoBalanceTraits = true,
  includeReverseScored = true,
  customPrompt = "",
  modelPreference = "auto",
}) => {
  const reqCount = Number(count);
  if (isNaN(reqCount) || reqCount < 1 || reqCount > 50) {
    throw new Error("Question count must be between 1 and 50.");
  }

  if (!Array.isArray(targetTraits) || targetTraits.length === 0) {
    throw new Error("Target traits are required for AI psychometric question generation");
  }

  const validTraitKeys = new Set(targetTraits.map((t) => t.key));
  const fallbackTraitKey = targetTraits[0].key;

  const sanitizeDraftItems = (drafts) => {
    return drafts.filter((d) => {
      if (!d || typeof d !== "object") return false;
      if (!d.questionText || typeof d.questionText !== "string" || !d.questionText.trim()) return false;
      if (!d.traitKey || !validTraitKeys.has(d.traitKey)) {
        d.traitKey = fallbackTraitKey;
      }
      if (!["likert", "forced_choice", "situational_judgment"].includes(d.type)) {
        d.type = questionType !== "mixed" && ["likert", "forced_choice", "situational_judgment"].includes(questionType)
          ? questionType
          : "likert";
      }
      d.isReverseScored = Boolean(d.isReverseScored);
      d.situationContext = d.situationContext || "";
      if (Array.isArray(d.options)) {
        d.options = d.options.map((opt, idx) => {
          if (typeof opt === "string") {
            return {
              optionText: opt.trim(),
              traitKey: d.traitKey || "",
              score: idx + 1,
            };
          }
          if (opt && typeof opt === "object") {
            return {
              optionText: (opt.optionText || opt.text || String(opt)).trim(),
              traitKey: opt.traitKey || d.traitKey || "",
              score: typeof opt.score === "number" ? opt.score : idx + 1,
            };
          }
          return {
            optionText: String(opt).trim(),
            traitKey: d.traitKey || "",
            score: idx + 1,
          };
        });
      } else {
        d.options = [];
      }
      return true;
    });
  };

  const accumulatedQuestions = [];
  const seenTexts = new Set();
  let maxRetries = 3;

  while (accumulatedQuestions.length < reqCount && maxRetries > 0) {
    const missingCount = reqCount - accumulatedQuestions.length;
    const prompt = buildPsychometricPrompt({
      category,
      targetTraits,
      questionType,
      count: missingCount,
      seniorityLevel,
      difficulty,
      language,
      autoBalanceTraits,
      includeReverseScored,
      customPrompt,
      avoidQuestionTexts: Array.from(seenTexts),
    });

    try {
      const rawText = await executeCompletion(prompt, modelPreference);
      const parsedDrafts = extractJsonArray(rawText);
      const validDrafts = sanitizeDraftItems(parsedDrafts);

      let addedInThisBatch = 0;
      for (const d of validDrafts) {
        const normText = d.questionText.trim().toLowerCase();
        if (!seenTexts.has(normText)) {
          seenTexts.add(normText);
          accumulatedQuestions.push(d);
          addedInThisBatch++;
          if (accumulatedQuestions.length >= reqCount) break;
        }
      }

      if (addedInThisBatch === 0) {
        maxRetries--;
      }
    } catch (err) {
      console.warn(`[aiPsychometricGenerator] Draft generation attempt failed (retries left ${maxRetries - 1}):`, err.message);
      maxRetries--;
      if (accumulatedQuestions.length === 0 && maxRetries === 0) {
        throw err;
      }
    }
  }

  // Never return more questions than requested
  return accumulatedQuestions.slice(0, reqCount);
};

export const regenerateSingleQuestion = async ({
  category,
  targetTraits,
  existingQuestion,
  difficulty = "Intermediate",
  language = "English",
  modelPreference = "auto",
}) => {
  const traitsToUse = targetTraits && targetTraits.length > 0
    ? targetTraits
    : [{ key: existingQuestion.traitKey || "openness", name: existingQuestion.traitKey || "Openness" }];

  const singleDrafts = await generatePsychometricDrafts({
    category,
    targetTraits: traitsToUse,
    questionType: existingQuestion.type || "likert",
    count: 1,
    difficulty,
    language,
    modelPreference,
    customPrompt: `Regenerate a distinct, high-quality variation of this question: "${existingQuestion.questionText}". Do not duplicate the exact wording.`,
  });

  return singleDrafts[0] || null;
};
