// Check if a user is logged in before allowing them into the home pages of the app

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  // The Bouncer Logic:
  if (!user) {
    // If not logged in, redirect to Login page immediately
    return <Navigate to="/login" replace />;
  }

  // If logged in, render the page (the children)
  return children;
};

export default ProtectedRoute;