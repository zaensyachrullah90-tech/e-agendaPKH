import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { ref, get, set, update, remove } from 'firebase/database';
import { useToast } from '../context/ToastContext';
import * as XLSX from 'xlsx'; // Wajib diinstal via: npm install xlsx

export default function AdminRhkManager() {
  const { showToast } = useToast();
  const [rhkData, setRhkData] = useState({});
  const [selectedJabatan, setSelectedJabatan] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const [editForm, setEditForm] = useState({
    jabatan: '', rhkCode: '', actionId: '', title: '', pilihan_laporan_harian: '', target: 0
  });

  const [createForm, setCreateForm] = useState({
    jabatan: 'OPERATOR LAYANAN OP-SMA2', rhkTitle: '', pilihan_laporan_harian: '', target: 12
  });

  const loadDatabaseRhk = async () => {
    setLoading(true);
    try {
      const snap = await get(ref(db, 'rhk_master'));
      if (snap.exists()) {
        setRhkData(snap.val());
      } else {
        setRhkData({});
      }
    } catch (error) {
      showToast("Gagal memuat arsitektur struktur RHK.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabaseRhk();
  }, []);

  // Fungsi Pembersih Key agar Diterima Firebase
  const sanitizeFirebaseKey = (str) => {
    if (!str) return 'UNKNOWN';
    return str.replace(/[.#$[\]]/g, '_').trim();
  };

  // Mesin Pembaca File Cerdas (Mendukung .xlsx, .xls, .csv)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target.result;
        
        // Membaca workbook Excel menggunakan SheetJS
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Mengubah sheet menjadi array dua dimensi (baris dan kolom)
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (rows.length < 2) {
          showToast("Format dokumen kosong atau tidak valid.", "error");
          return;
        }

        const tempMaster = {};
        const trackingState = {}; 
        let validRowsProcessed = 0;
        let currentJabatan = ""; 

        // Mulai dari indeks 1 untuk melewati baris Header
        for (let i = 1; i < rows.length; i++) {
          const columns = rows[i];
          if (!columns || columns.length === 0) continue;

          // Mengambil dan membersihkan data setiap kolom
          const rawRhk = (columns[2] || '').toString().trim();
          const rawAction = (columns[3] || '').toString().trim();
          const rawTargetStr = (columns[5] || '12').toString().replace(/[^0-9]/g, '');
          const rawTarget = parseInt(rawTargetStr, 10) || 12;
          
          let rawJabatan = (columns[9] || '').toString().trim();
          if (!rawJabatan && columns.length > 4) {
            rawJabatan = (columns[columns.length - 1] || '').toString().trim();
          }

          if (rawJabatan) currentJabatan = rawJabatan;
          const activeJabatan = rawJabatan || currentJabatan;

          if (!activeJabatan || !rawAction || rawAction.toUpperCase() === 'UTAMA') continue;

          // Mengamankan nama jabatan agar bisa jadi Key Firebase
          const safeJabatan = sanitizeFirebaseKey(activeJabatan);

          if (!trackingState[safeJabatan]) {
            trackingState[safeJabatan] = { rhkCounter: 0, actionCounter: 0, activeRhkTitle: '' };
            tempMaster[safeJabatan] = {};
          }

          let state = trackingState[safeJabatan];

          // Logika Smart Numbering Excel
          if (rawRhk !== '') {
            state.rhkCounter += 1;
            state.actionCounter = 1;
            state.activeRhkTitle = rawRhk;
          } else {
            if (state.rhkCounter === 0) continue; 
            state.actionCounter += 1;
          }

          validRowsProcessed++;

          const rhkCode = `RHK ${state.rhkCounter}`;
          
          // PENTING: Firebase dilarang pakai titik (.). Kita pakai underscore untuk Key DB.
          const actionDbKey = `${state.rhkCounter}_${state.actionCounter}`; 
          
          // ID untuk ditampilkan di layar secara visual (1.1, 1.2, dst)
          const displayActionId = `${state.rhkCounter}.${state.actionCounter}`;

          if (!tempMaster[safeJabatan][rhkCode]) {
            tempMaster[safeJabatan][rhkCode] = {
              title: state.activeRhkTitle,
              actions: {}
            };
          }

          tempMaster[safeJabatan][rhkCode].actions[actionDbKey] = {
            display_id: displayActionId, // Disimpan untuk ditampilkan di tabel
            pilihan_laporan_harian: rawAction,
            target: rawTarget
          };
        }

        if (validRowsProcessed === 0) {
          showToast("Gagal membaca data! Pastikan kolom Excel terisi dengan benar.", "warning");
          return;
        }

        await set(ref(db, 'rhk_master'), tempMaster);
        showToast(`Sukses! ${validRowsProcessed} Pilihan Aksi dipetakan dari Excel.`, "success");
        loadDatabaseRhk();

      } catch (err) {
        console.error("Upload Error:", err);
        showToast("Gagal melakukan sinkronisasi database ke Firebase.", "error");
      }
    };
    
    // File Excel butuh dibaca sebagai ArrayBuffer
    reader.readAsArrayBuffer(file);
    e.target.value = null; 
  };

  const executeUpdateRhk = async (e) => {
    e.preventDefault();
    try {
      const rootPath = `rhk_master/${editForm.jabatan}/${editForm.rhkCode}`;
      await update(ref(db, rootPath), { title: editForm.title });
      
      const actionPath = `${rootPath}/actions/${editForm.actionId}`;
      await update(ref(db, actionPath), {
        pilihan_laporan_harian: editForm.pilihan_laporan_harian,
        target: parseInt(editForm.target, 10) || 0
      });

      showToast("Data klasifikasi RHK berhasil diperbarui!", "success");
      setIsEditModalOpen(false);
      loadDatabaseRhk();
    } catch (err) {
      showToast("Gagal menyimpan perubahan.", "error");
    }
  };

  const executeCreateRhk = async (e) => {
    e.preventDefault();
    try {
      const targetJob = sanitizeFirebaseKey(createForm.jabatan);
      const jobRef = ref(db, `rhk_master/${targetJob}`);
      const snap = await get(jobRef);
      
      let nextRhkNum = 1;
      if (snap.exists()) {
        nextRhkNum = Object.keys(snap.val()).length + 1;
      }

      const newRhkCode = `RHK ${nextRhkNum}`;
      const newActionDbKey = `${nextRhkNum}_1`;
      const newDisplayId = `${nextRhkNum}.1`;

      const newPayload = {
        title: createForm.rhkTitle,
        actions: {
          [newActionDbKey]: {
            display_id: newDisplayId,
            pilihan_laporan_harian: createForm.pilihan_laporan_harian,
            target: parseInt(createForm.target, 10) || 12
          }
        }
      };

      await set(ref(db, `rhk_master/${targetJob}/${newRhkCode}`), newPayload);
      showToast("Data RHK Baru berhasil ditambahkan ke sistem!", "success");
      setIsCreateModalOpen(false);
      setCreateForm({ jabatan: 'OPERATOR LAYANAN OP-SMA2', rhkTitle: '', pilihan_laporan_harian: '', target: 12 });
      loadDatabaseRhk();
    } catch (err) {
      showToast("Gagal menambahkan data.", "error");
    }
  };

  const executeDeleteAction = async (jabatan, rhkCode, actionId) => {
    if (!window.confirm(`Hapus sub-pilihan laporan harian ini?`)) return;
    try {
      const targetPath = `rhk_master/${jabatan}/${rhkCode}/actions/${actionId}`;
      await remove(ref(db, targetPath));
      
      const checkRef = ref(db, `rhk_master/${jabatan}/${rhkCode}/actions`);
      const checkSnap = await get(checkRef);
      if (!checkSnap.exists()) {
        await remove(ref(db, `rhk_master/${jabatan}/${rhkCode}`));
      }

      showToast("Item berhasil dihapus dari database.", "success");
      loadDatabaseRhk();
    } catch (err) {
      showToast("Gagal menghapus item.", "error");
    }
  };

  const openEditModal = (jabatan, rhkCode, actionId, actionData) => {
    setEditForm({
      jabatan, rhkCode, actionId,
      title: actionData.title,
      pilihan_laporan_harian: actionData.pilihan_laporan_harian,
      target: actionData.target || 0
    });
    setIsEditModalOpen(true);
  };

  // Smart Filter Data
  const getFilteredData = () => {
    const dataToFilter = rhkData || {};
    let filtered = {};

    Object.keys(dataToFilter).forEach(jabatan => {
      if (selectedJabatan && jabatan !== selectedJabatan) return;
      
      const jabData = dataToFilter[jabatan];
      let filteredRhks = {};

      Object.keys(jabData).forEach(rhkCode => {
        const rhkDetails = jabData[rhkCode];
        const searchLower = searchTerm.toLowerCase();
        
        const titleMatch = rhkDetails.title.toLowerCase().includes(searchLower) || rhkCode.toLowerCase().includes(searchLower);
        
        const filteredActions = {};
        let hasActionMatch = false;

        Object.keys(rhkDetails.actions || {}).forEach(actionDbKey => {
          const actionItem = rhkDetails.actions[actionDbKey];
          const displayId = actionItem.display_id || actionDbKey.replace('_', '.');
          const actionMatch = actionItem.pilihan_laporan_harian.toLowerCase().includes(searchLower) || displayId.toLowerCase().includes(searchLower);
          
          if (titleMatch || actionMatch) {
            filteredActions[actionDbKey] = actionItem;
            hasActionMatch = true;
          }
        });

        if (titleMatch || hasActionMatch) {
          filteredRhks[rhkCode] = {
            ...rhkDetails,
            actions: Object.keys(filteredActions).length > 0 ? filteredActions : rhkDetails.actions
          };
        }
      });

      if (Object.keys(filteredRhks).length > 0) {
        filtered[jabatan] = filteredRhks;
      }
    });

    return filtered;
  };

  const filteredDisplayData = getFilteredData();

  return (
    <div className="min-h-screen bg-[#05050a] pt-28 pb-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto relative">
        
        {/* Header Dashboard */}
        <div className="glass-card-glossy p-6 rounded-3xl mb-8 flex flex-col md:flex-row items-center justify-between border border-white/5 shadow-2xl">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">
              <i className="fas fa-database text-amber-500 mr-3"></i>Manajemen Master RHK
            </h1>
            <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-mono">
              Otoritas Validasi Parameter & Klasifikasi Kerja Personil
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-3">
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-3 rounded-xl transition-all shadow-md uppercase tracking-wider flex items-center"
            >
              <i className="fas fa-plus-circle mr-2"></i> Tambah Manual
            </button>
            <label className="cursor-pointer bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 text-white text-xs font-bold px-4 py-3 rounded-xl transition-all flex items-center shadow-lg shadow-orange-500/10">
              <i className="fas fa-file-excel mr-2 text-base"></i> UPLOAD EXCEL (.xlsx / .csv)
              {/* Diperbarui agar menerima file murni Excel */}
              <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Panel Smart Filter */}
        <div className="glass-card-glossy p-6 rounded-3xl mb-8 border border-white/5 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs uppercase tracking-widest text-purple-400 font-bold mb-3">Pilih Formasi Jabatan Terdaftar</label>
            <select 
              value={selectedJabatan} 
              onChange={(e) => setSelectedJabatan(e.target.value)} 
              className="w-full glass-input rounded-xl p-3.5 text-sm font-semibold text-white bg-[#0a0a14] focus:outline-none border border-white/10"
            >
              <option value="">-- TAMPILKAN SELURUH JABATAN --</option>
              {Object.keys(rhkData).map(j => <option key={j} value={j}>{j.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs uppercase tracking-widest text-purple-400 font-bold mb-3">Cari RHK / Laporan Harian</label>
            <div className="relative">
              <i className="fas fa-search absolute left-4 top-4 text-slate-400"></i>
              <input 
                type="text" 
                placeholder="Ketik kata kunci pencarian..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full glass-input rounded-xl p-3.5 pl-10 text-sm text-white bg-[#0a0a14] focus:outline-none border border-white/10"
              />
            </div>
          </div>
        </div>

        {/* Tabel Hierarki Tampilan */}
        <div className="glass-card-glossy rounded-3xl overflow-hidden border border-white/5 shadow-2xl animate-slide-in">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/50 text-slate-400 text-[10px] uppercase tracking-widest font-bold border-b border-white/5">
                  <th className="p-4 text-center">No / Sub-Key</th>
                  <th className="p-4 w-1/3">Deskripsi RHK Utama</th>
                  <th className="p-4 w-1/3">Pilihan Laporan Harian Lapangan</th>
                  <th className="p-4 text-center">Target Vol</th>
                  <th className="p-4 text-center">Aksi Operasional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-200">
                {loading ? (
                  <tr><td colSpan="5" className="p-12 text-center text-amber-500 font-mono tracking-widest"><i className="fas fa-circle-notch animate-spin text-2xl mb-2 block"></i>MEMBACA DATA STRUKTUR...</td></tr>
                ) : Object.keys(filteredDisplayData).length === 0 ? (
                  <tr><td colSpan="5" className="p-12 text-center text-slate-500">Data tidak ditemukan. Silakan impor file Excel/CSV atau ubah filter pencarian.</td></tr>
                ) : (
                  Object.keys(filteredDisplayData).map(jabatan => (
                    Object.entries(filteredDisplayData[jabatan] || {}).map(([rhkCode, rhkDetails]) => (
                      Object.entries(rhkDetails.actions || {}).map(([actionDbKey, actionItem], indexIndex) => (
                        <tr key={`${jabatan}-${rhkCode}-${actionDbKey}`} className="hover:bg-white/5 transition-colors">
                          {indexIndex === 0 && (
                            <>
                              <td rowSpan={Object.keys(rhkDetails.actions).length} className="p-4 font-mono font-bold text-amber-400 align-top text-center border-r border-white/5 bg-black/20">
                                {rhkCode}
                                <span className="block text-[8px] text-slate-500 font-normal tracking-tighter uppercase mt-1">{jabatan.substring(0,15).replace(/_/g, ' ')}</span>
                              </td>
                              <td rowSpan={Object.keys(rhkDetails.actions).length} className="p-4 align-top border-r border-white/5 font-semibold leading-relaxed text-white">
                                {rhkDetails.title}
                              </td>
                            </>
                          )}
                          <td className="p-4 text-slate-300 font-light border-r border-white/5 leading-relaxed">
                            <b className="text-amber-500 font-mono mr-1.5">{actionItem.display_id || actionDbKey.replace('_', '.')}</b> {actionItem.pilihan_laporan_harian}
                          </td>
                          <td className="p-4 text-center font-mono font-bold border-r border-white/5">
                            <span className="bg-white/5 px-2.5 py-1 rounded border border-white/5 text-amber-400 block">{actionItem.target || 0} Vol</span>
                          </td>
                          <td className="p-4 text-center space-x-2">
                            <button 
                              onClick={() => openEditModal(jabatan, rhkCode, actionDbKey, { ...actionItem, title: rhkDetails.title })}
                              className="text-orange-400 hover:text-white bg-orange-500/10 hover:bg-orange-500 px-3 py-1.5 rounded-lg border border-orange-500/20 font-bold transition-all text-[10px] uppercase"
                            >
                              EDIT
                            </button>
                            <button 
                              onClick={() => executeDeleteAction(jabatan, rhkCode, actionDbKey)}
                              className="text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 px-3 py-1.5 rounded-lg border border-red-500/20 font-bold transition-all text-[10px] uppercase"
                            >
                              HAPUS
                            </button>
                          </td>
                        </tr>
                      ))
                    ))
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL EDIT MASTER DATA RHK */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="glass-card-glossy max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative animate-slide-in">
              <button onClick={() => setIsEditModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white text-xl"><i className="fas fa-times"></i></button>
              <h3 className="text-lg font-bold text-white mb-1">Perbarui Komponen RHK</h3>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest border-b border-white/10 pb-4 mb-6">Sub-Key Otoritas: <span className="text-amber-400">{editForm.actionId.replace('_','.')}</span></p>
              
              <form onSubmit={executeUpdateRhk} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Deskripsi RHK Utama</label>
                  <textarea required rows="2" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full glass-input rounded-xl p-3 text-xs focus:outline-none"></textarea>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Kalimat Pilihan Laporan Harian</label>
                  <textarea required rows="3" value={editForm.pilihan_laporan_harian} onChange={e => setEditForm({...editForm, pilihan_laporan_harian: e.target.value})} className="w-full glass-input rounded-xl p-3 text-xs focus:outline-none"></textarea>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Target Kinerja Bulanan (Volume)</label>
                  <input type="number" required min="0" value={editForm.target} onChange={e => setEditForm({...editForm, target: e.target.value})} className="w-full glass-input rounded-xl p-3 text-xs focus:outline-none font-mono font-bold text-amber-400" />
                </div>
                <div className="flex gap-3 pt-4 border-t border-white/5">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 bg-white/5 hover:bg-white/10 p-3 rounded-xl font-bold uppercase tracking-wider text-white text-xs">Batal</button>
                  <button type="submit" className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 p-3 rounded-xl font-bold uppercase tracking-wider text-white text-xs shadow-lg shadow-orange-500/20">Simpan Perubahan</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL TAMBAH DATA MANUALLY */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="glass-card-glossy max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative animate-slide-in">
              <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white text-xl"><i className="fas fa-times"></i></button>
              <h3 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4">Tambah Entri RHK Baru</h3>
              
              <form onSubmit={executeCreateRhk} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Formasi Jabatan Target</label>
                  <select value={createForm.jabatan} onChange={e => setCreateForm({...createForm, jabatan: e.target.value})} className="w-full glass-input rounded-xl p-3 text-xs focus:outline-none bg-[#0a0a14]">
                    <option value="KATIM PROV">KATIM PROV</option>
                    <option value="KATIM KABKOT">KATIM KABKOT</option>
                    <option value="PENATA LAYANAN OPERASIONAL">PENATA LAYANAN OPERASIONAL</option>
                    <option value="PENGELOLA LAYANAN OP-DIII">PENGELOLA LAYANAN OP-DIII</option>
                    <option value="OPERATOR LAYANAN OP-SMA2">OPERATOR LAYANAN OP-SMA2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Rencana Hasil Kerja Utama</label>
                  <textarea required rows="2" placeholder="Tulis deskripsi target utama RHK..." value={createForm.rhkTitle} onChange={e => setCreateForm({...createForm, rhkTitle: e.target.value})} className="w-full glass-input rounded-xl p-3 text-xs focus:outline-none"></textarea>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Pilihan Aksi Laporan Lapangan</label>
                  <textarea required rows="2" placeholder="Tulis kalimat pilihan pelaporan kerja harian..." value={createForm.pilihan_laporan_harian} onChange={e => setCreateForm({...createForm, pilihan_laporan_harian: e.target.value})} className="w-full glass-input rounded-xl p-3 text-xs focus:outline-none"></textarea>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Target Ketetapan Kontrak</label>
                  <input type="number" required min="1" value={createForm.target} onChange={e => setCreateForm({...createForm, target: e.target.value})} className="w-full glass-input rounded-xl p-3 text-xs focus:outline-none font-bold text-amber-400" />
                </div>
                <div className="flex gap-3 pt-4 border-t border-white/5">
                  <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 bg-white/5 p-3 rounded-xl font-bold uppercase tracking-wider text-white text-xs">Batal</button>
                  <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 p-3 rounded-xl font-bold uppercase tracking-wider text-white text-xs shadow-lg">Buat Data</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}