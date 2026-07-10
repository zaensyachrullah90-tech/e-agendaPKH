import React, { useState } from 'react';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showToast("Autentikasi Berhasil! Selamat Datang.", "success");
      navigate("/");
    } catch (err) {
      showToast("Kredensial salah atau jaringan terputus.", "error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-[#05050a]">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-900/20 blur-[120px]"></div>
      
      <div className="glass-card-glossy max-w-md w-full p-8 rounded-3xl z-10 border border-white/10 shadow-2xl animate-slide-in">
        <div className="text-center mb-8">
          <div className="h-14 w-14 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
            <i className="fas fa-lock-open text-white text-2xl"></i>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-wide">E-AGENDA <span className="text-amber-500 font-light">PREMIUM</span></h2>
          <p className="text-slate-400 text-xs mt-2 uppercase tracking-widest font-mono">Tapin Regency Social Security System</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <input 
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)} 
            className="w-full glass-input rounded-xl p-3.5 text-sm focus:outline-none" 
            placeholder="Alamat Email SIP" 
          />
          <input 
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)} 
            className="w-full glass-input rounded-xl p-3.5 text-sm focus:outline-none" 
            placeholder="Kata Sandi" 
          />
          <button type="submit" className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-purple-600 text-white font-bold rounded-xl p-3.5 text-sm tracking-widest transition-all duration-300 shadow-lg shadow-amber-500/10 hover:opacity-90">
            MASUK KE DASHBOARD
          </button>
        </form>
        <p className="text-center mt-6 text-xs text-slate-400">Belum terdaftar? <Link to="/register" className="text-purple-400 font-bold hover:underline">Daftar Akun Baru</Link></p>
      </div>
    </div>
  );
}