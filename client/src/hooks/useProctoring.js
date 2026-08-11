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

  // Consecutive trackers for robust debouncing
  const noFaceCountRef = useRef(0);
  const multiFaceCountRef = useRef(0);
  const gazeAwayCountRef = useRef(0);
  const lastVideoTimeRef = useRef(0);
  const frozenCountRef = useRef(0);

  const dismissWarning = useCallback(() => {
    setWarningMessage(null);
  }, []);

  const log = useCallback(
    (type, detail = "") => {
      if (!attemptId || terminatedRef.current || !enabled) return;
      const now = Date.now();
      const last = lastLoggedRef.current[type] || 0;
      if (now - last < EVENT_COOLDOWN_MS) return;
      lastLoggedRef.current[type] = now;

      setViolationCount((prev) => prev + 1);

      logProctorEvent(attemptId, type, detail).then((result) => {
        if (result?.autoSubmitted && !terminatedRef.current) {
          terminatedRef.current = true;
          onAutoSubmit?.(result);
        }
      });
    },
    [attemptId, enabled, onAutoSubmit]
  );

  // Stop all proctoring media streams and clean up browser state safely
  const stopAllProctoring = useCallback(() => {
    if (cleanedUpRef.current) return;
    cleanedUpRef.current = true;

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

  // Screen sharing track ended listener
  useEffect(() => {
    if (!enabled || !screenStream) return;
    const tracks = screenStream.getVideoTracks();
    if (tracks.length === 0) return;

    const handleScreenEnded = () => {
      setIsScreenShareActive(false);
      setCameraStatus("warning");
      setWarningMessage("⚠️ Screen Sharing Stopped! Maintaining active screen share is required.");
      log("screen_share_interrupted", "Candidate stopped screen sharing track");
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
        log("tab_switch");
      }
    };
    const handleFullscreenChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      setIsFullscreenActive(isFs);
      if (!isFs && !cleanedUpRef.current) {
        setWarningMessage("⚠️ Full-Screen Exited! Please return to full-screen mode immediately.");
        log("fullscreen_exit");
      }
    };
    const handleCopy = () => {
      setWarningMessage("⚠️ Copy Action Blocked & Flagged.");
      log("copy_attempt");
    };
    const handlePaste = () => {
      log("paste_attempt");
    };
    const handleContextMenu = (e) => {
      e.preventDefault();
      setWarningMessage("⚠️ Right-Click Disabled during assessment.");
      log("right_click");
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
        if (!mediaStream) {
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
            log("camera_unavailable", "Video track ended unexpectedly");
          };
        }

        const video = document.createElement("video");
        video.srcObject = mediaStream;
        video.muted = true;
        video.playsInline = true;
        await video.play().catch(() => {});
        videoRef.current = video;
        setCameraStatus("active");

        intervalRef.current = setInterval(async () => {
          if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

          // Detect frozen or static camera feed
          if (videoRef.current.currentTime === lastVideoTimeRef.current) {
            frozenCountRef.current += 1;
            if (frozenCountRef.current >= 4) {
              setCameraStatus("warning");
              setWarningMessage("⚠️ Camera Stream Frozen or Interrupted! Check camera device.");
              log("camera_frozen", "Video frame static for > 2 seconds");
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
              gazeAwayCountRef.current = 0;

              if (noFaceCountRef.current >= 10) {
                // 5.0s of prolonged absence
                setCameraStatus("warning");
                setWarningMessage("⚠️ Prolonged Face Absence! Return to camera immediately.");
                log("prolonged_no_face", "Face absent for > 5 seconds");
              } else if (noFaceCountRef.current >= 3) {
                // 1.5s of absence
                setCameraStatus("warning");
                setWarningMessage("⚠️ Candidate Face Absent! Please remain in front of the camera.");
                log("no_face");
              }
            } else if (count > 1) {
              multiFaceCountRef.current += 1;
              noFaceCountRef.current = 0;
              gazeAwayCountRef.current = 0;

              if (multiFaceCountRef.current >= 2) {
                // 1.0s of multiple faces
                setCameraStatus("warning");
                setWarningMessage(`⚠️ Multiple (${count}) Faces Detected! Only registered candidate permitted.`);
                log("multiple_faces", `${count} faces detected in camera frame`);
              }
            } else {
              // Exactly 1 face detected — verify gaze / head pose / off-screen positioning
              noFaceCountRef.current = 0;
              multiFaceCountRef.current = 0;

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
                  log("suspicious_gaze", "Candidate turned head or looked off-screen");
                }
              } else {
                gazeAwayCountRef.current = 0;
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
        log("camera_unavailable", err.message);
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
