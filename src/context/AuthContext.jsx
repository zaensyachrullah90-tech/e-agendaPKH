import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const cachedUser = localStorage.getItem('e_agenda_user');
    return cachedUser ? JSON.parse(cachedUser) : null;
  });
  
  const [profile, setProfile] = useState(() => {
    const cachedProfile = localStorage.getItem('e_agenda_profile');
    return cachedProfile ? JSON.parse(cachedProfile) : null;
  });

  const [googleToken, setGoogleToken] = useState(() => {
    return localStorage.getItem('e_agenda_gtoken') || '';
  });

  const [loading, setLoading] = useState(!user);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        localStorage.setItem('e_agenda_user', JSON.stringify(currentUser));
        
        // Membaca dari root 'users' asli Anda
        const profileRef = ref(db, `users/${currentUser.uid}`);
        onValue(profileRef, (snapshot) => {
          if (snapshot.exists()) {
            const profileData = snapshot.val();
            setProfile(profileData);
            localStorage.setItem('e_agenda_profile', JSON.stringify(profileData));
          } else {
            setProfile(null);
          }
          setLoading(false);
        }, (err) => {
          console.error("Profile security lock active", err);
          setLoading(false);
        });
      } else {
        setUser(null);
        setProfile(null);
        setGoogleToken('');
        localStorage.removeItem('e_agenda_user');
        localStorage.removeItem('e_agenda_profile');
        localStorage.removeItem('e_agenda_gtoken');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const saveGoogleToken = (token) => {
    setGoogleToken(token);
    localStorage.setItem('e_agenda_gtoken', token);
  };

  const logoutUser = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, googleToken, loading, saveGoogleToken, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);