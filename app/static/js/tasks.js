import { db, auth } from "./firebase_config.js";
// CORRECTION ICI : J'ai ajouté 'getDoc' dans les imports
import { collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";

// --- DOM ELEMENTS ---
const tasksList = document.getElementById("tasksList");
const taskForm = document.getElementById("taskForm");
const logoutBtn = document.getElementById("logoutBtn");
const profileBtn = document.getElementById("profileBtn");
const dropdownMenu = document.getElementById("dropdownMenu");
const navProfileImage = document.getElementById("navProfileImage");
const userGreeting = document.getElementById("userGreeting"); // Ajouté pour gérer le message de bienvenue

let currentUser = null;

// --- GESTION DECONNEXION ---
if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        const confirme = confirm("Voulez-vous vraiment vous déconnecter ?");
        if (confirme) {
            await signOut(auth);
            window.location.href = "/login";
        }
    });
}

// --- GESTION DU MENU DROPDOWN ---
if (profileBtn) {
    profileBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle("hidden");
    });
}

document.addEventListener("click", () => {
    if (dropdownMenu && !dropdownMenu.classList.contains("hidden")) {
        dropdownMenu.classList.add("hidden");
    }
});

// --- LOGIQUE PRINCIPALE (Authentification + Chargement Données) ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("UID connecté :", user.uid);
        currentUser = user;

        // 1. Charger les tâches
        renderTasks();

        // 2. Charger les infos profil (Image + Nom)
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            
            if (userDoc.exists()) {
                const data = userDoc.data();
                
                // Mise à jour de l'image dans la navbar
                if (navProfileImage && data.photoBase64) {
                    navProfileImage.src = data.photoBase64;
                }

                // Mise à jour du message de bienvenue (Bonjour Prénom)
                if (userGreeting && data.firstName) {
                    userGreeting.textContent = `Bonjour ${data.firstName} !`;
                }
            }
        } catch (error) {
            console.error("Erreur chargement profil :", error);
        }

    } else {
        // Si pas connecté, rediriger vers login
        window.location.href = "/login";
    }
});

// --- FONCTIONS TACHES ---

// Affichage des tâches
async function renderTasks() {
    tasksList.innerHTML = "";
    if (!currentUser) return;

    const q = query(collection(db, "tasks"), where("uid", "==", currentUser.uid));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        tasksList.innerHTML = `<tr><td colspan="5" class="text-center text-gray-500 py-4">Aucune tâche pour le moment.</td></tr>`;
    }

    snapshot.forEach(docSnap => {
        const task = docSnap.data();
        const tr = document.createElement("tr");
        tr.classList.add("border-b", "hover:bg-gray-50");

        tr.innerHTML = `
            <td class="py-3 px-4 ${task.completed ? "line-through text-gray-400" : ""}">${task.title}</td>
            <td class="py-3 px-4">${task.priority}</td>
            <td class="py-3 px-4">${task.category}</td>
            <td class="py-3 px-4 text-center">${task.completed ? 
                '<span class="text-green-600 font-semibold">Terminée</span>' : 
                '<span class="text-yellow-500 font-semibold">En cours</span>'}</td>
            <td class="py-3 px-4 flex justify-center gap-3">
                <button data-id="${docSnap.id}" class="toggle text-blue-500 hover:text-blue-700 font-semibold">✔</button>
                <button data-id="${docSnap.id}" class="delete text-red-500 hover:text-red-700 font-semibold">🗑</button>
            </td>
        `;
        tasksList.appendChild(tr);

        // Events boutons
        tr.querySelector(".toggle").addEventListener("click", async () => {
            const ref = doc(db, "tasks", docSnap.id);
            await updateDoc(ref, { completed: !task.completed });
            renderTasks();
        });

        tr.querySelector(".delete").addEventListener("click", async () => {
            if (confirm("Voulez-vous vraiment supprimer cette tâche ?")) {
                await deleteDoc(doc(db, "tasks", docSnap.id));
                renderTasks();
            }
        });
    });
}

// Ajouter tâche
if (taskForm) {
    taskForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = taskForm.title.value;
        const priority = taskForm.priority.value;
        const category = taskForm.category.value;

        await addDoc(collection(db, "tasks"), {
            uid: currentUser.uid,
            title,
            priority,
            category,
            completed: false
        });

        taskForm.reset();
        renderTasks();
    });
}