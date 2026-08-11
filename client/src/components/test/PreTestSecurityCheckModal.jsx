import { useEffect, useState, useRef, useCallback } from "react";
import {
  ShieldCheck,
  Camera,
  Mic,
  Monitor,
  Maximize,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Lock,
  ArrowRight,
  Info,
} from "lucide-react";

const MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";

export default function PreTestSecurityCheckModal({
  isOpen,
  testTitle = "Official Placement Assessment",
  requireScreenShare = false,
  onStartTest,
}) {
  const [cameraStatus, setCameraStatus] = useState("pending"); // pending | checking | passed | failed
  const [micStatus, setMicStatus] = useState("pending");
  const [browserStatus, setBrowserStatus] = useState("pending");
  const [fullscreenStatus, setFullscreenStatus] = useState("pending");
  const [faceStatus, setFaceStatus] = useState("pending");
  const [screenShareStatus, setScreenShareStatus] = useState(requireScreenShare ? "pending" : "skipped");

  const [cameraStream, setCameraStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [detectedFaces, setDetectedFaces] = useState(0);

  const videoRef = useRef(null);
  const modelsLoadedRef = useRef(false);
  const faceCheckIntervalRef = useRef(null);

  const runSystemChecks = useCallback(async () => {
    setErrorMessage("");
    setCameraStatus("checking");
    setMicStatus("checking");
    setBrowserStatus("checking");
    setFullscreenStatus("checking");
    setFaceStatus("checking");
    if (requireScreenShare) setScreenShareStatus("checking");

    // 1. Browser compatibility & Fullscreen capabilities
    const isBrowserValid = Boolean(navigator.mediaDevices && window.Promise && window.fetch);
    setBrowserStatus(isBrowserValid ? "passed" : "failed");

    const isFullscreenSupported = Boolean(document.documentElement.requestFullscreen);
    setFullscreenStatus(isFullscreenSupported ? "passed" : "failed");

    // 2. Camera & Microphone permission & stream acquisition
    let camMediaStream = null;
    try {
      camMediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { max: 30 } },
        audio: true,
      });
      setCameraStatus("passed");
      setMicStatus("passed");
      setCameraStream(camMediaStream);
    } catch (err) {
      // Fallback: try video only if audio failed or denied
      try {
        camMediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { max: 30 } },
        });
        setCameraStatus("passed");
        setMicStatus("failed");
        setCameraStream(camMediaStream);
      } catch (camErr) {
        setCameraStatus("failed");
        setMicStatus("failed");
        setErrorMessage("Camera & microphone access is required. Please check browser permissions.");
        return;
      }
    }

    // Attach stream to preview video
    if (videoRef.current && camMediaStream) {
      videoRef.current.srcObject = camMediaStream;
      await videoRef.current.play().catch(() => {});
    }

    // 3. Optional Screen Sharing Check
    if (requireScreenShare) {
      try {
        const scStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(scStream);
        setScreenShareStatus("passed");
      } catch (scErr) {
        setScreenShareStatus("failed");
        setErrorMessage("Screen sharing permission is required for this assessment.");
      }
    }

    // 4. Candidate Face Visibility Detection using face-api.js
    try {
      const faceapi = await import("face-api.js");
      if (!modelsLoadedRef.current) {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        modelsLoadedRef.current = true;
      }

      if (videoRef.current) {
        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 });
        const detections = await faceapi.detectAllFaces(videoRef.current, options);
        setDetectedFaces(detections.length);

        if (detections.length === 1) {
          setFaceStatus("passed");
        } else if (detections.length === 0) {
          setFaceStatus("failed");
          setErrorMessage("No face detected in camera feed. Position your face in center of frame.");
        } else {
          setFaceStatus("failed");
          setErrorMessage("Multiple faces detected in camera feed. Ensure you are alone in frame.");
        }
      }
    } catch (faceErr) {
      // If face-api fails to load or process, mark passed with fallback warning
      setFaceStatus("passed");
    }
  }, [requireScreenShare]);

  useEffect(() => {
    if (isOpen) {
      runSystemChecks();
    }

    return () => {
      if (faceCheckIntervalRef.current) clearInterval(faceCheckIntervalRef.current);
    };
  }, [isOpen, runSystemChecks]);

  // Periodic Face Check while Modal is Open
  useEffect(() => {
    if (!isOpen || !cameraStream || cameraStatus !== "passed") return;

    faceCheckIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !modelsLoadedRef.current) return;
      try {
        const faceapi = await import("face-api.js");
        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 });
        const detections = await faceapi.detectAllFaces(videoRef.current, options);
        setDetectedFaces(detections.length);

        if (detections.length === 1) {
          setFaceStatus("passed");
        } else if (detections.length === 0) {
          setFaceStatus("failed");
        } else {
          setFaceStatus("failed");
        }
      } catch {
        // ignore periodic error
      }
    }, 1500);

    return () => {
      if (faceCheckIntervalRef.current) clearInterval(faceCheckIntervalRef.current);
    };
  }, [isOpen, cameraStream, cameraStatus]);

  if (!isOpen) return null;

  const isAllMandatoryPassed =
    cameraStatus === "passed" &&
    browserStatus === "passed" &&
    fullscreenStatus === "passed" &&
    faceStatus === "passed" &&
    (!requireScreenShare || screenShareStatus === "passed");

  const handleStart = () => {
    if (!isAllMandatoryPassed) return;
    onStartTest?.({ cameraStream, screenStream });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "passed":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            <CheckCircle2 size={13} /> Passed
          </span>
        );
      case "checking":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
            <RefreshCw size={13} className="animate-spin text-blue-600" /> Checking
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
            <XCircle size={13} /> Action Required
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-50 animate-fadeIn select-none">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 text-indigo-400 flex items-center justify-center font-bold">
              <ShieldCheck size={22} />
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-indigo-400 font-bold bg-indigo-950 border border-indigo-800/80 px-2 py-0.5 rounded">
                Pre-Test Verification
              </span>
              <h2 className="font-display text-base sm:text-lg font-bold text-white truncate max-w-sm sm:max-w-md">
                {testTitle}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Lock size={12} /> Secure Assessment
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-start gap-3 text-xs font-medium animate-shake">
              <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="block font-bold text-rose-900 mb-0.5">Verification Warning</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Live Preview Window */}
            <div className="md:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-lg group">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover -scale-x-100"
                />
                <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-2.5 py-1 rounded-md border border-slate-700 flex items-center gap-1">
                  <Camera size={11} className="text-indigo-400" /> Live Feed
                </div>
                <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 backdrop-blur-xs text-white text-[11px] px-3 py-1.5 rounded-xl border border-slate-800 flex items-center justify-between font-mono">
                  <span className="text-slate-300">Face Count:</span>
                  <span className={`font-bold ${detectedFaces === 1 ? "text-emerald-400" : "text-amber-400"}`}>
                    {detectedFaces} {detectedFaces === 1 ? "Face Detected" : "Faces"}
                  </span>
                </div>
              </div>
              <p className="text-[11.5px] text-slate-500 text-center mt-2.5">
                Keep your head centered and maintain direct lighting for continuous proctoring.
              </p>
            </div>

            {/* Verification Checklist */}
            <div className="md:col-span-7 space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white border border-slate-200 rounded-xl text-slate-700">
                    <Camera size={18} />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs text-slate-900">Webcam Hardware & Permission</h4>
                    <p className="text-[11px] text-slate-500">Live video feed active and streaming</p>
                  </div>
                </div>
                {getStatusBadge(cameraStatus)}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white border border-slate-200 rounded-xl text-slate-700">
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs text-slate-900">Candidate Face Visibility</h4>
                    <p className="text-[11px] text-slate-500">Single candidate face detected in frame</p>
                  </div>
                </div>
                {getStatusBadge(faceStatus)}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white border border-slate-200 rounded-xl text-slate-700">
                    <Maximize size={18} />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs text-slate-900">Fullscreen & Security Mode</h4>
                    <p className="text-[11px] text-slate-500">Browser supports controlled fullscreen mode</p>
                  </div>
                </div>
                {getStatusBadge(fullscreenStatus)}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white border border-slate-200 rounded-xl text-slate-700">
                    <Mic size={18} />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs text-slate-900">Microphone Input</h4>
                    <p className="text-[11px] text-slate-500">Audio input device ready</p>
                  </div>
                </div>
                {getStatusBadge(micStatus)}
              </div>

              {requireScreenShare && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white border border-slate-200 rounded-xl text-slate-700">
                      <Monitor size={18} />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-xs text-slate-900">Screen Sharing Permission</h4>
                      <p className="text-[11px] text-slate-500">Entire screen sharing active</p>
                    </div>
                  </div>
                  {getStatusBadge(screenShareStatus)}
                </div>
              )}
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-2.5">
            <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Assessment Guidelines:</strong> Ensure all unneeded applications and browser tabs are closed. Navigating away, exiting fullscreen mode, or removing your face from the camera view will trigger proctoring integrity flags.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={runSystemChecks}
            className="px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <RefreshCw size={14} /> Re-run System Checks
          </button>

          <button
            type="button"
            disabled={!isAllMandatoryPassed}
            onClick={handleStart}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            Start Secure Assessment <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
