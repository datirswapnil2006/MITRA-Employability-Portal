import React, { useState } from "react";
import collegeLogo from "../../assets/college-logo.jpg";

export default function Logo({
  variant = "full", // "full" | "compact" | "light" | "sidebar"
  size = "md", // "sm" | "md" | "lg" | "xl"
  showSubtitle = true,
  subtitleText,
  className = "",
  onClick,
}) {
  const [imgError, setImgError] = useState(false);

  // Size mapping
  const sizeMap = {
    sm: { img: "w-8 h-8", title: "text-xs font-bold", sub: "text-[9px]", gap: "gap-2" },
    md: { img: "w-10 h-10", title: "text-sm font-bold", sub: "text-[10.5px]", gap: "gap-2.5" },
    lg: { img: "w-12 h-12", title: "text-base font-bold", sub: "text-xs", gap: "gap-3" },
    xl: { img: "w-14 h-14", title: "text-lg font-bold", sub: "text-xs", gap: "gap-3.5" },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const isDarkBg = variant === "sidebar" || variant === "dark";

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center shrink-0 ${currentSize.gap} ${className} ${
        onClick ? "cursor-pointer select-none" : ""
      }`}
    >
      {/* Logo Image or Fallback Badge */}
      <div
        className={`relative shrink-0 rounded-xl overflow-hidden shadow-sm transition-transform hover:scale-105 ${
          currentSize.img
        } ${isDarkBg ? "ring-1 ring-white/20 bg-slate-800" : "ring-1 ring-slate-200/80 dark:ring-slate-700 bg-white dark:bg-slate-800"}`}
      >
        {!imgError ? (
          <img
            src={collegeLogo}
            alt="MITRA Portal Logo"
            onError={() => setImgError(true)}
            className="w-full h-full object-contain p-0.5"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm tracking-wider">
            M
          </div>
        )}
      </div>

      {/* Brand Text Header & Subtitle */}
      {variant !== "compact" && (
        <div className="flex flex-col min-w-0">
          <div
            className={`font-sans tracking-tight leading-tight whitespace-nowrap ${currentSize.title} ${
              isDarkBg ? "text-white" : "text-slate-900 dark:text-slate-100"
            }`}
          >
            MITRA <span className="text-blue-600 dark:text-blue-400 font-extrabold">Employability Portal</span>
          </div>

          {showSubtitle && (
            <div
              className={`font-medium tracking-normal leading-tight truncate ${currentSize.sub} ${
                isDarkBg ? "text-slate-400" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {subtitleText || "AI-Based Employability & Placement Assessment Portal"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
