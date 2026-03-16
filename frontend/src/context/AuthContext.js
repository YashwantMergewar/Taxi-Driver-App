import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import axiosInstance from '../api/axios';
import { logoutApi, getCurrentUserApi } from './../api/auth.api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth on boot
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('accessToken');
        if (storedToken) {
          // Verify token and get fresh user data
          const res = await getCurrentUserApi();
          const userData = res.data;
          
          if (userData) {
            setToken(storedToken);
            setUser(userData);
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          }
        }
      } catch (err) {
        console.log('Auth initialization failed (likely expired token)');
        await SecureStore.deleteItemAsync('accessToken');
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = useCallback(async (accessToken, userData) => {
    // Note: SecureStore.setItem is now handled by the Axios Interceptor for 
    // all responses containing accessToken, but we keep it here for redundancy
    if (accessToken) {
      await SecureStore.setItemAsync('accessToken', accessToken);
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      setToken(accessToken);
    }
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try { await logoutApi(); } catch {}
    await SecureStore.deleteItemAsync('accessToken');
    delete axiosInstance.defaults.headers.common['Authorization'];
    
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);