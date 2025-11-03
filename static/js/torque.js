// Main simulation variables
let beamLength = 6; 
let pivotPosition = 0.5; 
let gravity = 9.8;
let beamAngle = 0; 
let angularVelocity = 0;
let angularAcceleration = 0;
let isReleased = false;
let animationFrame = null;
let weights = [];
let zoom = 1;
let panX = 0;
let panY = 0;
let isPanning = false;
let lastMouseX = 0;
let lastMouseY = 0;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
let draggedWeight = null;
let draggedPivot = false;
let draggedBeam = false;
let dragOffset = 0;
let dragStartAngle = 0;




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



const beamLengthSlider = document.getElementById('beamLength');
const beamLengthDisplay = document.getElementById('beamLengthDisplay');
const pivotSlider = document.getElementById('pivotPosition');
const pivotDisplay = document.getElementById('pivotDisplay');
const gravityInput = document.getElementById('gravity');
const addWeightBtn = document.getElementById('addWeightBtn');
const releaseBtn = document.getElementById('releaseBtn');
const resetBtn = document.getElementById('resetBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const resetViewBtn = document.getElementById('resetViewBtn');
const zoomDisplay = document.getElementById('zoomDisplay');


beamLengthSlider.addEventListener('input', () => {
    beamLength = parseFloat(beamLengthSlider.value);
    beamLengthDisplay.textContent = beamLength + ' m';
    weights.forEach(w => {
        if (w.position > beamLength) w.position = beamLength;
        if (w.position < 0) w.position = 0;
    });
    calculateTorques();
    draw();
});



pivotSlider.addEventListener('input', () => {
    const val = parseFloat(pivotSlider.value);
    pivotPosition = val / 100;
    if (val < 20) {
        pivotDisplay.textContent = 'Left';
    } else if (val > 80) {
        pivotDisplay.textContent = 'Right';
    } else if (val >= 45 && val <= 55) {
        pivotDisplay.textContent = 'Center';
    } else if (val < 45) {
        pivotDisplay.textContent = 'Left of Center';
    } else {
        pivotDisplay.textContent = 'Right of Center';
    }
    calculateTorques();
    draw();
});



// Gravity input
gravityInput.addEventListener('change', () => {
    gravity = parseFloat(gravityInput.value);
    calculateTorques();
    draw();
});

// Add a new weight
addWeightBtn.addEventListener('click', () => {
    addWeight();
});

// Release button - let physics happen
releaseBtn.addEventListener('click', () => {
    if (isReleased) {
        isReleased = false;
        cancelAnimationFrame(animationFrame);
        releaseBtn.innerHTML = '<i class="fa-solid fa-play"></i> Release';
    } else {
        isReleased = true;
        releaseBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        animate();
    }
});



resetBtn.addEventListener('click', () => {
    isReleased = false;
    cancelAnimationFrame(animationFrame);
    beamAngle = 0;
    angularVelocity = 0;
    angularAcceleration = 0;
    releaseBtn.innerHTML = '<i class="fa-solid fa-play"></i> Release';
    calculateTorques();
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
    const scale = 50; 
    const pivotX = centerX + (pivotPosition * beamLength - beamLength / 2) * scale;
    const pivotY = centerY;
    const pivotDist = Math.sqrt((mouseX - pivotX) ** 2 + (mouseY - pivotY) ** 2);
    if (pivotDist < 25) {
        draggedPivot = true;
        canvas.style.cursor = 'grabbing';
        if (isReleased) {
            isReleased = false;
            cancelAnimationFrame(animationFrame);
            releaseBtn.innerHTML = '<i class="fa-solid fa-play"></i> Release';
        }
        return;
    }
    
    // Check if clicking on a weight
    for (let i = 0; i < weights.length; i++) {
        const w = weights[i];
        const relativePos = (w.position - pivotPosition * beamLength) * scale;
        
        const cos = Math.cos(beamAngle);
        const sin = Math.sin(beamAngle);
        const wx = pivotX + relativePos * cos;
        const wy = centerY + relativePos * sin;
        
        // Check both the weight box and the area near it
        const weightBoxDist = Math.sqrt((mouseX - wx) ** 2 + (mouseY - (wy + 55)) ** 2);
        const beamPointDist = Math.sqrt((mouseX - wx) ** 2 + (mouseY - wy) ** 2);
        
        if (weightBoxDist < 30 || beamPointDist < 25) {
            draggedWeight = i;
            // Calculate drag offset based on current beam position
            const beamX = (wx - pivotX) / cos;
            dragOffset = w.position - (beamX / scale + pivotPosition * beamLength);
            canvas.style.cursor = 'grabbing';
            if (isReleased) {
                isReleased = false;
                cancelAnimationFrame(animationFrame);
                releaseBtn.innerHTML = '<i class="fa-solid fa-play"></i> Release';
            }
            return;
        }
    }
    
    // Check if clicking on the beam itself for rotation
    const beamPixelLength = beamLength * scale;
    const beamLeftX = pivotX - (pivotPosition * beamLength) * scale * Math.cos(beamAngle);
    const beamLeftY = centerY - (pivotPosition * beamLength) * scale * Math.sin(beamAngle);
    const beamRightX = pivotX + ((1 - pivotPosition) * beamLength) * scale * Math.cos(beamAngle);
    const beamRightY = centerY + ((1 - pivotPosition) * beamLength) * scale * Math.sin(beamAngle);
    // Distance from point to line segment
    const beamLength2D = Math.sqrt((beamRightX - beamLeftX) ** 2 + (beamRightY - beamLeftY) ** 2);
    const t = Math.max(0, Math.min(1, ((mouseX - beamLeftX) * (beamRightX - beamLeftX) + (mouseY - beamLeftY) * (beamRightY - beamLeftY)) / (beamLength2D * beamLength2D)));
    const projX = beamLeftX + t * (beamRightX - beamLeftX);
    const projY = beamLeftY + t * (beamRightY - beamLeftY);
    const distToBeam = Math.sqrt((mouseX - projX) ** 2 + (mouseY - projY) ** 2);
    if (distToBeam < 15) {
        draggedBeam = true;
        dragStartAngle = Math.atan2(mouseY - centerY, mouseX - pivotX) - beamAngle;
        canvas.style.cursor = 'grabbing';
        if (isReleased) {
            isReleased = false;
            cancelAnimationFrame(animationFrame);
            releaseBtn.innerHTML = '<i class="fa-solid fa-play"></i> Release';
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
    const centerX = canvas.width / (2 * zoom);
    const centerY = canvas.height / (2 * zoom);
    const scale = 50;
    if (draggedPivot) {
        let newPivotPos = (mouseX - centerX) / scale + beamLength / 2;
        newPivotPos = Math.max(0, Math.min(beamLength, newPivotPos));
        pivotPosition = newPivotPos / beamLength;
        pivotSlider.value = Math.round(pivotPosition * 100);
        const val = pivotPosition * 100;
        if (val < 20) {
            pivotDisplay.textContent = 'Left';
        } else if (val > 80) {
            pivotDisplay.textContent = 'Right';
        } else if (val >= 45 && val <= 55) {
            pivotDisplay.textContent = 'Center';
        } else if (val < 45) {
            pivotDisplay.textContent = 'Left of Center';
        } else {
            pivotDisplay.textContent = 'Right of Center';
        }
        calculateTorques();
        draw();
    } else if (draggedBeam) {
        const pivotX = centerX + (pivotPosition * beamLength - beamLength / 2) * scale;
        const currentAngle = Math.atan2(mouseY - centerY, mouseX - pivotX);
        beamAngle = currentAngle - dragStartAngle;
        angularVelocity = 0;
        calculateTorques();
        draw();
    } else if (draggedWeight !== null) {
        const pivotX = centerX + (pivotPosition * beamLength - beamLength / 2) * scale;
        const dx = mouseX - pivotX;
        const dy = mouseY - centerY;
        const cos = Math.cos(beamAngle);
        const sin = Math.sin(beamAngle);
        const beamX = dx * cos + dy * sin;
        let newPos = (beamX / scale) + pivotPosition * beamLength;
        newPos = Math.max(0, Math.min(beamLength, newPos));
        weights[draggedWeight].position = newPos;



        updateWeightsList();
        calculateTorques();
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
        // Check if hovering over weight, pivot, or beam
        const pivotX = centerX + (pivotPosition * beamLength - beamLength / 2) * scale;
        const pivotY = centerY;
        
        const pivotDist = Math.sqrt((mouseX - pivotX) ** 2 + (mouseY - pivotY) ** 2);
        let overInteractive = pivotDist < 25;
        
        if (!overInteractive) {
            for (let w of weights) {
                const relativePos = (w.position - pivotPosition * beamLength) * scale;
                
                const cos = Math.cos(beamAngle);
                const sin = Math.sin(beamAngle);
                const wx = pivotX + relativePos * cos;
                const wy = centerY + relativePos * sin;
                
                const weightBoxDist = Math.sqrt((mouseX - wx) ** 2 + (mouseY - (wy + 55)) ** 2);
                const beamPointDist = Math.sqrt((mouseX - wx) ** 2 + (mouseY - wy) ** 2);
                
                if (weightBoxDist < 30 || beamPointDist < 25) {
                    overInteractive = true;
                    break;
                }
            }
        }
        
        if (!overInteractive) {
            const beamLeftX = pivotX - (pivotPosition * beamLength) * scale * Math.cos(beamAngle);
            const beamLeftY = centerY - (pivotPosition * beamLength) * scale * Math.sin(beamAngle);
            const beamRightX = pivotX + ((1 - pivotPosition) * beamLength) * scale * Math.cos(beamAngle);
            const beamRightY = centerY + ((1 - pivotPosition) * beamLength) * scale * Math.sin(beamAngle);
            const beamLength2D = Math.sqrt((beamRightX - beamLeftX) ** 2 + (beamRightY - beamLeftY) ** 2);
            const t = Math.max(0, Math.min(1, ((mouseX - beamLeftX) * (beamRightX - beamLeftX) + (mouseY - beamLeftY) * (beamRightY - beamLeftY)) / (beamLength2D * beamLength2D)));
            const projX = beamLeftX + t * (beamRightX - beamLeftX);
            const projY = beamLeftY + t * (beamRightY - beamLeftY);
            const distToBeam = Math.sqrt((mouseX - projX) ** 2 + (mouseY - projY) ** 2);
            if (distToBeam < 15) {
                overInteractive = true;
            }
        }
        
        canvas.style.cursor = overInteractive ? 'grab' : 'default';
    }
});



canvas.addEventListener('mouseup', () => {
    isPanning = false;
    draggedWeight = null;
    draggedPivot = false;
    draggedBeam = false;
    canvas.style.cursor = 'default';
});




canvas.addEventListener('mouseleave', () => {
    isPanning = false;
    draggedWeight = null;
    draggedPivot = false;
    draggedBeam = false;
    canvas.style.cursor = 'default';
});




canvas.addEventListener('contextmenu', (e) => e.preventDefault());

function addWeight() {
    const weightId = Date.now();
    weights.push({
        id: weightId,
        mass: 5,
        position: beamLength / 2 
    });
    updateWeightsList();
    calculateTorques();
    draw();
}




function removeWeight(id) {
    weights = weights.filter(w => w.id !== id);
    updateWeightsList();
    calculateTorques();
    draw();
}



function updateWeight(id, property, value) {
    const weight = weights.find(w => w.id === id);
    if (weight) {
        weight[property] = parseFloat(value);
        if (property === 'position') {
            weight.position = Math.max(0, Math.min(beamLength, weight.position));
        }
        
        calculateTorques();
        draw();
    }
}




function updateWeightsList() {
    const weightsList = document.getElementById('weightsList');
    weightsList.innerHTML = '';
    
    weights.forEach((weight, index) => {
        const weightItem = document.createElement('div');
        weightItem.className = 'weight-item';
        weightItem.innerHTML = `
            <div class="weight-header">
                <span class="weight-label">Weight ${index + 1}</span>
                <button class="remove-weight" onclick="removeWeight(${weight.id})">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
            <div class="weight-input-group">
                <input type="number" value="${weight.mass}" 
                       placeholder="Mass (kg)" 
                       min="0.1" max="50" step="0.5"
                       onchange="updateWeight(${weight.id}, 'mass', this.value)">
                <input type="number" value="${weight.position.toFixed(1)}" 
                       placeholder="Position (m)" 
                       min="0" max="${beamLength}" step="0.1"
                       onchange="updateWeight(${weight.id}, 'position', this.value)">
            </div>
        `;
        weightsList.appendChild(weightItem);
    });
}

window.removeWeight = removeWeight;

window.updateWeight = updateWeight;

function calculateTorques() {
    let clockwiseTorque = 0;
    let counterClockwiseTorque = 0;
    
    const pivotPos = pivotPosition * beamLength;
    
    weights.forEach(weight => {
        const r = weight.position - pivotPos; 
        const force = weight.mass * gravity;
        const torque = r * force * Math.cos(beamAngle); // TORQUE = radius × Force component in the angle
        
        if (torque > 0) {
            counterClockwiseTorque += torque;
        } else {
            clockwiseTorque += Math.abs(torque);
        }
    });
    
    const netTorque = counterClockwiseTorque - clockwiseTorque;
    document.getElementById('clockwiseTorque').textContent = clockwiseTorque.toFixed(2) + ' N⋅m';
    document.getElementById('counterClockwiseTorque').textContent = counterClockwiseTorque.toFixed(2) + ' N⋅m';
    document.getElementById('netTorque').textContent = netTorque.toFixed(2) + ' N⋅m';
    const isBalanced = Math.abs(netTorque) < 0.5;
    const statusEl = document.getElementById('equilibriumStatus');
    if (isBalanced) {
        statusEl.textContent = '✓ Balanced';
        statusEl.style.color = '#51cf66';
    } else {
        statusEl.textContent = '✗ Unbalanced';
        statusEl.style.color = '#ff6b6b';
    }
    return netTorque;
}



function getThemeColors() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    return {
        bg: isDark ? '#0a0a0a' : '#ffffff',
        gridLine: isDark ? '#ffffff08' : '#00000008',
        beam: isDark ? '#8b4513' : '#d2691e',
        pivot: isDark ? '#404040' : '#a0a0a0',
        weight: isDark ? '#4dabf7' : '#1c7ed6',
        text: isDark ? '#ffffff' : '#000000',
        textBg: isDark ? '#0a0a0acc' : '#ffffffcc',
        torqueClockwise: '#ff6b6b',
        torqueCounter: '#51cf66',
        rope: isDark ? '#ffd43b' : '#fab005'
    };
}

function drawArrow(ctx, x1, y1, x2, y2, color, label) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx ** 2 + dy ** 2);
    if (length < 5) return;
    const headLength = 15;
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
    ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), 
               y2 - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), 
               y2 - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    if (label) {
        ctx.font = `bold ${13 / zoom}px Inter`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.fillText(label, x2, y2 - 20);
    }
}

