// PHYSICS CONSTANTS           
const OBJECT_RADIUS = 25;

// state variables
let radius = 150;
let objects = [{
    id: 1,
    mass: 2,
    angle: 0,
    angularVelocity: 1,
    appliedForces: [],
    lastAngle: 0
}];
let selectedObject = 0;
let mode = 'tension'; // can be tension/vertical/centripetal/banked
let bankAngle = 30; 
let gravity = 9.8; 
let damping = 0.999; 
let isAnimating = false;
let animationFrame = null;
let time = 0;

// zoom and pan state variables
let zoom = 1;
let panX = 0;
let panY = 0;
let isPanning = false;
let lastMouseX = 0;
let lastMouseY = 0;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;

// dragging states
let draggedObject = null;
let draggedForce = null;
let dragOffset = { x: 0, y: 0 };

// trail effect
let trails = [[]];
const MAX_TRAIL_LENGTH = 100;

// Loading screen function just like other pages
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('loadingScreen').classList.add('hidden');
    }, 800);
});

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const wrapper = canvas.parentElement;
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
    draw();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Get controls from the page
const radiusSlider = document.getElementById('radiusSlider');
const radiusDisplay = document.getElementById('radiusDisplay');
const angularVelocitySlider = document.getElementById('angularVelocitySlider');
const angularVelocityDisplay = document.getElementById('angularVelocityDisplay');
const massInput = document.getElementById('mass');
const modeSelect = document.getElementById('modeSelect');
const bankAngleSlider = document.getElementById('bankAngleSlider');
const bankAngleDisplay = document.getElementById('bankAngleDisplay');
const bankAngleGroup = document.getElementById('bankAngleGroup');
const gravityInput = document.getElementById('gravity');
const dampingSlider = document.getElementById('dampingSlider');
const dampingDisplay = document.getElementById('dampingDisplay');
const addObjectBtn = document.getElementById('addObjectBtn');
const removeObjectBtn = document.getElementById('removeObjectBtn');
const addForceBtn = document.getElementById('addForceBtn');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const selectedObjectDisplay = document.getElementById('selectedObjectDisplay');

const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const resetViewBtn = document.getElementById('resetViewBtn');
const zoomDisplay = document.getElementById('zoomDisplay');

// Update displays 
function updateRadiusDisplay() {
    radius = parseFloat(radiusSlider.value);
    radiusDisplay.textContent = (radius / 50).toFixed(1) + ' m';
    calculatePhysics();
    draw();
}

function updateAngularVelocityDisplay() {
    const omega = parseFloat(angularVelocitySlider.value);
    angularVelocityDisplay.textContent = omega.toFixed(1) + ' rad/s';
    objects[selectedObject].angularVelocity = omega;
    calculatePhysics();
    draw();
}

function updateSelectedObjectDisplay() {
    if (selectedObjectDisplay) {
        selectedObjectDisplay.textContent = selectedObject + 1;
    }
}

function updateBankAngleDisplay() {
    bankAngle = parseFloat(bankAngleSlider.value);
    bankAngleDisplay.textContent = bankAngle + '°';
    draw();
}

function updateDampingDisplay() {
    damping = parseFloat(dampingSlider.value);
    dampingDisplay.textContent = damping.toFixed(3);
}

radiusSlider.addEventListener('input', updateRadiusDisplay);
angularVelocitySlider.addEventListener('input', updateAngularVelocityDisplay);
bankAngleSlider.addEventListener('input', updateBankAngleDisplay);
dampingSlider.addEventListener('input', updateDampingDisplay);

massInput.addEventListener('change', () => {
    objects[selectedObject].mass = parseFloat(massInput.value);
    calculatePhysics();
    draw();
});

modeSelect.addEventListener('change', () => {
    mode = modeSelect.value;
    // show or hide bank angle controls when changed
    if (mode === 'banked') {
        bankAngleGroup.style.display = 'block';
    } else {
        bankAngleGroup.style.display = 'none';
    }
    draw();
});

gravityInput.addEventListener('change', () => {
    gravity = parseFloat(gravityInput.value);
    calculatePhysics();
    draw();
});

