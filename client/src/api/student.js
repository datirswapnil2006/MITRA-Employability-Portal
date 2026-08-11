import api from "./axios";

export const getMyAttempts = () => api.get("/attempts/my-attempts").then((r) => r.data);
export const updateStudentProfile = (payload) => api.put("/auth/profile", payload).then((r) => r.data);
export const getStudentMaterials = (params = {}) => {
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.type) query.set("type", params.type);
  if (params.search) query.set("search", params.search);
  return api.get(`/materials?${query.toString()}`).then((r) => r.data);
};
export const downloadMaterialApi = (id) => api.get(`/materials/${id}/download`, { headers: { Accept: "application/json" } }).then((r) => r.data);

export const getStudentPsychometric = () => api.get("/psychometric/student/available").then((r) => r.data);
export const startPsychometricAttempt = (testId) => api.post(`/psychometric/attempt/start/${testId}`).then((r) => r.data);
export const savePsychometricAnswer = (attemptId, payload) => api.put(`/psychometric/attempt/${attemptId}/answer`, payload).then((r) => r.data);
export const submitPsychometricAttempt = (attemptId, payload = {}) => api.post(`/psychometric/attempt/${attemptId}/submit`, payload).then((r) => r.data);
export const getPsychometricAttempt = (attemptId) => api.get(`/psychometric/attempt/${attemptId}`).then((r) => r.data);
export const getPsychometricAttemptAnalysis = (attemptId) => api.get(`/psychometric/attempt/${attemptId}/analysis`).then((r) => r.data);
