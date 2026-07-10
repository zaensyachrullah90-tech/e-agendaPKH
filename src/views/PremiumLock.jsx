import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function PremiumLock() {
  const { profile, logoutUser } = useAuth();

  if (profile && profile.isPaid && profile.isActive) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#030307] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[150px]"></div>
      
      <div className="glass-card-glossy max-w-md w-full p-8 rounded-3xl border border-white/10 text-center relative z-10 animate-slide-in">
        <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-500/20">
          <i className="fas fa-crown text-white text-2xl"></i>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-wide">Aktivasi Akun Tertunda</h2>
        <p className="text-slate-400 text-xs mt-3 leading-relaxed">
          Sistem mendeteksi profil <span className="text-white font-bold">{profile?.name}</span> telah terdaftar. Hubungi penanggung jawab kabupaten untuk proses persetujuan dan verifikasi manual.
        </p>
        
        <div className="my-6 p-4 rounded-2xl bg-black/40 border border-white/5 text-left space-y-2.5 text-xs font-mono">
          <div className="flex justify-between text-slate-400"><span>Formasi:</span><span className="text-purple-400 font-bold">{profile?.jabatan}</span></div>
          <div className="flex justify-between text-slate-400"><span>Folder Drive ID:</span><span className="text-slate-300 truncate w-36 select-all">{profile?.driveFolderId}</span></div>
          <div className="flex justify-between text-slate-400"><span>Status Lisensi:</span><span className="text-orange-500 font-bold">Menunggu Pembayaran</span></div>
        </div>

        <div className="space-y-3">
          <a href="https://wa.me/6282255443322" target="_blank" rel="noreferrer" className="block w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold p-3.5 rounded-xl text-xs tracking-widest text-center shadow-lg shadow-orange-500/20 hover:opacity-90 transition-all">
            <i className="fab fa-whatsapp mr-2 text-sm"></i>KONFIRMASI VIA WHATSAPP
          </a>
          <button onClick={logoutUser} className="w-full bg-white/5 border border-white/10 text-white hover:bg-white/10 p-3 rounded-xl text-xs font-bold tracking-wider transition-all">
            KELUAR DARI AKUN
          </button>
        </div>
      </div>
    </div>
  );
}