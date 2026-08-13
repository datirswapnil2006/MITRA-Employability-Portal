import { useEffect, useRef, useState } from "react";
import { Camera, AlertTriangle, ShieldCheck, ShieldAlert, Users, EyeOff, Minimize2, Maximize2 } from "lucide-react";

export default function LiveProctorCamera({
  stream,
  cameraStatus = "initializing",
  faceCount = 1,
  gazeStatus = "centered",
  violationCount = 0,
  warningMessage = null,
  isFullscreenActive = true,
  isScreenShareActive = true,
  onReEnterFullscreen,
  onResumeScreenShare,
  onDismissWarning,
}) {
  const videoRef = useRef(null);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !stream) return;

    if (videoEl.srcObject !== stream) {
      videoEl.srcObject = stream;
    }

    const handlePlay = () => {
      videoEl.play().catch((err) => {
        console.warn("LiveProctorCamera play error:", err);
      });
    };

    if (videoEl.readyState >= 1) {
      handlePlay();
    } else {
      videoEl.onloadedmetadata = handlePlay;
    }
  }, [stream]);

  const isWarning = cameraStatus === "warning" || gazeStatus === "looking_away" || faceCount !== 1 || !isFullscreenActive || !isScreenShareActive;
  const isError = cameraStatus === "error";

  return (
    <>
      {/* Non-Blocking Top Center Action & Warning Banner Bar */}
      <div className="fixed top-16 inset-x-0 mx-auto max-w-lg z-40 pointer-events-none px-4 flex flex-col items-center gap-2 animate-fadeIn">
        {/* Fullscreen Lost Action Bar */}
        {!isFullscreenActive && onReEnterFullscreen && (
          <div className="pointer-events-auto w-full bg-rose-600 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-rose-500 flex items-center justify-between gap-3 text-xs font-bold">
            <span className="flex items-center gap-1.5 min-w-0">
              <ShieldAlert size={16} className="shrink-0 text-rose-200" />
              <span className="truncate">⚠️ Fullscreen Lost — Return to test window immediately</span>
            </span>
            <button
              type="button"
              onClick={onReEnterFullscreen}
              className="bg-white text-rose-700 hover:bg-rose-50 px-3 py-1 rounded-xl text-[11px] font-extrabold cursor-pointer transition-colors shadow-xs shrink-0"
            >
              Re-enter Fullscreen
            </button>
          </div>
        )}

        {/* Screen Share Interrupted Action Bar */}
        {!isScreenShareActive && onResumeScreenShare && (
          <div className="pointer-events-auto w-full bg-amber-600 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-amber-500 flex items-center justify-between gap-3 text-xs font-bold">
            <span className="flex items-center gap-1.5 min-w-0">
              <AlertTriangle size={16} className="shrink-0 text-amber-200" />
              <span className="truncate">⚠️ Screen Share Interrupted</span>
            </span>
            <button
              type="button"
              onClick={onResumeScreenShare}
              className="bg-white text-amber-900 hover:bg-amber-50 px-3 py-1 rounded-xl text-[11px] font-extrabold cursor-pointer transition-colors shadow-xs shrink-0"
            >
              Resume Screen Sharing
            </button>
          </div>
        )}

        {/* Floating Warning Toast Banner if active */}
        {warningMessage && isFullscreenActive && isScreenShareActive && (
          <div className="pointer-events-auto w-full bg-amber-500 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-amber-400 flex items-center justify-between gap-3 text-xs font-semibold">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle size={16} className="shrink-0 text-amber-100" />
              <span className="text-xs font-semibold leading-snug">{warningMessage}</span>
            </div>
            {onDismissWarning && (
              <button
                type="button"
                onClick={onDismissWarning}
                className="text-amber-100 hover:text-white text-[11px] underline font-bold shrink-0 ml-1 cursor-pointer"
              >
                Dismiss
              </button>
            )}
          </div>
        )}
      </div>

      {/* Floating Live Camera Box (Bottom Right) with Minimize Control */}
      <div className="fixed bottom-4 right-4 z-40 pointer-events-none animate-fadeIn select-none">
        <div
          className={`pointer-events-auto relative bg-slate-950 rounded-2xl overflow-hidden border-2 shadow-2xl transition-all duration-300 ${
            minimized ? "w-36 h-12 sm:w-40 sm:h-14" : "w-44 h-32 sm:w-52 sm:h-36"
          } ${
            isError
              ? "border-danger ring-2 ring-danger/30"
              : isWarning
              ? "border-amber-400 ring-2 ring-amber-400/30"
              : "border-slate-800 hover:border-accent"
          }`}
        >
          {/* Real-time Video Element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover -scale-x-100 ${minimized ? "opacity-30" : "opacity-100"}`}
          />

          {/* Fallback Overlay if Camera Pending/Error */}
          {(!stream || cameraStatus === "error") && !minimized && (
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center text-slate-400 p-2 text-center">
              <Camera size={24} className="mb-1 text-slate-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-slate-300">
                {cameraStatus === "error" ? "Camera Disconnected" : "Starting Camera..."}
              </span>
            </div>
          )}

          {/* Top Control Bar with Minimize/Maximize Toggle */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md ${
                cameraStatus === "active" && gazeStatus === "centered" && faceCount === 1
                  ? "bg-emerald-500/90 text-white"
                  : isWarning
                  ? "bg-amber-500/90 text-white"
                  : "bg-rose-500/90 text-white"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              {minimized
                ? faceCount === 0
                  ? "No Face"
                  : faceCount > 1
                  ? `${faceCount} Faces`
                  : "Active"
                : cameraStatus === "active" && faceCount === 1 && gazeStatus === "centered"
                ? "Live Monitoring"
                : faceCount === 0
                ? "No Face"
                : faceCount > 1
                ? `${faceCount} Faces`
                : gazeStatus === "looking_away"
                ? "Gaze Warning"
                : "Checking"}
            </span>

            <div className="flex items-center gap-1">
              {violationCount > 0 && !minimized && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-rose-950/80 text-rose-300 border border-rose-500/30 backdrop-blur-md">
                  <ShieldAlert size={10} />
                  {Math.min(3, violationCount)}/3
                </span>
              )}
              <button
                type="button"
                onClick={() => setMinimized((prev) => !prev)}
                title={minimized ? "Expand Camera Preview" : "Minimize Camera Preview"}
                className="bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white p-1 rounded-md border border-slate-700 backdrop-blur-md transition-colors cursor-pointer"
              >
                {minimized ? <Maximize2 size={11} /> : <Minimize2 size={11} />}
              </button>
            </div>
          </div>

          {/* Bottom Live Footer Indicator (when expanded) */}
          {!minimized && (
            <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[9.5px] text-slate-300/80 font-mono pointer-events-none">
              <span className="truncate">AI Proctor v2.0</span>
              <span className="flex items-center gap-1">
                {faceCount === 1 ? <ShieldCheck size={10} className="text-emerald-400" /> : <EyeOff size={10} className="text-amber-400" />}
                {faceCount} Face
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
