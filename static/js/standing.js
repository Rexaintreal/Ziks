// params 
let harmonic = 1;
let boundary = 'fixed';
let frequency = 5;
let amplitude = 1;
let stringLength = 1.5;
let waveSpeed = 50;
let time = 0;
let isAnimating = true;
let animationFrame = null;
let showNodes = true;
let showAntinodes = true;
let showEnvelope = false;
let zoom = 1;
let panX = 0;
let panY = 0;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
let draggedAntinode = null;
let dragAmplitude = 1;
let lastMouseY = 0;

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

// controls
const harmonicSelect = document.getElementById('harmonic');
const boundarySelect = document.getElementById('boundary');
const frequencySlider = document.getElementById('frequency');
const frequencyDisplay = document.getElementById('frequencyDisplay');
const amplitudeSlider = document.getElementById('amplitude');
const amplitudeDisplay = document.getElementById('amplitudeDisplay');
const stringLengthSlider = document.getElementById('stringLength');
const stringLengthDisplay = document.getElementById('stringLengthDisplay');
const waveSpeedSlider = document.getElementById('waveSpeed');
const waveSpeedDisplay = document.getElementById('waveSpeedDisplay');
const showNodesCheck = document.getElementById('showNodes');
const showAntinodesCheck = document.getElementById('showAntinodes');
const showEnvelopeCheck = document.getElementById('showEnvelope');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const resetViewBtn = document.getElementById('resetViewBtn');
const zoomDisplay = document.getElementById('zoomDisplay');

harmonicSelect.addEventListener('change', () => {
    harmonic = parseInt(harmonicSelect.value);
    updateStats();
    draw();
});

boundarySelect.addEventListener('change', () => {
    boundary = boundarySelect.value;
    updateStats();
    draw();
});

frequencySlider.addEventListener('input', () => {
    frequency = parseFloat(frequencySlider.value);
    frequencyDisplay.textContent = frequency.toFixed(1) + ' Hz';
    updateStats();
});

amplitudeSlider.addEventListener('input', () => {
    amplitude = parseFloat(amplitudeSlider.value);
    amplitudeDisplay.textContent = amplitude.toFixed(1);
});

stringLengthSlider.addEventListener('input', () => {
    stringLength = parseFloat(stringLengthSlider.value);
    stringLengthDisplay.textContent = stringLength.toFixed(1) + ' m';
    updateStats();
});

waveSpeedSlider.addEventListener('input', () => {
    waveSpeed = parseFloat(waveSpeedSlider.value);
    waveSpeedDisplay.textContent = waveSpeed + ' m/s';
    updateStats();
});

showNodesCheck.addEventListener('change', () => {
    showNodes = showNodesCheck.checked;
    draw();
});

showAntinodesCheck.addEventListener('change', () => {
    showAntinodes = showAntinodesCheck.checked;
    draw();
});

showEnvelopeCheck.addEventListener('change', () => {
    showEnvelope = showEnvelopeCheck.checked;
    draw();
});

startBtn.addEventListener('click', () => {
    if (isAnimating) {
        isAnimating = false;
        cancelAnimationFrame(animationFrame);
        startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Play';
    } else {
        isAnimating = true;
        startBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        animate();
    }
});

resetBtn.addEventListener('click', () => {
    time = 0;
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

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - panX) / zoom;
    const mouseY = (e.clientY - rect.top - panY) / zoom;
    
    const centerY = canvas.height / (2 * zoom);
    const padding = 100;
    const startStringX = padding;
    const endStringX = canvas.width / zoom - padding;
    const stringPixelLength = endStringX - startStringX;
    const pixelsPerMeter = stringPixelLength / stringLength;
    const antinodes = getAntinodePositions();
    for (let i = 0; i < antinodes.length; i++) {
        const antinodePos = antinodes[i];
        const px = startStringX + antinodePos * pixelsPerMeter;
        const y = getStandingWaveValue(antinodePos, time);
        const screenY = centerY - y * pixelsPerMeter;
        
        const dist = Math.sqrt((mouseX - px) ** 2 + (mouseY - screenY) ** 2);
        if (dist < 20) {
            draggedAntinode = i;
            lastMouseY = mouseY;
            canvas.style.cursor = 'grabbing';
            return;
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - panX) / zoom;
    const mouseY = (e.clientY - rect.top - panY) / zoom;
    
    if (draggedAntinode !== null) {
        const centerY = canvas.height / (2 * zoom);
        const padding = 100;
        const startStringX = padding;
        const endStringX = canvas.width / zoom - padding;
        const stringPixelLength = endStringX - startStringX;
        const pixelsPerMeter = stringPixelLength / stringLength;
        const deltaY = lastMouseY - mouseY;
        dragAmplitude += deltaY / (pixelsPerMeter * 50);
        dragAmplitude = Math.max(0.1, Math.min(3, dragAmplitude));
        
        amplitude = dragAmplitude;
        amplitudeSlider.value = amplitude;
        amplitudeDisplay.textContent = amplitude.toFixed(1);
        
        lastMouseY = mouseY;
        draw();
    } else {
        const centerY = canvas.height / (2 * zoom);
        const padding = 100;
        const startStringX = padding;
        const endStringX = canvas.width / zoom - padding;
        const stringPixelLength = endStringX - startStringX;
        const pixelsPerMeter = stringPixelLength / stringLength;
        
        const antinodes = getAntinodePositions();
        let overAntinode = false;
        
        for (let antinodePos of antinodes) {
            const px = startStringX + antinodePos * pixelsPerMeter;
            const y = getStandingWaveValue(antinodePos, time);
            const screenY = centerY - y * pixelsPerMeter;
            
            const dist = Math.sqrt((mouseX - px) ** 2 + (mouseY - screenY) ** 2);
            if (dist < 20) {
                overAntinode = true;
                break;
            }
        }
        
        canvas.style.cursor = overAntinode ? 'grab' : 'crosshair';
    }
});

