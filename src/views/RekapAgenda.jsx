import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../config/firebase';
import { ref, onValue, update, remove } from 'firebase/database';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { uploadFileToDrive } from '../config/googleDrive';

export default function RekapAgenda() {
  const { profile, googleToken } = useAuth();
  const { showToast } = useToast();
  const [agendas, setAgendas] = useState([]);
  
  const today = new Date();
  const currentMonthStr = today.toISOString().slice(0, 7); 
  const currentDateStr = today.toISOString().split('T')[0]; 
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedDate, setSelectedDate] = useState(currentDateStr);

  // State untuk Modal Edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [editPhoto, setEditPhoto] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!profile?.uid) return;
    const unsubscribe = onValue(ref(db, `agenda_harian/${profile.uid}`), (snapshot) => {
      if (snapshot.exists()) {
        const dataArr = Object.values(snapshot.val());
        const sorted = dataArr.sort((a, b) => {
          const timeA = a.waktu || "00:00";
          const timeB = b.waktu || "00:00";
          return timeA.localeCompare(timeB);
        });
        setAgendas(sorted);
      } else {
        setAgendas([]);
      }
    });

    return () => unsubscribe();
  }, [profile]);

  // Fungsi Format Tanggal (Contoh: Kamis, 15 Agustus 2026)
  const formatIndoDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const monthData = useMemo(() => {
    const [year, month] = selectedMonth.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();
    
    const countPerDay = {};
    agendas.forEach(item => {
      if (item.tanggal?.startsWith(selectedMonth)) {
        countPerDay[item.tanggal] = (countPerDay[item.tanggal] || 0) + 1;
      }
    });

    const daysArray = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dateString = `${year}-${month}-${String(i).padStart(2, '0')}`;
      daysArray.push({
        dateStr: dateString,
        dayNum: i,
        count: countPerDay[dateString] || 0
      });
    }
    return daysArray;
  }, [selectedMonth, agendas]);

  const filteredAgendas = agendas.filter(item => item.tanggal === selectedDate);
  const selectedDateObj = new Date(selectedDate);
  const isWeekend = selectedDateObj.getDay() === 0 || selectedDateObj.getDay() === 6;
  const maxAgenda = 5;

  const handleMonthChange = (e) => {
    const newMonth = e.target.value;
    setSelectedMonth(newMonth);
    setSelectedDate(`${newMonth}-01`);
  };

  const executePdfExport = () => {
    showToast("Mempersiapkan dokumen PDF...", "success");
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // EKSEKUSI HAPUS AGENDA
  const handleDelete = async (agendaId) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus laporan agenda ini secara permanen?")) {
      try {
        await remove(ref(db, `agenda_harian/${profile.uid}/${agendaId}`));
        showToast("Laporan agenda berhasil dihapus.", "success");
      } catch (err) {
        showToast("Gagal menghapus data: " + err.message, "error");
      }
    }
  };

  // BUKA MODAL EDIT
  const openEditModal = (item) => {
    setEditData({ ...item });
    setEditPhoto(null); // Reset file foto jika ada
    setIsEditModalOpen(true);
  };

  // EKSEKUSI SIMPAN EDIT AGENDA
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let updatedPhotoUrl = editData.photoUrl || "";

      // Jika user memasukkan foto baru
      if (editPhoto) {
        if (!googleToken) {
          showToast("Token Google Drive terputus. Harap muat ulang atau relogin.", "warning");
          setIsUploading(false);
          return;
        }
        showToast("Mengunggah foto baru ke Drive...", "info");
        const upload = await uploadFileToDrive(googleToken, profile.driveFolderId, editPhoto, `AGENDA_UPDATE_${Date.now()}.jpg`);
        updatedPhotoUrl = upload.webViewLink;
      }

      // Update data di Firebase
      await update(ref(db, `agenda_harian/${profile.uid}/${editData.agendaId}`), {
        waktu: editData.waktu,
        tempat: editData.tempat,
        volume: Number(editData.volume),
        detail_aktivitas: editData.detail_aktivitas,
        photoUrl: updatedPhotoUrl
      });

      showToast("Pembaruan laporan berhasil disimpan!", "success");
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast("Gagal memperbarui data: " + err.message, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const inputClass = "w-full rounded-xl p-3.5 text-sm font-medium text-white focus:outline-none focus:ring-2 border bg-[#12121a] border-white/20 focus:border-amber-500 focus:ring-amber-500/30 transition-all placeholder-slate-500 shadow-inner";

  return (
    <div className="min-h-screen bg-[#05050a] pt-28 pb-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="glass-card-glossy p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/10 shadow-xl print:hidden animate-slide-in">
          <div>
            <h2 className="text-2xl font-bold text-white"><i className="fas fa-timeline text-amber-500 mr-3"></i>Rekap Riwayat Kinerja</h2>
            <p className="text-slate-400 text-xs mt-1 font-mono tracking-widest uppercase">Visualisasi Timeline & Kelola Aktivitas Harian</p>
          </div>
          <button 
            onClick={executePdfExport}
            className="bg-white text-slate-900 hover:bg-gray-200 text-xs font-extrabold px-5 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg uppercase tracking-wider"
          >
            <i className="fas fa-print text-red-600 text-base"></i> EXPORT TO PDF
          </button>
        </div>

        <div className="glass-card-glossy p-6 rounded-2xl border border-white/5 print:hidden animate-slide-in space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
            <h3 className="text-sm font-bold text-white tracking-widest uppercase">Pilih Bulan & Tahun</h3>
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={handleMonthChange}
              className="glass-input rounded-xl px-4 py-2 text-sm focus:outline-none font-bold tracking-widest bg-[#12121a] text-white border-white/20 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
            />
          </div>

          <div className="flex overflow-x-auto gap-3 pb-4 custom-scrollbar snap-x">
            {monthData.map((day) => {
              const isSelected = day.dateStr === selectedDate;
              return (
                <div 
                  key={day.dateStr}
                  onClick={() => setSelectedDate(day.dateStr)}
                  className={`flex flex-col items-center justify-center min-w-[70px] h-[80px] rounded-xl cursor-pointer transition-all duration-300 snap-center border ${
                    isSelected 
                      ? 'bg-gradient-to-b from-orange-500 to-amber-500 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)] transform scale-105' 
                      : 'bg-[#1a1a24] border-white/10 hover:bg-white/5'
                  }`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-amber-900' : 'text-slate-400'}`}>Tgl</span>
                  <span className={`text-2xl font-black font-mono ${isSelected ? 'text-white' : 'text-slate-200'}`}>{day.dayNum}</span>
                  
                  <div className={`text-[9px] font-bold mt-1 px-2 rounded-full ${day.count >= maxAgenda ? 'bg-emerald-500 text-white' : day.count > 0 ? 'bg-white/20 text-white' : 'bg-transparent text-transparent'}`}>
                    {day.count > 0 ? `${day.count} Agd` : '-'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AREA CETAK & TIMELINE HARIAN */}
        <div className="glass-card-glossy p-8 rounded-3xl border border-white/10 shadow-2xl print:bg-white print:text-black print:border-0 print:shadow-none print:p-0">
          
          <div className="hidden print:block border-b-2 border-black pb-4 mb-6 text-center">
            <h1 className="text-xl font-black uppercase tracking-wide text-black">LAPORAN AKTIVITAS KINERJA HARIAN SDM PKH</h1>
            <h2 className="text-sm font-bold text-gray-800 mt-1 uppercase">Kementerian Sosial Republik Indonesia</h2>
            <div className="grid grid-cols-2 text-left text-xs mt-5 gap-y-2 border-t pt-4 border-gray-300">
              <div>Nama Personil : <b className="uppercase">{profile?.name}</b></div>
              {/* Tanggal menggunakan format Indo di PDF */}
              <div>Tanggal Laporan : <b>{formatIndoDate(selectedDate)}</b></div>
              <div>Formasi Jabatan : <b className="uppercase">{profile?.jabatan?.replace(/_/g, ' ')}</b></div>
              <div>Alamat Email : <b>{profile?.email}</b></div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 print:border-b print:border-black print:pb-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-3 print:text-black">
              <div className="h-8 w-8 bg-purple-500/20 text-purple-400 rounded-lg flex items-center justify-center print:hidden"><i className="fas fa-calendar-day"></i></div>
              {/* Tanggal menggunakan format Indo di UI Web */}
              <span>Timeline: <span className="font-bold text-amber-400 print:text-black">{formatIndoDate(selectedDate)}</span></span>
            </h3>
            
            <div className="text-xs uppercase tracking-widest font-bold bg-[#12121a] px-4 py-2 rounded-xl border border-white/10 print:hidden">
              <span className="text-slate-400 mr-2">Status Target:</span>
              <span className={filteredAgendas.length >= maxAgenda ? "text-emerald-400" : "text-amber-400"}>
                {filteredAgendas.length} / {maxAgenda} Agenda
              </span>
            </div>
          </div>

          {filteredAgendas.length === 0 ? (
            <div className="py-16 text-center text-slate-500 print:text-gray-500">
              <i className="fas fa-clipboard-question text-4xl mb-4 block text-slate-700 print:text-gray-300"></i>
              <p className="text-sm font-medium">Tidak ada rekaman agenda kegiatan pada tanggal ini.</p>
              {isWeekend && <p className="text-xs mt-2 text-orange-400/50">Tanggal ini adalah akhir pekan.</p>}
            </div>
          ) : (
            <div className="relative border-l-2 border-purple-500/30 ml-3 md:ml-6 space-y-10 print:border-0 print:ml-0 print:space-y-6">
              {filteredAgendas.map((item, index) => (
                <div key={item.agendaId} className="relative pl-8 md:pl-10 print:pl-0 print:break-inside-avoid">
                  
                  <div className="absolute -left-[9px] top-1 h-4 w-4 bg-amber-500 rounded-full ring-4 ring-[#05050a] print:hidden shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                  
                  <div className="p-6 rounded-2xl bg-[#1a1a24]/60 border border-white/5 flex flex-col md:flex-row gap-6 items-start hover:border-white/20 transition-all duration-300 print:bg-transparent print:border print:border-gray-400 print:text-black print:rounded-none print:p-4">
                    
                    {/* BAGIAN GAMBAR */}
                    {item.photoUrl ? (
                      <img 
                        src={item.photoUrl} 
                        alt="Dokumentasi" 
                        className="w-full md:w-40 h-28 rounded-xl object-cover bg-slate-900 border border-white/10 flex-shrink-0 print:border-gray-400 print:rounded-sm print:h-24 print:w-32"
                      />
                    ) : (
                      <div className="w-full md:w-40 h-28 rounded-xl bg-black/50 border border-white/10 flex flex-col items-center justify-center text-slate-600 print:border-gray-400 print:rounded-sm print:h-24 print:w-32 print:bg-gray-100 flex-shrink-0">
                        <i className="fas fa-image-slash text-2xl mb-1"></i>
                        <span className="text-[9px] uppercase tracking-widest print:hidden">Belum Ada Foto</span>
                      </div>
                    )}
                    
                    {/* BAGIAN INFORMASI TIMELINE */}
                    <div className="flex-1 w-full space-y-3">
                      <div className="flex flex-wrap justify-between items-start gap-2">
                        {/* BADGE RHK & LAPORAN */}
                        <span className="text-[10px] font-bold px-3 py-1.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 tracking-widest uppercase font-mono print:bg-gray-100 print:text-black print:border-gray-400">
                          {item.waktu || "00:00"} | {item.rhk_code} | Laporan: {item.display_id}
                        </span>
                        
                        <span className="text-[10px] font-bold px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg print:border-gray-400 print:bg-white print:text-black uppercase tracking-widest">
                          Vol: {item.volume}
                        </span>
                      </div>
                      
                      <h4 className="text-base font-bold text-white leading-snug print:text-black">{item.laporan_harian}</h4>
                      
                      {item.tempat && (
                        <p className="text-xs text-blue-400 font-medium print:text-black"><i className="fas fa-map-marker-alt mr-1"></i> {item.tempat}</p>
                      )}

                      <p className="text-sm text-slate-300 leading-relaxed font-light print:text-gray-800 text-justify">
                        <b>Rincian Lapangan:</b> {item.detail_aktivitas}
                      </p>

                      {/* TOMBOL AKSI CRUD (Disembunyikan saat print) */}
                      <div className="flex gap-3 pt-3 border-t border-white/5 print:hidden">
                        <button 
                          onClick={() => openEditModal(item)} 
                          className="flex items-center text-[10px] font-bold uppercase tracking-widest text-orange-400 bg-orange-500/10 hover:bg-orange-500 hover:text-white px-3 py-1.5 rounded-lg border border-orange-500/20 transition-all"
                        >
                          <i className="fas fa-edit mr-1.5"></i> Edit / Lengkapi
                        </button>
                        <button 
                          onClick={() => handleDelete(item.agendaId)} 
                          className="flex items-center text-[10px] font-bold uppercase tracking-widest text-red-400 bg-red-500/10 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg border border-red-500/20 transition-all"
                        >
                          <i className="fas fa-trash-alt mr-1.5"></i> Hapus
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              ))}

              <div className="hidden print:flex justify-end mt-12 pt-8">
                <div className="text-center w-64">
                  <p className="text-xs mb-16 text-black">Tapin, {formatIndoDate(selectedDate)}<br/>Yang Melaporkan,</p>
                  <p className="text-xs font-bold uppercase underline text-black">{profile?.name}</p>
                  <p className="text-xs uppercase text-black">{profile?.jabatan?.replace(/_/g, ' ')}</p>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* MODAL EDIT AGENDA */}
      {isEditModalOpen && editData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:hidden">
          <div className="glass-card-glossy max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative animate-slide-in max-h-[90vh] overflow-y-auto custom-scrollbar bg-gradient-to-br from-[#0f0f15] to-[#05050a]">
            
            <button onClick={() => setIsEditModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white text-xl transition-colors">
              <i className="fas fa-times"></i>
            </button>
            
            <h3 className="text-lg font-bold text-white mb-2">Edit Aktivitas Kinerja</h3>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest border-b border-white/10 pb-4 mb-6">
              RHK: <span className="text-amber-400">{editData.rhk_code}</span> | Laporan: <span className="text-amber-400">{editData.display_id}</span>
            </p>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-300 font-bold mb-2">Jam (Waktu)</label>
                  <input type="time" required value={editData.waktu} onChange={e => setEditData({...editData, waktu: e.target.value})} className={`${inputClass} [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert`} />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-300 font-bold mb-2">Volume</label>
                  <input type="number" required min="1" value={editData.volume} onChange={e => setEditData({...editData, volume: e.target.value})} className={`${inputClass} font-bold text-amber-400`} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-300 font-bold mb-2">Tempat Kegiatan (Lokasi)</label>
                <input type="text" required value={editData.tempat} onChange={e => setEditData({...editData, tempat: e.target.value})} className={inputClass} />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-300 font-bold mb-2">Detail Rincian Aktivitas</label>
                <textarea required rows="3" value={editData.detail_aktivitas} onChange={e => setEditData({...editData, detail_aktivitas: e.target.value})} className={`${inputClass} leading-relaxed`}></textarea>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-300 font-bold mb-2">
                  Update/Unggah Foto <span className="text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">(Opsional)</span>
                </label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={e => setEditPhoto(e.target.files[0])} 
                  className="w-full text-xs text-slate-300 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer file:transition-all border border-white/20 bg-[#12121a] rounded-xl focus:outline-none" 
                />
                {!editPhoto && !editData.photoUrl && (
                  <p className="text-[10px] text-red-400 mt-2 font-mono">* Laporan ini belum memiliki lampiran foto.</p>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5 mt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 bg-white/5 hover:bg-white/10 p-3.5 rounded-xl font-bold uppercase tracking-wider text-white text-xs transition-all">Batal</button>
                <button type="submit" disabled={isUploading} className="flex-1 bg-gradient-to-r from-orange-600 to-amber-500 hover:brightness-110 p-3.5 rounded-xl font-bold uppercase tracking-wider text-white text-xs shadow-[0_5px_15px_-5px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isUploading ? <><i className="fas fa-spinner animate-spin"></i> Menyimpan...</> : <><i className="fas fa-save"></i> Simpan Perubahan</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}