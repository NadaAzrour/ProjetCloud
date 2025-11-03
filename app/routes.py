from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from app import mysql
from werkzeug.security import generate_password_hash, check_password_hash

main = Blueprint('main', __name__)

# ---------- Page d'accueil ----------
@main.route('/')
def index():
    return render_template('index.html')

# ---------- Register ----------
@main.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        hashed_password = generate_password_hash(password, method='sha256')

        cur = mysql.connection.cursor()
        try:
            cur.execute("INSERT INTO users (email, password) VALUES (%s, %s)", (email, hashed_password))
            mysql.connection.commit()
            flash("Compte créé avec succès ! ✅", "success")
            return redirect(url_for('main.login'))
        except Exception as e:
            flash("Erreur : Email déjà utilisé ou autre problème.", "error")
        finally:
            cur.close()
    return render_template('register.html')

# ---------- Login ----------
@main.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        cur = mysql.connection.cursor()
        cur.execute("SELECT * FROM users WHERE email=%s", (email,))
        user = cur.fetchone()
        cur.close()

        if user and check_password_hash(user[2], password):
            session['user_id'] = user[0]
            session['user_email'] = user[1]
            flash("Connexion réussie ✅", "success")
            return redirect(url_for('main.tasks'))
        else:
            flash("Email ou mot de passe incorrect ❌", "error")
    return render_template('login.html')

# ---------- Logout ----------
@main.route('/logout')
def logout():
    session.clear()
    flash("Vous êtes déconnecté", "info")
    return redirect(url_for('main.login'))

# ---------- Tasks ----------
@main.route('/tasks', methods=['GET', 'POST'])
def tasks():
    if 'user_id' not in session:
        flash("Veuillez vous connecter !", "error")
        return redirect(url_for('main.login'))

    cur = mysql.connection.cursor()
    if request.method == 'POST':
        title = request.form['title']
        priority = request.form['priority']
        category = request.form['category']

        if not title:
            flash("Le titre de la tâche est obligatoire.", "error")
            return redirect(url_for('main.tasks'))

        cur.execute("INSERT INTO tasks (title, priority, category, completed) VALUES (%s,%s,%s,%s)",
                    (title, priority, category, False))
        mysql.connection.commit()
        flash("Tâche ajoutée ✅", "success")

    cur.execute("SELECT * FROM tasks ORDER BY id DESC")
    tasks = cur.fetchall()
    cur.close()
    return render_template('tasks.html', tasks=tasks)

# ---------- Toggle task ----------
@main.route('/task/<int:id>/toggle')
def toggle(id):
    cur = mysql.connection.cursor()
    cur.execute("UPDATE tasks SET completed = NOT completed WHERE id = %s", [id])
    mysql.connection.commit()
    cur.close()
    flash("Statut mis à jour 🔄", "info")
    return redirect(url_for('main.tasks'))

# ---------- Delete task ----------
@main.route('/task/<int:id>/delete')
def delete(id):
    cur = mysql.connection.cursor()
    cur.execute("DELETE FROM tasks WHERE id = %s", [id])
    mysql.connection.commit()
    cur.close()
    flash("Tâche supprimée 🗑️", "warning")
    return redirect(url_for('main.tasks'))
