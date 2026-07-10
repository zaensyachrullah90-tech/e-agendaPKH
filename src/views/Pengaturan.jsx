import React, { useState } from 'react';
import { auth, db } from '../config/firebase';
import { updatePassword } from 'firebase/auth';
import { ref, update } from 'firebase/database';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Pengaturan() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [newName, setNewName] = useState(profile?.name || '');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await update(ref(db, `users/${profile.uid}`), { name: newName });
      
      if (newPassword.trim() !== '') {
        if (newPassword.length < 6) {
          showToast("Kata sandi baru minimal harus 6 karakter!", "warning");
          setLoading(false);
          return;
        }
        await updatePassword(auth.currentUser, newPassword);
        setNewPassword('');
      }

      showToast("Profil dan Pengaturan Akun berhasil diperbarui secara permanen!", "success");
    } catch (err) {
      showToast(`Gagal memperbarui: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05050a] pt-28 pb-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto">
        
        <div className="glass-card-glossy p-8 rounded-3xl border border-white/10 shadow-2xl animate-slide-in">
          <div className="flex items-center space-x-4 mb-8 border-b border-white/10 pb-6">
            <div className="h-12 w-12 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <i className="fas fa-user-shield text-white text-xl"></i>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-wide">Pengaturan Keamanan Akun</h3>
              <p className="text-[11px] text-slate-400 uppercase tracking-widest font-mono mt-1">Ubah Data Diri dan Kata Sandi</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2.5">Alamat Email (Permanen / Identitas Unik)</label>
              <input 
                type="email" disabled value={profile?.email || ''} 
                className="w-full glass-input rounded-xl p-3.5 text-sm focus:outline-none opacity-40 cursor-not-allowed bg-black"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2.5">Ubah Nama Lengkap Personil</label>
              <input 
                type="text" required value={newName} onChange={(e) => setNewName(e.target.value)}
                className="w-full glass-input rounded-xl p-3.5 text-sm focus:outline-none border-white/20"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2.5">Ubah Kata Sandi Baru</label>
              <input 
                type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="w-full glass-input rounded-xl p-3.5 text-sm focus:outline-none border-white/20"
                placeholder="Biarkan kosong jika tidak ingin merubah kata sandi..."
              />
              <p className="text-[10px] text-slate-500 mt-2 leading-relaxed bg-black/30 p-3 rounded-xl border border-white/5">
                <i className="fas fa-lock text-purple-400 mr-1.5"></i>
                Jaminan Enkripsi: Kata sandi Anda dilindungi secara privat oleh arsitektur Firebase Auth dan tidak dapat diintip oleh pihak ketiga termasuk Admin.
              </p>
            </div>

            <div className="pt-4 border-t border-white/10">
              <button 
                type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 text-white font-bold p-4 rounded-xl text-sm tracking-widest hover:opacity-90 transition-all shadow-xl shadow-purple-500/20 disabled:opacity-50"
              >
                {loading ? "MEMPROSES PEMBARUAN..." : "SIMPAN PERUBAHAN AKUN"}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
