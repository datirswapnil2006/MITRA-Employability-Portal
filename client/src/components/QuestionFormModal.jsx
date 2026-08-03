import { useState } from "react";

const LANGUAGES = ["java", "python", "cpp"];
const LANGUAGE_LABEL = { java: "Java", python: "Python", cpp: "C++" };

const label = "block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5";
const input =
  "w-full px-3 py-2.5 border-[1.5px] border-line rounded bg-white text-sm text-ink outline-none focus:border-accent transition-colors";
const ghostBtn =
  "border-[1.5px] border-line rounded px-4 py-2 font-semibold text-[13px] text-ink hover:border-accent transition-colors";
const dangerBtn =
  "border-[1.5px] border-danger/40 text-danger rounded px-3.5 py-2 font-semibold text-xs hover:bg-danger/10 transition-colors";

const emptyMcq = () => ({
  type: "mcq",
  questionText: "",
  marks: 1,
  difficulty: "Medium",
  options: ["", ""],
  correctOptionIndex: 0,
});

const emptyCoding = () => ({
  type: "coding",
  questionText: "",
  marks: 5,
  difficulty: "Medium",
  languages: ["python"],
  sampleTestCases: [{ input: "", output: "" }],
  hiddenTestCases: [{ input: "", output: "" }],
});

