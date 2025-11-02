// Physics constants
const PIVOT_RADIUS = 8;
const BOB_RADIUS = 20;

// State variables in SI UNIT ALSO THE ANGULAR THINGS ARE IN RADIAN/SEC REST METER KG AND SECOND
let angle = 30; 
let angleUnit = 'degrees';
let length = 2; 
let mass = 1;
let gravity = 9.8;
let damping = 0.999; 
let angularVelocity = 0;
let angularAcceleration = 0; 
let isAnimating = false;
let animationFrame = null;
let time = 0;

// Zoom and pan state
let zoom = 1;
let panX = 0;
let panY = 0;
let isPanning = false;
let lastMouseX = 0;
let lastMouseY = 0;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;

// Dragging state
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

let trail = [];
const MAX_TRAIL_LENGTH = 100;

// Loading screen
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
const angleSlider = document.getElementById('angle');
const angleDisplay = document.getElementById('angleDisplay');
const angleUnitSelect = document.getElementById('angleUnit');
const lengthInput = document.getElementById('length');
const massInput = document.getElementById('mass');
const gravityInput = document.getElementById('gravity');
const dampingInput = document.getElementById('damping');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const resetViewBtn = document.getElementById('resetViewBtn');
const zoomDisplay = document.getElementById('zoomDisplay');

//updating angle arc visualization
function updateAngleArc() {
    const angleRad = angle * Math.PI / 180;
    const radius = 28;
    const cx = 40;
    const cy = 40;
    
    //update angle line and account for negative angles too
    const endX = cx + radius * Math.sin(angleRad);
    const endY = cy + radius * Math.cos(angleRad);
    document.getElementById('anglePath').setAttribute('d', `M ${cx} ${cy} L ${endX} ${endY}`);
    
    // Update arc handle both positive and negative angles
    const absAngleRad = Math.abs(angleRad);
    const largeArc = absAngleRad > Math.PI ? 1 : 0;
    const sweepFlag = angle >= 0 ? 1 : 0;
    const arcPath = `M ${cx} ${cy + radius} A ${radius} ${radius} 0 ${largeArc} ${sweepFlag} ${endX} ${endY}`;
    document.getElementById('angleArcPath').setAttribute('d', arcPath);
}

function updateAngleDisplay() {
    const angleValue = parseFloat(angleSlider.value);
    if (angleUnitSelect.value === 'degrees') {
        angleDisplay.textContent = angleValue + '°';
        angle = angleValue;
    } else {
        const radians = (angleValue * Math.PI / 180).toFixed(3);
        angleDisplay.textContent = radians + ' rad';
        angle = angleValue;
    }
    updateAngleArc();
    calculatePhysics();
    draw();
}

angleSlider.addEventListener('input', updateAngleDisplay);
angleUnitSelect.addEventListener('change', updateAngleDisplay);

lengthInput.addEventListener('change', () => {
    length = parseFloat(lengthInput.value);
    calculatePhysics();
    draw();
});

massInput.addEventListener('change', () => {
    mass = parseFloat(massInput.value);
    calculatePhysics();
    draw();
});

gravityInput.addEventListener('change', () => {
    gravity = parseFloat(gravityInput.value);
    calculatePhysics();
    draw();
});

dampingInput.addEventListener('change', () => {
    damping = parseFloat(dampingInput.value);
});

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

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - panX) / zoom;
    const mouseY = (e.clientY - rect.top - panY) / zoom;
    
    const centerX = canvas.width / (2 * zoom);
    const centerY = canvas.height / (2 * zoom) - 50;
    
    // calculate bob position
    const angleRad = angle * Math.PI / 180;
    const scale = 50;
    const bobX = centerX + Math.sin(angleRad) * length * scale;
    const bobY = centerY + Math.cos(angleRad) * length * scale;
    
    // check if the user is clicking the bob
    const dist = Math.sqrt((mouseX - bobX) ** 2 + (mouseY - bobY) ** 2);
    if (dist < BOB_RADIUS) {
        isDragging = true;
        dragOffset = { x: mouseX - bobX, y: mouseY - bobY };
        canvas.style.cursor = 'grabbing';
        
        // stop the animation when dragging
        if (isAnimating) {
            isAnimating = false;
            cancelAnimationFrame(animationFrame);
            startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
        }
        return;
    }
    
    // otherwise pan
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
    const centerY = canvas.height / (2 * zoom) - 50;
    
    if (isDragging) {
        // Calculate angle from pivot to mouse
        const dx = mouseX - centerX;
        const dy = mouseY - centerY;
        const newAngle = Math.atan2(dx, dy) * 180 / Math.PI;
        
        // Update angle allow full 360 angles now
        angle = newAngle;
        angleSlider.value = angle;
        updateAngleDisplay();
        
        // reset the angular velocity when dragging
        angularVelocity = 0;
        trail = [];
        
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
        // Check if hovering over bob
        const angleRad = angle * Math.PI / 180;
        const scale = 50;
        const bobX = centerX + Math.sin(angleRad) * length * scale;
        const bobY = centerY + Math.cos(angleRad) * length * scale;
        
        const dist = Math.sqrt((mouseX - bobX) ** 2 + (mouseY - bobY) ** 2);
        canvas.style.cursor = dist < BOB_RADIUS ? 'grab' : (zoom > 1 ? 'grab' : 'crosshair');
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
    isPanning = false;
    canvas.style.cursor = zoom > 1 ? 'grab' : 'crosshair';
});

