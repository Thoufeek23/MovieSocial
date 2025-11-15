import React, { createContext, useReducer, useState } from 'react';
// jwt-decode exports a named function 'jwtDecode'
import { jwtDecode } from 'jwt-decode';
import * as api from '../api';

const initialState = {
  user: null,
  isNewUser: false,
};

if (localStorage.getItem('token')) {
  const decodedToken = jwtDecode(localStorage.getItem('token'));
  if (decodedToken.exp * 1000 < Date.now()) {
    localStorage.removeItem('token');
  } else {
    initialState.user = decodedToken.user;
    // We'll fetch full user data in the AuthProvider component
  }
}

const AuthContext = createContext({
  user: null,
  login: (userData) => {},
  logout: () => {},
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
    case 'SET_NEW_USER':
      return { ...state, isNewUser: action.payload };
    default:
      return state;
  }
}

function AuthProvider(props) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [isJustLoggedIn, setJustLoggedIn] = useState(false);





  const login = (userData, isNewUser = false) => {
    localStorage.setItem('token', userData.token);
    const user = jwtDecode(userData.token).user;
    
    // Set user data immediately from JWT (which now includes isAdmin)
    dispatch({
      type: 'LOGIN',
      payload: user,
    });
    
    // Set new user flag if this is their first login
    if (isNewUser) {
      dispatch({ type: 'SET_NEW_USER', payload: true });
    }
    
    setJustLoggedIn(true); // Set the flag to trigger the animation
    
    // After login, fetch authoritative modle status and broadcast so UI can update immediately
    (async () => {
      try {
        if (typeof window !== 'undefined') {
          const g = await api.getModleStatus('global').then(r => r.data).catch(() => null);
          const payload = g ? { global: g } : null;
          if (payload) window.dispatchEvent(new CustomEvent('modleUpdated', { detail: payload }));
        }
      } catch (e) {
        // ignore
      }
    })();
  };

  // Allow updating the cached current user object (e.g., to refresh following list)
  const setUser = (user) => {
    // Update the reducer state
    dispatch({ type: 'LOGIN', payload: user });
    // Try to preserve token if present — we can't re-issue a token here, but we still keep the in-memory state
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Re-encode token not done here; leave token as-is. This keeps backward compatibility.
      }
    } catch (e) {
      // ignore
    }
    // Also refresh modle status for UI consumers
    (async () => {
      try {
        if (typeof window !== 'undefined') {
          const g = await api.getModleStatus('global').then(r => r.data).catch(() => null);
          const payload = g ? { global: g } : null;
          if (payload) window.dispatchEvent(new CustomEvent('modleUpdated', { detail: payload }));
        }
      } catch (e) { /* ignore */ }
    })();
  };

  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
    setJustLoggedIn(false);
  };

  const setNewUser = (isNew) => {
    dispatch({ type: 'SET_NEW_USER', payload: isNew });
  };

  return (
    <AuthContext.Provider
      value={{ 
        user: state.user, 
        login, 
        logout, 
        setUser, 
        isJustLoggedIn, 
        setJustLoggedIn,
        isNewUser: state.isNewUser,
        setNewUser
      }}
      {...props}
    />
  );
}

export { AuthContext, AuthProvider };