import axios from "axios";
import { BaseProvider } from "./BaseProvider.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class HuggingFaceProvider extends BaseProvider {
  constructor() {
    super("huggingface");
    this.client = axios.create({
      baseURL: "https://router.huggingface.co/v1",
      timeout: 60000,
    });
    this.models = [
      "meta-llama/Llama-3.3-70B-Instruct:fastest",
      "Qwen/Qwen2.5-72B-Instruct:fastest",
      "mistralai/Mistral-7B-Instruct-v0.3:fastest",
    ];
  }

  isAvailable() {
    return Boolean(process.env.HF_TOKEN && process.env.HF_TOKEN.trim().length > 0);
  }

  async generateCompletion(prompt, options = {}) {
    if (!this.isAvailable()) {
      throw new Error("Hugging Face token (HF_TOKEN) is not configured.");
    }

    let lastError = null;

    for (const model of this.models) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await this.client.post(
            "/chat/completions",
            {
              model,
              messages: [{ role: "user", content: prompt }],
              temperature: options.temperature ?? 0.7,
              max_tokens: options.maxTokens ?? 4000,
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.HF_TOKEN}`,
                "Content-Type": "application/json",
              },
            }
          );

          const text = response.data?.choices?.[0]?.message?.content;
          if (text && text.trim().length > 0) {
            return text;
          }

          lastError = new Error(`HuggingFace (${model}) returned empty response`);
        } catch (err) {
          lastError = err;
          if (err.response?.status === 503 && attempt === 0) {
            await sleep(3000); // retry cold start
            continue;
          }
          break; // move to next model
        }
      }
    }

    const errorMsg = lastError?.response?.data?.error || lastError?.message || "Unknown error";
    throw new Error(`Hugging Face provider error: ${errorMsg}`);
  }
}
