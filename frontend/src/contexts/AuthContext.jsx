import { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../services/authApi";
import { setAccessToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch profile details once authenticated
  const fetchProfile = async (token) => {
    try {
      setAccessToken(token);
      const response = await authApi.me();
      setCurrentUser(response.data);
    } catch (err) {
      // Clear token if profile fetch fails
      setAccessToken(null);
      setCurrentUser(null);
    }
  };

  // 1. Silent Refresh on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await authApi.refresh();
        const token = response.data.access_token;
        await fetchProfile(token);
      } catch (err) {
        // Silent fail — user starts unauthenticated
        setAccessToken(null);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // 2. Handle auto-logout on expired session (dispatched by axios interceptor)
  useEffect(() => {
    const handleAuthExpired = () => {
      setCurrentUser(null);
      setAccessToken(null);
    };

    window.addEventListener("auth-expired", handleAuthExpired);
    return () => window.removeEventListener("auth-expired", handleAuthExpired);
  }, []);

  // 3. Log In action
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      const token = response.data.access_token;
      await fetchProfile(token);
      return response.data;
    } catch (err) {
      setAccessToken(null);
      setCurrentUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 4. Register action
  const register = async (email, password, name) => {
    setLoading(true);
    try {
      const response = await authApi.register({ email, password, name });
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  // 5. Log Out action
  const logout = async () => {
    setLoading(true);
    try {
      await authApi.logout();
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      setAccessToken(null);
      setCurrentUser(null);
      setLoading(false);
    }
  };

  // 6. Manual token refresh action
  const refresh = async () => {
    try {
      const response = await authApi.refresh();
      const token = response.data.access_token;
      setAccessToken(token);
      return token;
    } catch (err) {
      setAccessToken(null);
      setCurrentUser(null);
      throw err;
    }
  };

  const value = {
    currentUser,
    loading,
    authenticated: !!currentUser,
    login,
    logout,
    register,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
