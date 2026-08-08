import { GeminiProvider } from "./providers/GeminiProvider.js";
import { GroqProvider } from "./providers/GroqProvider.js";
import { HuggingFaceProvider } from "./providers/HuggingFaceProvider.js";
import {
  buildMcqPrompt,
  buildCodingPrompt,
  buildExplanationPrompt,
  buildBlueprintPrompt,
} from "./utils/promptTemplates.js";
import {
  parseJsonResponse,
  validateMcqQuestions,
  validateCodingQuestions,
  validateExplanation,
  validateBlueprint,
} from "./utils/jsonValidator.js";

export class AIService {
  constructor() {
    this.providers = new Map();

    // Register built-in providers
    this.registerProvider(new GeminiProvider());
    this.registerProvider(new GroqProvider());
    this.registerProvider(new HuggingFaceProvider());
  }

  /**
   * Register a new AI provider module dynamically
   * @param {import('./providers/BaseProvider.js').BaseProvider} provider
   */
  registerProvider(provider) {
    if (!provider || typeof provider.getName !== "function" || typeof provider.generateCompletion !== "function") {
      throw new Error("Invalid provider instance passed to AIService.registerProvider()");
    }
    this.providers.set(provider.getName(), provider);
  }

  /**
   * Returns list of provider execution priority order
   * @returns {string[]}
   */
  getProviderOrder() {
    if (process.env.AI_PROVIDER_ORDER) {
      return process.env.AI_PROVIDER_ORDER.split(",")
        .map((p) => p.trim().toLowerCase())
        .filter((p) => this.providers.has(p));
    }
    return ["gemini", "groq", "huggingface"];
  }

  /**
   * Internal wrapper to attempt prompt generation with automatic fallback across registered providers
   * @private
   */
  async _executeWithFallback(promptBuilderFn, validatorFn, options = {}) {
    const order = this.getProviderOrder();
    const errors = [];

    for (const providerName of order) {
      const provider = this.providers.get(providerName);
      if (!provider || !provider.isAvailable()) {
        console.log(`[AIService] Skipping provider '${providerName}': not available or unconfigured.`);
        continue;
      }

      try {
        console.log(`[AIService] Attempting generation with provider '${providerName}'...`);
        const prompt = promptBuilderFn();
        const rawText = await provider.generateCompletion(prompt, {
          jsonMode: true,
          temperature: options.temperature ?? 0.7,
        });

        const parsed = parseJsonResponse(rawText);
        const validatedData = validatorFn(parsed);

        console.log(`[AIService] Successfully generated output using provider '${providerName}'.`);
        return {
          success: true,
          provider: providerName,
          data: validatedData,
        };
      } catch (err) {
        console.warn(`[AIService] Provider '${providerName}' failed: ${err.message}. Triggering fallback...`);
        errors.push({ provider: providerName, error: err.message });
      }
    }

    throw new Error(
      `All configured AI providers failed. Attempts: ${JSON.stringify(errors)}`
    );
  }

  /**
   * Generates a Test Blueprint from prompt
   */
  async generateTestBlueprint({ prompt }) {
    const res = await this._executeWithFallback(
      () => buildBlueprintPrompt({ prompt }),
      (parsed) => validateBlueprint(parsed)
    );

    return {
      success: true,
      provider: res.provider,
      data: res.data,
    };
  }

  /**
   * Generates Aptitude MCQ questions
   */
  async generateAptitudeQuestions({ topic = "General Quantitative", difficulty = "medium", count = 3, marks = 2 }) {
    const res = await this._executeWithFallback(
      () => buildMcqPrompt({ category: "Aptitude", topic, difficulty, count, marks }),
      (parsed) => validateMcqQuestions(parsed, count)
    );

    return {
      success: true,
      provider: res.provider,
      category: "aptitude",
      data: res.data,
    };
  }

  /**
   * Generates Logical Reasoning MCQ questions
   */
  async generateLogicalQuestions({ topic = "Logical Reasoning", difficulty = "medium", count = 3, marks = 2 }) {
    const res = await this._executeWithFallback(
      () => buildMcqPrompt({ category: "Logical Reasoning", topic, difficulty, count, marks }),
      (parsed) => validateMcqQuestions(parsed, count)
    );

    return {
      success: true,
      provider: res.provider,
      category: "logical",
      data: res.data,
    };
  }

  /**
   * Generates Verbal Ability MCQ questions
   */
  async generateVerbalQuestions({ topic = "Verbal Ability", difficulty = "medium", count = 3, marks = 2 }) {
    const res = await this._executeWithFallback(
      () => buildMcqPrompt({ category: "Verbal Ability", topic, difficulty, count, marks }),
      (parsed) => validateMcqQuestions(parsed, count)
    );

    return {
      success: true,
      provider: res.provider,
      category: "verbal",
      data: res.data,
    };
  }

  /**
   * Generates Coding problems
   */
  async generateCodingQuestions({ topic = "Data Structures & Algorithms", difficulty = "medium", count = 1, marks = 10, languages = ["python", "java", "cpp"] }) {
    const res = await this._executeWithFallback(
      () => buildCodingPrompt({ topic, difficulty, count, marks, languages }),
      (parsed) => validateCodingQuestions(parsed)
    );

    return {
      success: true,
      provider: res.provider,
      category: "coding",
      data: res.data,
    };
  }

  /**
   * Generates step-by-step explanations and feedback
   */
  async generateExplanations({ questionText, options, correctOption, studentAnswer, code, testCases }) {
    const res = await this._executeWithFallback(
      () => buildExplanationPrompt({ questionText, options, correctOption, studentAnswer, code, testCases }),
      (parsed) => validateExplanation(parsed)
    );

    return {
      success: true,
      provider: res.provider,
      data: res.data,
    };
  }
}

// Singleton export
export const aiService = new AIService();
export default aiService;

