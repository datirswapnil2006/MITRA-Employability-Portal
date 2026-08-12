import axios from "axios";
import { BaseProvider } from "./BaseProvider.js";

export class GroqProvider extends BaseProvider {
  constructor() {
    super("groq");
    this.models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"];
  }

  isAvailable() {
    return Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0);
  }

  async generateCompletion(prompt, options = {}) {
    if (!this.isAvailable()) {
      throw new Error("Groq API key (GROQ_API_KEY) is not configured.");
    }

    const apiKey = process.env.GROQ_API_KEY;
    let lastError = null;

    for (const model of this.models) {
      try {
        const payload = {
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 4000,
        };

        if (options.jsonMode) {
          payload.response_format = { type: "json_object" };
        }

        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", payload, {
          timeout: options.timeout ?? 45000,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        });

        const text = response.data?.choices?.[0]?.message?.content;
        if (text && text.trim().length > 0) {
          return text;
        }

        lastError = new Error(`Groq (${model}) returned empty text`);
      } catch (err) {
        const message = err.response?.data?.error?.message || err.message;
        lastError = new Error(`Groq (${model}) error: ${message}`);
      }
    }

    throw lastError || new Error("All Groq model attempts failed");
  }
}
