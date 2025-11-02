from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

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

if __name__ == '__main__':
    app.run(debug=True)