//params
let vizMode = 'field';
let charges = [];
let chargeMagnitude = 5; 
let fieldDensity = 16;
let vectorGrid = 30;
let testCharge = 1; 
let showCharges = true;
let showTestCharge = false;
let showForce = false;
let animateTest = false;
let testChargePos = null;
let testChargeVel = { x: 0, y: 0 };
let zoom = 1;
let panX = 0;
let panY = 0;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3;
let draggedCharge = null;
let draggedTest = false;
let nextChargeType = 'positive';
let cursorPos = { x: 0, y: 0 };
let isAnimating = false;
// const
const k = 1;
const pixelsToMeters = 100; 

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
    
    // init test charge if not set
    if (!testChargePos) {
        testChargePos = { 
            x: canvas.width / (2 * zoom), 
            y: canvas.height / (2 * zoom) 
        };
    }
    
    draw();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// controls
const vizModeSelect = document.getElementById('vizMode');
const addPositiveBtn = document.getElementById('addPositive');
const addNegativeBtn = document.getElementById('addNegative');
const chargeMagnitudeSlider = document.getElementById('chargeMagnitude');
const chargeDisplay = document.getElementById('chargeDisplay');
const fieldDensitySlider = document.getElementById('fieldDensity');
const densityDisplay = document.getElementById('densityDisplay');
const vectorGridSlider = document.getElementById('vectorGrid');
const vectorGridDisplay = document.getElementById('vectorGridDisplay');
const testChargeSlider = document.getElementById('testCharge');
const testChargeDisplay = document.getElementById('testChargeDisplay');
const showChargesCheck = document.getElementById('showCharges');
const showTestChargeCheck = document.getElementById('showTestCharge');
const showForceCheck = document.getElementById('showForce');
const animateTestCheck = document.getElementById('animateTest');
const clearBtn = document.getElementById('clearBtn');
const presetBtn = document.getElementById('presetBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const resetViewBtn = document.getElementById('resetViewBtn');
const zoomDisplay = document.getElementById('zoomDisplay');

vizModeSelect.addEventListener('change', () => {
    vizMode = vizModeSelect.value;
    draw();
});

addPositiveBtn.addEventListener('click', () => {
    nextChargeType = 'positive';
    addPositiveBtn.classList.add('active');
    addNegativeBtn.classList.remove('active');
});

addNegativeBtn.addEventListener('click', () => {
    nextChargeType = 'negative';
    addNegativeBtn.classList.add('active');
    addPositiveBtn.classList.remove('active');
});

chargeMagnitudeSlider.addEventListener('input', () => {
    chargeMagnitude = parseFloat(chargeMagnitudeSlider.value);
    chargeDisplay.textContent = chargeMagnitude.toFixed(1) + ' μC';
});

fieldDensitySlider.addEventListener('input', () => {
    fieldDensity = parseInt(fieldDensitySlider.value);
    densityDisplay.textContent = fieldDensity;
    draw();
});

vectorGridSlider.addEventListener('input', () => {
    vectorGrid = parseInt(vectorGridSlider.value);
    vectorGridDisplay.textContent = vectorGrid;
    draw();
});

testChargeSlider.addEventListener('input', () => {
    testCharge = parseFloat(testChargeSlider.value);
    const sign = testCharge >= 0 ? '+' : '';
    testChargeDisplay.textContent = sign + testCharge.toFixed(1) + ' nC';
});

showChargesCheck.addEventListener('change', () => {
    showCharges = showChargesCheck.checked;
    draw();
});

showTestChargeCheck.addEventListener('change', () => {
    showTestCharge = showTestChargeCheck.checked;
    draw();
});

showForceCheck.addEventListener('change', () => {
    showForce = showForceCheck.checked;
    draw();
});

animateTestCheck.addEventListener('change', () => {
    animateTest = animateTestCheck.checked;
    if (animateTest && !isAnimating) {
        isAnimating = true;
        animate();
    }
});

clearBtn.addEventListener('click', () => {
    charges = [];
    testChargeVel = { x: 0, y: 0 };
    updateStats();
    draw();
});

presetBtn.addEventListener('click', () => {
    const centerX = canvas.width / (2 * zoom);
    const centerY = canvas.height / (2 * zoom);
    charges = [
        { x: centerX - 150, y: centerY, charge: 8 },
        { x: centerX + 150, y: centerY, charge: -8 }
    ];
    updateStats();
    draw();
});

// zoom
function updateZoomDisplay() {
    if (zoomDisplay) {
        zoomDisplay.textContent = `${Math.round(zoom * 100)}%`;
    }
}

function setZoom(newZoom) {
    zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
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
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(zoom * zoomFactor);
});

