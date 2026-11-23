import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

const CustomerRoute = ({ children }) => {
  const { isAdmin } = useAuth();

  return (
    <ProtectedRoute>
      {isAdmin
        ? <Navigate to="/admin/dashboard" replace />
        : children}
    </ProtectedRoute>
  );
};

export default CustomerRoute;