addObjectBtn.addEventListener('click', () => {
    const angleOffset = (2 * Math.PI / (objects.length + 1));
    const newObject = {
        id: objects.length + 1,
        mass: 2,
        angle: objects.length * angleOffset,
        angularVelocity: 1,
        appliedForces: [],
        lastAngle: objects.length * angleOffset
    };
    objects.push(newObject);
    trails.push([]);
    selectedObject = objects.length - 1;
    massInput.value = objects[selectedObject].mass;
    angularVelocitySlider.value = objects[selectedObject].angularVelocity;
    updateAngularVelocityDisplay();
    updateSelectedObjectDisplay();
    updateForcesList();
    calculatePhysics();
    draw();
});

removeObjectBtn.addEventListener('click', () => {
    if (objects.length <= 1) {
        alert('Cannot remove the last object!');
        return;
    }
    
    objects.splice(selectedObject, 1);
    trails.splice(selectedObject, 1);
    
    // update the object ids
    objects.forEach((obj, index) => {
        obj.id = index + 1;
    });
    
    // adjust selected object by the user index
    if (selectedObject >= objects.length) {
        selectedObject = objects.length - 1;
    }
    
    massInput.value = objects[selectedObject].mass;
    angularVelocitySlider.value = objects[selectedObject].angularVelocity;
    updateAngularVelocityDisplay();
    updateSelectedObjectDisplay();
    updateForcesList();
    calculatePhysics();
    draw();
});

addForceBtn.addEventListener('click', () => {
    addForce();
});

startBtn.addEventListener('click', () => {
    if (isAnimating) {
        isAnimating = false;
        cancelAnimationFrame(animationFrame);
        startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
    } else {
        isAnimating = true;
        startBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        animate();
    }
});

resetBtn.addEventListener('click', () => {
    isAnimating = false;
    cancelAnimationFrame(animationFrame);
    
    objects.forEach((obj, index) => {
        const angleOffset = (2 * Math.PI / objects.length);
        obj.angle = index * angleOffset;
        obj.angularVelocity = 1;
        obj.lastAngle = obj.angle;
    });
    
    trails = objects.map(() => []);
    time = 0;
    
    startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
    angularVelocitySlider.value = objects[selectedObject].angularVelocity;
    updateAngularVelocityDisplay();
    calculatePhysics();
    draw();
});

// zooooooom functions
function updateZoomDisplay() {
    if (zoomDisplay) {
        zoomDisplay.textContent = `${Math.round(zoom * 100)}%`;
    }
}

function setZoom(newZoom, centerX, centerY) {
    const oldZoom = zoom;
    zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    
    if (centerX !== undefined && centerY !== undefined) {
        panX = centerX - (centerX - panX) * (zoom / oldZoom);
        panY = centerY - (centerY - panY) * (zoom / oldZoom);
    }
    
    updateZoomDisplay();
    draw();
}

function resetView() {
    zoom = 1;
    panX = 0;
    panY = 0;
    updateZoomDisplay();
    draw();
}

if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => setZoom(zoom * 1.2));
}

if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => setZoom(zoom / 1.2));
}

if (resetViewBtn) {
    resetViewBtn.addEventListener('click', resetView);
}

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(zoom * zoomFactor, mouseX, mouseY);
});

// force management funcitons
function addForce() {
    const forceId = Date.now();
    objects[selectedObject].appliedForces.push({
        id: forceId,
        magnitude: 20,
        angle: 0
    });
    updateForcesList();
    calculatePhysics();
    draw();
}

function removeForce(id) {
    objects[selectedObject].appliedForces = objects[selectedObject].appliedForces.filter(f => f.id !== id);
    updateForcesList();
    calculatePhysics();
    draw();
}

function updateForce(id, property, value) {
    const obj = objects[selectedObject];
    const force = obj.appliedForces.find(f => f.id === id);
    if (force) {
        force[property] = parseFloat(value);
        calculatePhysics();
        draw();
    }
}

