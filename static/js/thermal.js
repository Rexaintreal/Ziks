//some material prop (linear expansion coeff 10^-6 /deg C)
const materials = {
    aluminum: { name: 'Aluminum', alpha: 23.1, color: '#c0c0c0', density: 2.7 },
    iron: { name: 'Iron', alpha: 11.8, color: '#a0522d', density: 7.87 },
    copper: { name: 'Copper', alpha: 16.5, color: '#b87333', density: 8.96 },
    steel: { name: 'Steel', alpha: 11.0, color: '#808080', density: 7.85 },
    brass: { name: 'Brass', alpha: 19.0, color: '#b5a642', density: 8.4 },
    glass: { name: 'Glass', alpha: 8.5, color: '#87ceeb', density: 2.5 }
};

let currentMaterial = 'aluminum';
let expansionType = 'linear'; 
let temperature = 20;
let initialTemp = 20;
let initialLength = 50; 
let heatingRate = 2; 
let isHeating = false;
let isCooling = false;
let showGrid = true;
let showDimensions = true;
let showGraph = true;
let showParticles = false;
let particles = [];
let graphData = [];
const maxGraphPoints = 50;
let isDragging = false;
let dragTarget = null;
let hoverState = { object: false };

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
    initializeParticles();
    draw();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
const temperatureSlider = document.getElementById('temperatureSlider');
const lengthSlider = document.getElementById('lengthSlider');
const heatingRateSlider = document.getElementById('heatingRateSlider');
const temperatureDisplay = document.getElementById('temperatureDisplay');
const kelvinDisplay = document.getElementById('kelvinDisplay');
const lengthDisplay = document.getElementById('lengthDisplay');
const heatingRateDisplay = document.getElementById('heatingRateDisplay');
const showGridCheck = document.getElementById('showGrid');
const showDimensionsCheck = document.getElementById('showDimensions');
const showGraphCheck = document.getElementById('showGraph');
const showParticlesCheck = document.getElementById('showParticles');
const heatBtn = document.getElementById('heatBtn');
const coolBtn = document.getElementById('coolBtn');
const resetBtn = document.getElementById('resetBtn');
document.querySelectorAll('.btn-material').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-material').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMaterial = btn.dataset.material;
        updateStats();
        draw();
    });
});
document.querySelectorAll('.btn-expansion').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-expansion').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        expansionType = btn.dataset.type;
        updateStats();
        draw();
    });
});
temperatureSlider?.addEventListener('input', () => {
    temperature = parseFloat(temperatureSlider.value);
    updateDisplay();
    updateStats();
    updateThermometer();
    draw();
});

lengthSlider?.addEventListener('input', () => {
    initialLength = parseFloat(lengthSlider.value);
    updateDisplay();
    updateStats();
    draw();
});

heatingRateSlider?.addEventListener('input', () => {
    heatingRate = parseFloat(heatingRateSlider.value);
    updateDisplay();
});
showGridCheck?.addEventListener('change', () => {
    showGrid = showGridCheck.checked;
    draw();
});

showDimensionsCheck?.addEventListener('change', () => {
    showDimensions = showDimensionsCheck.checked;
    draw();
});

showGraphCheck?.addEventListener('change', () => {
    showGraph = showGraphCheck.checked;
    draw();
});

showParticlesCheck?.addEventListener('change', () => {
    showParticles = showParticlesCheck.checked;
    if (showParticles) initializeParticles();
    draw();
});
heatBtn?.addEventListener('click', () => {
    if (isHeating) {
        isHeating = false;
        heatBtn.innerHTML = '<i class="fa-solid fa-fire"></i> Start Heating';
    } else {
        isHeating = true;
        isCooling = false;
        heatBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause Heating';
        coolBtn.innerHTML = '<i class="fa-solid fa-snowflake"></i> Start Cooling';
        animate();
    }
});

