const PIXELS_PER_METER = 100;
const MASS_SIZE = 60;
const SPRING_COILS = 20;
const SPRING_WIDTH = 40;

let mass = 2;
let springConstant = 50;
let damping = 0.5;
let gravity = 9.8;
let initialDisplacement = 1;

let displacement = 0;
let velocity = 0;
let acceleration = 0;
let equilibriumPosition = 0;
let naturalLength = 200;

let isAnimating = false;
let animationFrame = null;
let time = 0;
let lastTime = 0;

let showVectors = true;
let showGraph = true;
let showEquilibrium = true;

let energyHistory = [];
const MAX_HISTORY = 200;

let zoom = 1;
let panX = 0;
let panY = 0;
let isPanning = false;
let lastMouseX = 0;
let lastMouseY = 0;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;

let isDraggingMass = false;
let dragOffset = 0;

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
    calculateEquilibrium();
    draw();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const massInput = document.getElementById('mass');
const springConstantSlider = document.getElementById('springConstant');
const springConstantDisplay = document.getElementById('springDisplay');
const dampingSlider = document.getElementById('damping');
const dampingDisplay = document.getElementById('dampingDisplay');
const gravityInput = document.getElementById('gravity');
const initialDisplacementSlider = document.getElementById('initialDisplacement');
const displacementDisplay = document.getElementById('displacementDisplay');
const showVectorsCheckbox = document.getElementById('showVectors');
const showGraphCheckbox = document.getElementById('showGraph');
const showEquilibriumCheckbox = document.getElementById('showEquilibrium');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const resetViewBtn = document.getElementById('resetViewBtn');
const zoomDisplay = document.getElementById('zoomDisplay');

function calculateEquilibrium() {
    const equilibriumStretch = (mass * gravity) / springConstant;
    equilibriumPosition = canvas.height / (2 * zoom) - 100;
}

massInput.addEventListener('change', () => {
    mass = parseFloat(massInput.value);
    calculateEquilibrium();
    updateStats();
    draw();
});

springConstantSlider.addEventListener('input', () => {
    springConstant = parseFloat(springConstantSlider.value);
    springConstantDisplay.textContent = `${springConstant} N/m`;
    calculateEquilibrium();
    updateStats();
    draw();
});

dampingSlider.addEventListener('input', () => {
    damping = parseFloat(dampingSlider.value);
    dampingDisplay.textContent = `${damping.toFixed(1)} kg/s`;
    draw();
});

gravityInput.addEventListener('change', () => {
    gravity = parseFloat(gravityInput.value);
    calculateEquilibrium();
    updateStats();
    draw();
});

initialDisplacementSlider.addEventListener('input', () => {
    initialDisplacement = parseFloat(initialDisplacementSlider.value);
    displacementDisplay.textContent = `${initialDisplacement.toFixed(1)} m`;
    if (!isAnimating) {
        displacement = initialDisplacement;
        velocity = 0;
        draw();
    }
});

showVectorsCheckbox.addEventListener('change', () => {
    showVectors = showVectorsCheckbox.checked;
    draw();
});

showGraphCheckbox.addEventListener('change', () => {
    showGraph = showGraphCheckbox.checked;
    draw();
});

showEquilibriumCheckbox.addEventListener('change', () => {
    showEquilibrium = showEquilibriumCheckbox.checked;
    draw();
});

startBtn.addEventListener('click', () => {
    if (isAnimating) {
        isAnimating = false;
        cancelAnimationFrame(animationFrame);
        startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
    } else {
        isAnimating = true;
        lastTime = performance.now();
        startBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        animate();
    }
});

