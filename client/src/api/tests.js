import api from "./axios";

export const CATEGORIES = [
  "Quantitative Aptitude",
  "Logical Reasoning",
  "Verbal Ability",
  "Data Structures & Algorithms",
  "Core Computer Science",
  "Cloud Computing",
];

export const BRANCHES = [
  "MCA",
  "MBA",
  "CSE",
  "CSE(IOT)",
  "MECH",
  "CIVIL",
  "AIDS",
  "EXTC",
  "IT",
];

export const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export const SECTIONS = ["A", "B", "C"];

export const listTests = () => api.get("/tests").then((r) => r.data);
export const getTest = (id) => api.get(`/tests/${id}`).then((r) => r.data);
export const createTest = (payload) => api.post("/tests", payload).then((r) => r.data);
export const updateTest = (id, payload) => api.put(`/tests/${id}`, payload).then((r) => r.data);
export const toggleTest = (id) => api.patch(`/tests/${id}/toggle`).then((r) => r.data);
export const deleteTest = (id) => api.delete(`/tests/${id}`).then((r) => r.data);

export const listQuestions = (testId) => api.get(`/tests/${testId}/questions`).then((r) => r.data);
export const generateQuestions = (testId, payload) =>
  api.post(`/tests/${testId}/questions/generate`, payload).then((r) => r.data);
export const addQuestion = (testId, payload) => api.post(`/tests/${testId}/questions`, payload).then((r) => r.data);
export const updateQuestion = (id, payload) => api.put(`/questions/${id}`, payload).then((r) => r.data);
export const deleteQuestion = (id) => api.delete(`/questions/${id}`).then((r) => r.data);

// Student attempt flow
export const getEnabledTests = () => api.get("/tests/enabled").then((r) => r.data);
export const startAttempt = (testId) => api.post(`/attempts/start/${testId}`).then((r) => r.data);
export const saveAnswer = (attemptId, questionId, payload) =>
  api.put(`/attempts/${attemptId}/answers/${questionId}`, payload).then((r) => r.data);
export const runSample = (attemptId, questionId, payload) =>
  api.post(`/attempts/${attemptId}/run-sample/${questionId}`, payload).then((r) => r.data);
export const submitAttempt = (attemptId, payload = {}) => api.post(`/attempts/${attemptId}/submit`, payload).then((r) => r.data);
export const getAttempt = (attemptId) => api.get(`/attempts/${attemptId}`).then((r) => r.data);

// Admin: results & analytics
export const getOverview = () => api.get("/admin/overview").then((r) => r.data);
export const getAllStudents = () => api.get("/admin/students").then((r) => r.data);
export const getFlaggedAttempts = () => api.get("/admin/flagged-attempts").then((r) => r.data);
export const getStudentDetail = (id) => api.get(`/admin/students/${id}`).then((r) => r.data);
export const getLeaderboard = (testId, branch = "") =>
  api.get(`/tests/${testId}/leaderboard${branch ? `?branch=${encodeURIComponent(branch)}` : ""}`).then((r) => r.data);
export const getRegistrations = (status = "pending", branch = "") =>
  api
    .get(`/admin/registrations?status=${status}${branch ? `&branch=${encodeURIComponent(branch)}` : ""}`)
    .then((r) => r.data);
export const approveRegistration = (id) => api.patch(`/admin/registrations/${id}/approve`).then((r) => r.data);
export const rejectRegistration = (id) => api.patch(`/admin/registrations/${id}/reject`).then((r) => r.data);
