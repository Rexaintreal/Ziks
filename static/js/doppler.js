// doppler params
let motionType = 'linear';
let sourceVelocity = 30;
let waveSpeed = 343; 
let sourceFrequency = 440; 
let amplitude = 1;
let observerPosition = 'right';
let time = 0;
let isAnimating = true;
let animationFrame = null;
let showWavefronts = true;
let showVelocityVector = true;
let showWavelengths = true;
let playSound = false;
let zoom = 1;
let panX = 0;
let panY = 0;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3;
let sourcePos = { x: 200, y: 300 };
let sourceVel = { x: 30, y: 0 };
let customPath = [];
let pathProgress = 0;
let observers = [];
let draggedObserver = null;
let draggedSource = false;
let wavefronts = [];
let lastWavefrontTime = 0;
// audio 
let audioContext = null;
let oscillator = null;
let gainNode = null;

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
    if (sourcePos.x === 0 && sourcePos.y === 0) {
        sourcePos = { x: canvas.width / 2, y: canvas.height / 2 };
    }
    
    updateObserverPositions();
    draw();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

//controls
const motionTypeSelect = document.getElementById('motionType');
const sourceVelocitySlider = document.getElementById('sourceVelocity');
const velocityDisplay = document.getElementById('velocityDisplay');
const waveSpeedSlider = document.getElementById('waveSpeed');
const waveSpeedDisplay = document.getElementById('waveSpeedDisplay');
const sourceFrequencySlider = document.getElementById('sourceFrequency');
const frequencyDisplay = document.getElementById('frequencyDisplay');
const amplitudeSlider = document.getElementById('amplitude');
const amplitudeDisplay = document.getElementById('amplitudeDisplay');
const observerPositionSelect = document.getElementById('observerPosition');
const showWavefrontsCheck = document.getElementById('showWavefronts');
const showVelocityVectorCheck = document.getElementById('showVelocityVector');
const showWavelengthsCheck = document.getElementById('showWavelengths');
const playSoundCheck = document.getElementById('playSound');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const resetViewBtn = document.getElementById('resetViewBtn');
const zoomDisplay = document.getElementById('zoomDisplay');

motionTypeSelect.addEventListener('change', () => {
    motionType = motionTypeSelect.value;
    if (motionType === 'custom') {
        customPath = [];
    }
    resetSimulation();
});

sourceVelocitySlider.addEventListener('input', () => {
    sourceVelocity = parseFloat(sourceVelocitySlider.value);
    velocityDisplay.textContent = sourceVelocity + ' m/s';
    updateSourceVelocity();
    updateStats();
});

waveSpeedSlider.addEventListener('input', () => {
    waveSpeed = parseFloat(waveSpeedSlider.value);
    waveSpeedDisplay.textContent = waveSpeed + ' m/s';
    updateStats();
});

sourceFrequencySlider.addEventListener('input', () => {
    sourceFrequency = parseFloat(sourceFrequencySlider.value);
    frequencyDisplay.textContent = sourceFrequency + ' Hz';
    updateStats();
    if (playSound && oscillator) {
        oscillator.frequency.setValueAtTime(sourceFrequency, audioContext.currentTime);
    }
});

amplitudeSlider.addEventListener('input', () => {
    amplitude = parseFloat(amplitudeSlider.value);
    amplitudeDisplay.textContent = amplitude.toFixed(1);
});

observerPositionSelect.addEventListener('change', () => {
    observerPosition = observerPositionSelect.value;
    updateObserverPositions();
    draw();
});

showWavefrontsCheck.addEventListener('change', () => {
    showWavefronts = showWavefrontsCheck.checked;
    draw();
});

showVelocityVectorCheck.addEventListener('change', () => {
    showVelocityVector = showVelocityVectorCheck.checked;
    draw();
});

showWavelengthsCheck.addEventListener('change', () => {
    showWavelengths = showWavelengthsCheck.checked;
    draw();
});

playSoundCheck.addEventListener('change', () => {
    playSound = playSoundCheck.checked;
    if (playSound) {
        initAudio();
    } else {
        stopAudio();
    }
});

startBtn.addEventListener('click', () => {
    if (isAnimating) {
        isAnimating = false;
        cancelAnimationFrame(animationFrame);
        startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Play';
        if (playSound) stopAudio();
    } else {
        isAnimating = true;
        startBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        if (playSound) initAudio();
        animate();
    }
});

resetBtn.addEventListener('click', () => {
    resetSimulation();
});

function resetSimulation() {
    time = 0;
    wavefronts = [];
    lastWavefrontTime = 0;
    pathProgress = 0;
    sourcePos = { x: canvas.width / 2, y: canvas.height / 2 };
    updateSourceVelocity();
    updateObserverPositions();
    updateStats();
    draw();
}

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

