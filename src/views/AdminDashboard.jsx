import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { ref, onValue, update } from 'firebase/database';
import { useToast } from '../context/ToastContext';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const usersRef = ref(db, 'users');
    
    // Mengaktifkan Realtime Socket Listener dengan Error Handler (Anti-Stuck Loading)
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const allUsers = Object.values(snapshot.val());
        const filteredOrdinaryUsers = allUsers.filter(u => u.role !== 'superadmin');
        const sortedUsers = filteredOrdinaryUsers.sort((a, b) => b.registeredAt - a.registeredAt);
        setUsers(sortedUsers);
      } else {
        setUsers([]);
      }
      setLoading(false); // Matikan loading jika sukses
    }, (error) => {
      console.error("Firebase Database Error:", error);
      showToast("Gagal memuat data. Pastikan status Super Admin Anda valid.", "error");
      setLoading(false); // Matikan loading secara paksa jika Firebase menolak akses
    });

    return () => unsubscribe();
  }, [showToast]);

  const toggleUserLicense = async (uid, currentStatus) => {
    try {
      const userStatusUpdates = {};
      userStatusUpdates[`users/${uid}/isPaid`] = !currentStatus;
      userStatusUpdates[`users/${uid}/isActive`] = !currentStatus;

      await update(ref(db), userStatusUpdates);
      showToast(`Akses akun personil berhasil ${!currentStatus ? 'Diaktifkan' : 'Dikunci'} seketika!`, "success");
    } catch (err) {
      showToast(`Gagal merubah status: ${err.message}`, "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#05050a] pt-28 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="glass-card-glossy p-6 rounded-3xl mb-8 border border-white/5 shadow-2xl animate-slide-in">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <i className="fas fa-users-cog text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">Sistem Otorisasi & Manajemen Lisensi</h1>
              <p className="text-slate-400 text-xs mt-0.5 uppercase tracking-widest font-mono">Persetujuan Instan SDM PKH Tapin Tanpa Akses Konsol Database</p>
            </div>
          </div>
        </div>

        <div className="glass-card-glossy rounded-3xl overflow-hidden border border-white/5 shadow-2xl animate-slide-in">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/40 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-white/5">
                  <th className="p-5">Nama Lengkap / Kontrak Kerja</th>
                  <th className="p-5">Formasi Jabatan</th>
                  <th className="p-5">Folder Google Drive Cloud ID</th>
                  <th className="p-5 text-center">Status Aplikasi</th>
                  <th className="p-5 text-center">Tindakan Konfirmasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-purple-400">
                      <i className="fas fa-circle-notch animate-spin text-2xl mb-3 block"></i>
                      <span className="text-xs font-mono tracking-widest">MEMUAT ALUR DATA REALTIME...</span>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-slate-500 font-medium">
                      <i className="fas fa-mail-bulk text-2xl mb-3 block text-slate-700"></i>
                      Belum ada personil baru yang mendaftar ke dalam antrean sistem agenda.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.uid} className="hover:bg-white/5 transition-colors duration-200">
                      <td className="p-5 font-bold text-white">
                        {u.name}
                        <br/>
                        <span className="text-xs text-slate-500 font-mono font-normal">{u.email}</span>
                      </td>
                      <td className="p-5 text-xs font-bold text-purple-400 tracking-wider">
                        {u.jabatan}
                      </td>
                      <td className="p-5 text-xs text-slate-400 font-mono select-all truncate max-w-xs" title={u.driveFolderId}>
                        {u.driveFolderId}
                      </td>
                      <td className="p-5 text-center">
                        <span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border tracking-wide ${
                          u.isActive 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-lg shadow-emerald-500/5' 
                            : 'bg-rose-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {u.isActive ? "✓ AKTIF & PREMIUM" : "⚠ AKSES TERKUNCI"}
                        </span>
                      </td>
                      <td className="p-5 text-center">
                        <button 
                          onClick={() => toggleUserLicense(u.uid, u.isActive)} 
                          className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all duration-300 shadow-md ${
                            u.isActive 
                              ? 'bg-red-600/10 text-red-400 border border-red-500/20 hover:bg-red-600 hover:text-white' 
                              : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:opacity-90 shadow-orange-500/10'
                          }`}
                        >
                          {u.isActive ? "Kunci Akses" : "Konfirmasi & Aktifkan"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </div>
  );
}