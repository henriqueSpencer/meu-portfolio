import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  apiLogin,
  apiRegister,
  apiGoogleAuth,
  apiGetMe,
  apiVerifyEmail,
  setTokens,
  clearTokens,
  setOnAuthError,
} from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReLogin, setShowReLogin] = useState(false);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  // Check existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      apiGetMe()
        .then(setUser)
        .catch(() => {
          clearTokens();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Handle email verification token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get('verify_token');
    if (verifyToken) {
      apiVerifyEmail(verifyToken)
        .then(() => {
          window.history.replaceState({}, '', window.location.pathname);
        })
        .catch(() => {
          window.history.replaceState({}, '', window.location.pathname);
        });
    }
  }, []);

  // Set global auth error handler
  useEffect(() => {
    setOnAuthError(() => {
      if (user) setShowReLogin(true);
    });
    return () => setOnAuthError(null);
  }, [user]);

  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password);
    setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    setShowReLogin(false);
    return data;
  }, []);

  const register = useCallback(async (email, password, name) => {
    return apiRegister(email, password, name);
  }, []);

  const googleAuth = useCallback(async (credential) => {
    const data = await apiGoogleAuth(credential);
    setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    setShowReLogin(false);
    return data;
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    setShowReLogin(false);
  }, []);

  const triggerReLogin = useCallback(() => {
    setShowReLogin(true);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        isAdmin,
        showReLogin,
        login,
        register,
        googleAuth,
        logout,
        triggerReLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
