import React, { createContext, useReducer, useState } from 'react';
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

  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
    setJustLoggedIn(false);
  };

  return (
    <AuthContext.Provider
      value={{ user: state.user, login, logout, isJustLoggedIn, setJustLoggedIn }}
      {...props}
    />
  );
}

export { AuthContext, AuthProvider };