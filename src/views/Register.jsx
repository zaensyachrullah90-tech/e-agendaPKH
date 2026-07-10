import React, { useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { createDriveFolder } from '../config/googleDrive';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  // State Form Utama - Data dijamin tidak hilang karena halaman tidak memuat ulang
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    name: '', 
    jabatan: 'OPERATOR LAYANAN OP-SMA2' 
  });
  
  const [tokenInfo, setTokenInfo] = useState({ connected: false, token: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { saveGoogleToken } = useAuth();

  // Solusi Utama: Membuka Otorisasi Google Drive via Jendela Pop-up Terpisah
  const connectGoogleDrive = () => {
    const client_id = "866680888451-o0t801mlh8mqj6c1nbfmduhnj8g5ul9p.apps.googleusercontent.com"; 
    const redirect_uri = window.location.origin + "/register";
    const scope = "https://www.googleapis.com/auth/drive.file";
    const response_type = "token";
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${scope}&response_type=${response_type}`;
    
    // Buka jendela popup di tengah layar browser
    const popupWidth = 500;
    const popupHeight = 650;
    const left = window.screen.width / 2 - popupWidth / 2;
    const top = window.screen.height / 2 - popupHeight / 2;
    
    const authPopup = window.open(
      authUrl, 
      "Otorisasi Google Drive SDM PKH", 
      `width=${popupWidth},height=${popupHeight},top=${top},left=${left},scrollbars=yes,status=no`
    );

    // Polling Listener: Memantau URL kembalian dari Google secara asinkron tanpa lag
    const pollTimer = setInterval(() => {
      try {
        if (!authPopup || authPopup.closed) {
          clearInterval(pollTimer);
          return;
        }

        // Ketika Google mengalihkan kembali ke localhost, URL menjadi Same-Origin dan bisa dibaca
        if (authPopup.location.href.includes("access_token")) {
          const hash = authPopup.location.hash.substring(1);
          const params = new URLSearchParams(hash);
          const token = params.get("access_token");
          
          if (token) {
            setTokenInfo({ connected: true, token: token });
            showToast("Akses Google Drive berhasil dikunci via Pop-up!", "success");
            authPopup.close();
            clearInterval(pollTimer);
          }
        }
      } catch (err) {
        // Mengabaikan Cross-Origin DOM error saat popup masih berada di server accounts.google.com
      }
    }, 500);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!tokenInfo.connected || !tokenInfo.token) {
      showToast("Anda wajib menekan tombol otorisasi Google Drive terlebih dahulu!", "warning");
      return;
    }

    setIsProcessing(true);
    try {
      // Step 1: Daftarkan kredensial ke Firebase Auth
      const userCred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const uid = userCred.user.uid;

      // Step 2: Buat folder arsip harian di Google Drive secara otomatis
      const folderId = await createDriveFolder(tokenInfo.token, `Agenda_Premium_${formData.name}`);
      saveGoogleToken(tokenInfo.token);

      // Step 3: Kirim data profil publik ke Realtime Database tanpa menyertakan password
      await set(ref(db, `users/${uid}`), {
        uid: uid,
        name: formData.name,
        email: formData.email,
        jabatan: formData.jabatan,
        role: "user",
        isPaid: false,
        isActive: false,
        driveFolderId: folderId,
        registeredAt: Date.now()
      });

      showToast("Pendaftaran sukses! Menunggu konfirmasi instan dari Super Admin.", "success");
      navigate("/premium-lock");
    } catch (err) { 
      showToast(err.message, "error"); 
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-[#05050a] pt-24 pb-12">
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-[100px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-orange-500/10 blur-[100px]"></div>

      <div className="glass-card-glossy max-w-lg w-full p-8 rounded-3xl border border-white/10 relative z-10 shadow-2xl">
        <h2 className="text-2xl font-bold text-white text-center tracking-wide mb-1">Registrasi Anggota Baru</h2>
        <p className="text-center text-slate-400 text-xs mb-6">Penyimpanan Terintegrasi Langsung ke Cloud Google Drive</p>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1.5">Nama Lengkap</label>
            <input type="text" required placeholder="Masukkan Nama Sesuai SK" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full glass-input rounded-xl p-3.5 text-sm focus:outline-none" />
          </div>
          
          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1.5">Email Penugasan</label>
            <input type="email" required placeholder="contoh@pkh.id" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full glass-input rounded-xl p-3.5 text-sm focus:outline-none" />
          </div>
          
          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1.5">Kata Sandi Akun</label>
            <input type="password" required placeholder="Minimal 6 Karakter (Aman & Rahasia)" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full glass-input rounded-xl p-3.5 text-sm focus:outline-none" />
          </div>
          
          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1.5">Formasi Jabatan SDM PKH</label>
            <select value={formData.jabatan} onChange={e => setFormData({...formData, jabatan: e.target.value})} className="w-full glass-input rounded-xl p-3.5 text-sm focus:outline-none bg-[#090911] text-white border-white/20">
              <option value="KATIM PROV">KATIM PROV</option>
              <option value="KATIM KABKOT">KATIM KABKOT</option>
              <option value="PENATA LAYANAN OPERASIONAL">PENATA LAYANAN OPERASIONAL</option>
              <option value="PENGELOLA LAYANAN OP-DIII">PENGELOLA LAYANAN OP-DIII</option>
              <option value="OPERATOR LAYANAN OP-SMA2">OPERATOR LAYANAN OP-SMA2</option>
            </select>
          </div>

          <div className="pt-3">
            <label className="block text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">Sinkronisasi Folder Cloud</label>
            <button type="button" onClick={connectGoogleDrive} className={`w-full p-3.5 rounded-xl font-bold flex items-center justify-center space-x-3 text-xs border transition-all duration-300 shadow-md ${tokenInfo.connected ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-emerald-500/10' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>
              <i className="fab fa-google-drive text-base"></i>
              <span>{tokenInfo.connected ? 'GOOGLE DRIVE BERHASIL TERKUNCI' : 'OTORISASI AKSES VIA POPUP'}</span>
            </button>
          </div>

          <button type="submit" disabled={isProcessing} className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-orange-500 text-white font-bold rounded-xl p-4 text-sm tracking-widest shadow-lg shadow-purple-500/20 hover:opacity-90 transition-all mt-6 disabled:opacity-50">
            {isProcessing ? "MEMPROSES PENDAFTARAN..." : "BUAT AKUN & FOLDER DRIVE"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">Sudah memiliki lisensi? <Link to="/login" className="text-purple-400 font-bold hover:underline tracking-wide">Masuk Aplikasi</Link></p>
      </div>
    </div>
  );
}