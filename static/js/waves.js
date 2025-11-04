// params
let numSources = 2;
let waveType = 'water';
let frequency = 2;
let wavelength = 40; 
let amplitude = 1; 
let sourceSeparation = 80; 
let sources = [];
let time = 0;
let isAnimating = true;
let animationFrame = null;
let showWavefronts = true;
let showSources = true;
let showInterference = false;
let zoom = 1;
let panX = 0;
let panY = 0;
let isPanning = false;
let lastMouseX = 0;
let lastMouseY = 0;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 4;
let draggedSource = null;
let waveField = [];
let fieldResolution = 4; 

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
    
    calculateWaveField();
    initializeSources();
    draw();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// control elements form the page
const numSourcesSelect = document.getElementById('numSources');
const waveTypeSelect = document.getElementById('waveType');
const frequencySlider = document.getElementById('frequency');
const frequencyDisplay = document.getElementById('frequencyDisplay');
const wavelengthSlider = document.getElementById('wavelength');
const wavelengthDisplay = document.getElementById('wavelengthDisplay');
const amplitudeSlider = document.getElementById('amplitude');
const amplitudeDisplay = document.getElementById('amplitudeDisplay');
const separationSlider = document.getElementById('separation');
const separationDisplay = document.getElementById('separationDisplay');
const showWavefrontsCheck = document.getElementById('showWavefronts');
const showSourcesCheck = document.getElementById('showSources');
const showInterferenceCheck = document.getElementById('showInterference');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const resetViewBtn = document.getElementById('resetViewBtn');
const zoomDisplay = document.getElementById('zoomDisplay');

// Set up wave sources in nice patterns depending on how many we have
function initializeSources() {
    sources = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    if (numSources === 1) {
        sources.push({ x: centerX, y: centerY });
    } else if (numSources === 2) {
        sources.push({ x: centerX - sourceSeparation/2, y: centerY });
        sources.push({ x: centerX + sourceSeparation/2, y: centerY });
    } else if (numSources === 3) {
        const radius = sourceSeparation * 0.6;
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
            sources.push({
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius
            });
        }
    } else if (numSources === 4) {
        const half = sourceSeparation / 2;
        sources.push({ x: centerX - half, y: centerY - half });
        sources.push({ x: centerX + half, y: centerY - half });
        sources.push({ x: centerX - half, y: centerY + half });
        sources.push({ x: centerX + half, y: centerY + half });
    }
}

// listeneres
numSourcesSelect.addEventListener('change', () => {
    numSources = parseInt(numSourcesSelect.value);
    initializeSources();
    calculateWaveField();
    updateStats();
    draw();
});

waveTypeSelect.addEventListener('change', () => {
    waveType = waveTypeSelect.value;
    draw();
});

frequencySlider.addEventListener('input', () => {
    frequency = parseFloat(frequencySlider.value);
    frequencyDisplay.textContent = frequency.toFixed(1) + ' Hz';
    updateStats();
});

wavelengthSlider.addEventListener('input', () => {
    wavelength = parseFloat(wavelengthSlider.value);
    wavelengthDisplay.textContent = wavelength + ' m';
    calculateWaveField();
    updateStats();
});

amplitudeSlider.addEventListener('input', () => {
    amplitude = parseFloat(amplitudeSlider.value);
    amplitudeDisplay.textContent = amplitude.toFixed(1);
});

separationSlider.addEventListener('input', () => {
    sourceSeparation = parseFloat(separationSlider.value);
    separationDisplay.textContent = sourceSeparation + ' m';
    initializeSources();
    calculateWaveField();
    draw();
});

showWavefrontsCheck.addEventListener('change', () => {
    showWavefronts = showWavefrontsCheck.checked;
    draw();
});

showSourcesCheck.addEventListener('change', () => {
    showSources = showSourcesCheck.checked;
    draw();
});

showInterferenceCheck.addEventListener('change', () => {
    showInterference = showInterferenceCheck.checked;
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
    initializeSources();
    calculateWaveField();
    updateStats();
    draw();
});

