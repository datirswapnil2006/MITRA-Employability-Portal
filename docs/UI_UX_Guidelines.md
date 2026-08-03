# UI / UX Guidelines & Design System

## 1. Design Aesthetics & Visual Identity

The **MITRA Employability Portal** UI follows a premium dark-themed design system featuring slate glassmorphism, high-contrast typography, and hall-ticket inspired admit card aesthetics for candidate auth screens.

---

## 2. Color Palette

```text
├── Primary Background : Slate 900 (#0F172A)
├── Surface Cards      : Slate 800 (#1E293B) with Slate 700 Borders (#334155)
├── Primary Brand      : Indigo 600 (#4F46E5) / Indigo 500 (#6366F1)
├── Secondary Accent   : Amber 500 (#F59E0B) (Stamps, Timers, Notifications)
├── Success Badge      : Emerald 500 (#10B981)
├── Danger Badge       : Red 500 (#EF4444)
└── Typography         : Slate 50 (#F8FAFC) Headers, Slate 300 (#CBD5E1) Body
```

---

## 3. Typography & Spacing

- **Primary Font**: Inter / Roboto sans-serif for dashboard text and UI elements.
- **Monospace Font**: Fira Code / JetBrains Mono for ERP numbers, timer stamps, and code editors.
- **Spacing System**: Standard Tailwind 4pt grid system (`p-2`, `p-4`, `p-6`, `gap-4`).

---

## 4. Component Standards

- **Buttons**: Rounded-lg padding with smooth transition effects (`hover:bg-indigo-600 active:scale-95`).
- **Cards**: Glassmorphic dark cards (`bg-slate-800/80 backdrop-blur-md border border-slate-700/50`).
- **Responsive Layout**: Fully adaptive layouts utilizing Tailwind flex and grid breakpoints (`sm:`, `md:`, `lg:`).
