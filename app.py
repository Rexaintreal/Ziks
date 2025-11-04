from flask import Flask, render_template

app = Flask(__name__)

# ----------------- landing page -----------------
@app.route('/')
def index():
    return render_template('index.html')

# ----------------- Mechanics section -----------------
@app.route('/projectile')
def projectile():
    return render_template('projectile.html')

@app.route('/force')
def force():
    return render_template('force.html')

@app.route('/pendulum')
def pendulum():
    return render_template('pendulum.html')

@app.route('/incline')
def incline():
    return render_template('incline.html')

@app.route('/circular')
def circular():
    return render_template('circular.html')

@app.route('/spring')
def spring():
    return render_template('spring.html')

@app.route('/collision')
def collision():
    return render_template('collision.html')

@app.route('/torque')
def torque():
    return render_template('torque.html')

@app.route('/rolling')
def rolling():
    return render_template('rolling.html')

# ----------------- Running the app -----------------
if __name__ == '__main__':
    app.run(debug=True)
