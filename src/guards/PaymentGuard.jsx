import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PaymentGuard({ children }) {
  const { profile } = useAuth();
  
  // SUPER ADMIN bypass semua aturan pembayaran
  if (profile?.role === 'superadmin') return children;

  if (!profile || !profile.isPaid || !profile.isActive) {
    return <Navigate to="/premium-lock" replace />;
  }
  return children;
}