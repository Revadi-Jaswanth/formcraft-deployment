import api from "./api";

export const responsesApi = {
  list: (formId, params) => api.get(`/forms/${formId}/submissions`, { params }),
  get: (formId, submissionId) => api.get(`/forms/${formId}/submissions/${submissionId}`),
  // Legacy CSV-only alias (kept for any external callers)
  exportCsv: (formId) => api.get(`/forms/${formId}/export`, {
    params: { format: "csv" },
    responseType: "blob",
  }),
  // Day 15: unified export — format is "csv" | "json"
  export: (formId, format = "csv") => api.get(`/forms/${formId}/export`, {
    params: { format },
    responseType: "blob",
  }),
  delete: (formId, submissionId) => api.delete(`/forms/${formId}/submissions/${submissionId}`),
};

export default responsesApi;
