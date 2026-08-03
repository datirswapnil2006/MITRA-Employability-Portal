import { useState, useRef, useEffect } from "react";
import { Code2, RotateCcw, Copy, Check, Terminal } from "lucide-react";

const LANGUAGE_LABELS = {
  python: "Python 3",
  java: "Java (OpenJDK)",
  cpp: "C++ (GCC)",
};

const STARTER_CODES = {
  python: "# Write your solution below\n\ndef solution():\n    pass\n",
  java: "// Write your solution below\npublic class Main {\n    public static void main(String[] args) {\n\n    }\n}\n",
  cpp: "// Write your solution below\n#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}\n",
};

export default function CodeEditor({
  code = "",
  language = "python",
  availableLanguages = ["python", "java", "cpp"],
  onChangeCode,
  onChangeLanguage,
}) {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  // Compute total line count
  const lines = code ? code.split("\n") : [""];
  const lineCount = lines.length;

  // Synchronize scroll between line numbers and textarea
  const handleScroll = () => {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Intercept Tab key to insert 4 spaces
  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newCode = code.substring(0, start) + "    " + code.substring(end);
      onChangeCode(newCode);

      // Reset cursor position after state update
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleResetStarter = () => {
    if (window.confirm("Reset code to starter template? Your current code will be overwritten.")) {
      onChangeCode(STARTER_CODES[language] || "");
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Editor Header Bar */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Language Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <Terminal size={14} className="text-indigo-400 ml-2 mr-1" />
          {availableLanguages.map((lang) => (
            <button
              key={lang}
              onClick={() => {
                onChangeLanguage(lang);
                if (!code || code === STARTER_CODES[language]) {
                  onChangeCode(STARTER_CODES[lang] || "");
                }
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                language === lang
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {LANGUAGE_LABELS[lang] || lang}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetStarter}
            className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2.5 py-1.5 rounded-lg transition-colors"
            title="Reset code template"
          >
            <RotateCcw size={13} /> Reset Template
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2.5 py-1.5 rounded-lg transition-colors"
            title="Copy code"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Editor Body with Line Numbers */}
      <div className="relative flex min-h-[300px] max-h-[500px] font-mono text-xs sm:text-sm bg-slate-950">
        {/* Line Numbers Sidebar */}
        <div
          ref={lineNumbersRef}
          className="w-12 shrink-0 py-4 select-none bg-slate-900/60 text-slate-600 text-right pr-3 font-mono border-r border-slate-800/80 overflow-hidden"
        >
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i + 1} className="leading-6">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code Textarea */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChangeCode(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          spellCheck={false}
          placeholder="Type code solution here..."
          className="flex-1 p-4 bg-transparent text-slate-100 outline-none leading-6 resize-none font-mono selection:bg-indigo-500/30 border-none"
        />
      </div>
    </div>
  );
}
