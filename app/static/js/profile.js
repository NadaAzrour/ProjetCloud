import { db, auth } from "./firebase_config.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";

const firstNameInput = document.getElementById("firstName");
const lastNameInput = document.getElementById("lastName");
const emailInput = document.getElementById("email");
const niveauSelect = document.getElementById("niveauEtude");
const profileImage = document.getElementById("profileImage");
const fileInput = document.getElementById("fileInput");
const profileForm = document.getElementById("profileForm");

let currentUser = null;

// 1. Charger les données
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        emailInput.value = user.email; // L'email ne change pas

        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            firstNameInput.value = data.firstName || "";
            lastNameInput.value = data.lastName || "";
            niveauSelect.value = data.niveauEtude || "Licence";
            
            if (data.photoBase64) {
                profileImage.src = data.photoBase64;
            }
        }
    } else {
        window.location.href = "/login";
    }
});

// 2. Gestion Image (Base64 - Sans Storage Cloud)
fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1048576) { // 1Mo Max
        alert("Image trop lourde ! Max 1 Mo.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        profileImage.src = event.target.result; // Prévisualisation immédiate
    };
    reader.readAsDataURL(file);
});

// 3. Sauvegarder le profil
profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const btn = e.submitter; // Le bouton cliqué
    const originalText = btn.innerText;
    btn.innerText = "Sauvegarde...";
    btn.disabled = true;

    try {
        const userRef = doc(db, "users", currentUser.uid);
        
        // On prépare les données à mettre à jour
        const updateData = {
            firstName: firstNameInput.value,
            lastName: lastNameInput.value,
            niveauEtude: niveauSelect.value
        };

        // Si l'image a changé (contient "data:image"), on l'ajoute
        if (profileImage.src.startsWith("data:image")) {
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