coolBtn?.addEventListener('click', () => {
    if (isCooling) {
        isCooling = false;
        coolBtn.innerHTML = '<i class="fa-solid fa-snowflake"></i> Start Cooling';
    } else {
        isCooling = true;
        isHeating = false;
        coolBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause Cooling';
        heatBtn.innerHTML = '<i class="fa-solid fa-fire"></i> Start Heating';
        animate();
    }
});

resetBtn?.addEventListener('click', () => {
    isHeating = false;
    isCooling = false;
    temperature = 20;
    initialTemp = 20;
    temperatureSlider.value = 20;
    graphData = [];
    heatBtn.innerHTML = '<i class="fa-solid fa-fire"></i> Start Heating';
    coolBtn.innerHTML = '<i class="fa-solid fa-snowflake"></i> Start Cooling';
    updateDisplay();
    updateStats();
    updateThermometer();
    draw();
});
document.getElementById('preset1')?.addEventListener('click', () => {
    currentMaterial = 'steel';
    initialLength = 100;
    temperature = 40;
    document.querySelector('[data-material="steel"]').click();
    lengthSlider.value = 100;
    temperatureSlider.value = 40;
    updateDisplay();
    updateStats();
    updateThermometer();
    draw();
});

document.getElementById('preset2')?.addEventListener('click', () => {
    currentMaterial = 'iron';
    initialLength = 80;
    temperature = 35;
    document.querySelector('[data-material="iron"]').click();
    lengthSlider.value = 80;
    temperatureSlider.value = 35;
    updateDisplay();
    updateStats();
    updateThermometer();
    draw();
});

document.getElementById('preset3')?.addEventListener('click', () => {
    currentMaterial = 'copper';
    initialLength = 30;
    temperature = 25;
    document.querySelector('[data-material="copper"]').click();
    lengthSlider.value = 30;
    temperatureSlider.value = 25;
    updateDisplay();
    updateStats();
    updateThermometer();
    draw();
});

document.getElementById('preset4')?.addEventListener('click', () => {
    currentMaterial = 'aluminum';
    initialLength = 50;
    temperature = -30;
    document.querySelector('[data-material="aluminum"]').click();
    lengthSlider.value = 50;
    temperatureSlider.value = -30;
    updateDisplay();
    updateStats();
    updateThermometer();
    draw();
});

function updateDisplay() {
    if (temperatureDisplay) temperatureDisplay.textContent = temperature.toFixed(1) + '°C';
    if (kelvinDisplay) kelvinDisplay.textContent = (temperature + 273.15).toFixed(1) + ' K';
    if (lengthDisplay) lengthDisplay.textContent = initialLength + ' cm';
    if (heatingRateDisplay) heatingRateDisplay.textContent = heatingRate.toFixed(1) + ' °C/s';
}

function updateStats() {
    const material = materials[currentMaterial];
    const deltaT = temperature - initialTemp;
    
    let coefficient, deltaL, finalDimension, relativeChange;
    
    if (expansionType === 'linear') {
        coefficient = material.alpha;
        deltaL = coefficient * initialLength * deltaT / 1000; 
        finalDimension = initialLength + deltaL / 10; 
        relativeChange = (deltaL / 10) / initialLength * 100; 
    } else if (expansionType === 'area') {
        coefficient = material.alpha * 2; // beta = 2alpha
        const initialArea = initialLength * initialLength;
        const deltaA = coefficient * initialArea * deltaT / 1000;
        deltaL = deltaA / initialLength / 10; 
        finalDimension = Math.sqrt(initialArea + deltaA / 100); 
        relativeChange = deltaA / initialArea * 100;
    } else { 
        coefficient = material.alpha * 3; // gama = 3alpha
        const initialVolume = initialLength * initialLength * initialLength;
        const deltaV = coefficient * initialVolume * deltaT / 1000;
        deltaL = deltaV / (initialLength * initialLength) / 10;
        finalDimension = Math.pow(initialVolume + deltaV / 1000, 1/3);
        relativeChange = deltaV / initialVolume * 100;
    }
    
    document.getElementById('coefficientValue').textContent = coefficient.toFixed(1) + ' × 10⁻⁶ /°C';
    document.getElementById('deltaLValue').textContent = Math.abs(deltaL).toFixed(3) + ' mm';
    document.getElementById('relativeChangeValue').textContent = relativeChange.toFixed(4) + '%';
    document.getElementById('finalDimensionValue').textContent = finalDimension.toFixed(3) + ' cm';
    document.getElementById('deltaTValue').textContent = deltaT.toFixed(1) + '°C';
    if (graphData.length === 0 || Math.abs(temperature - graphData[graphData.length - 1].temp) > 1) {
        graphData.push({
            temp: temperature,
            relativeChange: relativeChange
        });
        if (graphData.length > maxGraphPoints) {
            graphData.shift();
        }
    }
}

