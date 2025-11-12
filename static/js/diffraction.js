let wavelength = 550;
let slitSeparation = 100; 
let slitWidth = 25; 
let screenDistance = 150;
let intensityScale = 100;
let showSlits = true;
let showRays = true;
let showGraph = true;
let showMaxima = true;

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
const wavelengthDisplay = document.getElementById('wavelengthDisplay');
const slitSeparationDisplay = document.getElementById('slitSeparationDisplay');
const slitWidthDisplay = document.getElementById('slitWidthDisplay');
const screenDistanceDisplay = document.getElementById('screenDistanceDisplay');
const intensityDisplay = document.getElementById('intensityDisplay');
const colorPreview = document.getElementById('colorPreview');
const showSlitsCheck = document.getElementById('showSlits');
const showRaysCheck = document.getElementById('showRays');
const showGraphCheck = document.getElementById('showGraph');
const showMaximaCheck = document.getElementById('showMaxima');
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
    slitSeparationSlider.value = slitSeparation;
    slitWidthSlider.value = slitWidth;
    updateDisplay();
    updateStats();
    draw();
});

document.getElementById('preset5')?.addEventListener('click', () => {
    slitSeparation = 300;
    slitWidth = 60;
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
    //fringe spacing beta = (lambda * L)/d
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
    const beta = (Math.PI * d_m * sinTheta) / lambda_m;
    const interference = Math.pow(Math.cos(beta), 2);
    const alpha = (Math.PI * a_m * sinTheta) / lambda_m;
    let diffraction;
    if (Math.abs(alpha) < 0.001) {
        diffraction = 1;
    } else {
        diffraction = Math.pow(Math.sin(alpha) / alpha, 2);
    }
    
    return interference * diffraction;
}

function getThemeColors() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    
    return {
        bg: isDark ? '#0a0a0a' : '#f8f9fa',
        text: isDark ? '#ffffff' : '#000000',
        border: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        slitColor: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
        screenColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        graphLine: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
        maximaColor: '#51cf66',
        minimaColor: '#ff6b6b'
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
    const screenX = canvas.width * 0.75;
    const centerY = canvas.height / 2;
    const slitHeight = 8;
    const slitGap = 30;
    if (showSlits) {
        ctx.fillStyle = colors.slitColor;
        ctx.fillRect(slitX - 10, 0, 20, centerY - slitGap / 2 - slitHeight / 2);
        ctx.fillRect(slitX - 10, centerY + slitGap / 2 + slitHeight / 2, 20, canvas.height - centerY - slitGap / 2 - slitHeight / 2);
        ctx.fillStyle = lightColor;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(slitX - 10, centerY - slitGap / 2 - slitHeight / 2, 20, slitHeight);
        ctx.fillRect(slitX - 10, centerY + slitGap / 2 - slitHeight / 2, 20, slitHeight);
        ctx.globalAlpha = 1;
    }
    if (showRays) {
        const numRays = 15;
        for (let i = -numRays; i <= numRays; i++) {
            const targetY = centerY + (i / numRays) * (canvas.height * 0.4);
            
            ctx.strokeStyle = lightColor;
            ctx.globalAlpha = 0.15;
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(slitX, centerY - slitGap / 2);
            ctx.lineTo(screenX, targetY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(slitX, centerY + slitGap / 2);
            ctx.lineTo(screenX, targetY);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1;
        }
    }
    ctx.fillStyle = colors.screenColor;
    ctx.fillRect(screenX - 5, 0, 10, canvas.height);
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
                    ctx.fillStyle = colors.text;
                    ctx.font = '10px Inter';
                    ctx.textAlign = 'left';
                    ctx.fillText(`m=${m}`, screenX + patternWidth + 30, y_pixels + 4);
                }
            }
        }
    }
    if (showGraph) {
        const graphX = canvas.width * 0.05;
        const graphY = canvas.height * 0.7;
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
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'center';
    
    if (showSlits) {
        ctx.fillText('Double Slit', slitX, canvas.height - 20);
        ctx.font = '11px Inter';
        ctx.fillText(`d = ${slitSeparation} μm`, slitX, canvas.height - 5);
    }
    
    ctx.font = 'bold 14px Inter';
    ctx.fillText('Screen', screenX + patternWidth / 2 + 10, canvas.height - 20);
    ctx.font = '11px Inter';
    ctx.fillText(`L = ${screenDistance} cm`, screenX + patternWidth / 2 + 10, canvas.height - 5);
}
setTimeout(() => {
    updateDisplay();
    updateStats();
    draw();
}, 100);