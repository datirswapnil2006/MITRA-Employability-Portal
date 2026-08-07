import { useEffect, useState, useRef, useCallback } from "react";
import { DEFAULT_NAVIGATION_POLICY_SETTINGS } from "../components/admin/AssessmentNavigationSettings";

export default function useAssessmentBehavior({
  attemptId,
  settings: customSettings,
  enabled = true,
  onSaveAnswers,
  onSubmitAssessment,
}) {
  const settings = {
    ...DEFAULT_NAVIGATION_POLICY_SETTINGS,
    ...customSettings,
    browserEventRules: {
      ...DEFAULT_NAVIGATION_POLICY_SETTINGS.browserEventRules,
      ...(customSettings?.browserEventRules || {}),
    },
    violationSettings: {
      ...DEFAULT_NAVIGATION_POLICY_SETTINGS.violationSettings,
      ...(customSettings?.violationSettings || {}),
    },
  };

  const [violationCount, setViolationCount] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "Exit Warning",
    message: settings.warningMessage,
    isWarningOnly: false,
  });

  const auditLogsRef = useRef([]);
  const hasSubmittedRef = useRef(false);

  const logAuditAction = useCallback((action, details = "") => {
    auditLogsRef.current.push({
      action,
      details,
      timestamp: new Date().toISOString(),
    });
  }, []);

  const triggerAutoSubmit = useCallback(
    async (exitReason) => {
      if (hasSubmittedRef.current) return;
      hasSubmittedRef.current = true;

      if (settings.autoSaveBeforeExit && onSaveAnswers) {
        try {
          await onSaveAnswers();
        } catch (e) {
          console.warn("Auto save before exit failed", e);
        }
      }

      logAuditAction("Auto Submitted on Exit", exitReason);
      onSubmitAssessment?.(exitReason, auditLogsRef.current, violationCount);
    },
    [settings.autoSaveBeforeExit, onSaveAnswers, onSubmitAssessment, logAuditAction, violationCount]
  );

  // Monitor Navigation / Exit events
  useEffect(() => {
    if (!enabled || !attemptId || hasSubmittedRef.current) return;

    // Push state to catch browser back button seamlessly
    window.history.pushState({ inAssessment: true }, "", window.location.href);

    const handlePopState = (e) => {
      window.history.pushState({ inAssessment: true }, "", window.location.href);

      logAuditAction("Browser Back Triggered");

      if (settings.navigationPolicy === "allow_resume") {
        if (settings.autoSaveBeforeExit && onSaveAnswers) {
          onSaveAnswers();
        }
        setModalConfig({
          title: "Leave Assessment?",
          message: "You can leave now and resume your assessment later.",
          isWarningOnly: false,
        });
        setShowExitModal(true);
        return;
      }

      if (settings.navigationPolicy === "warn_before_exit") {
        setModalConfig({
          title: "Warn Before Exit",
          message: settings.warningMessage || "You are attempting to leave the assessment.",
          isWarningOnly: false,
        });
        setShowExitModal(true);
        return;
      }

      if (settings.navigationPolicy === "auto_submit_on_exit") {
        if (settings.browserEventRules.browserBack) {
          const nextViolations = violationCount + 1;
          setViolationCount(nextViolations);

          if (
            settings.violationSettings.showWarning &&
            nextViolations < settings.violationSettings.maxViolations
          ) {
            setModalConfig({
              title: "Navigation Violation Warning",
              message: `${settings.warningMessage} (Violation ${nextViolations} of ${settings.violationSettings.maxViolations})`,
              isWarningOnly: true,
            });
            setShowExitModal(true);
          } else if (
            nextViolations >= settings.violationSettings.maxViolations &&
            settings.violationSettings.autoSubmitOnMaxViolations
          ) {
            triggerAutoSubmit("Maximum Violations Reached");
          } else {
            triggerAutoSubmit("Browser Back");
          }
        }
      }
    };

    const handleBeforeUnload = (e) => {
      logAuditAction("BeforeUnload Triggered", "Refresh / Tab / Window Close");

      if (settings.autoSaveBeforeExit && onSaveAnswers) {
        onSaveAnswers();
      }

      if (settings.navigationPolicy === "auto_submit_on_exit") {
        if (
          settings.browserEventRules.browserRefresh ||
          settings.browserEventRules.browserTabClose ||
          settings.browserEventRules.browserWindowClose
        ) {
          // Send beacon / attempt submission before tab unloads
          triggerAutoSubmit("Browser Refresh / Exit");
        }
      }

      if (settings.navigationPolicy !== "allow_resume") {
        e.preventDefault();
        e.returnValue = settings.warningMessage;
        return settings.warningMessage;
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [
    enabled,
    attemptId,
    settings,
    violationCount,
    logAuditAction,
    onSaveAnswers,
    triggerAutoSubmit,
  ]);

  const handleContinueAssessment = () => {
    setShowExitModal(false);
  };

  const handleConfirmLeaveAssessment = async () => {
    setShowExitModal(false);
    logAuditAction("Manual Exit Confirmed");

    if (settings.autoSaveBeforeExit && onSaveAnswers) {
      await onSaveAnswers();
    }

    if (settings.navigationPolicy === "auto_submit_on_exit") {
      triggerAutoSubmit("Route Changed");
    } else {
      window.history.back();
    }
  };

  return {
    violationCount,
    showExitModal,
    modalConfig,
    handleContinueAssessment,
    handleConfirmLeaveAssessment,
    logAuditAction,
    triggerAutoSubmit,
  };
}
