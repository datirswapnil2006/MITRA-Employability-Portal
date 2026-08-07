import { useState } from "react";
import { CATEGORIES } from "../api/tests";
import AssessmentNavigationSettings, { DEFAULT_NAVIGATION_POLICY_SETTINGS } from "./admin/AssessmentNavigationSettings";

const label = "block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5";
const input =
  "w-full px-3 py-2.5 border-[1.5px] border-line rounded bg-white text-sm text-ink outline-none focus:border-accent transition-colors";

export default function TestFormModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(
    initial || { title: "", category: CATEGORIES[0], description: "", durationMinutes: 30 }
  );
  const [navigationPolicySettings, setNavigationPolicySettings] = useState(
    initial?.navigationPolicySettings || DEFAULT_NAVIGATION_POLICY_SETTINGS
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSave({
        ...form,
        durationMinutes: Number(form.durationMinutes),
        navigationPolicySettings,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Could not save test");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-desk/60 flex items-center justify-center p-6 z-50" onClick={onClose}>
      <div
        className="bg-surface rounded-2xl max-w-[760px] w-full max-h-[88vh] overflow-y-auto p-6 sm:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl font-semibold mt-0 mb-5">{initial ? "Edit Test" : "New Test"}</h2>
        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger text-[13px] px-3 py-2.5 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={label}>Title</label>
            <input className={input} value={form.title} onChange={update("title")} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>Category</label>
              <select className={input} value={form.category} onChange={update("category")}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
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
          </div>
          <div>
            <label className={label}>Description</label>
            <textarea className={input} rows={2} value={form.description} onChange={update("description")} />
          </div>

          {/* Assessment Behavior & Navigation Policy Section */}
          <AssessmentNavigationSettings
            value={navigationPolicySettings}
            onChange={setNavigationPolicySettings}
          />

          <div className="flex gap-2.5 pt-3 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="border-[1.5px] border-line rounded-xl px-4 py-2 font-semibold text-[13px] text-ink hover:border-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-accent text-white rounded-xl px-5 py-2.5 font-semibold text-[13.5px] hover:bg-accent-hover disabled:opacity-60 transition-colors"
            >
              {saving ? "Saving…" : "Save Test"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