export default function QuestionFormModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ? { ...initial } : emptyMcq());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const setType = (type) => setForm(type === "mcq" ? emptyMcq() : emptyCoding());
  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const updateOption = (idx, value) =>
    setForm((f) => ({ ...f, options: f.options.map((o, i) => (i === idx ? value : o)) }));
  const addOption = () => setForm((f) => ({ ...f, options: [...f.options, ""] }));
  const removeOption = (idx) =>
    setForm((f) => ({
      ...f,
      options: f.options.filter((_, i) => i !== idx),
      correctOptionIndex: f.correctOptionIndex === idx ? 0 : f.correctOptionIndex,
    }));

  const toggleLanguage = (lang) =>
    setForm((f) => ({
      ...f,
      languages: f.languages.includes(lang)
        ? f.languages.filter((l) => l !== lang)
        : [...f.languages, lang],
    }));

  const updateCase = (bucket, idx, key, value) =>
    setForm((f) => ({
      ...f,
      [bucket]: f[bucket].map((c, i) => (i === idx ? { ...c, [key]: value } : c)),
    }));
  const addCase = (bucket) =>
    setForm((f) => ({ ...f, [bucket]: [...f[bucket], { input: "", output: "" }] }));
  const removeCase = (bucket, idx) =>
    setForm((f) => ({ ...f, [bucket]: f[bucket].filter((_, i) => i !== idx) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSave({ ...form, marks: Number(form.marks) });
    } catch (err) {
      setError(err.response?.data?.message || "Could not save question");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-desk/60 flex items-center justify-center p-6 z-50" onClick={onClose}>
      <div
        className="bg-surface rounded max-w-[640px] w-full max-h-[88vh] overflow-y-auto p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl font-semibold mt-0 mb-4">
          {initial ? (initial._draftId ? "Review AI Draft" : "Edit Question") : "New Question"}
        </h2>

        {!initial && (
          <div className="flex gap-1.5 mb-5">
            <button
              type="button"
              onClick={() => setType("mcq")}
              className={`px-4 py-2 border-[1.5px] rounded text-[13px] font-semibold transition-colors ${
                form.type === "mcq" ? "border-accent text-ink bg-accent/5" : "border-line text-ink-soft"
              }`}
            >
              MCQ
            </button>
            <button
              type="button"
              onClick={() => setType("coding")}
              className={`px-4 py-2 border-[1.5px] rounded text-[13px] font-semibold transition-colors ${
                form.type === "coding" ? "border-accent text-ink bg-accent/5" : "border-line text-ink-soft"
              }`}
            >
              Coding
            </button>
          </div>
        )}

        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger text-[13px] px-3 py-2.5 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className={label}>Question</label>
            <textarea className={input} rows={3} value={form.questionText} onChange={update("questionText")} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="mb-4">
              <label className={label}>Marks</label>
              <input type="number" min={1} className={input} value={form.marks} onChange={update("marks")} required />
            </div>
            <div className="mb-4">
              <label className={label}>Difficulty</label>
              <select className={input} value={form.difficulty} onChange={update("difficulty")}>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
          </div>

          {form.type === "mcq" && (
            <div className="mb-4">
              <label className={label}>Options (select the correct one)</label>
              {form.options.map((opt, idx) => (
                <div className="flex items-center gap-2.5 mb-2.5" key={idx}>
                  <input
                    type="radio"
                    name="correct"
                    checked={form.correctOptionIndex === idx}
                    onChange={() => setForm((f) => ({ ...f, correctOptionIndex: idx }))}
                    className="w-4 h-4 accent-accent"
                  />
                  <input
                    className={input}
                    value={opt}
                    onChange={(e) => updateOption(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    required
                  />
                  {form.options.length > 2 && (
                    <button type="button" onClick={() => removeOption(idx)} className={dangerBtn}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addOption} className={ghostBtn}>+ Add option</button>
            </div>
          )}

          {form.type === "coding" && (
            <>
              <div className="mb-4">
                <label className={label}>Supported languages</label>
                <div className="flex gap-2 flex-wrap">
                  {LANGUAGES.map((lang) => (
                    <button
                      type="button"
                      key={lang}
                      onClick={() => toggleLanguage(lang)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border-[1.5px] transition-colors ${
                        form.languages.includes(lang)
                          ? "border-accent text-ink bg-accent/5"
                          : "border-line text-ink-soft"
                      }`}
                    >
                      {LANGUAGE_LABEL[lang]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className={label}>Sample test cases (shown to students)</label>
                {form.sampleTestCases.map((tc, idx) => (
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2.5 mb-2.5 items-start" key={idx}>
                    <textarea
                      placeholder="Input"
                      value={tc.input}
                      onChange={(e) => updateCase("sampleTestCases", idx, "input", e.target.value)}
                      className={`${input} font-mono text-xs min-h-[44px]`}
                    />
                    <textarea
                      placeholder="Expected output"
                      value={tc.output}
                      onChange={(e) => updateCase("sampleTestCases", idx, "output", e.target.value)}
                      required
                      className={`${input} font-mono text-xs min-h-[44px]`}
                    />
                    <button type="button" onClick={() => removeCase("sampleTestCases", idx)} className={dangerBtn}>✕</button>
                  </div>
                ))}
                <button type="button" onClick={() => addCase("sampleTestCases")} className={ghostBtn}>+ Add sample case</button>
              </div>

              <div className="mb-4">
                <label className={label}>Hidden test cases (used for grading only)</label>
                {form.hiddenTestCases.map((tc, idx) => (
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2.5 mb-2.5 items-start" key={idx}>
                    <textarea
                      placeholder="Input"
                      value={tc.input}
                      onChange={(e) => updateCase("hiddenTestCases", idx, "input", e.target.value)}
                      className={`${input} font-mono text-xs min-h-[44px]`}
                    />
                    <textarea
                      placeholder="Expected output"
                      value={tc.output}
                      onChange={(e) => updateCase("hiddenTestCases", idx, "output", e.target.value)}
                      required
                      className={`${input} font-mono text-xs min-h-[44px]`}
                    />
                    <button type="button" onClick={() => removeCase("hiddenTestCases", idx)} className={dangerBtn}>✕</button>
                  </div>
                ))}
                <button type="button" onClick={() => addCase("hiddenTestCases")} className={ghostBtn}>+ Add hidden case</button>
              </div>
            </>
          )}

          <div className="flex gap-2.5 mt-5">
            <button type="button" onClick={onClose} className={ghostBtn}>Cancel</button>
            <button
              type="submit"
              disabled={saving}
              className="bg-accent text-white rounded px-4.5 py-2.5 font-semibold text-[13.5px] hover:bg-accent-hover disabled:opacity-60 transition-colors"
            >
              {saving ? "Saving…" : "Save question"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
