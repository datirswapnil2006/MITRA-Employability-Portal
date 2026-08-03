import api from "./axios";

// Question Bank
export const getQuestionBank = (params = {}) => {
  const query = new URLSearchParams();
  if (params.test) query.set("test", params.test);
  if (params.type) query.set("type", params.type);
  if (params.difficulty) query.set("difficulty", params.difficulty);
  if (params.search) query.set("search", params.search);
  if (params.page) query.set("page", params.page);
  if (params.limit) query.set("limit", params.limit);
  return api.get(`/questions/bank?${query.toString()}`).then((r) => r.data);
};

export const bulkDeleteQuestions = (ids) =>
  api.post("/questions/bulk-delete", { ids }).then((r) => r.data);

export const moveQuestions = (ids, targetTestId) =>
  api.patch("/questions/move", { ids, targetTestId }).then((r) => r.data);

// PDF Extraction
export const extractQuestionsFromPDF = (formData) =>
  api.post("/questions/extract-pdf", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);

// Psychometric
export const listPsychometric = () => api.get("/psychometric").then((r) => r.data);
export const getPsychometric = (id) => api.get(`/psychometric/${id}`).then((r) => r.data);
export const createPsychometric = (payload) => api.post("/psychometric", payload).then((r) => r.data);
export const updatePsychometric = (id, payload) => api.put(`/psychometric/${id}`, payload).then((r) => r.data);
export const togglePsychometric = (id) => api.patch(`/psychometric/${id}/toggle`).then((r) => r.data);
export const deletePsychometric = (id) => api.delete(`/psychometric/${id}`).then((r) => r.data);

// Study Materials
export const listMaterials = (params = {}) => {
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.type) query.set("type", params.type);
  if (params.search) query.set("search", params.search);
  return api.get(`/materials?${query.toString()}`).then((r) => r.data);
};
export const getMaterialCategories = () => api.get("/materials/categories").then((r) => r.data);
export const createMaterial = (formData) =>
  api.post("/materials", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);
export const updateMaterial = (id, payload) => api.put(`/materials/${id}`, payload).then((r) => r.data);
export const toggleMaterial = (id) => api.patch(`/materials/${id}/toggle`).then((r) => r.data);
export const deleteMaterial = (id) => api.delete(`/materials/${id}`).then((r) => r.data);
