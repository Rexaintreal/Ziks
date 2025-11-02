// Physics constants
const BLOCK_SIZE = 50;
const INCLINE_LENGTH = 600;
const INCLINE_THICKNESS = 15;
const PIXELS_PER_METER = 50; // added scale factor for better visualization
let angle = 30;
let blocks = [{
    id: 1,
    mass: 5,
    position: 100,
    velocity: 0,
    appliedForces: [],
    isStationary: true
}];
let selectedBlock = 0;
let friction = 0.2;
let gravity = 9.8;
let isAnimating = false;
let animationFrame = null;
let time = 0;
let lastTime = 0;
let zoom = 1;
let panX = 0;
let panY = 0;
let isPanning = false;
let lastMouseX = 0;
let lastMouseY = 0;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
let draggedBlock = null;
let draggedForce = null;
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



const angleSlider = document.getElementById('angle');
const angleDisplay = document.getElementById('angleDisplay');
const massInput = document.getElementById('mass');
const frictionInput = document.getElementById('friction');
const gravityInput = document.getElementById('gravity');
const addBlockBtn = document.getElementById('addBlockBtn');
const addForceBtn = document.getElementById('addForceBtn');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const resetViewBtn = document.getElementById('resetViewBtn');
const zoomDisplay = document.getElementById('zoomDisplay');
function updateAngleDisplay() {
    angle = parseFloat(angleSlider.value);
    angleDisplay.innerHTML = angle + "&deg;";
    blocks.forEach(block => {
        block.velocity = 0;
        block.isStationary = true;
    });
    calculateForces();
    draw();
}



angleSlider.addEventListener('input', updateAngleDisplay);
massInput.addEventListener('change', () => {
    blocks[selectedBlock].mass = parseFloat(massInput.value);
    blocks[selectedBlock].velocity = 0;
    blocks[selectedBlock].isStationary = true;
    calculateForces();
    draw();
});



frictionInput.addEventListener('change', () => {
    friction = parseFloat(frictionInput.value);
    blocks.forEach(block => {
        block.velocity = 0;
        block.isStationary = true;
    });
    calculateForces();
    draw();
});



gravityInput.addEventListener('change', () => {
    gravity = parseFloat(gravityInput.value);
    blocks.forEach(block => {
        block.velocity = 0;
        block.isStationary = true;
    });
    calculateForces();
    draw();
});

addBlockBtn.addEventListener('click', () => {
    const newBlock = {
        id: blocks.length + 1,
        mass: 5,
        position: 50 + blocks.length * 80,
        velocity: 0,
        appliedForces: [],
        isStationary: true
    };
    blocks.push(newBlock);
    selectedBlock = blocks.length - 1;
    massInput.value = blocks[selectedBlock].mass;
    updateForcesList();
    calculateForces();
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
        lastTime = performance.now();
        startBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        animate();
    }
});

