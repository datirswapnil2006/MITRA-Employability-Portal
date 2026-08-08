import fs from "fs";
import { createRequire } from "module";
import Test from "../models/Test.js";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

// @route POST /api/questions/extract-pdf   (admin)
// Accepts a PDF upload, extracts text, then uses the AI service to
// parse questions from it. Returns drafts (same shape as AI generator).
export const extractQuestionsFromPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No PDF file uploaded" });
    }

    const { testId, topic, subtopic, type, difficulty, marks } = req.body;
    let category = "General";

    if (testId) {
      const test = await Test.findById(testId);
      if (test) {
        category = test.category;
      }
    }

    // Read and parse the uploaded PDF
    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdf(dataBuffer);
    const extractedText = pdfData.text;
    const filename = req.file.originalname || "Uploaded PDF";

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    if (!extractedText || extractedText.trim().length < 20) {
      return res.status(400).json({
        message: "Could not extract meaningful text from the PDF. Ensure it's a text-based PDF (not a scanned image).",
      });
    }

    // Truncate to first ~6000 chars to stay within model context limits
    const truncatedText = extractedText.slice(0, 6000);

    // Use AI to parse questions from the extracted text
    const drafts = await parseQuestionsWithAI({
      text: truncatedText,
      category: topic || category,
      type: type || "mcq",
      difficulty: difficulty || "Medium",
      marks: Number(marks) || 2,
    });

    if (drafts.length === 0) {
      return res.status(502).json({
        message: "AI could not extract any usable questions from this PDF. Try a different document or use manual entry.",
      });
    }

    const enrichedDrafts = drafts.map((d) => ({
      ...d,
      topic: d.topic || topic || category || "General",
      subtopic: d.subtopic || subtopic || "",
      explanation: d.explanation || "",
      sourcePdf: filename,
      source: "pdf",
      status: "pending_review",
    }));

    res.json({ drafts: enrichedDrafts, extractedText: truncatedText.slice(0, 500) + "…" });
  } catch (err) {
    // Clean up file if it exists
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    res.status(500).json({
      message: "Failed to extract questions from PDF",
      error: err.message,
    });
  }
};

// Internal: sends extracted PDF text to HF AI for question parsing
async function parseQuestionsWithAI({ text, category, type, difficulty, marks }) {
  const axios = (await import("axios")).default;

  const client = axios.create({
    baseURL: "https://router.huggingface.co/v1",
    timeout: 60000,
  });

  const MODEL_CANDIDATES = [
    "meta-llama/Llama-3.3-70B-Instruct:fastest",
    "Qwen/Qwen2.5-72B-Instruct:fastest",
    "mistralai/Mistral-7B-Instruct-v0.3:fastest",
  ];

  const prompt = type === "mcq"
    ? `Extract multiple-choice questions from the following text content. If the text already contains questions, convert them to the format below. If it contains educational content, generate questions BASED ON the content.

TEXT CONTENT:
${text}

Category/Topic: ${category}
Difficulty: ${difficulty}
Marks per question: ${marks}

Return ONLY a raw JSON array, no markdown code fences, no commentary before or after.
Each item must have exactly this shape:
{
  "type": "mcq",
  "questionText": string,
  "topic": "${category}",
  "subtopic": string,
  "marks": ${marks},
  "difficulty": "${difficulty}",
  "options": string[] (exactly 4 options),
  "correctOptionIndex": number (0-based index of the single correct option),
  "explanation": string
}`
    : `Extract coding problems from the following text content. If the text already contains problems, convert them to the format below. If it contains educational content, generate coding problems BASED ON the content.

TEXT CONTENT:
${text}

Category/Topic: ${category}
Difficulty: ${difficulty}
Marks per question: ${marks}

Return ONLY a raw JSON array, no markdown code fences, no commentary before or after.
Each item must have exactly this shape:
{
  "type": "coding",
  "questionText": string (clear problem statement),
  "topic": "${category}",
  "subtopic": string,
  "marks": ${marks},
  "difficulty": "${difficulty}",
  "languages": ["python", "java", "cpp"],
  "inputFormat": string,
  "outputFormat": string,
  "constraints": string,
  "explanation": string,
  "sampleTestCases": [{ "input": string, "output": string }] (1-2 cases),
  "hiddenTestCases": [{ "input": string, "output": string }] (3-5 cases)
}`;

  let lastError;
  for (const model of MODEL_CANDIDATES) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { data } = await client.post(
          "/chat/completions",
          {
            model,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5,
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
        if (responseText.trim()) {
          const match = responseText.match(/\[[\s\S]*\]/);
          if (!match) throw new Error("AI response did not contain a JSON array");
          const drafts = JSON.parse(match[0]);
          return drafts.filter((d) => {
            if (d.type === "mcq") {
              return d.questionText && Array.isArray(d.options) && d.options.length >= 2 && typeof d.correctOptionIndex === "number";
            }
            if (d.type === "coding") {
              return d.questionText && Array.isArray(d.languages) && Array.isArray(d.sampleTestCases);
            }
            return false;
          });
        }
        lastError = new Error(`Empty response from ${model}`);
      } catch (err) {
        lastError = err;
        if (err.response?.status === 503 && attempt === 0) {
          await new Promise((r) => setTimeout(r, 3000));
          continue;
        }
        break;
      }
    }
  }
  throw lastError || new Error("All Hugging Face model candidates failed");
}
