import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

const SellerRoute = ({ children }) => {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      {user?.role === 'seller'
        ? children
        : <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/'} replace />}
    </ProtectedRoute>
  );
};

export default SellerRoute;
