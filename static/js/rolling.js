let objectType = 'solid-sphere';
let mass = 2;
let radius = 0.3;
let inclineAngle = 15;
let friction = 0.5;
let gravity = 9.8;

let position = 0; 
let velocity = 0;
let angularVelocity = 0;
let rotation = 0; 
let isRolling = false;
let animationFrame = null;
let lastTime = 0;

let zoom = 1;
let panX = 0;
let panY = 0;
let isPanning = false;
let lastMouseX = 0;
let lastMouseY = 0;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;

let rampLength = 8; // in meters
let isDraggingObject = false;
let isDraggingRamp = false;
let dragStartX = 0;

const SCALE = 60; 

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

const objectTypeSelect = document.getElementById('objectType');
const massInput = document.getElementById('mass');
const radiusSlider = document.getElementById('radius');
const radiusDisplay = document.getElementById('radiusDisplay');
const angleSlider = document.getElementById('inclineAngle');
const angleDisplay = document.getElementById('angleDisplay');
const frictionSlider = document.getElementById('friction');
const frictionDisplay = document.getElementById('frictionDisplay');
const gravityInput = document.getElementById('gravity');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const resetViewBtn = document.getElementById('resetViewBtn');
const zoomDisplay = document.getElementById('zoomDisplay');

objectTypeSelect.addEventListener('change', () => {
    objectType = objectTypeSelect.value;
    updateStats();
    draw();
});

massInput.addEventListener('change', () => {
    mass = parseFloat(massInput.value);
    updateStats();
});

radiusSlider.addEventListener('input', () => {
    radius = parseFloat(radiusSlider.value);
    radiusDisplay.textContent = radius.toFixed(2) + ' m';
    updateStats();
    draw();
});

angleSlider.addEventListener('input', () => {
    inclineAngle = parseFloat(angleSlider.value);
    angleDisplay.textContent = inclineAngle + '°';
    updateStats();
    draw();
});

frictionSlider.addEventListener('input', () => {
    friction = parseFloat(frictionSlider.value);
    frictionDisplay.textContent = friction.toFixed(2);
    updateStats();
});

gravityInput.addEventListener('change', () => {
    gravity = parseFloat(gravityInput.value);
    updateStats();
});

startBtn.addEventListener('click', () => {
    if (isRolling) {
        isRolling = false;
        cancelAnimationFrame(animationFrame);
        startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Release';
    } else {
        isRolling = true;
        lastTime = performance.now();
        startBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        animate();
    }
});

