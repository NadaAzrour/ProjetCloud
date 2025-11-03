from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from app import mysql
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

main = Blueprint('main', __name__)

# ---------- Decorator login_required ----------
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id'not in session:
            flash("Veuillez vous connecter !", "error")
            return redirect(url_for('main.login'))
        return f(*args, **kwargs)
    return decorated_function

# ---------- Page d'accueil ----------
@main.route('/')
def index():
    return render_template('index.html')

# ---------- Register ----------
@main.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        if not email or not password:
            flash("Email et mot de passe sont obligatoires.", "error")
            return redirect(url_for('main.register'))

        hashed_password = generate_password_hash(password, method='pbkdf2:sha256')

        cur = mysql.connection.cursor()
        try:
            # Vérifier si email existe
            cur.execute("SELECT * FROM users WHERE email=%s", (email,))
            if cur.fetchone():
                flash("Email déjà utilisé ❌", "error")
                return redirect(url_for('main.register'))

            # Insérer utilisateur
            cur.execute("INSERT INTO users (email, password) VALUES (%s, %s)", (email, hashed_password))
            mysql.connection.commit()
            flash("Compte créé avec succès ✅", "success")
            return redirect(url_for('main.login'))
        finally:
            cur.close()
    return render_template('register.html')

# ---------- Login ----------
@main.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        if not email or not password:
            flash("Email et mot de passe sont obligatoires.", "error")
            return redirect(url_for('main.login'))

        cur = mysql.connection.cursor()
        try:
            cur.execute("SELECT * FROM users WHERE email=%s", (email,))
            user = cur.fetchone()  # <-- récupère l'utilisateur depuis la base
        finally:
            cur.close()

        # ---------------- Ici ----------------
        if user and check_password_hash(user[2], password):
            session['user_id'] = user[0]      # <-- c'est essentiel
            session['user_email'] = user[1]   # stocke aussi l'email si besoin
            flash("Connexion réussie ✅", "success")
            return redirect(url_for('main.tasks'))
        else:
            flash("Email ou mot de passe incorrect ❌", "error")
        # -------------------------------------
        
    return render_template('login.html')


# ---------- Logout ----------
@main.route('/logout')
@login_required
def logout():
    session.clear()
    flash("Vous êtes déconnecté 🛈", "info")
    return redirect(url_for('main.login'))

# ---------- Tasks ----------
@main.route('/tasks', methods=['GET', 'POST'])
@login_required
def tasks():
    user_id = session['user_id']
    cur = mysql.connection.cursor()
    try:
        # Ajouter une tâche
        if request.method == 'POST':
            title = request.form.get('title')
            priority = request.form.get('priority')
            category = request.form.get('category')

            if not title:
                flash("Le titre de la tâche est obligatoire.", "error")
            else:
                cur.execute(
                    "INSERT INTO tasks (title, priority, category, completed, user_id) VALUES (%s,%s,%s,%s,%s)",
                    (title, priority, category, False, user_id)
                )
                mysql.connection.commit()
                flash("Tâche ajoutée ✅", "success")

        # Récupérer toutes les tâches de l'utilisateur
        cur.execute("SELECT * FROM tasks WHERE user_id=%s ORDER BY id DESC", (user_id,))
        tasks = cur.fetchall()
    finally:
        cur.close()

    return render_template('tasks.html', tasks=tasks)

# ---------- Toggle task ----------
@main.route('/task/<int:id>/toggle')
@login_required
def toggle(id):
    user_id = session['user_id']
    cur = mysql.connection.cursor()
    try:
        cur.execute(
            "UPDATE tasks SET completed = NOT completed WHERE id = %s AND user_id = %s",
            (id, user_id)
        )
        if cur.rowcount == 0:
            flash("Tâche introuvable ou non autorisée.", "error")
        else:
            mysql.connection.commit()
            flash("Statut mis à jour 🔄", "info")
    finally:
        cur.close()
    return redirect(url_for('main.tasks'))

# ---------- Delete task ----------
@main.route('/task/<int:id>/delete')
@login_required
def delete(id):
    user_id = session['user_id']
    cur = mysql.connection.cursor()
    try:
        cur.execute(
            "DELETE FROM tasks WHERE id = %s AND user_id = %s",
            (id, user_id)
        )
        if cur.rowcount == 0:
            flash("Tâche introuvable ou non autorisée.", "error")
        else:
            mysql.connection.commit()
            flash("Tâche supprimée 🗑️", "warning")
    finally:
        cur.close()
    return redirect(url_for('main.tasks'))
