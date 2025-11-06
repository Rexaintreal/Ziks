let circuitMode = 'charging';
let voltage = 12;
let resistance = 10;
let capacitance = 100;
let time = 0;
let capVoltage = 0;
let current = 0;
let isRunning = false;
let animationFrame = null;
let lastTime = 0;
let showCurrent = true;
let showGraphs = true;
let showEquations = true;
let voltageHistory = [];
let currentHistory = [];
const MAX_HISTORY = 300;
let zoom = 1;
let panX = 0;
let panY = 0;
let isPanning = false;
let lastMouseX = 0;
let lastMouseY = 0;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;

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

const circuitModeSelect = document.getElementById('circuitMode');
const voltageSlider = document.getElementById('voltage');
const voltageDisplay = document.getElementById('voltageDisplay');
const resistanceSlider = document.getElementById('resistance');
const resistanceDisplay = document.getElementById('resistanceDisplay');
const capacitanceSlider = document.getElementById('capacitance');
const capacitanceDisplay = document.getElementById('capacitanceDisplay');
const showCurrentCheckbox = document.getElementById('showCurrent');
const showGraphsCheckbox = document.getElementById('showGraphs');
const showEquationsCheckbox = document.getElementById('showEquations');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const resetViewBtn = document.getElementById('resetViewBtn');
const zoomDisplay = document.getElementById('zoomDisplay');

circuitModeSelect.addEventListener('change', () => {
    circuitMode = circuitModeSelect.value;
    if (circuitMode === 'discharging') {
        capVoltage = voltage;
    } else {
        capVoltage = 0;
    }
    time = 0;
    voltageHistory = [];
    currentHistory = [];
    updateStats();
    draw();
});

voltageSlider.addEventListener('input', () => {
    voltage = parseFloat(voltageSlider.value);
    voltageDisplay.textContent = voltage + ' V';
    if (circuitMode === 'discharging') {
        capVoltage = voltage;
    }
    updateStats();
    draw();
});

resistanceSlider.addEventListener('input', () => {
    resistance = parseFloat(resistanceSlider.value);
    resistanceDisplay.textContent = resistance + ' kΩ';
    updateStats();
    draw();
});

capacitanceSlider.addEventListener('input', () => {
    capacitance = parseFloat(capacitanceSlider.value);
    capacitanceDisplay.textContent = capacitance + ' μF';
    updateStats();
    draw();
});

showCurrentCheckbox.addEventListener('change', () => {
    showCurrent = showCurrentCheckbox.checked;
    draw();
});

showGraphsCheckbox.addEventListener('change', () => {
    showGraphs = showGraphsCheckbox.checked;
    draw();
});

showEquationsCheckbox.addEventListener('change', () => {
    showEquations = showEquationsCheckbox.checked;
    draw();
});

startBtn.addEventListener('click', () => {
    if (isRunning) {
        isRunning = false;
        cancelAnimationFrame(animationFrame);
        startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
    } else {
        isRunning = true;
        lastTime = performance.now();
        startBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        animate();
    }
});

