import api from "./axios";

export const getSelfTestTopics = () => api.get("/self-test/topics").then((r) => r.data);

export const generateSelfTest = (payload) => api.post("/self-test/generate", payload).then((r) => r.data);

export const getSelfTestAttempt = (id) => api.get(`/self-test/attempt/${id}`).then((r) => r.data);

export const saveSelfTestAnswer = (attemptId, payload) =>
  api.post(`/self-test/attempt/${attemptId}/answer`, payload).then((r) => r.data);

export const submitSelfTest = (attemptId, payload) =>
  api.post(`/self-test/attempt/${attemptId}/submit`, payload).then((r) => r.data);

export const getStudentSelfTestDashboard = () => api.get("/self-test/dashboard").then((r) => r.data);

export const toggleBookmark = (payload) => api.post("/self-test/bookmark", payload).then((r) => r.data);

export const saveNote = (payload) => api.post("/self-test/note", payload).then((r) => r.data);

export const getBookmarks = () => api.get("/self-test/bookmarks").then((r) => r.data);

export const getAdminSelfTestAnalytics = () => api.get("/self-test/admin-analytics").then((r) => r.data);
