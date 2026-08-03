import api from "./api";

export const dashboardApi = {
  getOverview: () => api.get("/dashboard/overview"),
  getActivity: () => api.get("/dashboard/activity"),
  getRecent: () => api.get("/dashboard/recent"),
  getFavorites: () => api.get("/dashboard/favorites"),
  getSubmissions: () => api.get("/dashboard/submissions"),
  updatePreferences: (data) => api.patch("/dashboard/preferences", data),
  getFormAnalytics: (formId) => api.get(`/dashboard/form-analytics/${formId}`),
};

export default dashboardApi;
