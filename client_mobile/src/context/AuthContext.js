import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as api from '../api';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  // Load user from storage on app start
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        if (storedToken) {
          setToken(storedToken);
          // Verify token and get fresh user data
          const { data } = await api.getCurrentUser();
          setUser(data);
        }
      } catch (error) {
        console.log("No valid session found", error);
        await AsyncStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (formData) => {
    try {
      const { data } = await api.login(formData);
      setUser(data.user);
      setToken(data.token);
      await AsyncStorage.setItem('token', data.token);
      
      router.replace('/(tabs)'); 
      return data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (formData) => {
    try {
      const { data } = await api.register(formData);
      setUser(data.user);
      setToken(data.token);
      await AsyncStorage.setItem('token', data.token);
      router.replace('/(tabs)');
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('token');
    router.replace('/(auth)/login');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};