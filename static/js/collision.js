// constants
const PIXELS_PER_METER = 50;
const BALL_RADIUS = 30;

let dimensionMode = '1d'; 
let restitution = 1.0; 

let balls = [
    {
        id: 1,
        mass: 2,
        radius: BALL_RADIUS,
        x: 200,
        y: 300,
        vx: 5,
        vy: 0,
        color: '#4dabf7',
        trail: []
    },
    {
        id: 2,
        mass: 2,
        radius: BALL_RADIUS,
        x: 600,
        y: 300,
        vx: -5,
        vy: 0,
        color: '#51cf66',
        trail: []
    }
];

let hasCollided = false;
let preCollisionData = null;
let postCollisionData = null;

let isAnimating = false;
let animationFrame = null;
let time = 0;
let lastTime = 0;

let showVelocityVectors = true;
let showTrails = true;
let showGraphs = true;

let momentumHistory = [];
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

let draggedBall = null;
let dragOffset = { x: 0, y: 0 };

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

const dimensionModeSelect = document.getElementById('dimensionMode');
const restitutionSlider = document.getElementById('restitution');
const restitutionDisplay = document.getElementById('restitutionDisplay');
const mass1Input = document.getElementById('mass1');
const mass2Input = document.getElementById('mass2');
const velocity1XInput = document.getElementById('velocity1X');
const velocity1YInput = document.getElementById('velocity1Y');
const velocity2XInput = document.getElementById('velocity2X');
const velocity2YInput = document.getElementById('velocity2Y');
const color1Input = document.getElementById('color1');
const color2Input = document.getElementById('color2');
const showVelocityVectorsCheckbox = document.getElementById('showVelocityVectors');
const showTrailsCheckbox = document.getElementById('showTrails');
const showGraphsCheckbox = document.getElementById('showGraphs');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const resetViewBtn = document.getElementById('resetViewBtn');
const zoomDisplay = document.getElementById('zoomDisplay');

dimensionModeSelect.addEventListener('change', () => {
    dimensionMode = dimensionModeSelect.value;
    
    const velocity1YGroup = document.getElementById('velocity1YGroup');
    const velocity2YGroup = document.getElementById('velocity2YGroup');
    
    if (dimensionMode === '1d') {
        velocity1YGroup.style.display = 'none';
        velocity2YGroup.style.display = 'none';
        balls[0].vy = 0;
        balls[1].vy = 0;
    } else {
        velocity1YGroup.style.display = 'block';
        velocity2YGroup.style.display = 'block';
    }
    
    draw();
});

restitutionSlider.addEventListener('input', () => {
    restitution = parseFloat(restitutionSlider.value);
    const label = restitution === 1 ? 'Elastic' : restitution === 0 ? 'Inelastic' : 'Partially Elastic';
    restitutionDisplay.textContent = `${restitution.toFixed(2)} (${label})`;
});

mass1Input.addEventListener('change', () => {
    balls[0].mass = parseFloat(mass1Input.value);
    updateStats();
});

mass2Input.addEventListener('change', () => {
    balls[1].mass = parseFloat(mass2Input.value);
    updateStats();
});

velocity1XInput.addEventListener('change', () => {
    balls[0].vx = parseFloat(velocity1XInput.value);
    updateStats();
});

velocity1YInput.addEventListener('change', () => {
    balls[0].vy = parseFloat(velocity1YInput.value);
    updateStats();
});

velocity2XInput.addEventListener('change', () => {
    balls[1].vx = parseFloat(velocity2XInput.value);
    updateStats();
});

velocity2YInput.addEventListener('change', () => {
    balls[1].vy = parseFloat(velocity2YInput.value);
    updateStats();
});

color1Input.addEventListener('change', () => {
    balls[0].color = color1Input.value;
    draw();
});

color2Input.addEventListener('change', () => {
    balls[1].color = color2Input.value;
    draw();
});

showVelocityVectorsCheckbox.addEventListener('change', () => {
    showVelocityVectors = showVelocityVectorsCheckbox.checked;
    draw();
});

showTrailsCheckbox.addEventListener('change', () => {
    showTrails = showTrailsCheckbox.checked;
    draw();
});

showGraphsCheckbox.addEventListener('change', () => {
    showGraphs = showGraphsCheckbox.checked;
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
        
        if (!hasCollided) {
            preCollisionData = calculateTotals();
        }
        
        startBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        animate();
    }
});

