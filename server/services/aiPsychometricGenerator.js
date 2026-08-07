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
  questionType,
  count,
  seniorityLevel,
  difficulty = "Intermediate",
  language = "English",
  includeReverseScored = true,
  customPrompt = "",
}) => {
  const traitsFormatted = targetTraits
    .map((t) => `- Key: "${t.key}", Name: "${t.name}" (Desc: ${t.description || "N/A"})`)
    .join("\n");

  const traitKeysList = targetTraits.map((t) => `"${t.key}"`).join(", ");

  return `You are an expert Organizational Psychologist and Behavioral Assessment Designer.
Generate exactly ${count} psychometric & behavioral assessment question(s) for candidate evaluation.

ASSESSMENT METADATA:
- Category: ${category}
- Seniority Level / Target Audience: ${seniorityLevel || "Entry-Level Campus Recruitment"}
- Difficulty Level: ${difficulty}
- Language: ${language}
- Question Format Style: ${questionType || "mixed"}
- Include Reverse Scored Questions: ${includeReverseScored ? "Yes, balance positive & reverse-scored items where appropriate" : "No, only positive-scored"}
${customPrompt ? `- Custom Guidelines: ${customPrompt}` : ""}

TARGET TRAITS TO EVALUATE:
${traitsFormatted}

CRITICAL RULES:
1. THIS IS STRICTLY A PSYCHOMETRIC & BEHAVIORAL TEST. DO NOT generate math, coding, logical reasoning, or general knowledge questions.
2. Every item must measure behavioral tendencies, personality traits, emotional intelligence, or situational decision making.
3. Assign each question a "traitKey" selected strictly from this allowed set: [ ${traitKeysList} ].
4. Set "isReverseScored" to true if higher agreement or selection indicates a lower level of the trait.
5. All text output must be in ${language}.

FORMAT SPECIFICATION:
Return ONLY a raw JSON array. Do not include markdown formatting, backticks (\`\`\`json), or preamble.
Each element must match one of these shapes:

Shape for "likert":
{
  "type": "likert",
  "questionText": "Clear self-report behavioral statement",
  "traitKey": "allowed_trait_key",
  "isReverseScored": boolean,
  "situationContext": "",
  "options": []
}

Shape for "forced_choice":
{
  "type": "forced_choice",
  "questionText": "Which statement best describes your workplace behavior?",
  "traitKey": "allowed_trait_key",
  "isReverseScored": false,
  "situationContext": "",
  "options": [
    { "optionText": "Statement representing high trait level", "traitKey": "allowed_trait_key", "score": 5 },
    { "optionText": "Statement representing low trait level or alternative behavior", "traitKey": "allowed_trait_key", "score": 1 }
  ]
}

Shape for "situational_judgment":
{
  "type": "situational_judgment",
  "questionText": "What would be your most effective action in this situation?",
  "traitKey": "allowed_trait_key",
  "isReverseScored": false,
  "situationContext": "Detailed workplace conflict or pressure scenario (2-3 sentences)",
  "options": [
    { "optionText": "Optimal action choice", "traitKey": "allowed_trait_key", "score": 5 },
    { "optionText": "Moderately effective choice", "traitKey": "allowed_trait_key", "score": 3 },
    { "optionText": "Ineffective or counterproductive choice", "traitKey": "allowed_trait_key", "score": 1 }
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

export const generatePsychometricDrafts = async ({
  category,
  targetTraits,
  questionType = "mixed",
  count = 5,
  seniorityLevel = "Entry-Level Campus Recruitment",
  difficulty = "Intermediate",
  language = "English",
  includeReverseScored = true,
  customPrompt = "",
  modelPreference = "auto",
}) => {
  if (!Array.isArray(targetTraits) || targetTraits.length === 0) {
    throw new Error("Target traits are required for AI psychometric question generation");
  }

  const prompt = buildPsychometricPrompt({
    category,
    targetTraits,
    questionType,
    count: Math.min(20, Math.max(1, Number(count) || 5)),
    seniorityLevel,
    difficulty,
    language,
    includeReverseScored,
    customPrompt,
  });

  let rawText = "";

  // Try Multi-provider AI service if specific provider chosen or auto mode
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

  const drafts = extractJsonArray(rawText);
  const validTraitKeys = new Set(targetTraits.map((t) => t.key));
  const fallbackTraitKey = targetTraits[0].key;

  return drafts.filter((d) => {
    if (!d.questionText || typeof d.questionText !== "string") return false;
    if (!d.traitKey || !validTraitKeys.has(d.traitKey)) {
      d.traitKey = fallbackTraitKey;
    }
    if (!["likert", "forced_choice", "situational_judgment"].includes(d.type)) {
      d.type = "likert";
    }
    d.isReverseScored = Boolean(d.isReverseScored);
    d.situationContext = d.situationContext || "";
    d.options = Array.isArray(d.options) ? d.options : [];
    return true;
  });
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
