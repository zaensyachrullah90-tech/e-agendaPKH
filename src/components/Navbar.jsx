import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { profile, logoutUser } = useAuth();
  const location = useLocation();
  
  if (!profile) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/10 bg-[#05050a]/70 backdrop-blur-md print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-all duration-300">
            <i className="fas fa-calendar-check text-white text-base"></i>
          </div>
          <span className="text-base font-extrabold tracking-wider text-white">
            E-AGENDA <span className="text-amber-500 font-light">GLOSSY</span>
          </span>
        </Link>

        {/* Menu Navigasi Utama - Terstruktur Rapi */}
        <div className="hidden lg:flex items-center space-x-1 bg-black/40 p-1 rounded-xl border border-white/5">
          <Link to="/" className={`text-[11px] font-bold tracking-widest uppercase px-3 py-2 rounded-lg transition-all ${isActive('/') ? 'bg-white/10 text-amber-400 shadow-md' : 'text-slate-400 hover:text-white'}`}>
            <i className="fas fa-chart-line mr-1.5"></i>Dashboard
          </Link>
          <Link to="/tambah-agenda" className={`text-[11px] font-bold tracking-widest uppercase px-3 py-2 rounded-lg transition-all ${isActive('/tambah-agenda') ? 'bg-white/10 text-amber-400 shadow-md' : 'text-slate-400 hover:text-white'}`}>
            <i className="fas fa-plus-circle mr-1.5"></i>Tambah Agenda
          </Link>
          <Link to="/analisa" className={`text-[11px] font-bold tracking-widest uppercase px-3 py-2 rounded-lg transition-all ${isActive('/analisa') ? 'bg-white/10 text-amber-400 shadow-md' : 'text-slate-400 hover:text-white'}`}>
            <i className="fas fa-chart-pie mr-1.5"></i>Analisa RHK
          </Link>
          <Link to="/rekap" className={`text-[11px] font-bold tracking-widest uppercase px-3 py-2 rounded-lg transition-all ${isActive('/rekap') ? 'bg-white/10 text-amber-400 shadow-md' : 'text-slate-400 hover:text-white'}`}>
            <i className="fas fa-timeline mr-1.5"></i>Rekap Agenda
          </Link>
          <Link to="/pengaturan" className={`text-[11px] font-bold tracking-widest uppercase px-3 py-2 rounded-lg transition-all ${isActive('/pengaturan') ? 'bg-white/10 text-amber-400 shadow-md' : 'text-slate-400 hover:text-white'}`}>
            <i className="fas fa-sliders mr-1.5"></i>Pengaturan
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {profile.role === 'superadmin' && (
            <div className="flex items-center space-x-1 bg-amber-500/10 p-1 rounded-xl border border-amber-500/20">
              <Link to="/admin" className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1.5 rounded-lg transition-all ${isActive('/admin') ? 'bg-purple-600 text-white' : 'text-amber-400 hover:text-white'}`}>USERS</Link>
              <Link to="/admin-rhk" className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1.5 rounded-lg transition-all ${isActive('/admin-rhk') ? 'bg-amber-500 text-white' : 'text-amber-400 hover:text-white'}`}>RHK DB</Link>
            </div>
          )}

          <div className="text-right hidden sm:block border-l border-white/10 pl-4">
            <p className="text-xs font-bold text-white tracking-wide">{profile.name}</p>
            <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">{profile.role === 'superadmin' ? 'ADMIN' : 'PERSONIL'}</p>
          </div>

          <button onClick={logoutUser} className="h-9 w-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-600 hover:text-white transition-all duration-300 shadow-md">
            <i className="fas fa-power-off text-sm"></i>
          </button>
        </div>
      </div>
    </nav>
  );
}