canvas.addEventListener('mouseleave', () => {
    isDragging = false;
    isPanning = false;
    canvas.style.cursor = 'crosshair';
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Calculate physisc
function calculatePhysics() {
    // time period =  2pi root L/g  for small angles
    const period = 2 * Math.PI * Math.sqrt(length / gravity);
    const frequency = 1 / period;
    
    // Current angle in the radians
    const angleRad = angle * Math.PI / 180;
    
    //PEat current angle
    const height = length - length * Math.cos(angleRad);
    const potentialEnergy = mass * gravity * height;
    
    //KE
    const kineticEnergy = 0.5 * mass * length * length * angularVelocity * angularVelocity;
    
    //TE
    const totalEnergy = potentialEnergy + kineticEnergy;
    
    //update stats on the page
    document.getElementById('period').textContent = period.toFixed(3) + ' s';
    document.getElementById('frequency').textContent = frequency.toFixed(3) + ' Hz';
    
    if (angleUnitSelect.value === 'degrees') {
        document.getElementById('currentAngle').textContent = angle.toFixed(1) + '°';
    } else {
        document.getElementById('currentAngle').textContent = (angle * Math.PI / 180).toFixed(3) + ' rad';
    }
    
    document.getElementById('angularVelocity').textContent = angularVelocity.toFixed(3) + ' rad/s';
    document.getElementById('energy').textContent = totalEnergy.toFixed(3) + ' J';
}

// Get theme colors
function getThemeColors() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    return {
        bg: isDark ? '#0a0a0a' : '#ffffff',
        gridLine: isDark ? '#ffffff08' : '#00000008',
        pivot: isDark ? '#ffffff' : '#000000',
        string: isDark ? '#ffffff' : '#000000',
        bob: isDark ? '#4dabf7' : '#1971c2',
        bobBorder: isDark ? '#339af0' : '#1864ab',
        trail: isDark ? '#4dabf780' : '#1971c280',
        text: isDark ? '#ffffff' : '#000000',
        textBg: isDark ? '#0a0a0acc' : '#ffffffcc',
        arc: isDark ? '#ffffff30' : '#00000030'
    };
}

// Draw function
function draw() {
    if (!canvas || !ctx) return;
    const colors = getThemeColors();
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);
    ctx.fillStyle = colors.bg;
    ctx.fillRect(-panX/zoom, -panY/zoom, canvas.width/zoom, canvas.height/zoom);
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
    const centerY = canvas.height / (2 * zoom) - 50;
    const scale = 50;
    ctx.strokeStyle = colors.arc;
    ctx.lineWidth = 2/zoom;
    ctx.setLineDash([10/zoom, 10/zoom]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, length * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    if (trail.length > 1) {
        ctx.strokeStyle = colors.trail;
        ctx.lineWidth = 3/zoom;
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) {
            ctx.lineTo(trail[i].x, trail[i].y);
        }
        ctx.stroke();
    }
    
    // calculating bob position
    const angleRad = angle * Math.PI / 180;
    const bobX = centerX + Math.sin(angleRad) * length * scale;
    const bobY = centerY + Math.cos(angleRad) * length * scale;
    ctx.strokeStyle = colors.string;
    ctx.lineWidth = 3/zoom;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(bobX, bobY);
    ctx.stroke();
    


    ctx.fillStyle = colors.pivot;
    ctx.beginPath();
    ctx.arc(centerX, centerY, PIVOT_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = colors.bobBorder;
    ctx.lineWidth = 2/zoom;
    ctx.stroke();
    
    ctx.fillStyle = colors.bob;
    ctx.beginPath();
    ctx.arc(bobX, bobY, BOB_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colors.bobBorder;
    ctx.lineWidth = 3/zoom;
    ctx.stroke();
    ctx.fillStyle = colors.text;
    ctx.font = `bold ${14/zoom}px Inter`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${mass}kg`, bobX, bobY);
    
    // Drawing length indicator
    const midX = centerX + Math.sin(angleRad) * length * scale / 2;
    const midY = centerY + Math.cos(angleRad) * length * scale / 2;
    
    ctx.fillStyle = colors.textBg;
    const labelWidth = 60;
    const labelHeight = 24;
    ctx.fillRect(midX - labelWidth/2, midY - labelHeight/2, labelWidth, labelHeight);
    
    ctx.strokeStyle = colors.text + '30';
    ctx.lineWidth = 1/zoom;
    ctx.strokeRect(midX - labelWidth/2, midY - labelHeight/2, labelWidth, labelHeight);
    
    ctx.fillStyle = colors.text;
    ctx.font = `bold ${12/zoom}px Inter`;
    ctx.fillText(`L = ${length}m`, midX, midY);
    
    ctx.restore();
}

// Animation
function animate() {
    if (!isAnimating) return;
    
    const dt = 0.016; // 60fps
    time += dt;
    
    // Convert angle to radians
    const angleRad = angle * Math.PI / 180;
    
    // Calculate angular acceleration angular acc  = -(g/L) * sin(θ)
    // This is the exact equation for a pendulum which can work with any angle
    angularAcceleration = -(gravity / length) * Math.sin(angleRad);
    
    // Update angular velocity: omega = omega + angular veloccity * dt
    angularVelocity += angularAcceleration * dt;
    
    if (damping < 1) {
        angularVelocity *= damping;
    }
    
    const angleRadNew = angleRad + angularVelocity * dt;
    angle = angleRadNew * (180 / Math.PI);
    
    while (angle > 180) angle -= 360;
    while (angle < -180) angle += 360;
    
    // Update slider
    angleSlider.value = angle;
    updateAngleDisplay();
    
    // Add to trail
    const centerX = canvas.width / (2 * zoom);
    const centerY = canvas.height / (2 * zoom) - 50;
    const scale = 50;
    const bobX = centerX + Math.sin(angleRadNew) * length * scale;
    const bobY = centerY + Math.cos(angleRadNew) * length * scale;
    
    trail.push({ x: bobX, y: bobY });
    if (trail.length > MAX_TRAIL_LENGTH) {
        trail.shift();
    }
    
    // stop the animation fi the velocity is almost zero or we are reaching equillibrium
    if (Math.abs(angularVelocity) < 0.01 && Math.abs(angle) < 1) {
        isAnimating = false;
        startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
        angularVelocity = 0;
        angle = 0;
        angleSlider.value = 0;
        updateAngleDisplay();
        trail = [];
    }
    
    calculatePhysics();
    draw();
    
    if (isAnimating) {
        animationFrame = requestAnimationFrame(animate);
    }
}

startBtn.addEventListener('click', () => {
    if (isAnimating) {
        isAnimating = false;
        cancelAnimationFrame(animationFrame);
        startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
    } else {
        const angleRad = angle * Math.PI / 180;
        angularVelocity = 0;
        trail = [];
        
        isAnimating = true;
        startBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        animate();
    }
});

resetBtn.addEventListener('click', () => {
    isAnimating = false;
    cancelAnimationFrame(animationFrame);
    
    angle = 30;
    angularVelocity = 0;
    time = 0;
    trail = [];
    
    angleSlider.value = 30;
    lengthInput.value = 2;
    massInput.value = 1;
    gravityInput.value = 9.8;
    dampingInput.value = 0.999;
    
    length = 2;
    mass = 1;
    gravity = 9.8;
    damping = 0.999;
    
    startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
    updateAngleDisplay();
    calculatePhysics();
    draw();
});

setTimeout(() => {
    updateAngleArc();
    calculatePhysics();
    updateZoomDisplay();
    draw();
}, 100);