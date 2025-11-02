// State variables initial data
let angle = 45;
let velocity = 50;
let initialHeight = 0;
let gravity = 9.8;
let isAnimating = false;
let animationFrame = null;
let projectile = null;
let trajectory = [];
let scale = 3;
let impactEffect = null;

let zoom = 1;
let panX = 0;
let panY = 0;
let isPanning = false;
let lastMouseX = 0;
let lastMouseY = 0;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;

// Wait for page to load before hiding loading screen 
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('loadingScreen').classList.add('hidden');
    }, 800);
});

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// set canvas size
function resizeCanvas() {
    const wrapper = canvas.parentElement;
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
    calculateTrajectory();
    draw();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const angleSlider = document.getElementById('angle');
const angleDisplay = document.getElementById('angleDisplay');
const angleUnit = document.getElementById('angleUnit');
const velocityInput = document.getElementById('velocity');
const heightInput = document.getElementById('height');
const gravityInput = document.getElementById('gravity');
const launchBtn = document.getElementById('launchBtn');
const resetBtn = document.getElementById('resetBtn');

const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const resetViewBtn = document.getElementById('resetViewBtn');
const zoomDisplay = document.getElementById('zoomDisplay');

// Update angle arc in control visualization
function updateAngleArc() {
    const angleRad = angle * Math.PI / 180;
    const radius = 23;
    const cx = 40;
    const cy = 40;
    
    // updating angel line
    const endX = cx + radius * Math.cos(-angleRad);
    const endY = cy + radius *Math.sin(-angleRad);
    document.getElementById('anglePath').setAttribute('d', `M ${cx} ${cy} L ${endX} ${endY}`);
    
    // updating arc
    const largeArc = angleRad > Math.PI ? 1 : 0;
    const arcPath = `M ${cx +radius} ${cy} A ${radius} ${radius} 0 ${largeArc} 0 ${endX} ${endY}`;
    document.getElementById('angleArcPath').setAttribute('d', arcPath);
}

//update angle display
function updateAngleDisplay() {
    const angleValue = parseFloat(angleSlider.value);
    if (angleUnit.value === 'degrees') {
        angleDisplay.textContent = angleValue + '°';
        angle = angleValue;
    } else {
        const radians =(angleValue * Math.PI / 180).toFixed(3);
        angleDisplay.textContent = radians + ' rad';
        angle = angleValue;
    }
    updateAngleArc();
    calculateTrajectory();
    draw();
}

angleSlider.addEventListener('input', updateAngleDisplay);
angleUnit.addEventListener('change', updateAngleDisplay);

velocityInput.addEventListener('change', () => {
    velocity = parseFloat(velocityInput.value);
    calculateTrajectory();
    draw();
});

heightInput.addEventListener('change', () => {
    initialHeight = parseFloat(heightInput.value);
    calculateTrajectory();
    draw();
});

gravityInput.addEventListener('change', () => {
    gravity = parseFloat(gravityInput.value);
    calculateTrajectory();
    draw();
});

// zooming functions
function updateZoomDisplay() {
    if (zoomDisplay) {
        zoomDisplay.textContent = `${Math.round(zoom * 100)}%`;
    }
}

function setZoom(newZoom, centerX, centerY) {
    const oldZoom = zoom;
    zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    
    if (centerX !== undefined && centerY !== undefined) {
        // adjusting the pan zoom to keep the point under the cursor stable
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

//zoom control event lisetenrs
if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
        setZoom(zoom * 1.2);
    });
}

if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
        setZoom(zoom / 1.2);
    });
}

if (resetViewBtn) {
    resetViewBtn.addEventListener('click', resetView);
}

// Mouse wheel zoom
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(zoom * zoomFactor, mouseX, mouseY);
});

// Pan with mouse drag (works with right click anytimeleft click when zoomed)
canvas.addEventListener('mousedown', (e) => {
    if (e.button === 2 || (e.button === 0 && zoom > 1)) { // move with left or right click
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
    } else if (zoom > 1) {
        canvas.style.cursor = 'grab';
    } else {
        canvas.style.cursor = 'crosshair';
    }
});