// Main drawing function
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
    const centerY = canvas.height / (2 * zoom);
    const scale = 50; 
    const pivotX = centerX + (pivotPosition * beamLength - beamLength / 2) * scale;
    const pivotY = centerY;
    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.rotate(beamAngle);
    const beamPixelLength = beamLength * scale;
    const beamLeftX = -(pivotPosition * beamLength) * scale;
    const beamRightX = ((1 - pivotPosition) * beamLength) * scale;
    ctx.fillStyle = colors.beam;
    ctx.fillRect(beamLeftX, -10, beamPixelLength, 20);
    ctx.strokeStyle = colors.text + '60';
    ctx.lineWidth = 2 / zoom;
    ctx.strokeRect(beamLeftX, -10, beamPixelLength, 20);
    ctx.restore();
    ctx.fillStyle = colors.pivot;
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colors.text;
    ctx.lineWidth = 2 / zoom;
    ctx.stroke();
    ctx.fillStyle = colors.pivot;
    ctx.fillRect(pivotX - 15, pivotY, 30, 60);
    ctx.strokeStyle = colors.text + '60';
    ctx.strokeRect(pivotX - 15, pivotY, 30, 60);
    weights.forEach((weight, index) => {
        const relativePos = (weight.position - pivotPosition * beamLength) * scale;
        const cos = Math.cos(beamAngle);
        const sin = Math.sin(beamAngle);
        const wx = pivotX + relativePos * cos;
        const wy = pivotY + relativePos * sin;
        ctx.strokeStyle = colors.rope;
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.lineTo(wx, wy + 40);
        ctx.stroke();
        ctx.setLineDash([]);
        const weightSize = 40;
        ctx.fillStyle = colors.weight;
        ctx.fillRect(wx - weightSize/2, wy + 40, weightSize, 30);
        ctx.strokeStyle = colors.text;
        ctx.lineWidth = 2 / zoom;
        ctx.strokeRect(wx - weightSize/2, wy + 40, weightSize, 30);
        ctx.fillStyle = colors.text;
        ctx.font = `bold ${12 / zoom}px Inter`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${weight.mass} kg`, wx, wy + 55);
        // dwaring force arrow gravity
        const forceScale = 0.5;
        const force = weight.mass * gravity;
        drawArrow(ctx, wx, wy + 70, wx, wy + 70 + force * forceScale, 
                  colors.torqueClockwise, `${force.toFixed(1)} N`);
        
        // Draw torque arc indicator
        if (Math.abs(weight.position - pivotPosition * beamLength) > 0.1) {
            const r = Math.abs(relativePos);
            const torqueDirection = relativePos > 0 ? 1 : -1;
            const arcColor = torqueDirection > 0 ? colors.torqueCounter : colors.torqueClockwise;
            
            ctx.strokeStyle = arcColor;
            ctx.lineWidth = 2 / zoom;
            ctx.beginPath();
            if (torqueDirection > 0) {
                ctx.arc(pivotX, pivotY, r, beamAngle, beamAngle + Math.PI / 4);
            } else {
                ctx.arc(pivotX, pivotY, r, beamAngle - Math.PI / 4, beamAngle);
            }
            ctx.stroke();
        }
    });
    
    ctx.restore();
}

// Animation loop for physics simulation
function animate() {
    if (!isReleased) return;
    const dt = 0.016; 
    const netTorque = calculateTorques();
    let I = 0.001; // small value to avoid division by zero
    weights.forEach(weight => {
        const r = Math.abs(weight.position - pivotPosition * beamLength);
        I += weight.mass * r * r;
    });
    angularAcceleration = netTorque / I;
    angularVelocity += angularAcceleration * dt;
    beamAngle += angularVelocity * dt;
    angularVelocity *= 0.98;
    
    draw();
    
    if (isReleased) {
        animationFrame = requestAnimationFrame(animate);
    }
}




setTimeout(() => {
    weights.push({ id: Date.now(), mass: 10, position: 1 });
    weights.push({ id: Date.now() + 1, mass: 10, position: 5 });
    
    updateWeightsList();
    calculateTorques();
    updateZoomDisplay();
    draw();
}, 100);