function updateThermometer() {
    const mercuryLevel = document.getElementById('mercuryLevel');
    const tempReading = document.getElementById('tempReading');
    const minTemp = 0;
    const maxTemp = 100;
    const clampedTemp = Math.max(minTemp, Math.min(maxTemp, temperature));
    const percentage = ((clampedTemp - minTemp) / (maxTemp - minTemp)) * 100;
    
    if (mercuryLevel) {
        mercuryLevel.style.height = percentage + '%';
    }
    
    if (tempReading) {
        tempReading.textContent = temperature.toFixed(1) + '°C';
        const hue = Math.max(0, Math.min(240, 240 - (temperature + 50) * 2));
        tempReading.style.color = `hsl(${hue}, 80%, 60%)`;
    }
}

function initializeParticles() {
    particles = [];
    const numParticles = 50;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseSize = Math.min(canvas.width, canvas.height) * 0.3;
    
    for (let i = 0; i < numParticles; i++) {
        particles.push({
            x: centerX + (Math.random() - 0.5) * baseSize,
            y: centerY + (Math.random() - 0.5) * baseSize,
            baseX: centerX + (Math.random() - 0.5) * baseSize,
            baseY: centerY + (Math.random() - 0.5) * baseSize,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            radius: 3
        });
    }
}

function animate() {
    if (!isHeating && !isCooling) return;
    
    const delta = heatingRate * 0.016;
    
    if (isHeating && temperature < 500) {
        temperature += delta;
        temperature = Math.min(500, temperature);
    } else if (isCooling && temperature > -50) {
        temperature -= delta;
        temperature = Math.max(-50, temperature);
    }
    
    temperatureSlider.value = temperature;
    updateDisplay();
    updateStats();
    updateThermometer();
    draw();
    
    requestAnimationFrame(animate);
}

function getThemeColors() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    
    return {
        bg: isDark ? '#0a0a0a' : '#f8f9fa',
        text: isDark ? '#ffffff' : '#000000',
        border: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        grid: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        objectBorder: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
        dimension: '#4dabf7',
        graphLine: '#ff6b6b',
        graphAxis: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
        particle: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'
    };
}