// canvas coords
function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left - panX) / zoom,
        y: (e.clientY - rect.top - panY) / zoom
    };
}


let isDrawingPath = false;

canvas.addEventListener('mousedown', (e) => {
    const mouse = getCanvasCoords(e);
    
    // check if clicking on source
    const distToSource = Math.sqrt((mouse.x - sourcePos.x) ** 2 + (mouse.y - sourcePos.y) ** 2);
    if (distToSource < 25) {
        draggedSource = true;
        canvas.style.cursor = 'grabbing';
        return;
    }
    
    // check observers
    for (let i = 0; i < observers.length; i++) {
        const obs = observers[i];
        const dist = Math.sqrt((mouse.x - obs.x) ** 2 + (mouse.y - obs.y) ** 2);
        if (dist < 20) {
            draggedObserver = i;
            canvas.style.cursor = 'grabbing';
            return;
        }
    }
    
    // if custom path mode, start drawing
    if (motionType === 'custom') {
        isDrawingPath = true;
        customPath = [{ x: mouse.x, y: mouse.y }];
    }
});

canvas.addEventListener('mousemove', (e) => {
    const mouse = getCanvasCoords(e);
    
    if (draggedSource) {
        sourcePos = { x: mouse.x, y: mouse.y };
        draw();
    } else if (draggedObserver !== null) {
        observers[draggedObserver] = { x: mouse.x, y: mouse.y };
        updateStats();
        draw();
    } else if (isDrawingPath) {
        const lastPoint = customPath[customPath.length - 1];
        const dist = Math.sqrt((mouse.x - lastPoint.x) ** 2 + (mouse.y - lastPoint.y) ** 2);
        if (dist > 10) {
            customPath.push({ x: mouse.x, y: mouse.y });
        }
        draw();
    } else {
        let overDraggable = false;
        
        const distToSource = Math.sqrt((mouse.x - sourcePos.x) ** 2 + (mouse.y - sourcePos.y) ** 2);
        if (distToSource < 25) {
            overDraggable = true;
        }
        
        for (let obs of observers) {
            const dist = Math.sqrt((mouse.x - obs.x) ** 2 + (mouse.y - obs.y) ** 2);
            if (dist < 20) {
                overDraggable = true;
                break;
            }
        }
        
        canvas.style.cursor = overDraggable ? 'grab' : (motionType === 'custom' ? 'crosshair' : 'default');
    }
});

canvas.addEventListener('mouseup', () => {
    draggedSource = false;
    draggedObserver = null;
    isDrawingPath = false;
    canvas.style.cursor = 'default';
});

canvas.addEventListener('mouseleave', () => {
    draggedSource = false;
    draggedObserver = null;
    isDrawingPath = false;
    canvas.style.cursor = 'default';
});

function updateObserverPositions() {
    observers = [];
    
    if (observerPosition === 'left') {
        observers.push({ x: 100, y: canvas.height / 2 });
    } else if (observerPosition === 'right') {
        observers.push({ x: canvas.width - 100, y: canvas.height / 2 });
    } else if (observerPosition === 'both') {
        observers.push({ x: 100, y: canvas.height / 2 });
        observers.push({ x: canvas.width - 100, y: canvas.height / 2 });
    } else if (observerPosition === 'drag') {
        if (observers.length === 0) {
            observers.push({ x: canvas.width - 100, y: canvas.height / 2 });
        }
    }
}
function updateSourceVelocity() {
    const speed = sourceVelocity;
    
    if (motionType === 'linear') {
        sourceVel = { x: speed, y: 0 };
    } else if (motionType === 'circular') {
    } else if (motionType === 'oscillating') {
        sourceVel = { x: speed, y: 0 };
    }
}

// doppler formulas
function getDopplerFrequency(observerPos) {
    const dx = observerPos.x - sourcePos.x;
    const dy = observerPos.y - sourcePos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return sourceFrequency;
    
    // unit vector from source to observer
    const dirX = dx / distance;
    const dirY = dy / distance;
    
    // component of source velocity toward observer
    const vRelative = sourceVel.x * dirX + sourceVel.y * dirY;
    
    // doppler formula: f' = f * c / (c - v)
    // approaching v is negative
    // receding v is positive 
    const observedFreq = sourceFrequency * waveSpeed / (waveSpeed + vRelative);
    
    return observedFreq;
}

