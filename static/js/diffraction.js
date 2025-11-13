let wavelength = 550; 
let slitSeparation = 100; 
let slitWidth = 25; 
let screenDistance = 150;
let intensityScale = 100;
let numSlits = 2;
let screenPosition = 0.75;
let animationSpeed = 1;
let showSlits = true;
let showRays = true;
let showGraph = true;
let showMaxima = true;
let showWavefronts = false;
let showPhaseInfo = false;
let isAnimating = false;
let animationPhase = 0;
let isDraggingScreen = false;
let isDraggingSlits = false;
let isDraggingSlit1 = false;
let isDraggingSlit2 = false;
let dragOffset = { x: 0, y: 0 };
let hoverState = {
    screen: false,
    slits: false,
    slit1: false,
    slit2: false
};
let clickPosition = { x: 0, y: 0 };
let measurementMode = false;
let measureStart = null;
let measureEnd = null;

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
    draw();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
const wavelengthSlider = document.getElementById('wavelengthSlider');
const slitSeparationSlider = document.getElementById('slitSeparationSlider');
const slitWidthSlider = document.getElementById('slitWidthSlider');
const screenDistanceSlider = document.getElementById('screenDistanceSlider');
const intensitySlider = document.getElementById('intensitySlider');
const numSlitsSlider = document.getElementById('numSlitsSlider');
const animationSpeedSlider = document.getElementById('animationSpeedSlider');
const wavelengthDisplay = document.getElementById('wavelengthDisplay');
const slitSeparationDisplay = document.getElementById('slitSeparationDisplay');
const slitWidthDisplay = document.getElementById('slitWidthDisplay');
const screenDistanceDisplay = document.getElementById('screenDistanceDisplay');
const intensityDisplay = document.getElementById('intensityDisplay');
const numSlitsDisplay = document.getElementById('numSlitsDisplay');
const animationSpeedDisplay = document.getElementById('animationSpeedDisplay');
const colorPreview = document.getElementById('colorPreview');
const showSlitsCheck = document.getElementById('showSlits');
const showRaysCheck = document.getElementById('showRays');
const showGraphCheck = document.getElementById('showGraph');
const showMaximaCheck = document.getElementById('showMaxima');
const showWavefrontsCheck = document.getElementById('showWavefronts');
const showPhaseCheck = document.getElementById('showPhaseInfo');
const animateBtn = document.getElementById('animateBtn');
const measureBtn = document.getElementById('measureBtn');
wavelengthSlider?.addEventListener('input', () => {
    wavelength = parseFloat(wavelengthSlider.value);
    updateDisplay();
    updateStats();
    draw();
});

slitSeparationSlider?.addEventListener('input', () => {
    slitSeparation = parseFloat(slitSeparationSlider.value);
    updateDisplay();
    updateStats();
    draw();
});

slitWidthSlider?.addEventListener('input', () => {
    slitWidth = parseFloat(slitWidthSlider.value);
    updateDisplay();
    updateStats();
    draw();
});

screenDistanceSlider?.addEventListener('input', () => {
    screenDistance = parseFloat(screenDistanceSlider.value);
    updateDisplay();
    updateStats();
    draw();
});

intensitySlider?.addEventListener('input', () => {
    intensityScale = parseFloat(intensitySlider.value);
    updateDisplay();
    draw();
});

numSlitsSlider?.addEventListener('input', () => {
    numSlits = parseInt(numSlitsSlider.value);
    updateDisplay();
    updateStats();
    draw();
});

animationSpeedSlider?.addEventListener('input', () => {
    animationSpeed = parseFloat(animationSpeedSlider.value);
    updateDisplay();
});

showSlitsCheck?.addEventListener('change', () => {
    showSlits = showSlitsCheck.checked;
    draw();
});

showRaysCheck?.addEventListener('change', () => {
    showRays = showRaysCheck.checked;
    draw();
});

showGraphCheck?.addEventListener('change', () => {
    showGraph = showGraphCheck.checked;
    draw();
});

showMaximaCheck?.addEventListener('change', () => {
    showMaxima = showMaximaCheck.checked;
    draw();
});

