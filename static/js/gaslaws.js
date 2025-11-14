// init gas prop
const gases = {
    helium: { name: 'Helium (He)', molarMass: 4.003, a: 0.0346, b: 0.0238, color: '#ffd43b', radius: 3 },
    nitrogen: { name: 'Nitrogen (N₂)', molarMass: 28.014, a: 1.370, b: 0.0387, color: '#4dabf7', radius: 4 },
    oxygen: { name: 'Oxygen (O₂)', molarMass: 31.999, a: 1.382, b: 0.0318, color: '#ff6b6b', radius: 4 },
    co2: { name: 'Carbon Dioxide (CO₂)', molarMass: 44.010, a: 3.658, b: 0.0429, color: '#868e96', radius: 4.5 },
    argon: { name: 'Argon (Ar)', molarMass: 39.948, a: 1.355, b: 0.0320, color: '#da77f2', radius: 4 },
    hydrogen: { name: 'Hydrogen (H₂)', molarMass: 2.016, a: 0.2476, b: 0.0265, color: '#51cf66', radius: 2.5 }
};

const R = 8.314; // uni gas const
const N_A = 6.022e23; // avagadros num

let currentGas = 'helium';
let gasModel = 'ideal'; 
let temperature = 273; 
let volume = 22.4; 
let moles = 1.0;
let particleCount = 50;
let containerWidth = 400;
let containerHeight = 400;
let containerX = 50;
let containerY = 50;
let particles = [];
let isPaused = false;
let showVectors = true;
let showTrails = false;
let showDistribution = true;
let showCollisions = false;
let colorBySpeed = true;
let trails = [];
let collisionEffects = [];
let isDragging = false;
let dragTarget = null; 
let dragStart = { x: 0, y: 0 };
let hoverState = { right: false, bottom: false, corner: false };
let pressure = 101.3; 
let density = 0;
let rmsSpeed = 0;
let kineticEnergy = 0;
let meanFreePath = 0;
let collisionRate = 0;
let totalCollisions = 0;



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
    const maxSize = Math.min(canvas.width - 100, canvas.height - 100);
    containerWidth = maxSize * 0.6;
    containerHeight = maxSize * 0.6;
    containerX = (canvas.width - containerWidth) / 2;
    containerY = (canvas.height - containerHeight) / 2;
    initializeParticles();
    draw();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
const temperatureSlider = document.getElementById('temperatureSlider');
const volumeSlider = document.getElementById('volumeSlider');
const molesSlider = document.getElementById('molesSlider');
const particleSlider = document.getElementById('particleSlider');
document.querySelectorAll('.btn-model').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-model').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        gasModel = btn.dataset.model;
        calculateProperties();
        draw();
    });
});
document.querySelectorAll('.btn-gas').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-gas').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentGas = btn.dataset.gas;
        initializeParticles();
        calculateProperties();
        draw();
    });
});
temperatureSlider?.addEventListener('input', () => {
    temperature = parseFloat(temperatureSlider.value);
    updateDisplay();
    updateParticleVelocities();
    calculateProperties();
});

volumeSlider?.addEventListener('input', () => {
    volume = parseFloat(volumeSlider.value);
    updateContainerSize();
    updateDisplay();
    calculateProperties();
});

molesSlider?.addEventListener('input', () => {
    moles = parseFloat(molesSlider.value);
    updateDisplay();
    calculateProperties();
});

particleSlider?.addEventListener('input', () => {
    particleCount = parseInt(particleSlider.value);
    updateDisplay();
    initializeParticles();
});
document.getElementById('showVectors')?.addEventListener('change', (e) => {
    showVectors = e.target.checked;
});

document.getElementById('showTrails')?.addEventListener('change', (e) => {
    showTrails = e.target.checked;
    if (!showTrails) trails = [];
});

document.getElementById('showDistribution')?.addEventListener('change', (e) => {
    showDistribution = e.target.checked;
});

document.getElementById('showCollisions')?.addEventListener('change', (e) => {
    showCollisions = e.target.checked;
});

