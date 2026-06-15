import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Set default axios headers
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sabeel_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('sabeel_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${VITE_API_URL}/auth/me`);
        setUser(res.data);
      } catch (err) {
        console.error('Session restore failed:', err);
        // Clear invalid tokens
        localStorage.removeItem('sabeel_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [token]);

  const login = async (username, password, role) => {
    setError(null);
    try {
      const res = await axios.post(`${VITE_API_URL}/auth/login`, {
        username,
        password,
        role
      });
      const { token: receivedToken, user: receivedUser } = res.data;
      
      localStorage.setItem('sabeel_token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      return receivedUser;
    } catch (err) {
      const msg = err.response?.data?.message
        || (err.request ? 'Backend server is not running. Start the server and try again.' : 'Login failed. Please verify credentials.');
      setError(msg);
      throw new Error(msg, { cause: err });
    }
  };

  const logout = () => {
    localStorage.removeItem('sabeel_token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    isAdmin: user?.role === 'admin',
    isMember: user?.role === 'member',
    refreshUser: async () => {
      try {
        const res = await axios.get(`${VITE_API_URL}/auth/me`);
        setUser(res.data);
      } catch (err) {
        console.error('Error refreshing user:', err);
      }
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
