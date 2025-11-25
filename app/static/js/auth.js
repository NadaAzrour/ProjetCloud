// static/js/auth.js
import { auth, db } from "./firebase_config.js";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";

// ---------- REGISTER ----------
const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const firstName = e.target.firstName.value.trim();
    const lastName = e.target.lastName.value.trim();
    const email = e.target.email.value.trim();
    const niveauEtude = e.target.niveauEtude.value;
    const password = e.target.password.value;
    const confirmPassword = e.target.confirmPassword.value;

    if (password !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas !");
      return;
    }

    try {
      // Création dans Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Ajout du document dans Firestore
      await setDoc(doc(db, "users", user.uid), {
        firstName,
        lastName,
        email,
        niveauEtude,
      });

      alert("Compte créé avec succès !");
      window.location.href = "/login";

    } catch (err) {
      alert("Erreur : " + err.message);
    }
  });
}

// ---------- LOGIN ----------
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "/tasks";
    } catch (err) {
      alert("Erreur de connexion : " + err.message);
    }
  });
}

// ---------- LOGOUT ----------
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    const confirmed = confirm("Voulez-vous vraiment vous déconnecter ?");
    if (confirmed) {
      await signOut(auth);
      window.location.href = "/login";
    }
  });
}

// ---------- CHECK AUTH & DISPLAY USER INFO ----------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // Redirige si non connecté
    if (window.location.pathname.includes("tasks")) {
      window.location.href = "/login";
    }
  } else {
    // Affiche "Bonjour [Prénom]" si on est sur tasks
    if (window.location.pathname.includes("tasks")) {
  try {
    const docSnap = await getDoc(doc(db, "users", user.uid));
    if (docSnap.exists()) {
      const userData = docSnap.data();
      console.log("✅ Utilisateur connecté :", userData);
      const greetingEl = document.getElementById("userGreeting");
      if (greetingEl) {
        greetingEl.textContent = `Bonjour ${userData.firstName} !`;
      }
    }
  } catch (err) {
    console.error("Erreur récupération utilisateur :", err);
  }
}

  }
});
