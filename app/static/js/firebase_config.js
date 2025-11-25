// static/js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";
import { getPerformance } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-performance.js";

// 🔹 Remplace par ta config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAo4rKEUQw0SGTk9vNDUu9x61yFDJbSFyo",
  authDomain: "to-do-list-cloud-7fd86.firebaseapp.com",
  projectId: "to-do-list-cloud-7fd86",
  storageBucket: "to-do-list-cloud-7fd86.firebasestorage.app",
  messagingSenderId: "918724312603",
  appId: "1:918724312603:web:a5e998c94cfc93c7fc42be",
  measurementId: "G-GETM6FF949"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const perf = getPerformance(app);

export { auth, db };
