import { useEffect, useRef, useState, useCallback } from "react";
import { logProctorEvent } from "../api/proctor";

const MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";

const FAST_FACE_CHECK_INTERVAL_MS = 500; // Sub-second real-time verification
const EVENT_COOLDOWN_MS = 4000; // Cooldown per event type to prevent log flooding

export default function useProctoring(
  attemptId,
  { enabled = true, initialStream = null, initialScreenStream = null, onAutoSubmit } = {}
) {
  const [stream, setStream] = useState(initialStream);
  const [screenStream, setScreenStream] = useState(initialScreenStream);
  const [cameraStatus, setCameraStatus] = useState("initializing"); // initializing | active | warning | error
  const [faceCount, setFaceCount] = useState(1);
  const [gazeStatus, setGazeStatus] = useState("centered"); // centered | looking_away
  const [violationCount, setViolationCount] = useState(0);
  const [warningMessage, setWarningMessage] = useState(null);
  const [isFullscreenActive, setIsFullscreenActive] = useState(Boolean(document.fullscreenElement));
  const [isScreenShareActive, setIsScreenShareActive] = useState(Boolean(initialScreenStream));

  const lastLoggedRef = useRef({});
  const videoRef = useRef(null);
  const streamRef = useRef(initialStream);
  const screenStreamRef = useRef(initialScreenStream);
  const intervalRef = useRef(null);
  const modelsReadyRef = useRef(false);
  const terminatedRef = useRef(false);
  const cleanedUpRef = useRef(false);

  const violationCountRef = useRef(0);
  const auditLogsRef = useRef([]);

  // Consecutive trackers for robust debouncing & absence session statefulness
  const noFaceCountRef = useRef(0);
  const noFaceViolationLoggedRef = useRef(false);
  const multiFaceCountRef = useRef(0);
  const multiFaceViolationLoggedRef = useRef(false);
  const gazeAwayCountRef = useRef(0);
  const gazeAwayViolationLoggedRef = useRef(false);
  const lastVideoTimeRef = useRef(0);
  const frozenCountRef = useRef(0);

  // Sync refs when props change
  useEffect(() => {
    if (initialStream) {
      streamRef.current = initialStream;
      setStream(initialStream);
    }
  }, [initialStream]);

  useEffect(() => {
    if (initialScreenStream) {
      screenStreamRef.current = initialScreenStream;
      setScreenStream(initialScreenStream);
      setIsScreenShareActive(true);
    }
  }, [initialScreenStream]);

  const dismissWarning = useCallback(() => {
    setWarningMessage(null);
  }, []);

  // Stop all proctoring media streams and clean up browser state safely
  const stopAllProctoring = useCallback(() => {
    if (cleanedUpRef.current) return;
    cleanedUpRef.current = true;
    terminatedRef.current = true;

    // 1. Clear detection loop interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // 2. Stop camera and microphone tracks
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      } catch (err) {
        console.warn("Error stopping camera tracks:", err);
      }
      streamRef.current = null;
      setStream(null);
    }

    // 3. Stop screen sharing tracks
    if (screenStreamRef.current) {
      try {
        screenStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      } catch (err) {
        console.warn("Error stopping screen share tracks:", err);
      }
      screenStreamRef.current = null;
      setScreenStream(null);
      setIsScreenShareActive(false);
    }

    // 4. Detach video element
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      } catch (err) {
        // ignore
      }
      videoRef.current = null;
    }

    // 5. Exit fullscreen cleanly if active
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }

    setCameraStatus("error");
  }, []);

  const log = useCallback(
    (type, detail = "", isViolation = true) => {
      if (!attemptId || terminatedRef.current || !enabled) return;
      const now = Date.now();
      const last = lastLoggedRef.current[type] || 0;
      if (now - last < EVENT_COOLDOWN_MS) return;
      lastLoggedRef.current[type] = now;

      let newCount = violationCountRef.current;
      if (isViolation) {
        violationCountRef.current = Math.min(3, violationCountRef.current + 1);
        newCount = violationCountRef.current;
        setViolationCount(newCount);
      }

      auditLogsRef.current.push({
        action: type,
        details: detail,
        timestamp: new Date().toISOString(),
      });

      logProctorEvent(attemptId, type, detail).then((result) => {
        if ((result?.autoSubmitted || newCount >= 3) && !terminatedRef.current) {
          terminatedRef.current = true;
          stopAllProctoring();
          onAutoSubmit?.({
            ...result,
            autoSubmitted: true,
            exitReason: "Repeated confirmed proctoring violations were detected during the assessment.",
            violationCount: 3,
            auditLogs: auditLogsRef.current,
          });
        }
      });
    },
    [attemptId, enabled, onAutoSubmit, stopAllProctoring]
  );

  // Screen sharing track ended listener
  useEffect(() => {
    if (!enabled || !screenStream) return;
    const tracks = screenStream.getVideoTracks();
    if (tracks.length === 0) return;

    const handleScreenEnded = () => {
      setIsScreenShareActive(false);
      setCameraStatus("warning");
      setWarningMessage("⚠️ Screen Sharing Stopped! Maintaining active screen share is required.");
      log("screen_share_interrupted", "Candidate stopped screen sharing track", true);
    };

    tracks[0].addEventListener("ended", handleScreenEnded);
    return () => {
      tracks[0].removeEventListener("ended", handleScreenEnded);
    };
  }, [enabled, screenStream, log]);

  // Tab switch, full-screen, copy/paste, context menu listeners
  useEffect(() => {
    if (!enabled) return;

    const handleVisibility = () => {
      if (document.hidden) {
        setWarningMessage("⚠️ Tab Switched! Staying away from the test window is flagged as a violation.");
        log("tab_switch", "Window or tab switched", true);
      }
    };
    const handleFullscreenChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      setIsFullscreenActive(isFs);
      if (!isFs && !cleanedUpRef.current) {
        setWarningMessage("⚠️ Full-Screen Exited! Please return to full-screen mode immediately.");
        log("fullscreen_exit", "Candidate exited browser fullscreen mode", true);
      }
    };
    const handleCopy = () => {
      setWarningMessage("⚠️ Copy Action Blocked & Flagged.");
      log("copy_attempt", "Copy text action", true);
    };
    const handlePaste = () => {
      log("paste_attempt", "Paste text action", true);
    };
    const handleContextMenu = (e) => {
      e.preventDefault();
      setWarningMessage("⚠️ Right-Click Disabled during assessment.");
      log("right_click", "Context menu / right click", true);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCopy);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCopy);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("paste", handlePaste);
    };
  }, [enabled, attemptId, log]);

  // Webcam stream & continuous sub-second face detection loop
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

        let mediaStream = streamRef.current || initialStream;
        const isStreamActive =
          mediaStream &&
          mediaStream.active &&
          mediaStream.getVideoTracks().some((t) => t.readyState === "live" && t.enabled);

        if (!isStreamActive) {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { max: 30 } },
            audio: true,
          });
        }

        if (cancelled) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = mediaStream;
        setStream(mediaStream);

        // Listen for hardware disconnection
        const videoTracks = mediaStream.getVideoTracks();
        if (videoTracks.length > 0) {
          videoTracks[0].onended = () => {
            setCameraStatus("error");
            setWarningMessage("⚠️ Camera Disconnected! Check hardware connection.");
            log("camera_unavailable", "Video track ended unexpectedly", false);
          };
        }

        if (!videoRef.current) {
          const video = document.createElement("video");
          video.muted = true;
          video.playsInline = true;
          videoRef.current = video;
        }

        if (videoRef.current.srcObject !== mediaStream) {
          videoRef.current.srcObject = mediaStream;
        }
        await videoRef.current.play().catch(() => {});
        setCameraStatus("active");

        intervalRef.current = setInterval(async () => {
          if (
            !videoRef.current ||
            videoRef.current.paused ||
            videoRef.current.ended ||
            videoRef.current.readyState < 2 ||
            videoRef.current.videoWidth === 0
          ) {
            return;
          }

          // Detect frozen or static camera feed
          if (videoRef.current.currentTime === lastVideoTimeRef.current) {
            frozenCountRef.current += 1;
            if (frozenCountRef.current >= 6) {
              setCameraStatus("warning");
              setWarningMessage("⚠️ Camera Stream Frozen or Interrupted! Check camera device.");
              log("camera_frozen", "Video frame static for > 3 seconds", false);
            }
          } else {
            frozenCountRef.current = 0;
            lastVideoTimeRef.current = videoRef.current.currentTime;
          }

          try {
            const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 });
            const detections = await faceapi.detectAllFaces(videoRef.current, options);
            const count = detections.length;
            setFaceCount(count);

            if (count === 0) {
              noFaceCountRef.current += 1;
              multiFaceCountRef.current = 0;
              multiFaceViolationLoggedRef.current = false;
              gazeAwayCountRef.current = 0;
              gazeAwayViolationLoggedRef.current = false;

              if (noFaceCountRef.current >= 12) {
                // Continuous 6.0s absence beyond grace period
                setCameraStatus("warning");
                setWarningMessage("⚠️ Prolonged Face Absence! Return to camera immediately.");
                if (!noFaceViolationLoggedRef.current) {
                  noFaceViolationLoggedRef.current = true;
                  log("prolonged_no_face", "Candidate face absent continuously beyond 6s grace period", true);
                }
              } else {
                // Grace period (0–6s): warning shown, 0 violations logged
                setCameraStatus("warning");
                setWarningMessage("⚠️ Candidate Face Absent! Please remain in front of the camera.");
              }
            } else if (count > 1) {
              multiFaceCountRef.current += 1;
              noFaceCountRef.current = 0;
              noFaceViolationLoggedRef.current = false;
              gazeAwayCountRef.current = 0;
              gazeAwayViolationLoggedRef.current = false;

              if (multiFaceCountRef.current >= 3) {
                setCameraStatus("warning");
                setWarningMessage(`⚠️ Multiple (${count}) Faces Detected! Only registered candidate permitted.`);
                if (!multiFaceViolationLoggedRef.current) {
                  multiFaceViolationLoggedRef.current = true;
                  log("multiple_faces", `${count} faces detected in camera frame`, true);
                }
              }
            } else {
              // Exactly 1 face detected — face returned & verified
              noFaceCountRef.current = 0;
              noFaceViolationLoggedRef.current = false;
              multiFaceCountRef.current = 0;
              multiFaceViolationLoggedRef.current = false;

              const box = detections[0].box;
              const vWidth = videoRef.current.videoWidth || 320;
              const vHeight = videoRef.current.videoHeight || 240;

              const faceCenterX = box.x + box.width / 2;
              const faceCenterY = box.y + box.height / 2;

              const isOffCenterHoriz = faceCenterX < vWidth * 0.12 || faceCenterX > vWidth * 0.88;
              const isLookingDownOrOff = faceCenterY > vHeight * 0.82 || box.width < vWidth * 0.10;

              if (isOffCenterHoriz || isLookingDownOrOff) {
                gazeAwayCountRef.current += 1;
                if (gazeAwayCountRef.current >= 4) {
                  setGazeStatus("looking_away");
                  setCameraStatus("warning");
                  setWarningMessage("⚠️ Suspicious Gaze / Secondary Device Suspected! Please keep eyes on screen.");
                  if (!gazeAwayViolationLoggedRef.current) {
                    gazeAwayViolationLoggedRef.current = true;
                    log("suspicious_gaze", "Candidate turned head or looked off-screen", true);
                  }
                }
              } else {
                gazeAwayCountRef.current = 0;
                gazeAwayViolationLoggedRef.current = false;
                setGazeStatus("centered");
                setCameraStatus("active");
                if (frozenCountRef.current === 0) {
                  setWarningMessage(null);
                }
              }
            }
          } catch {
            // Transient frame processing error ignored gracefully
          }
        }, FAST_FACE_CHECK_INTERVAL_MS);
      } catch (err) {
        setCameraStatus("error");
        setWarningMessage("⚠️ Camera access unavailable or denied. Proctoring system degraded.");
        log("camera_unavailable", err.message, false);
      }
    };

    setup();

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, attemptId, initialStream, log]);

  // Clean up all streams and listeners on unmount
  useEffect(() => {
    return () => {
      stopAllProctoring();
    };
  }, [stopAllProctoring]);

  // User gesture action to re-enter fullscreen
  const reEnterFullscreen = useCallback(async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreenActive(true);
        setWarningMessage(null);
      }
    } catch (err) {
      console.warn("Fullscreen request rejected:", err);
    }
  }, []);

  // User gesture action to resume screen sharing
  const resumeScreenShare = useCallback(async () => {
    try {
      const newStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = newStream;
      setScreenStream(newStream);
      setIsScreenShareActive(true);
      setWarningMessage(null);
      return newStream;
    } catch (err) {
      setWarningMessage("⚠️ Screen sharing permission was denied or cancelled.");
      throw err;
    }
  }, []);

  return {
    stream,
    screenStream,
    cameraStatus,
    faceCount,
    gazeStatus,
    violationCount,
    warningMessage,
    dismissWarning,
    isFullscreenActive,
    isScreenShareActive,
    reEnterFullscreen,
    resumeScreenShare,
    stopAllProctoring,
  };
}
