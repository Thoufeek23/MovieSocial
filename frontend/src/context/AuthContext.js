import React, { createContext, useReducer, useState } from 'react';
// jwt-decode exports a named function 'jwtDecode'
import { jwtDecode } from 'jwt-decode';
import * as api from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState = {
  user: null,
  loading: true, // <-- Add a loading state
};

// Create the context
const AuthContext = createContext({
  user: null,
  loading: true, // <-- Add loading to the context
  login: (userData) => {},
  logout: () => {},
  setUser: (user) => {},
  isJustLoggedIn: false,
  setJustLoggedIn: () => {},
});

// Reducer is updated to handle loading state
function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload };
    case 'LOGOUT':
      return { ...state, user: null };
    case 'SET_LOADING': // <-- Add new action type
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

// The provider component
function AuthProvider(props) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [isJustLoggedIn, setJustLoggedIn] = useState(false);

  // <-- NEW: This effect runs on app start to load the user
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const decodedToken = jwtDecode(token);
          // Check if token is expired
          if (decodedToken.exp * 1000 < Date.now()) {
            await AsyncStorage.removeItem('token');
          } else {
            // Token is valid, log the user in
            dispatch({ type: 'LOGIN', payload: decodedToken.user });
          }
        }
      } catch (e) {
        console.error("Failed to load user from storage", e);
      } finally {
        // We're done loading, whether we found a user or not
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadUserFromStorage();
  }, []); // Empty array means this runs once on mount

  // MODIFIED: login is now async
  const login = async (userData) => {
    try {
      await AsyncStorage.setItem('token', userData.token); // <-- Use AsyncStorage
      const user = jwtDecode(userData.token).user;
      dispatch({
        type: 'LOGIN',
        payload: user,
      });
      setJustLoggedIn(true);
      // Removed the browser-only 'window.dispatchEvent' logic
    } catch (e) {
      console.error("Failed to save token", e);
    }
  };

  // MODIFIED: setUser no longer interacts with storage or window
  const setUser = (user) => {
    // Update the reducer state
    dispatch({ type: 'LOGIN', payload: user });
    // Removed browser-only logic
  };

  // MODIFIED: logout is now async
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token'); // <-- Use AsyncStorage
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
        loading: state.loading, // <-- Pass loading state
        login,
        logout,
        setUser,
        isJustLoggedIn,
        setJustLoggedIn,
      }}
      {...props}
    />
  );
}

// <-- NEW: Export a custom hook to easily use the context
export const useAuth = () => {
  return useContext(AuthContext);
};

export { AuthContext, AuthProvider };