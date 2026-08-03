/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        desk: "#0F172A",
        "desk-raised": "#1E293B",
        surface: "#F8FAFC",
        line: "#E2E8F0",
        ink: "#1E293B",
        "ink-soft": "#64748B",
        accent: "#2563EB",
        "accent-hover": "#1D4ED8",
        success: "#16A34A",
        danger: "#DC2626",
        "on-desk": "#F1F5F9",
        "on-desk-soft": "#94A3B8",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
}
