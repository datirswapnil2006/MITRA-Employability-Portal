# MITRA Employability Portal

> **AI-Based Employability & Placement Assessment Portal**  
> An enterprise-grade, full-stack MERN platform built to evaluate student placement readiness, conduct AI-proctored assessments, execute code in real-time sandboxes, parse PDF exams, and generate actionable skill analytics for institutions and candidate placement cells.

---

## 📖 Project Overview

**MITRA Employability Portal** is an end-to-end placement assessment platform designed for universities, technical institutions, and placement cells. It bridges the gap between academic education and corporate recruitment by providing role-based assessment environments, AI-powered question generation, automated face-detection proctoring, live code compilation, psychometric profiling, and comprehensive student skill diagnostics.

---

## ✨ Key Features

### 🔐 1. Authentication & Student Gatekeeping
- **Role-Based Auth (JWT + Bcrypt)**: Strict access control for `Admin` and `Student` roles.
- **Registrations Approval Queue**: Candidate signups start in `pending` status and require approval from the Placement Cell.
- **Secure Password Reset**: OTP-based token workflow via Nodemailer email service.

### 👁️ 2. AI Automated Proctoring & Anti-Cheat System
- **Webcam Monitoring (`face-api.js`)**: Real-time facial detection during online assessments.
- **Violation Logging**: Automatic tracking of tab switches, candidate absence, and multi-face detections.
- **Admin Proctoring Dashboard**: Live monitoring and history of candidate proctoring violations.

### 🤖 3. AI Question Generator & PDF Exam Parser
- **HuggingFace AI Question Builder**: Automatically generates custom MCQs and Coding problems by domain and difficulty.
- **PDF Paper Extractor (`pdf-parse`)**: Upload existing placement paper PDFs to extract questions into the centralized Question Bank.
- **Question Bank Engine**: Searchable repository of reusable questions.

### 💻 4. Timed Exam Sandbox & Live Code Execution
- **Multi-Language Sandbox**: Supports C++, Java, Python, and JavaScript compiled via Piston / OnlineCompiler API.
- **Automated Grading**: Evaluates student solutions against sample and hidden test cases with partial or full marking.
- **Server Countdown & Auto-Save**: Persistent timer and automated submission handling.

### 🧠 5. Psychometric Assessment & Study Materials
- **Psychometric Evaluation Module**: Assesses candidate logical reasoning, numerical aptitude, and behavioral skills.
- **Study Materials Hub**: Centralized repository for placement preparation notes, interview cheatsheets, and PDF guides.
- **Self-Test Practice Suite**: On-demand practice test generator for students to target weak areas.

### 📊 6. Analytics & Leaderboards
- **Performance Analytics**: Visual score trends, topic breakdown, average completion time, and peer benchmarks.
- **Ranked Leaderboards**: Test-wise candidate rankings with tie-breaking logic based on submission timestamps.

---

## 📷 Screenshots Section

*(Screenshots can be added under the `docs/Images/` folder)*

| View | Description | Screenshot Placeholder |
| :--- | :--- | :--- |
| **Landing Page** | Institutional branding & portal overview | `docs/Images/landing_page.png` |
| **Login & Register** | Hall-ticket inspired auth forms | `docs/Images/login_page.png` |
| **Student Dashboard** | Assessment cards, practice, & analytics | `docs/Images/student_dashboard.png` |
| **Admin Dashboard** | Registrations queue & test management | `docs/Images/admin_dashboard.png` |
| **Coding Sandbox** | Code editor with test case execution | `docs/Images/coding_sandbox.png` |
| **AI Question Generator** | HuggingFace AI prompt workspace | `docs/Images/ai_generator.png` |

---

## 🛠️ Technology Stack

```text
├── Architecture : Full-Stack MERN Architecture
├── Frontend     : React.js, Vite, React Router v6, Tailwind CSS, Lucide React, Face-api.js
├── Backend      : Node.js, Express.js, MongoDB (Mongoose ORM), JWT, Bcrypt.js
├── Artificial Intelligence : HuggingFace Inference API, Face Detection Models
├── Code Compiler API       : Piston API / OnlineCompiler API Sandbox
└── Utilities    : Multer, Pdf-Parse, Nodemailer
```

---

## 📂 Folder Structure

```
MITRA-Employability-Portal/
├── client/                 # React Frontend Application
│   ├── src/
│   │   ├── api/           # Axios API Client Modules
│   │   ├── components/    # Reusable UI & Security Guard Components
│   │   ├── hooks/         # Custom Hooks (Proctoring, Timer, Auth)
│   │   ├── pages/         # Admin & Student Page Views
│   │   └── App.jsx        # Routing Table
├── server/                 # Express Backend Server
│   ├── config/            # MongoDB Connection Setup
│   ├── controllers/       # Route Controllers & Business Logic
│   ├── middleware/        # JWT Authentication & File Upload Middleware
│   ├── models/            # Mongoose Schemas (User, Test, Question, Attempt, Proctor)
│   ├── routes/            # REST API Endpoints
│   ├── services/          # AI Service, Compiler Service, Email Service
│   └── server.js          # Express Application Entry Point
├── docs/                   # Architectural & Technical Documentation
│   ├── Architecture.md
│   ├── API_Documentation.md
│   ├── Database_Design.md
│   ├── Production_Readiness.md
│   ├── Roadmap.md
│   └── Research_Paper/
├── .env.example            # Environment variables template
├── docker-compose.yml      # Containerization setup placeholder
├── LICENSE                 # MIT License
└── README.md               # Main Project Readme
```

---

## 🚀 Installation & Running Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB server or MongoDB Atlas connection URL

---

### 🔑 Environment Variables Setup

Create a `.env` file inside the `server/` folder based on `.env.example`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/mitra_employability
JWT_SECRET=mitra_jwt_production_secret_key_2026
CLIENT_URL=http://localhost:5173
ONLINECOMPILER_API_KEY=your_compiler_api_key
HF_TOKEN=your_huggingface_api_token
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_app_password
```

---

### 🖥️ Running Backend

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Seed Admin Account
npm run seed:admin

# Start Server in Development Mode
npm run dev
```

The backend server runs on `http://localhost:5000`.

---

### 💻 Running Frontend

```bash
# Open a new terminal and navigate to client directory
cd client

# Install dependencies
npm install

# Start Vite Development Server
npm run dev
```

The frontend application runs on `http://localhost:5173`.

---

### 🏗️ Build Instructions

#### Frontend Production Build
```bash
cd client
npm run build
```
Output build artifacts will be generated in `client/dist/`.

#### Backend Production Start
```bash
cd server
npm start
```

---

## 🗺️ Future Roadmap

- 🎯 **Phase 1**: Core Assessment Portal & AI Proctoring *(Completed)*
- 🤖 **Phase 2**: Student AI Self-Test & Practice Engine *(Completed)*
- 💳 **Phase 3**: Institutional Billing & Gateway Integration
- 📄 **Phase 4**: Automated AI Resume Analyzer & Scoring
- 🎙️ **Phase 5**: AI Video Mock Interview Evaluator
- 🏢 **Phase 6**: Enterprise Multi-Tenant University Dashboard

See full roadmap in [docs/Roadmap.md](docs/Roadmap.md).

---

## 👥 Contributors

- **Lead Architect & Developer**: MITRA Engineering Team
- **Project Lead**: Institutional Placement Cell

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

## 📞 Contact Information

For queries, institutional onboarding, or bug reporting:
- **Email**: `support@mitra-portal.edu`
- **Documentation**: [docs/](docs/)
- **Repository**: `https://github.com/your-org/MITRA-Employability-Portal`