function updateForcesList() {
    const forcesList = document.getElementById('forcesList');
    forcesList.innerHTML = '';
    
    const obj = objects[selectedObject];
    obj.appliedForces.forEach(force => {
        const forceItem = document.createElement('div');
        forceItem.className = 'force-item';
        forceItem.innerHTML = `
            <div class="force-header">
                <span class="force-label">Force ${obj.appliedForces.indexOf(force) + 1} (Object ${selectedObject + 1})</span>
                <button class="remove-force" onclick="removeForce(${force.id})">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
            <div class="force-input-group">
                <input type="number" value="${force.magnitude}" 
                       placeholder="Magnitude (N)" 
                       onchange="updateForce(${force.id}, 'magnitude', this.value)">
                <input type="number" value="${force.angle}" 
                       placeholder="Angle (°)" 
                       onchange="updateForce(${force.id}, 'angle', this.value)">
            </div>
        `;
        forcesList.appendChild(forceItem);
    });
}

// make functions global
window.removeForce = removeForce;
window.updateForce = updateForce;

// mouse interactions by the user 
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - panX) / zoom;
    const mouseY = (e.clientY - rect.top - panY) / zoom;
    
    const centerX = canvas.width / (2 * zoom);
    const centerY = canvas.height / (2 * zoom);
    
    // check if the user is clicking on a force vector first
    for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        const objX = centerX + Math.cos(obj.angle) * radius;
        const objY = centerY + Math.sin(obj.angle) * radius;
        
        for (let j = 0; j < obj.appliedForces.length; j++) {
            const force = obj.appliedForces[j];
            const forceAngleRad = force.angle * Math.PI / 180;
            const forceScale = 3;
            const forceEndX = objX+ Math.cos(forceAngleRad) * force.magnitude * forceScale;
            const forceEndY = objY - Math.sin(forceAngleRad) * force.magnitude * forceScale;
            
            const dist = Math.sqrt((mouseX - forceEndX) ** 2 + (mouseY - forceEndY) ** 2);
            if (dist < 15) {
                selectedObject = i;
                massInput.value = objects[selectedObject].mass;
                angularVelocitySlider.value = objects[selectedObject].angularVelocity;
                updateAngularVelocityDisplay();
                updateSelectedObjectDisplay();
                updateForcesList();
                draggedForce = j;
                dragOffset = { x: mouseX - forceEndX, y: mouseY - forceEndY };
                canvas.style.cursor = 'grabbing';
                return;
            }
        }
    }
    
    // check if the user is clicking on any object
    for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        const objX = centerX + Math.cos(obj.angle) * radius;
        const objY = centerY + Math.sin(obj.angle) * radius;
        
        const dist = Math.sqrt((mouseX - objX) ** 2 + (mouseY - objY) ** 2);
        if (dist < OBJECT_RADIUS) {
            selectedObject = i;
            massInput.value = objects[selectedObject].mass;
            angularVelocitySlider.value = objects[selectedObject].angularVelocity;
            updateAngularVelocityDisplay();
            updateSelectedObjectDisplay();
            updateForcesList();
            draggedObject = i;
            dragOffset = {
                x: mouseX - objX,
                y: mouseY - objY
            };
            canvas.style.cursor = 'grabbing';
            draw();
            return;
        }
    }
    
    if (e.button === 2 || e.button === 0) {
        e.preventDefault();
        isPanning = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        canvas.style.cursor = 'grabbing';
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - panX) / zoom;
    const mouseY = (e.clientY - rect.top - panY) / zoom;
    
    const centerX = canvas.width / (2 * zoom);
    const centerY = canvas.height / (2 * zoom);
    
    if (draggedForce !== null) {
        const obj = objects[selectedObject];
        const objX = centerX + Math.cos(obj.angle) * radius;
        const objY = centerY + Math.sin(obj.angle) * radius;        
        const dx = mouseX - objX;
        const dy = objY - mouseY;        
        const magnitude = Math.sqrt(dx * dx + dy * dy) / 3;
        const forceAngle = Math.atan2(dy, dx) * 180 / Math.PI;        
        obj.appliedForces[draggedForce].magnitude = Math.max(0, Math.round(magnitude * 10) / 10);
        obj.appliedForces[draggedForce].angle = Math.round(forceAngle);        
        updateForcesList();
        calculatePhysics();
        draw();
    } else if (draggedObject !== null) {
        // convert mouse position to angle on circle
        const dx = mouseX - centerX;
        const dy = mouseY - centerY;
        const newAngle = Math.atan2(dy, dx);
        
        objects[draggedObject].angle = newAngle;
        trails[draggedObject] = [];
        
        calculatePhysics();
        draw();
    } else if (isPanning) {
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        panX += dx;
        panY += dy;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        draw();
    } else {
        let overForce = false;
        let overObject = false;
        
        // check objects
        for (let obj of objects) {
            const objX = centerX + Math.cos(obj.angle) * radius;
            const objY = centerY + Math.sin(obj.angle) * radius;
            
            const dist = Math.sqrt((mouseX - objX) ** 2 + (mouseY - objY) ** 2);
            if (dist < OBJECT_RADIUS) {
                overObject = true;
                break;
            }
        }
        
        //check forecs
        for (let obj of objects) {
            const objX = centerX + Math.cos(obj.angle) * radius;
            const objY = centerY + Math.sin(obj.angle) * radius;
            
            for (let force of obj.appliedForces) {
                const forceAngleRad = force.angle * Math.PI / 180;
                const forceScale = 3;
                const forceEndX = objX + Math.cos(forceAngleRad) * force.magnitude * forceScale;
                const forceEndY = objY - Math.sin(forceAngleRad) * force.magnitude * forceScale;
                
                const dist = Math.sqrt((mouseX - forceEndX) ** 2 + (mouseY - forceEndY) ** 2);
                if (dist < 15) {
                    overForce = true;
                    break;
                }
            }
            if (overForce) break;
        }
        
        canvas.style.cursor = overForce ? 'grab' : (overObject ? 'grab' : (zoom > 1 ? 'grab' : 'crosshair'));
    }
});

