import api from "./api";

export const conditionsApi = {
  list: (formId) => api.get(`/forms/${formId}/conditions`),
  create: (formId, data) => api.post(`/forms/${formId}/conditions`, data),
  update: (formId, condId, data) => api.put(`/forms/${formId}/conditions/${condId}`, data),
  delete: (formId, condId) => api.delete(`/forms/${formId}/conditions/${condId}`),
};

export default conditionsApi;
