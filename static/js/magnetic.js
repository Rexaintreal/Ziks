//const
const MAGNET_WIDTH = 40;
const MAGNET_HEIGHT = 60;
const COIL_RESISTANCE = 10; // Ohms

//vars
let magnetStrength = 2; // Tesla
let coilTurns = 10;
let coilRadius = 50; 
let magnetPosition = 0; // x position
let magnetVelocity = 0; 
let motionMode = 'manual';
let isAnimating = false;
let animationFrame = null;
let time = 0;
let oscillateTime = 0;
let zoom = 1;
let panX = 0;
let panY = 0;
let isPanning = false;
let lastMouseX = 0;
let lastMouseY = 0;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
let isDraggingMagnet = false;
let dragOffset = { x: 0, y: 0 };
let lastMagnetPosition = 0;
let positionHistory = [];
let emfHistory = [];
const MAX_HISTORY = 150;

window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('loadingScreen').classList.add('hidden');
    }, 800);
});

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const graphCanvas = document.getElementById('graphCanvas');
const graphCtx = graphCanvas.getContext('2d');

function resizeCanvas() {
    const wrapper = canvas.parentElement;
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
    draw();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
const magnetStrengthSlider = document.getElementById('magnetStrength');
const magnetStrengthDisplay = document.getElementById('magnetStrengthDisplay');
const coilTurnsSlider = document.getElementById('coilTurns');
const coilTurnsDisplay = document.getElementById('coilTurnsDisplay');
const coilRadiusSlider = document.getElementById('coilRadius');
const coilRadiusDisplay = document.getElementById('coilRadiusDisplay');
const magnetVelocityInput = document.getElementById('magnetVelocity');
const motionModeSelect = document.getElementById('motionMode');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const resetViewBtn = document.getElementById('resetViewBtn');
const zoomDisplay = document.getElementById('zoomDisplay');

function updateMagnetStrengthDisplay() {
    magnetStrength = parseFloat(magnetStrengthSlider.value);
    magnetStrengthDisplay.textContent = magnetStrength.toFixed(1) + ' T';
    calculatePhysics();
}

function updateCoilTurnsDisplay() {
    coilTurns = parseInt(coilTurnsSlider.value);
    coilTurnsDisplay.textContent = coilTurns;
    calculatePhysics();
    draw();
}

function updateCoilRadiusDisplay() {
    coilRadius = parseInt(coilRadiusSlider.value);
    coilRadiusDisplay.textContent = (coilRadius / 10).toFixed(1) + ' cm';
    calculatePhysics();
    draw();
}

magnetStrengthSlider.addEventListener('input', updateMagnetStrengthDisplay);
coilTurnsSlider.addEventListener('input', updateCoilTurnsDisplay);
coilRadiusSlider.addEventListener('input', updateCoilRadiusDisplay);

magnetVelocityInput.addEventListener('change', () => {
    magnetVelocity = parseFloat(magnetVelocityInput.value);
});

motionModeSelect.addEventListener('change', () => {
    motionMode = motionModeSelect.value;
    if (motionMode !== 'manual') {
        isDraggingMagnet = false;
    }
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
    magnetPosition = 0;
    magnetVelocity = 0;
    time = 0;
    oscillateTime = 0;
    emfHistory = [];
    positionHistory = [];
    startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
    calculatePhysics();
    drawGraph();
    draw();
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

if (zoomInBtn) zoomInBtn.addEventListener('click', () => setZoom(zoom * 1.2));
if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => setZoom(zoom / 1.2));
if (resetViewBtn) resetViewBtn.addEventListener('click', resetView);

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
    const centerY = canvas.height / (2 * zoom);
    
    const magnetX = centerX + magnetPosition;
    const magnetY = centerY;
    
    if (motionMode === 'manual' &&
        mouseX >= magnetX - MAGNET_WIDTH/2 && mouseX <= magnetX + MAGNET_WIDTH/2 &&
        mouseY >= magnetY - MAGNET_HEIGHT/2 && mouseY <= magnetY + MAGNET_HEIGHT/2) {
        isDraggingMagnet = true;
        dragOffset = { x: mouseX - magnetX, y: 0 };
        lastMagnetPosition = magnetPosition;
        canvas.style.cursor = 'grabbing';
        return;
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
    
    if (isDraggingMagnet) {
        const newPosition = mouseX - centerX - dragOffset.x;
        
        positionHistory.push({ pos: newPosition, time: Date.now() });
        if (positionHistory.length > 5) positionHistory.shift();
        
        if (positionHistory.length >= 2) {
            const recent = positionHistory[positionHistory.length - 1];
            const old = positionHistory[0];
            const dt = (recent.time - old.time) / 1000;
            if (dt > 0) {
                magnetVelocity = (recent.pos - old.pos) / dt / 100; 
            }
        }
        
        magnetPosition = newPosition;
        lastMagnetPosition = magnetPosition;
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
        const centerY = canvas.height / (2 * zoom);
        const magnetX = centerX + magnetPosition;
        const magnetY = centerY;
        
        if (mouseX >= magnetX - MAGNET_WIDTH/2 && mouseX <= magnetX + MAGNET_WIDTH/2 &&
            mouseY >= magnetY - MAGNET_HEIGHT/2 && mouseY <= magnetY + MAGNET_HEIGHT/2) {
            canvas.style.cursor = 'grab';
        } else {
            canvas.style.cursor = zoom > 1 ? 'grab' : 'crosshair';
        }
    }
});

canvas.addEventListener('mouseup', () => {
    isPanning = false;
    if (isDraggingMagnet) {
        positionHistory = [];
    }
    isDraggingMagnet = false;
    canvas.style.cursor = zoom > 1 ? 'grab' : 'crosshair';
});

canvas.addEventListener('mouseleave', () => {
    isPanning = false;
    isDraggingMagnet = false;
    positionHistory = [];
    canvas.style.cursor = 'crosshair';
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// physics Faradays Law
function calculatePhysics() {
    // Convert units
    const r = coilRadius / 100; // to meters
    const Area = Math.PI * r * r; // m²
    
    // Distance from magnet to coil center (coil is at x=0)
    const distance = Math.abs(magnetPosition / 100);
    
    // Magnetic field through coil (approximation decreases with distance)
    // Bcoil = Bmagnet * (rmagnet / distance)^3 for distance >> r_magnet
    // Simplified model: B = Btheta * r^2 / (r^2 + d^2)^(3/2)
    const d = distance;
    const effectiveB = magnetStrength * Math.pow(r, 2) / Math.pow(r * r + d * d, 1.5);
    
    const signedB = magnetPosition < 0 ? -effectiveB : effectiveB;
    
    // Magnetic flux phi = B·A
    const flux = signedB * Area;
    
    // Rate of change of flux dPhi/dt
    // If moving dphi/dt ≈ (deltaB/deltax) * (dx/dt) * A
    const velocity_m_per_s = magnetVelocity; 
    
    // Numerical derivative approach
    const dx = 0.01; // small displacement in meters
    const d1 = Math.abs((magnetPosition / 100) + dx);
    const d2 = Math.abs((magnetPosition / 100) - dx);
    
    const B1 = magnetStrength * Math.pow(r, 2) / Math.pow(r * r + d1 * d1, 1.5);
    const B2 = magnetStrength * Math.pow(r, 2) / Math.pow(r * r + d2 * d2, 1.5);
    
    const dBdx = (B2 - B1) / (2 * dx);
    const fluxRate = dBdx * velocity_m_per_s * Area * (magnetPosition < 0 ? -1 : 1);
    
    // Induced EMF epsilon = -N * dphi/dt Faradays Law
    const emf = -coilTurns * fluxRate;
    
    // Induced current I = epsilon / R Ohms Law
    const current = emf / COIL_RESISTANCE;
    

    document.getElementById('emf').textContent = emf.toFixed(2) + ' V';
    document.getElementById('flux').textContent = (flux * 1000).toFixed(2) + ' mWb';
    document.getElementById('fluxRate').textContent = fluxRate.toFixed(4) + ' Wb/s';
    document.getElementById('current').textContent = (current * 1000).toFixed(2) + ' mA';
    document.getElementById('position').textContent = (magnetPosition / 10).toFixed(1) + ' cm';
    

    emfHistory.push({ time: time, emf: emf });
    if (emfHistory.length > MAX_HISTORY) {
        emfHistory.shift();
    }
    
    return { emf, flux, fluxRate, current };
}


function getThemeColors() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    return {
        bg: isDark ? '#0a0a0a' : '#ffffff',
        gridLine: isDark ? '#ffffff08' : '#00000008',
        coil: isDark ? '#ffd43b' : '#f59f00',
        coilWire: isDark ? '#fab005' : '#e67700',
        magnetNorth: '#ff6b6b',
        magnetSouth: '#4dabf7',
        fieldLine: isDark ? '#51cf6680' : '#37b24d80',
        current: isDark ? '#ff8787' : '#ff6b6b',
        text: isDark ? '#ffffff' : '#000000',
        textBg: isDark ? '#0a0a0acc' : '#ffffffcc',
        graphLine: '#4dabf7',
        graphGrid: isDark ? '#ffffff20' : '#00000020'
    };
}


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
    const centerY = canvas.height / (2 * zoom);
    
    const magnetX = centerX + magnetPosition;
    const magnetY = centerY;
    
    ctx.strokeStyle = colors.fieldLine;
    ctx.lineWidth = 2/zoom;
    
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
        ctx.beginPath();
        ctx.moveTo(magnetX, magnetY);
        const fieldLength = 80;
        const curveAmount = 30;
        const endX = magnetX + Math.cos(angle) * fieldLength;
        const endY = magnetY + Math.sin(angle) * fieldLength;
        const cpX = magnetX + Math.cos(angle) * fieldLength/2 + Math.cos(angle + Math.PI/2) * curveAmount;
        const cpY = magnetY + Math.sin(angle) * fieldLength/2 + Math.sin(angle + Math.PI/2) * curveAmount;
        ctx.quadraticCurveTo(cpX, cpY, endX, endY);
        ctx.stroke();
    }
    
    const coilX = centerX;
    const coilY = centerY;
    
    for (let i = 0; i < coilTurns; i++) {
        const offset = (i - coilTurns/2) * 3;
        
        ctx.strokeStyle = colors.coilWire;
        ctx.lineWidth = 3/zoom;
        ctx.beginPath();
        ctx.arc(coilX + offset, coilY, coilRadius, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    ctx.strokeStyle = colors.coilWire;
    ctx.lineWidth = 4/zoom;
    ctx.beginPath();
    ctx.moveTo(coilX, coilY - coilRadius - 20);
    ctx.lineTo(coilX, coilY - coilRadius - 40);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(coilX, coilY + coilRadius + 20);
    ctx.lineTo(coilX, coilY + coilRadius + 40);
    ctx.stroke();
    

    const physics = calculatePhysics();
    if (Math.abs(physics.current) > 0.001) {
        const currentDirection = physics.current > 0 ? 1 : -1;
        

        const flowSpeed = Math.abs(physics.current) * 10;
        const flowOffset = (time * flowSpeed) % 20;
        
        ctx.strokeStyle = colors.current;
        ctx.lineWidth = 3/zoom;
        ctx.setLineDash([10/zoom, 10/zoom]);
        ctx.lineDashOffset = flowOffset * currentDirection;
        
        ctx.beginPath();
        ctx.moveTo(coilX, coilY - coilRadius - 20);
        ctx.lineTo(coilX, coilY - coilRadius - 40);
        ctx.stroke();
        
        ctx.setLineDash([]);
        
        // Arrow showing current direction
        const arrowY = coilY - coilRadius - 30;
        drawArrow(ctx, coilX - 15, arrowY, coilX - 15, arrowY - 10 * currentDirection, colors.current, zoom);
    }
    
    // Draw magnet
    ctx.save();
    ctx.translate(magnetX, magnetY);
    
    // North pole (red)
    ctx.fillStyle = colors.magnetNorth;
    ctx.fillRect(-MAGNET_WIDTH/2, -MAGNET_HEIGHT/2, MAGNET_WIDTH, MAGNET_HEIGHT/2);
    ctx.strokeStyle = colors.text;
    ctx.lineWidth = 2/zoom;
    ctx.strokeRect(-MAGNET_WIDTH/2, -MAGNET_HEIGHT/2, MAGNET_WIDTH, MAGNET_HEIGHT/2);
    
    // South pole (blue)
    ctx.fillStyle = colors.magnetSouth;
    ctx.fillRect(-MAGNET_WIDTH/2, 0, MAGNET_WIDTH, MAGNET_HEIGHT/2);
    ctx.strokeRect(-MAGNET_WIDTH/2, 0, MAGNET_WIDTH, MAGNET_HEIGHT/2);
    

    ctx.fillStyle = colors.text;
    ctx.font = `bold ${16/zoom}px Inter`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', 0, -MAGNET_HEIGHT/4);
    ctx.fillText('S', 0, MAGNET_HEIGHT/4);
    
    ctx.restore();
    

    if (Math.abs(magnetVelocity) > 0.1) {
        const arrowLength = Math.min(Math.abs(magnetVelocity) * 30, 100);
        const arrowDir = magnetVelocity > 0 ? 1 : -1;
        drawArrow(ctx, magnetX, magnetY - MAGNET_HEIGHT/2 - 20, 
                 magnetX + arrowLength * arrowDir, magnetY - MAGNET_HEIGHT/2 - 20, 
                 colors.text, zoom);
        
        ctx.fillStyle = colors.textBg;
        ctx.fillRect(magnetX - 30, magnetY - MAGNET_HEIGHT/2 - 40, 60, 20);
        ctx.fillStyle = colors.text;
        ctx.font = `${12/zoom}px Inter`;
        ctx.textAlign = 'center';
        ctx.fillText(`v=${magnetVelocity.toFixed(1)} m/s`, magnetX, magnetY - MAGNET_HEIGHT/2 - 30);
    }
    
    ctx.restore();
}


function drawArrow(ctx, x1, y1, x2, y2, color, zoom) {
    const headLength = 10;
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
}


function drawGraph() {
    if (!graphCanvas || !graphCtx) return;
    
    const colors = getThemeColors();
    const width = graphCanvas.width;
    const height = graphCanvas.height;
    
    graphCtx.fillStyle = colors.bg;
    graphCtx.fillRect(0, 0, width, height);
    

    graphCtx.strokeStyle = colors.graphGrid;
    graphCtx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
        const y = (i / 10) * height;
        graphCtx.beginPath();
        graphCtx.moveTo(0, y);
        graphCtx.lineTo(width, y);
        graphCtx.stroke();
    }
    

    graphCtx.strokeStyle = colors.text;
    graphCtx.lineWidth = 2;
    graphCtx.beginPath();
    graphCtx.moveTo(0, height/2);
    graphCtx.lineTo(width, height/2);
    graphCtx.stroke();
    
    // Draw EMF curve
    if (emfHistory.length > 1) {
        graphCtx.strokeStyle = colors.graphLine;
        graphCtx.lineWidth = 2;
        graphCtx.beginPath();
        
        const maxEmf = Math.max(5, ...emfHistory.map(d => Math.abs(d.emf)));
        
        emfHistory.forEach((data, index) => {
            const x = (index / MAX_HISTORY) * width;
            const normalizedEmf = data.emf / maxEmf;
            const y = height/2 - normalizedEmf * (height/2 * 0.8);
            
            if (index === 0) {
                graphCtx.moveTo(x, y);
            } else {
                graphCtx.lineTo(x, y);
            }
        });
        
        graphCtx.stroke();
    }
    

    graphCtx.fillStyle = colors.text;
    graphCtx.font = '10px Inter';
    graphCtx.textAlign = 'left';
    graphCtx.fillText('EMF (V)', 5, 15);
    graphCtx.fillText('Time →', width - 50, height - 10);
}


function animate() {
    if (!isAnimating) return;
    
    const dt = 0.016;
    time += dt;
    
    if (motionMode === 'constant') {
        magnetPosition += magnetVelocity * dt * 100; 
    } else if (motionMode === 'oscillate') {
        oscillateTime += dt;
        const amplitude = 150;
        const frequency = 0.5;
        magnetPosition = amplitude * Math.sin(2 * Math.PI * frequency * oscillateTime);
        magnetVelocity = amplitude * 2 * Math.PI * frequency * Math.cos(2 * Math.PI * frequency * oscillateTime) / 100;
    }
    
    calculatePhysics();
    draw();
    drawGraph();
    
    if (isAnimating) {
        animationFrame = requestAnimationFrame(animate);
    }
}

setTimeout(() => {
    updateMagnetStrengthDisplay();
    updateCoilTurnsDisplay();
    updateCoilRadiusDisplay();
    updateZoomDisplay();
    calculatePhysics();
    drawGraph();
    draw();
}, 100);