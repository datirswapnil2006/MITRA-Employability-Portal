/**
 * Base Abstract Class for AI Providers in MITRA Employability Portal
 */
export class BaseProvider {
  /**
   * @param {string} name - Unique identifier for the provider (e.g. 'gemini', 'groq', 'huggingface')
   */
  constructor(name) {
    if (new.target === BaseProvider) {
      throw new TypeError("Cannot instantiate abstract class BaseProvider directly");
    }
    this.name = name;
  }

  /**
   * Returns the provider identifier
   * @returns {string}
   */
  getName() {
    return this.name;
  }

  /**
   * Checks whether the required API key / configuration is present
   * @returns {boolean}
   */
  isAvailable() {
    throw new Error("Method 'isAvailable()' must be implemented");
  }

  /**
   * Sends prompt to the provider and returns raw generated text
   * @param {string} prompt - Prompt string
   * @param {object} [options] - Additional provider options (e.g. systemInstruction, temperature)
   * @returns {Promise<string>}
   */
  async generateCompletion(prompt, options = {}) {
    throw new Error("Method 'generateCompletion(prompt, options)' must be implemented");
  }
}
