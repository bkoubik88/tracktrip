// lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCNBSTF2LszCCUS3q-kPQ8tpYkA0L9hxCI",
  authDomain: "tracktrip-f3813.firebaseapp.com",
  projectId: "tracktrip-f3813",
  storageBucket: "tracktrip-f3813.appspot.com",
  messagingSenderId: "150362713550",
  appId: "1:150362713550:web:d1316e021a791d1555cf9f",
};

const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
export const db = getFirestore(app);
