import { useEffect, useRef } from "react";
import { logProctorEvent } from "../api/proctor";

// Face detection model weights, served from a CDN mirror of the official
// face-api.js repo. Swap this for a same-origin /models path if you'd
// rather self-host the weight files (recommended for production —
// avoids depending on a third party during a live test).
const MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";

const FACE_CHECK_INTERVAL_MS = 7000;
const EVENT_COOLDOWN_MS = 5000; // avoid flooding the same event repeatedly

// Wires up tab-switch, full-screen-exit, copy/paste, and webcam face-count
// detection for the duration of a test attempt. Every detector fails silently
// and never blocks the student's ability to take the test.
export default function useProctoring(attemptId, { enabled = true, onAutoSubmit } = {}) {
  const lastLoggedRef = useRef({});
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const modelsReadyRef = useRef(false);
  const terminatedRef = useRef(false);

  const log = (type, detail = "") => {
    if (!attemptId || terminatedRef.current) return;
    const now = Date.now();
    const last = lastLoggedRef.current[type] || 0;
    if (now - last < EVENT_COOLDOWN_MS) return;
    lastLoggedRef.current[type] = now;

    logProctorEvent(attemptId, type, detail).then((result) => {
      if (result?.autoSubmitted && !terminatedRef.current) {
        terminatedRef.current = true;
        onAutoSubmit?.(result);
      }
    });
  };

  // Tab switch + full-screen
  useEffect(() => {
    if (!enabled) return;

    const handleVisibility = () => {
      if (document.hidden) log("tab_switch");
    };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) log("fullscreen_exit");
    };
    const handleCopy = (e) => {
      log("copy_attempt");
    };
    const handlePaste = (e) => {
      log("paste_attempt");
    };
    const handleContextMenu = (e) => {
      e.preventDefault();
      log("right_click");
    };

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCopy);
    document.addEventListener("contextmenu", handleContextMenu);
    // Paste is intentionally NOT blocked (students paste their own code into
    // the editor legitimately) — it's logged at low severity for visibility only.
    document.addEventListener("paste", handlePaste);

    // Best-effort: ask for full-screen. Browsers require a user gesture for
    // this in some cases, so this can silently fail — that's fine, it's not
    // a hard requirement, just one more signal.
    document.documentElement.requestFullscreen?.().catch(() => {});

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCopy);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("paste", handlePaste);
    };
  }, [enabled, attemptId]);

  // Webcam face-count detection
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const setup = async () => {
      try {
        const faceapi = await import("face-api.js");

        if (!modelsReadyRef.current) {
          await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
          modelsReadyRef.current = true;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const video = document.createElement("video");
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        await video.play();
        videoRef.current = video;

        intervalRef.current = setInterval(async () => {
          if (!videoRef.current) return;
          try {
            const detections = await faceapi.detectAllFaces(
              videoRef.current,
              new faceapi.TinyFaceDetectorOptions()
            );
            if (detections.length === 0) {
              log("no_face");
            } else if (detections.length > 1) {
              log("multiple_faces", `${detections.length} faces`);
            }
          } catch {
            // A single failed detection cycle isn't worth logging — only
            // persistent camera unavailability (caught below) is.
          }
        }, FACE_CHECK_INTERVAL_MS);
      } catch (err) {
        // Camera denied, unavailable, or model failed to load. Log once and
        // move on — proctoring degrades gracefully, the test still proceeds.
        log("camera_unavailable", err.message);
      }
    };

    setup();

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, [enabled, attemptId]);
}