showWavefrontsCheck?.addEventListener('change', () => {
    showWavefronts = showWavefrontsCheck.checked;
    draw();
});

showPhaseCheck?.addEventListener('change', () => {
    showPhaseInfo = showPhaseCheck.checked;
    draw();
});

animateBtn?.addEventListener('click', () => {
    isAnimating = !isAnimating;
    animateBtn.innerHTML = isAnimating 
        ? '<i class="fa-solid fa-pause"></i> Pause Animation' 
        : '<i class="fa-solid fa-play"></i> Animate Waves';
    if (isAnimating) animate();
});

measureBtn?.addEventListener('click', () => {
    measurementMode = !measurementMode;
    measureBtn.classList.toggle('active', measurementMode);
    if (!measurementMode) {
        measureStart = null;
        measureEnd = null;
    }
    canvas.style.cursor = measurementMode ? 'crosshair' : 'default';
    draw();
});
document.getElementById('preset1')?.addEventListener('click', () => {
    wavelength = 650;
    wavelengthSlider.value = wavelength;
    updateDisplay();
    updateStats();
    draw();
});

document.getElementById('preset2')?.addEventListener('click', () => {
    wavelength = 530;
    wavelengthSlider.value = wavelength;
    updateDisplay();
    updateStats();
    draw();
});

document.getElementById('preset3')?.addEventListener('click', () => {
    wavelength = 450;
    wavelengthSlider.value = wavelength;
    updateDisplay();
    updateStats();
    draw();
});

document.getElementById('preset4')?.addEventListener('click', () => {
    slitSeparation = 50;
    slitWidth = 10;
    numSlits = 2;
    slitSeparationSlider.value = slitSeparation;
    slitWidthSlider.value = slitWidth;
    numSlitsSlider.value = numSlits;
    updateDisplay();
    updateStats();
    draw();
});

document.getElementById('preset5')?.addEventListener('click', () => {
    slitSeparation = 300;
    slitWidth = 60;
    numSlits = 2;
    slitSeparationSlider.value = slitSeparation;
    slitWidthSlider.value = slitWidth;
    numSlitsSlider.value = numSlits;
    updateDisplay();
    updateStats();
    draw();
});

document.getElementById('preset6')?.addEventListener('click', () => {
    numSlits = 4;
    slitSeparation = 80;
    slitWidth = 20;
    numSlitsSlider.value = numSlits;
    slitSeparationSlider.value = slitSeparation;
    slitWidthSlider.value = slitWidth;
    updateDisplay();
    updateStats();
    draw();
});

function wavelengthToRGB(wavelength) {
    let r, g, b;
    
    if (wavelength >= 380 && wavelength < 440) {
        r = -(wavelength - 440) / (440 - 380);
        g = 0;
        b = 1;
    } else if (wavelength >= 440 && wavelength < 490) {
        r = 0;
        g = (wavelength - 440) / (490 - 440);
        b = 1;
    } else if (wavelength >= 490 && wavelength < 510) {
        r = 0;
        g = 1;
        b = -(wavelength - 510) / (510 - 490);
    } else if (wavelength >= 510 && wavelength < 580) {
        r = (wavelength - 510) / (580 - 510);
        g = 1;
        b = 0;
    } else if (wavelength >= 580 && wavelength < 645) {
        r = 1;
        g = -(wavelength - 645) / (645 - 580);
        b = 0;
    } else if (wavelength >= 645 && wavelength <= 750) {
        r = 1;
        g = 0;
        b = 0;
    } else {
        r = 0;
        g = 0;
        b = 0;
    }
    let factor;
    if (wavelength >= 380 && wavelength < 420) {
        factor = 0.3 + 0.7 * (wavelength - 380) / (420 - 380);
    } else if (wavelength >= 420 && wavelength < 700) {
        factor = 1.0;
    } else if (wavelength >= 700 && wavelength <= 750) {
        factor = 0.3 + 0.7 * (750 - wavelength) / (750 - 700);
    } else {
        factor = 0.0;
    }
    
    r = Math.round(r * factor * 255);
    g = Math.round(g * factor * 255);
    b = Math.round(b * factor * 255);
    
    return `rgb(${r}, ${g}, ${b})`;
}

