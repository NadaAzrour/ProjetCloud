from flask import Flask, request, jsonify
from flask_mysqldb import MySQL
import MySQLdb.cursors

app = Flask(__name__)

# Configuration MySQL 
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''
app.config['MYSQL_DB'] = 'todolist'

mysql = MySQL(app)

# ---- ROUTES ----

@app.route('/')
def home():
    return " Backend Flask connecté à MySQL avec succès !"

# Récupérer toutes les tâches
@app.route('/tasks', methods=['GET'])
def get_tasks():
    cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cur.execute("SELECT * FROM tasks")
    tasks = cur.fetchall()
    cur.close()
    return jsonify(tasks)

# Ajouter une tâche
@app.route('/tasks', methods=['POST'])
def add_task():
    data = request.get_json()
    cur = mysql.connection.cursor()
    cur.execute("""
        INSERT INTO tasks (title, priority, category, completed)
        VALUES (%s, %s, %s, %s)
    """, (data['title'], data['priority'], data['category'], data['completed']))
    mysql.connection.commit()
    cur.close()
    return jsonify({"message": "Tâche ajoutée ✅"})

# Modifier une tâche
@app.route('/tasks/<int:id>', methods=['PUT'])
def update_task(id):
    data = request.get_json()
    cur = mysql.connection.cursor()
    cur.execute("""
        UPDATE tasks
        SET title=%s, priority=%s, category=%s, completed=%s
        WHERE id=%s
    """, (data['title'], data['priority'], data['category'], data['completed'], id))
    mysql.connection.commit()
    cur.close()
    return jsonify({"message": "Tâche mise à jour "})

#  Supprimer une tâche
@app.route('/tasks/<int:id>', methods=['DELETE'])
def delete_task(id):
    cur = mysql.connection.cursor()
    cur.execute("DELETE FROM tasks WHERE id=%s", (id,))
    mysql.connection.commit()
    cur.close()
    return jsonify({"message": "Tâche supprimée "})

# Récupérer toutes les users (bonus)
@app.route('/users', methods=['GET'])
def get_users():
    cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cur.execute("SELECT * FROM users")
    users = cur.fetchall()
    cur.close()
    return jsonify(users)

if __name__ == '__main__':
    app.run(debug=True)
