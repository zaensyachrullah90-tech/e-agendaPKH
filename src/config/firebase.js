import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDWVkNEOaRDE_wEvGmqTioT-Mxyl4srdhI",
  authDomain: "apppkhtapin.firebaseapp.com",
  databaseURL: "https://apppkhtapin-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "apppkhtapin",
  storageBucket: "apppkhtapin.firebasestorage.app",
  messagingSenderId: "100952526834",
  appId: "1:100952526834:web:003d89bc8c115c7139a56b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);