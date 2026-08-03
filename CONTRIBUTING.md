# Contributing to MITRA Employability Portal

Thank you for taking the time to contribute to the **MITRA Employability Portal**! We welcome contributions from developers, researchers, and students to enhance our AI-driven placement and assessment ecosystem.

---

## 🚀 Getting Started

### 1. How to Clone the Repository

Clone the project from GitHub and navigate to the repository directory:

```bash
# Clone repository
git clone https://github.com/your-org/MITRA-Employability-Portal.git

# Navigate into project directory
cd MITRA-Employability-Portal
```

### 2. Environment Setup

Follow the local setup instructions detailed in [Deployment Guide](docs/Deployment_Guide.md):

```bash
# Backend Setup
cd server
npm install
cp .env.example .env
npm run seed:admin
npm run dev

# Frontend Setup (in a separate terminal)
cd client
npm install
npm run dev
```

---

## 🌿 Branching Strategy

We use the **Git Flow** strategy for feature development and bug fixes.

### Branch Naming Conventions

Always create a new branch off `main` or `develop` using the following prefixes:

| Branch Type | Format | Example |
| :--- | :--- | :--- |
| **Feature** | `feature/feature-name` | `feature/ai-resume-parser` |
| **Bugfix** | `fix/issue-description` | `fix/jwt-expiration-bug` |
| **Documentation** | `docs/doc-update` | `docs/update-api-spec` |
| **Performance** | `perf/optimization` | `perf/piston-compiler-cache` |
| **Refactor** | `refactor/component-name` | `refactor/admin-proctoring-hook` |

```bash
# Create and checkout a new feature branch
git checkout -b feature/ai-resume-parser
```

---

## 📝 Commit Naming Conventions

We adhere to the **Conventional Commits** specification to ensure clear git history.

### Format
```text
<type>(<scope>): <short summary>

[optional body]
[optional footer]
```

### Allowed Types
- `feat`: A new feature added to client or server
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Formatting, missing semi-colons, no code change
- `refactor`: Refactoring production code without behavior change
- `perf`: Code performance optimization
- `test`: Adding missing tests or refactoring existing tests
- `chore`: Build tasks, package update, developer tooling updates

### Examples
```bash
git commit -m "feat(proctoring): integrate multi-face detection using face-api.js"
git commit -m "fix(auth): resolve JWT expiration handling on student dashboard"
git commit -m "docs(api): update psychometric evaluation route specifications"
```

---

## 📥 Pull Request (PR) Guidelines

1. **Keep PRs Atomic**: Submit smaller, focused pull requests targeting a single issue or feature.
2. **Sync with Main**: Ensure your branch is up-to-date with `main` before requesting review:
   ```bash
   git checkout main
   git pull origin main
   git checkout feature/your-feature
   git rebase main
   ```
3. **PR Description**: Include a clear description of changes, linked issues, and screenshots for visual UI updates.
4. **Code Quality**: Ensure code builds clean with zero lint errors or broken API endpoints.

---

## 💻 Coding Standards & Best Practices

### Frontend (React + Vite + Tailwind CSS)
- Use functional components with hooks.
- Use explicit component prop types and modular component architecture.
- Keep UI responsive across mobile, tablet, and desktop viewports.
- Maintain consistent Tailwind utility styling tokens.

### Backend (Node.js + Express + Mongoose)
- Follow the MVC architectural pattern (`models/`, `controllers/`, `routes/`, `middleware/`, `services/`).
- Handle all async errors gracefully with HTTP status codes.
- Do not expose sensitive credentials in code; use `process.env`.
- Ensure all API endpoints follow RESTful standards.

---

## 📬 Need Help?

For questions, bug reports, or feature proposals, please open a GitHub Issue or contact the core architecture team at **dev@mitra-portal.edu**.
