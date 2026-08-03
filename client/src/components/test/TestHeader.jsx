import { useState, useEffect } from "react";
import { Clock, ShieldCheck, Maximize2, Minimize2, Type, CheckCircle2 } from "lucide-react";

export default function TestHeader({
  title,
  mode = "exam", // "exam" | "practice"
  remainingSec = 0,
  totalQuestions = 0,
  answeredCount = 0,
  fontSize = "base", // "sm" | "base" | "lg"
  setFontSize,
  isProctored = false,
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const hours = Math.floor(remainingSec / 3600);
  const minutes = Math.floor((remainingSec % 3600) / 60);
  const seconds = remainingSec % 60;

  const timeFormatted =
    hours > 0
      ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const isLowTime = remainingSec > 0 && remainingSec <= 300; // < 5 mins
  const isCriticalTime = remainingSec > 0 && remainingSec <= 60; // < 1 min

  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <header className="bg-slate-900/95 backdrop-blur border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-6 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left Section: Title & Mode Badges */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider ${
                  mode === "practice"
                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                    : "bg-indigo-500/15 border border-indigo-500/30 text-indigo-400"
                }`}
              >
                {mode === "practice" ? "💡 Practice Session" : "⏱️ Official Test"}
              </span>

              {isProctored && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
                  <ShieldCheck size={12} /> Proctored
                </span>
              )}
            </div>
            <h1 className="font-display text-base sm:text-lg font-bold text-white tracking-tight truncate max-w-xs sm:max-w-md">
              {title || "Assessment Session"}
            </h1>
          </div>

          {/* Mobile Timer View */}
          <div className="md:hidden">
            <div
              className={`font-mono text-sm font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                isCriticalTime
                  ? "bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse"
                  : isLowTime
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                  : "bg-slate-800 border-slate-700 text-indigo-300"
              }`}
            >
              <Clock size={14} />
              {timeFormatted}
            </div>
          </div>
        </div>

        {/* Center Section: Progress Bar */}
        <div className="w-full md:w-64 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 size={12} className="text-emerald-400" />
              {answeredCount} of {totalQuestions} Answered
            </span>
            <span className="font-bold text-slate-200">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Right Section: Countdown Timer & Controls */}
        <div className="hidden md:flex items-center gap-4">
          {/* Font Size Adjuster */}
          <div className="flex items-center bg-slate-800/80 border border-slate-700/80 rounded-xl p-1 text-slate-300">
            <button
              onClick={() => setFontSize("sm")}
              title="Small text"
              className={`px-2 py-1 text-xs font-mono font-bold rounded-lg transition-colors ${
                fontSize === "sm" ? "bg-indigo-600 text-white" : "hover:text-white"
              }`}
            >
              A-
            </button>
            <button
              onClick={() => setFontSize("base")}
              title="Default text"
              className={`px-2 py-1 text-xs font-mono font-bold rounded-lg transition-colors ${
                fontSize === "base" ? "bg-indigo-600 text-white" : "hover:text-white"
              }`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize("lg")}
              title="Large text"
              className={`px-2 py-1 text-xs font-mono font-bold rounded-lg transition-colors ${
                fontSize === "lg" ? "bg-indigo-600 text-white" : "hover:text-white"
              }`}
            >
              A+
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 rounded-xl transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* Timer Display */}
          <div
            className={`font-mono text-lg font-bold px-4 py-2 rounded-2xl border flex items-center gap-2 shadow-sm transition-all ${
              isCriticalTime
                ? "bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse ring-2 ring-rose-500/30"
                : isLowTime
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                : "bg-slate-800 border-slate-700 text-indigo-300"
            }`}
          >
            <Clock size={18} className={isCriticalTime ? "animate-spin" : ""} />
            <span>{timeFormatted}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