resetBtn.addEventListener('click', () => {
    isRolling = false;
    cancelAnimationFrame(animationFrame);
    position = 0;
    velocity = 0;
    angularVelocity = 0;
    rotation = 0;
    lastTime = 0;
    startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Release';
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
    
    const centerX = 150;
    const centerY = canvas.height / (2 * zoom) - 100;
    const angleRad = inclineAngle * Math.PI / 180;
    
    // check if clicking on object
    const objX = centerX + position * SCALE * Math.cos(-angleRad);
    const objY = centerY + position * SCALE * Math.sin(-angleRad);
    const pixelRadius = radius * SCALE;
    
    const distToObj = Math.sqrt((mouseX - objX) ** 2 + (mouseY - objY) ** 2);
    if (distToObj < pixelRadius) {
        isDraggingObject = true;
        canvas.style.cursor = 'grabbing';
        
        if (isRolling) {
            isRolling = false;
            cancelAnimationFrame(animationFrame);
            startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Release';
        }
        return;
    }
    
    // check if clicking on ramp end to extend
    const rampEndX = centerX + rampLength * SCALE * Math.cos(-angleRad);
    const rampEndY = centerY + rampLength * SCALE * Math.sin(-angleRad);
    
    const distToRampEnd = Math.sqrt((mouseX - rampEndX) ** 2 + (mouseY - rampEndY) ** 2);
    if (distToRampEnd < 30) {
        isDraggingRamp = true;
        dragStartX = mouseX;
        canvas.style.cursor = 'ew-resize';
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
    
    if (isDraggingObject) {
        const centerX = 150;
        const centerY = canvas.height / (2 * zoom) - 100;
        const angleRad = inclineAngle * Math.PI / 180;
        
        // project mouse position onto ramp
        const dx = mouseX - centerX;
        const dy = mouseY - centerY;
        
        // distance along ramp
        const alongRamp = dx * Math.cos(-angleRad) + dy * Math.sin(-angleRad);
        position = Math.max(0, Math.min(rampLength, alongRamp / SCALE));
        
        velocity = 0;
        angularVelocity = 0;
        rotation = 0;
        
        updateStats();
        draw();
    } else if (isDraggingRamp) {
        const deltaX = mouseX - dragStartX;
        const angleRad = inclineAngle * Math.PI / 180;
        const deltaLength = deltaX * Math.cos(-angleRad) / SCALE;
        
        rampLength = Math.max(2, Math.min(20, rampLength + deltaLength));
        dragStartX = mouseX;
        
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
        // hover cursor changes
        const centerX = 150;
        const centerY = canvas.height / (2 * zoom) - 100;
        const angleRad = inclineAngle * Math.PI / 180;
        
        const objX = centerX + position * SCALE * Math.cos(-angleRad);
        const objY = centerY + position * SCALE * Math.sin(-angleRad);
        const pixelRadius = radius * SCALE;
        
        const distToObj = Math.sqrt((mouseX - objX) ** 2 + (mouseY - objY) ** 2);
        
        const rampEndX = centerX + rampLength * SCALE * Math.cos(-angleRad);
        const rampEndY = centerY + rampLength * SCALE * Math.sin(-angleRad);
        const distToRampEnd = Math.sqrt((mouseX - rampEndX) ** 2 + (mouseY - rampEndY) ** 2);
        
        if (distToObj < pixelRadius) {
            canvas.style.cursor = 'grab';
        } else if (distToRampEnd < 30) {
            canvas.style.cursor = 'ew-resize';
        } else {
            canvas.style.cursor = zoom > 1 ? 'grab' : 'default';
        }
    }
});

canvas.addEventListener('mouseup', () => {
    isPanning = false;
    isDraggingObject = false;
    isDraggingRamp = false;
    canvas.style.cursor = 'default';
});

canvas.addEventListener('mouseleave', () => {
    isPanning = false;
    isDraggingObject = false;
    isDraggingRamp = false;
    canvas.style.cursor = 'default';
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

function getMomentOfInertia() {
    const m = mass;
    const r = radius;
    switch(objectType) {
        case 'solid-sphere':
            return (2/5) * m * r * r;
        case 'hollow-sphere':
            return (2/3) * m * r * r;
        case 'solid-cylinder':
        case 'disk':
            return (1/2) * m * r * r;
        case 'hollow-cylinder':
        case 'hoop':
            return m * r * r;
        default:
            return (1/2) * m * r * r;
    }
}

function getAcceleration() {
    const I = getMomentOfInertia();
    const angleRad = inclineAngle * Math.PI / 180;
    
    // a = g*sin(theta) / (1 + I/(m*r^2))
    const factor = I / (mass * radius * radius);
    const acceleration = (gravity * Math.sin(angleRad)) / (1 + factor);
    
    return acceleration;
}

function updateStats() {
    const I = getMomentOfInertia();
    const acceleration = getAcceleration();
    const translationalKE = 0.5 * mass * velocity * velocity;
    const rotationalKE = 0.5 * I * angularVelocity * angularVelocity;
    const totalEnergy = translationalKE + rotationalKE;
    
    document.getElementById('momentInertia').textContent = I.toFixed(4) + ' kg⋅m²';
    document.getElementById('linearVelocity').textContent = velocity.toFixed(2) + ' m/s';
    document.getElementById('angularVelocity').textContent = angularVelocity.toFixed(2) + ' rad/s';
    document.getElementById('totalEnergy').textContent = totalEnergy.toFixed(2) + ' J';
    document.getElementById('acceleration').textContent = acceleration.toFixed(2) + ' m/s²';
}

function getThemeColors() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    return {
        bg: isDark ? '#0a0a0a' : '#ffffff',
        gridLine: isDark ? '#ffffff08' : '#00000008',
        ramp: isDark ? '#2a2a2a' : '#d0d0d0',
        rampBorder: isDark ? '#404040' : '#b0b0b0',
        object: isDark ? '#4dabf7' : '#1c7ed6',
        text: isDark ? '#ffffff' : '#000000',
        handle: isDark ? '#51cf66' : '#2b8a3e'
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
    
    const centerX = 150;
    const centerY = canvas.height / (2 * zoom) - 100;
    const angleRad = inclineAngle * Math.PI / 180;
    const rampPixelLength = rampLength * SCALE;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(-angleRad);
    
    ctx.fillStyle = colors.ramp;
    ctx.fillRect(0, 0, rampPixelLength, 30);
    ctx.strokeStyle = colors.rampBorder;
    ctx.lineWidth = 2/zoom;
    ctx.strokeRect(0, 0, rampPixelLength, 30);
    
    // texture lines
    ctx.strokeStyle = colors.rampBorder + '60';
    ctx.lineWidth = 1/zoom;
    for (let i = 50; i < rampPixelLength; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 30);
        ctx.stroke();
    }
    
    // drag handle at end
    ctx.fillStyle = colors.handle;
    ctx.beginPath();
    ctx.arc(rampPixelLength, 15, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colors.text;
    ctx.lineWidth = 2/zoom;
    ctx.stroke();
    
    ctx.restore();
    
    // draw object
    const objX = centerX + position * SCALE * Math.cos(-angleRad);
    const objY = centerY + position * SCALE * Math.sin(-angleRad);
    
    ctx.save();
    ctx.translate(objX, objY);
    
    const pixelRadius = radius * SCALE;
    
    if (objectType.includes('sphere')) {
        ctx.fillStyle = colors.object;
        ctx.beginPath();
        ctx.arc(0, 0, pixelRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = colors.text;
        ctx.lineWidth = 2/zoom;
        ctx.stroke();
        
        if (objectType === 'hollow-sphere') {
            ctx.strokeStyle = colors.text + '60';
            ctx.lineWidth = 1.5/zoom;
            ctx.beginPath();
            ctx.arc(0, 0, pixelRadius * 0.8, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // rotation line
        ctx.strokeStyle = colors.text;
        ctx.lineWidth = 2/zoom;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(pixelRadius * Math.cos(rotation), pixelRadius * Math.sin(rotation));
        ctx.stroke();
        
        ctx.fillStyle = colors.text;
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
    } else if (objectType.includes('cylinder') || objectType === 'disk') {
        const height = pixelRadius * 2;
        const width = objectType === 'disk' ? pixelRadius * 0.3 : pixelRadius * 1.2;
        
        ctx.fillStyle = colors.object;
        ctx.fillRect(-width/2, -height/2, width, height);
        
        ctx.strokeStyle = colors.text;
        ctx.lineWidth = 2/zoom;
        ctx.strokeRect(-width/2, -height/2, width, height);
        
        if (objectType === 'hollow-cylinder') {
            ctx.strokeStyle = colors.text + '60';
            ctx.lineWidth = 1.5/zoom;
            ctx.strokeRect(-width/2 + 5, -height/2 + 5, width - 10, height - 10);
        }
        
        ctx.save();
        ctx.rotate(rotation);
        ctx.strokeStyle = colors.text + '80';
        ctx.lineWidth = 1.5/zoom;
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(pixelRadius * Math.cos(angle), pixelRadius * Math.sin(angle));
            ctx.stroke();
        }
        ctx.restore();
    } else if (objectType === 'hoop') {
        ctx.strokeStyle = colors.object;
        ctx.lineWidth = pixelRadius * 0.2;
        ctx.beginPath();
        ctx.arc(0, 0, pixelRadius * 0.9, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = colors.text;
        ctx.lineWidth = 2/zoom;
        ctx.beginPath();
        ctx.arc(0, 0, pixelRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(0, 0, pixelRadius * 0.8, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.save();
        ctx.rotate(rotation);
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(pixelRadius * 0.8 * Math.cos(angle), pixelRadius * 0.8 * Math.sin(angle));
            ctx.lineTo(pixelRadius * Math.cos(angle), pixelRadius * Math.sin(angle));
            ctx.stroke();
        }
        ctx.restore();
    }
    
    ctx.restore();
    
    // labels
    ctx.font = `bold ${14/zoom}px Inter`;
    ctx.fillStyle = colors.text;
    ctx.textAlign = 'left';
    const label = objectType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    ctx.fillText(label, 20, 30);
    ctx.fillText(`θ = ${inclineAngle}°`, 20, 55);
    ctx.fillText(`Length = ${rampLength.toFixed(1)}m`, 20, 80);
    
    ctx.restore();
}

function animate() {
    if (!isRolling) return;
    
    const currentTime = performance.now();
    const dt = lastTime === 0 ? 0.016 : Math.min((currentTime - lastTime) / 1000, 0.033);
    lastTime = currentTime;
    
    const acceleration = getAcceleration();
    
    velocity += acceleration * dt;
    position += velocity * dt;
    
    // rolling condition: omega = v/r
    angularVelocity = velocity / radius;
    rotation += angularVelocity * dt;
    
    if (position >= rampLength) {
        position = rampLength;
        velocity = 0;
        angularVelocity = 0;
        isRolling = false;
        startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Release';
    }
    
    updateStats();
    draw();
    
    if (isRolling) {
        animationFrame = requestAnimationFrame(animate);
    }
}

setTimeout(() => {
    updateStats();
    updateZoomDisplay();
    draw();
}, 100);