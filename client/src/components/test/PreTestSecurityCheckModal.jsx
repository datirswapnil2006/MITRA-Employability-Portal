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
  // Step State Machine: 1 = Security Check, 2 = Close Tabs Advisory, 3 = Screen Sharing, 4 = Fullscreen & Start Test
  const [currentStep, setCurrentStep] = useState(1);

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
  const [tabsAcknowledged, setTabsAcknowledged] = useState(false);

  const videoRef = useRef(null);
  const modelsLoadedRef = useRef(false);
  const faceCheckIntervalRef = useRef(null);
  const testStartedRef = useRef(false);

  const runHardwareChecks = useCallback(async () => {
    setErrorMessage("");
    setCameraStatus("checking");
    setMicStatus("checking");
    setBrowserStatus("checking");
    setFullscreenStatus("checking");
    setFaceStatus("checking");

    // 1. Browser compatibility & Fullscreen / Screen Share API capabilities
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

    if (videoRef.current && camMediaStream) {
      videoRef.current.srcObject = camMediaStream;
      await videoRef.current.play().catch(() => {});
    }

    // 3. Face Detection Check using face-api.js
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
      setFaceStatus("passed");
    }
  }, []);

  // Request Screen Share on explicit user interaction
  const requestScreenShare = useCallback(async () => {
    setErrorMessage("");
    setScreenShareStatus("checking");
    try {
      const scStream = await navigator.mediaDevices.getDisplayMedia({ video: true });

      // Handle stream ended by candidate early
      scStream.getVideoTracks()[0].addEventListener("ended", () => {
        setScreenShareStatus("failed");
        setErrorMessage("Screen sharing was stopped. Please select and share your screen again.");
      });

      setScreenStream(scStream);
      setScreenShareStatus("passed");
    } catch (err) {
      setScreenShareStatus("failed");
      setErrorMessage("Screen sharing permission was cancelled or denied. Please click 'Retry Screen Sharing' to continue.");
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      runHardwareChecks();
    }

    return () => {
      if (faceCheckIntervalRef.current) clearInterval(faceCheckIntervalRef.current);
    };
  }, [isOpen, runHardwareChecks]);

  // Stream cleanup on unmount if test wasn't started
  useEffect(() => {
    return () => {
      if (!testStartedRef.current) {
        if (cameraStream) cameraStream.getTracks().forEach((t) => t.stop());
        if (screenStream) screenStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraStream, screenStream]);

  // Periodic Face Check while in Step 1
  useEffect(() => {
    if (!isOpen || currentStep !== 1 || !cameraStream || cameraStatus !== "passed") return;

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
  }, [isOpen, currentStep, cameraStream, cameraStatus]);

  if (!isOpen) return null;

  const isStep1Passed =
    cameraStatus === "passed" &&
    browserStatus === "passed" &&
    fullscreenStatus === "passed" &&
    faceStatus === "passed";

  const isStep3Passed = !requireScreenShare || screenShareStatus === "passed";

  const handleFinalStartTest = async () => {
    testStartedRef.current = true;
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen request warning:", err);
    }
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
                Pre-Test Verification — Step {currentStep} of {requireScreenShare ? 4 : 3}
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

        {/* State Machine Step Progress Navigation Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-600 font-mono">
          <div className={`flex items-center gap-1.5 ${currentStep === 1 ? "text-indigo-700 font-bold" : currentStep > 1 ? "text-emerald-700" : ""}`}>
            <span>1. Diagnostics</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className={`flex items-center gap-1.5 ${currentStep === 2 ? "text-indigo-700 font-bold" : currentStep > 2 ? "text-emerald-700" : ""}`}>
            <span>2. Tab Advisory</span>
          </div>
          {requireScreenShare && (
            <>
              <span className="text-slate-300">→</span>
              <div className={`flex items-center gap-1.5 ${currentStep === 3 ? "text-indigo-700 font-bold" : currentStep > 3 ? "text-emerald-700" : ""}`}>
                <span>3. Screen Sharing</span>
              </div>
            </>
          )}
          <span className="text-slate-300">→</span>
          <div className={`flex items-center gap-1.5 ${currentStep === 4 || (!requireScreenShare && currentStep === 3) ? "text-indigo-700 font-bold" : ""}`}>
            <span>{requireScreenShare ? "4" : "3"}. Fullscreen & Start</span>
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

          {/* STEP 1: Hardware & System Diagnostic */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
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
              </div>
            </div>
          )}

          {/* STEP 2: Environment Setup / Close Unnecessary Tabs */}
          {currentStep === 2 && (
            <div className="space-y-5 py-2">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-950 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
                  <Info size={20} className="text-amber-600" />
                  <span>Step 2 — Close Unnecessary Applications & Tabs</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-700">
                  Please close all unnecessary browser tabs, messaging tools, secondary applications, and background utility programs before starting the assessment.
                </p>
                <div className="bg-white/80 border border-amber-200 rounded-xl p-3.5 text-[11.5px] text-slate-600 font-mono">
                  ℹ️ <strong>Browser Security Note:</strong> Browser security restrictions do not allow websites to automatically close external tabs or applications on your computer. You must close them manually.
                </div>
              </div>

              <label className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={tabsAcknowledged}
                  onChange={(e) => setTabsAcknowledged(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 mt-0.5 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-800 leading-snug">
                  I confirm that I have closed all unnecessary browser tabs, applications, and secondary screen windows.
                </span>
              </label>
            </div>
          )}

          {/* STEP 3: Screen Sharing Authorization */}
          {currentStep === 3 && requireScreenShare && (
            <div className="space-y-5 py-2">
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 text-indigo-950 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm text-indigo-900">
                  <Monitor size={20} className="text-indigo-600" />
                  <span>Step 3 — Screen Sharing Authorization</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-700">
                  Please select the screen or browser window containing this assessment and start screen sharing. Screen sharing will remain monitored during your attempt.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-700">
                    <Monitor size={24} />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs text-slate-900">Screen Sharing Monitor</h4>
                    <p className="text-[11px] text-slate-500">
                      {screenShareStatus === "passed"
                        ? "Active screen share verified"
                        : "Click button below to select screen or window"}
                    </p>
                  </div>
                </div>
                {getStatusBadge(screenShareStatus)}
              </div>

              {screenShareStatus !== "passed" ? (
                <button
                  type="button"
                  onClick={requestScreenShare}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Monitor size={16} /> Select & Share Screen
                </button>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" /> Screen sharing successfully initialized.
                </div>
              )}
            </div>
          )}

          {/* STEP 4 / FINAL: Fullscreen & Start Test */}
          {((currentStep === 4 && requireScreenShare) || (currentStep === 3 && !requireScreenShare)) && (
            <div className="space-y-5 py-2">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-emerald-950 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                  <CheckCircle2 size={20} className="text-emerald-600" />
                  <span>All Pre-Test Security Checks Completed</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-700">
                  Your webcam feed, face visibility, browser support, and screen sharing have been successfully verified. Click <strong>Start Secure Assessment</strong> below to enter fullscreen mode and begin your test.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>Camera & Mic Active</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>Face Verified</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>Tab Advisory Confirmed</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>{requireScreenShare ? "Screen Share Active" : "Fullscreen Supported"}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          {currentStep === 1 ? (
            <button
              type="button"
              onClick={runHardwareChecks}
              className="px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <RefreshCw size={14} /> Re-run Diagnostics
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
              className="px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-white transition-colors cursor-pointer"
            >
              ← Back
            </button>
          )}

          {currentStep === 1 && (
            <button
              type="button"
              disabled={!isStep1Passed}
              onClick={() => setCurrentStep(2)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              Next: Tab Advisory <ArrowRight size={16} />
            </button>
          )}

          {currentStep === 2 && (
            <button
              type="button"
              disabled={!tabsAcknowledged}
              onClick={() => setCurrentStep(requireScreenShare ? 3 : 3)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              {requireScreenShare ? "Next: Screen Sharing" : "Next: Fullscreen & Start"} <ArrowRight size={16} />
            </button>
          )}

          {currentStep === 3 && requireScreenShare && (
            <button
              type="button"
              disabled={!isStep3Passed}
              onClick={() => setCurrentStep(4)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              Next: Fullscreen & Start <ArrowRight size={16} />
            </button>
          )}

          {((currentStep === 4 && requireScreenShare) || (currentStep === 3 && !requireScreenShare)) && (
            <button
              type="button"
              onClick={handleFinalStartTest}
              className="px-7 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg animate-pulse"
            >
              Start Secure Assessment <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
