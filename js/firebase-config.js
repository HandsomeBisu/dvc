
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC-OybGCrxlayMUmcOq6oi-lr8w-C5MJ_c",
    authDomain: "dpsevent-b526d.firebaseapp.com",
    projectId: "dpsevent-b526d",
    storageBucket: "dpsevent-b526d.firebasestorage.app",
    messagingSenderId: "940533062410",
    appId: "1:940533062410:web:12aef5874e800e402038f3",
    measurementId: "G-RWR8ZCB3C2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
