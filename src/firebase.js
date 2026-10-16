import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBgmHQb1wZvLBTlAvGYF11l3WYGzI0A-Ec",
  authDomain: "barangayhealth-3a5a2.firebaseapp.com",
  databaseURL: "https://barangayhealth-3a5a2-default-rtdb.firebaseio.com",
  projectId: "barangayhealth-3a5a2",
  storageBucket: "barangayhealth-3a5a2.firebasestorage.app",
  messagingSenderId: "224789207387",
  appId: "1:224789207387:web:9bb94e4a5b1e32bfdd627e",
  measurementId: "G-GPDZ2NC2TE"
};

if (!firebaseConfig.projectId) {
  throw new Error(
    "Firebase config is missing. Add this project's values to firebaseConfig."
  );
}

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
