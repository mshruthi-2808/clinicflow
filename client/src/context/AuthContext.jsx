import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('clinicflow_staff_token'));
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('clinicflow_staff_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const logout = useCallback(() => {
    localStorage.removeItem('clinicflow_staff_token');
    localStorage.removeItem('clinicflow_staff_user');
    setToken(null);
    setUser(null);
  }, []);

  // Listen for 401 unauthorized events dispatched from Axios response interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('clinicflow:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('clinicflow:unauthorized', handleUnauthorized);
  }, [logout]);

  const login = async (email, password) => {
    const data = await authApi.login({ email, password });
    const { token: receivedToken, user: receivedUser } = data;

    localStorage.setItem('clinicflow_staff_token', receivedToken);
    localStorage.setItem('clinicflow_staff_user', JSON.stringify(receivedUser));

    setToken(receivedToken);
    setUser(receivedUser);

    return receivedUser;
  };

  const isAuthenticated = Boolean(token && user);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