canvas.addEventListener('mouseup', () => {
    isPanning = false;
    draggedObject = null;
    draggedForce = null;
    canvas.style.cursor = zoom > 1 ? 'grab' : 'crosshair';
});

canvas.addEventListener('mouseleave', () => {
    isPanning = false;
    draggedObject = null;
    draggedForce = null;
    canvas.style.cursor = 'crosshair';
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// calculate PHYZIKS
function calculatePhysics() {
    const obj = objects[selectedObject];
    const omega = obj.angularVelocity;
    const r = radius / 50; 
    
    // tangential velocity formula v = omega * radius
    const tangentialVelocity = Math.abs(omega * r);
    
    // centripetal acceleration formula acc = omega square * radius = velocity square/radius
    const centripetalAccel = omega * omega * r;
    
    // centripetal force formula  F= mass into centrepetal acc = mass * omega square * radius
    const centripetalForce = obj.mass * Math.abs(centripetalAccel);
    
    // calculate tension based on mode
    let tension = 0;
    
    if (mode === 'tension') {
        // horizontal circle Tension = Forcecntripetal
        tension = centripetalForce;
    } else if (mode === 'vertical') {
        // vertical cirlce tension varies with position
        const angleFromTop = obj.angle - Math.PI / 2; // 0 at the top pi at bottom
        /*
        at the top Tension = mass into velocity square/radius - mg (minimum)
        at the bottom Tension = mass into velocity square/radius + mg (maximum)
        at the sides Tension = mass into velocity sqiare/radius
        */
        const weightComponent = obj.mass * gravity * Math.cos(angleFromTop);
        tension = centripetalForce + weightComponent;
        // tension cant be negative or the string would go slack
        if (tension < 0) tension = 0;
    } else if (mode === 'banked') {
        // banked curve calculate normal force and required speed
        const bankRad = bankAngle * Math.PI / 180;
        const normalForce = (obj.mass * gravity) / Math.cos(bankRad);
        tension = normalForce;
    }
    
    // Period T = 2PI/omega
    const period = omega !== 0 ? Math.abs(2 * Math.PI / omega) : 0;
    
    // Frequency f = 1/T = omega/2PI
    const frequency = omega !== 0 ? Math.abs(omega / (2 * Math.PI)) : 0;
    
    // Kinetic energy KE = 1/2mvsquare
    const kineticEnergy = 0.5 * obj.mass * tangentialVelocity * tangentialVelocity;
    
    // Potential energy for vertical mode
    let potentialEnergy = 0;
    if (mode === 'vertical') {
        // Height relative to center h = r*sintheta
        const height = r * Math.sin(obj.angle - Math.PI / 2);
        potentialEnergy = obj.mass * gravity * height;
    }
    
    // update stats
    document.getElementById('omega').textContent = omega.toFixed(2) + ' rad/s';
    document.getElementById('tangentialVelocity').textContent = tangentialVelocity.toFixed(2) + ' m/s';
    document.getElementById('centripetalForce').textContent = centripetalForce.toFixed(2) + ' N';
    document.getElementById('centripetalAccel').textContent = Math.abs(centripetalAccel).toFixed(2) + ' m/s²';
    document.getElementById('tension').textContent = tension.toFixed(2) + ' N';
    document.getElementById('period').textContent = period.toFixed(2) + ' s';
    document.getElementById('frequency').textContent = frequency.toFixed(2) + ' Hz';
    document.getElementById('kineticEnergy').textContent = kineticEnergy.toFixed(2) + ' J';
    document.getElementById('potentialEnergy').textContent = potentialEnergy.toFixed(2) + ' J';
    
    // warning for vertical loop
    if (mode === 'vertical') {
        const minSpeed = Math.sqrt(gravity * r);
        if (tangentialVelocity < minSpeed && Math.abs(obj.angle - Math.PI / 2) < 0.5) {
            // near top and too slow the ball (object) might fall
        }
    }
}

// Get theme colors
function getThemeColors() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    return {
        bg: isDark ? '#0a0a0a' : '#ffffff',
        gridLine: isDark ? '#ffffff08' : '#00000008',
        circle: isDark ? '#ffffff20' : '#00000020',
        circleBorder: isDark ? '#ffffff40' : '#00000040',
        object: isDark ? '#4dabf7' : '#1971c2',
        objectBorder: isDark ? '#339af0' : '#1864ab',
        string: isDark ? '#ffffff60' : '#00000060',
        text: isDark ? '#ffffff' : '#000000',
        textBg: isDark ? '#0a0a0acc' : '#ffffffcc',
        centripetal: '#ff6b6b',
        tangential: '#51cf66',
        weight: '#ff6b6b',
        normal: '#4dabf7',
        applied: '#ffd43b',
        trail: isDark ? '#4dabf780' : '#1971c280',
        warning: '#ff6b6b60'
    };
}

// drawing canvas functions
function draw() {
    if (!canvas || !ctx) return;
    
    const colors = getThemeColors();
    
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);
    
    // Clear the canvas
    ctx.fillStyle = colors.bg;
    ctx.fillRect(-panX/zoom, -panY/zoom, canvas.width/zoom, canvas.height/zoom);
    
    // Draw grid
    ctx.strokeStyle = colors.gridLine;
    ctx.lineWidth = 1/zoom;
    const gridSize = 30;
    
    const startX = Math.floor(-panX/zoom / gridSize) * gridSize;
    const endX = Math.ceil((canvas.width - panX)/zoom / gridSize) * gridSize;
    const startY = Math.floor(-panY/zoom / gridSize) * gridSize;
    const endY = Math.ceil((canvas.height - panY)/zoom / gridSize) * gridSize;
    
    for (let x = startX; x < endX; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, -panY/zoom);
        ctx.lineTo(x, (canvas.height - panY)/zoom);
        ctx.stroke();
    }
    
    for (let y = startY; y < endY; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(-panX/zoom, y);
        ctx.lineTo((canvas.width - panX)/zoom, y);
        ctx.stroke();
    }
    
    const centerX = canvas.width / (2 * zoom);
    const centerY = canvas.height / (2 * zoom);
    
    // Draw circular path
    ctx.strokeStyle = colors.circleBorder;
    ctx.lineWidth = 2/zoom;
    ctx.setLineDash([10/zoom, 10/zoom]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw center point
    ctx.fillStyle = colors.text;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw trails
    objects.forEach((obj, index) => {
        if (trails[index] && trails[index].length > 1) {
            ctx.strokeStyle = colors.trail;
            ctx.lineWidth = 2/zoom;
            ctx.beginPath();
            ctx.moveTo(trails[index][0].x, trails[index][0].y);
            for (let i = 1; i < trails[index].length; i++) {
                ctx.lineTo(trails[index][i].x, trails[index][i].y);
            }
            ctx.stroke();
        }
    });
    
    // Draw objects
    objects.forEach((obj, index) => {
        const objX = centerX + Math.cos(obj.angle) * radius;
        const objY = centerY + Math.sin(obj.angle) * radius;
        
        // Draw string/radius line
        if (mode === 'tension' || mode === 'vertical') {
            // Color code tension on the object
            const r = radius / 50;
            const centripetalForce = obj.mass * obj.angularVelocity * obj.angularVelocity * r;
            let tension = centripetalForce;
            
            if (mode === 'vertical') {
                const angleFromTop = obj.angle - Math.PI / 2;
                const weightComponent = obj.mass * gravity * Math.cos(angleFromTop);
                tension = centripetalForce + weightComponent;
            }
            
            // Color based on tension red means high and blue means low
            const tensionRatio = Math.min(1, Math.abs(tension) / 100);
            const stringColor = tension < 0 ? colors.warning : 
                `rgb(${Math.floor(75 + tensionRatio * 180)}, ${Math.floor(171 - tensionRatio * 50)}, ${Math.floor(247 - tensionRatio * 180)})`;
            
            ctx.strokeStyle = tension < 0 ? colors.warning : colors.string;
            ctx.lineWidth = (2 + Math.abs(tension) / 50)/zoom;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(objX, objY);
            ctx.stroke();
            
            // Draw tension warning if negative
            if (tension < 0) {
                ctx.strokeStyle = colors.warning;
                ctx.lineWidth = 3/zoom;
                ctx.setLineDash([10/zoom, 5/zoom]);
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(objX, objY);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
        
        // darw bank angle indicator for banked mode
        if (mode === 'banked') {
            const bankRad = bankAngle * Math.PI / 180;
            const bankIndicatorLength = 40;
            
            ctx.strokeStyle = colors.normal;
            ctx.lineWidth = 2/zoom;
            ctx.beginPath();
            ctx.moveTo(objX, objY);
            ctx.lineTo(objX, objY - bankIndicatorLength * Math.cos(bankRad));
            ctx.stroke();
        }
        
        // highlight the selectedo bject
        if (index === selectedObject) {
            ctx.strokeStyle = colors.applied;
            ctx.lineWidth = 4/zoom;
            ctx.beginPath();
            ctx.arc(objX, objY, OBJECT_RADIUS + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw object
        ctx.fillStyle = colors.object;
        ctx.beginPath();
        ctx.arc(objX, objY, OBJECT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = colors.objectBorder;
        ctx.lineWidth = 3/zoom;
        ctx.stroke();
        
        // Draw mass label
        ctx.fillStyle = colors.text;
        ctx.font = `bold ${14/zoom}px Inter`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${obj.mass}kg`, objX, objY);
        
        // Draw object number
        ctx.font = `bold ${10/zoom}px Inter`;
        ctx.fillStyle = colors.objectBorder;
        ctx.fillText(`#${index + 1}`, objX, objY + 18);
        
        // Draw velocity vector which is tanget to circle
        const tangentAngle = obj.angle + (obj.angularVelocity >= 0 ? Math.PI / 2 : -Math.PI / 2);
        const velocityScale = 20;
        const velEndX = objX + Math.cos(tangentAngle) * Math.abs(obj.angularVelocity) * velocityScale;
        const velEndY = objY + Math.sin(tangentAngle) * Math.abs(obj.angularVelocity) * velocityScale;
        drawArrow(ctx, objX, objY, velEndX, velEndY, colors.tangential, 'v', zoom);
        
        // Draw gravity vector for vertical mode
        if (mode === 'vertical') {
            const gravityScale = 5;
            const gravEndY = objY + obj.mass * gravity * gravityScale;
            drawArrow(ctx, objX, objY, objX, gravEndY, colors.weight, 'mg', zoom);
        }
        
        // Draw applied forces
        obj.appliedForces.forEach((force, fIndex) => {
            const forceAngleRad = force.angle * Math.PI / 180;
            const forceScale = 3;
            const forceEndX = objX + Math.cos(forceAngleRad) * force.magnitude * forceScale;
            const forceEndY = objY - Math.sin(forceAngleRad) * force.magnitude * forceScale;
            drawArrow(ctx, objX, objY, forceEndX, forceEndY, colors.applied, `F${fIndex + 1}`, zoom);
        });
    });
    
    // Draw force vectors for selected object
    const selectedObj = objects[selectedObject];
    const objX = centerX + Math.cos(selectedObj.angle) * radius;
    const objY = centerY + Math.sin(selectedObj.angle) * radius;
    
    // Centripetal force pointing towards center
    const centripetalMag = selectedObj.mass * selectedObj.angularVelocity * selectedObj.angularVelocity * (radius / 50);
    const centripetalScale = 0.5;
    const cpEndX = objX + (centerX - objX) / radius * centripetalMag * centripetalScale;
    const cpEndY = objY + (centerY - objY) / radius * centripetalMag * centripetalScale;
    drawArrow(ctx, objX, objY, cpEndX, cpEndY, colors.centripetal, 'Fc', zoom);
    
    ctx.restore();
}

// Draw arrow helper
function drawArrow(ctx, x1, y1, x2, y2, color, label, zoom) {
    const headLength = 12;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3/zoom;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.font = `bold ${14/zoom}px Inter`;
    ctx.fillStyle = color;
    ctx.fillText(label, x2 + 10, y2 - 10);
}

// animation funcitons
function animate() {
    if (!isAnimating) return;
    const dt = 0.016;
    time += dt;
    objects.forEach((obj, index) => {
        const r = radius / 50;
        obj.lastAngle = obj.angle;
        let totalTorque = 0;
        obj.appliedForces.forEach(force => {
            const forceAngleRad = force.angle * Math.PI / 180;
            const tangentAngle = obj.angle + Math.PI / 2;
            const tangentialComponent = force.magnitude * Math.cos(forceAngleRad - tangentAngle);
            // Torque = radius * force tangential
            totalTorque += r * tangentialComponent;
        });
        
        // add gravity effects for vertical circle
        if (mode === 'vertical') {
            // gravity creates a torque trying to pull object down
            // and torque from gravity = m*g*r*sin(angle from vertical)
            const angleFromVertical = obj.angle;
            const gravityTorque = -obj.mass * gravity * r * Math.sin(angleFromVertical);
            totalTorque += gravityTorque;    
            // check if string would go slack at top
            const minSpeedSquared = gravity * r;
            const currentSpeedSquared = (obj.angularVelocity * r) ** 2;
            // At top of circle the angle can be -90 degrees or 270 degrees
            const angleFromTop = Math.abs(((obj.angle - Math.PI/2) % (2 * Math.PI)));
            if (angleFromTop < 0.5 && currentSpeedSquared < minSpeedSquared) {
                // if the string slacks object falls
                const angleFromVertical = obj.angle + Math.PI / 2;
                obj.angularVelocity = 0;
                // apply gravity to the object as torque will make it fall wait idk what
                totalTorque = -obj.mass * gravity * r * Math.sin(angleFromVertical) * 2;
            }
        }
        
        // Angular acceleration alpha = torque / moment of inertia where moment of inertia = mass into radius square
        const momentOfInertia = obj.mass * r * r;
        const angularAccel = totalTorque / momentOfInertia;
        
        // update angular velocity with damping/air resistance
        obj.angularVelocity += angularAccel * dt;
        obj.angularVelocity *= damping;
        // Update angles
        obj.angle += obj.angularVelocity * dt;
        
        // Normalize angles
        while (obj.angle > Math.PI * 2) obj.angle -= Math.PI * 2;
        while (obj.angle < -Math.PI * 2) obj.angle += Math.PI * 2;
        const centerX = canvas.width / (2 * zoom);
        const centerY = canvas.height / (2 * zoom);
        const objX = centerX + Math.cos(obj.angle) * radius;
        const objY = centerY + Math.sin(obj.angle) * radius;
        
        if (!trails[index]) trails[index] = [];
        trails[index].push({ x: objX, y: objY });
        if (trails[index].length > MAX_TRAIL_LENGTH) {
            trails[index].shift();
        }
    });
    angularVelocitySlider.value = objects[selectedObject].angularVelocity.toFixed(1);
    updateAngularVelocityDisplay();
    
    calculatePhysics();
    draw();
    
    if (isAnimating) {
        animationFrame = requestAnimationFrame(animate);
    }
}

// Initial setup
setTimeout(() => {
    updateRadiusDisplay();
    updateAngularVelocityDisplay();
    updateBankAngleDisplay();
    updateDampingDisplay();
    updateSelectedObjectDisplay();
    calculatePhysics();
    updateZoomDisplay();
    updateForcesList();
    draw();
}, 100);