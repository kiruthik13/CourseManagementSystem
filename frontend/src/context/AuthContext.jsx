import React, { createContext, useState, useEffect, useCallback } from 'react';
import { TOKEN_KEYS, ROLE_REDIRECTS } from '../utils/constants';
import authApi from '../api/authApi';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize & load current user if access token exists
  const loadCurrentUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEYS.ACCESS);
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userData = await authApi.getMe();
      setUser(userData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch current user profile:', err);
      localStorage.removeItem(TOKEN_KEYS.ACCESS);
      localStorage.removeItem(TOKEN_KEYS.REFRESH);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  // Login action
  const login = async (credentials) => {
    setError(null);
    try {
      const data = await authApi.login(credentials);
      localStorage.setItem(TOKEN_KEYS.ACCESS, data.access);
      localStorage.setItem(TOKEN_KEYS.REFRESH, data.refresh);

      // Fetch full user profile with role-specific details
      const fullUser = await authApi.getMe();
      setUser(fullUser);

      const redirectPath = ROLE_REDIRECTS[fullUser.role] || '/login';
      return { success: true, user: fullUser, redirectPath };
    } catch (err) {
      const message = err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.error ||
        'Login failed. Please check your credentials.';
      setError(message);
      return { success: false, error: message, fieldErrors: err.response?.data };
    }
  };

  // Register action (student self-registration)
  const register = async (studentData) => {
    setError(null);
    try {
      const data = await authApi.register(studentData);
      localStorage.setItem(TOKEN_KEYS.ACCESS, data.tokens.access);
      localStorage.setItem(TOKEN_KEYS.REFRESH, data.tokens.refresh);

      const fullUser = await authApi.getMe();
      setUser(fullUser);

      const redirectPath = ROLE_REDIRECTS[fullUser.role] || '/student/dashboard';
      return { success: true, user: fullUser, redirectPath };
    } catch (err) {
      const message = err.response?.data?.error || 'Registration failed.';
      setError(message);
      return { success: false, error: message, fieldErrors: err.response?.data };
    }
  };

  // Logout action
  const logout = async () => {
    const refreshToken = localStorage.getItem(TOKEN_KEYS.REFRESH);
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch (err) {
        console.warn('Logout API error:', err);
      }
    }
    localStorage.removeItem(TOKEN_KEYS.ACCESS);
    localStorage.removeItem(TOKEN_KEYS.REFRESH);
    setUser(null);
  };

  // Profile update action
  const updateUserProfile = async (profileData) => {
    try {
      const response = await authApi.updateProfile(profileData);
      const updatedUser = await authApi.getMe();
      setUser(updatedUser);
      return { success: true, user: updatedUser, message: response.message };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || 'Failed to update profile.',
        fieldErrors: err.response?.data,
      };
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    role: user?.role || null,
    login,
    register,
    logout,
    updateUserProfile,
    refreshUser: loadCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
