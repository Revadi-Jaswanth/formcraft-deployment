import api from "./api";

export const fieldsApi = {
  list: (formId) => api.get(`/forms/${formId}/fields`),
  get: (formId, fieldId) => api.get(`/forms/${formId}/fields/${fieldId}`),
  create: (formId, data) => api.post(`/forms/${formId}/fields`, data),
  update: (formId, fieldId, data) => api.put(`/forms/${formId}/fields/${fieldId}`, data),
  delete: (formId, fieldId) => api.delete(`/forms/${formId}/fields/${fieldId}`),
  reorder: (formId, fieldIds) =>
    api.put(`/forms/${formId}/fields/reorder`, { field_ids: fieldIds }),
};

export default fieldsApi;