resetBtn.addEventListener('click', () => {
    isAnimating = false;
    cancelAnimationFrame(animationFrame);
    
    blocks.forEach((block, index) => {
        block.position = 100 + index * 80;
        block.velocity = 0;
        block.isStationary = true;
    });
    time = 0;
    lastTime = 0;
    startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
    calculateForces();
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


function addForce() {
    const forceId = Date.now();
    blocks[selectedBlock].appliedForces.push({
        id: forceId,
        magnitude: 20,
        angle: 0
    });
    blocks[selectedBlock].isStationary = true;
    updateForcesList();
    calculateForces();
    draw();
}

function removeForce(id) {
    blocks[selectedBlock].appliedForces = blocks[selectedBlock].appliedForces.filter(f => f.id !== id);
    blocks[selectedBlock].isStationary = true;
    updateForcesList();
    calculateForces();
    draw();
}



function updateForce(id, property, value) {
    const block = blocks[selectedBlock];
    const force = block.appliedForces.find(f => f.id === id);
    if (force) {
        force[property] = parseFloat(value);
        block.isStationary = true;
        calculateForces();
        draw();
    }
}


function updateForcesList() {
    const forcesList = document.getElementById('forcesList');
    forcesList.innerHTML = '';
    
    const block = blocks[selectedBlock];
    block.appliedForces.forEach(force => {
        const forceItem = document.createElement('div');
        forceItem.className = 'force-item';
        forceItem.innerHTML = `
            <div class="force-header">
                <span class="force-label">Force ${block.appliedForces.indexOf(force) + 1} (Block ${selectedBlock + 1})</span>
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

window.removeForce = removeForce;
window.updateForce = updateForce;

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - panX) / zoom;
    const mouseY = (e.clientY - rect.top - panY) / zoom;
    const centerX = canvas.width / (2 * zoom);
    const centerY = canvas.height / (2 * zoom);
    const groundY = centerY + 150;
    const angleRad = angle * Math.PI / 180;
    const inclineStartX = centerX - INCLINE_LENGTH / 2;
    const inclineStartY = groundY;
    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const blockPos = block.position;
        const blockLocalY = -INCLINE_THICKNESS - BLOCK_SIZE / 2;
        const blockWorldX = inclineStartX + Math.cos(-angleRad) * blockPos - Math.sin(-angleRad) * blockLocalY;
        const blockWorldY = inclineStartY + Math.sin(-angleRad) * blockPos + Math.cos(-angleRad) * blockLocalY;
        for (let j = 0; j < block.appliedForces.length; j++) {
            const force = block.appliedForces[j];
            const forceAngleRad = force.angle * Math.PI / 180;
            const forceScale = 3;
            const forceEndX = blockWorldX + Math.cos(forceAngleRad) * force.magnitude * forceScale;
            const forceEndY = blockWorldY - Math.sin(forceAngleRad) * force.magnitude * forceScale;
            const dist = Math.sqrt((mouseX - forceEndX) ** 2 + (mouseY - forceEndY) ** 2);
            if (dist < 15) {
                selectedBlock = i;
                massInput.value = blocks[selectedBlock].mass;
                updateForcesList();
                draggedForce = j;
                dragOffset = { x: mouseX - forceEndX, y: mouseY - forceEndY };
                canvas.style.cursor = 'grabbing';
                return;
            }
        }
    }
    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const blockPos = block.position;
        const blockLocalY = -INCLINE_THICKNESS - BLOCK_SIZE / 2;
        const blockWorldX = inclineStartX + Math.cos(-angleRad) * blockPos - Math.sin(-angleRad) * blockLocalY;
        const blockWorldY = inclineStartY + Math.sin(-angleRad) * blockPos + Math.cos(-angleRad) * blockLocalY;
        const dist = Math.sqrt((mouseX - blockWorldX) ** 2 + (mouseY - blockWorldY) ** 2);
        if (dist < BLOCK_SIZE / 2) {
            selectedBlock = i;
            massInput.value = blocks[selectedBlock].mass;
            updateForcesList();
            draggedBlock = i;
            dragOffset = {
                x: mouseX - blockWorldX,
                y: mouseY - blockWorldY
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
    const groundY = centerY + 150;
    const angleRad = angle * Math.PI / 180;
    const inclineStartX = centerX - INCLINE_LENGTH / 2;
    const inclineStartY = groundY;
    if (draggedForce !== null) {
        const block = blocks[selectedBlock];
        const blockPos = block.position;
        const blockLocalY = -INCLINE_THICKNESS - BLOCK_SIZE / 2;
        const blockWorldX = inclineStartX + Math.cos(-angleRad) * blockPos - Math.sin(-angleRad) * blockLocalY;
        const blockWorldY = inclineStartY + Math.sin(-angleRad) * blockPos + Math.cos(-angleRad) * blockLocalY;
        const dx = mouseX - blockWorldX;
        const dy = blockWorldY - mouseY;
        const magnitude = Math.sqrt(dx * dx + dy * dy) / 3;
        const forceAngle = Math.atan2(dy, dx) * 180 / Math.PI;
        block.appliedForces[draggedForce].magnitude = Math.max(0, Math.round(magnitude * 10) / 10);
        block.appliedForces[draggedForce].angle = Math.round(forceAngle);
        updateForcesList();
        calculateForces();
        draw();
    } else if (draggedBlock !== null) {
        const dx = mouseX - inclineStartX;
        const dy = mouseY - inclineStartY;
        const posAlongIncline = dx * Math.cos(-angleRad) + dy * Math.sin(-angleRad);
        blocks[draggedBlock].position = Math.max(0, Math.min(INCLINE_LENGTH, posAlongIncline));
        blocks[draggedBlock].velocity = 0;
        blocks[draggedBlock].isStationary = true;
        calculateForces();
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
        let overBlock = false;
        
        for (let block of blocks) {
            const blockPos = block.position;
            const blockLocalY = -INCLINE_THICKNESS - BLOCK_SIZE / 2;
            const blockWorldX = inclineStartX + Math.cos(-angleRad) * blockPos - Math.sin(-angleRad) * blockLocalY;
            const blockWorldY = inclineStartY + Math.sin(-angleRad) * blockPos + Math.cos(-angleRad) * blockLocalY;
            const dist = Math.sqrt((mouseX - blockWorldX) ** 2 + (mouseY - blockWorldY) ** 2);
            if (dist < BLOCK_SIZE / 2) {
                overBlock = true;
                break;
            }
        }
        



        for (let block of blocks) {
            const blockPos = block.position;
            const blockLocalY = -INCLINE_THICKNESS - BLOCK_SIZE / 2;
            const blockWorldX = inclineStartX + Math.cos(-angleRad) * blockPos - Math.sin(-angleRad) * blockLocalY;
            const blockWorldY = inclineStartY + Math.sin(-angleRad) * blockPos + Math.cos(-angleRad) * blockLocalY;
            
            for (let force of block.appliedForces) {
                const forceAngleRad = force.angle * Math.PI / 180;
                const forceScale = 3;
                const forceEndX = blockWorldX + Math.cos(forceAngleRad) * force.magnitude * forceScale;
                const forceEndY = blockWorldY - Math.sin(forceAngleRad) * force.magnitude * forceScale; 
                const dist = Math.sqrt((mouseX - forceEndX) ** 2 + (mouseY - forceEndY) ** 2);
                if (dist < 15) {
                    overForce = true;
                    break;
                }
            }
            if (overForce) break;
        }
        
        canvas.style.cursor = overForce ? 'grab' : (overBlock ? 'grab' : (zoom > 1 ? 'grab' : 'crosshair'));


    }
});

canvas.addEventListener('mouseup', () => {
    isPanning = false;
    draggedBlock = null;
    draggedForce = null;
    canvas.style.cursor = zoom > 1 ? 'grab' : 'crosshair';
});

canvas.addEventListener('mouseleave', () => {
    isPanning = false;
    draggedBlock = null;
    draggedForce = null;
    canvas.style.cursor = 'crosshair';
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// IMPROVED PHYSICS CALCULATIONS
function calculateForces() {
    const block = blocks[selectedBlock];
    const angleRad = angle * Math.PI / 180;
    const weight = block.mass * gravity;
    const weightParallel = weight * Math.sin(angleRad);
    const weightPerpendicular = weight * Math.cos(angleRad);
    let normalFromApplied = 0;
    block.appliedForces.forEach(force => {
        const forceAngleRad = force.angle * Math.PI / 180;
        normalFromApplied += force.magnitude * Math.sin(forceAngleRad - angleRad);
    });
    const normal = weightPerpendicular + normalFromApplied;
    // Maximum static friction
    const maxStaticFriction = friction * Math.abs(normal);
    let appliedParallel = 0;
    block.appliedForces.forEach(force => {
        const forceAngleRad = force.angle * Math.PI / 180;
        appliedParallel += force.magnitude * Math.cos(forceAngleRad - angleRad);
    });
    // Net force with proper static/kinetic friction
    let netForce = 0;
    let frictionForce = 0;
    const velocityThreshold = 0.01;
    if (Math.abs(block.velocity) < velocityThreshold && block.isStationary) {
        // STATIC FRICTION CASE
        const forceWithoutFriction = appliedParallel - weightParallel;
        
        if (Math.abs(forceWithoutFriction) <= maxStaticFriction) {
            frictionForce = -forceWithoutFriction;
            netForce = 0;
            block.velocity = 0;
        } else {
            block.isStationary = false;
            frictionForce = -maxStaticFriction * Math.sign(forceWithoutFriction);
            netForce = forceWithoutFriction + frictionForce;
        }
    } else {
        // KINETIC FRICTION CASE
        block.isStationary = false;
        
        if (Math.abs(block.velocity) > velocityThreshold) {
            frictionForce = -maxStaticFriction * Math.sign(block.velocity);
        } else {
            const forceDirection = Math.sign(appliedParallel - weightParallel);
            frictionForce = -maxStaticFriction * forceDirection;
        }
        
        netForce = appliedParallel - weightParallel + frictionForce;
        if (Math.abs(block.velocity) < velocityThreshold && Math.abs(netForce) < 0.1) {
            block.velocity = 0;
            block.isStationary = true;
            netForce = 0;
            frictionForce = -(appliedParallel - weightParallel);
        }
    }
    
    // Acceleration from F = mass * acceleration
    const acceleration = block.mass > 0 ? netForce / block.mass : 0;
    let totalDistance = 0;
    blocks.forEach(b => {
        totalDistance += Math.abs(b.position - 100);
    });
    document.getElementById('weight').textContent = weight.toFixed(2) + ' N';
    document.getElementById('normal').textContent = normal.toFixed(2) + ' N';
    document.getElementById('frictionForce').textContent = Math.abs(frictionForce).toFixed(2) + ' N';
    document.getElementById('acceleration').textContent = acceleration.toFixed(2) + ' m/s²';
    document.getElementById('velocity').textContent = block.velocity.toFixed(2) + ' m/s';
    document.getElementById('distance').textContent = (totalDistance / PIXELS_PER_METER).toFixed(2) + ' m';
    
    return { 
        weight, 
        normal, 
        frictionForce: Math.abs(frictionForce), 
        frictionDirection: Math.sign(frictionForce),
        acceleration, 
        weightParallel, 
        weightPerpendicular,
        netForce
    };
}


function getThemeColors() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    return {
        bg: isDark ? '#0a0a0a' : '#ffffff',
        gridLine: isDark ? '#ffffff08' : '#00000008',
        incline: isDark ? '#2a2a2a' : '#d0d0d0',
        inclineBorder: isDark ? '#404040' : '#b0b0b0',
        block: isDark ? '#4dabf7' : '#1971c2',
        blockBorder: isDark ? '#339af0' : '#1864ab',
        ground: isDark ? '#1a1a1a' : '#e5e5e5',
        text: isDark ? '#ffffff' : '#000000',
        textBg: isDark ? '#0a0a0acc' : '#ffffffcc',
        arrow: isDark ? '#ffffff' : '#000000',
        weight: '#ff6b6b',
        normal: '#4dabf7',
        friction: '#ffd43b',
        applied: '#51cf66'
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
    const groundY = centerY + 150;
    ctx.fillStyle = colors.ground;
    ctx.fillRect(-panX/zoom, groundY, canvas.width/zoom, 50/zoom);
    ctx.strokeStyle = colors.inclineBorder;
    ctx.lineWidth = 2/zoom;
    ctx.beginPath();
    ctx.moveTo(-panX/zoom, groundY);
    ctx.lineTo((canvas.width - panX)/zoom, groundY);
    ctx.stroke();
    const angleRad = angle * Math.PI / 180;
    const inclineStartX = centerX - INCLINE_LENGTH / 2;
    const inclineStartY = groundY;
    ctx.save();
    ctx.translate(inclineStartX, inclineStartY);
    ctx.rotate(-angleRad);
    ctx.fillStyle = colors.incline;
    ctx.fillRect(0, -INCLINE_THICKNESS, INCLINE_LENGTH, INCLINE_THICKNESS);
    ctx.strokeStyle = colors.inclineBorder;
    ctx.lineWidth = 3/zoom;
    ctx.strokeRect(0, -INCLINE_THICKNESS, INCLINE_LENGTH, INCLINE_THICKNESS);
    ctx.strokeStyle = colors.inclineBorder + '40';
    ctx.lineWidth = 1/zoom;
    for (let i = 0; i < INCLINE_LENGTH; i += 30) {
        ctx.beginPath();
        ctx.moveTo(i, -INCLINE_THICKNESS);
        ctx.lineTo(i, 0);
        ctx.stroke();
    }
    ctx.restore();
    blocks.forEach((block, index) => {
        const blockPos = block.position;
        const blockLocalY = -INCLINE_THICKNESS - BLOCK_SIZE / 2;
        const blockWorldX = inclineStartX + Math.cos(-angleRad) * blockPos - Math.sin(-angleRad) * blockLocalY;
        const blockWorldY = inclineStartY + Math.sin(-angleRad) * blockPos + Math.cos(-angleRad) * blockLocalY;
        if (index === selectedBlock) {
            ctx.strokeStyle = colors.applied;
            ctx.lineWidth = 4/zoom;
            ctx.strokeRect(blockWorldX - BLOCK_SIZE/2 - 5, blockWorldY - BLOCK_SIZE/2 - 5, BLOCK_SIZE + 10, BLOCK_SIZE + 10);
        }
        
        ctx.fillStyle = colors.block;
        ctx.fillRect(blockWorldX - BLOCK_SIZE/2, blockWorldY - BLOCK_SIZE/2, BLOCK_SIZE, BLOCK_SIZE);
        
        ctx.strokeStyle = colors.blockBorder;
        ctx.lineWidth = 3/zoom;
        ctx.strokeRect(blockWorldX - BLOCK_SIZE/2, blockWorldY - BLOCK_SIZE/2, BLOCK_SIZE, BLOCK_SIZE);
        
        ctx.fillStyle = colors.text;
        ctx.font = `bold ${14/zoom}px Inter`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${block.mass}kg`, blockWorldX, blockWorldY);
        
        block.appliedForces.forEach((force, fIndex) => {
            const forceAngleRad = force.angle * Math.PI / 180;
            const forceScale = 3;
            const forceEndX = blockWorldX + Math.cos(forceAngleRad) * force.magnitude * forceScale;
            const forceEndY = blockWorldY - Math.sin(forceAngleRad) * force.magnitude * forceScale;
            drawArrow(ctx, blockWorldX, blockWorldY, forceEndX, forceEndY, colors.applied, `F${fIndex + 1}`, zoom);
        });
    });
    
    // Draw force vectors for selected block
    const selectedBlockObj = blocks[selectedBlock];
    const blockPos = selectedBlockObj.position;
    const blockLocalY = -INCLINE_THICKNESS - BLOCK_SIZE / 2;
    const blockWorldX = inclineStartX + Math.cos(-angleRad) * blockPos - Math.sin(-angleRad) * blockLocalY;
    const blockWorldY = inclineStartY + Math.sin(-angleRad) * blockPos + Math.cos(-angleRad) * blockLocalY;
    
    const forces = calculateForces();
    const forceScale = 3;
    drawArrow(ctx, blockWorldX, blockWorldY, blockWorldX, blockWorldY + forces.weight * forceScale, colors.weight, 'W', zoom);
    const normalEndX = blockWorldX - Math.sin(angleRad) * forces.normal * forceScale;
    const normalEndY = blockWorldY - Math.cos(angleRad) * forces.normal * forceScale;
    drawArrow(ctx, blockWorldX, blockWorldY, normalEndX, normalEndY, colors.normal, 'N', zoom);
    if (forces.frictionForce > 0.01) {
        const frictionEndX = blockWorldX + Math.cos(angleRad) * forces.frictionForce * forceScale * forces.frictionDirection;
        const frictionEndY = blockWorldY - Math.sin(angleRad) * forces.frictionForce * forceScale * forces.frictionDirection;
        drawArrow(ctx, blockWorldX, blockWorldY, frictionEndX, frictionEndY, colors.friction, 'f', zoom);
    }
    
    ctx.strokeStyle = colors.text + '60';
    ctx.lineWidth = 2/zoom;
    ctx.beginPath();
    const arcRadius = 60;
    ctx.arc(inclineStartX, inclineStartY, arcRadius, -angleRad, 0, false);
    ctx.stroke();
    const labelAngle = -angleRad / 2;
    const labelX = inclineStartX + Math.cos(labelAngle) * (arcRadius + 20);
    const labelY = inclineStartY + Math.sin(labelAngle) * (arcRadius + 20);
    
    ctx.fillStyle = colors.textBg;
    const labelWidth = 50;
    const labelHeight = 24;
    ctx.fillRect(labelX - labelWidth/2, labelY - labelHeight/2, labelWidth, labelHeight);
    
    ctx.strokeStyle = colors.text + '30';
    ctx.lineWidth = 1/zoom;
    ctx.strokeRect(labelX - labelWidth/2, labelY - labelHeight/2, labelWidth, labelHeight);
    


    ctx.fillStyle = colors.text;
    ctx.font = `bold ${12/zoom}px Inter`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`θ = ${angle}°`, labelX, labelY);
    ctx.restore();
}





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