document.getElementById('colorBySpeed')?.addEventListener('change', (e) => {
    colorBySpeed = e.target.checked;
});
document.getElementById('playPauseBtn')?.addEventListener('click', function() {
    isPaused = !isPaused;
    this.innerHTML = isPaused ? 
        '<i class="fa-solid fa-play"></i> Resume Simulation' : 
        '<i class="fa-solid fa-pause"></i> Pause Simulation';
    if (!isPaused) animate();
});

document.getElementById('heatBtn')?.addEventListener('click', () => {
    temperature = Math.min(1000, temperature + 50);
    temperatureSlider.value = temperature;
    updateDisplay();
    updateParticleVelocities();
    calculateProperties();
});

document.getElementById('coolBtn')?.addEventListener('click', () => {
    temperature = Math.max(50, temperature - 50);
    temperatureSlider.value = temperature;
    updateDisplay();
    updateParticleVelocities();
    calculateProperties();
});

document.getElementById('resetBtn')?.addEventListener('click', () => {
    temperature = 273;
    volume = 22.4;
    moles = 1.0;
    particleCount = 50;
    totalCollisions = 0;
    trails = [];
    
    temperatureSlider.value = temperature;
    volumeSlider.value = volume;
    molesSlider.value = moles;
    particleSlider.value = particleCount;
    
    initializeParticles();
    updateDisplay();
    calculateProperties();
});
document.getElementById('preset1')?.addEventListener('click', () => {
    temperature = 100;
    temperatureSlider.value = temperature;
    updateDisplay();
    updateParticleVelocities();
    calculateProperties();
});

document.getElementById('preset2')?.addEventListener('click', () => {
    temperature = 298;
    temperatureSlider.value = temperature;
    updateDisplay();
    updateParticleVelocities();
    calculateProperties();
});

document.getElementById('preset3')?.addEventListener('click', () => {
    temperature = 600;
    temperatureSlider.value = temperature;
    updateDisplay();
    updateParticleVelocities();
    calculateProperties();
});

document.getElementById('preset4')?.addEventListener('click', () => {
    volume = 10;
    volumeSlider.value = volume;
    updateContainerSize();
    updateDisplay();
    calculateProperties();
});

document.getElementById('preset5')?.addEventListener('click', () => {
    volume = 40;
    volumeSlider.value = volume;
    updateContainerSize();
    updateDisplay();
    calculateProperties();
});

document.getElementById('preset6')?.addEventListener('click', () => {
    document.querySelector('[data-model="vanderwaals"]').click();
    currentGas = 'co2';
    document.querySelector('[data-gas="co2"]').click();
    temperature = 400;
    volume = 15;
    moles = 2;
    temperatureSlider.value = temperature;
    volumeSlider.value = volume;
    molesSlider.value = moles;
    
    initializeParticles();
    updateDisplay();
    calculateProperties();
});
canvas.addEventListener('mousedown', (e) => {
    const pos = getMousePos(e);
    checkHover(pos.x, pos.y);
    
    if (hoverState.right || hoverState.bottom || hoverState.corner) {
        isDragging = true;
        dragStart = pos;
        if (hoverState.right) dragTarget = 'right';
        else if (hoverState.bottom) dragTarget = 'bottom';
        else if (hoverState.corner) dragTarget = 'corner';
        canvas.style.cursor = 'grabbing';
    }
});