function draw() {
    if (!canvas || !ctx) return;
    
    const colors = getThemeColors();
    const material = materials[currentMaterial];
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    if (showGrid) {
        ctx.strokeStyle = colors.grid;
        ctx.lineWidth = 1;
        const gridSize = 50;
        
        for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }
    const deltaT = temperature - initialTemp;
    const scale = canvas.height / 400;
    let coefficient;
    
    if (expansionType === 'linear') {
        coefficient = material.alpha;
    } else if (expansionType === 'area') {
        coefficient = material.alpha * 2;
    } else {
        coefficient = material.alpha * 3;
    }
    
    const expansionFactor = 1 + (coefficient * deltaT / 1000000);
    const currentLength = initialLength * scale * expansionFactor;
    const tempNormalized = (temperature + 50) / 550;
    const r = Math.round(255 * tempNormalized);
    const b = Math.round(255 * (1 - tempNormalized));
    const materialColor = material.color;
    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };
    
    const matColor = hexToRgb(materialColor);
    const blendedR = Math.round((matColor.r + r) / 2);
    const blendedG = Math.round(matColor.g);
    const blendedB = Math.round((matColor.b + b) / 2);
    ctx.save();
    ctx.translate(centerX, centerY);
    
    if (expansionType === 'linear') {
        const width = 40;
        const height = currentLength;
        
        ctx.fillStyle = `rgb(${blendedR}, ${blendedG}, ${blendedB})`;
        ctx.fillRect(-width / 2, -height / 2, width, height);
        
        ctx.strokeStyle = colors.objectBorder;
        ctx.lineWidth = 3;
        ctx.strokeRect(-width / 2, -height / 2, width, height);
        if (temperature > initialTemp + 5) {
            drawHeatLines(0, 0, width, height, colors.graphLine);
        }
        
    } else if (expansionType === 'area') {
        const size = currentLength;
        
        ctx.fillStyle = `rgb(${blendedR}, ${blendedG}, ${blendedB})`;
        ctx.fillRect(-size / 2, -size / 2, size, size);
        
        ctx.strokeStyle = colors.objectBorder;
        ctx.lineWidth = 3;
        ctx.strokeRect(-size / 2, -size / 2, size, size);
        
        if (temperature > initialTemp + 5) {
            drawHeatLines(0, 0, size, size, colors.graphLine);
        }
        
    } else { 
        const size = currentLength;
        ctx.fillStyle = `rgb(${blendedR}, ${blendedG}, ${blendedB})`;
        ctx.fillRect(-size / 2, -size / 2, size, size);
        ctx.fillStyle = `rgb(${Math.max(0, blendedR - 40)}, ${Math.max(0, blendedG - 40)}, ${Math.max(0, blendedB - 40)})`;
        ctx.beginPath();
        ctx.moveTo(-size / 2, -size / 2);
        ctx.lineTo(0, -size / 2 - size / 3);
        ctx.lineTo(size / 2 + size / 2, -size / 2 - size / 3);
        ctx.lineTo(size / 2, -size / 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = `rgb(${Math.max(0, blendedR - 20)}, ${Math.max(0, blendedG - 20)}, ${Math.max(0, blendedB - 20)})`;
        ctx.beginPath();
        ctx.moveTo(size / 2, -size / 2);
        ctx.lineTo(size / 2 + size / 2, -size / 2 - size / 3);
        ctx.lineTo(size / 2 + size / 2, size / 2 - size / 3);
        ctx.lineTo(size / 2, size / 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = colors.objectBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(-size / 2, -size / 2, size, size);
    }
    
    ctx.restore();
    if (showDimensions) {
        ctx.strokeStyle = colors.dimension;
        ctx.fillStyle = colors.dimension;
        ctx.lineWidth = 2;
        ctx.font = 'bold 14px Inter';
        ctx.textAlign = 'center';
        
        if (expansionType === 'linear') {
            const x = centerX + 60;
            const y1 = centerY - currentLength / 2;
            const y2 = centerY + currentLength / 2;
            
            drawDimensionLine(x, y1, x, y2, (currentLength / scale).toFixed(2) + ' cm');
        } else {
            const offset = currentLength / 2 + 40;
            drawDimensionLine(centerX - currentLength / 2, centerY + offset, 
                            centerX + currentLength / 2, centerY + offset, 
                            (currentLength / scale).toFixed(2) + ' cm');
        }
    }
    if (showParticles) {
        const tempFactor = (temperature - initialTemp) / 100;
        const vibration = Math.max(0, tempFactor * 5);
        
        particles.forEach(p => {
            p.x = p.baseX + (Math.random() - 0.5) * vibration;
            p.y = p.baseY + (Math.random() - 0.5) * vibration;
            
            ctx.fillStyle = colors.particle;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    if (showGraph && graphData.length > 1) {
        const graphX = 20;
        const graphY = 20;
        const graphWidth = 250;
        const graphHeight = 150;
        ctx.fillStyle = colors.bg;
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.fillRect(graphX, graphY, graphWidth, graphHeight);
        ctx.strokeRect(graphX, graphY, graphWidth, graphHeight);
        ctx.fillStyle = colors.text;
        ctx.font = 'bold 12px Inter';
        ctx.textAlign = 'left';
        ctx.fillText('ΔL/L₀ vs Temperature', graphX + 10, graphY + 15);
        ctx.strokeStyle = colors.graphAxis;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(graphX + 30, graphY + graphHeight - 20);
        ctx.lineTo(graphX + graphWidth - 10, graphY + graphHeight - 20);
        ctx.moveTo(graphX + 30, graphY + 25);
        ctx.lineTo(graphX + 30, graphY + graphHeight - 20);
        ctx.stroke();
        if (graphData.length > 1) {
            ctx.strokeStyle = colors.graphLine;
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            const xScale = (graphWidth - 40) / (graphData.length - 1);
            const yMin = Math.min(...graphData.map(d => d.relativeChange));
            const yMax = Math.max(...graphData.map(d => d.relativeChange));
            const yRange = yMax - yMin || 1;
            const yScale = (graphHeight - 45) / yRange;
            
            graphData.forEach((point, i) => {
                const x = graphX + 30 + i * xScale;
                const y = graphY + graphHeight - 20 - (point.relativeChange - yMin) * yScale;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
        }
        ctx.fillStyle = colors.text;
        ctx.font = '10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('T (°C)', graphX + graphWidth / 2, graphY + graphHeight - 5);
        ctx.save();
        ctx.translate(graphX + 10, graphY + graphHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('ΔL/L₀ (%)', 0, 0);
        ctx.restore();
    }
    ctx.fillStyle = colors.text;
    ctx.globalAlpha = 0.6;
    ctx.font = '11px Inter';
    ctx.textAlign = 'left';
    ctx.fillText('🌡️ Use sliders or heating buttons to change temperature', 10, canvas.height - 20);
    ctx.globalAlpha = 1;
}

function drawHeatLines(x, y, width, height, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 5; i++) {
        const offset = (Date.now() / 100 + i * 20) % 50;
        ctx.beginPath();
        ctx.moveTo(x - width / 2 - 20, y - height / 2 + offset);
        ctx.lineTo(x - width / 2 - 10, y - height / 2 + offset - 10);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x + width / 2 + 10, y - height / 2 + offset);
        ctx.lineTo(x + width / 2 + 20, y - height / 2 + offset - 10);
        ctx.stroke();
    }
    
    ctx.restore();
}

function drawDimensionLine(x1, y1, x2, y2, label) {
    const colors = getThemeColors();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowSize = 8;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + arrowSize * Math.cos(angle + Math.PI / 6), 
               y1 + arrowSize * Math.sin(angle + Math.PI / 6));
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + arrowSize * Math.cos(angle - Math.PI / 6), 
               y1 + arrowSize * Math.sin(angle - Math.PI / 6));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - arrowSize * Math.cos(angle + Math.PI / 6), 
               y2 - arrowSize * Math.sin(angle + Math.PI / 6));
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - arrowSize * Math.cos(angle - Math.PI / 6), 
               y2 - arrowSize * Math.sin(angle - Math.PI / 6));
    ctx.stroke();
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    ctx.fillStyle = colors.bg;
    const textWidth = ctx.measureText(label).width + 10;
    ctx.fillRect(midX - textWidth / 2, midY - 12, textWidth, 20);
    ctx.fillStyle = colors.dimension;
    ctx.fillText(label, midX, midY + 4);
}
setTimeout(() => {
    updateDisplay();
    updateStats();
    updateThermometer();
    draw();
}, 100);