// FIXED ANIMATION WITH PROPER TIME STEP
function animate() {
    if (!isAnimating) return;
    
    const currentTime = performance.now();
    const dt = Math.min((currentTime - lastTime) / 1000, 0.033); 
    lastTime = currentTime;
    time += dt;
    const angleRad = angle * Math.PI / 180;
    blocks.forEach((block, index) => {
        const prevSelected = selectedBlock;
        selectedBlock = index;
        const weight = block.mass * gravity;
        const weightParallel = weight * Math.sin(angleRad);
        const weightPerpendicular = weight * Math.cos(angleRad);
        let normalFromApplied = 0;
        block.appliedForces.forEach(force => {
            const forceAngleRad = force.angle * Math.PI / 180;
            normalFromApplied += force.magnitude * Math.sin(forceAngleRad - angleRad);
        });
        const normal = weightPerpendicular + normalFromApplied;
        const frictionMagnitude = friction * Math.abs(normal);
        let appliedParallel = 0;
        block.appliedForces.forEach(force => {
            const forceAngleRad = force.angle * Math.PI / 180;
            appliedParallel += force.magnitude * Math.cos(forceAngleRad - angleRad);
        });
        let netForce = 0;
        const velocityThreshold = 0.01;
        
        if (Math.abs(block.velocity) < velocityThreshold && block.isStationary) {
            // Check static friction
            const forceWithoutFriction = appliedParallel - weightParallel;
            
            if (Math.abs(forceWithoutFriction) <= frictionMagnitude) {
                // Static friction holds
                netForce = 0;
                block.velocity = 0;
            } else {
                // Overcome static friction
                block.isStationary = false;
                const frictionForce = -frictionMagnitude * Math.sign(forceWithoutFriction);
                netForce = forceWithoutFriction + frictionForce;
            }
        } else {
            // Kinetic friction
            block.isStationary = false;
            const frictionForce = -frictionMagnitude * Math.sign(block.velocity);
            netForce = appliedParallel - weightParallel + frictionForce;
        }
        const acceleration = block.mass > 0 ? netForce / block.mass : 0;
        block.velocity += acceleration * dt;
        
        // FIXED THIS BUG FSKLDFJASKLJS OMG FUKC position is in pixels not meters
        block.position += block.velocity * dt * PIXELS_PER_METER;
        if (Math.abs(block.velocity) < velocityThreshold && Math.abs(netForce) < 0.1) {
            block.velocity = 0;
            block.isStationary = true;
        }
        if (block.position <= 0) {
            block.position = 0;
            if (block.velocity < 0) {
                block.velocity = -block.velocity * 0.4;
                if (Math.abs(block.velocity) < 0.1) {
                    block.velocity = 0;
                    block.isStationary = true;
                }
            }
        } else if (block.position >= INCLINE_LENGTH) {
            block.position = INCLINE_LENGTH;
            if (block.velocity > 0) {
                block.velocity = -block.velocity * 0.4;
                if (Math.abs(block.velocity) < 0.1) {
                    block.velocity = 0;
                    block.isStationary = true;
                }
            }
        }
        
        selectedBlock = prevSelected;
    });
    
    // IMPROVED COLLISION DETECTION AND RESPONSE
    for (let i = 0; i < blocks.length; i++) {
        for (let j = i + 1; j < blocks.length; j++) {
            const block1 = blocks[i];
            const block2 = blocks[j];
            const dist = Math.abs(block1.position - block2.position);
            if (dist < BLOCK_SIZE) {
                const overlap = BLOCK_SIZE - dist;
                const totalMass = block1.mass + block2.mass;
                const block1Ratio = block2.mass / totalMass;
                const block2Ratio = block1.mass / totalMass;
                if (block1.position < block2.position) {
                    block1.position -= overlap * block1Ratio;
                    block2.position += overlap * block2Ratio;
                } else {
                    block1.position += overlap * block1Ratio;
                    block2.position -= overlap * block2Ratio;
                }
                


                const v1 = block1.velocity;
                const v2 = block2.velocity;
                const m1 = block1.mass;
                const m2 = block2.mass;
                
                const relativeVelocity = v1 - v2;
                if ((block1.position < block2.position && relativeVelocity > 0) ||
                    (block1.position > block2.position && relativeVelocity < 0)) {
                    
                    // Coefficient of restitution 0 means perfectly inelastic and 1 means perfectly elastic
                    const restitution = 0.7;
                    block1.velocity = ((m1 - restitution * m2) * v1 + (1 + restitution) * m2 * v2) / (m1 + m2);
                    block2.velocity = ((m2 - restitution * m1) * v2 + (1 + restitution) * m1 * v1) / (m1 + m2);
                    block1.isStationary = false;
                    block2.isStationary = false;
                    // Stop very slow blocks
                    if (Math.abs(block1.velocity) < 0.05) {
                        block1.velocity = 0;
                        block1.isStationary = true;
                    }
                    if (Math.abs(block2.velocity) < 0.05) {
                        block2.velocity = 0;
                        block2.isStationary = true;
                    }
                }
            }
        }
    }
    

    calculateForces();
    draw();
    
    if (isAnimating) {
        animationFrame = requestAnimationFrame(animate);
    }
}





setTimeout(() => {
    calculateForces();
    updateZoomDisplay();
    updateForcesList();
    draw();
}, 100);