canvas.addEventListener('mousemove', (e) => {
    const pos = getMousePos(e);
    if (isDragging) {
        const dx = pos.x - dragStart.x;
        const dy = pos.y - dragStart.y;
        if (dragTarget === 'right' || dragTarget === 'corner') {
            containerWidth = Math.max(200, Math.min(canvas.width - containerX - 50, containerWidth + dx));
        }
        if (dragTarget === 'bottom' || dragTarget === 'corner') {
            containerHeight = Math.max(200, Math.min(canvas.height - containerY - 50, containerHeight + dy));
        }
        const baseSize = 400;
        const newVolume = 22.4 * (containerWidth / baseSize) * (containerHeight / baseSize);
        volume = Math.max(5, Math.min(50, newVolume));
        volumeSlider.value = volume;
        
        dragStart = pos;
        updateDisplay();
        calculateProperties();
        draw();
    } else {
        checkHover(pos.x, pos.y);
        if (hoverState.right || hoverState.bottom || hoverState.corner) {
            canvas.style.cursor = 'nwse-resize';
        } else {
            canvas.style.cursor = 'default';
        }
        draw();
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
    dragTarget = null;
    canvas.style.cursor = 'default';
});

canvas.addEventListener('mouseleave', () => {
    isDragging = false;
    dragTarget = null;
    hoverState = { right: false, bottom: false, corner: false };
    canvas.style.cursor = 'default';
});

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function checkHover(x, y) {
    const rightEdge = containerX + containerWidth;
    const bottomEdge = containerY + containerHeight;
    const tolerance = 15;
    hoverState.right = Math.abs(x - rightEdge) < tolerance && 
                       y > containerY && y < bottomEdge;
    hoverState.bottom = Math.abs(y - bottomEdge) < tolerance && 
                        x > containerX && x < rightEdge;
    hoverState.corner = Math.abs(x - rightEdge) < tolerance && 
                        Math.abs(y - bottomEdge) < tolerance;
}

function initializeParticles() {
    particles = [];
    const gas = gases[currentGas];
    const margin = gas.radius * 2; 
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = getMaxwellBoltzmannSpeed();
        let x, y;
        let attempts = 0;
        do {
            x = containerX + margin + Math.random() * (containerWidth - margin * 2);
            y = containerY + margin + Math.random() * (containerHeight - margin * 2);
            attempts++;
        } while (attempts < 100 && !isPositionValid(x, y, particles, gas.radius));
        
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: gas.radius,
            mass: gas.molarMass
        });
    }
}

function isPositionValid(x, y, existingParticles, radius) {
    for (let p of existingParticles) {
        const dist = Math.hypot(x - p.x, y - p.y);
        if (dist < radius + p.radius + 5) return false;
    }
    return true;
}

function getMaxwellBoltzmannSpeed() {
    // maxwell boltzman distribution
    // vrms = root(3RT/M)
    const gas = gases[currentGas];
    const M = gas.molarMass / 1000; 
    const v_rms = Math.sqrt(3 * R * temperature / M);
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.abs(v_rms * (0.5 + z * 0.2) * 0.02); 
}

function updateParticleVelocities() {
    particles.forEach(p => {
        const currentSpeed = Math.hypot(p.vx, p.vy);
        const angle = Math.atan2(p.vy, p.vx);
        const newSpeed = getMaxwellBoltzmannSpeed();
        p.vx = Math.cos(angle) * newSpeed;
        p.vy = Math.sin(angle) * newSpeed;
    });
}

function updateContainerSize() {
    const baseSize = 400;
    const scaleFactor = Math.pow(volume / 22.4, 0.5);
    containerWidth = Math.max(200, Math.min(canvas.width - containerX - 50, baseSize * scaleFactor));
    containerHeight = Math.max(200, Math.min(canvas.height - containerY - 50, baseSize * scaleFactor));
}

function updateDisplay() {
    document.getElementById('tempDisplay').textContent = temperature.toFixed(0) + ' K';
    document.getElementById('celsiusDisplay').textContent = (temperature - 273.15).toFixed(1) + '°C';
    document.getElementById('volumeDisplay').textContent = volume.toFixed(1) + ' L';
    document.getElementById('molesDisplay').textContent = moles.toFixed(1) + ' mol';
    document.getElementById('particleDisplay').textContent = particleCount;
}

