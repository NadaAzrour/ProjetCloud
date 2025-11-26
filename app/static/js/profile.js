import { db, auth } from "./firebase_config.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";

// --- CONFIGURATION CLOUDINARY ---
const CLOUD_NAME = "dp4v0vrcn"; 
const UPLOAD_PRESET = "projet_cloud"; 

// --- ELEMENTS DOM ---
const firstNameInput = document.getElementById("firstName");
const lastNameInput = document.getElementById("lastName");
const emailInput = document.getElementById("email");
const niveauSelect = document.getElementById("niveauEtude");
const profileImage = document.getElementById("profileImage");
const fileInput = document.getElementById("fileInput");
const profileForm = document.getElementById("profileForm");

let currentUser = null;

// 1. Charger les données au démarrage
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        emailInput.value = user.email;

        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            firstNameInput.value = data.firstName || "";
            lastNameInput.value = data.lastName || "";
            niveauSelect.value = data.niveauEtude || "Licence";
            
            // Affiche l'image si elle existe (URL Cloudinary ou ancien Base64)
            if (data.photoBase64) {
                profileImage.src = data.photoBase64;
            }
        }
    } else {
        window.location.href = "/login";
    }
});

// 2. Gestion Image (UPLOAD VERS CLOUDINARY) ☁️
fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Feedback visuel pendant le chargement
    profileImage.style.opacity = "0.5";
    document.body.style.cursor = "wait";

    try {
        // Préparation des données pour Cloudinary
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);

        // Appel API Cloudinary
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (data.error) throw new Error(data.error.message);

        // On récupère l'URL sécurisée
        let imageUrl = data.secure_url;

        // --- OPTIMISATION CDN ---
        // Ajout de f_auto (format auto) et q_auto (qualité auto) pour la performance
        imageUrl = imageUrl.replace("/upload/", "/upload/f_auto,q_auto/");
        
        // On met à jour l'image tout de suite sur l'écran
        profileImage.src = imageUrl;
        console.log("Image uploadée sur Cloudinary :", imageUrl);

    } catch (error) {
        console.error("Erreur Cloudinary :", error);
        alert("Erreur lors de l'envoi de l'image vers le Cloud.");
    } finally {
        // Rétablir l'interface
        profileImage.style.opacity = "1";
        document.body.style.cursor = "default";
    }
});

// 3. Sauvegarder le profil dans Firestore
profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const btn = e.submitter;
    const originalText = btn.innerText;
    btn.innerText = "Sauvegarde...";
    btn.disabled = true;

    try {
        const userRef = doc(db, "users", currentUser.uid);
        
        const updateData = {
            firstName: firstNameInput.value,
            lastName: lastNameInput.value,
            niveauEtude: niveauSelect.value
        };

        // --- CORRECTION ---
        // On sauvegarde l'URL Cloudinary (qui commence par http)
        // On vérifie simplement que src existe et n'est pas le placeholder par défaut
        if (profileImage.src && profileImage.src.includes("http")) {
            // On garde le champ 'photoBase64' pour la compatibilité avec tasks.js
            updateData.photoBase64 = profileImage.src;
        }

        await updateDoc(userRef, updateData);
        alert("Profil mis à jour avec succès ! ✅");

    } catch (error) {
        console.error(error);
        alert("Erreur lors de la mise à jour.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
});