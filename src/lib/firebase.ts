
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAooN2ikxw-R94_ye0OBWJMTsLXjH7cNTs",
  authDomain: "exec-proj.firebaseapp.com",
  projectId: "exec-proj",
  storageBucket: "exec-proj.firebasestorage.app",
  messagingSenderId: "446609272871",
  appId: "1:446609272871:web:d6ce541c00474962b75e02",
  measurementId: "G-B2QJ4L0D1M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