canvas.addEventListener('mouseup', () => {
    draggedAntinode = null;
    canvas.style.cursor = 'crosshair';
});

canvas.addEventListener('mouseleave', () => {
    draggedAntinode = null;
    canvas.style.cursor = 'crosshair';
});

// calculate wavelength based on boundary and harmonic
function getWavelength() {
    if (boundary === 'fixed') {
        return (2 * stringLength) / harmonic;
    } else if (boundary === 'free') {
        return (2 * stringLength) / harmonic;
    } else { // mixed
        return (4 * stringLength) / (2 * harmonic - 1);
    }
}

function updateStats() {
    const wavelength = getWavelength();
    const period = 1 / frequency;
    let nodes, antinodes;
    if (boundary === 'fixed') {
        nodes = harmonic + 1;
        antinodes = harmonic;
    } else if (boundary === 'free') {
        nodes = harmonic - 1;
        antinodes = harmonic;
    } else { 
        nodes = harmonic;
        antinodes = harmonic;
    }
    
    document.getElementById('wavelength').textContent = wavelength.toFixed(2) + ' m';
    document.getElementById('period').textContent = period.toFixed(3) + ' s';
    document.getElementById('nodeCount').textContent = nodes;
    document.getElementById('antinodeCount').textContent = antinodes;
}

function getThemeColors() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    
    return {
        bg: isDark ? '#0a0a0a' : '#ffffff',
        gridLine: isDark ? '#ffffff08' : '#00000008',
        wave: isDark ? '#4dabf7' : '#1c7ed6',
        waveLight: isDark ? '#74c0fc' : '#4dabf7',
        waveDark: isDark ? '#1c7ed6' : '#1864ab',
        node: isDark ? '#ff6b6b' : '#e03131',
        antinode: isDark ? '#51cf66' : '#2f9e44',
        envelope: isDark ? '#ffd43b' : '#fab005',
        text: isDark ? '#ffffff' : '#000000',
        string: isDark ? '#ffffff40' : '#00000040'
    };
}

// standing wave equation y = 2A * sin(kx) * cos(wt)
function getStandingWaveValue(x, t) {
    const wavelength = getWavelength();
    const k = (2 * Math.PI) / wavelength;
    const omega = 2 * Math.PI * frequency;
    let phaseShift = 0;
    if (boundary === 'mixed') {
        phaseShift = Math.PI / 2;
    }
    
    return 2 * amplitude * Math.sin(k * x + phaseShift) * Math.cos(omega * t);
}

// find node positions along the string
function getNodePositions() {
    const wavelength = getWavelength();
    const nodes = [];
    
    if (boundary === 'fixed') {
        for (let n = 0; n <= harmonic; n++) {
            nodes.push((n * stringLength) / harmonic);
        }
    } else if (boundary === 'free') {
        for (let n = 1; n < harmonic; n++) {
            nodes.push((n * stringLength) / harmonic);
        }
    } else { // mixed
        for (let n = 0; n < harmonic; n++) {
            nodes.push(((2 * n + 1) * stringLength) / (2 * harmonic));
        }
    }
    
    return nodes;
}

// antinode positions
function getAntinodePositions() {
    const wavelength = getWavelength();
    const antinodes = [];
    if (boundary === 'fixed') {
        for (let n = 0; n < harmonic; n++) {
            antinodes.push(((2 * n + 1) * stringLength) / (2 * harmonic));
        }
    } else if (boundary === 'free') {
        for (let n = 0; n <= harmonic; n++) {
            antinodes.push((n * stringLength) / harmonic);
        }
    } else { 
        for (let n = 0; n < harmonic; n++) {
            antinodes.push((n * stringLength) / harmonic);
        }
    }
    
    return antinodes;
}

