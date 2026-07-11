/**
 * Axios API client — single source of truth for all HTTP requests.
 * Reads VITE_API_BASE_URL from environment, defaults to localhost:8000.
 */
import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request interceptor — attach API key if set
api.interceptors.request.use((config) => {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (apiKey) {
    config.headers["X-Api-Key"] = apiKey;
  }
  return config;
});

// Response interceptor — normalize errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred";
    return Promise.reject(new Error(message));
  }
);

// ── Forms ─────────────────────────────────────────────────────────────────────

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
};

// ── Fields ────────────────────────────────────────────────────────────────────

export const fieldsApi = {
  list: (formId) => api.get(`/forms/${formId}/fields`),
  get: (formId, fieldId) => api.get(`/forms/${formId}/fields/${fieldId}`),
  create: (formId, data) => api.post(`/forms/${formId}/fields`, data),
  update: (formId, fieldId, data) => api.put(`/forms/${formId}/fields/${fieldId}`, data),
  delete: (formId, fieldId) => api.delete(`/forms/${formId}/fields/${fieldId}`),
  reorder: (formId, fieldIds) =>
    api.put(`/forms/${formId}/fields/reorder`, { field_ids: fieldIds }),
};

// ── Conditions ────────────────────────────────────────────────────────────────

export const conditionsApi = {
  list: (formId) => api.get(`/forms/${formId}/conditions`),
  create: (formId, data) => api.post(`/forms/${formId}/conditions`, data),
  update: (formId, condId, data) => api.put(`/forms/${formId}/conditions/${condId}`, data),
  delete: (formId, condId) => api.delete(`/forms/${formId}/conditions/${condId}`),
};

// ── Public (respondent) ───────────────────────────────────────────────────────

export const publicApi = {
  getForm: (shareToken) => api.get(`/public/forms/${shareToken}`),
  getStatus: (shareToken) => api.get(`/public/forms/${shareToken}/status`),
  submit: (shareToken, data) => api.post(`/public/forms/${shareToken}/submit`, data),
};

export default api;
