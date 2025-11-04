from flask import Flask, render_template
import os

# Définir le chemin des templates et du static
base_dir = os.path.dirname(os.path.abspath(__file__))
template_dir = os.path.join(base_dir, 'app', 'templates')
static_dir = os.path.join(base_dir, 'app', 'static')

app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register')
def register():
    return render_template('register.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/tasks')
def tasks():
    return render_template('tasks.html')

if __name__ == '__main__':
    app.run(debug=True)
