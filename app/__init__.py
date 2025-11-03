from flask import Flask
from flask_mysqldb import MySQL

mysql = MySQL()

def create_app():
    app = Flask(__name__)
    app.secret_key = "t0d0listcloud"

    # Configuration MySQL
    app.config['MYSQL_HOST'] = 'localhost'
    app.config['MYSQL_PORT'] = 3307            # <-- Ici le port correct
    app.config['MYSQL_USER'] = 'root'
    app.config['MYSQL_PASSWORD'] = ''          # ton mot de passe MySQL
    app.config['MYSQL_DB'] = 'todolist'

    mysql.init_app(app)

    from app.routes import main
    app.register_blueprint(main)

    return app