canvas.addEventListener('mouseup', () => {
    isPanning = false;
    canvas.style.cursor = zoom > 1 ? 'grab' : 'crosshair';
});

canvas.addEventListener('mouseleave', () => {
    isPanning = false;
    canvas.style.cursor = 'crosshair';
});

// Prevent context menu on right-click
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Calculating trajectory path
function calculateTrajectory() {
    trajectory = [];
    const angleRad = angle * Math.PI / 180;
    const v0x = velocity * Math.cos(angleRad);
    const v0y = velocity * Math.sin(angleRad);
    
    const discriminant = v0y * v0y + 2 * gravity * initialHeight;
    if (discriminant < 0) return;
    
    const timeOfFlight = (v0y + Math.sqrt(discriminant)) / gravity;
    
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * timeOfFlight;
        const x = v0x * t;
        const y = initialHeight + v0y * t - 0.5 * gravity * t * t;
        
        if (y >= 0) {
            trajectory.push({ x, y, t });
        }
    }
    
    updateStatistics(angleRad, v0x, v0y, timeOfFlight);
}

function updateStatistics(angleRad, v0x, v0y, timeOfFlight) {
    const maxHeight = initialHeight + (v0y * v0y) / (2 * gravity);
    const range = v0x * timeOfFlight;
    
    document.getElementById('maxHeight').textContent = maxHeight.toFixed(2) + ' m';
    document.getElementById('range').textContent = range.toFixed(2) + ' m';
    document.getElementById('timeOfFlight').textContent = timeOfFlight.toFixed(2) + ' s';
}

// Get theme-aware colors fot all the thigns
function getThemeColors() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    return {
        bg: isDark ? '#0a0a0a' : '#ffffff',
        ground: isDark ? '#1a1a1a' : '#e5e5e5',
        gridLine: isDark ? '#ffffff08' : '#00000008',
        platform: isDark ? '#2a2a2a' : '#d0d0d0',
        platformBorder: isDark ? '#404040' : '#b0b0b0',
        trajectory: isDark ? '#ffffff40' : '#00000040',
        ball: isDark ? '#ffffff' : '#000000',
        velocity: isDark ? '#ffffff' : '#000000',
        angle: isDark ? '#ffffff60' : '#00000060',
        text: isDark ? '#ffffff' : '#000000',
        textBg: isDark ? '#0a0a0acc' : '#ffffffcc'
    };
}

