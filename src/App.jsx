import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Context Providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Views Components
import Login from './views/Login';
import Register from './views/Register';
import PremiumLock from './views/PremiumLock';
import UserDashboard from './views/UserDashboard';
import AdminDashboard from './views/AdminDashboard';
import AdminRhkManager from './views/AdminRhkManager';
import LuxuryAgendaForm from './views/LuxuryAgendaForm'; // Import modul baru
import AnalisaRhk from './views/AnalisaRhk';             // Import modul baru
import RekapAgenda from './views/RekapAgenda';           // Import modul baru
import Pengaturan from './views/Pengaturan';             // Import modul baru
import Navbar from './components/Navbar';

// Security Guards
import PaymentGuard from './guards/PaymentGuard';
import RoleGuard from './guards/RoleGuard';

function AppRoutes() {
  const { user, loading } = useAuth();

  // Layar loading beranimasi saat Firebase mengecek sesi login
  if (loading) {
    return (
      <div className="min-h-screen bg-[#05050a] flex items-center justify-center">
        <i className="fas fa-circle-notch animate-spin text-amber-500 text-4xl"></i>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {/* Navbar hanya muncul jika user sudah login */}
      {user && <Navbar />}
      
      <Routes>
        {/* Rute Publik (Dialihkan ke Dashboard jika sudah login) */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
        
        {/* Rute Kunci Aktivasi / Lisensi */}
        <Route path="/premium-lock" element={user ? <PremiumLock /> : <Navigate to="/login" />} />

        {/* Rute Utama Dashboard (Hanya bisa diakses jika sudah membayar/aktif) */}
        <Route path="/" element={
          <PaymentGuard>
            {user ? <UserDashboard /> : <Navigate to="/login" />}
          </PaymentGuard>
        } />

        {/* Rute Tambah Agenda Baru */}
        <Route path="/tambah-agenda" element={
          <PaymentGuard>
            {user ? (
              <div className="min-h-screen bg-[#05050a] pt-28 pb-12 px-4 max-w-3xl mx-auto">
                <LuxuryAgendaForm />
              </div>
            ) : <Navigate to="/login" />}
          </PaymentGuard>
        } />

        {/* Rute Analisa RHK */}
        <Route path="/analisa" element={
          <PaymentGuard>
            {user ? (
              <div className="min-h-screen bg-[#05050a] pt-28 pb-12 px-4 max-w-5xl mx-auto">
                <AnalisaRhk />
              </div>
            ) : <Navigate to="/login" />}
          </PaymentGuard>
        } />

        {/* Rute Rekap Agenda & Cetak PDF */}
        <Route path="/rekap" element={
          <PaymentGuard>
            {user ? <RekapAgenda /> : <Navigate to="/login" />}
          </PaymentGuard>
        } />

        {/* Rute Pengaturan Profil & Sandi */}
        <Route path="/pengaturan" element={
          <PaymentGuard>
            {user ? <Pengaturan /> : <Navigate to="/login" />}
          </PaymentGuard>
        } />

        {/* Rute Khusus Manajemen RHK Super Admin */}
        <Route path="/admin-rhk" element={
          <RoleGuard allowedRoles={['superadmin']}>
            <AdminRhkManager />
          </RoleGuard>
        } />

        {/* Rute Khusus Panel Super Admin */}
        <Route path="/admin" element={
          <RoleGuard allowedRoles={['superadmin']}>
            <AdminDashboard />
          </RoleGuard>
        } />

        {/* Rute Penjaga: Arahkan ke halaman utama jika URL tidak ditemukan */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ToastProvider>
  );
}