function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left - panX) / zoom,
        y: (e.clientY - rect.top - panY) / zoom
    };
}

// mouse stuff
canvas.addEventListener('mousedown', (e) => {
    const mouse = getCanvasCoords(e);
    if (showTestCharge && testChargePos) {
        const dist = Math.sqrt((mouse.x - testChargePos.x) ** 2 + (mouse.y - testChargePos.y) ** 2);
        if (dist < 20) {
            draggedTest = true;
            canvas.style.cursor = 'grabbing';
            return;
        }
    }
    for (let i = charges.length - 1; i >= 0; i--) {
        const charge = charges[i];
        const dist = Math.sqrt((mouse.x - charge.x) ** 2 + (mouse.y - charge.y) ** 2);
        const radius = Math.abs(charge.charge) * 3 + 5;
        if (dist < radius) {
            draggedCharge = i;
            canvas.style.cursor = 'grabbing';
            return;
        }
    }
    const sign = nextChargeType === 'positive' ? 1 : -1;
    charges.push({
        x: mouse.x,
        y: mouse.y,
        charge: chargeMagnitude * sign
    });
    updateStats();
    draw();
});

canvas.addEventListener('mousemove', (e) => {
    const mouse = getCanvasCoords(e);
    cursorPos = mouse;
    
    if (draggedTest) {
        testChargePos = { x: mouse.x, y: mouse.y };
        testChargeVel = { x: 0, y: 0 };
        draw();
    } else if (draggedCharge !== null) {
        charges[draggedCharge].x = mouse.x;
        charges[draggedCharge].y = mouse.y;
        draw();
    } else {
        let overDraggable = false;
        
        if (showTestCharge && testChargePos) {
            const dist = Math.sqrt((mouse.x - testChargePos.x) ** 2 + (mouse.y - testChargePos.y) ** 2);
            if (dist < 20) overDraggable = true;
        }
        
        for (let charge of charges) {
            const dist = Math.sqrt((mouse.x - charge.x) ** 2 + (mouse.y - charge.y) ** 2);
            const radius = Math.abs(charge.charge) * 3 + 5;
            if (dist < radius) {
                overDraggable = true;
                break;
            }
        }
        
        canvas.style.cursor = overDraggable ? 'grab' : 'crosshair';
    }
    
    updateStats();
});

canvas.addEventListener('mouseup', () => {
    draggedCharge = null;
    draggedTest = false;
    canvas.style.cursor = 'crosshair';
});

canvas.addEventListener('mouseleave', () => {
    draggedCharge = null;
    draggedTest = false;
    canvas.style.cursor = 'crosshair';
});

canvas.addEventListener('dblclick', (e) => {
    const mouse = getCanvasCoords(e);
    
    // remove charge on double click
    for (let i = charges.length - 1; i >= 0; i--) {
        const charge = charges[i];
        const dist = Math.sqrt((mouse.x - charge.x) ** 2 + (mouse.y - charge.y) ** 2);
        const radius = Math.abs(charge.charge) * 3 + 5;
        if (dist < radius) {
            charges.splice(i, 1);
            updateStats();
            draw();
            break;
        }
    }
});

// calculate field at a point main physics calc
function getElectricField(x, y) {
    let Ex = 0, Ey = 0;
    
    for (let charge of charges) {
        const dx = x - charge.x;
        const dy = y - charge.y;
        const rSquared = dx * dx + dy * dy;
        const r = Math.sqrt(rSquared);
        
        if (r < 3) continue; // too close to charge
        
        // E = kQ/rsquare in direction of r
        const E = k * charge.charge / rSquared;
        Ex += E * (dx / r);
        Ey += E * (dy / r);
    }
    
    return { 
        Ex, 
        Ey, 
        magnitude: Math.sqrt(Ex * Ex + Ey * Ey),
        angle: Math.atan2(Ey, Ex)
    };
}

// get potential at point
function getPotential(x, y) {
    let V = 0;
    
    for (let charge of charges) {
        const dx = x - charge.x;
        const dy = y - charge.y;
        const r = Math.sqrt(dx * dx + dy * dy);
        
        if (r < 3) continue;
        
        V += k * charge.charge / r;
    }
    
    return V;
}

