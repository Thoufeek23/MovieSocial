import React, { createContext, useReducer, useState, useEffect, useContext, useCallback } from 'react'; // Added useContext and useCallback
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
  unreadCount: 0,
  updateUnreadCount: () => {},
  isLinkedInCardMinimized: true,
  setIsLinkedInCardMinimized: () => {}
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
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLinkedInCardMinimized, setIsLinkedInCardMinimized] = useState(true);

  const updateUnreadCount = useCallback(async () => {
    if (!state.user) return;
    try {
      const { data } = await api.getUnreadMessageCount();
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error("Failed to update unread count", error);
    }
  }, [state.user]);

  useEffect(() => {
    if (state.user) {
      updateUnreadCount();
    }
  }, [state.user, updateUnreadCount]);

  const login = (userData, isNewUser = false) => {
    localStorage.setItem('token', userData.token);
    const user = jwtDecode(userData.token).user;
    
    dispatch({
      type: 'LOGIN',
      payload: user,
    });
    
    if (isNewUser) {
      dispatch({ type: 'SET_NEW_USER', payload: true });
    }
    
    setJustLoggedIn(true);
    updateUnreadCount(); 
    
    (async () => {
      try {
        if (typeof window !== 'undefined') {
          const g = await api.getModleStatus('global').then(r => r.data).catch(() => null);
          const payload = g ? { global: g } : null;
          if (payload) window.dispatchEvent(new CustomEvent('modleUpdated', { detail: payload }));
        }
      } catch (e) {}
    })();
  };

  const setUser = (user) => {
    dispatch({ type: 'LOGIN', payload: user });
    updateUnreadCount();
  };

  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
    setJustLoggedIn(false);
    setUnreadCount(0);
    setIsLinkedInCardMinimized(true);
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
        setNewUser,
        unreadCount,
        updateUnreadCount,
        isLinkedInCardMinimized,
        setIsLinkedInCardMinimized
      }}
      {...props}
    />
  );
}

// --- ADDED THIS HOOK ---
const useAuth = () => useContext(AuthContext);

export { AuthContext, AuthProvider, useAuth };