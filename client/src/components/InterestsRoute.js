import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const InterestsRoute = ({ children }) => {
  const { user, isNewUser } = useContext(AuthContext);
  
  // Check if this is a Google signup flow (temp data exists)
  const googleSignupTemp = localStorage.getItem('googleSignupTemp');

  if (!user && !googleSignupTemp) {
    // User is not authenticated and no pending Google signup, redirect to login
    return <Navigate to="/login" replace />;
  }

  if (!isNewUser && !googleSignupTemp) {
    // Not a new user and no pending Google signup, redirect to home
    return <Navigate to="/" replace />;
  }

  return children;
};

export default InterestsRoute;