function calculateProperties() {
    const V_m3 = volume / 1000; 
    
    if (gasModel === 'ideal') {
        // for ideal gas pv=nrt
        pressure = (moles * R * temperature) / V_m3 / 1000; 
    } else {
        //vander wall (P + a(n/V)square)(V - nb) = nRT
        const gas = gases[currentGas];
        const a = gas.a;
        const b = gas.b / 1000; 
        pressure = ((moles * R * temperature) / (V_m3 - moles * b) - a * Math.pow(moles / V_m3, 2)) / 1000;
    }
    const gas = gases[currentGas];
    const M = gas.molarMass / 1000; 
    density = (moles * M) / V_m3; 
    rmsSpeed = Math.sqrt(3 * R * temperature / M);
    kineticEnergy = (3/2) * moles * R * temperature / 1000; 
    const molecularDiameter = gas.radius * 2 * 1e-10; 
    const numberDensity = (moles * N_A) / V_m3;
    meanFreePath = 1 / (Math.sqrt(2) * Math.PI * molecularDiameter * molecularDiameter * numberDensity) * 1e9; 
    collisionRate = (numberDensity * rmsSpeed * Math.PI * molecularDiameter * molecularDiameter) / 1e9; 
    document.getElementById('pressureValue').textContent = pressure.toFixed(1) + ' kPa';
    document.getElementById('volumeValue').textContent = volume.toFixed(1) + ' L';
    document.getElementById('temperatureValue').textContent = temperature.toFixed(0) + ' K';
    document.getElementById('molesValue').textContent = moles.toFixed(1) + ' mol';
    document.getElementById('speedValue').textContent = rmsSpeed.toFixed(0) + ' m/s';
    document.getElementById('pressureStat').textContent = pressure.toFixed(1) + ' kPa';
    document.getElementById('densityStat').textContent = density.toFixed(2) + ' kg/m³';
    document.getElementById('rmsSpeedStat').textContent = rmsSpeed.toFixed(0) + ' m/s';
    document.getElementById('kineticEnergyStat').textContent = kineticEnergy.toFixed(2) + ' kJ';
    document.getElementById('meanFreePathStat').textContent = meanFreePath.toFixed(1) + ' nm';
    document.getElementById('collisionRateStat').textContent = (collisionRate / 1e9).toFixed(1) + ' × 10⁹ /s';
}

function updatePhysics() {
    if (isPaused) return;
    
    const gas = gases[currentGas];
    const damping = 0.999; 
    
    particles.forEach((p, i) => {
        const timeStep = 0.5;
        p.x += p.vx * timeStep;
        p.y += p.vy * timeStep;
        p.vx *= damping;
        p.vy *= damping;
        const leftWall = containerX + p.radius;
        const rightWall = containerX + containerWidth - p.radius;
        const topWall = containerY + p.radius;
        const bottomWall = containerY + containerHeight - p.radius;
        
        if (p.x < leftWall) {
            p.x = leftWall;
            p.vx = Math.abs(p.vx) * 0.9;
            if (showCollisions) addCollisionEffect(p.x, p.y);
        }
        if (p.x > rightWall) {
            p.x = rightWall;
            p.vx = -Math.abs(p.vx) * 0.9;
            if (showCollisions) addCollisionEffect(p.x, p.y);
        }
        if (p.y < topWall) {
            p.y = topWall;
            p.vy = Math.abs(p.vy) * 0.9;
            if (showCollisions) addCollisionEffect(p.x, p.y);
        }
        if (p.y > bottomWall) {
            p.y = bottomWall;
            p.vy = -Math.abs(p.vy) * 0.9;
            if (showCollisions) addCollisionEffect(p.x, p.y);
        }
        for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p2.x - p.x;
            const dy = p2.y - p.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist < p.radius + p2.radius) {
                const nx = dx / dist;
                const ny = dy / dist;
                const dvx = p2.vx - p.vx;
                const dvy = p2.vy - p.vy;
                const dvn = dvx * nx + dvy * ny;
            


                if (dvn < 0) {
                    const impulse = 2 * dvn / 2; 
                    p.vx += impulse * nx;
                    p.vy += impulse * ny;
                    p2.vx -= impulse * nx;
                    p2.vy -= impulse * ny;
                    const overlap = (p.radius + p2.radius - dist) / 2;
                    p.x -= overlap * nx;
                    p.y -= overlap * ny;
                    p2.x += overlap * nx;
                    p2.y += overlap * ny;
                    
                    totalCollisions++;
                    if (showCollisions) addCollisionEffect((p.x + p2.x) / 2, (p.y + p2.y) / 2);
                }
            }
        }
        if (showTrails) {
            trails.push({ x: p.x, y: p.y, life: 30 });
        }
    });
    trails = trails.filter(t => {
        t.life--;
        return t.life > 0;
    });
    collisionEffects = collisionEffects.filter(e => {
        e.life--;
        e.radius += 0.5;
        return e.life > 0;
    });
}