function updateDisplay() {
    if (wavelengthDisplay) wavelengthDisplay.textContent = wavelength + ' nm';
    if (slitSeparationDisplay) slitSeparationDisplay.textContent = slitSeparation + ' μm';
    if (slitWidthDisplay) slitWidthDisplay.textContent = slitWidth + ' μm';
    if (screenDistanceDisplay) screenDistanceDisplay.textContent = screenDistance + ' cm';
    if (intensityDisplay) intensityDisplay.textContent = intensityScale + '%';
    if (numSlitsDisplay) numSlitsDisplay.textContent = numSlits;
    if (animationSpeedDisplay) animationSpeedDisplay.textContent = animationSpeed.toFixed(1) + 'x';
    
    const color = wavelengthToRGB(wavelength);
    if (colorPreview) {
        colorPreview.style.background = color;
        colorPreview.style.boxShadow = `0 0 12px ${color}`;
    }
    
    const wavelengthBar = document.querySelector('.wavelength-bar');
    if (wavelengthBar) {
        const position = ((wavelength - 380) / (750 - 380)) * 100;
        wavelengthBar.style.setProperty('--indicator-position', `${position}%`);
    }
}

function updateStats() {
    const lambda_m = wavelength * 1e-9;
    const d_m = slitSeparation * 1e-6;
    const L_m = screenDistance * 0.01;
    
    const fringeSpacing = (lambda_m * L_m / d_m) * 1000;
    const angularWidth = Math.atan(fringeSpacing / 1000 / L_m) * 180 / Math.PI;
    
    const screenHeight = canvas.height;
    const pixelsPerMeter = canvas.height / 0.2;
    const maxY = screenHeight / 2;
    let visibleMaxima = 0;
    
    for (let m = 0; m < 20; m++) {
        const y = m * fringeSpacing * 0.001 * pixelsPerMeter;
        if (y < maxY) visibleMaxima++;
        else break;
    }
    visibleMaxima = visibleMaxima * 2 - 1;
    document.getElementById('fringeSpacingValue').textContent = fringeSpacing.toFixed(2) + ' mm';
    document.getElementById('angularWidthValue').textContent = angularWidth.toFixed(2) + '°';
    document.getElementById('centralMaxValue').textContent = '100%';
    document.getElementById('visibleMaximaValue').textContent = visibleMaxima;
}

function calculateIntensity(y, screenCenterY) {
    const lambda_m = wavelength * 1e-9;
    const d_m = slitSeparation * 1e-6;
    const a_m = slitWidth * 1e-6;
    const L_m = screenDistance * 0.01;
    
    const pixelsPerMeter = canvas.height / 0.2;
    const y_m = (y - screenCenterY) / pixelsPerMeter;
    const theta = Math.atan(y_m / L_m);
    const sinTheta = Math.sin(theta);
    const delta = (2 * Math.PI * d_m * sinTheta) / lambda_m;
    let interference;
    if (numSlits === 1) {
        interference = 1;
    } else {
        const numerator = Math.sin(numSlits * delta / 2);
        const denominator = Math.sin(delta / 2);
        if (Math.abs(denominator) < 0.001) {
            interference = numSlits * numSlits;
        } else {
            interference = Math.pow(numerator / denominator, 2) / (numSlits * numSlits);
        }
    }
    const alpha = (Math.PI * a_m * sinTheta) / lambda_m;
    let diffraction;
    if (Math.abs(alpha) < 0.001) {
        diffraction = 1;
    } else {
        diffraction = Math.pow(Math.sin(alpha) / alpha, 2);
    }
    
    return interference * diffraction;
}

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function checkHover(mouseX, mouseY) {
    const slitX = canvas.width * 0.15;
    const screenX = canvas.width * screenPosition;
    const centerY = canvas.height / 2;
    const slitGap = 30;
    hoverState.screen = Math.abs(mouseX - screenX) < 20;
    hoverState.slits = Math.abs(mouseX - slitX) < 20;
    hoverState.slit1 = Math.abs(mouseX - slitX) < 15 && Math.abs(mouseY - (centerY - slitGap / 2)) < 10;
    hoverState.slit2 = Math.abs(mouseX - slitX) < 15 && Math.abs(mouseY - (centerY + slitGap / 2)) < 10;
}

