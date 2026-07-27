import api from "./api";

export const profileApi = {
  getProfile: () => api.get("/profile"),
  updateProfile: (data) => api.patch("/profile", data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/profile/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  changePassword: (currentPassword, newPassword) =>
    api.post("/profile/change-password", { current_password: currentPassword, new_password: newPassword }),
  getSettings: () => api.get("/settings"),
  updateSettings: (data) => api.patch("/settings", data),
  getSessions: () => api.get("/sessions"),
  revokeCurrentSession: () => api.delete("/sessions/current"),
  revokeAllSessions: () => api.delete("/sessions/all"),
  deleteAccount: (password) =>
    api.request({
      url: "/account",
      method: "DELETE",
      data: { password },
    }),
};

export default profileApi;