resetBtn.addEventListener('click', () => {
    isAnimating = false;
    cancelAnimationFrame(animationFrame);
    
    balls[0].x = 200;
    balls[0].y = dimensionMode === '1d' ? canvas.height / 2 : 300;
    balls[0].vx = parseFloat(velocity1XInput.value);
    balls[0].vy = dimensionMode === '1d' ? 0 : parseFloat(velocity1YInput.value);
    balls[0].trail = [];
    
    balls[1].x = 600;
    balls[1].y = dimensionMode === '1d' ? canvas.height / 2 : 300;
    balls[1].vx = parseFloat(velocity2XInput.value);
    balls[1].vy = dimensionMode === '1d' ? 0 : parseFloat(velocity2YInput.value);
    balls[1].trail = [];
    
    hasCollided = false;
    preCollisionData = null;
    postCollisionData = null;
    momentumHistory = [];
    energyHistory = [];
    time = 0;
    lastTime = 0;
    
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
    
    for (let ball of balls) {
        const dist = Math.sqrt((mouseX - ball.x) ** 2 + (mouseY - ball.y) ** 2);
        if (dist < ball.radius) {
            draggedBall = ball;
            dragOffset = { x: mouseX - ball.x, y: mouseY - ball.y };
            canvas.style.cursor = 'grabbing';
            
            if (isAnimating) {
                isAnimating = false;
                cancelAnimationFrame(animationFrame);
                startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
            }
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
    
    if (draggedBall) {
        draggedBall.x = mouseX - dragOffset.x;
        draggedBall.y = mouseY - dragOffset.y;
        
        draggedBall.x = Math.max(draggedBall.radius, Math.min(canvas.width / zoom - draggedBall.radius, draggedBall.x));
        draggedBall.y = Math.max(draggedBall.radius, Math.min(canvas.height / zoom - draggedBall.radius, draggedBall.y));
        
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
        let overBall = false;
        for (let ball of balls) {
            const dist = Math.sqrt((mouseX - ball.x) ** 2 + (mouseY - ball.y) ** 2);
            if (dist < ball.radius) {
                overBall = true;
                break;
            }
        }
        canvas.style.cursor = overBall ? 'grab' : (zoom > 1 ? 'grab' : 'default');
    }
});

canvas.addEventListener('mouseup', () => {
    isPanning = false;
    draggedBall = null;
    canvas.style.cursor = zoom > 1 ? 'grab' : 'default';
});

canvas.addEventListener('mouseleave', () => {
    isPanning = false;
    draggedBall = null;
    canvas.style.cursor = 'default';
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

function calculateTotals() {
    let totalMomentumX = 0;
    let totalMomentumY = 0;
    let totalKE = 0;
    
    balls.forEach(ball => {
        totalMomentumX += ball.mass * ball.vx;
        totalMomentumY += ball.mass * ball.vy;
        totalKE += 0.5 * ball.mass * (ball.vx ** 2 + ball.vy ** 2);
    });
    
    const totalMomentum = Math.sqrt(totalMomentumX ** 2 + totalMomentumY ** 2);
    
    return { totalMomentumX, totalMomentumY, totalMomentum, totalKE };
}

function updateStats() {
    const totals = calculateTotals();
    
    document.getElementById('momentumBefore').textContent = 
        `${totals.totalMomentum.toFixed(2)} kg⋅m/s`;
    document.getElementById('keBefore').textContent = 
        `${totals.totalKE.toFixed(2)} J`;
    
    if (postCollisionData) {
        document.getElementById('momentumAfter').textContent = 
            `${postCollisionData.totalMomentum.toFixed(2)} kg⋅m/s`;
        document.getElementById('keAfter').textContent = 
            `${postCollisionData.totalKE.toFixed(2)} J`;
        document.getElementById('energyLost').textContent = 
            `${(preCollisionData.totalKE - postCollisionData.totalKE).toFixed(2)} J`;
    } else {
        document.getElementById('momentumAfter').textContent = '- kg⋅m/s';
        document.getElementById('keAfter').textContent = '- J';
        document.getElementById('energyLost').textContent = '- J';
    }
}

function checkCollision(ball1, ball2) {
    const dx = ball2.x - ball1.x;
    const dy = ball2.y - ball1.y;
    const distance = Math.sqrt(dx ** 2 + dy ** 2);
    
    return distance <= ball1.radius + ball2.radius;
}

function resolveCollision(ball1, ball2) {
    const dx = ball2.x - ball1.x;
    const dy = ball2.y - ball1.y;
    const distance = Math.sqrt(dx ** 2 + dy ** 2);
    
    if (distance === 0) return;
    
    const nx = dx / distance;
    const ny = dy / distance;
    
    const dvx = ball2.vx - ball1.vx;
    const dvy = ball2.vy - ball1.vy;
    
    const dvn = dvx * nx + dvy * ny;
    
    if (dvn > 0) return;
    
    const m1 = ball1.mass;
    const m2 = ball2.mass;
    const impulse = -(1 + restitution) * dvn / (1/m1 + 1/m2);
    
    ball1.vx -= (impulse * nx) / m1;
    ball1.vy -= (impulse * ny) / m1;
    ball2.vx += (impulse * nx) / m2;
    ball2.vy += (impulse * ny) / m2;
    
    const overlap = ball1.radius + ball2.radius - distance;
    const separationRatio = overlap / 2;
    
    ball1.x -= nx * separationRatio;
    ball1.y -= ny * separationRatio;
    ball2.x += nx * separationRatio;
    ball2.y += ny * separationRatio;
    
    if (!hasCollided) {
        hasCollided = true;
        postCollisionData = calculateTotals();
        updateStats();
    }
}

function getThemeColors() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    return {
        bg: isDark ? '#0a0a0a' : '#ffffff',
        gridLine: isDark ? '#ffffff08' : '#00000008',
        text: isDark ? '#ffffff' : '#000000',
        textBg: isDark ? '#0a0a0acc' : '#ffffffcc',
        velocity: '#22d3ee',
        trail: isDark ? '#ffffff40' : '#00000040',
        graphBg: isDark ? '#1a1a1a' : '#f5f5f5',
        graphBorder: isDark ? '#404040' : '#d0d0d0',
        momentum: '#ffd43b',
        energy: '#ff6b6b'
    };
}

function drawArrow(ctx, x1, y1, x2, y2, color, label, zoom) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx ** 2 + dy ** 2);
    
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
        ctx.font = `bold ${12 / zoom}px Inter`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.fillText(label, x2, y2 - 15);
    }
}