canvas.addEventListener('mousedown', (e) => {
    const pos = getMousePos(e);
    checkHover(pos.x, pos.y);
    
    if (measurementMode) {
        if (!measureStart) {
            measureStart = pos;
        } else {
            measureEnd = pos;
        }
        draw();
        return;
    }
    
    if (hoverState.screen) {
        isDraggingScreen = true;
        dragOffset.x = pos.x - canvas.width * screenPosition;
        canvas.style.cursor = 'grabbing';
    } else if (hoverState.slit1 || hoverState.slit2) {
        if (hoverState.slit1) isDraggingSlit1 = true;
        if (hoverState.slit2) isDraggingSlit2 = true;
        canvas.style.cursor = 'grabbing';
    } else if (hoverState.slits) {
        isDraggingSlits = true;
        dragOffset.y = pos.y - canvas.height / 2;
        canvas.style.cursor = 'grabbing';
    }
});

canvas.addEventListener('mousemove', (e) => {
    const pos = getMousePos(e);
    
    if (measurementMode) {
        if (measureStart && !measureEnd) {
            draw();
            const colors = getThemeColors();
            ctx.strokeStyle = colors.measureLine;
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(measureStart.x, measureStart.y);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        return;
    }
    
    if (isDraggingScreen) {
        const newPos = (pos.x - dragOffset.x) / canvas.width;
        screenPosition = Math.max(0.5, Math.min(0.9, newPos));
        draw();
    } else if (isDraggingSlit1 || isDraggingSlit2) {
        const centerY = canvas.height / 2;
        const currentGap = slitSeparation * 0.3;
        
        if (isDraggingSlit1) {
            const newGap = Math.abs((pos.y - centerY) * 2);
            slitSeparation = Math.max(10, Math.min(500, newGap / 0.3));
        } else if (isDraggingSlit2) {
            const newGap = Math.abs((pos.y - centerY) * 2);
            slitSeparation = Math.max(10, Math.min(500, newGap / 0.3));
        }
        
        slitSeparationSlider.value = slitSeparation;
        updateDisplay();
        updateStats();
        draw();
    } else if (isDraggingSlits) {
        draw();
    } else {
        checkHover(pos.x, pos.y);
        
        if (hoverState.screen || hoverState.slits || hoverState.slit1 || hoverState.slit2) {
            canvas.style.cursor = 'grab';
        } else {
            canvas.style.cursor = measurementMode ? 'crosshair' : 'default';
        }
        
        draw();
    }
});

canvas.addEventListener('mouseup', () => {
    isDraggingScreen = false;
    isDraggingSlits = false;
    isDraggingSlit1 = false;
    isDraggingSlit2 = false;
    canvas.style.cursor = measurementMode ? 'crosshair' : 'default';
});

canvas.addEventListener('mouseleave', () => {
    isDraggingScreen = false;
    isDraggingSlits = false;
    isDraggingSlit1 = false;
    isDraggingSlit2 = false;
    hoverState = {
        screen: false,
        slits: false,
        slit1: false,
        slit2: false
    };
    canvas.style.cursor = 'default';
    draw();
});
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -5 : 5;
    wavelength = Math.max(380, Math.min(750, wavelength + delta));
    wavelengthSlider.value = wavelength;
    updateDisplay();
    updateStats();
    draw();
}, { passive: false });
canvas.addEventListener('dblclick', () => {
    if (measurementMode) {
        measureStart = null;
        measureEnd = null;
        draw();
    }
});

function animate() {
    if (!isAnimating) return;
    
    animationPhase += 0.05 * animationSpeed;
    if (animationPhase > 2 * Math.PI) animationPhase = 0;
    
    draw();
    requestAnimationFrame(animate);
}

