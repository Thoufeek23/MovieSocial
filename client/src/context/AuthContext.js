// src/context/AuthContext.js
import React, { createContext, useReducer, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // <-- FIX: Changed import style

const initialState = {
  user: null,
};

// Check for token in localStorage on initial load
if (localStorage.getItem('token')) {
  const decodedToken = jwtDecode(localStorage.getItem('token')); // <-- FIX: Changed function name

  // Check if token is expired
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
});

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
      };
    default:
      return state;
  }
}

function AuthProvider(props) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = (userData) => {
    localStorage.setItem('token', userData.token);
    const user = jwtDecode(userData.token).user; // <-- FIX: Changed function name
    dispatch({
      type: 'LOGIN',
      payload: user,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider
      value={{ user: state.user, login, logout }}
      {...props}
    />
  );
}

export { AuthContext, AuthProvider };