// main drawing function
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
    const centerY = canvas.height / (2 * zoom);
    const padding = 100;
    const startStringX = padding;
    const endStringX = canvas.width / zoom - padding;
    const stringPixelLength = endStringX - startStringX;
    const pixelsPerMeter = stringPixelLength / stringLength;
    if (showEnvelope) {
        ctx.strokeStyle = colors.envelope + '60';
        ctx.lineWidth = 2/zoom;
        ctx.setLineDash([5, 5]);
        
        ctx.beginPath();
        for (let px = startStringX; px <= endStringX; px += 2) {
            const x = (px - startStringX) / pixelsPerMeter;
            const maxY = 2 * amplitude * Math.abs(Math.sin((2 * Math.PI * x) / getWavelength()));
            const y = centerY - maxY * pixelsPerMeter;
            if (px === startStringX) {
                ctx.moveTo(px, y);
            } else {
                ctx.lineTo(px, y);
            }
        }
        ctx.stroke();
        ctx.beginPath();
        for (let px = startStringX; px <= endStringX; px += 2) {
            const x = (px - startStringX) / pixelsPerMeter;
            const maxY = 2 * amplitude * Math.abs(Math.sin((2 * Math.PI * x) / getWavelength()));
            const y = centerY + maxY * pixelsPerMeter;
            if (px === startStringX) {
                ctx.moveTo(px, y);
            } else {
                ctx.lineTo(px, y);
            }
        }
        ctx.stroke();
        ctx.setLineDash([]);
    }
    ctx.strokeStyle = colors.wave;
    ctx.lineWidth = 3/zoom;
    ctx.beginPath();
    for (let px = startStringX; px <= endStringX; px += 1) {
        const x = (px - startStringX) / pixelsPerMeter;
        const y = getStandingWaveValue(x, time);
        const screenY = centerY - y * pixelsPerMeter;
        if (px === startStringX) {
            ctx.moveTo(px, screenY);
        } else {
            ctx.lineTo(px, screenY);
        }
    }
    ctx.stroke();
    
    // draw fixed endpoints
    if (boundary === 'fixed' || boundary === 'mixed') {
        ctx.fillStyle = colors.text;
        ctx.beginPath();
        ctx.arc(startStringX, centerY, 6/zoom, 0, Math.PI * 2);
        ctx.fill();
        if (boundary === 'fixed') {
            ctx.beginPath();
            ctx.arc(endStringX, centerY, 6/zoom, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // nodes
    if (showNodes) {
        const nodes = getNodePositions();
        ctx.fillStyle = colors.node;
        for (let nodePos of nodes) {
            const px = startStringX + nodePos * pixelsPerMeter;
            ctx.beginPath();
            ctx.arc(px, centerY, 8/zoom, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = colors.node + '40';
            ctx.lineWidth = 1/zoom;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(px, centerY - 50/zoom);
            ctx.lineTo(px, centerY + 50/zoom);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
    
    // antinodes
    if (showAntinodes) {
        const antinodes = getAntinodePositions();
        
        for (let i = 0; i < antinodes.length; i++) {
            const antinodePos = antinodes[i];
            const px = startStringX + antinodePos * pixelsPerMeter;
            const y = getStandingWaveValue(antinodePos, time);
            const screenY = centerY - y * pixelsPerMeter;
            const isBeingDragged = draggedAntinode === i;
            const radius = isBeingDragged ? 12/zoom : 8/zoom;
            if (isBeingDragged) {
                const gradient = ctx.createRadialGradient(px, screenY, 0, px, screenY, radius * 2);
                gradient.addColorStop(0, colors.antinode + '80');
                gradient.addColorStop(1, colors.antinode + '00');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(px, screenY, radius * 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.fillStyle = colors.antinode;
            ctx.beginPath();
            ctx.arc(px, screenY, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = colors.text;
            ctx.lineWidth = 2/zoom;
            ctx.stroke();
        }
    }
    
    // info text at top left
    ctx.textAlign = 'left';
    ctx.font = `${12/zoom}px Inter`;
    ctx.fillStyle = colors.text + 'cc';
    let infoY = 20/zoom;
    ctx.fillText(`Harmonic: ${harmonic} (${boundary === 'fixed' ? 'fixed-fixed' : boundary === 'free' ? 'free-free' : 'fixed-free'})`, 15/zoom, infoY);
    infoY += 20/zoom;
    ctx.fillText(`String Length: ${stringLength}m`, 15/zoom, infoY);
    
    ctx.restore();
}

// animation loop
function animate() {
    if (!isAnimating) return;
    
    time += 0.016; 
    draw();
    
    if (isAnimating) {
        animationFrame = requestAnimationFrame(animate);
    }
}

// init everything
setTimeout(() => {
    updateStats();
    updateZoomDisplay();
    draw();
    animate();
}, 100);