function getThemeColors() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    
    return {
        bg: isDark ? '#0a0a0a' : '#f8f9fa',
        text: isDark ? '#ffffff' : '#000000',
        border: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        slitColor: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
        slitHover: isDark ? 'rgba(77, 171, 247, 0.8)' : 'rgba(77, 171, 247, 0.6)',
        screenColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        screenHover: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
        graphLine: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
        maximaColor: '#51cf66',
        minimaColor: '#ff6b6b',
        measureLine: '#ffd43b',
        wavefront: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'
    };
}

function draw() {
    if (!canvas || !ctx) return;
    
    const colors = getThemeColors();
    const lightColor = wavelengthToRGB(wavelength);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const slitX = canvas.width * 0.15;
    const screenX = canvas.width * screenPosition;
    const centerY = canvas.height / 2;
    const slitHeight = 8;
    const slitGap = slitSeparation * 0.3;
    if (showWavefronts) {
        const numWavefronts = 8;
        for (let i = 0; i < numWavefronts; i++) {
            const phase = (i / numWavefronts) * 2 * Math.PI + animationPhase;
            const radius = (i * 30) + (animationPhase / (2 * Math.PI)) * 30;
            
            for (let s = 0; s < numSlits; s++) {
                const slitY = centerY + (s - (numSlits - 1) / 2) * slitGap;
                
                ctx.strokeStyle = lightColor;
                ctx.globalAlpha = 0.3 * (1 - i / numWavefronts);
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(slitX, slitY, radius, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        ctx.globalAlpha = 1;
    }
    if (showSlits) {
        const slitColor = (hoverState.slits || isDraggingSlits) ? colors.slitHover : colors.slitColor;
        ctx.fillStyle = slitColor;
        const totalHeight = (numSlits - 1) * slitGap + slitHeight * numSlits;
        const startY = centerY - totalHeight / 2;
        ctx.fillRect(slitX - 10, 0, 20, startY);
        for (let i = 0; i < numSlits; i++) {
            const slitY = startY + i * (slitGap + slitHeight);
            
            if (i > 0) {
                ctx.fillRect(slitX - 10, slitY - slitGap, 20, slitGap);
            }
            const isHovered = (i === 0 && hoverState.slit1) || (i === 1 && hoverState.slit2 && numSlits === 2);
            ctx.fillStyle = isHovered ? colors.slitHover : lightColor;
            ctx.globalAlpha = isHovered ? 0.5 : 0.3;
            ctx.fillRect(slitX - 10, slitY, 20, slitHeight);
            ctx.globalAlpha = 1;
            ctx.fillStyle = slitColor;
            if ((i === 0 || i === 1) && numSlits >= 2 && (hoverState.slits || isDraggingSlit1 || isDraggingSlit2)) {
                ctx.fillStyle = '#4dabf7';
                ctx.beginPath();
                ctx.arc(slitX, slitY + slitHeight / 2, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = colors.text;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
        const endY = startY + (numSlits - 1) * (slitGap + slitHeight) + slitHeight;
        ctx.fillStyle = slitColor;
        ctx.fillRect(slitX - 10, endY, 20, canvas.height - endY);
        if (hoverState.slits || isDraggingSlits) {
            ctx.strokeStyle = '#4dabf7';
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.strokeRect(slitX - 20, startY - 10, 40, totalHeight + 20);
            ctx.setLineDash([]);
        }
    }
    if (showRays) {
        const numRays = 15;
        for (let i = -numRays; i <= numRays; i++) {
            const targetY = centerY + (i / numRays) * (canvas.height * 0.4);
            
            ctx.strokeStyle = lightColor;
            ctx.globalAlpha = 0.1;
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            
            for (let s = 0; s < numSlits; s++) {
                const slitY = centerY + (s - (numSlits - 1) / 2) * slitGap;
                ctx.beginPath();
                ctx.moveTo(slitX, slitY);
                ctx.lineTo(screenX, targetY);
                ctx.stroke();
            }
            ctx.setLineDash([]);
            ctx.globalAlpha = 1;
        }
    }
    const screenColor = (hoverState.screen || isDraggingScreen) ? colors.screenHover : colors.screenColor;
    ctx.fillStyle = screenColor;
    ctx.fillRect(screenX - 5, 0, 10, canvas.height);
    if (hoverState.screen || isDraggingScreen) {
        ctx.strokeStyle = '#4dabf7';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(screenX - 8, -2, 16, canvas.height + 4);
        ctx.setLineDash([]);
    }
    const patternWidth = 80;
    for (let y = 0; y < canvas.height; y++) {
        const intensity = calculateIntensity(y, centerY);
        const scaledIntensity = intensity * (intensityScale / 100);
        
        const rgb = lightColor.match(/\d+/g);
        const r = Math.round(parseInt(rgb[0]) * scaledIntensity);
        const g = Math.round(parseInt(rgb[1]) * scaledIntensity);
        const b = Math.round(parseInt(rgb[2]) * scaledIntensity);
        
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(screenX + 10, y, patternWidth, 1);
    }
    if (showMaxima) {
        const lambda_m = wavelength * 1e-9;
        const d_m = slitSeparation * 1e-6;
        const L_m = screenDistance * 0.01;
        const pixelsPerMeter = canvas.height / 0.2;
        
        for (let m = -10; m <= 10; m++) {
            const y_m = m * lambda_m * L_m / d_m;
            const y_pixels = centerY + y_m * pixelsPerMeter;
            
            if (y_pixels >= 0 && y_pixels <= canvas.height) {
                const intensity = calculateIntensity(y_pixels, centerY);
                if (intensity > 0.1) {
                    ctx.fillStyle = colors.maximaColor;
                    ctx.globalAlpha = 0.6;
                    ctx.beginPath();
                    ctx.arc(screenX + patternWidth + 20, y_pixels, 5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                    
                    if (showPhaseInfo) {
                        ctx.fillStyle = colors.text;
                        ctx.font = '10px Inter';
                        ctx.textAlign = 'left';
                        ctx.fillText(`m=${m}`, screenX + patternWidth + 30, y_pixels + 4);
                    }
                }
            }
        }
    }
    if (showPhaseInfo) {
        const infoX = canvas.width * 0.05;
        const infoY = 30;
        
        ctx.fillStyle = colors.bg;
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.fillRect(infoX, infoY, 180, 100);
        ctx.strokeRect(infoX, infoY, 180, 100);
        
        ctx.fillStyle = colors.text;
        ctx.font = 'bold 12px Inter';
        ctx.textAlign = 'left';
        ctx.fillText('Wave Properties', infoX + 10, infoY + 20);
        
        ctx.font = '10px Inter';
        const freq = (3e8 / (wavelength * 1e-9)) / 1e12;
        const energy = (6.626e-34 * 3e8) / (wavelength * 1e-9) / 1.602e-19;
        
        ctx.fillText(`Frequency: ${freq.toFixed(2)} THz`, infoX + 10, infoY + 40);
        ctx.fillText(`Energy: ${energy.toFixed(2)} eV`, infoX + 10, infoY + 55);
        ctx.fillText(`Period: ${(1/freq).toFixed(3)} ps`, infoX + 10, infoY + 70);
        ctx.fillText(`Color: ${getColorName(wavelength)}`, infoX + 10, infoY + 85);
    }
    
    if (showGraph) {
        const graphX = canvas.width * 0.05;
        const graphY = canvas.height * 0.65;
        const graphWidth = 200;
        const graphHeight = 150;
        
        ctx.fillStyle = colors.bg;
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.fillRect(graphX, graphY, graphWidth, graphHeight);
        ctx.strokeRect(graphX, graphY, graphWidth, graphHeight);
        
        ctx.strokeStyle = colors.graphLine;
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = graphY + (i / 4) * graphHeight;
            ctx.beginPath();
            ctx.moveTo(graphX, y);
            ctx.lineTo(graphX + graphWidth, y);
            ctx.stroke();
        }
        
        ctx.strokeStyle = lightColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let i = 0; i <= graphWidth; i++) {
            const y_screen = (i / graphWidth - 0.5) * canvas.height;
            const intensity = calculateIntensity(centerY + y_screen, centerY);
            const graphYPos = graphY + graphHeight - (intensity * graphHeight);
            
            if (i === 0) {
                ctx.moveTo(graphX + i, graphYPos);
            } else {
                ctx.lineTo(graphX + i, graphYPos);
            }
        }
        ctx.stroke();
        
        ctx.fillStyle = colors.text;
        ctx.font = 'bold 12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Intensity Pattern', graphX + graphWidth / 2, graphY - 10);
        
        ctx.font = '10px Inter';
        ctx.textAlign = 'right';
        ctx.fillText('I₀', graphX - 5, graphY + 5);
        ctx.fillText('0', graphX - 5, graphY + graphHeight);
    }
    
    if (measurementMode && measureStart) {
        ctx.strokeStyle = colors.measureLine;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(measureStart.x, measureStart.y);
        if (measureEnd) {
            ctx.lineTo(measureEnd.x, measureEnd.y);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = colors.measureLine;
            ctx.beginPath();
            ctx.arc(measureStart.x, measureStart.y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(measureEnd.x, measureEnd.y, 5, 0, Math.PI * 2);
            ctx.fill();
            const dx = measureEnd.x - measureStart.x;
            const dy = measureEnd.y - measureStart.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const pixelsPerMeter = canvas.height / 0.2;
            const distanceMM = (distance / pixelsPerMeter) * 1000;
            
            const midX = (measureStart.x + measureEnd.x) / 2;
            const midY = (measureStart.y + measureEnd.y) / 2;
            
            ctx.fillStyle = colors.bg;
            ctx.strokeStyle = colors.measureLine;
            ctx.lineWidth = 2;
            const textWidth = 100;
            ctx.fillRect(midX - textWidth/2, midY - 20, textWidth, 30);
            ctx.strokeRect(midX - textWidth/2, midY - 20, textWidth, 30);
            
            ctx.fillStyle = colors.measureLine;
            ctx.font = 'bold 12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(`${distanceMM.toFixed(2)} mm`, midX, midY - 2);
            ctx.font = '10px Inter';
            ctx.fillText(`${distance.toFixed(0)} px`, midX, midY + 10);
        }
        ctx.setLineDash([]);
    }
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'center';
    
    if (showSlits) {
        ctx.fillText(`${numSlits}-Slit Apparatus`, slitX, canvas.height - 20);
        ctx.font = '11px Inter';
        ctx.fillText(`d = ${slitSeparation} μm`, slitX, canvas.height - 5);
    }
    
    ctx.font = 'bold 14px Inter';
    ctx.fillText('Screen', screenX + patternWidth / 2 + 10, canvas.height - 20);
    ctx.font = '11px Inter';
    ctx.fillText(`L = ${screenDistance} cm`, screenX + patternWidth / 2 + 10, canvas.height - 5);

    if (!measurementMode && !isDraggingScreen && !isDraggingSlits) {
        ctx.fillStyle = colors.text;
        ctx.globalAlpha = 0.5;
        ctx.font = '11px Inter';
        ctx.textAlign = 'left';
        ctx.fillText('Drag screen to move | Drag slit handles to adjust separation', 10, 20);
        ctx.fillText('Mouse wheel to change wavelength | Double-click to reset', 10, 35);
        ctx.globalAlpha = 1;
    }
    
    if (measurementMode && !measureStart) {
        ctx.fillStyle = colors.measureLine;
        ctx.font = 'bold 14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Click two points to measure distance', canvas.width / 2, canvas.height / 2);
    }
}

function getColorName(wavelength) {
    if (wavelength < 450) return 'Violet';
    if (wavelength < 495) return 'Blue';
    if (wavelength < 570) return 'Green';
    if (wavelength < 590) return 'Yellow';
    if (wavelength < 620) return 'Orange';
    return 'Red';
}

setTimeout(() => {
    updateDisplay();
    updateStats();
    draw();
}, 100);