// zoom
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
    
    //if user clicking on the source
    for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        const dist = Math.sqrt((mouseX - source.x) ** 2 + (mouseY - source.y) ** 2);
        if (dist < 20) {
            draggedSource = i;
            canvas.style.cursor = 'grabbing';
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
    
    if (draggedSource !== null) {
        sources[draggedSource].x = mouseX;
        sources[draggedSource].y = mouseY;
        calculateWaveField();
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
        let overSource = false;
        for (let source of sources) {
            const dist = Math.sqrt((mouseX - source.x) ** 2 + (mouseY - source.y) ** 2);
            if (dist < 20) {
                overSource = true;
                break;
            }
        }
        canvas.style.cursor = overSource ? 'grab' : 'crosshair';
    }
});

canvas.addEventListener('mouseup', () => {
    isPanning = false;
    draggedSource = null;
    canvas.style.cursor = 'crosshair';
});

canvas.addEventListener('mouseleave', () => {
    isPanning = false;
    draggedSource = null;
    canvas.style.cursor = 'crosshair';
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());
function updateStats() {
    // Wave equation v = f * lambda 
    const waveSpeed = frequency * wavelength;
    const period = 1 / frequency;
    
    document.getElementById('waveSpeed').textContent = waveSpeed.toFixed(1) + ' m/s';
    document.getElementById('period').textContent = period.toFixed(2) + ' s';
    document.getElementById('activeSources').textContent = sources.length;
}


function getThemeColors() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    
    // diff color for diff wave
    let waveColor, waveColorLight, waveColorDark;
    if (waveType === 'water') {
        waveColor = isDark ? '#4dabf7' : '#1c7ed6';
        waveColorLight = isDark ? '#74c0fc' : '#4dabf7';
        waveColorDark = isDark ? '#1c7ed6' : '#1864ab';
    } else if (waveType === 'sound') {
        waveColor = isDark ? '#ffd43b' : '#fab005';
        waveColorLight = isDark ? '#ffe066' : '#ffd43b';
        waveColorDark = isDark ? '#fab005' : '#f08c00';
    } else { // light waves
        waveColor = isDark ? '#ff6b6b' : '#e03131';
        waveColorLight = isDark ? '#ff8787' : '#ff6b6b';
        waveColorDark = isDark ? '#e03131' : '#c92a2a';
    }
    
    return {
        bg: isDark ? '#0a0a0a' : '#ffffff',
        gridLine: isDark ? '#ffffff08' : '#00000008',
        wave: waveColor,
        waveLight: waveColorLight,
        waveDark: waveColorDark,
        source: isDark ? '#51cf66' : '#2f9e44',
        text: isDark ? '#ffffff' : '#000000',
        constructive: isDark ? '#ffffff' : '#ffff00',
        destructive: isDark ? '#000000' : '#0000ff'
    };
}
//wave equation y = A * sin(kx - omega*t)
function getWaveValue(x, y, sourceX, sourceY, time) {
    const distance = Math.sqrt((x - sourceX) ** 2 + (y - sourceY) ** 2);
    const k = (2 * Math.PI) / wavelength; // wave number
    const omega = 2 * Math.PI * frequency; // angular frequency
    
    // wave eqn
    const phase = k * distance - omega * time;
    const damping = Math.exp(-distance / (wavelength * 8));
    
    return amplitude * Math.sin(phase) * damping;
}
function calculateWaveField() {
    const width = Math.ceil(canvas.width / zoom / fieldResolution);
    const height = Math.ceil(canvas.height / zoom / fieldResolution);
    
    waveField = new Array(width);
    for (let i = 0; i < width; i++) {
        waveField[i] = new Array(height);
    }
}

