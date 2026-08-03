import api from "./api";

export const formsApi = {
  list: (params) => api.get("/forms", { params }),
  get: (id) => api.get(`/forms/${id}`),
  create: (data) => api.post("/forms", data),
  update: (id, data) => api.put(`/forms/${id}`, data),
  delete: (id) => api.delete(`/forms/${id}`),
  publish: (id, data = {}) => api.post(`/forms/${id}/publish`, data),
  archive: (id) => api.post(`/forms/${id}/archive`),
  restore: (id) => api.post(`/forms/${id}/restore`),
  duplicate: (id, data = {}) => api.post(`/forms/${id}/duplicate`, data),
  getVersions: (id) => api.get(`/forms/${id}/versions`),
  getShareLink: (id) => api.get(`/forms/${id}/share-link`),
  getSubmissions: (id, params) => api.get(`/forms/${id}/submissions`, { params }),
  deleteSubmission: (formId, subId) => api.delete(`/forms/${formId}/submissions/${subId}`),
  // Day 15: unified export endpoint — format is "csv" | "json"
  exportCSV: (id) => api.get(`/forms/${id}/export`, { params: { format: "csv" }, responseType: "blob" }),
  exportJSON: (id) => api.get(`/forms/${id}/export`, { params: { format: "json" }, responseType: "blob" }),
  export: (id, format = "csv") => api.get(`/forms/${id}/export`, { params: { format }, responseType: "blob" }),
  // Day 2: field-type catalogue from backend
  getFieldTypes: () => api.get("/field-types"),
};

export default formsApi;
