import api from "./api";

export const adminApi = {
  // Stats & Overview
  getStats: () => api.get("/admin/stats"),
  
  // User Management
  getUsers: (params = {}) => api.get("/admin/users", { params }),
  getUserDetails: (userId) => api.get(`/admin/users/${userId}`),
  updateUserStatus: (userId, data) => api.put(`/admin/users/${userId}/status`, data),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  
  // Form Management
  getForms: (params = {}) => api.get("/admin/forms", { params }),
  archiveForm: (formId) => api.put(`/admin/forms/${formId}/archive`),
  deleteForm: (formId) => api.delete(`/admin/forms/${formId}`),
  
  // Response Management
  getResponses: (params = {}) => api.get("/admin/responses", { params }),
  
  // Audit Timeline
  getAuditLogs: () => api.get("/admin/audit-logs"),
  
  // Platform Settings
  getSettings: () => api.get("/admin/settings"),
  updateSettings: (data) => api.put("/admin/settings", data),
};

export default adminApi;
