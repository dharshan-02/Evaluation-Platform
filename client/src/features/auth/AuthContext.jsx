import { createContext, useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';

export const AuthContext = createContext(null);

/**
 * AuthProvider manages authentication state across the app.
 * - Persists JWT token and user data in localStorage
 * - Provides login, register, logout, and updateProfile functions
 * - Verifies token on mount by calling /api/auth/me
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const initAuth = async () => {
      const startTime = Date.now();
      const minLoadTime = 3500; // Force cinematic loader for 3.5 seconds

      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          // Verify token is still valid
          const response = await api.get('/auth/me');
          setUser(response.data.user);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        } catch (error) {
          // Token invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      
      // Calculate how much time has passed and delay the rest if necessary
      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, minLoadTime - elapsed);
      
      setTimeout(() => {
        setLoading(false);
      }, delay);
    };

    initAuth();
  }, []);

  // Login
  const login = useCallback(async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user: userData } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    return userData;
  }, []);

  // Register
  const register = useCallback(async (userData) => {
    const response = await api.post('/auth/register', userData);
    const { token, user: newUser } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);

    return newUser;
  }, []);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  // Update profile
  const updateProfile = useCallback(async (data) => {
    const response = await api.put('/auth/profile', data);
    const updatedUser = response.data.user;

    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);

    return updatedUser;
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAdmin: user?.role === 'admin',
    isFaculty: user?.role === 'faculty',
    isStudent: user?.role === 'student',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
