import React from "react";
import {
  Compass,
  ShieldAlert,
  AlertOctagon,
  Save,
  Radio,
  FileText,
} from "lucide-react";

export const DEFAULT_NAVIGATION_POLICY_SETTINGS = {
  navigationPolicy: "allow_resume",
  browserEventRules: {
    browserBack: true,
    browserRefresh: true,
    browserTabClose: true,
    browserWindowClose: true,
    routeChange: true,
  },
  violationSettings: {
    maxViolations: 3,
    showWarning: true,
    autoSubmitOnMaxViolations: true,
  },
  warningMessage:
    "You are attempting to leave the assessment. This action may result in your assessment being submitted automatically.",
  autoSaveBeforeExit: true,
};

export default function AssessmentNavigationSettings({ value, onChange }) {
  const settings = {
    ...DEFAULT_NAVIGATION_POLICY_SETTINGS,
    ...value,
    browserEventRules: {
      ...DEFAULT_NAVIGATION_POLICY_SETTINGS.browserEventRules,
      ...(value?.browserEventRules || {}),
    },
    violationSettings: {
      ...DEFAULT_NAVIGATION_POLICY_SETTINGS.violationSettings,
      ...(value?.violationSettings || {}),
    },
  };

  const isAutoSubmitActive = settings.navigationPolicy === "auto_submit_on_exit";

  const handlePolicyChange = (policyKey) => {
    onChange({
      ...settings,
      navigationPolicy: policyKey,
    });
  };

  const handleBrowserEventToggle = (eventKey) => {
    if (!isAutoSubmitActive) return;
    onChange({
      ...settings,
      browserEventRules: {
        ...settings.browserEventRules,
        [eventKey]: !settings.browserEventRules[eventKey],
      },
    });
  };

  const handleViolationSettingToggle = (settingKey) => {
    onChange({
      ...settings,
      violationSettings: {
        ...settings.violationSettings,
        [settingKey]: !settings.violationSettings[settingKey],
      },
    });
  };

  const handleMaxViolationsChange = (e) => {
    const val = Math.max(1, parseInt(e.target.value, 10) || 1);
    onChange({
      ...settings,
      violationSettings: {
        ...settings.violationSettings,
        maxViolations: val,
      },
    });
  };

  const handleWarningMessageChange = (e) => {
    onChange({
      ...settings,
      warningMessage: e.target.value,
    });
  };

  const handleAutoSaveToggle = () => {
    onChange({
      ...settings,
      autoSaveBeforeExit: !settings.autoSaveBeforeExit,
    });
  };

  return (
    <div className="bg-white border border-line rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2 text-accent font-semibold text-sm mb-1">
            <Compass size={18} />
            <span>Assessment Behavior & Navigation Policy</span>
          </div>
          <p className="text-xs text-ink-soft leading-relaxed">
            Define security rules, navigation boundaries, and automatic submission behavior when candidates leave the assessment environment.
          </p>
        </div>
      </div>

      {/* 1. Navigation Policy */}
      <div>
        <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Radio size={14} className="text-accent" /> Navigation Policy
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Option A: Allow Resume */}
          <div
            onClick={() => handlePolicyChange("allow_resume")}
            className={`cursor-pointer rounded-xl p-4 border-2 transition-all ${
              settings.navigationPolicy === "allow_resume"
                ? "border-accent bg-accent/5 shadow-sm"
                : "border-line hover:border-slate-300 bg-white"
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <input
                type="radio"
                name="navigationPolicy"
                checked={settings.navigationPolicy === "allow_resume"}
                onChange={() => handlePolicyChange("allow_resume")}
                className="w-4 h-4 text-accent accent-accent cursor-pointer"
              />
              <span className="font-semibold text-xs text-ink">Allow Resume</span>
            </div>
            <p className="text-[11.5px] text-ink-soft leading-snug pl-6">
              Candidate can leave and continue the assessment later.
            </p>
          </div>

          {/* Option B: Warn Before Exit */}
          <div
            onClick={() => handlePolicyChange("warn_before_exit")}
            className={`cursor-pointer rounded-xl p-4 border-2 transition-all ${
              settings.navigationPolicy === "warn_before_exit"
                ? "border-amber-500 bg-amber-500/5 shadow-sm"
                : "border-line hover:border-slate-300 bg-white"
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <input
                type="radio"
                name="navigationPolicy"
                checked={settings.navigationPolicy === "warn_before_exit"}
                onChange={() => handlePolicyChange("warn_before_exit")}
                className="w-4 h-4 text-amber-500 accent-amber-500 cursor-pointer"
              />
              <span className="font-semibold text-xs text-ink">Warn Before Exit</span>
            </div>
            <p className="text-[11.5px] text-ink-soft leading-snug pl-6">
              Show a confirmation dialog before leaving the assessment.
            </p>
          </div>

          {/* Option C: Auto Submit on Exit */}
          <div
            onClick={() => handlePolicyChange("auto_submit_on_exit")}
            className={`cursor-pointer rounded-xl p-4 border-2 transition-all ${
              settings.navigationPolicy === "auto_submit_on_exit"
                ? "border-rose-500 bg-rose-500/5 shadow-sm"
                : "border-line hover:border-slate-300 bg-white"
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <input
                type="radio"
                name="navigationPolicy"
                checked={settings.navigationPolicy === "auto_submit_on_exit"}
                onChange={() => handlePolicyChange("auto_submit_on_exit")}
                className="w-4 h-4 text-rose-500 accent-rose-500 cursor-pointer"
              />
              <span className="font-semibold text-xs text-ink">Auto Submit on Exit</span>
            </div>
            <p className="text-[11.5px] text-ink-soft leading-snug pl-6">
              Automatically submit the assessment if the candidate exits.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Browser Event Rules */}
      <div className={`transition-opacity duration-200 ${!isAutoSubmitActive ? "opacity-50" : "opacity-100"}`}>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-semibold text-ink uppercase tracking-wider flex items-center gap-1.5">
            <AlertOctagon size={14} className="text-accent" /> Browser Event Rules
          </label>
          {!isAutoSubmitActive && (
            <span className="text-[11px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              Active only when "Auto Submit on Exit" is selected
            </span>
          )}
        </div>
        <p className="text-[11.5px] text-ink-soft mb-3">
          Enable or disable auto-submit for individual browser navigation triggers:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 bg-slate-50 border border-line rounded-xl p-3.5">
          {[
            { key: "browserBack", label: "Browser Back Button" },
            { key: "browserRefresh", label: "Browser Refresh" },
            { key: "browserTabClose", label: "Browser Tab Close" },
            { key: "browserWindowClose", label: "Browser Window Close" },
            { key: "routeChange", label: "URL Change / Route Change" },
          ].map(({ key, label }) => {
            const isChecked = settings.browserEventRules[key];
            return (
              <label
                key={key}
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                  !isAutoSubmitActive
                    ? "cursor-not-allowed border-transparent text-ink-soft"
                    : isChecked
                    ? "bg-white border-line text-ink shadow-2xs"
                    : "bg-transparent border-transparent text-ink-soft hover:bg-white/60"
                }`}
              >
                <input
                  type="checkbox"
                  disabled={!isAutoSubmitActive}
                  checked={isChecked}
                  onChange={() => handleBrowserEventToggle(key)}
                  className="w-4 h-4 rounded text-accent accent-accent cursor-pointer disabled:cursor-not-allowed"
                />
                <span>{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 3. Violation Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-line">
        <div>
          <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-accent" /> Violation Settings
          </label>

          <div className="mb-3.5">
            <span className="block text-xs text-ink-soft mb-1 font-medium">Maximum Allowed Violations</span>
            <input
              type="number"
              min={1}
              value={settings.violationSettings.maxViolations}
              onChange={handleMaxViolationsChange}
              className="w-full max-w-[140px] px-3 py-2 border border-line rounded-xl bg-white text-xs text-ink font-semibold focus:border-accent outline-none transition-colors"
            />
          </div>

          <div className="space-y-2">
            <span className="block text-xs text-ink-soft font-medium mb-1">Actions</span>
            <label className="flex items-center gap-2.5 text-xs text-ink font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={settings.violationSettings.showWarning}
                onChange={() => handleViolationSettingToggle("showWarning")}
                className="w-4 h-4 rounded text-accent accent-accent cursor-pointer"
              />
              <span>Show Warning</span>
            </label>
            <label className="flex items-center gap-2.5 text-xs text-ink font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={settings.violationSettings.autoSubmitOnMaxViolations}
                onChange={() => handleViolationSettingToggle("autoSubmitOnMaxViolations")}
                className="w-4 h-4 rounded text-accent accent-accent cursor-pointer"
              />
              <span>Auto Submit After Maximum Violations</span>
            </label>
          </div>
        </div>

        {/* 4. Warning Message */}
        <div>
          <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FileText size={14} className="text-accent" /> Custom Warning Message
          </label>
          <textarea
            rows={4}
            value={settings.warningMessage}
            onChange={handleWarningMessageChange}
            placeholder="Enter the warning message displayed to candidates before exit actions..."
            className="w-full p-3 border border-line rounded-xl bg-white text-xs text-ink leading-relaxed focus:border-accent outline-none transition-colors resize-none"
          />
        </div>
      </div>

      {/* 5. Auto Save Toggle */}
      <div className="pt-4 border-t border-line flex items-center justify-between bg-slate-50 p-4 rounded-xl">
        <div className="flex items-start gap-3">
          <Save size={18} className="text-accent shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-ink">Auto Save Responses Before Exit</div>
            <p className="text-[11px] text-ink-soft leading-tight mt-0.5">
              If enabled, automatically save all candidate answers before any exit action occurs.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAutoSaveToggle}
          className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${
            settings.autoSaveBeforeExit ? "bg-accent" : "bg-slate-300"
          }`}
        >
          <span
            className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${
              settings.autoSaveBeforeExit ? "translate-x-[20px]" : ""
            }`}
          />
        </button>
      </div>
    </div>
  );
}
