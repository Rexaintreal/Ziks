// params
let n1 = 1.000293; // air
let n2 = 1.33; // water
let incidentAngle = 30; 
let intensity = 0.8;
let showNormals = true;
let showAngles = true;
let showWavefronts = true;
let showReflection = true;
let lightSource = { x: 0, y: 0 };
let isDragging = false;
let interfaceY = 0;
let waveOffset = 0;

window.addEventListener('load', () => {
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }, 500);
});

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const wrapper = canvas.parentElement;
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
    
    interfaceY = canvas.height / 2;
    lightSource = {
        x: canvas.width * 0.3,
        y: interfaceY - 150
    };
    
    draw();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const medium1Select = document.getElementById('medium1Select');
const medium2Select = document.getElementById('medium2Select');
const medium1Custom = document.getElementById('medium1Custom');
const medium2Custom = document.getElementById('medium2Custom');
const n1Slider = document.getElementById('n1Slider');
const n2Slider = document.getElementById('n2Slider');
const angleSlider = document.getElementById('angleSlider');
const intensitySlider = document.getElementById('intensitySlider');
const n1Display = document.getElementById('n1Display');
const n2Display = document.getElementById('n2Display');
const angleDisplay = document.getElementById('angleDisplay');
const intensityDisplay = document.getElementById('intensityDisplay');
const showNormalsCheck = document.getElementById('showNormals');
const showAnglesCheck = document.getElementById('showAngles');
const showWavefrontsCheck = document.getElementById('showWavefronts');
const showReflectionCheck = document.getElementById('showReflection');
const preset1 = document.getElementById('preset1');
const preset2 = document.getElementById('preset2');
const preset3 = document.getElementById('preset3');

//listeners
medium1Select?.addEventListener('change', () => {
    if (medium1Select.value === 'custom') {
        medium1Custom.style.display = 'block';
        n1 = parseFloat(medium1Custom.value);
    } else {
        medium1Custom.style.display = 'none';
        n1 = parseFloat(medium1Select.value);
    }
    n1Slider.value = n1;
    updateDisplay();
    draw();
});

medium1Custom?.addEventListener('input', () => {
    n1 = parseFloat(medium1Custom.value);
    n1Slider.value = n1;
    updateDisplay();
    draw();
});

medium2Select?.addEventListener('change', () => {
    if (medium2Select.value === 'custom') {
        medium2Custom.style.display = 'block';
        n2 = parseFloat(medium2Custom.value);
    } else {
        medium2Custom.style.display = 'none';
        n2 = parseFloat(medium2Select.value);
    }
    n2Slider.value = n2;
    updateDisplay();
    draw();
});

medium2Custom?.addEventListener('input', () => {
    n2 = parseFloat(medium2Custom.value);
    n2Slider.value = n2;
    updateDisplay();
    draw();
});

n1Slider?.addEventListener('input', () => {
    n1 = parseFloat(n1Slider.value);
    medium1Select.value = 'custom';
    medium1Custom.style.display = 'block';
    medium1Custom.value = n1.toFixed(2);
    updateDisplay();
    draw();
});

n2Slider?.addEventListener('input', () => {
    n2 = parseFloat(n2Slider.value);
    medium2Select.value = 'custom';
    medium2Custom.style.display = 'block';
    medium2Custom.value = n2.toFixed(2);
    updateDisplay();
    draw();
});

angleSlider?.addEventListener('input', () => {
    incidentAngle = parseFloat(angleSlider.value);
    updateLightSourceFromAngle();
    updateDisplay();
    draw();
});

intensitySlider?.addEventListener('input', () => {
    intensity = parseFloat(intensitySlider.value);
    updateDisplay();
    draw();
});

showNormalsCheck?.addEventListener('change', () => {
    showNormals = showNormalsCheck.checked;
    draw();
});

showAnglesCheck?.addEventListener('change', () => {
    showAngles = showAnglesCheck.checked;
    draw();
});

showWavefrontsCheck?.addEventListener('change', () => {
    showWavefronts = showWavefrontsCheck.checked;
    draw();
});

showReflectionCheck?.addEventListener('change', () => {
    showReflection = showReflectionCheck.checked;
    draw();
});

preset1?.addEventListener('click', () => {
    medium1Select.value = '1.000293';
    medium2Select.value = '1.33';
    n1 = 1.000293;
    n2 = 1.33;
    n1Slider.value = n1;
    n2Slider.value = n2;
    updateDisplay();
    draw();
});

preset2?.addEventListener('click', () => {
    medium1Select.value = '1.000293';
    medium2Select.value = '2.42';
    n1 = 1.000293;
    n2 = 2.42;
    n1Slider.value = n1;
    n2Slider.value = n2;
    updateDisplay();
    draw();
});

preset3?.addEventListener('click', () => {
    medium1Select.value = '1.33';
    medium2Select.value = '1.000293';
    n1 = 1.33;
    n2 = 1.000293;
    n1Slider.value = n1;
    n2Slider.value = n2;
    updateDisplay();
    draw();
});

