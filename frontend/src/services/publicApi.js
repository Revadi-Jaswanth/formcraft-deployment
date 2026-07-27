import api from "./api";

export const publicApi = {
  getForm: (shareToken) => api.get(`/public/forms/${shareToken}`),
  getStatus: (shareToken) => api.get(`/public/forms/${shareToken}/status`),
  submit: (shareToken, data, idempotencyKey) =>
    api.post(`/public/forms/${shareToken}/submit`, data, {
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
    }),
  uploadFile: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/public/uploads", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    });
  },
};

export default publicApi;