function updateStats() {
    const wavelengthFront = (waveSpeed - sourceVelocity) / sourceFrequency;
    const wavelengthBack = (waveSpeed + sourceVelocity) / sourceFrequency;
    const freqApproaching = sourceFrequency * waveSpeed / (waveSpeed - sourceVelocity);
    const freqReceding = sourceFrequency * waveSpeed / (waveSpeed + sourceVelocity);
    
    document.getElementById('freqApproaching').textContent = Math.round(freqApproaching) + ' Hz';
    document.getElementById('freqReceding').textContent = Math.round(freqReceding) + ' Hz';
    document.getElementById('wavelengthFront').textContent = wavelengthFront.toFixed(2) + ' m';
    document.getElementById('wavelengthBack').textContent = wavelengthBack.toFixed(2) + ' m';
}

function getThemeColors() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    
    return {
        bg: isDark ? '#0a0a0a' : '#ffffff',
        gridLine: isDark ? '#ffffff08' : '#00000008',
        wave: isDark ? '#4dabf7' : '#1c7ed6',
        waveLight: isDark ? '#74c0fc' : '#4dabf7',
        waveDark: isDark ? '#1c7ed6' : '#1864ab',
        source: isDark ? '#ff6b6b' : '#e03131',
        observer: isDark ? '#51cf66' : '#2f9e44',
        velocity: isDark ? '#ffd43b' : '#fab005',
        text: isDark ? '#ffffff' : '#000000',
        path: isDark ? '#ffffff40' : '#00000040'
    };
}

// audio 
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        gainNode = audioContext.createGain();
        gainNode.gain.value = 0.1;
        gainNode.connect(audioContext.destination);
    }
    
    if (!oscillator) {
        oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(sourceFrequency, audioContext.currentTime);
        oscillator.connect(gainNode);
        oscillator.start();
    }
}

