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

// Psychometric & Behavioral Assessments
export const listPsychometric = (params = {}) => {
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.status) query.set("status", params.status);
  if (params.search) query.set("search", params.search);
  return api.get(`/psychometric?${query.toString()}`).then((r) => r.data);
};
export const getPsychometric = (id) => api.get(`/psychometric/${id}`).then((r) => r.data);
export const createPsychometric = (payload) => api.post("/psychometric", payload).then((r) => r.data);
export const updatePsychometric = (id, payload) => api.put(`/psychometric/${id}`, payload).then((r) => r.data);
export const togglePsychometric = (id) => api.patch(`/psychometric/${id}/toggle`).then((r) => r.data);
export const deletePsychometric = (id) => api.delete(`/psychometric/${id}`).then((r) => r.data);
export const generateAIPsychometric = (payload) => api.post("/psychometric/generate-ai", payload).then((r) => r.data);
export const regenerateSinglePsychometricQuestionApi = (payload) => api.post("/psychometric/regenerate-single", payload).then((r) => r.data);

export const getPsychometricAdminAnalytics = (params = {}) => {
  const query = new URLSearchParams();
  if (params.testId) query.set("testId", params.testId);
  if (params.branch) query.set("branch", params.branch);
  return api.get(`/psychometric/admin/analytics?${query.toString()}`).then((r) => r.data);
};

// Trait Library API
export const getPsychometricTraits = (params = {}) => {
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.search) query.set("search", params.search);
  return api.get(`/psychometric/traits?${query.toString()}`).then((r) => r.data);
};
export const createPsychometricTrait = (payload) => api.post("/psychometric/traits", payload).then((r) => r.data);
export const updatePsychometricTrait = (id, payload) => api.put(`/psychometric/traits/${id}`, payload).then((r) => r.data);
export const deletePsychometricTrait = (id) => api.delete(`/psychometric/traits/${id}`).then((r) => r.data);
export const seedPsychometricTraits = () => api.post("/psychometric/traits/seed").then((r) => r.data);

// Psychometric Question Bank API
export const getPsychometricQuestionBank = (params = {}) => {
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.traitKey) query.set("traitKey", params.traitKey);
  if (params.type) query.set("type", params.type);
  if (params.difficulty) query.set("difficulty", params.difficulty);
  if (params.search) query.set("search", params.search);
  return api.get(`/psychometric/question-bank?${query.toString()}`).then((r) => r.data);
};
export const savePsychometricQuestionBankItem = (payload) => api.post("/psychometric/question-bank", payload).then((r) => r.data);
export const deletePsychometricQuestionBankItem = (id) => api.delete(`/psychometric/question-bank/${id}`).then((r) => r.data);

// AI Prompt Templates API
export const getPsychometricPromptTemplates = (params = {}) => {
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  return api.get(`/psychometric/prompt-templates?${query.toString()}`).then((r) => r.data);
};
export const createPsychometricPromptTemplate = (payload) => api.post("/psychometric/prompt-templates", payload).then((r) => r.data);
export const updatePsychometricPromptTemplate = (id, payload) => api.put(`/psychometric/prompt-templates/${id}`, payload).then((r) => r.data);
export const deletePsychometricPromptTemplate = (id) => api.delete(`/psychometric/prompt-templates/${id}`).then((r) => r.data);
export const seedPsychometricPromptTemplates = () => api.post("/psychometric/prompt-templates/seed").then((r) => r.data);

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
