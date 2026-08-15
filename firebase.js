// import { initializeApp } from "firebase/app";
// import { getAuth } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
const firebaseConfig = {
  apiKey: "AIzaSyB1nI2Gjzle58HdjLlwTIxdtc7IibEdX1o",
  authDomain: "conf-296da.firebaseapp.com",
  projectId: "conf-296da",
  storageBucket: "conf-296da.firebasestorage.app",
  messagingSenderId: "5836109323",
  appId: "1:5836109323:web:cc850a5cebb53120cb790e",
  measurementId: "G-D1TXR3JN24"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);