function updateStats() {
    const netCharge = charges.reduce((sum, c) => sum + c.charge, 0);
    document.getElementById('totalCharges').textContent = charges.length;
    document.getElementById('netCharge').textContent = netCharge.toFixed(1) + ' μC';
    
    if (cursorPos) {
        const field = getElectricField(cursorPos.x, cursorPos.y);
        const fieldValue = field.magnitude.toFixed(2);
        document.getElementById('fieldStrength').textContent = fieldValue + ' N/C';
        
        const potential = getPotential(cursorPos.x, cursorPos.y);
        document.getElementById('potential').textContent = potential.toFixed(2) + ' V';
    }
}

function getThemeColors() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    
    return {
        bg: isDark ? '#0a0a0a' : '#ffffff',
        gridLine: isDark ? '#ffffff08' : '#00000008',
        positive: isDark ? '#ff6b6b' : '#e03131',
        negative: isDark ? '#4dabf7' : '#1c7ed6',
        fieldLine: isDark ? '#51cf66' : '#2f9e44',
        equipotential: isDark ? '#ffd43b' : '#fab005',
        testCharge: isDark ? '#da77f2' : '#9c36b5',
        force: isDark ? '#ff922b' : '#fd7e14',
        text: isDark ? '#ffffff' : '#000000',
        vector: isDark ? '#51cf66' : '#2f9e44'
    };
}