resetBtn.addEventListener('click', () => {
    isRunning = false;
    cancelAnimationFrame(animationFrame);
    
    time = 0;
    lastTime = 0;
    if (circuitMode === 'charging') {
        capVoltage = 0;
    } else {
        capVoltage = voltage;
    }
    current = 0;
    voltageHistory = [];
    currentHistory = [];
    
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
    if (e.button === 2 || e.button === 0) {
        e.preventDefault();
        isPanning = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        canvas.style.cursor = 'grabbing';
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (isPanning) {
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        panX += dx;
        panY += dy;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        draw();
    }
});

canvas.addEventListener('mouseup', () => {
    isPanning = false;
    canvas.style.cursor = 'default';
});

canvas.addEventListener('mouseleave', () => {
    isPanning = false;
    canvas.style.cursor = 'default';
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

function getTimeConstant() {
    return resistance * capacitance / 1000;
}

function updateStats() {
    const tau = getTimeConstant();
    const charge = capVoltage * capacitance;
    const power = current * current * resistance;
    
    document.getElementById('timeConstant').textContent = tau.toFixed(2) + ' ms';
    document.getElementById('capVoltage').textContent = capVoltage.toFixed(2) + ' V';
    document.getElementById('chargeStored').textContent = charge.toFixed(2) + ' μC';
    document.getElementById('current').textContent = current.toFixed(3) + ' mA';
    document.getElementById('power').textContent = power.toFixed(2) + ' mW';
}

function getThemeColors() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    return {
        bg: isDark ? '#0a0a0a' : '#ffffff',
        gridLine: isDark ? '#ffffff08' : '#00000008',
        text: isDark ? '#ffffff' : '#000000',
        textBg: isDark ? '#1a1a1acc' : '#f5f5f5ee',
        wire: isDark ? '#51cf66' : '#2b8a3e',
        battery: '#ff6b6b',
        resistor: '#ffd43b',
        capacitor: '#4dabf7',
        current: '#a78bfa',
        graphBg: isDark ? '#1a1a1a' : '#f5f5f5',
        graphBorder: isDark ? '#404040' : '#d0d0d0',
        voltageGraph: '#4dabf7',
        currentGraph: '#ff6b6b',
        tauMarker: '#51cf66'
    };
}

function drawCircuit(ctx, colors) {
    const centerX = canvas.width / (2 * zoom);
    const centerY = canvas.height / (2 * zoom) + 20;
    const circuitWidth = 350;
    const circuitHeight = 220;
    
    ctx.strokeStyle = colors.wire;
    ctx.lineWidth = 5 / zoom;
    ctx.lineCap = 'round';
    
    // top wire
    ctx.beginPath();
    ctx.moveTo(centerX - circuitWidth/2, centerY - circuitHeight/2);
    ctx.lineTo(centerX + circuitWidth/2, centerY - circuitHeight/2);
    ctx.stroke();
    
    // bottom wire
    ctx.beginPath();
    ctx.moveTo(centerX - circuitWidth/2, centerY + circuitHeight/2);
    ctx.lineTo(centerX + circuitWidth/2, centerY + circuitHeight/2);
    ctx.stroke();
    
    // left wire
    ctx.beginPath();
    ctx.moveTo(centerX - circuitWidth/2, centerY - circuitHeight/2);
    ctx.lineTo(centerX - circuitWidth/2, centerY + circuitHeight/2);
    ctx.stroke();
    
    // right wire
    ctx.beginPath();
    ctx.moveTo(centerX + circuitWidth/2, centerY - circuitHeight/2);
    ctx.lineTo(centerX + circuitWidth/2, centerY + circuitHeight/2);
    ctx.stroke();
    
    // battery
    const batteryX = centerX - circuitWidth/2;
    const batteryY = centerY;
    
    ctx.strokeStyle = colors.battery;
    ctx.lineWidth = 8 / zoom;
    ctx.beginPath();
    ctx.moveTo(batteryX - 25, batteryY - 35);
    ctx.lineTo(batteryX + 25, batteryY - 35);
    ctx.stroke();
    
    ctx.lineWidth = 5 / zoom;
    ctx.beginPath();
    ctx.moveTo(batteryX - 15, batteryY - 10);
    ctx.lineTo(batteryX + 15, batteryY - 10);
    ctx.stroke();
    
    ctx.lineWidth = 8 / zoom;
    ctx.beginPath();
    ctx.moveTo(batteryX - 25, batteryY + 15);
    ctx.lineTo(batteryX + 25, batteryY + 15);
    ctx.stroke();
    
    ctx.lineWidth = 5 / zoom;
    ctx.beginPath();
    ctx.moveTo(batteryX - 15, batteryY + 40);
    ctx.lineTo(batteryX + 15, batteryY + 40);
    ctx.stroke();
    
    ctx.fillStyle = colors.text;
    ctx.font = `bold ${18 / zoom}px Inter`;
    ctx.textAlign = 'center';
    ctx.fillText('+', batteryX, batteryY - 45);
    ctx.fillText('−', batteryX, batteryY + 55);
    
    ctx.font = `bold ${16 / zoom}px Inter`;
    ctx.fillText(`${voltage}V`, batteryX - 60, batteryY);
    
    // resistor
    const resistorX = centerX;
    const resistorY = centerY - circuitHeight/2;
    
    ctx.strokeStyle = colors.resistor;
    ctx.lineWidth = 4 / zoom;
    ctx.beginPath();
    ctx.moveTo(resistorX - 50, resistorY);
    for (let i = 0; i < 10; i++) {
        ctx.lineTo(resistorX - 50 + i * 11, resistorY + (i % 2 === 0 ? -10 : 10));
    }
    ctx.lineTo(resistorX + 50, resistorY);
    ctx.stroke();
    
    ctx.fillStyle = colors.text;
    ctx.font = `bold ${15 / zoom}px Inter`;
    ctx.textAlign = 'center';
    ctx.fillText(`R = ${resistance}kΩ`, resistorX, resistorY - 25);
    
    // capacitor
    const capX = centerX + circuitWidth/2;
    const capY = centerY;
    
    ctx.strokeStyle = colors.capacitor;
    ctx.lineWidth = 8 / zoom;
    ctx.beginPath();
    ctx.moveTo(capX - 15, capY - 40);
    ctx.lineTo(capX - 15, capY + 40);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(capX + 15, capY - 40);
    ctx.lineTo(capX + 15, capY + 40);
    ctx.stroke();
    
    // charge visualization
    const chargePercent = capVoltage / voltage;
    ctx.fillStyle = colors.capacitor + '50';
    const chargeHeight = 80 * chargePercent;
    ctx.fillRect(capX - 30, capY + 40 - chargeHeight, 60, chargeHeight);
    
    // add glow effect
    if (chargePercent > 0.1) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = colors.capacitor;
        ctx.fillStyle = colors.capacitor + '30';
        ctx.fillRect(capX - 35, capY + 40 - chargeHeight - 5, 70, chargeHeight + 10);
        ctx.shadowBlur = 0;
    }
    
    ctx.fillStyle = colors.text;
    ctx.font = `bold ${15 / zoom}px Inter`;
    ctx.textAlign = 'left';
    ctx.fillText(`C = ${capacitance}μF`, capX + 35, capY - 10);
    ctx.fillText(`${capVoltage.toFixed(1)}V`, capX + 35, capY + 10);
    ctx.font = `${13 / zoom}px Inter`;
    ctx.fillText(`${(chargePercent * 100).toFixed(0)}%`, capX + 35, capY + 28);
    
    // current animation
    if (showCurrent && Math.abs(current) > 0.001) {
        const numParticles = 10;
        const totalLength = circuitWidth * 2 + circuitHeight * 2;
        const particleOffset = (time * 100) % totalLength;
        
        for (let i = 0; i < numParticles; i++) {
            const offset = (particleOffset + i * (totalLength / numParticles)) % totalLength;
            let px, py;
            
            if (offset < circuitWidth) {
                px = centerX - circuitWidth/2 + offset;
                py = centerY - circuitHeight/2;
            } else if (offset < circuitWidth + circuitHeight) {
                px = centerX + circuitWidth/2;
                py = centerY - circuitHeight/2 + (offset - circuitWidth);
            } else if (offset < circuitWidth * 2 + circuitHeight) {
                px = centerX + circuitWidth/2 - (offset - circuitWidth - circuitHeight);
                py = centerY + circuitHeight/2;
            } else {
                px = centerX - circuitWidth/2;
                py = centerY + circuitHeight/2 - (offset - circuitWidth * 2 - circuitHeight);
            }
            
            const size = 5 + Math.abs(current) * 2;
            ctx.fillStyle = colors.current;
            ctx.shadowBlur = 10;
            ctx.shadowColor = colors.current;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
}

function drawGraphs(ctx, colors) {
    if (!showGraphs || voltageHistory.length < 2) return;
    
    const graphWidth = 320;
    const graphHeight = 160;
    const graphX = (canvas.width / zoom) - graphWidth - 25;
    let graphY = 25;
    
    const tau = getTimeConstant() / 1000;
    
    // voltage graph
    ctx.fillStyle = colors.graphBg;
    ctx.fillRect(graphX, graphY, graphWidth, graphHeight);
    
    ctx.strokeStyle = colors.graphBorder;
    ctx.lineWidth = 2 / zoom;
    ctx.strokeRect(graphX, graphY, graphWidth, graphHeight);
    
    ctx.fillStyle = colors.text;
    ctx.font = `bold ${14 / zoom}px Inter`;
    ctx.textAlign = 'center';
    ctx.fillText('Capacitor Voltage vs Time', graphX + graphWidth / 2, graphY + 20);
    
    const plotWidth = graphWidth - 40;
    const plotHeight = graphHeight - 55;
    const plotX = graphX + 20;
    const plotY = graphY + 35;
    
    let maxV = voltage * 1.15;
    
    // tau markers
    ctx.strokeStyle = colors.tauMarker + '60';
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([5, 5]);
    for (let i = 1; i <= 5; i++) {
        const tauTime = i * tau;
        const maxTime = time;
        if (tauTime <= maxTime) {
            const xPos = plotX + (tauTime / maxTime) * plotWidth;
            ctx.beginPath();
            ctx.moveTo(xPos, plotY);
            ctx.lineTo(xPos, plotY + plotHeight);
            ctx.stroke();
            
            ctx.font = `${10 / zoom}px Inter`;
            ctx.fillStyle = colors.tauMarker;
            ctx.fillText(`${i}τ`, xPos, plotY + plotHeight + 12);
        }
    }
    ctx.setLineDash([]);
    
    ctx.strokeStyle = colors.voltageGraph;
    ctx.lineWidth = 3 / zoom;
    ctx.beginPath();
    
    voltageHistory.forEach((v, i) => {
        const x = plotX + (i / Math.max(voltageHistory.length - 1, 1)) * plotWidth;
        const y = plotY + plotHeight - (v / maxV) * plotHeight;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    
    ctx.stroke();
    
    // current graph
    graphY += graphHeight + 20;
    
    ctx.fillStyle = colors.graphBg;
    ctx.fillRect(graphX, graphY, graphWidth, graphHeight);
    
    ctx.strokeStyle = colors.graphBorder;
    ctx.lineWidth = 2 / zoom;
    ctx.strokeRect(graphX, graphY, graphWidth, graphHeight);
    
    ctx.fillStyle = colors.text;
    ctx.font = `bold ${14 / zoom}px Inter`;
    ctx.textAlign = 'center';
    ctx.fillText('Current vs Time', graphX + graphWidth / 2, graphY + 20);
    
    let maxI = Math.max(...currentHistory.map(Math.abs), 0.1);
    
    ctx.strokeStyle = colors.currentGraph;
    ctx.lineWidth = 3 / zoom;
    ctx.beginPath();
    
    currentHistory.forEach((i, idx) => {
        const x = plotX + (idx / Math.max(currentHistory.length - 1, 1)) * plotWidth;
        const y = plotY + plotHeight - (Math.abs(i) / maxI) * plotHeight;
        
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    
    ctx.stroke();
}

function drawEquations(ctx, colors) {
    if (!showEquations) return;
    
    const eqX = 25;
    const eqY = 25;
    const eqWidth = 280;
    const eqHeight = 110;
    
    ctx.fillStyle = colors.textBg;
    ctx.fillRect(eqX, eqY, eqWidth, eqHeight);
    
    ctx.strokeStyle = colors.graphBorder;
    ctx.lineWidth = 2 / zoom;
    ctx.strokeRect(eqX, eqY, eqWidth, eqHeight);
    
    ctx.fillStyle = colors.text;
    ctx.font = `bold ${15 / zoom}px Inter`;
    ctx.textAlign = 'left';
    ctx.fillText('Circuit Equations:', eqX + 15, eqY + 25);
    
    ctx.font = `${14 / zoom}px Courier New`;
    const tau = getTimeConstant();
    
    if (circuitMode === 'charging') {
        ctx.fillText(`V(t) = ${voltage}(1 - e^(-t/${tau.toFixed(1)}))`, eqX + 15, eqY + 50);
        ctx.fillText(`I(t) = ${(voltage/resistance).toFixed(2)}e^(-t/${tau.toFixed(1)})`, eqX + 15, eqY + 72);
    } else {
        ctx.fillText(`V(t) = ${voltage}e^(-t/${tau.toFixed(1)})`, eqX + 15, eqY + 50);
        ctx.fillText(`I(t) = -${(voltage/resistance).toFixed(2)}e^(-t/${tau.toFixed(1)})`, eqX + 15, eqY + 72);
    }
    
    ctx.font = `bold ${13 / zoom}px Inter`;
    ctx.fillText(`τ = RC = ${tau.toFixed(2)} ms`, eqX + 15, eqY + 95);
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
    
    drawCircuit(ctx, colors);
    drawGraphs(ctx, colors);
    drawEquations(ctx, colors);
    
    ctx.restore();
}

function animate() {
    if (!isRunning) return;
    
    const currentTime = performance.now();
    const dt = lastTime === 0 ? 0.016 : Math.min((currentTime - lastTime) / 1000, 0.033);
    lastTime = currentTime;
    
    time += dt;
    
    const tau = getTimeConstant() / 1000;
    
    if (circuitMode === 'charging') {
        capVoltage = voltage * (1 - Math.exp(-time / tau));
        current = (voltage / resistance) * Math.exp(-time / tau);
    } else {
        capVoltage = voltage * Math.exp(-time / tau);
        current = -(voltage / resistance) * Math.exp(-time / tau);
    }
    
    voltageHistory.push(capVoltage);
    currentHistory.push(current);
    
    if (voltageHistory.length > MAX_HISTORY) {
        voltageHistory.shift();
        currentHistory.shift();
    }
    
    updateStats();
    draw();
    
    if (isRunning) {
        animationFrame = requestAnimationFrame(animate);
    }
}

setTimeout(() => {
    if (circuitMode === 'discharging') {
        capVoltage = voltage;
    }
    updateStats();
    updateZoomDisplay();
    draw();
}, 100);