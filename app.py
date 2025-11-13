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

# ------------------Waves Section -------------------
@app.route('/waves')
def waves():
    return render_template('waves.html')

@app.route('/standing')
def standing():
    return render_template('standing.html')

@app.route('/doppler')
def doppler():
    return render_template('doppler.html')

# ------------------Electrostatics Section -------------------
@app.route('/electric')
def electric():
    return render_template('electric.html')

@app.route('/capacitor')
def capacitor():
    return render_template('capacitor.html')

@app.route('/magnetic')
def magnetic():
    return render_template('magnetic.html')

#-------------------Optics----------------------------
@app.route('/snell')
def snell():
    return render_template('snell.html')

@app.route('/lenses')
def lenses():
    return render_template('lenses.html')

@app.route('/diffraction')
def diffraction():
    return render_template('diffraction.html')


#---------------------Heat and Thermodynamics--------
@app.route('/thermal')
def thermal():
    return render_template('thermal.html')


# ----------------- Running the app -----------------
if __name__ == '__main__':
    app.run(debug=True)