// trace field line from start point
function traceFieldLine(startX, startY, direction) {
    const points = [];
    let x = startX;
    let y = startY;
    const stepSize = 2;
    const maxSteps = 800;
    
    for (let i = 0; i < maxSteps; i++) {
        const field = getElectricField(x, y);
        
        if (field.magnitude < 0.01) break;
        
        points.push({ x, y });
        const norm = field.magnitude;
        x += direction * stepSize * field.Ex / norm;
        y += direction * stepSize * field.Ey / norm;
        if (x < -50 || x > canvas.width/zoom + 50 || y < -50 || y > canvas.height/zoom + 50) break;
        
        // check if we hit a negative charge so the field lines end there
        let hitCharge = false;
        for (let charge of charges) {
            const dist = Math.sqrt((x - charge.x) ** 2 + (y - charge.y) ** 2);
            if (dist < Math.abs(charge.charge) * 3) {
                if ((direction > 0 && charge.charge < 0) || (direction < 0 && charge.charge > 0)) {
                    hitCharge = true;
                    break;
                }
            }
        }
        if (hitCharge) break;
    }
    
    return points;
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
    const gridSize = 50;
    
    for (let x = 0; x < canvas.width/zoom; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height/zoom);
        ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height/zoom; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width/zoom, y);
        ctx.stroke();
    }
    
    // draw visualization based on mode
    if (charges.length > 0) {
        if (vizMode === 'field') {
            drawFieldLines(colors);
        } else if (vizMode === 'vectors') {
            drawVectorField(colors);
        } else if (vizMode === 'potential') {
            drawEquipotentials(colors);
        } else if (vizMode === 'heatmap') {
            drawHeatmap(colors);
        }
    }
    
    // draw charges
    if (showCharges) {
        for (let charge of charges) {
            const isPositive = charge.charge > 0;
            const radius = Math.abs(charge.charge) * 2.5 + 10;
            const color = isPositive ? colors.positive : colors.negative;
            const gradient = ctx.createRadialGradient(charge.x, charge.y, 0, charge.x, charge.y, radius * 1.8);
            gradient.addColorStop(0, color + '40');
            gradient.addColorStop(1, color + '00');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(charge.x, charge.y, radius * 1.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(charge.x, charge.y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = colors.text + '80';
            ctx.lineWidth = 2/zoom;
            ctx.stroke();
            
            // + or - symbol
            ctx.fillStyle = colors.text;
            ctx.font = `bold ${Math.min(radius * 1.2, 24)/zoom}px Inter`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(isPositive ? '+' : '−', charge.x, charge.y);
            ctx.font = `${11/zoom}px Inter`;
            ctx.fillText(Math.abs(charge.charge).toFixed(1) + 'μC', charge.x, charge.y + radius + 15);
        }
    }
    
    // test charge
    if (showTestCharge && testChargePos) {
        const radius = 12;
        const color = colors.testCharge;
        const gradient = ctx.createRadialGradient(testChargePos.x, testChargePos.y, 0, testChargePos.x, testChargePos.y, radius * 2);
        gradient.addColorStop(0, color + '60');
        gradient.addColorStop(1, color + '00');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(testChargePos.x, testChargePos.y, radius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(testChargePos.x, testChargePos.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = colors.text;
        ctx.lineWidth = 2/zoom;
        ctx.stroke();
        ctx.fillStyle = colors.text;
        ctx.font = `${10/zoom}px Inter`;
        ctx.textAlign = 'center';
        ctx.fillText('test', testChargePos.x, testChargePos.y);
        if (showForce) {
            const field = getElectricField(testChargePos.x, testChargePos.y);
            const forceMag = field.magnitude * Math.abs(testCharge) / 10;
            
            if (forceMag > 0.01) {
                const arrowLen = Math.min(forceMag * 20, 100);
                const sign = testCharge >= 0 ? 1 : -1;
                const arrowX = testChargePos.x + sign * (field.Ex / field.magnitude) * arrowLen;
                const arrowY = testChargePos.y + sign * (field.Ey / field.magnitude) * arrowLen;
                
                ctx.strokeStyle = colors.force;
                ctx.lineWidth = 3/zoom;
                ctx.beginPath();
                ctx.moveTo(testChargePos.x, testChargePos.y);
                ctx.lineTo(arrowX, arrowY);
                ctx.stroke();
                const angle = Math.atan2(arrowY - testChargePos.y, arrowX - testChargePos.x);
                ctx.fillStyle = colors.force;
                ctx.beginPath();
                ctx.moveTo(arrowX, arrowY);
                ctx.lineTo(arrowX - 12 * Math.cos(angle - Math.PI/6), arrowY - 12 * Math.sin(angle - Math.PI/6));
                ctx.lineTo(arrowX - 12 * Math.cos(angle + Math.PI/6), arrowY - 12 * Math.sin(angle + Math.PI/6));
                ctx.closePath();
                ctx.fill();
            }
        }
    }
    
    ctx.restore();
}

function drawFieldLines(colors) {
    // draw field lines from each positive charge
    for (let charge of charges) {
        if (charge.charge <= 0) continue;
        
        const numLines = Math.ceil(Math.abs(charge.charge) * fieldDensity / 8);
        
        for (let i = 0; i < numLines; i++) {
            const angle = (i / numLines) * Math.PI * 2;
            const startRadius = Math.abs(charge.charge) * 2.5 + 12;
            const startX = charge.x + Math.cos(angle) * startRadius;
            const startY = charge.y + Math.sin(angle) * startRadius;
            
            const points = traceFieldLine(startX, startY, 1);
            
            if (points.length > 5) {
                ctx.strokeStyle = colors.fieldLine + 'C0';
                ctx.lineWidth = 1.5/zoom;
                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);
                for (let j = 1; j < points.length; j++) {
                    ctx.lineTo(points[j].x, points[j].y);
                }
                ctx.stroke();
                if (points.length > 20) {
                    const midIdx = Math.floor(points.length / 2);
                    const p1 = points[midIdx];
                    const p2 = points[Math.min(midIdx + 3, points.length - 1)];
                    const arrowAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                    
                    ctx.fillStyle = colors.fieldLine;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p1.x - 8 * Math.cos(arrowAngle - Math.PI/6), p1.y - 8 * Math.sin(arrowAngle - Math.PI/6));
                    ctx.lineTo(p1.x - 8 * Math.cos(arrowAngle + Math.PI/6), p1.y - 8 * Math.sin(arrowAngle + Math.PI/6));
                    ctx.closePath();
                    ctx.fill();
                }
            }
        }
    }
}

function drawVectorField(colors) {
    const spacing = vectorGrid;
    
    for (let x = spacing/2; x < canvas.width/zoom; x += spacing) {
        for (let y = spacing/2; y < canvas.height/zoom; y += spacing) {
            const field = getElectricField(x, y);
            
            if (field.magnitude < 0.05) continue;
            // logarithmic scaling for better visualization
            const maxLen = spacing * 0.45;
            const scaledMag = Math.log10(field.magnitude + 1) * 10;
            const len = Math.min(scaledMag, maxLen);
            const endX = x + (field.Ex / field.magnitude) * len;
            const endY = y + (field.Ey / field.magnitude) * len;
            const intensity = Math.min(field.magnitude / 10, 1);
            const alpha = Math.floor(intensity * 150 + 100).toString(16).padStart(2, '0');
            ctx.strokeStyle = colors.vector + alpha;
            ctx.lineWidth = 2/zoom;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            const angle = field.angle;
            ctx.fillStyle = colors.vector + alpha;
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(endX - 6 * Math.cos(angle - Math.PI/6), endY - 6 * Math.sin(angle - Math.PI/6));
            ctx.lineTo(endX - 6 * Math.cos(angle + Math.PI/6), endY - 6 * Math.sin(angle + Math.PI/6));
            ctx.closePath();
            ctx.fill();
        }
    }
}

function drawEquipotentials(colors) {
    const resolution = 6;
    const potentialLevels = new Set();
    
    // first pass - find potential range
    let minV = Infinity, maxV = -Infinity;
    for (let x = 0; x < canvas.width/zoom; x += resolution * 3) {
        for (let y = 0; y < canvas.height/zoom; y += resolution * 3) {
            const V = getPotential(x, y);
            if (Math.abs(V) < 1000) {
                minV = Math.min(minV, V);
                maxV = Math.max(maxV, V);
            }
        }
    }
    for (let x = 0; x < canvas.width/zoom; x += resolution) {
        for (let y = 0; y < canvas.height/zoom; y += resolution) {
            const V = getPotential(x, y);
            const levelSpacing = (maxV - minV) / 15;
            if (levelSpacing === 0) continue;
            
            const level = Math.round(V / levelSpacing);
            const targetV = level * levelSpacing;
            
            if (Math.abs(V - targetV) < levelSpacing * 0.15) {
                const intensity = Math.abs((V - minV) / (maxV - minV));
                const alpha = Math.floor(intensity * 200 + 55).toString(16).padStart(2, '0');
                
                ctx.fillStyle = colors.equipotential + alpha;
                ctx.fillRect(x, y, resolution, resolution);
            }
        }
    }
}

function drawHeatmap(colors) {
    const resolution = 10;
    
    // find max field for normalization
    let maxField = 0;
    for (let x = 0; x < canvas.width/zoom; x += resolution * 2) {
        for (let y = 0; y < canvas.height/zoom; y += resolution * 2) {
            const field = getElectricField(x, y);
            maxField = Math.max(maxField, field.magnitude);
        }
    }
    
    for (let x = 0; x < canvas.width/zoom; x += resolution) {
        for (let y = 0; y < canvas.height/zoom; y += resolution) {
            const field = getElectricField(x, y);
            const intensity = Math.min(Math.log10(field.magnitude + 1) / Math.log10(maxField + 1), 1);
            let r, g, b;
            if (intensity < 0.5) {
                r = 0;
                g = Math.floor(intensity * 2 * 180);
                b = Math.floor((1 - intensity * 2) * 255);
            } else {
                r = Math.floor((intensity - 0.5) * 2 * 255);
                g = Math.floor((1 - intensity) * 2 * 180);
                b = 0;
            }
            
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.7)`;
            ctx.fillRect(x, y, resolution, resolution);
        }
    }
}

function animate() {
    if (!animateTest || !showTestCharge || !testChargePos) {
        isAnimating = false;
        return;
    }
    
    const dt = 0.02;
    
    // get field at test charge position
    const field = getElectricField(testChargePos.x, testChargePos.y);
    const sign = testCharge >= 0 ? 1 : -1;
    const forceX = sign * field.Ex * Math.abs(testCharge) * 0.1;
    const forceY = sign * field.Ey * Math.abs(testCharge) * 0.1;
    testChargeVel.x += forceX * dt;
    testChargeVel.y += forceY * dt;
    testChargeVel.x *= 0.98; 
    testChargeVel.y *= 0.98;
    const maxSpeed = 50;
    const speed = Math.sqrt(testChargeVel.x ** 2 + testChargeVel.y ** 2);
    if (speed > maxSpeed) {
        testChargeVel.x = (testChargeVel.x / speed) * maxSpeed;
        testChargeVel.y = (testChargeVel.y / speed) * maxSpeed;
    }
    testChargePos.x += testChargeVel.x * dt;
    testChargePos.y += testChargeVel.y * dt;
    const margin = 30;
    if (testChargePos.x < margin) {
        testChargePos.x = margin;
        testChargeVel.x *= -0.7;
    }
    if (testChargePos.x > canvas.width/zoom - margin) {
        testChargePos.x = canvas.width/zoom - margin;
        testChargeVel.x *= -0.7;
    }
    if (testChargePos.y < margin) {
        testChargePos.y = margin;
        testChargeVel.y *= -0.7;
    }
    if (testChargePos.y > canvas.height/zoom - margin) {
        testChargePos.y = canvas.height/zoom - margin;
        testChargeVel.y *= -0.7;
    }
    
    draw();
    
    if (animateTest && showTestCharge) {
        requestAnimationFrame(animate);
    } else {
        isAnimating = false;
    }
}

// init
setTimeout(() => {
    updateZoomDisplay();
    addPositiveBtn.classList.add('active');
    testChargePos = { 
        x: canvas.width / (2 * zoom), 
        y: canvas.height / (2 * zoom) 
    };
    updateStats();
    draw();
}, 100);