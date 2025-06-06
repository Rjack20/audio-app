// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth'
import { getDatabase, ref, set } from "firebase/database";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDUQZ4Pq_JesTTj3fjWA4fzgBatND1WWoQ",
  authDomain: "app-1-fd351.firebaseapp.com",
  projectId: "app-1-fd351",
  storageBucket: "app-1-fd351.firebasestorage.app",
  messagingSenderId: "485721470146",
  appId: "1:485721470146:web:8678142787f5c5206d375b",
  measurementId: "G-TD7EG928ZC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app)

const analytics = getAnalytics(app);
export { auth, database };