import api from "./api";

export const responsesApi = {
  /**
   * List submissions for a form with optional server-side filtering.
   *
   * Supported params (all optional):
   *   page, limit          — pagination
   *   date_from, date_to   — ISO 8601 datetime range on submitted_at
   *   field_id             — UUID of a field to filter on
   *   field_value          — case-insensitive substring inside that field's value
   *   ip_address           — exact IP address match
   *   search               — substring search across all response values
   *   order_by             — submitted_at | ip_address | completion_time_seconds
   *   order_dir            — asc | desc
   */
  list: (formId, params) => api.get(`/forms/${formId}/submissions`, { params }),

  get: (formId, submissionId) =>
    api.get(`/forms/${formId}/submissions/${submissionId}`),

  // Legacy CSV alias (kept for backward compatibility)
  exportCsv: (formId) =>
    api.get(`/forms/${formId}/export`, {
      params: { format: "csv" },
      responseType: "blob",
    }),

  // Day 15: unified export — format is "csv" | "json"
  export: (formId, format = "csv") =>
    api.get(`/forms/${formId}/export`, {
      params: { format },
      responseType: "blob",
    }),

  delete: (formId, submissionId) =>
    api.delete(`/forms/${formId}/submissions/${submissionId}`),
};

export default responsesApi;
