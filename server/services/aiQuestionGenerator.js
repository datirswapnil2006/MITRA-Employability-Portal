// Drafts test questions using Hugging Face's Inference Providers API — a
// free, no-credit-card tier (rate-limited, but sufficient for occasional
// admin use). This never writes to the database — it only returns draft
// JSON for an admin to review, edit, and explicitly save through the normal
// question-creation endpoint. That review step is intentional: the AI's
// output (especially expected outputs on hidden test cases) is not
// guaranteed correct and must be checked by a human before it can ever
// grade a student.
import axios from "axios";

const client = axios.create({
  baseURL: "https://router.huggingface.co/v1",
  timeout: 60000,
});

// A short fallback chain rather than one hardcoded model: if a given model
// is unavailable, overloaded, or not currently routed to a free provider,
// the next candidate is tried automatically. The ":fastest" suffix lets HF
// pick whichever backing provider is quickest for that model, instead of
// pinning to one specific provider that might be down or paid-only.
const MODEL_CANDIDATES = [
  "meta-llama/Llama-3.3-70B-Instruct:fastest",
  "Qwen/Qwen2.5-72B-Instruct:fastest",
  "mistralai/Mistral-7B-Instruct-v0.3:fastest",
];

const buildPrompt = ({ type, category, topic, difficulty, marks, count, languages }) => {
  if (type === "mcq") {
    return `Generate ${count} multiple-choice question(s) for a college placement assessment.
Category: ${category}
Topic: ${topic}
Difficulty: ${difficulty}
Marks per question: ${marks}

Return ONLY a raw JSON array, no markdown code fences, no commentary before or after.
Each item must have exactly this shape:
{
  "type": "mcq",
  "questionText": string,
  "marks": ${marks},
  "difficulty": "${difficulty}",
  "options": string[] (exactly 4 options),
  "correctOptionIndex": number (0-based index of the single correct option)
}`;
  }

  const langList = languages && languages.length ? languages : ["python", "java", "cpp"];
  return `Generate ${count} coding problem(s) for a college placement assessment.
Category: ${category}
Topic: ${topic}
Difficulty: ${difficulty}
Marks per question: ${marks}
Target languages: ${langList.join(", ")}

Each problem must be solvable by reading input from stdin and printing the answer to stdout
(no function-signature-only problems). Return ONLY a raw JSON array, no markdown code fences,
no commentary before or after. Each item must have exactly this shape:
{
  "type": "coding",
  "questionText": string (clear problem statement, constraints, and one worked example),
  "marks": ${marks},
  "difficulty": "${difficulty}",
  "languages": ${JSON.stringify(langList)},
  "sampleTestCases": [{ "input": string, "output": string }] (1-2 simple illustrative cases),
  "hiddenTestCases": [{ "input": string, "output": string }] (3-5 cases covering edge cases)
}
Every "output" value must be EXACTLY what correct code would print for the paired "input" —
double-check formatting, spacing, and casing before including it.`;
};

const extractJsonArray = (text) => {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("AI response did not contain a JSON array");
  return JSON.parse(match[0]);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Tries each candidate model in turn. A 503 on Hugging Face usually means
// "model is cold, warming up" — worth one short retry before giving up on
// that candidate and moving to the next.
const askAI = async (prompt) => {
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
        const text = data.choices?.[0]?.message?.content || "";
        if (text.trim()) return text;
        lastError = new Error(`Empty response from ${model}`);
      } catch (err) {
        lastError = err;
        if (err.response?.status === 503 && attempt === 0) {
          await sleep(3000); // model likely cold-starting — give it one retry
          continue;
        }
        break; // any other error: stop retrying this model, try the next one
      }
    }
  }

  throw lastError || new Error("All Hugging Face model candidates failed");
};

export const generateQuestionDrafts = async ({ type, category, topic, difficulty, marks, count, languages }) => {
  if (!process.env.HF_TOKEN) {
    throw new Error("HF_TOKEN is not configured on the server");
  }

  const prompt = buildPrompt({ type, category, topic, difficulty, marks, count, languages });
  const text = await askAI(prompt);
  const drafts = extractJsonArray(text);

  // Basic shape validation so a malformed draft can't silently reach the admin UI.
  return drafts.filter((d) => {
    if (d.type === "mcq") {
      return d.questionText && Array.isArray(d.options) && d.options.length >= 2 && typeof d.correctOptionIndex === "number";
    }
    if (d.type === "coding") {
      return d.questionText && Array.isArray(d.languages) && Array.isArray(d.sampleTestCases) && Array.isArray(d.hiddenTestCases);
    }
    return false;
  });
};