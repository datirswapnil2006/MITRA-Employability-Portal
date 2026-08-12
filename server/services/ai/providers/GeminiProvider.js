import axios from "axios";
import { BaseProvider } from "./BaseProvider.js";

export class GeminiProvider extends BaseProvider {
  constructor() {
    super("gemini");
    this.models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro"];
  }

  isAvailable() {
    return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
  }

  async generateCompletion(prompt, options = {}) {
    if (!this.isAvailable()) {
      throw new Error("Gemini API key (GEMINI_API_KEY) is not configured.");
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let lastError = null;

    for (const model of this.models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await axios.post(
          url,
          {
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: options.temperature ?? 0.7,
              maxOutputTokens: options.maxTokens ?? 4000,
              responseMimeType: options.jsonMode ? "application/json" : "text/plain",
            },
          },
          {
            timeout: options.timeout ?? 45000,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 0) {
          return text;
        }

        lastError = new Error(`Gemini (${model}) returned empty text`);
      } catch (err) {
        const message = err.response?.data?.error?.message || err.message;
        lastError = new Error(`Gemini (${model}) error: ${message}`);
      }
    }

    throw lastError || new Error("All Gemini model attempts failed");
  }
}
