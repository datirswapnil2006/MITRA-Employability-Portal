import api from "./axios";

// Resolves to { logged, autoSubmitted, reason?, totalScore?, maxScore? }.
// Never throws — a logging failure should never disrupt the student's test.
export const logProctorEvent = (attemptId, type, detail = "") =>
  api
    .post(`/proctor/${attemptId}/event`, { type, detail })
    .then((r) => r.data)
    .catch(() => ({ logged: false, autoSubmitted: false }));

export const getProctorEvents = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });
  const qs = params.toString();
  return api.get(`/proctor${qs ? `?${qs}` : ""}`).then((r) => r.data);
};

export const getProctorSummary = () => api.get("/proctor/summary").then((r) => r.data);
