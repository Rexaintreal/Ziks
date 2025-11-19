<div align="center">
  <img src="static/assets/logo-github.png" alt="Ziks Logo" width="200"/>
  
  # Ziks
  
  **A web app with interactive physics simulations built to visualize various physics concepts**
  
  [![GitHub](https://img.shields.io/badge/GitHub-Ziks-blue?logo=github)](https://github.com/Rexaintreal/Ziks)
  [![Axiom](https://img.shields.io/badge/Built%20for-Axiom%20YSWS-orange)](https://axiom.hackclub.com/)
  [![Hackatime](https://hackatime-badge.hackclub.com/U09B8FXUS78/Ziks)](https://hackatime-badge.hackclub.com/U09B8FXUS78/Ziks)
  [![Flask](https://img.shields.io/badge/Flask-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
  [![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
  [![HTML5 Canvas](https://img.shields.io/badge/HTML5%20Canvas-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
  
</div>

---

## About

Ziks is a web app i built with 21 physics simulations which covers many fields of physics from mechanics to optics and even modern physics i picked the topics from my university entrance exam (JEE) books (yup thats literally my physics syllabus :sob) i created everything from scratch using Canvas 2D in JavaScript and vanilla CSS for the design because I find it more controllable (eh? i hope you understand that lol)
Ziks is hosted on PythonAnywhere at [LINK](https://ziks.pythonanywhere.com/) try it and share your feedback! I made this project for [Axiom YSWS](https://axiom.hackclub.com/) a Hack Club YSWS

---

## Demo Video

The Demo video where I go through all 21 simulations running locally and some other features too

**[DEMO](https://drive.google.com/file/d/1VyIepPKpFuPfi7qosGK7wChIdbY195Co/view?usp=drive_link)**

---

## Try it (ITS LIVE)

Ziks is hosted on pythonanywhere and you can visit it at [LINK](https://ziks.pythonanywhere.com/) 

## Features

Here are all the 21 simulations organized by physics domain:

### Mechanics (9 Simulations)
- **Projectile Motion**: Change the angles speed and gravity to see your object launch like angry birds (literally)
- **Force Engine**: Push pull add more forces add more blocks and experiment with forces
- **Pendulum**: Adjust length and gravity drag it to 360 degrees to watch oscillations
- **Inclined Plane**: Watch blocks slide down adjustable inclines with friction and mass
- **Circular Motion**: Spin objects and observe centripetal force, velocity, and angular motion
- **Spring System**: Simulate oscillations with mass, spring constant, and damping controls
- **Collision Simulation**: Elastic and inelastic collisions visualize momentum and energy conservation
- **Torque & Equilibrium**: Balance beams with weights at different distances and watch rotational physics
- **Rolling Motion**: Simulate shapes rolling down ramps and see how moment of inertia affects speed

### Waves & Sound (3 Simulations)
- **Wave Interference**: Create interference patterns with multiple wave sources and visualize superposition
- **Standing Waves**: Visualize harmonics, nodes, and antinodes on vibrating strings with adjustable tension
- **Doppler Effect**: Hear frequency shifts as sound sources move you can drag the source to create custom paths too

### Electromagnetism (3 Simulations)
- **Electric Field**: Place charges and visualize electric fields with field lines, vectors, and equipotentials
- **RC Circuits**: Simulate capacitors charge and discharge through resistors and see exponential curves in real-time
- **Magnetic Induction**: Visualize Faraday's Laws with interactive magnets and graphs

### Optics (3 Simulations)
- **Snell's Law**: Visualize refraction and reflection with real-time light bending and total internal reflection
- **Lenses & Image Formation**: Explore convex and concave lenses with ray diagrams showing real and virtual image formation
- **Diffraction & Interference**: Visualize double slit experiment with intensity patterns control wavelength and slit spacing

### Thermodynamics (2 Simulations)
- **Thermal Expansion**: Heat up solids and liquids to visualize dimension changes with different materials and coefficients
- **Gas Laws**: See Gas particles bounce around adjust PVNRT variables and switch between ideal and real gas models

### Modern Physics (1 Simulation)
- **Photoelectric Effect**: Shine light on metal surfaces visualize electron emission and measure stopping potential with quantization

---

## Project Structure

```
Ziks/
├── devlogs/             # Screenshots of all simulations and the landing page 
├── static/               
│   ├── assets/          # Logo files and favicon
│   ├── css/             # Individual CSS for each simulation + global styles
│   └── js/              # Canvas based simulation scripts and universal script.js for theme toggle
├── templates/           # HTML templates for all pages
├── .gitignore           # Git ignore file
├── app.py               # Main Flask application with all routes
├── LICENSE              # MIT License
├── README.md            # You are reading this lol
└── requirements.txt     # Python dependencies (only Flask)
```

---

## Setup and Installation

### Prerequisites
- **Python 3.13+** (I used 3.13.5 but anything 3.13+ should work fine)
- **pip** for installing packages
- **Any modern browser** (Chrome, Firefox, Edge the simulations use Canvas API)

**Performance Note:** I tested all the simulations on an i5-12450HX with RTX 4050 (6GB) and 16GB DDR5 RAM If you experience lag on lower-end hardware you can adjust the FPS by modifying the `dt` value in the individual simulation's JavaScript file The default is `0.016` (60 FPS) you can increase it to `0.033` (30 FPS) or higher to reduce CPU usage.

### Installation Steps

1. **Clone the repo:**
   ```bash
   git clone https://github.com/Rexaintreal/Ziks.git
   cd Ziks
   ```

2. **Create a virtual environment (recommended):**
   
   This keeps things clean and doesn't mess with your other Python projects (i dont usually do it T_T)
   
   **Windows:**
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```
   
   **macOS / Linux:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   
   It's just Flask 

4. **Run the app:**
   ```bash
   python app.py
   ```

5. **Open it up:**
   
   Go to `http://127.0.0.1:5000` in your browser

---

## Usage

pretty straightforward: 
1. Landing page shows all 21 simulations organized by category
2. Click on any simulation you want to try
3. Use the control panel on the right to adjust parameters (sliders, dropdowns, checkboxes)
4. Hit Start/Play to run the simulation
5. Most simulations have:
   - Real-time graphs showing values over time
   - Zoom and pan controls (scroll to zoom, drag to pan using mouse and keyboard both)
   - Play/Pause and Reset buttons
   - Dark/Light mode toggle (saved in localStorage)
   - Equations and formulas displayed on canvas


---

## Technical Details

Each simulation is built using:
- **HTML5 Canvas** for all the rendering and animations
- **Vanilla JavaScript** for physics calculations and animation loops using `requestAnimationFrame`
- **CSS3** for styling with custom dark/light themes
- **Flask** as the backend (basically just routing no heavy backend logic like auth or databases)

The simulations run entirely client-side after the page loads, so they're pretty smooth. I tried to keep the physics equations as accurate as possible while still making them visually interesting.

---

## Browser Compatibility

Ziks works best on desktop browsers Not optimized for mobile yet (the control panels take up too much space on small screens and the navbar too)

---

## License

MIT [LICENSE](LICENSE).

---

## Acknowledgements

**THE INTERNET** - physics tutorials and Canvas API docs 

---

## You may also like...

Some other projects I've built:

- [Eureka](https://github.com/Rexaintreal/Eureka) - A website where you can find local spots near you which don't show up on Google Maps or any other apps
- [DawnDuck](https://github.com/Rexaintreal/DawnDuck) - USB HID Automation Tool for Morning Routines
- [Lynx](https://github.com/Rexaintreal/lynx) - OpenCV Image Manipulation WebApp
- [Libro Voice](https://github.com/Rexaintreal/Libro-Voice) - PDF to Audio Converter
- [Snippet Vision](https://github.com/Rexaintreal/Snippet-Vision) - YouTube Video Summarizer
- [Weather App](https://github.com/Rexaintreal/WeatherApp) - Python Weather Forecast App
- [Python Screenrecorder](https://github.com/Rexaintreal/PythonScreenrecorder) - Python Screen Recorder
- [Typing Speed Tester](https://github.com/Rexaintreal/TypingSpeedTester) - Python Typing Speed Tester
- [Movie Recommender](https://github.com/Rexaintreal/Movie-Recommender) - Python Movie Recommender
- [Password Generator](https://github.com/Rexaintreal/Password-Generator) - Python Password Generator
- [Object Tales](https://github.com/Rexaintreal/Object-Tales) - Python Image to Story Generator
- [Finance Manager](https://github.com/Rexaintreal/Finance-Manager) - Flask WebApp to Monitor Savings
- [Codegram](https://github.com/Rexaintreal/Codegram) - Social Media for Coders
- [Simple Flask Notes](https://github.com/Rexaintreal/Simple-Flask-Notes) - Flask Notes App
- [Key5](https://github.com/Rexaintreal/key5) - Python Keylogger
- [Codegram2024](https://github.com/Rexaintreal/Codegram2024) - Modern Codegram Update
- [Cupid](https://github.com/Rexaintreal/cupid) - Dating Web App for Teenagers
- [Gym Vogue](https://github.com/Rexaintreal/GymVogue/) - Ecommerce for Gym Freaks
- [Confessions](https://github.com/Rexaintreal/Confessions) - Anonymous Confession Platform
- [Syna](https://github.com/Rexaintreal/syna) - Social Music App with Spotify
- [Apollo](https://github.com/Rexaintreal/Apollo) - Minimal Music Player with Dancing Cat
- [Eros](https://github.com/Rexaintreal/Eros) - Face Symmetry Analyzer
- [Notez](https://github.com/Rexaintreal/Notez) - Clean Android Notes App

---

## Author

Built by **Saurabh Tiwari**

- Portfolio: [saurabhcodesawfully.pythonanywhere.com](https://saurabhcodesawfully.pythonanywhere.com/)
- Email: [saurabhtiwari7986@gmail.com](mailto:saurabhtiwari7986@gmail.com)  
- Twitter: [@Saurabhcodes01](https://x.com/Saurabhcodes01)
- Instagram: [@saurabhcodesawfully](https://instagram.com/saurabhcodesawfully)
