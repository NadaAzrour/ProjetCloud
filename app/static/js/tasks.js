import { db, auth } from "./firebase_config.js";
import { collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";

const tasksList = document.getElementById("tasksList");
const taskForm = document.getElementById("taskForm");
const logoutBtn = document.getElementById("logoutBtn");
let currentUser = null;

// Déconnexion avec confirmation
logoutBtn.addEventListener("click", async () => {
    const confirme = confirm("Voulez-vous vraiment vous déconnecter ?");
    if (confirme) {
        await signOut(auth);
        window.location.href = "/login";
    }
});


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

// Vérification de l'utilisateur connecté
onAuthStateChanged(auth, user => {
    if (user) {
        console.log("UID de l'utilisateur connecté :", user.uid);
        currentUser = user;
        renderTasks();
    } else {
        window.location.href = "/login";
    }
});
