import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const InterestsRoute = ({ children }) => {
  const { user, isNewUser } = useContext(AuthContext);

  if (!user) {
    // User is not authenticated, redirect to login
    return <Navigate to="/login" replace />;
  }

  if (!isNewUser) {
    // Not a new user, redirect to home
    return <Navigate to="/" replace />;
  }

  return children;
};

export default InterestsRoute;