function updateLightSourceFromAngle() {
    const rad = (incidentAngle * Math.PI) / 180;
    const distance = 150;
    lightSource.x = canvas.width / 2 - Math.sin(rad) * distance;
    lightSource.y = interfaceY - Math.cos(rad) * distance;
}

function calculateAngleFromSource() {
    const dx = canvas.width / 2 - lightSource.x;
    const dy = interfaceY - lightSource.y;
    const angle = Math.atan2(dx, dy) * (180 / Math.PI);
    return Math.max(0, Math.min(89, angle));
}

function updateDisplay() {
    if (n1Display) n1Display.textContent = n1.toFixed(3);
    if (n2Display) n2Display.textContent = n2.toFixed(3);
    if (angleDisplay) angleDisplay.textContent = incidentAngle.toFixed(1) + '°';
    if (intensityDisplay) intensityDisplay.textContent = Math.round(intensity * 100) + '%';
    
    // snells law
    const theta1 = (incidentAngle * Math.PI) / 180;
    const sinTheta2 = (n1 * Math.sin(theta1)) / n2;
    
    const theta1El = document.getElementById('theta1Value');
    const theta2El = document.getElementById('theta2Value');
    const criticalEl = document.getElementById('criticalAngleValue');
    const statusEl = document.getElementById('statusValue');
    
    if (theta1El) theta1El.textContent = incidentAngle.toFixed(1) + '°';
    
    // check TIR 
    if (sinTheta2 > 1) {
        if (theta2El) theta2El.textContent = 'N/A';
        if (statusEl) {
            statusEl.textContent = 'Total Internal Reflection';
            statusEl.style.color = '#ff6b6b';
        }
    } else {
        const theta2 = (Math.asin(sinTheta2) * 180) / Math.PI;
        if (theta2El) theta2El.textContent = theta2.toFixed(1) + '°';
        if (statusEl) {
            statusEl.textContent = 'Refraction';
            statusEl.style.color = '#51cf66';
        }
    }
    
    // calc critical angle
    if (n1 > n2) {
        const criticalAngle = (Math.asin(n2 / n1) * 180) / Math.PI;
        if (criticalEl) {
            criticalEl.textContent = criticalAngle.toFixed(1) + '°';
            criticalEl.style.color = '#ffd43b';
        }
    } else {
        if (criticalEl) {
            criticalEl.textContent = 'N/A (n₁ < n₂)';
            criticalEl.style.color = 'var(--text-secondary)';
        }
    }
}


canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const dist = Math.hypot(mouseX - lightSource.x, mouseY - lightSource.y);
    if (dist < 20) {
        isDragging = true;
        canvas.style.cursor = 'grabbing';
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    if (isDragging) {
        lightSource.x = mouseX;
        lightSource.y = Math.min(mouseY, interfaceY - 20);
        incidentAngle = calculateAngleFromSource();
        angleSlider.value = incidentAngle;
        updateDisplay();
        draw();
    } else {
        const dist = Math.hypot(mouseX - lightSource.x, mouseY - lightSource.y);
        canvas.style.cursor = dist < 20 ? 'grab' : 'default';
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
    canvas.style.cursor = 'default';
});

canvas.addEventListener('mouseleave', () => {
    isDragging = false;
    canvas.style.cursor = 'default';
});

function getThemeColors() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    
    return {
        bg1: isDark ? 'rgba(10, 20, 40, 0.9)' : 'rgba(230, 240, 255, 0.9)',
        bg2: isDark ? 'rgba(5, 15, 35, 0.9)' : 'rgba(200, 220, 245, 0.9)',
        interface: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
        normal: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
        incident: 'rgba(255, 107, 107, ',
        reflected: 'rgba(255, 183, 43, ',
        refracted: 'rgba(77, 171, 247, ',
        text: isDark ? '#ffffff' : '#000000',
        grid: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
    };
}

function drawRay(startX, startY, endX, endY, color, alpha) {
    ctx.strokeStyle = color + alpha + ')';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.shadowBlur = 15;
    ctx.shadowColor = color + '0.8)';
    ctx.stroke();
    ctx.shadowBlur = 0;
    const angle = Math.atan2(endY - startY, endX - startX);
    const arrowSize = 15;
    ctx.fillStyle = color + alpha + ')';
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - arrowSize * Math.cos(angle - Math.PI/6), endY - arrowSize * Math.sin(angle - Math.PI/6));
    ctx.lineTo(endX - arrowSize * Math.cos(angle + Math.PI/6), endY - arrowSize * Math.sin(angle + Math.PI/6));
    ctx.closePath();
    ctx.fill();
}

function drawWavefronts(startX, startY, dirX, dirY, color, count, spacing) {
    ctx.strokeStyle = color + '0.3)';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < count; i++) {
        const offset = i * spacing + waveOffset;
        const wx = startX + dirX * offset;
        const wy = startY + dirY * offset;
        // perpendicular
        const perpX = -dirY * 30;
        const perpY = dirX * 30;
        ctx.beginPath();
        ctx.moveTo(wx - perpX, wy - perpY);
        ctx.lineTo(wx + perpX, wy + perpY);
        ctx.stroke();
    }
}

