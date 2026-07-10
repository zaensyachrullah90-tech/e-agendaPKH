import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { ref, get, push, set } from 'firebase/database';
import { uploadFileToDrive } from '../config/googleDrive';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LuxuryAgendaForm() {
  const { profile, googleToken } = useAuth();
  const { showToast } = useToast();
  
  const [rhkMaster, setRhkMaster] = useState({});
  const [selectedRhk, setSelectedRhk] = useState('');
  const [actions, setActions] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const today = new Date();
  const defaultDate = today.toISOString().split('T')[0];
  const defaultTime = today.toTimeString().slice(0, 5);

  const [formValues, setFormValues] = useState({
    tanggal: defaultDate,
    waktu: defaultTime,
    tempat: '',
    actionId: '',
    detail: '',
    volume: 1,
    photo: null
  });

  useEffect(() => {
    if (profile?.jabatan) {
      get(ref(db, `rhk_master/${profile.jabatan}`)).then((snap) => {
        if (snap.exists()) {
          setRhkMaster(snap.val());
        } else {
          setRhkMaster({});
        }
      });
    }
  }, [profile]);

  const handleRhkChange = (code) => {
    setSelectedRhk(code);
    setFormValues(prev => ({ ...prev, actionId: '' }));
    if (rhkMaster[code] && rhkMaster[code].actions) {
      setActions(Object.entries(rhkMaster[code].actions));
    } else {
      setActions([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Foto dilepas dari pengecekan wajib
    if (!selectedRhk || !formValues.actionId || !formValues.tempat || !formValues.detail) {
      showToast("Lengkapi seluruh isian teks wajib form!", "warning");
      return;
    }

    setIsUploading(true);
    let uploadedPhotoUrl = "";

    try {
      // PROSES 1: Coba upload foto (HANYA JIKA ADA FOTO)
      if (formValues.photo) {
        try {
          if (!googleToken) {
            showToast("Sesi Google Drive terputus. Menyimpan data tanpa foto...", "warning");
          } else {
            const upload = await uploadFileToDrive(googleToken, profile.driveFolderId, formValues.photo, `AGENDA_${Date.now()}.jpg`);
            uploadedPhotoUrl = upload.webViewLink;
          }
        } catch (uploadError) {
          console.error("Drive Upload Error:", uploadError);
          showToast("Gagal mengunggah foto ke Drive. Data teks akan tetap disimpan.", "warning");
          // Kita tidak melempar error agar proses berlanjut ke penyimpanan database
        }
      }

      // PROSES 2: Simpan ke Firebase (Selalu dieksekusi)
      const newAgendaRef = push(ref(db, `agenda_harian/${profile.uid}`));
      const targetAction = rhkMaster[selectedRhk].actions[formValues.actionId];
      const displayId = targetAction.display_id || formValues.actionId.replace('_', '.');

      await set(newAgendaRef, {
        agendaId: newAgendaRef.key,
        tanggal: formValues.tanggal,
        waktu: formValues.waktu,
        tempat: formValues.tempat,
        rhk_code: selectedRhk,
        rhk_title: rhkMaster[selectedRhk].title,
        laporan_harian: targetAction.pilihan_laporan_harian,
        display_id: displayId,
        target_bulanan: targetAction.target || 0,
        detail_aktivitas: formValues.detail,
        volume: Number(formValues.volume),
        photoUrl: uploadedPhotoUrl, // Akan berisi URL atau string kosong ("")
        timestamp: Date.now()
      });

      showToast("Log agenda kerja berhasil tersimpan!", "success");
      
      setFormValues({ 
        tanggal: new Date().toISOString().split('T')[0],
        waktu: new Date().toTimeString().slice(0, 5),
        tempat: '', 
        actionId: '', 
        detail: '', 
        volume: 1, 
        photo: null 
      });
      setSelectedRhk('');
      setActions([]);
      
    } catch (err) {
      showToast(`Terjadi kesalahan sistem: ${err.message}`, "error");
    } finally {
      setIsUploading(false);
    }
  };

  // Kelas CSS dasar untuk input agar seragam dan sangat kontras
  const inputClass = "w-full rounded-xl p-3.5 text-sm font-medium text-white focus:outline-none focus:ring-2 border bg-[#12121a] border-white/20 focus:border-amber-500 focus:ring-amber-500/30 transition-all placeholder-slate-500 shadow-inner";

  return (
    <div className="glass-card-glossy p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl mt-4 relative animate-slide-in bg-gradient-to-br from-[#0f0f15] to-[#05050a]">
      <div className="flex items-center space-x-4 mb-6 border-b border-white/10 pb-5">
        <div className="h-12 w-12 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)] border border-white/20">
          <i className="fas fa-edit text-white text-xl"></i>
        </div>
        <div>
          <h3 className="text-xl font-bold text-white tracking-wide">Input Aktivitas Harian</h3>
          <p className="text-[10px] text-amber-400 uppercase tracking-widest font-mono mt-1 font-semibold">
            Jabatan Aktif: <span className="text-white bg-white/10 px-2 py-0.5 rounded ml-1">{profile?.jabatan?.replace(/_/g, ' ') || 'Memuat...'}</span>
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECTION 1: Waktu & Lokasi */}
        <div className="bg-[#1a1a24]/60 p-5 rounded-2xl border border-white/5 space-y-4 shadow-lg">
          <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest border-b border-white/10 pb-2 mb-3">
            <i className="fas fa-clock mr-2"></i>1. Waktu & Lokasi Kegiatan
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-300 font-bold mb-2">Tanggal Pelaksanaan</label>
              <input type="date" required value={formValues.tanggal} onChange={e => setFormValues({...formValues, tanggal: e.target.value})} className={`${inputClass} [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert`} />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-300 font-bold mb-2">Jam (Waktu)</label>
              <input type="time" required value={formValues.waktu} onChange={e => setFormValues({...formValues, waktu: e.target.value})} className={`${inputClass} [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert`} />
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-slate-300 font-bold mb-2">Tempat Kegiatan (Lokasi)</label>
            <input type="text" required placeholder="Contoh: Kantor Dinas Sosial Prov / Desa Sidomulyo..." value={formValues.tempat} onChange={e => setFormValues({...formValues, tempat: e.target.value})} className={inputClass} />
          </div>
        </div>

        {/* SECTION 2: RHK & Laporan Harian */}
        <div className="bg-[#1a1a24]/60 p-5 rounded-2xl border border-white/5 space-y-4 shadow-lg">
          <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest border-b border-white/10 pb-2 mb-3">
            <i className="fas fa-sitemap mr-2"></i>2. Klasifikasi Kinerja
          </h4>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-slate-300 font-bold mb-2">Rencana Hasil Kerja Utama (RHK)</label>
            <select required value={selectedRhk} onChange={(e) => handleRhkChange(e.target.value)} className={`${inputClass} focus:border-purple-500 focus:ring-purple-500/30 cursor-pointer`}>
              <option value="" className="bg-[#12121a] text-slate-400">-- Pilih Rencana Hasil Kerja --</option>
              {Object.keys(rhkMaster).map(code => (
                <option key={code} value={code} className="bg-[#12121a] text-white py-2">
                  {code} - {rhkMaster[code].title.substring(0, 100)}...
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-slate-300 font-bold mb-2">Pilihan Laporan Harian</label>
            <select required disabled={actions.length === 0} value={formValues.actionId} onChange={e => setFormValues({...formValues, actionId: e.target.value})} className={`${inputClass} focus:border-purple-500 focus:ring-purple-500/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}>
              <option value="" className="bg-[#12121a] text-slate-400">-- Pilih Rencana Aksi Harian --</option>
              {actions.map(([id, act]) => {
                const displayId = act.display_id || id.replace('_', '.');
                return (
                  <option key={id} value={id} className="bg-[#12121a] text-white py-2">
                    {displayId} - {act.pilihan_laporan_harian}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* SECTION 3: Detail & Bukti */}
        <div className="bg-[#1a1a24]/60 p-5 rounded-2xl border border-white/5 space-y-4 shadow-lg">
          <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-white/10 pb-2 mb-3">
            <i className="fas fa-file-signature mr-2"></i>3. Rincian & Dokumentasi
          </h4>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-slate-300 font-bold mb-2">Detail Rincian Aktivitas Lapangan</label>
            <textarea required rows="4" value={formValues.detail} onChange={e => setFormValues({...formValues, detail: e.target.value})} className={`${inputClass} focus:border-blue-500 focus:ring-blue-500/30 leading-relaxed`} placeholder="Tuliskan progres riil capaian kinerja harian Anda secara spesifik..."></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-300 font-bold mb-2">Volume Capaian</label>
              <div className="relative">
                <i className="fas fa-chart-line absolute left-4 top-4 text-amber-500"></i>
                <input type="number" required min="1" value={formValues.volume} onChange={e => setFormValues({...formValues, volume: e.target.value})} className={`${inputClass} pl-11 text-amber-400 font-bold text-lg`} />
              </div>
            </div>
            <div>
              <label className="flex justify-between items-center text-[10px] uppercase tracking-widest text-slate-300 font-bold mb-2">
                <span>Foto Dokumentasi</span>
                <span className="text-amber-500/80 bg-amber-500/10 px-2 py-0.5 rounded">(Opsional)</span>
              </label>
              <input 
                type="file" 
                accept="image/*" 
                // required telah DIBUANG agar bisa submit tanpa foto
                onChange={e => setFormValues({...formValues, photo: e.target.files[0]})} 
                className="w-full text-xs text-slate-300 file:mr-4 file:py-3.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer file:transition-all border border-white/20 bg-[#12121a] rounded-xl focus:outline-none" 
              />
            </div>
          </div>
        </div>

        <div className="pt-2 mt-6">
          <button type="submit" disabled={isUploading} className="w-full bg-gradient-to-r from-orange-600 to-amber-500 text-white font-bold p-4 rounded-xl text-sm tracking-widest hover:brightness-110 transition-all shadow-[0_10px_20px_-10px_rgba(245,158,11,0.5)] flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100">
            {isUploading ? (
              <><i className="fas fa-circle-notch animate-spin mr-2 text-lg"></i>MEMPROSES DATA...</>
            ) : (
              <><i className="fas fa-cloud-arrow-up mr-2 text-lg"></i>SIMPAN AKTIVITAS KINERJA</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}