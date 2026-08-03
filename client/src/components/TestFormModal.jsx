import { useState } from "react";
import { CATEGORIES } from "../api/tests";

const label = "block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5";
const input =
  "w-full px-3 py-2.5 border-[1.5px] border-line rounded bg-white text-sm text-ink outline-none focus:border-accent transition-colors";

export default function TestFormModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(
    initial || { title: "", category: CATEGORIES[0], description: "", durationMinutes: 30 }
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSave({ ...form, durationMinutes: Number(form.durationMinutes) });
    } catch (err) {
      setError(err.response?.data?.message || "Could not save test");
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
        <h2 className="font-display text-xl font-semibold mt-0 mb-5">{initial ? "Edit Test" : "New Test"}</h2>
        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger text-[13px] px-3 py-2.5 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className={label}>Title</label>
            <input className={input} value={form.title} onChange={update("title")} required />
          </div>
          <div className="mb-4">
            <label className={label}>Category</label>
            <select className={input} value={form.category} onChange={update("category")}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className={label}>Description</label>
            <textarea className={input} rows={3} value={form.description} onChange={update("description")} />
          </div>
          <div className="mb-4">
            <label className={label}>Duration (minutes)</label>
            <input
              type="number"
              min={1}
              className={input}
              value={form.durationMinutes}
              onChange={update("durationMinutes")}
              required
            />
          </div>
          <div className="flex gap-2.5 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="border-[1.5px] border-line rounded px-4 py-2 font-semibold text-[13px] text-ink hover:border-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-accent text-white rounded px-4.5 py-2.5 font-semibold text-[13.5px] hover:bg-accent-hover disabled:opacity-60 transition-colors"
            >
              {saving ? "Saving…" : "Save test"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