resetBtn.addEventListener('click', () => {
    isAnimating = false;
    cancelAnimationFrame(animationFrame);
    
    displacement = initialDisplacement;
    velocity = 0;
    acceleration = 0;
    time = 0;
    lastTime = 0;
    energyHistory = [];
    
    startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
    updateStats();
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
    calculateEquilibrium();
    draw();
}

function resetView() {
    zoom = 1;
    panX = 0;
    panY = 0;
    updateZoomDisplay();
    calculateEquilibrium();
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
    
    const massY = equilibriumPosition + displacement * PIXELS_PER_METER;
    const massX = canvas.width / (2 * zoom);
    
    const dist = Math.sqrt((mouseX - massX) ** 2 + (mouseY - massY) ** 2);
    
    if (dist < MASS_SIZE / 2) {
        isDraggingMass = true;
        dragOffset = mouseY - massY;
        canvas.style.cursor = 'grabbing';
        
        if (isAnimating) {
            isAnimating = false;
            cancelAnimationFrame(animationFrame);
            startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
        }
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
    
    if (isDraggingMass) {
        const newMassY = mouseY - dragOffset;
        displacement = (newMassY - equilibriumPosition) / PIXELS_PER_METER;
        
        displacement = Math.max(-3, Math.min(3, displacement));
        velocity = 0;
        
        updateStats();
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
        const massY = equilibriumPosition + displacement * PIXELS_PER_METER;
        const massX = canvas.width / (2 * zoom);
        const dist = Math.sqrt((mouseX - massX) ** 2 + (mouseY - massY) ** 2);
        
        canvas.style.cursor = dist < MASS_SIZE / 2 ? 'grab' : (zoom > 1 ? 'grab' : 'default');
    }
});

canvas.addEventListener('mouseup', () => {
    isPanning = false;
    isDraggingMass = false;
    canvas.style.cursor = zoom > 1 ? 'grab' : 'default';
});

canvas.addEventListener('mouseleave', () => {
    isPanning = false;
    isDraggingMass = false;
    canvas.style.cursor = 'default';
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

function calculateForces() {
    const springForce = -springConstant * displacement;
    const dampingForce = -damping * velocity;
    const netForce = springForce + dampingForce;
    acceleration = netForce / mass;
    
    return { springForce, dampingForce, netForce };
}

function calculateEnergy() {
    const kineticEnergy = 0.5 * mass * velocity * velocity;
    const potentialEnergy = 0.5 * springConstant * displacement * displacement;
    const totalEnergy = kineticEnergy + potentialEnergy;
    
    return { kineticEnergy, potentialEnergy, totalEnergy };
}

function updateStats() {
    const period = 2 * Math.PI * Math.sqrt(mass / springConstant);
    const frequency = 1 / period;
    const energy = calculateEnergy();
    
    document.getElementById('period').textContent = period.toFixed(3) + ' s';
    document.getElementById('frequency').textContent = frequency.toFixed(3) + ' Hz';
    document.getElementById('displacement').textContent = displacement.toFixed(3) + ' m';
    document.getElementById('velocity').textContent = velocity.toFixed(3) + ' m/s';
    document.getElementById('acceleration').textContent = acceleration.toFixed(3) + ' m/s²';
    document.getElementById('totalEnergy').textContent = energy.totalEnergy.toFixed(3) + ' J';
}

function getThemeColors() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    return {
        bg: isDark ? '#0a0a0a' : '#ffffff',
        gridLine: isDark ? '#ffffff08' : '#00000008',
        text: isDark ? '#ffffff' : '#000000',
        textBg: isDark ? '#0a0a0acc' : '#ffffffcc',
        spring: isDark ? '#4dabf7' : '#1971c2',
        mass: isDark ? '#51cf66' : '#2b8a3e',
        massBorder: isDark ? '#40c057' : '#2f9e44',
        ceiling: isDark ? '#2a2a2a' : '#d0d0d0',
        equilibrium: isDark ? '#ffd43b' : '#f59f00',
        springForce: '#ff6b6b',
        dampingForce: '#a78bfa',
        velocity: '#22d3ee',
        graphBg: isDark ? '#1a1a1a' : '#f5f5f5',
        graphBorder: isDark ? '#404040' : '#d0d0d0',
        ke: '#51cf66',
        pe: '#ff6b6b',
        te: '#ffd43b'
    };
}

function drawSpring(ctx, x, y1, y2, colors) {
    const coilHeight = (y2 - y1) / SPRING_COILS;
    
    ctx.strokeStyle = colors.spring;
    ctx.lineWidth = 3 / zoom;
    ctx.beginPath();
    ctx.moveTo(x, y1);
    
    for (let i = 0; i < SPRING_COILS; i++) {
        const yTop = y1 + i * coilHeight;
        const yBottom = y1 + (i + 1) * coilHeight;
        const yMid = (yTop + yBottom) / 2;
        
        const xOffset = (i % 2 === 0) ? SPRING_WIDTH / 2 : -SPRING_WIDTH / 2;
        
        ctx.quadraticCurveTo(x + xOffset, yMid, x, yBottom);
    }
    
    ctx.stroke();
}

function drawArrow(ctx, x1, y1, x2, y2, color, label, zoom) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length < 5) return;
    
    const headLength = 12;
    const angle = Math.atan2(dy, dx);
    
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3 / zoom;
    
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
    
    if (label) {
        ctx.font = `bold ${14 / zoom}px Inter`;
        ctx.fillStyle = color;
        ctx.textAlign = 'left';
        ctx.fillText(label, x2 + 10, y2);
    }
}

