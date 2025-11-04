from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from app import mysql
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

main = Blueprint('main', _name_)

# ---------- Décorateur login_required ----------
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash("Veuillez vous connecter !", "error")
            return redirect(url_for('main.login'))
        return f(*args, **kwargs)
    return decorated_function

# ---------- Page d'accueil ----------
@main.route('/')
def index():
    return render_template('index.html')

# ---------- Inscription ----------
@main.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        nom = request.form.get('nom')
        prenom = request.form.get('prenom')
        filiere = request.form.get('filiere')
        niveau = request.form.get('niveau')
        email = request.form.get('email')
        password = request.form.get('password')

        # Vérification des champs obligatoires
        if not all([nom, prenom, email, password]):
            flash("Tous les champs obligatoires doivent être remplis ⚠", "error")
            return redirect(url_for('main.register'))

        hashed_password = generate_password_hash(password, method='pbkdf2:sha256')

        cur = mysql.connection.cursor()
        try:
            # Vérifier si l'email existe déjà
            cur.execute("SELECT * FROM users WHERE email=%s", (email,))
            if cur.fetchone():
                flash("Email déjà utilisé ❌", "error")
                return redirect(url_for('main.register'))

            # Insertion de l'utilisateur
            cur.execute("""
                INSERT INTO users (nom, prenom, filiere, niveau, email, password)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (nom, prenom, filiere, niveau, email, hashed_password))
            mysql.connection.commit()
            flash("Compte créé avec succès ✅", "success")
            return redirect(url_for('main.login'))
        finally:
            cur.close()

    return render_template('register.html')


# ---------- Connexion ----------
@main.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        if not email or not password:
            flash("Email et mot de passe sont obligatoires ⚠", "error")
            return redirect(url_for('main.login'))

        cur = mysql.connection.cursor()
        try:
            cur.execute("SELECT * FROM users WHERE email=%s", (email,))
            user = cur.fetchone()
        finally:
            cur.close()

        # ⚙ Vérification du mot de passe
        # Structure : (id, nom, prenom, filiere, niveau, email, password)
        if user and check_password_hash(user[6], password):
            session['user_id'] = user[0]
            session['user_email'] = user[5]
            session['user_nom'] = user[1]
            flash(f"Bienvenue {user[1]} 👋", "success")
            return redirect(url_for('main.tasks'))
        else:
            flash("Email ou mot de passe incorrect ❌", "error")

    return render_template('login.html')


# ---------- Déconnexion ----------
@main.route('/logout')
@login_required
def logout():
    session.clear()
    flash("Vous êtes déconnecté 🛈", "info")
    return redirect(url_for('main.login'))


# ---------- Tableau des tâches ----------
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
                flash("Le titre de la tâche est obligatoire ⚠", "error")
            else:
                cur.execute("""
                    INSERT INTO tasks (title, priority, category, completed, user_id)
                    VALUES (%s, %s, %s, %s, %s)
                """, (title, priority, category, False, user_id))
                mysql.connection.commit()
                flash("Tâche ajoutée ✅", "success")

        # Récupérer toutes les tâches de l'utilisateur
        cur.execute("SELECT * FROM tasks WHERE user_id=%s ORDER BY id DESC", (user_id,))
        tasks = cur.fetchall()
    finally:
        cur.close()

    return render_template('tasks.html', tasks=tasks)


# ---------- Basculer le statut d'une tâche ----------
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
            flash("Tâche introuvable ou non autorisée ❌", "error")
        else:
            mysql.connection.commit()
            flash("Statut mis à jour 🔄", "info")
    finally:
        cur.close()
    return redirect(url_for('main.tasks'))


# ---------- Supprimer une tâche ----------
@main.route('/task/<int:id>/delete')
@login_required
def delete(id):
    user_id = session['user_id']
    cur = mysql.connection.cursor()
    try:
        cur.execute("DELETE FROM tasks WHERE id = %s AND user_id = %s", (id, user_id))
        if cur.rowcount == 0:
            flash("Tâche introuvable ou non autorisée ❌", "error")
        else:
            mysql.connection.commit()
            flash("Tâche supprimée 🗑", "warning")
    finally:
        cur.close()
    return redirect(url_for('main.tasks'))