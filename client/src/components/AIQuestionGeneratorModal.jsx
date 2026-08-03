import { useState } from "react";
import { generateQuestions } from "../api/tests";

const LANGUAGES = ["java", "python", "cpp"];
const LANGUAGE_LABEL = { java: "Java", python: "Python", cpp: "C++" };

const label = "block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5";
const input =
  "w-full px-3 py-2.5 border-[1.5px] border-line rounded bg-white text-sm text-ink outline-none focus:border-accent transition-colors";
const ghostBtn = "border-[1.5px] border-line rounded px-4 py-2 font-semibold text-[13px] text-ink hover:border-accent transition-colors";

export default function AIQuestionGeneratorModal({ testId, onDrafts, onClose }) {
  const [type, setType] = useState("mcq");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [marks, setMarks] = useState(2);
  const [count, setCount] = useState(3);
  const [languages, setLanguages] = useState(["python", "java", "cpp"]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleLanguage = (lang) =>
    setLanguages((prev) => (prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!topic.trim()) {
      setError("Enter a topic — e.g. \"Arrays\", \"Percentages\", \"Polymorphism\", \"Binary Search\".");
      return;
    }
    setLoading(true);
    try {
      const { drafts } = await generateQuestions(testId, {
        type,
        topic,
        difficulty,
        marks: Number(marks),
        count: Number(count),
        languages: type === "coding" ? languages : undefined,
      });
      onDrafts(drafts);
    } catch (err) {
      setError(err.response?.data?.message || "Could not generate questions. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-desk/60 flex items-center justify-center p-6 z-50" onClick={onClose}>
      <div className="bg-surface rounded max-w-[560px] w-full max-h-[88vh] overflow-y-auto p-8" onClick={(e) => e.stopPropagation()}>
        <div className="font-mono text-[11px] tracking-widest uppercase text-accent mb-1.5">AI-Assisted Drafting</div>
        <h2 className="font-display text-xl font-semibold mt-0 mb-1.5">Generate Questions</h2>
        <p className="text-ink-soft text-[13px] mb-5">
          Drafts are generated for your review — nothing is added to the test until you edit and save each one.
        </p>

        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger text-[13px] px-3 py-2.5 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex gap-1.5 mb-4">
            <button
              type="button"
              onClick={() => setType("mcq")}
              className={`px-4 py-2 border-[1.5px] rounded text-[13px] font-semibold transition-colors ${
                type === "mcq" ? "border-accent text-ink bg-accent/5" : "border-line text-ink-soft"
              }`}
            >
              MCQ
            </button>
            <button
              type="button"
              onClick={() => setType("coding")}
              className={`px-4 py-2 border-[1.5px] rounded text-[13px] font-semibold transition-colors ${
                type === "coding" ? "border-accent text-ink bg-accent/5" : "border-line text-ink-soft"
              }`}
            >
              Coding
            </button>
          </div>

          <div className="mb-4">
            <label className={label}>Topic (any topic within this test's category)</label>
            <input
              className={input}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder='e.g. "Arrays", "Percentages", "Polymorphism", "Binary Search"'
            />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className={label}>Difficulty</label>
              <select className={input} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
            <div>
              <label className={label}>Marks each</label>
              <input type="number" min={1} className={input} value={marks} onChange={(e) => setMarks(e.target.value)} />
            </div>
            <div>
              <label className={label}>How many</label>
              <input type="number" min={1} max={5} className={input} value={count} onChange={(e) => setCount(e.target.value)} />
            </div>
          </div>

          {type === "coding" && (
            <div className="mb-4">
              <label className={label}>Languages</label>
              <div className="flex gap-2 flex-wrap">
                {LANGUAGES.map((lang) => (
                  <button
                    type="button"
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border-[1.5px] transition-colors ${
                      languages.includes(lang) ? "border-accent text-ink bg-accent/5" : "border-line text-ink-soft"
                    }`}
                  >
                    {LANGUAGE_LABEL[lang]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2.5 mt-6">
            <button type="button" onClick={onClose} className={ghostBtn}>Cancel</button>
            <button
              type="submit"
              disabled={loading}
              className="bg-accent text-white rounded px-4.5 py-2.5 font-semibold text-[13.5px] hover:bg-accent-hover disabled:opacity-60 transition-colors"
            >
              {loading ? "Generating…" : "Generate drafts"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
