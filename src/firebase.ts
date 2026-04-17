// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// Correct
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCmhbmtCTMwQDdS2Tp8kenLzt_8lqitnhc",
  authDomain: "ghibli-sign-game.firebaseapp.com",
  projectId: "ghibli-sign-game",
  storageBucket: "ghibli-sign-game.firebasestorage.app",
  messagingSenderId: "32824369095",
  appId: "1:32824369095:web:bc35abe9964c973cf983e2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Export auth and database for use in other files
export const auth = getAuth(app);
export const db = getFirestore(app); 

