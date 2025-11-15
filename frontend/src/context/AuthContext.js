import React, { createContext, useReducer, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import * as api from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState = {
  user: null,
  loading: true, // Add a loading state
  isNewUser: false,
};

// Create the context
const AuthContext = createContext({
  user: null,
  loading: true, // Add loading to the context
  login: (userData) => {},
  logout: () => {},
  setUser: (user) => {},
  isJustLoggedIn: false,
  setJustLoggedIn: () => {},
  isNewUser: false,
  setNewUser: () => {},
});

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload };
    case 'LOGOUT':
      return { ...state, user: null, isNewUser: false };
    case 'SET_LOADING': // Add new action type
      return { ...state, loading: action.payload };
    case 'SET_NEW_USER':
      return { ...state, isNewUser: action.payload };
    default:
      return state;
  }
}

// The provider component
function AuthProvider(props) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [isJustLoggedIn, setJustLoggedIn] = useState(false);

  // This effect runs on app start to load the user
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const decodedToken = jwtDecode(token);
          if (decodedToken.exp * 1000 < Date.now()) {
            await AsyncStorage.removeItem('token');
          } else {
            dispatch({ type: 'LOGIN', payload: decodedToken.user });
          }
        }
      } catch (e) {
        console.error("Failed to load user from storage", e);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadUserFromStorage();
  }, []); // Empty array means this runs once on mount

  const login = async (userData, isNewUser = false) => {
    try {
      await AsyncStorage.setItem('token', userData.token);
      const user = jwtDecode(userData.token).user;
      dispatch({
        type: 'LOGIN',
        payload: user,
      });
      dispatch({
        type: 'SET_NEW_USER',
        payload: isNewUser,
      });
      setJustLoggedIn(true);
    } catch (e) {
      console.error("Failed to save token", e);
    }
  };

  const setNewUser = (isNew) => {
    dispatch({ type: 'SET_NEW_USER', payload: isNew });
  };

  const setUser = (user) => {
    dispatch({ type: 'LOGIN', payload: user });
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      dispatch({ type: 'LOGOUT' });
      setJustLoggedIn(false);
    } catch (e) {
      console.error("Failed to remove token", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        loading: state.loading,
        isNewUser: state.isNewUser,
        login,
        logout,
        setUser,
        isJustLoggedIn,
        setJustLoggedIn,
        setNewUser,
      }}
      {...props}
    />
  );
}

// Export a custom hook to easily use the context
export const useAuth = () => {
  return useContext(AuthContext);
};

export { AuthContext, AuthProvider };