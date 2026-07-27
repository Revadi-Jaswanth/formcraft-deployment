import api from "./api";

export const responsesApi = {
  list: (formId, params) => api.get(`/forms/${formId}/submissions`, { params }),
  get: (formId, submissionId) => api.get(`/forms/${formId}/submissions/${submissionId}`),
  exportCsv: (formId) => api.get(`/forms/${formId}/export/csv`, { responseType: "blob" }),
  delete: (formId, submissionId) => api.delete(`/forms/${formId}/submissions/${submissionId}`),
};

export default responsesApi;
