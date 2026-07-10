import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../config/firebase';
import { ref, get, onValue } from 'firebase/database';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext'; // Ditambahkan untuk fitur Export PDF

export default function AnalisaRhk() {
  const { profile } = useAuth();
  const { showToast } = useToast(); // Inisialisasi Toast untuk notifikasi
  
  const [rawMaster, setRawMaster] = useState(null);
  const [rawLogs, setRawLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentDate = new Date();
  const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
  const currentYear = String(currentDate.getFullYear());

  const [filterMode, setFilterMode] = useState('monthly'); 
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  useEffect(() => {
    if (!profile?.jabatan || !profile?.uid) return;

    get(ref(db, `rhk_master/${profile.jabatan}`)).then((snap) => {
      if (!snap.exists()) {
        setRawMaster({});
        setLoading(false);
        return;
      }
      setRawMaster(snap.val());

      const unsubscribe = onValue(ref(db, `agenda_harian/${profile.uid}`), (agendaSnap) => {
        const logs = agendaSnap.exists() ? Object.values(agendaSnap.val()) : [];
        setRawLogs(logs);
        setLoading(false);
      });

      return () => unsubscribe();
    });
  }, [profile]);

  const metrics = useMemo(() => {
    if (!rawMaster) return [];

    return Object.entries(rawMaster).map(([code, content]) => {
      const masterTarget = Math.max(...Object.values(content.actions || {}).map(a => Number(a.target) || 0));
      const targetValue = filterMode === 'monthly' ? Math.ceil(masterTarget / 12) : masterTarget;

      const filteredLogs = rawLogs.filter(log => {
        if (log.rhk_code !== code) return false;
        
        const logDateStr = log.tanggal || ''; 
        if (!logDateStr) return false;

        const [logYear, logMonth] = logDateStr.split('-');

        if (filterMode === 'yearly') {
          return logYear === selectedYear;
        } else {
          return logYear === selectedYear && logMonth === selectedMonth;
        }
      });

      const currentProgress = filteredLogs.reduce((sum, curr) => sum + (Number(curr.volume) || 0), 0);
      const pct = targetValue > 0 ? Math.min((currentProgress / targetValue) * 100, 100).toFixed(1) : (currentProgress > 0 ? 100 : 0);
      const deficit = Math.max(targetValue - currentProgress, 0);
      const sunnah = Math.max(currentProgress - targetValue, 0); // Kelebihan dari target

      return {
        code,
        title: content.title,
        target: targetValue,
        current: currentProgress,
        deficit: deficit,
        sunnah: sunnah,
        pct: pct
      };
    });
  }, [rawMaster, rawLogs, filterMode, selectedMonth, selectedYear]);

  // Kalkulasi Total Keseluruhan (Akumulasi Semua RHK)
  const summary = useMemo(() => {
    let totalTarget = 0;
    let totalTerpenuhi = 0;
    let totalDefisit = 0;
    let totalSunnah = 0;
    let totalLaporan = 0; // Ditambahkan: Total seluruh capaian laporan

    metrics.forEach(m => {
      totalTarget += m.target;
      totalTerpenuhi += Math.min(m.current, m.target); // Hanya menghitung batas target wajib
      totalDefisit += m.deficit;
      totalSunnah += m.sunnah; // Mengakumulasi kelebihan kinerja
      totalLaporan += m.current; // Mengakumulasi seluruh laporan yang masuk tanpa batasan
    });

    return { totalTarget, totalTerpenuhi, totalDefisit, totalSunnah, totalLaporan };
  }, [metrics]);

  const months = [
    { value: '01', label: 'Januari' }, { value: '02', label: 'Februari' }, { value: '03', label: 'Maret' },
    { value: '04', label: 'April' }, { value: '05', label: 'Mei' }, { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' }, { value: '08', label: 'Agustus' }, { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'Desember' }
  ];
  const years = ['2024', '2025', '2026', '2027'];

  // Fungsi Eksekusi Cetak PDF
  const executePdfExport = () => {
    showToast("Mempersiapkan dokumen PDF Analisa...", "success");
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // Logika Cerdas Status Terpenuhi Keseluruhan
  const isTargetMet = summary.totalTarget > 0 && summary.totalDefisit === 0;

  return (
    <div className="glass-card-glossy p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl animate-slide-in bg-gradient-to-br from-[#0f0f15] to-[#05050a] print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
      
      {/* HEADER: KOP SURAT KHUSUS PRINT PDF (Tampil hanya saat dicetak) */}
      <div className="hidden print:block border-b-2 border-black pb-4 mb-6 text-center">
        <h1 className="text-xl font-black uppercase tracking-wide text-black">LAPORAN ANALISA REALISASI RHK</h1>
        <h2 className="text-sm font-bold text-gray-800 mt-1 uppercase">Kementerian Sosial Republik Indonesia</h2>
        <div className="grid grid-cols-2 text-left text-xs mt-5 gap-y-2 border-t pt-4 border-gray-300">
          <div>Nama Personil : <b className="uppercase">{profile?.name}</b></div>
          <div>Periode Analisa : <b>{filterMode === 'monthly' ? `${selectedMonth}-${selectedYear}` : `Tahun Anggaran ${selectedYear}`}</b></div>
          <div>Formasi Jabatan : <b className="uppercase">{profile?.jabatan?.replace(/_/g, ' ')}</b></div>
          <div>Alamat Email : <b>{profile?.email}</b></div>
        </div>
      </div>

      {/* HEADER: APLIKASI WEB */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6 print:hidden">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.3)] border border-white/20">
            <i className="fas fa-chart-pie text-white text-xl"></i>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white tracking-wide">Analisa Realisasi RHK</h3>
            <p className="text-[11px] text-amber-400 uppercase tracking-widest font-mono mt-1 font-semibold">
              Jabatan Aktif: <span className="text-white bg-white/10 px-2 py-0.5 rounded ml-1">{profile?.jabatan?.replace(/_/g, ' ') || 'Memuat...'}</span>
            </p>
          </div>
        </div>
        <button 
          onClick={executePdfExport}
          className="bg-white text-slate-900 hover:bg-gray-200 text-xs font-extrabold px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg uppercase tracking-wider w-full md:w-auto"
        >
          <i className="fas fa-print text-red-600 text-base"></i> EXPORT TO PDF
        </button>
      </div>

      {/* PANEL KONTROL FILTER (Disembunyikan saat dicetak) */}
      <div className="bg-[#1a1a24]/60 p-5 rounded-2xl border border-white/5 shadow-lg mb-8 flex flex-col md:flex-row gap-4 print:hidden">
        <div className="flex-1">
          <label className="block text-[10px] uppercase tracking-widest text-slate-300 font-bold mb-2">Mode Analisa</label>
          <select 
            value={filterMode} 
            onChange={(e) => setFilterMode(e.target.value)} 
            className="w-full bg-[#12121a] text-white rounded-xl p-3.5 text-sm font-medium border border-white/20 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="monthly">TARGET BULANAN (Bulan Berjalan)</option>
            <option value="yearly">TARGET TAHUNAN (Akumulasi Penuh)</option>
          </select>
        </div>
        
        <div className="flex-1">
          <label className="block text-[10px] uppercase tracking-widest text-slate-300 font-bold mb-2">Filter Bulan</label>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)} 
            disabled={filterMode === 'yearly'}
            className="w-full bg-[#12121a] text-white rounded-xl p-3.5 text-sm font-medium border border-white/20 focus:outline-none focus:border-purple-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {months.map(m => <option key={m.value} value={m.value} className="bg-[#12121a]">{m.label}</option>)}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-[10px] uppercase tracking-widest text-slate-300 font-bold mb-2">Tahun Anggaran</label>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)} 
            className="w-full bg-[#12121a] text-white rounded-xl p-3.5 text-sm font-medium border border-white/20 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            {years.map(y => <option key={y} value={y} className="bg-[#12121a]">{y}</option>)}
          </select>
        </div>
      </div>

      {/* PANEL REKAPITULASI KESELURUHAN (TOTAL BESAR) */}
      {!loading && metrics.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8 print:grid-cols-5 print:gap-2">
          
          <div className="bg-gradient-to-br from-indigo-900/30 to-[#12121a] p-5 rounded-2xl border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)] relative overflow-hidden print:bg-transparent print:border-gray-400 print:text-black">
            <div className="absolute -right-4 -top-4 opacity-10 text-indigo-500 text-6xl print:hidden"><i className="fas fa-layer-group"></i></div>
            <span className="block text-[10px] uppercase tracking-widest text-indigo-300 font-bold mb-1 print:text-gray-600">Total Keseluruhan</span>
            <span className="block text-4xl font-black font-mono text-indigo-400 print:text-black">{summary.totalLaporan}</span>
          </div>

          <div className="bg-gradient-to-br from-purple-900/30 to-[#12121a] p-5 rounded-2xl border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)] relative overflow-hidden print:bg-transparent print:border-gray-400 print:text-black">
            <div className="absolute -right-4 -top-4 opacity-10 text-purple-500 text-6xl print:hidden"><i className="fas fa-bullseye"></i></div>
            <span className="block text-[10px] uppercase tracking-widest text-purple-300 font-bold mb-1 print:text-gray-600">Total Target Wajib</span>
            <span className="block text-4xl font-black font-mono text-white print:text-black">{summary.totalTarget}</span>
          </div>
          
          {/* KARTU DINAMIS: Akan berubah warna & status saat Target Wajib Terpenuhi */}
          <div className={`p-5 rounded-2xl border relative overflow-hidden transition-all duration-500 print:bg-transparent print:border-gray-400 print:text-black ${isTargetMet ? 'bg-gradient-to-br from-emerald-600 to-teal-800 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)]' : 'bg-gradient-to-br from-emerald-900/30 to-[#12121a] border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'}`}>
            <div className={`absolute -right-4 -top-4 text-6xl print:hidden ${isTargetMet ? 'opacity-20 text-white' : 'opacity-10 text-emerald-500'}`}><i className="fas fa-check-double"></i></div>
            <span className={`block text-[10px] uppercase tracking-widest font-bold mb-1 print:text-gray-600 ${isTargetMet ? 'text-emerald-100' : 'text-emerald-300'}`}>Wajib Terpenuhi</span>
            <span className={`block text-4xl font-black font-mono print:text-black ${isTargetMet ? 'text-white' : 'text-emerald-400'}`}>{summary.totalTerpenuhi}</span>
            {isTargetMet && (
              <div className="mt-2 text-[8px] uppercase tracking-widest font-bold bg-white text-emerald-800 inline-block px-2 py-1 rounded shadow-sm print:border print:border-black animate-pulse">
                <i className="fas fa-star mr-1"></i>Target Telah Terpenuhi
              </div>
            )}
          </div>
          
          <div className="bg-gradient-to-br from-orange-900/30 to-[#12121a] p-5 rounded-2xl border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)] relative overflow-hidden print:bg-transparent print:border-gray-400 print:text-black">
            <div className="absolute -right-4 -top-4 opacity-10 text-orange-500 text-6xl print:hidden"><i className="fas fa-exclamation-triangle"></i></div>
            <span className="block text-[10px] uppercase tracking-widest text-orange-300 font-bold mb-1 print:text-gray-600">Belum Terpenuhi</span>
            <span className="block text-4xl font-black font-mono text-orange-400 print:text-black">{summary.totalDefisit}</span>
          </div>
          
          <div className="bg-gradient-to-br from-blue-900/30 to-[#12121a] p-5 rounded-2xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)] relative overflow-hidden print:bg-transparent print:border-gray-400 print:text-black">
            <div className="absolute -right-4 -top-4 opacity-10 text-blue-500 text-6xl print:hidden"><i className="fas fa-award"></i></div>
            <span className="block text-[10px] uppercase tracking-widest text-blue-300 font-bold mb-1 print:text-gray-600">Capaian Sunnah</span>
            <span className="block text-4xl font-black font-mono text-blue-400 print:text-black">{summary.totalSunnah}</span>
          </div>

        </div>
      )}

      {/* Grid Rincian Masing-Masing RHK */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
        {loading ? (
          <div className="col-span-1 md:col-span-2 text-center py-12 text-purple-400 print:hidden">
            <i className="fas fa-circle-notch animate-spin text-3xl mb-4 block"></i>
            <span className="text-xs font-mono tracking-widest uppercase">Mengkalkulasi Matriks Kinerja...</span>
          </div>
        ) : metrics.length === 0 ? (
          <div className="col-span-1 md:col-span-2 py-12 text-center text-slate-500 print:text-black">
            <i className="fas fa-database text-4xl mb-4 block text-slate-700 print:hidden"></i>
            <p className="text-sm font-medium">Database RHK untuk formasi Anda belum tersedia.</p>
          </div>
        ) : (
          metrics.map((m) => (
            <div key={m.code} className="p-6 rounded-2xl bg-black/40 border border-white/5 shadow-inner hover:border-white/20 transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] print:bg-transparent print:border-gray-400 print:text-black print:break-inside-avoid">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold px-3 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-sm print:border-gray-400 print:bg-gray-100 print:text-black">{m.code}</span>
                <span className={`text-lg font-bold font-mono print:text-black ${Number(m.pct) >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>{m.pct}%</span>
              </div>
              <p className="text-sm text-slate-300 font-medium leading-relaxed line-clamp-3 mb-5 h-16 print:text-black print:h-auto">{m.title}</p>
              
              <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden mb-4 print:hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${Number(m.pct) < 50 ? 'bg-gradient-to-r from-red-500 to-orange-500' : Number(m.pct) < 100 ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`}
                  style={{ width: `${m.pct}%` }}
                ></div>
              </div>

              {/* Rincian Spesifik Masing-Masing RHK */}
              <div className="grid grid-cols-4 gap-2 text-center mt-2 border-t border-white/10 pt-4 print:border-gray-300">
                <div className="bg-[#12121a] p-2 rounded-lg border border-white/5 print:bg-transparent print:border-gray-300">
                  <span className="block text-[8px] uppercase tracking-widest text-slate-400 font-bold mb-1 print:text-gray-600">Target</span>
                  <span className="block text-sm font-bold text-white print:text-black">{m.target}</span>
                </div>
                <div className="bg-[#12121a] p-2 rounded-lg border border-white/5 print:bg-transparent print:border-gray-300">
                  <span className="block text-[8px] uppercase tracking-widest text-emerald-400 font-bold mb-1 print:text-gray-600">Terpenuhi</span>
                  <span className="block text-sm font-bold text-emerald-400 print:text-black">{Math.min(m.current, m.target)}</span>
                </div>
                <div className="bg-[#12121a] p-2 rounded-lg border border-white/5 print:bg-transparent print:border-gray-300">
                  <span className="block text-[8px] uppercase tracking-widest text-orange-400 font-bold mb-1 print:text-gray-600">Belum</span>
                  <span className="block text-sm font-bold text-orange-400 print:text-black">{m.deficit}</span>
                </div>
                <div className="bg-[#12121a] p-2 rounded-lg border border-white/5 print:bg-transparent print:border-gray-300">
                  <span className="block text-[8px] uppercase tracking-widest text-blue-400 font-bold mb-1 print:text-gray-600">Sunnah</span>
                  <span className="block text-sm font-bold text-blue-400 print:text-black">{m.sunnah}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tanda Tangan Cetak PDF */}
      <div className="hidden print:flex justify-end mt-12 pt-8">
        <div className="text-center w-64">
          <p className="text-xs mb-16 text-black">Tapin, {new Date().toLocaleDateString('id-ID')}<br/>Yang Melaporkan,</p>
          <p className="text-xs font-bold uppercase underline text-black">{profile?.name}</p>
          <p className="text-xs uppercase text-black">{profile?.jabatan?.replace(/_/g, ' ')}</p>
        </div>
      </div>

    </div>
  );
}