// Physics constants
const BLOCK_SIZE = 60;
const SURFACE_HEIGHT = 40;

// State variables
let blocks = [{
    id: 1,
    mass: 10,
    position: { x: 0, y: -(BLOCK_SIZE / 2) }, // the block should always start on the surface not in the middle 
    velocity: { x: 0, y: 0 },
    appliedForces: [],
    onSurface: true
}];
let selectedBlock = 0;
let gravity = 9.8;
let friction = 0.3;
let surfaceAngle = 0;
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

// Dragging state for force vectors and blocks
let draggedForce = null;
let draggedBlock = null;
let dragOffset = { x: 0, y: 0 };


const RESTITUTION = 0.3; // Bounciness (0 measn no bounce 1 means perfectly elastic) can change accordingly

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



const massInput = document.getElementById('mass');
const gravityInput = document.getElementById('gravity');
const frictionInput = document.getElementById('friction');
const angleSlider = document.getElementById('angle');
const angleDisplay = document.getElementById('angleDisplay');
const addForceBtn = document.getElementById('addForceBtn');
const addBlockBtn = document.getElementById('addBlockBtn');
const simulateBtn = document.getElementById('simulateBtn');
const resetBtn = document.getElementById('resetBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const resetViewBtn = document.getElementById('resetViewBtn');
const zoomDisplay = document.getElementById('zoomDisplay');

// Event listeners
massInput.addEventListener('change', () => {
    blocks[selectedBlock].mass = parseFloat(massInput.value);
    calculateForces();
    draw();
});

addBlockBtn.addEventListener('click', () => {
    const newX = (blocks.length * 100) - 50; 
    const angleRad = surfaceAngle * Math.PI / 180; 
    const surfaceY = newX * Math.tan(angleRad); 
    const spawnY = surfaceY - (BLOCK_SIZE / 2) - 150; 

    const newBlock = {
        id: blocks.length + 1,
        mass: 10,
        position: { x: newX, y: spawnY }, 
        velocity: { x: 0, y: 0 },
        appliedForces: [],
        onSurface: false 
    };
    blocks.push(newBlock);
    selectedBlock = blocks.length - 1;
    massInput.value = blocks[selectedBlock].mass;
    updateForcesList();
    calculateForces();
    draw();
});

gravityInput.addEventListener('change', () => {
    gravity = parseFloat(gravityInput.value);
    calculateForces();
    draw();
});


frictionInput.addEventListener('change', () => {
    friction = parseFloat(frictionInput.value);
    calculateForces();
    draw();
});
angleSlider.addEventListener('input', () => {
    surfaceAngle = parseFloat(angleSlider.value);
    angleDisplay.textContent = surfaceAngle + '°';
    calculateForces();
    draw();
});

addForceBtn.addEventListener('click', () => {
    addForce();
});

simulateBtn.addEventListener('click', () => {
    if (isAnimating) {
        isAnimating = false;
        cancelAnimationFrame(animationFrame);
        simulateBtn.innerHTML = '<i class="fa-solid fa-play"></i> Simulate';
    } else {
        isAnimating = true;
        simulateBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        animate();
    }
});

resetBtn.addEventListener('click', () => {
    isAnimating = false;
    cancelAnimationFrame(animationFrame);
    const angleRad = surfaceAngle * Math.PI / 180;
    blocks.forEach((block, index) => {
        const newX = (index * 100) - 50; 
        const surfaceY = newX * Math.tan(angleRad); 
        block.position = { x: newX, y: surfaceY - (BLOCK_SIZE / 2) }; 
        block.velocity = { x: 0, y: 0 };
        block.onSurface = true;
    });
    time = 0;
    simulateBtn.innerHTML = '<i class="fa-solid fa-play"></i> Simulate';
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

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - panX) / zoom;
    const mouseY = (e.clientY - rect.top - panY) / zoom;
    
    const centerX = canvas.width / (2 * zoom);
    const centerY = canvas.height / (2 * zoom);
    
    // Check if clicking on a force vector first (higher priority)
    const block = blocks[selectedBlock];
    const blockX = centerX + block.position.x;
    const blockY = centerY + block.position.y;
    
    for (let i = 0; i < block.appliedForces.length; i++) {
        const force = block.appliedForces[i];
        const angleRad = force.angle * Math.PI / 180;
        const forceScale = 2;
        const endX = blockX + Math.cos(angleRad) * force.magnitude * forceScale;
        const endY = blockY - Math.sin(angleRad) * force.magnitude * forceScale;
        
        const dist = Math.sqrt((mouseX - endX) ** 2 + (mouseY - endY) ** 2);
        if (dist < 15) {
            draggedForce = i;
            dragOffset = { x: mouseX - endX, y: mouseY - endY };
            canvas.style.cursor = 'grabbing';
            return;
        }
    }
    
    // Check if the user is clicking on a block
    for (let i = 0; i < blocks.length; i++) {
        const checkBlock = blocks[i];
        const checkBlockX = centerX + checkBlock.position.x;
        const checkBlockY = centerY + checkBlock.position.y;
        
        if (mouseX >= checkBlockX - BLOCK_SIZE/2 && mouseX <= checkBlockX + BLOCK_SIZE/2 &&
            mouseY >= checkBlockY - BLOCK_SIZE/2 && mouseY <= checkBlockY + BLOCK_SIZE/2) {
            selectedBlock = i;
            massInput.value = checkBlock.mass;
            updateForcesList();
            
            // Start dragging the block if moving
            draggedBlock = i;
            dragOffset = {
                x: mouseX - checkBlock.position.x,
                y: mouseY - checkBlock.position.y
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
        const block = blocks[selectedBlock];
        const blockX = centerX + block.position.x;
        const blockY = centerY + block.position.y;
        const dx = mouseX - blockX;
        const dy = blockY - mouseY;
        const magnitude = Math.sqrt(dx * dx + dy * dy) / 2;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        block.appliedForces[draggedForce].magnitude = Math.max(0, Math.round(magnitude * 10) / 10);
        block.appliedForces[draggedForce].angle = Math.round(angle);
        updateForcesList();
        calculateForces();
        draw();
    } else if (draggedBlock !== null) {
        // Drag the block (disable physics simulator while dragging any block)
        blocks[draggedBlock].position.x = mouseX - dragOffset.x;
        blocks[draggedBlock].position.y = mouseY - dragOffset.y;
        blocks[draggedBlock].velocity = { x: 0, y: 0 };
        
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
        for (let checkBlock of blocks) {
            const checkBlockX = centerX + checkBlock.position.x;
            const checkBlockY = centerY + checkBlock.position.y;
            
            if (mouseX >= checkBlockX - BLOCK_SIZE/2 && mouseX <= checkBlockX + BLOCK_SIZE/2 &&
                mouseY >= checkBlockY - BLOCK_SIZE/2 && mouseY <= checkBlockY + BLOCK_SIZE/2) {
                overBlock = true;
                break;
            }
        }
        const block = blocks[selectedBlock];
        const blockX = centerX + block.position.x;
        const blockY = centerY + block.position.y;
        
        for (let force of block.appliedForces) {
            const angleRad = force.angle * Math.PI / 180;
            const forceScale = 2;
            const endX = blockX + Math.cos(angleRad) * force.magnitude * forceScale;
            const endY = blockY - Math.sin(angleRad) * force.magnitude * forceScale;
            const dist = Math.sqrt((mouseX - endX) ** 2 + (mouseY - endY) ** 2);
            if (dist < 15) {
                overForce = true;
                break;
            }
        }
        canvas.style.cursor = overForce ? 'grab' : (overBlock ? 'grab' : (zoom > 1 ? 'grab' : 'crosshair'));
    }
});

canvas.addEventListener('mouseup', () => {
    isPanning = false;
    draggedForce = null;
    draggedBlock = null;
    canvas.style.cursor = zoom > 1 ? 'grab' : 'crosshair';
});

canvas.addEventListener('mouseleave', () => {
    isPanning = false;
    draggedForce = null;
    draggedBlock = null;
    canvas.style.cursor = 'crosshair';
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

function addForce() {
    const forceId = Date.now();
    blocks[selectedBlock].appliedForces.push({
        id: forceId,
        magnitude: 20,
        angle: 0
    });
    updateForcesList();
    calculateForces();
    draw();
}

function removeForce(id) {
    blocks[selectedBlock].appliedForces = blocks[selectedBlock].appliedForces.filter(f => f.id !== id);
    updateForcesList();
    calculateForces();
    draw();
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

function updateForce(id, property, value) {
    const block = blocks[selectedBlock];
    const force = block.appliedForces.find(f => f.id === id);
    if (force) {
        force[property] = parseFloat(value);
        calculateForces();
        draw();
    }
}
window.removeForce = removeForce;
window.updateForce = updateForce;

// Check if the block is on surface
function isBlockOnSurface(block) {
    const angleRad = surfaceAngle * Math.PI / 180;
    const surfaceY = block.position.x * Math.tan(angleRad);
    const onSurfaceY = surfaceY - (BLOCK_SIZE / 2);
    return block.position.y >= onSurfaceY - 2;
}


function calculateForces() {
    const block = blocks[selectedBlock];
    const angleRad = surfaceAngle * Math.PI / 180;
    
    block.onSurface = isBlockOnSurface(block);
    
    // Weight (always present even in air)
    const weight = block.mass * gravity;
    
    let normal = 0;
    let maxFriction = 0;
    let weightParallel = 0;
    let weightPerpendicular = 0;
    
    if (block.onSurface) {
        // Weight components when on surface
        weightParallel = weight * Math.sin(angleRad);
        weightPerpendicular = weight * Math.cos(angleRad);
        
        // Normal force (only when on surface otherwise block free falls)
        normal = weightPerpendicular;
        
        // Friction force (only when on surface)
        maxFriction = friction * normal;
    }
    
    let appliedForceX = 0;
    let appliedForceY = 0;
    
    block.appliedForces.forEach(force => {
        const fAngleRad = force.angle * Math.PI / 180;
        appliedForceX += force.magnitude * Math.cos(fAngleRad);
        appliedForceY -= force.magnitude * Math.sin(fAngleRad);
    });
    
    let netForceX = 0;
    let netForceY = 0;
    let frictionForce = 0;
    
    if (block.onSurface) {
        // Net force parallel to surface
        let netParallel = appliedForceX * Math.cos(angleRad) + appliedForceY * Math.sin(angleRad) - weightParallel;
        if (Math.abs(netParallel) > maxFriction) {
            frictionForce = maxFriction * Math.sign(netParallel);
            netParallel -= frictionForce;
        } else if (!isAnimating || Math.abs(block.velocity.x) < 0.1) {
            frictionForce = netParallel;
            netParallel = 0;
        }
        
        // Net forces in x and y
        netForceX = netParallel * Math.cos(angleRad);
        netForceY = netParallel * Math.sin(angleRad);
    } else {
        // while in the air only gravity and applied forces so 2 vectors
        netForceX = appliedForceX;
        netForceY = appliedForceY + weight;
    }
    


    const netMagnitude = Math.sqrt(netForceX ** 2 + netForceY ** 2);
    const acceleration = netMagnitude / block.mass;
    document.getElementById('netForceX').textContent = netForceX.toFixed(2) + ' N';
    document.getElementById('netForceY').textContent = netForceY.toFixed(2) + ' N';
    document.getElementById('netMagnitude').textContent = netMagnitude.toFixed(2) + ' N';
    document.getElementById('acceleration').textContent = acceleration.toFixed(2) + ' m/s²';
    
    // Update FBD in stats section
    drawFBDInStats({ weight, normal, frictionForce });
    
    return { netForceX, netForceY, weight, normal, frictionForce, weightParallel, weightPerpendicular };
}

// Draw FBD in the stats section
function drawFBDInStats(forces) {
    const fbdCanvas = document.getElementById('fbdCanvas');
    if (!fbdCanvas) return;
    
    const fbdCtx = fbdCanvas.getContext('2d');
    const width = fbdCanvas.width;
    const height = fbdCanvas.height;
    
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const colors = {
        bg: isDark ? '#0a0a0a' : '#ffffff',
        block: isDark ? '#2a2a2a' : '#d0d0d0',
        blockBorder: isDark ? '#404040' : '#b0b0b0',
        text: isDark ? '#ffffff' : '#000000',
        gravity: '#ff6b6b',
        normal: '#4dabf7',
        friction: '#ffd43b',
        applied: '#51cf66'
    };
    fbdCtx.fillStyle = colors.bg;
    fbdCtx.fillRect(0, 0, width, height);
    const centerX = width / 2;
    const centerY = height / 2;
    const blockSize = 40;
    const scale = 0.6;
    fbdCtx.fillStyle = colors.block;
    fbdCtx.fillRect(centerX - blockSize/2, centerY - blockSize/2, blockSize, blockSize);
    fbdCtx.strokeStyle = colors.blockBorder;
    fbdCtx.lineWidth = 2;
    fbdCtx.strokeRect(centerX - blockSize/2, centerY - blockSize/2, blockSize, blockSize);
    const block = blocks[selectedBlock];
    // Weight is always present
    drawArrowSimple(fbdCtx, centerX, centerY, centerX, centerY + forces.weight * scale, colors.gravity, 'W');
    
    // Normal is only present if on surface
    if (block.onSurface && forces.normal > 0) {
        drawArrowSimple(fbdCtx, centerX, centerY, centerX, centerY - forces.normal * scale, colors.normal, 'N');
    }
    
    // Friction is only present if on surface just like normal 
    if (block.onSurface && Math.abs(forces.frictionForce) > 0.01) {
        drawArrowSimple(fbdCtx, centerX, centerY, centerX - forces.frictionForce * scale, centerY, colors.friction, 'f');
    }
    
    block.appliedForces.forEach((force, index) => {
        const fAngleRad = force.angle * Math.PI / 180;
        const endX = centerX + Math.cos(fAngleRad) * force.magnitude * scale;
        const endY = centerY - Math.sin(fAngleRad) * force.magnitude * scale;
        drawArrowSimple(fbdCtx, centerX, centerY, endX, endY, colors.applied, `F${index + 1}`);
    });
}

function drawArrowSimple(ctx, x1, y1, x2, y2, color, label) {
    const headLength = 10;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.5;
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
    ctx.font = 'bold 12px Inter';
    ctx.fillStyle = color;
    ctx.fillText(label, x2 + 8, y2 - 8);
}
function getThemeColors() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    return {
        bg: isDark ? '#0a0a0a' : '#ffffff',
        ground: isDark ? '#1a1a1a' : '#e5e5e5',
        gridLine: isDark ? '#ffffff08' : '#00000008',
        block: isDark ? '#2a2a2a' : '#d0d0d0',
        blockBorder: isDark ? '#404040' : '#b0b0b0',
        arrow: isDark ? '#ffffff' : '#000000',
        text: isDark ? '#ffffff' : '#000000',
        textBg: isDark ? '#0a0a0acc' : '#ffffffcc',
        gravity: '#ff6b6b',
        normal: '#4dabf7',
        friction: '#ffd43b',
        applied: '#51cf66',
        inAir: '#9775fa'
    };
}

// Check collision between two blocks function
function checkBlockCollision(block1, block2) {
    const dx = block1.position.x - block2.position.x;
    const dy = block1.position.y - block2.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = BLOCK_SIZE;
    
    return distance < minDistance;
}

// Resolve collision func
function resolveBlockCollision(block1, block2) {
    const dx = block1.position.x - block2.position.x;
    const dy = block1.position.y - block2.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return;
    const minDistance = BLOCK_SIZE;
    const overlap = minDistance - distance;
    const separationX = (dx / distance) * overlap / 2;
    const separationY = (dy / distance) * overlap / 2;
    
    block1.position.x += separationX;
    block1.position.y += separationY;
    block2.position.x -= separationX;
    block2.position.y -= separationY;
    
    // Calculate relative velocity
    const relVelX = block1.velocity.x - block2.velocity.x;
    const relVelY = block1.velocity.y - block2.velocity.y;
    const normalX = dx / distance;
    const normalY = dy / distance;
    const velAlongNormal = relVelX * normalX + relVelY * normalY;
    
    // Dont resolve if velocities are separating
    if (velAlongNormal > 0) return;
    
    // Calculate impulse
    const totalMass = block1.mass + block2.mass;
    const impulse = -(1 + RESTITUTION) * velAlongNormal / (1/block1.mass + 1/block2.mass);
    
    // Apply impulse
    const impulseX = impulse * normalX;
    const impulseY = impulse * normalY;
    
    block1.velocity.x += impulseX / block1.mass;
    block1.velocity.y += impulseY / block1.mass;
    block2.velocity.x -= impulseX / block2.mass;
    block2.velocity.y -= impulseY / block2.mass;
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
    const centerY = canvas.height / (2 * zoom);
    
    // Draw inclined surface
    const surfaceLength = Math.max(canvas.width, canvas.height) * 3 / zoom;
    const angleRad = surfaceAngle * Math.PI / 180;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(-angleRad);
    
    // Surface
    ctx.fillStyle = colors.ground;
    ctx.fillRect(-surfaceLength/2, 0, surfaceLength, SURFACE_HEIGHT);
    
    ctx.strokeStyle = colors.blockBorder;
    ctx.lineWidth = 2/zoom;
    ctx.strokeRect(-surfaceLength/2, 0, surfaceLength, SURFACE_HEIGHT);
    
    // Draw pattern on surface
    ctx.strokeStyle = colors.blockBorder + '40';
    ctx.lineWidth = 1/zoom;
    for (let i = -surfaceLength/2; i < surfaceLength/2; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, SURFACE_HEIGHT);
        ctx.stroke();
    }
    
    ctx.restore();
    blocks.forEach((block, index) => {
        const blockX = centerX + block.position.x;
        const blockY = centerY + block.position.y;
        
        ctx.save();
        ctx.translate(blockX, blockY);
        ctx.rotate(-angleRad);
        
        // Highlight selected block
        if (index === selectedBlock) {
            ctx.strokeStyle = colors.applied;
            ctx.lineWidth = 4/zoom;
            ctx.strokeRect(-BLOCK_SIZE/2 - 5, -BLOCK_SIZE/2 - 5, BLOCK_SIZE + 10, BLOCK_SIZE + 10);
        }
        
        // Color block diffeerntly if in air
        if (block.onSurface) {
            ctx.fillStyle = colors.block;
        } else {
            ctx.fillStyle = colors.inAir;
        }
        ctx.fillRect(-BLOCK_SIZE/2, -BLOCK_SIZE/2, BLOCK_SIZE, BLOCK_SIZE);
        
        ctx.strokeStyle = colors.blockBorder;
        ctx.lineWidth = 2/zoom;
        ctx.strokeRect(-BLOCK_SIZE/2, -BLOCK_SIZE/2, BLOCK_SIZE, BLOCK_SIZE);
        
        // Blcok number
        ctx.fillStyle = colors.text;
        ctx.font = `bold ${16/zoom}px Inter`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${index + 1}`, 0, 0);
        
        if (!block.onSurface) {
            ctx.font = `${10/zoom}px Inter`;
            ctx.fillStyle = colors.inAir;
            ctx.fillText('IN AIR', 0, 20);
        }
        
        ctx.restore();
    });
    
    // Calculate and draw forces for selected block
    const selectedBlockObj = blocks[selectedBlock];
    const blockX = centerX + selectedBlockObj.position.x;
    const blockY = centerY + selectedBlockObj.position.y;
    const forces = calculateForces();
    const forceScale = 2;
    
    drawArrow(ctx, blockX, blockY, blockX, blockY + forces.weight * forceScale, colors.gravity, 'Weight');
    
    if (selectedBlockObj.onSurface && forces.normal > 0) {
        const normalEndX = blockX - Math.sin(angleRad) * forces.normal * forceScale;
        const normalEndY = blockY - Math.cos(angleRad) * forces.normal * forceScale;
        drawArrow(ctx, blockX, blockY, normalEndX, normalEndY, colors.normal, 'Normal');
    }
    
    if (selectedBlockObj.onSurface && Math.abs(forces.frictionForce) > 0.01) {
        const frictionEndX = blockX - Math.cos(angleRad) * forces.frictionForce * forceScale * Math.sign(forces.frictionForce);
        const frictionEndY = blockY - Math.sin(angleRad) * forces.frictionForce * forceScale * Math.sign(forces.frictionForce);
        drawArrow(ctx, blockX, blockY, frictionEndX, frictionEndY, colors.friction, 'Friction');
    }
    selectedBlockObj.appliedForces.forEach((force, index) => {
        const fAngleRad = force.angle * Math.PI / 180;
        const endX = blockX + Math.cos(fAngleRad) * force.magnitude * forceScale;
        const endY = blockY - Math.sin(fAngleRad) * force.magnitude * forceScale;
        drawArrow(ctx, blockX, blockY, endX, endY, colors.applied, `F${index + 1}`);
    });
    
    ctx.restore();
}

function drawArrow(ctx, x1, y1, x2, y2, color, label) {
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

// Animation stuff
function animate() {
    if (!isAnimating) return;
    
    const dt = 0.016;
    time += dt;
    const angleRad = surfaceAngle * Math.PI / 180;
    
    blocks.forEach((block, index) => {
        const prevSelected = selectedBlock;
        selectedBlock = index;
        
        block.onSurface = isBlockOnSurface(block);
        
        const weight = block.mass * gravity;
        
        let netForceX = 0;
        let netForceY = 0;
        
        if (block.onSurface) {
            const weightParallel = weight * Math.sin(angleRad);
            const weightPerpendicular = weight * Math.cos(angleRad);
            const normal = weightPerpendicular;
            const maxFriction = friction * normal;
            let appliedForceX = 0;
            let appliedForceY = 0;
            
            block.appliedForces.forEach(force => {
                const fAngleRad = force.angle * Math.PI / 180;
                appliedForceX += force.magnitude * Math.cos(fAngleRad);
                appliedForceY -= force.magnitude * Math.sin(fAngleRad);
            });
            
            let netParallel = appliedForceX * Math.cos(angleRad) + appliedForceY * Math.sin(angleRad) - weightParallel;
            
            // Apply friction
            if (Math.abs(netParallel) > maxFriction) {
                const frictionForce = maxFriction * Math.sign(netParallel);
                netParallel -= frictionForce;
            } else if (Math.abs(block.velocity.x) < 0.1 && Math.abs(block.velocity.y) < 0.1) {
                netParallel = 0;
                block.velocity.x = 0;
                block.velocity.y = 0;
            }
            
            // Net forces in x and y
            netForceX = netParallel * Math.cos(angleRad);
            netForceY = netParallel * Math.sin(angleRad);
            
        } else {
            let appliedForceX = 0;
            let appliedForceY = 0;
            
            block.appliedForces.forEach(force => {
                const fAngleRad = force.angle * Math.PI / 180;
                appliedForceX += force.magnitude * Math.cos(fAngleRad);
                appliedForceY -= force.magnitude * Math.sin(fAngleRad);
            });
            
            netForceX = appliedForceX;
            netForceY = appliedForceY + weight;
        }
        
        // Update velocity and position
        const ax = netForceX / block.mass;
        const ay = netForceY / block.mass;
        

        block.velocity.x += ax * dt;
        block.velocity.y += ay * dt;
        block.position.x += block.velocity.x * dt * 50;
        block.position.y += block.velocity.y * dt * 50;
        
        // Check surface collision
        const angleRad = surfaceAngle * Math.PI / 180;
        const surfaceY = block.position.x * Math.tan(angleRad);
        



        if (block.position.y >= surfaceY - BLOCK_SIZE/2) {
            block.position.y = surfaceY - BLOCK_SIZE/2;
            
            // Bounce if hitting with significant velocity
            if (block.velocity.y > 0.5) {
                block.velocity.y = -block.velocity.y * RESTITUTION;
                block.velocity.x *= 0.9; // Some energy loss on impact just like real physics
            } else {
                block.velocity.y = 0;
            }
            
            block.onSurface = true;
        }
        
        selectedBlock = prevSelected;
    });
    
    // Check block to block collisions
    for (let i = 0; i < blocks.length; i++) {
        for (let j = i + 1; j < blocks.length; j++) {
            if (checkBlockCollision(blocks[i], blocks[j])) {
                resolveBlockCollision(blocks[i], blocks[j]);
            }
        }
    }
    
    // Recalculate for selected block display
    calculateForces();
    
    draw();
    animationFrame = requestAnimationFrame(animate);
}






setTimeout(() => {
    calculateForces();
    updateZoomDisplay();
    draw();
}, 100);