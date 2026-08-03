
import axios from "axios";
const LANGUAGE_CONFIG = {
  python: "python-3.14",
  java: "openjdk-25",
  cpp: "g++-15",
};

const client = axios.create({
  baseURL: process.env.ONLINECOMPILER_API_URL || "https://api.onlinecompiler.io/api",
  timeout: 35000, // the sync endpoint can block up to 30s
});

// Runs a single source file against one stdin and returns the result.
export const runCode = async ({ sourceCode, language, stdin }) => {
  const compiler = LANGUAGE_CONFIG[language];
  if (!compiler) throw new Error(`Unsupported language: ${language}`);

  const { data } = await client.post(
    "/run-code-sync/",
    {
      compiler,
      code: sourceCode,
      input: stdin || "",
    },
    {
      headers: {
        Authorization: process.env.ONLINECOMPILER_API_KEY || "",
        "Content-Type": "application/json",
      },
    }
  );

  return {
    stdout: (data.output || "").trim(),
    stderr: data.error || "",
    status: data.status || "unknown",
  };
};

// Runs one submission against many test cases sequentially.
export const runAgainstTestCases = async ({ sourceCode, language, testCases }) => {
  const results = [];
  for (const tc of testCases) {
    try {
      const result = await runCode({ sourceCode, language, stdin: tc.input });
      const passed = result.stdout === tc.output.trim();
      let outcome = "passed";
      if (!passed) {
        const statusText = (result.status || "").toLowerCase();
        if (statusText.includes("compil")) {
          outcome = "compile_error";
        } else if (result.stderr && !result.stdout) {
          outcome = statusText.includes("time") || statusText.includes("kill") ? "timeout" : "runtime_error";
        } else {
          outcome = "wrong_answer";
        }
      }

      results.push({
        passed,
        outcome,
        stdout: result.stdout,
        expected: tc.output.trim(),
        stderr: result.stderr,
      });
    } catch (err) {
      results.push({
        passed: false,
        outcome: "runtime_error",
        stdout: "",
        expected: tc.output.trim(),
        stderr: err.response?.data?.error || err.response?.data?.message || err.message,
      });
    }
  }
  return results;
};

export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_CONFIG);