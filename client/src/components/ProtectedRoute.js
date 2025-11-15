import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, isNewUser } = useContext(AuthContext);

  if (!user) {
    // User is not authenticated, redirect to login
    return <Navigate to="/login" replace />;
  }

  if (isNewUser) {
    // New user needs to complete interests selection
    return <Navigate to="/interests" replace />;
  }

  return children;
};

export default ProtectedRoute;