// Draw scene
function draw() {
    if (!canvas || !ctx) return;
    
    const colors = getThemeColors();
    
    // Save context and apply transformations
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);
    
    // Clear canvas
    ctx.fillStyle = colors.bg;
    ctx.fillRect(-panX/zoom, -panY/zoom, canvas.width/zoom, canvas.height/zoom);
    
    // Draw subtle grid in the background (looks cool ngl)
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
    
    // Draw ground
    const groundY = canvas.height/zoom - 50/zoom;
    ctx.fillStyle = colors.ground;
    ctx.fillRect(-panX/zoom, groundY, canvas.width/zoom, 50/zoom);
    
    // Draw ground line
    ctx.strokeStyle = colors.platformBorder;
    ctx.lineWidth = 2/zoom;
    ctx.beginPath();
    ctx.moveTo(-panX/zoom, groundY);
    ctx.lineTo((canvas.width - panX)/zoom, groundY);
    ctx.stroke();
    
    const originX = 80;
    const originY = groundY;
    
    // Draw cartoon like impact effect (sucks but it's smth will update later)
    if (impactEffect) {
        const progress = impactEffect.frame / impactEffect.maxFrames;
        const radius = 20 + progress * 30;
        const alpha = 1 - progress;
        
        // Impact circle
        ctx.strokeStyle = colors.text + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.lineWidth = 3/zoom;
        ctx.beginPath();
        ctx.arc(impactEffect.x, impactEffect.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Impact lines (looks like a sun lol)
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const lineLength = 15 + progress * 20;
            const startDist = 20;
            ctx.beginPath();
            ctx.moveTo(
                impactEffect.x + Math.cos(angle) * startDist,
                impactEffect.y + Math.sin(angle) * startDist
            );
            ctx.lineTo(
                impactEffect.x + Math.cos(angle) * (startDist + lineLength),
                impactEffect.y + Math.sin(angle) * (startDist + lineLength)
            );
            ctx.stroke();
        }
        
        impactEffect.frame++;
        if (impactEffect.frame >= impactEffect.maxFrames) {
            impactEffect = null;
        }
    }
    
    // Draw trajectory path
    if (trajectory && trajectory.length > 0) {
        ctx.strokeStyle = colors.trajectory;
        ctx.lineWidth = 2/zoom;
        ctx.setLineDash([8/zoom, 8/zoom]);
        ctx.beginPath();
        
        trajectory.forEach((point, index) => {
            const x = originX + point.x * scale;
            const y = originY - point.y * scale;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    // Draw platform if there's initial height (vertical rectangle)
    if (initialHeight > 0) {
        const platformHeight = initialHeight * scale;
        const platformWidth = 50;
        ctx.fillStyle = colors.platform;
        ctx.fillRect(originX - platformWidth/2, originY - platformHeight, platformWidth, platformHeight);
        
        ctx.strokeStyle = colors.platformBorder;
        ctx.lineWidth = 2/zoom;
        ctx.strokeRect(originX - platformWidth/2, originY - platformHeight, platformWidth, platformHeight);
    }
    
    // Draw angle indicator
    const angleRad = angle * Math.PI / 180;
    const indicatorLength = 100;
    ctx.strokeStyle = colors.angle;
    ctx.lineWidth = 2/zoom;
    ctx.beginPath();
    const angleStartY = originY - initialHeight * scale;
    ctx.moveTo(originX, angleStartY);
    ctx.lineTo(
        originX + indicatorLength * Math.cos(angleRad),
        angleStartY - indicatorLength * Math.sin(angleRad)
    );
    ctx.stroke();
    
    // Draw angle arc
    ctx.strokeStyle = colors.angle;
    ctx.lineWidth = 1.5/zoom;
    ctx.beginPath();
    ctx.arc(originX, angleStartY, 30, -angleRad, 0, false);
    ctx.stroke();
    
    // Draw balllllsss hehe
    const ballRadius = 15;
    let ballX, ballY;
    
    if (projectile) {
        ballX = originX + projectile.x * scale;
        ballY = originY - (projectile.y + initialHeight) * scale;
        
        const vx = velocity * Math.cos(angleRad);
        const vy = velocity * Math.sin(angleRad) - gravity * projectile.t;
        const totalVelocity = Math.sqrt(vx * vx + vy * vy);
        
        // Draw velocity vectors 
        const vectorScale = 3;
        
        // Horizontal velocity
        if (Math.abs(vx) > 0.1) {
            ctx.strokeStyle = colors.velocity;
            ctx.lineWidth = 2/zoom;
            ctx.setLineDash([4/zoom, 4/zoom]);
            ctx.beginPath();
            ctx.moveTo(ballX, ballY);
            ctx.lineTo(ballX + vx * vectorScale, ballY);
            ctx.stroke();
            ctx.setLineDash([]);
            
            const arrowSize = 6;
            ctx.beginPath();
            ctx.moveTo(ballX + vx * vectorScale, ballY);
            ctx.lineTo(ballX + vx * vectorScale - arrowSize, ballY - arrowSize/2);
            ctx.lineTo(ballX + vx * vectorScale - arrowSize, ballY + arrowSize/2);
            ctx.closePath();
            ctx.fillStyle = colors.velocity;
            ctx.fill();
        }
        
        // Vertical velocity
        if (Math.abs(vy) > 0.1) {
            ctx.strokeStyle = colors.velocity;
            ctx.lineWidth = 2/zoom;
            ctx.setLineDash([4/zoom, 4/zoom]);
            ctx.beginPath();
            ctx.moveTo(ballX, ballY);
            ctx.lineTo(ballX, ballY - vy * vectorScale);
            ctx.stroke();
            ctx.setLineDash([]);
            
            const arrowSize = 6;
            ctx.beginPath();
            ctx.moveTo(ballX, ballY - vy * vectorScale);
            ctx.lineTo(ballX - arrowSize/2, ballY - vy * vectorScale + (vy > 0 ? arrowSize : -arrowSize));
            ctx.lineTo(ballX + arrowSize/2, ballY - vy * vectorScale + (vy > 0 ? arrowSize : -arrowSize));
            ctx.closePath();
            ctx.fillStyle = colors.velocity;
            ctx.fill();
        }
        
        // Draw data labels 
        ctx.font = `bold ${16/zoom}px Inter`;
        ctx.textAlign = 'left';
        
        const labelX = ballX + ballRadius + 18;
        const labelY = ballY - 20;
        
        // Background box
        const boxPadding = 8;
        const lineHeight = 22;
        const boxWidth = 140;
        const boxHeight = lineHeight * 3 + boxPadding * 2;
        
        ctx.fillStyle = colors.textBg;
        ctx.fillRect(labelX - boxPadding, labelY - boxPadding - 10, boxWidth, boxHeight);
        
        // Border
        ctx.strokeStyle = colors.text + '30';
        ctx.lineWidth = 1/zoom;
        ctx.strokeRect(labelX - boxPadding, labelY - boxPadding - 10, boxWidth, boxHeight);
        
        // Text
        ctx.fillStyle = colors.text;
        ctx.fillText(`v: ${totalVelocity.toFixed(1)} m/s`, labelX, labelY);
        ctx.fillText(`vx: ${vx.toFixed(1)} m/s`, labelX, labelY + lineHeight);
        ctx.fillText(`vy: ${vy.toFixed(1)} m/s`, labelX, labelY + lineHeight * 2);
        
        document.getElementById('currentHeight').textContent = (projectile.y + initialHeight).toFixed(2) + ' m';
    } else {
        ballX = originX;
        ballY = originY - initialHeight * scale;
        document.getElementById('currentHeight').textContent = initialHeight.toFixed(2) + ' m';
    }
    
    // Draw ball (hehe agian)
    ctx.fillStyle = colors.ball;
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = colors.bg;
    ctx.lineWidth = 2/zoom;
    ctx.stroke();
    
    // Restore context
    ctx.restore();
}

// Animation 
function animate() {
    if (!isAnimating || !projectile) return;
    
    projectile.t += 0.016;
    const angleRad = angle * Math.PI / 180;
    const v0x = velocity * Math.cos(angleRad);
    const v0y = velocity * Math.sin(angleRad);
    
    projectile.x = v0x * projectile.t;
    projectile.y = v0y * projectile.t - 0.5 * gravity * projectile.t * projectile.t;
    
    if (projectile.y + initialHeight <= 0) {
        projectile.y = -initialHeight;
        
        // Create impact effect
        const originX = 80;
        const groundY = canvas.height/zoom - 50/zoom;
        const originY = groundY;
        impactEffect = {
            x: originX + projectile.x * scale,
            y: originY,
            frame: 0,
            maxFrames: 20
        };
        
        isAnimating = false;
        launchBtn.innerHTML = '<i class="fa-solid fa-play"></i> Launch';
    }
    
    draw();
    
    if (isAnimating) {
        animationFrame = requestAnimationFrame(animate);
    } else if (impactEffect) {
        // Continue drawing to show impact effect
        animationFrame = requestAnimationFrame(animate);
    }
}

// Launch button
launchBtn.addEventListener('click', () => {
    if (isAnimating) {
        isAnimating = false;
        cancelAnimationFrame(animationFrame);
        launchBtn.innerHTML = '<i class="fa-solid fa-play"></i> Launch';
    } else {
        projectile = { x: 0, y: 0, t: 0 };
        isAnimating = true;
        launchBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        animate();
    }
});

// Reset button
resetBtn.addEventListener('click', () => {
    isAnimating = false;
    cancelAnimationFrame(animationFrame);
    projectile = null;
    impactEffect = null;
    launchBtn.innerHTML = '<i class="fa-solid fa-play"></i> Launch';
    document.getElementById('currentHeight').textContent = initialHeight.toFixed(2) + ' m';
    draw();
});

// Initial setup
setTimeout(() => {
    updateAngleArc();
    calculateTrajectory();
    updateZoomDisplay();
    draw();
}, 100);