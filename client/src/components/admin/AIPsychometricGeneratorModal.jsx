import { useState, useEffect } from "react";
import { generateAIPsychometric } from "../../api/admin";
import { Sparkles, X, Check, Trash2, AlertCircle, RefreshCw, Layers, CheckSquare, Square } from "lucide-react";

const stampBtn = "bg-accent text-white rounded-lg px-5 py-2.5 font-semibold text-[13.5px] hover:bg-accent-hover transition-colors flex items-center justify-center gap-2";
const ghostBtn = "border-[1.5px] border-line rounded-lg px-4 py-2 font-semibold text-[13px] text-ink hover:border-accent transition-colors";
const input = "w-full px-3 py-2 border-[1.5px] border-line rounded-lg bg-white text-xs text-ink outline-none focus:border-accent transition-colors";
const labelCls = "block text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5";

export default function AIPsychometricGeneratorModal({
  isOpen,
  onClose,
  category = "Personality Traits",
  availableTraits = [],
  onAcceptDrafts,
}) {
  const [selectedTraits, setSelectedTraits] = useState([]);
  const [questionType, setQuestionType] = useState("mixed");
  const [count, setCount] = useState(5);
  const [seniorityLevel, setSeniorityLevel] = useState("Entry-Level Campus Recruitment");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState([]);
  const [selectedDraftIndices, setSelectedDraftIndices] = useState(new Set());

  useEffect(() => {
    if (availableTraits && availableTraits.length > 0) {
      setSelectedTraits(availableTraits.map((t) => t.key));
    }
  }, [availableTraits]);

  if (!isOpen) return null;

  const toggleTrait = (key) => {
    setSelectedTraits((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const selectAllTraits = () => {
    setSelectedTraits(availableTraits.map((t) => t.key));
  };

  const handleGenerate = async () => {
    const numCount = Number(count);
    if (isNaN(numCount) || numCount < 1 || numCount > 50) {
      setError("Question count must be between 1 and 50.");
      return;
    }

    if (selectedTraits.length === 0) {
      setError("Please select at least one target trait for evaluation");
      return;
    }
    setError("");
    setLoading(true);
    setDrafts([]);

    const targetTraitsObj = availableTraits.filter((t) => selectedTraits.includes(t.key));

    try {
      const res = await generateAIPsychometric({
        category,
        targetTraits: targetTraitsObj,
        questionType,
        count: numCount,
        seniorityLevel,
      });

      if (res.drafts && res.drafts.length > 0) {
        setDrafts(res.drafts);
        setSelectedDraftIndices(new Set(res.drafts.map((_, i) => i)));
      } else {
        setError("AI did not return usable questions. Try again.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to generate AI psychometric questions."
      );
    } finally {
      setLoading(false);
    }
  };

  const updateDraft = (index, field, value) => {
    setDrafts((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    );
  };

  const toggleSelectDraft = (index) => {
    setSelectedDraftIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const removeDraft = (index) => {
    setDrafts((prev) => prev.filter((_, i) => i !== index));
    setSelectedDraftIndices((prev) => {
      const next = new Set();
      prev.forEach((i) => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
  };

  const handleAcceptSelected = () => {
    const accepted = drafts.filter((_, i) => selectedDraftIndices.has(i));
    if (accepted.length === 0) {
      alert("Select at least one draft to add.");
      return;
    }
    onAcceptDrafts(accepted);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-desk/60 flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-line bg-gradient-to-r from-accent/10 to-transparent flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={22} className="text-accent" />
            <div>
              <h2 className="font-display text-lg font-bold text-ink">AI Psychometric Question Generator</h2>
              <p className="text-xs text-ink-soft">
                Auto-generate behavioral statements & situational scenarios mapped to traits.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-ink-soft hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-xs px-4 py-2.5 rounded-xl flex items-center gap-2">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {/* PARAMETERS FORM (Shown if no drafts yet or resetting) */}
          {drafts.length === 0 && (
            <div className="space-y-4">
              {/* Target Traits Checklist */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelCls}>Target Behavioral Traits to Evaluate *</label>
                  <button
                    type="button"
                    onClick={selectAllTraits}
                    className="text-xs text-accent font-semibold hover:underline"
                  >
                    Select All Traits
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 border border-line p-3 rounded-xl max-h-40 overflow-y-auto">
                  {availableTraits.map((t) => {
                    const isChecked = selectedTraits.includes(t.key);
                    return (
                      <label
                        key={t.key}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? "bg-white border-accent font-semibold text-accent"
                            : "bg-white/50 border-line text-ink-soft hover:bg-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleTrait(t.key)}
                          className="accent-accent"
                        />
                        <span className="truncate">{t.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Format Mix</label>
                  <select
                    className={input}
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value)}
                  >
                    <option value="mixed">Mixed Types</option>
                    <option value="likert">Likert 5-Point Scale</option>
                    <option value="forced_choice">Forced Choice Pairs</option>
                    <option value="situational_judgment">Situational Judgment</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Question Count (1 - 50)</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    className={input}
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                  />
                  {(Number(count) < 1 || Number(count) > 50 || isNaN(Number(count))) && (
                    <p className="text-[11px] text-danger mt-1 font-semibold">
                      Question count must be between 1 and 50.
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelCls}>Target Seniority Level</label>
                  <select
                    className={input}
                    value={seniorityLevel}
                    onChange={(e) => setSeniorityLevel(e.target.value)}
                  >
                    <option value="Entry-Level Campus Recruitment">Entry-Level Campus</option>
                    <option value="Mid-Level Professional">Mid-Level Professional</option>
                    <option value="Executive/Leadership">Executive / Leadership</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleGenerate}
                className={stampBtn + " w-full py-3 text-sm"}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating Behavioral Drafts with AI...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Generate {count} Psychometric Drafts
                  </>
                )}
              </button>
            </div>
          )}

          {/* GENERATED DRAFTS REVIEW PANEL */}
          {drafts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <h3 className="font-bold text-sm text-ink flex items-center gap-2">
                    <Check size={16} className="text-success" /> Generated AI Drafts ({drafts.length})
                  </h3>
                  <p className="text-xs text-ink-soft">
                    Inspect, edit statements, verify trait mappings, and check reverse scoring before adding.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="text-xs text-accent font-semibold hover:underline flex items-center gap-1"
                >
                  <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Regenerate
                </button>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {drafts.map((draft, idx) => {
                  const isSelected = selectedDraftIndices.has(idx);

                  return (
                    <div
                      key={idx}
                      className={`border rounded-xl p-4 transition-all ${
                        isSelected ? "bg-white border-accent shadow-sm" : "bg-slate-50 border-line opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleSelectDraft(idx)}
                            className="text-accent hover:opacity-80"
                          >
                            {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                          </button>
                          <span className="font-bold text-xs text-ink">Q{idx + 1}.</span>
                          <span className="font-mono text-[10px] uppercase font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded">
                            {draft.type}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            className="text-xs border border-line rounded px-2 py-1 bg-white font-semibold text-emerald-700"
                            value={draft.traitKey}
                            onChange={(e) => updateDraft(idx, "traitKey", e.target.value)}
                          >
                            {availableTraits.map((t) => (
                              <option key={t.key} value={t.key}>{t.name} ({t.key})</option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => removeDraft(idx)}
                            className="text-ink-soft hover:text-danger p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {draft.type === "situational_judgment" && (
                        <div className="mb-2">
                          <label className="text-[10px] font-semibold text-ink-soft uppercase">Scenario Context</label>
                          <textarea
                            className="w-full text-xs p-2 border border-line rounded bg-slate-50 min-h-[50px]"
                            value={draft.situationContext}
                            onChange={(e) => updateDraft(idx, "situationContext", e.target.value)}
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-[10px] font-semibold text-ink-soft uppercase">Statement / Prompt</label>
                        <input
                          className="w-full text-xs p-2 border border-line rounded bg-white font-medium text-ink"
                          value={draft.questionText}
                          onChange={(e) => updateDraft(idx, "questionText", e.target.value)}
                        />
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-line text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer text-ink-soft hover:text-ink">
                          <input
                            type="checkbox"
                            checked={draft.isReverseScored}
                            onChange={(e) => updateDraft(idx, "isReverseScored", e.target.checked)}
                            className="accent-accent"
                          />
                          <span className="font-semibold">Reverse Scored Item</span>
                        </label>

                        {draft.options && draft.options.length > 0 && (
                          <span className="text-[11px] text-ink-soft">
                            {draft.options.length} Choice Options Included
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-line bg-white flex items-center justify-between shrink-0">
          <button type="button" className={ghostBtn} onClick={onClose}>
            Cancel
          </button>

          {drafts.length > 0 && (
            <button
              type="button"
              onClick={handleAcceptSelected}
              className={stampBtn}
            >
              <Check size={16} /> Add {selectedDraftIndices.size} Selected Questions to Assessment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
