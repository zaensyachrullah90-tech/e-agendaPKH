import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { ref, onValue } from 'firebase/database';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function UserDashboard() {
  const { profile } = useAuth();
  const [agendas, setAgendas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.uid) return;
    
    // Sistem mengambil data HANYA dari direktori UID milik user yang sedang login (Terkunci per Email)
    const unsubscribe = onValue(ref(db, `agenda_harian/${profile.uid}`), (snapshot) => {
      if (snapshot.exists()) {
        const dataArr = Object.values(snapshot.val());
        // Mengurutkan dari kegiatan yang paling baru diinput (timestamp terbesar)
        const sorted = dataArr.sort((a, b) => b.timestamp - a.timestamp);
        setAgendas(sorted);
      } else {
        setAgendas([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const totalVolume = agendas.reduce((sum, curr) => sum + (Number(curr.volume) || 0), 0);

  return (
    <div className="min-h-screen bg-[#05050a] pt-28 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Banner Selamat Datang */}
        <div className="glass-card-glossy p-8 rounded-3xl flex flex-col sm:flex-row justify-between items-center border border-white/10 shadow-2xl">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Ringkasan Kinerja Harian</h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">
              Formasi: <span className="text-purple-400 font-bold">{profile?.jabatan?.replace(/_/g, ' ')}</span>
            </p>
          </div>
          <Link to="/tambah-agenda" className="mt-4 sm:mt-0 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold px-5 py-3 rounded-xl shadow-lg shadow-orange-500/20 hover:opacity-90 transition-all uppercase tracking-widest flex items-center">
            <i className="fas fa-plus mr-2"></i>Tambah Log Baru
          </Link>
        </div>

        {/* Metriks Widget Ringkas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="glass-card-glossy p-6 rounded-2xl flex items-center space-x-4 border border-white/5 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-xl">
              <i className="fas fa-list-check"></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{agendas.length}</p>
              <p className="text-[10px] uppercase text-slate-400 tracking-wider">Total Entri Kegiatan</p>
            </div>
          </div>
          <div className="glass-card-glossy p-6 rounded-2xl flex items-center space-x-4 border border-white/5 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 text-xl">
              <i className="fas fa-cubes"></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalVolume}</p>
              <p className="text-[10px] uppercase text-slate-400 tracking-wider">Akumulasi Volume</p>
            </div>
          </div>
          <div className="glass-card-glossy p-6 rounded-2xl flex items-center space-x-4 border border-white/5 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl">
              <i className="fas fa-shield-halved"></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">Aktif</p>
              <p className="text-[10px] uppercase text-slate-400 tracking-wider">Status Lisensi Premium</p>
            </div>
          </div>
        </div>

        {/* Log Aktivitas Terkini */}
        <div className="glass-card-glossy p-6 rounded-3xl border border-white/5 shadow-2xl">
          <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
            <i className="fas fa-clock text-slate-500"></i> Aktivitas Terkini
          </h3>
          
          {loading ? (
            <p className="text-center text-amber-500 text-sm py-8"><i className="fas fa-spinner animate-spin mr-2"></i>Memuat riwayat...</p>
          ) : agendas.length === 0 ? (
            <div className="py-12 text-center">
              <i className="fas fa-folder-open text-slate-700 text-4xl mb-4 block"></i>
              <p className="text-slate-500 text-sm font-medium">Belum ada rekaman agenda kerja harian yang tersimpan.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {agendas.slice(0, 5).map((item) => (
                <div key={item.agendaId} className="p-4 rounded-xl bg-black/40 border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-white/20 transition-all duration-300">
                  <div className="flex items-center space-x-4 w-full">
                    
                    {/* LOGIKA FOTO & FALLBACK ICON YANG ELEGAN */}
                    {item.photoUrl ? (
                      <img 
                        src={item.photoUrl} 
                        alt="Bukti Dokumentasi Kegiatan" 
                        className="w-14 h-14 rounded-xl object-cover border border-white/10 shadow-md bg-slate-900 flex-shrink-0" 
                        loading="lazy" 
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-800 to-[#05050a] border border-white/10 shadow-inner flex flex-col items-center justify-center flex-shrink-0">
                        <i className="fas fa-image-slash text-slate-500 text-lg mb-0.5"></i>
                        <span className="text-[6px] uppercase tracking-widest text-slate-500 font-bold">No Image</span>
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20 tracking-wider">
                          {item.rhk_code}
                        </span>
                        {item.display_id && (
                          <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                            ID: {item.display_id}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1 leading-snug">{item.laporan_harian}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 italic font-light">"{item.detail_aktivitas}"</p>
                    </div>
                  </div>
                  
                  <div className="text-right w-full md:w-auto flex justify-between md:flex-col items-center md:items-end border-t md:border-t-0 border-white/5 pt-3 md:pt-0 shrink-0">
                    <span className="text-[11px] font-bold text-white bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 shadow-inner">
                      {item.volume} Volume
                    </span>
                    <span className="text-[10px] text-slate-500 mt-2 tracking-wide font-mono">
                      {item.tanggal}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {agendas.length > 5 && (
            <div className="mt-6 text-center pt-4 border-t border-white/10">
              <Link to="/rekap" className="text-xs text-purple-400 font-bold tracking-widest hover:text-white transition-colors">
                LIHAT SELURUH RIWAYAT AGENDA <i className="fas fa-arrow-right ml-1"></i>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
