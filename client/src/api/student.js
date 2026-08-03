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
export const getStudentPsychometric = () => api.get("/psychometric").then((r) => r.data);