function stopAudio() {
    if (oscillator) {
        oscillator.stop();
        oscillator = null;
    }
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
    if (motionType === 'custom' && customPath.length > 1) {
        ctx.strokeStyle = colors.path;
        ctx.lineWidth = 2/zoom;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(customPath[0].x, customPath[0].y);
        for (let i = 1; i < customPath.length; i++) {
            ctx.lineTo(customPath[i].x, customPath[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
    }
    if (showWavefronts) {
        for (let wf of wavefronts) {
            const age = time - wf.birthTime;
            const radius = age * waveSpeed;
            const maxAge = 3;
            const opacity = Math.max(0, 1 - age / maxAge);
            
            if (opacity > 0) {
                ctx.strokeStyle = colors.wave + Math.floor(opacity * 100).toString(16).padStart(2, '0');
                ctx.lineWidth = 2/zoom;
                ctx.beginPath();
                ctx.arc(wf.x, wf.y, radius, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }
    
    if (showWavelengths && wavefronts.length > 1) {
        const wf1 = wavefronts[wavefronts.length - 1];
        const wf2 = wavefronts[wavefronts.length - 2];
        
        if (wf1 && wf2) {
            const age1 = time - wf1.birthTime;
            const age2 = time - wf2.birthTime;
            const radius1 = age1 * waveSpeed;
            const radius2 = age2 * waveSpeed;
            const rightX = sourcePos.x + radius1;
            const leftX = sourcePos.x - radius1;
            
            ctx.strokeStyle = colors.velocity;
            ctx.lineWidth = 3/zoom;
            ctx.setLineDash([]);
            
            // right side (compressed)
            ctx.beginPath();
            ctx.moveTo(wf2.x + radius2, wf2.y);
            ctx.lineTo(wf1.x + radius1, wf1.y);
            ctx.stroke();
            
            // left side (stretched)
            ctx.beginPath();
            ctx.moveTo(wf2.x - radius2, wf2.y);
            ctx.lineTo(wf1.x - radius1, wf1.y);
            ctx.stroke();
        }
    }
    const sourceRadius = 20/zoom;
    const pulseSize = sourceRadius + Math.sin(time * sourceFrequency * 0.1) * 3;
    
    const gradient = ctx.createRadialGradient(sourcePos.x, sourcePos.y, 0, sourcePos.x, sourcePos.y, pulseSize * 2);
    gradient.addColorStop(0, colors.source + '80');
    gradient.addColorStop(1, colors.source + '00');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(sourcePos.x, sourcePos.y, pulseSize * 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = colors.source;
    ctx.beginPath();
    ctx.arc(sourcePos.x, sourcePos.y, sourceRadius, 0, Math.PI * 2);
    ctx.fill();
    if (showVelocityVector) {
        const velMag = Math.sqrt(sourceVel.x ** 2 + sourceVel.y ** 2);
        if (velMag > 0) {
            const arrowLength = 80;
            const arrowX = sourcePos.x + (sourceVel.x / velMag) * arrowLength;
            const arrowY = sourcePos.y + (sourceVel.y / velMag) * arrowLength;
            
            ctx.strokeStyle = colors.velocity;
            ctx.lineWidth = 3/zoom;
            ctx.beginPath();
            ctx.moveTo(sourcePos.x, sourcePos.y);
            ctx.lineTo(arrowX, arrowY);
            ctx.stroke();
            const angle = Math.atan2(sourceVel.y, sourceVel.x);
            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(arrowX - 15 * Math.cos(angle - Math.PI/6), arrowY - 15 * Math.sin(angle - Math.PI/6));
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(arrowX - 15 * Math.cos(angle + Math.PI/6), arrowY - 15 * Math.sin(angle + Math.PI/6));
            ctx.stroke();
        }
    }
    for (let obs of observers) {
        const obsRadius = 15/zoom;
        
        ctx.fillStyle = colors.observer;
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obsRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = colors.text;
        ctx.lineWidth = 2/zoom;
        ctx.stroke();
        ctx.fillStyle = colors.text;
        ctx.font = `${16/zoom}px Inter`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👂', obs.x, obs.y);
        const obsFreq = getDopplerFrequency(obs);
        ctx.font = `${12/zoom}px Inter`;
        ctx.fillStyle = colors.text;
        ctx.fillText(Math.round(obsFreq) + ' Hz', obs.x, obs.y - obsRadius - 15);
    }
    
    ctx.restore();
}

function animate() {
    if (!isAnimating) return;
    
    const dt = 0.016;
    time += dt;
    if (motionType === 'linear') {
        sourcePos.x += sourceVel.x * dt;
        sourcePos.y += sourceVel.y * dt;
        if (sourcePos.x > canvas.width) sourcePos.x = 0;
        if (sourcePos.x < 0) sourcePos.x = canvas.width;
    } else if (motionType === 'circular') {
        const radius = 150;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const angularVel = sourceVelocity / radius;
        const angle = time * angularVel;
        
        sourcePos.x = centerX + Math.cos(angle) * radius;
        sourcePos.y = centerY + Math.sin(angle) * radius;
        sourceVel.x = -Math.sin(angle) * sourceVelocity;
        sourceVel.y = Math.cos(angle) * sourceVelocity;
    } else if (motionType === 'oscillating') {
        const amplitude = 200;
        const centerX = canvas.width / 2;
        sourcePos.x = centerX + Math.sin(time * 2) * amplitude;
        sourcePos.y = canvas.height / 2;
        
        sourceVel.x = Math.cos(time * 2) * 2 * amplitude;
        sourceVel.y = 0;
    } else if (motionType === 'custom' && customPath.length > 1) {
        pathProgress += sourceVelocity * dt;
        
        let totalLength = 0;
        for (let i = 1; i < customPath.length; i++) {
            const dx = customPath[i].x - customPath[i-1].x;
            const dy = customPath[i].y - customPath[i-1].y;
            totalLength += Math.sqrt(dx * dx + dy * dy);
        }
        
        pathProgress = pathProgress % totalLength;
        let accumulatedLength = 0;
        for (let i = 1; i < customPath.length; i++) {
            const dx = customPath[i].x - customPath[i-1].x;
            const dy = customPath[i].y - customPath[i-1].y;
            const segmentLength = Math.sqrt(dx * dx + dy * dy);
            
            if (accumulatedLength + segmentLength >= pathProgress) {
                const t = (pathProgress - accumulatedLength) / segmentLength;
                sourcePos.x = customPath[i-1].x + dx * t;
                sourcePos.y = customPath[i-1].y + dy * t;
                
                sourceVel.x = (dx / segmentLength) * sourceVelocity;
                sourceVel.y = (dy / segmentLength) * sourceVelocity;
                break;
            }
            
            accumulatedLength += segmentLength;
        }
    }
    
    // emit new wavefront
    const period = 1 / sourceFrequency;
    if (time - lastWavefrontTime >= period * 0.1) {
        wavefronts.push({
            x: sourcePos.x,
            y: sourcePos.y,
            birthTime: time
        });
        lastWavefrontTime = time;
    }
    
    // remove old wavefronts
    wavefronts = wavefronts.filter(wf => time - wf.birthTime < 3);
    
    // update audio if enabled
    if (playSound && oscillator && observers.length > 0) {
        const obsFreq = getDopplerFrequency(observers[0]);
        oscillator.frequency.setValueAtTime(obsFreq, audioContext.currentTime);
    }
    
    draw();
    
    if (isAnimating) {
        animationFrame = requestAnimationFrame(animate);
    }
}

// init
setTimeout(() => {
    sourcePos = { x: canvas.width / 2, y: canvas.height / 2 };
    updateSourceVelocity();
    updateObserverPositions();
    updateStats();
    updateZoomDisplay();
    draw();
    animate();
}, 100);