function drawEnergyGraph(ctx, colors) {
    if (!showGraph || energyHistory.length < 2) return;
    
    const graphWidth = 250;
    const graphHeight = 150;
    const graphX = (canvas.width / zoom) - graphWidth - 20;
    const graphY = 20;
    
    ctx.fillStyle = colors.graphBg;
    ctx.fillRect(graphX, graphY, graphWidth, graphHeight);
    
    ctx.strokeStyle = colors.graphBorder;
    ctx.lineWidth = 2 / zoom;
    ctx.strokeRect(graphX, graphY, graphWidth, graphHeight);
    
    ctx.fillStyle = colors.text;
    ctx.font = `bold ${12 / zoom}px Inter`;
    ctx.textAlign = 'center';
    ctx.fillText('Energy vs Time', graphX + graphWidth / 2, graphY + 15);
    
    let maxEnergy = 0;
    energyHistory.forEach(e => {
        maxEnergy = Math.max(maxEnergy, e.ke, e.pe, e.te);
    });
    
    if (maxEnergy === 0) maxEnergy = 1;
    
    const plotWidth = graphWidth - 20;
    const plotHeight = graphHeight - 40;
    const plotX = graphX + 10;
    const plotY = graphY + 25;
    
    const drawEnergyLine = (energyKey, color) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 / zoom;
        ctx.beginPath();
        
        energyHistory.forEach((e, i) => {
            const x = plotX + (i / (MAX_HISTORY - 1)) * plotWidth;
            const y = plotY + plotHeight - (e[energyKey] / maxEnergy) * plotHeight;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        
        ctx.stroke();
    };
    
    drawEnergyLine('te', colors.te);
    drawEnergyLine('ke', colors.ke);
    drawEnergyLine('pe', colors.pe);
    
    const legendY = graphY + graphHeight - 10;
    ctx.font = `${10 / zoom}px Inter`;
    ctx.textAlign = 'left';
    
    ctx.fillStyle = colors.ke;
    ctx.fillText('KE', graphX + 10, legendY);
    
    ctx.fillStyle = colors.pe;
    ctx.fillText('PE', graphX + 50, legendY);
    
    ctx.fillStyle = colors.te;
    ctx.fillText('Total', graphX + 90, legendY);
}

function draw() {
    if (!canvas || !ctx) return;
    
    const colors = getThemeColors();
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);
    
    ctx.fillStyle = colors.bg;
    ctx.fillRect(-panX / zoom, -panY / zoom, canvas.width / zoom, canvas.height / zoom);
    
    ctx.strokeStyle = colors.gridLine;
    ctx.lineWidth = 1 / zoom;
    const gridSize = 30;
    
    const startX = Math.floor(-panX / zoom / gridSize) * gridSize;
    const endX = Math.ceil((canvas.width - panX) / zoom / gridSize) * gridSize;
    const startY = Math.floor(-panY / zoom / gridSize) * gridSize;
    const endY = Math.ceil((canvas.height - panY) / zoom / gridSize) * gridSize;
    
    for (let x = startX; x < endX; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, -panY / zoom);
        ctx.lineTo(x, (canvas.height - panY) / zoom);
        ctx.stroke();
    }
    
    for (let y = startY; y < endY; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(-panX / zoom, y);
        ctx.lineTo((canvas.width - panX) / zoom, y);
        ctx.stroke();
    }
    
    const centerX = canvas.width / (2 * zoom);
    const ceilingY = 50;
    const massY = equilibriumPosition + displacement * PIXELS_PER_METER;
    
    ctx.fillStyle = colors.ceiling;
    ctx.fillRect(-panX / zoom, ceilingY - 10, canvas.width / zoom, 10);
    
    ctx.strokeStyle = colors.text;
    ctx.lineWidth = 2 / zoom;
    ctx.beginPath();
    ctx.moveTo(-panX / zoom, ceilingY);
    ctx.lineTo((canvas.width - panX) / zoom, ceilingY);
    ctx.stroke();
    
    if (showEquilibrium) {
        ctx.strokeStyle = colors.equilibrium;
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(centerX - 100, equilibriumPosition);
        ctx.lineTo(centerX + 100, equilibriumPosition);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = colors.equilibrium;
        ctx.font = `${12 / zoom}px Inter`;
        ctx.textAlign = 'right';
        ctx.fillText('Equilibrium', centerX - 110, equilibriumPosition + 5);
    }
    
    drawSpring(ctx, centerX, ceilingY, massY - MASS_SIZE / 2, colors);
    
    ctx.fillStyle = colors.mass;
    ctx.fillRect(centerX - MASS_SIZE / 2, massY - MASS_SIZE / 2, MASS_SIZE, MASS_SIZE);
    
    ctx.strokeStyle = colors.massBorder;
    ctx.lineWidth = 3 / zoom;
    ctx.strokeRect(centerX - MASS_SIZE / 2, massY - MASS_SIZE / 2, MASS_SIZE, MASS_SIZE);
    
    ctx.fillStyle = colors.text;
    ctx.font = `bold ${14 / zoom}px Inter`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${mass} kg`, centerX, massY);
    
    if (showVectors) {
        const forces = calculateForces();
        const forceScale = 2;
        
        if (Math.abs(forces.springForce) > 0.1) {
            const springForceY = massY - forces.springForce * forceScale;
            drawArrow(ctx, centerX + 40, massY, centerX + 40, springForceY, colors.springForce, 'Fs', zoom);
        }
        
        if (Math.abs(forces.dampingForce) > 0.1) {
            const dampingForceY = massY - forces.dampingForce * forceScale;
            drawArrow(ctx, centerX + 70, massY, centerX + 70, dampingForceY, colors.dampingForce, 'Fd', zoom);
        }
        
        if (Math.abs(velocity) > 0.01) {
            const velocityScale = 20;
            const velocityY = massY - velocity * velocityScale;
            drawArrow(ctx, centerX - 40, massY, centerX - 40, velocityY, colors.velocity, 'v', zoom);
        }
    }
    
    drawEnergyGraph(ctx, colors);
    
    ctx.restore();
}

function animate() {
    if (!isAnimating) return;
    
    const currentTime = performance.now();
    const dt = Math.min((currentTime - lastTime) / 1000, 0.033);
    lastTime = currentTime;
    
    time += dt;
    
    calculateForces();
    velocity += acceleration * dt;
    displacement += velocity * dt;
    
    const energy = calculateEnergy();
    energyHistory.push({
        ke: energy.kineticEnergy,
        pe: energy.potentialEnergy,
        te: energy.totalEnergy
    });
    
    if (energyHistory.length > MAX_HISTORY) {
        energyHistory.shift();
    }
    
    updateStats();
    draw();
    
    if (isAnimating) {
        animationFrame = requestAnimationFrame(animate);
    }
}

setTimeout(() => {
    displacement = initialDisplacement;
    calculateEquilibrium();
    updateStats();
    updateZoomDisplay();
    draw();
}, 100);