function drawAngleArc(cx, cy, radius, startAngle, endAngle, label, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.stroke();
    const midAngle = (startAngle + endAngle) / 2;
    const labelX = cx + Math.cos(midAngle) * (radius + 20);
    const labelY = cy + Math.sin(midAngle) * (radius + 20);
    ctx.fillStyle = color;
    ctx.font = '14px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, labelX, labelY);
}

function draw() {
    if (!canvas || !ctx) return;
    const colors = getThemeColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centerX = canvas.width / 2;
    const gradient1 = ctx.createLinearGradient(0, 0, 0, interfaceY);
    gradient1.addColorStop(0, colors.bg1);
    gradient1.addColorStop(1, colors.bg1.replace('0.9', '0.7'));
    ctx.fillStyle = gradient1;
    ctx.fillRect(0, 0, canvas.width, interfaceY);
    
    const gradient2 = ctx.createLinearGradient(0, interfaceY, 0, canvas.height);
    gradient2.addColorStop(0, colors.bg2.replace('0.9', '0.7'));
    gradient2.addColorStop(1, colors.bg2);
    ctx.fillStyle = gradient2;
    ctx.fillRect(0, interfaceY, canvas.width, canvas.height - interfaceY);
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    ctx.strokeStyle = colors.interface;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(0, interfaceY);
    ctx.lineTo(canvas.width, interfaceY);
    ctx.stroke();
    ctx.setLineDash([]);
    if (showNormals) {
        ctx.strokeStyle = colors.normal;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(centerX, interfaceY - 150);
        ctx.lineTo(centerX, interfaceY + 150);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    const theta1Rad = (incidentAngle * Math.PI) / 180;
    const sinTheta2 = (n1 * Math.sin(theta1Rad)) / n2;
    const isTIR = sinTheta2 > 1;
    // Incident ray
    const incidentDirX = Math.sin(theta1Rad);
    const incidentDirY = Math.cos(theta1Rad);
    const incidentEndX = centerX;
    const incidentEndY = interfaceY;
    if (showWavefronts) {
        drawWavefronts(lightSource.x, lightSource.y, incidentDirX, incidentDirY, colors.incident, 5, 25);
    }
    
    drawRay(lightSource.x, lightSource.y, incidentEndX, incidentEndY, colors.incident, intensity);
    // Reflected ray
    if (showReflection) {
        const reflectedEndX = centerX + Math.sin(theta1Rad) * 200;
        const reflectedEndY = interfaceY - Math.cos(theta1Rad) * 200;
        const reflectIntensity = isTIR ? intensity : intensity * 0.3;
        
        if (showWavefronts) {
            drawWavefronts(incidentEndX, incidentEndY, Math.sin(theta1Rad), -Math.cos(theta1Rad), colors.reflected, 5, 25);
        }
        
        drawRay(incidentEndX, incidentEndY, reflectedEndX, reflectedEndY, colors.reflected, reflectIntensity);
    }
    
    // Refracted ray
    if (!isTIR) {
        const theta2Rad = Math.asin(sinTheta2);
        const refractedEndX = centerX + Math.sin(theta2Rad) * 200;
        const refractedEndY = interfaceY + Math.cos(theta2Rad) * 200;
        const refractIntensity = intensity * 0.7;
        
        if (showWavefronts) {
            drawWavefronts(incidentEndX, incidentEndY, Math.sin(theta2Rad), Math.cos(theta2Rad), colors.refracted, 5, 25 * (n2/n1));
        }
        
        drawRay(incidentEndX, incidentEndY, refractedEndX, refractedEndY, colors.refracted, refractIntensity);
        
        // Refracted angle arc
        if (showAngles) {
            drawAngleArc(centerX, interfaceY, 60, Math.PI/2, Math.PI/2 + theta2Rad, 'θ₂', colors.refracted + '1)');
        }
    }
    
    // Incident angle arc
    if (showAngles) {
        drawAngleArc(centerX, interfaceY, 80, Math.PI/2 - theta1Rad, Math.PI/2, 'θ₁', colors.incident + '1)');
    }
    
    // Light source
    ctx.fillStyle = colors.incident + '1)';
    ctx.beginPath();
    ctx.arc(lightSource.x, lightSource.y, 12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = colors.text;
    ctx.lineWidth = 2;
    ctx.stroke();
        ctx.fillStyle = colors.text;
    ctx.font = 'bold 16px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(`Medium 1 (n₁ = ${n1.toFixed(3)})`, 20, 30);
    ctx.fillText(`Medium 2 (n₂ = ${n2.toFixed(3)})`, 20, interfaceY + 30);
}

//loop for wavefronts
function animate() {
    waveOffset = (waveOffset + 1) % 25;
    draw();
    requestAnimationFrame(animate);
}

// Initialize
setTimeout(() => {
    updateDisplay();
    draw();
    animate();
}, 100);