function drawGraphs(ctx, colors) {
    if (!showGraphs || momentumHistory.length < 2) return;

    const graphWidth = 250;
    const graphHeight = 120;
    const graphX = (canvas.width / zoom) - graphWidth - 20;
    const baseY = 20;

    // ===== MOMENTUM GRAPH =====
    const momentumY = baseY;
    ctx.fillStyle = colors.graphBg;
    ctx.fillRect(graphX, momentumY, graphWidth, graphHeight);

    ctx.strokeStyle = colors.graphBorder;
    ctx.lineWidth = 2 / zoom;
    ctx.strokeRect(graphX, momentumY, graphWidth, graphHeight);

    ctx.fillStyle = colors.text;
    ctx.font = `bold ${11 / zoom}px Inter`;
    ctx.textAlign = 'center';
    ctx.fillText('Total Momentum vs Time', graphX + graphWidth / 2, momentumY + 15);

    const mPlotX = graphX + 10;
    const mPlotY = momentumY + 25;
    const mPlotWidth = graphWidth - 20;
    const mPlotHeight = graphHeight - 35;

    const maxMomentum = Math.max(...momentumHistory.map(m => m.momentum), 1);

    ctx.strokeStyle = colors.momentum;
    ctx.lineWidth = 2 / zoom;
    ctx.beginPath();
    momentumHistory.forEach((m, i) => {
        const x = mPlotX + (i / (MAX_HISTORY - 1)) * mPlotWidth;
        const y = mPlotY + mPlotHeight - (m.momentum / maxMomentum) * mPlotHeight;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // ===== ENERGY GRAPH =====
    const energyY = momentumY + graphHeight + 15;
    ctx.fillStyle = colors.graphBg;
    ctx.fillRect(graphX, energyY, graphWidth, graphHeight);

    ctx.strokeStyle = colors.graphBorder;
    ctx.lineWidth = 2 / zoom;
    ctx.strokeRect(graphX, energyY, graphWidth, graphHeight);

    ctx.fillStyle = colors.text;
    ctx.font = `bold ${11 / zoom}px Inter`;
    ctx.textAlign = 'center';
    ctx.fillText('Total Kinetic Energy vs Time', graphX + graphWidth / 2, energyY + 15);

    const ePlotX = graphX + 10;
    const ePlotY = energyY + 25;
    const ePlotWidth = graphWidth - 20;
    const ePlotHeight = graphHeight - 35;

    const maxEnergy = Math.max(...energyHistory.map(e => e.energy), 1);

    ctx.strokeStyle = colors.energy;
    ctx.lineWidth = 2 / zoom;
    ctx.beginPath();
    energyHistory.forEach((e, i) => {
        const x = ePlotX + (i / (MAX_HISTORY - 1)) * ePlotWidth;
        const y = ePlotY + ePlotHeight - (e.energy / maxEnergy) * ePlotHeight;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
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
    
    if (dimensionMode === '1d') {
        const trackY = canvas.height / (2 * zoom);
        ctx.strokeStyle = colors.text + '40';
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(-panX / zoom, trackY);
        ctx.lineTo((canvas.width - panX) / zoom, trackY);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    if (showTrails) {
        balls.forEach(ball => {
            if (ball.trail.length > 1) {
                ctx.strokeStyle = ball.color + '80';
                ctx.lineWidth = 2 / zoom;
                ctx.beginPath();
                ball.trail.forEach((point, i) => {
                    if (i === 0) ctx.moveTo(point.x, point.y);
                    else ctx.lineTo(point.x, point.y);
                });
                ctx.stroke();
            }
        });
    }
    
    balls.forEach(ball => {
        ctx.fillStyle = ball.color;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = colors.text + '80';
        ctx.lineWidth = 3 / zoom;
        ctx.stroke();
        
        ctx.fillStyle = colors.text;
        ctx.font = `bold ${14 / zoom}px Inter`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${ball.mass} kg`, ball.x, ball.y);
        
        if (showVelocityVectors) {
            const velocityScale = 10;
            const vx2 = ball.x + ball.vx * velocityScale;
            const vy2 = ball.y - ball.vy * velocityScale;
            drawArrow(ctx, ball.x, ball.y, vx2, vy2, colors.velocity, 
                `v${ball.id}`, zoom);
        }
    });
    
    drawGraphs(ctx, colors);
    
    ctx.restore();
}

function animate() {
    if (!isAnimating) return;
    
    const currentTime = performance.now();
    const dt = Math.min((currentTime - lastTime) / 1000, 0.033);
    lastTime = currentTime;
    
    time += dt;
    
    balls.forEach(ball => {
        ball.x += ball.vx * dt * PIXELS_PER_METER;
        ball.y += ball.vy * dt * PIXELS_PER_METER;
        
        ball.trail.push({ x: ball.x, y: ball.y });
        if (ball.trail.length > 100) {
            ball.trail.shift();
        }
        
        if (ball.x - ball.radius < 0) {
            ball.x = ball.radius;
            ball.vx = Math.abs(ball.vx) * restitution;
        } else if (ball.x + ball.radius > canvas.width / zoom) {
            ball.x = canvas.width / zoom - ball.radius;
            ball.vx = -Math.abs(ball.vx) * restitution;
        }
        
        if (dimensionMode === '2d') {
            if (ball.y - ball.radius < 0) {
                ball.y = ball.radius;
                ball.vy = Math.abs(ball.vy) * restitution;
            } else if (ball.y + ball.radius > canvas.height / zoom) {
                ball.y = canvas.height / zoom - ball.radius;
                ball.vy = -Math.abs(ball.vy) * restitution;
            }
        } else {
            ball.y = canvas.height / (2 * zoom);
        }
    });
    
    if (checkCollision(balls[0], balls[1])) {
        resolveCollision(balls[0], balls[1]);
    }
    
    const totals = calculateTotals();
    momentumHistory.push({ momentum: totals.totalMomentum });
    energyHistory.push({ energy: totals.totalKE });
    
    if (momentumHistory.length > MAX_HISTORY) {
        momentumHistory.shift();
        energyHistory.shift();
    }
    
    draw();
    
    if (isAnimating) {
        animationFrame = requestAnimationFrame(animate);
    }
}

setTimeout(() => {
    balls[0].y = canvas.height / 2;
    balls[1].y = canvas.height / 2;
    updateStats();
    updateZoomDisplay();
    draw();
}, 100);