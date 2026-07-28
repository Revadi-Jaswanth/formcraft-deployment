/**
 * Axios API client — single source of truth for all HTTP requests.
 * Manages memory-based JWT access tokens and HttpOnly cookie-based refresh tokens.
 */
import axios from "axios";

let accessToken = null;
let isRefreshing = false;
let failedQueue = [];

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
  withCredentials: true, // Crucial for sending/receiving HttpOnly cookies
});

// Request interceptor — attach memory Access Token
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 token refresh and retry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Normalize error details from backend
    const normalizedMessage =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred";

    // Detect 401 errors, but exclude the login/refresh routes to prevent loops
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/login") &&
      !originalRequest.url.includes("/auth/refresh")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Request a new access token using the refresh cookie
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = response.data.access_token;
        setAccessToken(newToken);

        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;

        processQueue(null, newToken);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        setAccessToken(null);
        // Dispatch custom event to trigger redirect to login in UI context
        window.dispatchEvent(new Event("auth-expired"));
        return Promise.reject(new Error("Session expired. Please log in again."));
      }
    }

    return Promise.reject(new Error(normalizedMessage));
  }
);

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export { formsApi } from "./formsApi";
export { fieldsApi } from "./fieldsApi";
export { conditionsApi } from "./conditionsApi";
export { publicApi } from "./publicApi";
export { dashboardApi } from "./dashboardApi";
export { profileApi } from "./profileApi";
export { adminApi } from "./adminApi";

export default api;
