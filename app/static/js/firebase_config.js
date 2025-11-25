import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";
// 1. AJOUTE CET IMPORT
import { getPerformance } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-performance.js";

const firebaseConfig = {
  // ... (ne touche pas au reste)
  apiKey: "AIzaSyAo4rKEUQw0SGTk9vNDUu9x61yFDJbSFyo",
  // ...
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 2. AJOUTE CETTE LIGNE À LA FIN
const perf = getPerformance(app);

export { auth, db };