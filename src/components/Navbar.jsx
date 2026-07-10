import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { profile, logoutUser } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  if (!profile) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/10 bg-[#05050a]/80 backdrop-blur-xl print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between relative z-50">
        
        {/* LOGO */}
        <Link to="/" className="flex items-center space-x-3 group" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform duration-300">
            <i className="fas fa-calendar-check text-white text-base"></i>
          </div>
          <span className="text-base font-extrabold tracking-wider text-white">
            E-AGENDA <span className="text-amber-500 font-light">GLOSSY</span>
          </span>
        </Link>

        {/* MENU DESKTOP & TABLET BESAR */}
        <div className="hidden lg:flex items-center space-x-1 bg-black/40 p-1 rounded-xl border border-white/5">
          <Link to="/" className={`text-[11px] font-bold tracking-widest uppercase px-3 py-2 rounded-lg transition-all ${isActive('/') ? 'bg-white/10 text-amber-400 shadow-md' : 'text-slate-400 hover:text-white'}`}>
            <i className="fas fa-chart-line mr-1.5"></i>Dashboard
          </Link>
          <Link to="/tambah-agenda" className={`text-[11px] font-bold tracking-widest uppercase px-3 py-2 rounded-lg transition-all ${isActive('/tambah-agenda') ? 'bg-white/10 text-amber-400 shadow-md' : 'text-slate-400 hover:text-white'}`}>
            <i className="fas fa-plus-circle mr-1.5"></i>Tambah
          </Link>
          <Link to="/analisa" className={`text-[11px] font-bold tracking-widest uppercase px-3 py-2 rounded-lg transition-all ${isActive('/analisa') ? 'bg-white/10 text-amber-400 shadow-md' : 'text-slate-400 hover:text-white'}`}>
            <i className="fas fa-chart-pie mr-1.5"></i>Analisa
          </Link>
          <Link to="/rekap" className={`text-[11px] font-bold tracking-widest uppercase px-3 py-2 rounded-lg transition-all ${isActive('/rekap') ? 'bg-white/10 text-amber-400 shadow-md' : 'text-slate-400 hover:text-white'}`}>
            <i className="fas fa-timeline mr-1.5"></i>Rekap
          </Link>
          <Link to="/pengaturan" className={`text-[11px] font-bold tracking-widest uppercase px-3 py-2 rounded-lg transition-all ${isActive('/pengaturan') ? 'bg-white/10 text-amber-400 shadow-md' : 'text-slate-400 hover:text-white'}`}>
            <i className="fas fa-sliders mr-1.5"></i>Pengaturan
          </Link>
        </div>

        {/* PROFIL DESKTOP & TOMBOL HAMBURGER MOBILE */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {profile.role === 'superadmin' && (
            <div className="hidden sm:flex items-center space-x-1 bg-amber-500/10 p-1 rounded-xl border border-amber-500/20">
              <Link to="/admin" className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1.5 rounded-lg transition-all ${isActive('/admin') ? 'bg-purple-600 text-white' : 'text-amber-400 hover:text-white'}`}>USERS</Link>
              <Link to="/admin-rhk" className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1.5 rounded-lg transition-all ${isActive('/admin-rhk') ? 'bg-amber-500 text-white' : 'text-amber-400 hover:text-white'}`}>RHK DB</Link>
            </div>
          )}

          <div className="text-right hidden sm:block border-l border-white/10 pl-4">
            <p className="text-xs font-bold text-white tracking-wide">{profile.name}</p>
            <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">{profile.role === 'superadmin' ? 'ADMIN' : 'PERSONIL'}</p>
          </div>

          <button onClick={logoutUser} className="hidden sm:flex h-9 w-9 rounded-xl bg-red-500/10 border border-red-500/20 items-center justify-center text-red-400 hover:bg-red-600 hover:text-white transition-all duration-300 shadow-md">
            <i className="fas fa-power-off text-sm"></i>
          </button>

          {/* Tombol Hamburger Khusus Mobile */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="lg:hidden h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 active:scale-95"
          >
            <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-lg`}></i>
          </button>
        </div>
      </div>

      {/* DROPDOWN MENU KHUSUS MOBILE */}
      <div 
        className={`lg:hidden absolute top-full left-0 w-full glass-card-glossy border-b border-white/10 transition-all duration-500 ease-in-out overflow-hidden shadow-2xl ${
          isMobileMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 py-6 flex flex-col space-y-2 bg-[#05050a]/90 backdrop-blur-xl">
          <Link onClick={() => setIsMobileMenuOpen(false)} to="/" className={`flex items-center text-xs font-bold tracking-widest uppercase p-4 rounded-xl transition-all ${isActive('/') ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner' : 'bg-black/30 text-slate-300 hover:bg-white/10 border border-transparent'}`}>
            <i className="fas fa-chart-line w-7 text-center"></i>Dashboard
          </Link>
          <Link onClick={() => setIsMobileMenuOpen(false)} to="/tambah-agenda" className={`flex items-center text-xs font-bold tracking-widest uppercase p-4 rounded-xl transition-all ${isActive('/tambah-agenda') ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner' : 'bg-black/30 text-slate-300 hover:bg-white/10 border border-transparent'}`}>
            <i className="fas fa-plus-circle w-7 text-center"></i>Tambah Agenda
          </Link>
          <Link onClick={() => setIsMobileMenuOpen(false)} to="/analisa" className={`flex items-center text-xs font-bold tracking-widest uppercase p-4 rounded-xl transition-all ${isActive('/analisa') ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner' : 'bg-black/30 text-slate-300 hover:bg-white/10 border border-transparent'}`}>
            <i className="fas fa-chart-pie w-7 text-center"></i>Analisa RHK
          </Link>
          <Link onClick={() => setIsMobileMenuOpen(false)} to="/rekap" className={`flex items-center text-xs font-bold tracking-widest uppercase p-4 rounded-xl transition-all ${isActive('/rekap') ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner' : 'bg-black/30 text-slate-300 hover:bg-white/10 border border-transparent'}`}>
            <i className="fas fa-timeline w-7 text-center"></i>Rekap Agenda
          </Link>
          <Link onClick={() => setIsMobileMenuOpen(false)} to="/pengaturan" className={`flex items-center text-xs font-bold tracking-widest uppercase p-4 rounded-xl transition-all ${isActive('/pengaturan') ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner' : 'bg-black/30 text-slate-300 hover:bg-white/10 border border-transparent'}`}>
            <i className="fas fa-sliders w-7 text-center"></i>Pengaturan
          </Link>
          
          {profile.role === 'superadmin' && (
            <div className="pt-2 mt-2 border-t border-white/10 grid grid-cols-2 gap-3">
              <Link onClick={() => setIsMobileMenuOpen(false)} to="/admin" className={`flex items-center justify-center text-[10px] font-bold tracking-widest uppercase p-3 rounded-xl transition-all shadow-md ${isActive('/admin') ? 'bg-purple-600 text-white' : 'bg-purple-900/40 text-purple-300 border border-purple-500/20'}`}>
                <i className="fas fa-users mr-2"></i> Users
              </Link>
              <Link onClick={() => setIsMobileMenuOpen(false)} to="/admin-rhk" className={`flex items-center justify-center text-[10px] font-bold tracking-widest uppercase p-3 rounded-xl transition-all shadow-md ${isActive('/admin-rhk') ? 'bg-amber-500 text-white' : 'bg-amber-900/40 text-amber-300 border border-amber-500/20'}`}>
                <i className="fas fa-database mr-2"></i> RHK DB
              </Link>
            </div>
          )}

          <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-between">
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white tracking-wide truncate">{profile.name}</p>
              <p className="text-[10px] font-mono text-amber-500 uppercase tracking-widest mt-0.5">{profile.role === 'superadmin' ? 'Super Administrator' : 'Personil Lapangan'}</p>
            </div>
            <button onClick={logoutUser} className="h-11 w-11 shrink-0 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-600 hover:text-white transition-all duration-300 shadow-md">
              <i className="fas fa-power-off text-base"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