// main draw fxn
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
    if (showInterference && sources.length >= 1) {
        const resolution = fieldResolution;
        
        for (let py = 0; py < canvas.height/zoom; py += resolution) {
            for (let px = 0; px < canvas.width/zoom; px += resolution) {
                // Sum up waves from all sources at this point
                let totalAmplitude = 0;
                for (let source of sources) {
                    totalAmplitude += getWaveValue(px, py, source.x, source.y, time);
                }
                const normalized = totalAmplitude / (sources.length * amplitude);
                
                //color intensity
                let fillColor;
                if (normalized > 0) {
                    //constructive
                    const intensity = Math.min(1, Math.abs(normalized));
                    const alpha = intensity * 0.6;
                    fillColor = colors.waveLight + Math.floor(alpha * 255).toString(16).padStart(2, '0');
                } else {
                    //destructive
                    const intensity = Math.min(1, Math.abs(normalized));
                    const alpha = intensity * 0.4;
                    fillColor = colors.waveDark + Math.floor(alpha * 255).toString(16).padStart(2, '0');
                }
                ctx.fillStyle = fillColor;
                ctx.fillRect(px, py, resolution, resolution);
            }
        }
    }
    
    //dwaring wavefront circula rings form each source
    if (showWavefronts) {
        sources.forEach((source, sourceIndex) => {
            const maxRadius = Math.max(canvas.width, canvas.height) / zoom;
            const numRings = Math.ceil(maxRadius / wavelength) + 3;
            for (let i = 0; i < numRings; i++) {
                const baseRadius = wavelength * i;
                const offset = (time * frequency * wavelength) % wavelength;
                const radius = baseRadius - offset;
                if (radius > 0 && radius < maxRadius) {
                    const waveValue = Math.sin(2 * Math.PI * (i - time * frequency));
                    const fadeOut = Math.max(0, 1 - (radius / maxRadius) * 0.7);
                    const baseOpacity = 0.3 + Math.abs(waveValue) * 0.4;
                    const opacity = baseOpacity * fadeOut;
                    const thickness = (2 + Math.abs(waveValue) * 2) / zoom;
                    const color = waveValue > 0 ? colors.waveLight : colors.wave;
                    ctx.strokeStyle = color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
                    ctx.lineWidth = thickness;
                    ctx.beginPath();
                    ctx.arc(source.x, source.y, radius, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        });
    }
    if (showSources) {
        sources.forEach((source, index) => {
            const pulsePhase = time * frequency * Math.PI * 2;
            const pulseSize = 12 + Math.sin(pulsePhase) * 4;
            const gradient = ctx.createRadialGradient(source.x, source.y, 0, source.x, source.y, pulseSize * 2);
            gradient.addColorStop(0, colors.source + '80');
            gradient.addColorStop(1, colors.source + '00');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(source.x, source.y, pulseSize * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = colors.source;
            ctx.beginPath();
            ctx.arc(source.x, source.y, pulseSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = colors.text;
            ctx.lineWidth = 2/zoom;
            ctx.stroke();
            ctx.fillStyle = colors.text + '40';
            ctx.beginPath();
            ctx.arc(source.x - pulseSize * 0.3, source.y - pulseSize * 0.3, pulseSize * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = colors.text;
            ctx.font = `bold ${14/zoom}px Inter`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const labelY = source.y - pulseSize - 18;
            const labelText = `S${index + 1}`;
            const textWidth = ctx.measureText(labelText).width;
            
            ctx.fillStyle = colors.bg + 'cc';
            ctx.fillRect(source.x - textWidth/2 - 4, labelY - 8, textWidth + 8, 16);
            
            ctx.fillStyle = colors.text;
            ctx.fillText(labelText, source.x, labelY);
        });
    }
    ctx.textAlign = 'left';
    ctx.font = `${12/zoom}px Inter`;
    ctx.fillStyle = colors.text + 'cc';
    const infoX = 15;
    let infoY = 20;
    ctx.fillText(`Wave Type: ${waveType.charAt(0).toUpperCase() + waveType.slice(1)}`, infoX, infoY);
    infoY += 20;
    ctx.fillText(`Sources: ${sources.length}`, infoX, infoY);
    infoY += 20;
    ctx.fillText(`λ = ${wavelength}m, f = ${frequency}Hz`, infoX, infoY);
    
    ctx.restore();
}

// animation loop this is  called every frame
function animate() {
    if (!isAnimating) return;
    time += 0.03;
    draw();
    if (isAnimating) {
        animationFrame = requestAnimationFrame(animate);
    }
}

//init
setTimeout(() => {
    initializeSources();
    calculateWaveField();
    updateStats();
    updateZoomDisplay();
    draw();
    animate();
}, 100);