function addCollisionEffect(x, y) {
    collisionEffects.push({
        x, y,
        radius: 5,
        life: 20
    });
}

function getSpeedColor(speed) {
    const maxSpeed = rmsSpeed * 2;
    const ratio = Math.min(speed / maxSpeed, 1);
    
    const r = Math.round(ratio * 255);
    const b = Math.round((1 - ratio) * 255);
    const g = Math.round((1 - Math.abs(ratio - 0.5) * 2) * 255);
    
    return `rgb(${r}, ${g}, ${b})`;
}

function getThemeColors() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    return {
        bg: isDark ? '#0a0a0a' : '#f8f9fa',
        text: isDark ? '#ffffff' : '#000000',
        border: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
        container: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        containerBorder: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
        particle: gases[currentGas].color,
        vector: '#4dabf7',
        trail: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        collision: '#ffd43b',
        handle: '#51cf66'
    };
}

function draw() {
    if (!canvas || !ctx) return;
    const colors = getThemeColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = colors.container;
    ctx.fillRect(containerX, containerY, containerWidth, containerHeight);
    ctx.strokeStyle = colors.containerBorder;
    ctx.lineWidth = 4;
    ctx.strokeRect(containerX, containerY, containerWidth, containerHeight);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(containerX + 2, containerY + 2, containerWidth - 4, containerHeight - 4);
    if (hoverState.right || hoverState.bottom || hoverState.corner || isDragging) {
        ctx.fillStyle = colors.handle;
        ctx.globalAlpha = 0.8;
        const rightX = containerX + containerWidth;
        ctx.fillRect(rightX - 3, containerY + containerHeight / 2 - 25, 6, 50);
        const bottomY = containerY + containerHeight;
        ctx.fillRect(containerX + containerWidth / 2 - 25, bottomY - 3, 50, 6);
        ctx.fillRect(rightX - 8, bottomY - 8, 16, 16);
        
        ctx.globalAlpha = 1;
    }
    if (showTrails) {
        trails.forEach(t => {
            ctx.fillStyle = colors.trail;
            ctx.globalAlpha = t.life / 30;
            ctx.beginPath();
            ctx.arc(t.x, t.y, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });
    }
    collisionEffects.forEach(e => {
        ctx.strokeStyle = colors.collision;
        ctx.globalAlpha = e.life / 20;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    });
    particles.forEach(p => {
        p.x = Math.max(containerX + p.radius, Math.min(containerX + containerWidth - p.radius, p.x));
        p.y = Math.max(containerY + p.radius, Math.min(containerY + containerHeight - p.radius, p.y));
        const speed = Math.hypot(p.vx, p.vy);
        ctx.fillStyle = colorBySpeed ? getSpeedColor(speed) : colors.particle;
        ctx.shadowBlur = 10;
        ctx.shadowColor = colorBySpeed ? getSpeedColor(speed) : colors.particle;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = colors.containerBorder;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        if (showVectors) {
            const vectorScale = 3;
            ctx.strokeStyle = colors.vector;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.vx * vectorScale, p.y + p.vy * vectorScale);
            ctx.stroke();
            const angle = Math.atan2(p.vy, p.vx);
            const headLen = 5;
            ctx.beginPath();
            ctx.moveTo(p.x + p.vx * vectorScale, p.y + p.vy * vectorScale);
            ctx.lineTo(p.x + p.vx * vectorScale - headLen * Math.cos(angle - Math.PI / 6),
                      p.y + p.vy * vectorScale - headLen * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(p.x + p.vx * vectorScale, p.y + p.vy * vectorScale);
            ctx.lineTo(p.x + p.vx * vectorScale - headLen * Math.cos(angle + Math.PI / 6),
                      p.y + p.vy * vectorScale - headLen * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
        }
    });
    if (showDistribution) {
        drawSpeedDistribution(colors);
    }
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(`${gases[currentGas].name} - ${gasModel === 'ideal' ? 'Ideal Gas' : 'Van der Waals'}`, 
                 containerX + containerWidth / 2, containerY - 10);
    ctx.globalAlpha = 0.6;
    ctx.font = '11px Inter';
    ctx.textAlign = 'left';
    ctx.fillText('Drag container edges to change volume | Adjust sliders for temperature & moles', 
                 10, canvas.height - 20);
    ctx.globalAlpha = 1;
}

function drawSpeedDistribution(colors) {
    const graphX = 20;
    const graphY = containerY + containerHeight + 40;
    const graphWidth = 250;
    const graphHeight = 120;
    if (graphY + graphHeight > canvas.height - 30) return;
    ctx.fillStyle = colors.bg;
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 2;
    ctx.fillRect(graphX, graphY, graphWidth, graphHeight);
    ctx.strokeRect(graphX, graphY, graphWidth, graphHeight);
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 12px Inter';
    ctx.textAlign = 'left';
    ctx.fillText('Speed Distribution', graphX + 10, graphY + 15);
    const bins = 20;
    const speeds = particles.map(p => Math.hypot(p.vx, p.vy));
    const maxSpeed = Math.max(...speeds);
    const binSize = maxSpeed / bins;
    const histogram = new Array(bins).fill(0);
    speeds.forEach(speed => {
        const bin = Math.min(Math.floor(speed / binSize), bins - 1);
        histogram[bin]++;
    });
    const maxCount = Math.max(...histogram);
    const barWidth = (graphWidth - 40) / bins;
    histogram.forEach((count, i) => {
        const barHeight = (count / maxCount) * (graphHeight - 40);
        const x = graphX + 20 + i * barWidth;
        const y = graphY + graphHeight - 20 - barHeight;
        
        ctx.fillStyle = getSpeedColor(i * binSize);
        ctx.fillRect(x, y, barWidth - 2, barHeight);
    });
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(graphX + 20, graphY + 20);
    ctx.lineTo(graphX + 20, graphY + graphHeight - 20);
    ctx.lineTo(graphX + graphWidth - 20, graphY + graphHeight - 20);
    ctx.stroke();
    ctx.fillStyle = colors.text;
    ctx.font = '10px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Speed', graphX + graphWidth / 2, graphY + graphHeight - 5);
    ctx.save();
    ctx.translate(graphX + 5, graphY + graphHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Count', 0, 0);
    ctx.restore();
    ctx.strokeStyle = colors.particle;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const gas = gases[currentGas];
    const M = gas.molarMass / 1000;
    const kB = 1.381e-23;//boltz const
    const m = M / N_A; 
    
    for (let i = 0; i <= 100; i++) {
        const v = (maxSpeed * i) / 100;
        const f = 4 * Math.PI * Math.pow(m / (2 * Math.PI * kB * temperature), 1.5) * 
                  v * v * Math.exp(-m * v * v / (2 * kB * temperature));
        const normalized = f * particles.length * binSize * 1e5;
        const y = graphY + graphHeight - 20 - (normalized / maxCount) * (graphHeight - 40);
        const x = graphX + 20 + (i / 100) * (graphWidth - 40);
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
    ctx.fillStyle = colors.text;
    ctx.font = '9px Inter';
    ctx.textAlign = 'right';
    ctx.fillText('Theory', graphX + graphWidth - 10, graphY + 30);
}

function animate() {
    updatePhysics();
    calculateProperties();
    draw();
    
    if (!isPaused) {
        requestAnimationFrame(animate);
    }
}

setTimeout(() => {
    initializeParticles();
    updateDisplay();
    calculateProperties();
    draw();
    animate();
}, 100);