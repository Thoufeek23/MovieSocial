import React, { createContext, useReducer, useState } from 'react';
// jwt-decode exports a named function 'jwtDecode'
import { jwtDecode } from 'jwt-decode';

const initialState = {
  user: null,
};

if (localStorage.getItem('token')) {
  const decodedToken = jwtDecode(localStorage.getItem('token'));
  if (decodedToken.exp * 1000 < Date.now()) {
    localStorage.removeItem('token');
  } else {
    initialState.user = decodedToken.user;
  }
}

const AuthContext = createContext({
  user: null,
  login: (userData) => {},
  logout: () => {},
  isJustLoggedIn: false,
  setJustLoggedIn: () => {},
});

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload };
    case 'LOGOUT':
      return { ...state, user: null };
    default:
      return state;
  }
}

function AuthProvider(props) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [isJustLoggedIn, setJustLoggedIn] = useState(false);

  const login = (userData) => {
    localStorage.setItem('token', userData.token);
    const user = jwtDecode(userData.token).user;
    dispatch({
      type: 'LOGIN',
      payload: user,
    });
    setJustLoggedIn(true); // Set the flag to trigger the animation
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
  };

  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
    setJustLoggedIn(false);
  };

  return (
    <AuthContext.Provider
      value={{ user: state.user, login, logout, setUser, isJustLoggedIn, setJustLoggedIn }}
      {...props}
    />
  );
}

export { AuthContext, AuthProvider };