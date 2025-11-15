//consts
const h = 6.626e-34; //planks const
const c = 3e8; //light speed
const e = 1.602e-19; //charge
const eV_to_J = 1.602e-19; //conversion fact

//init metals with work fx
const metals = {
    sodium: { name: 'Sodium (Na)', workFunction: 2.3, color: '#ffd43b' },
    potassium: { name: 'Potassium (K)', workFunction: 2.0, color: '#ff922b' },
    cesium: { name: 'Cesium (Cs)', workFunction: 1.9, color: '#da77f2' },
    zinc: { name: 'Zinc (Zn)', workFunction: 4.3, color: '#868e96' },
    copper: { name: 'Copper (Cu)', workFunction: 4.7, color: '#b87333' },
    platinum: { name: 'Platinum (Pt)', workFunction: 6.4, color: '#c0c0c0' }
};
let currentMetal = 'sodium';
let frequency = 7e14; 
let intensity = 50; 
let appliedVoltage = 0; 
let isLightOn = false;
let photons = [];
let electrons = [];
let photonCount = 0;
let electronCount = 0;
let photocurrent = 0;
let showPhotons = true;
let showElectrons = true;
let showEnergyLevels = false;
let showGraph = true;
let photonEnergy = 0;
let maxKE = 0;
let stoppingPotential = 0;
let graphData = [];

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

const frequencySlider = document.getElementById('frequencySlider');
const intensitySlider = document.getElementById('intensitySlider');
const voltageSlider = document.getElementById('voltageSlider');

document.querySelectorAll('.btn-metal').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-metal').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMetal = btn.dataset.metal;
        calculatePhysics();
        updateDisplay();
        draw();
    });
});

frequencySlider?.addEventListener('input', () => {
    frequency = parseFloat(frequencySlider.value) * 1e14;
    calculatePhysics();
    updateDisplay();
});

intensitySlider?.addEventListener('input', () => {
    intensity = parseFloat(intensitySlider.value);
    updateDisplay();
});

voltageSlider?.addEventListener('input', () => {
    appliedVoltage = parseFloat(voltageSlider.value);
    updateDisplay();
    calculatePhysics();
});

document.getElementById('showPhotons')?.addEventListener('change', (e) => {
    showPhotons = e.target.checked;
});

document.getElementById('showElectrons')?.addEventListener('change', (e) => {
    showElectrons = e.target.checked;
});

document.getElementById('showEnergyLevels')?.addEventListener('change', (e) => {
    showEnergyLevels = e.target.checked;
});

document.getElementById('showGraph')?.addEventListener('change', (e) => {
    showGraph = e.target.checked;
});

document.getElementById('lightOnBtn')?.addEventListener('click', function() {
    isLightOn = !isLightOn;
    this.innerHTML = isLightOn ? 
        '<i class="fa-solid fa-lightbulb"></i> Turn Light OFF' : 
        '<i class="fa-solid fa-lightbulb"></i> Turn Light ON';
    this.classList.toggle('active', isLightOn);
    
    if (!isLightOn) {
        photons = [];
        electrons = [];
    }
});

document.getElementById('resetBtn')?.addEventListener('click', () => {
    frequency = 7e14;
    intensity = 50;
    appliedVoltage = 0;
    isLightOn = false;
    photons = [];
    electrons = [];
    photonCount = 0;
    electronCount = 0;
    graphData = [];
    
    frequencySlider.value = 7;
    intensitySlider.value = 50;
    voltageSlider.value = 0;
    
    const lightBtn = document.getElementById('lightOnBtn');
    lightBtn.innerHTML = '<i class="fa-solid fa-lightbulb"></i> Turn Light ON';
    lightBtn.classList.remove('active');
    
    calculatePhysics();
    updateDisplay();
    draw();
});

document.getElementById('preset1')?.addEventListener('click', () => {
    frequency = 4.5e14;
    frequencySlider.value = 4.5;
    calculatePhysics();
    updateDisplay();
});

document.getElementById('preset2')?.addEventListener('click', () => {
    frequency = 5.5e14; 
    frequencySlider.value = 5.5;
    calculatePhysics();
    updateDisplay();
});

document.getElementById('preset3')?.addEventListener('click', () => {
    frequency = 6.5e14; 
    frequencySlider.value = 6.5;
    calculatePhysics();
    updateDisplay();
});

document.getElementById('preset4')?.addEventListener('click', () => {
    frequency = 10e14;
    frequencySlider.value = 10;
    calculatePhysics();
    updateDisplay();
});

document.getElementById('preset5')?.addEventListener('click', () => {
    const metal = metals[currentMetal];
    const thresholdFreq = (metal.workFunction * eV_to_J) / h;
    frequency = thresholdFreq * 1.05;
    frequencySlider.value = frequency / 1e14;
    calculatePhysics();
    updateDisplay();
});

document.getElementById('preset6')?.addEventListener('click', () => {
    frequency = 12e14;
    intensity = 80;
    appliedVoltage = 0;
    frequencySlider.value = 12;
    intensitySlider.value = 80;
    voltageSlider.value = 0;
    calculatePhysics();
    updateDisplay();
});

function frequencyToWavelength(freq) {
    return (c / freq) * 1e9;
}

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
    } else if (wavelength < 380) {
        r = 0.5;
        g = 0;
        b = 1; 
    } else {
        r = 1;
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
        factor = 0.5;
    }
    
    r = Math.round(r * factor * 255);
    g = Math.round(g * factor * 255);
    b = Math.round(b * factor * 255);
    
    return `rgb(${r}, ${g}, ${b})`;
}

function getColorName(wavelength) {
    if (wavelength < 380) return 'UV';
    if (wavelength < 450) return 'Violet';
    if (wavelength < 495) return 'Blue';
    if (wavelength < 570) return 'Green';
    if (wavelength < 590) return 'Yellow';
    if (wavelength < 620) return 'Orange';
    if (wavelength < 750) return 'Red';
    return 'IR';
}

function calculatePhysics() {
    const metal = metals[currentMetal];
    //photon energy E = hν 
    photonEnergy = (h * frequency) / eV_to_J;
    // max KE maxK = hν - workFunction
    maxKE = photonEnergy - metal.workFunction;
    //stopping pot Evnot = Kmax
    stoppingPotential = maxKE;
    if (maxKE > 0 && appliedVoltage >= -stoppingPotential) {
        photocurrent = intensity * (1 - Math.abs(appliedVoltage / (stoppingPotential + 1)));
        photocurrent = Math.max(0, photocurrent);
    } else {
        photocurrent = 0;
    }
    if (graphData.length === 0 || Math.abs(appliedVoltage - graphData[graphData.length - 1].voltage) > 0.05) {
        let current;
        if (maxKE > 0 && appliedVoltage >= -stoppingPotential) {
            current = intensity * (1 - Math.abs(appliedVoltage / (stoppingPotential + 1)));
            current = Math.max(0, current);
        } else {
            current = 0;
        }
        
        graphData.push({
            voltage: appliedVoltage,
            current: current
        });
        
        if (graphData.length > 50) {
            graphData.shift();
        }
    }
}

function updateDisplay() {
    const wavelength = frequencyToWavelength(frequency);
    const color = wavelengthToRGB(wavelength);
    const colorName = getColorName(wavelength);
    document.getElementById('frequencyDisplay').textContent = (frequency / 1e14).toFixed(1) + ' × 10¹⁴ Hz';
    document.getElementById('wavelengthDisplay').textContent = wavelength.toFixed(0) + ' nm';
    document.getElementById('colorName').textContent = colorName;
    document.getElementById('intensityDisplay').textContent = intensity.toFixed(0) + ' W/m²';
    document.getElementById('voltageDisplay').textContent = appliedVoltage.toFixed(1) + ' V';
    const wavelengthColor = document.getElementById('wavelengthColor');
    if (wavelengthColor) {
        wavelengthColor.style.background = color;
        wavelengthColor.style.boxShadow = `0 0 15px ${color}`;
    }
    const metal = metals[currentMetal];
    document.getElementById('photonEnergyValue').textContent = photonEnergy.toFixed(2) + ' eV';
    document.getElementById('workFunctionValue').textContent = metal.workFunction.toFixed(1) + ' eV';
    document.getElementById('maxKEValue').textContent = maxKE > 0 ? maxKE.toFixed(2) + ' eV' : '0 eV (No emission)';
    document.getElementById('stoppingPotentialValue').textContent = stoppingPotential > 0 ? stoppingPotential.toFixed(2) + ' V' : 'N/A';
    document.getElementById('photocurrentValue').textContent = photocurrent.toFixed(1) + ' nA';
    document.getElementById('photonCount').textContent = photonCount;
    document.getElementById('electronCount').textContent = electronCount;
    document.getElementById('currentValue').textContent = photocurrent.toFixed(1);
}

function createPhoton() {
    const wavelength = frequencyToWavelength(frequency);
    const color = wavelengthToRGB(wavelength);
    
    photons.push({
        x: 50,
        y: canvas.height / 2 + (Math.random() - 0.5) * 100,
        speed: 8,
        color: color,
        size: 4,
        phase: Math.random() * Math.PI * 2
    });
    
    photonCount++;
}

function createElectron(y) {
    const metal = metals[currentMetal];
    
    //KE = 1/2mv2 v = root(2KE/m)
    const electronMass = 9.109e-31;
    const ke_J = maxKE * eV_to_J;
    const velocity = Math.sqrt(2 * ke_J / electronMass);
    const visualSpeed = 3 + (maxKE / 5) * 2;
    const fieldEffect = -appliedVoltage * 0.5;
    
    electrons.push({
        x: canvas.width * 0.35,
        y: y,
        vx: visualSpeed,
        vy: (Math.random() - 0.5) * 2,
        speed: visualSpeed,
        color: '#4dabf7',
        size: 5,
        life: 100,
        fieldEffect: fieldEffect
    });
    
    electronCount++;
}

function updatePhysics() {
    if (isLightOn && Math.random() < intensity / 100) {
        createPhoton();
    }
    photons = photons.filter(p => {
        p.x += p.speed;
        p.phase += 0.2;
        if (p.x > canvas.width * 0.35 && p.x < canvas.width * 0.38) {
            if (maxKE > 0 && Math.random() < 0.7) {
                createElectron(p.y);
            }
            return false; 
        }
        
        return p.x < canvas.width;
    });
    electrons = electrons.filter(e => {
        e.x += e.vx;
        e.y += e.vy;
        e.life--;
        e.vx += e.fieldEffect * 0.01;
        if (appliedVoltage < 0 && Math.abs(appliedVoltage) >= stoppingPotential) {
            e.vx *= 0.95; // Slow down
            if (e.vx < 0.1) return false; 
        }
        
        return e.x < canvas.width && e.life > 0;
    });
}

function getThemeColors() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    
    return {
        bg: isDark ? '#0a0a0a' : '#f8f9fa',
        text: isDark ? '#ffffff' : '#000000',
        border: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
        metal: metals[currentMetal].color,
        electron: '#4dabf7',
        grid: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
    };
}

function draw() {
    if (!canvas || !ctx) return;
    
    const colors = getThemeColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const metalX = canvas.width * 0.35;
    const metalWidth = 20;
    const metalHeight = 200;
    const metalY = canvas.height / 2 - metalHeight / 2;
    const gradient = ctx.createLinearGradient(metalX, 0, metalX + metalWidth, 0);
    gradient.addColorStop(0, colors.metal);
    gradient.addColorStop(0.5, adjustBrightness(colors.metal, 1.2));
    gradient.addColorStop(1, colors.metal);
    ctx.fillStyle = gradient;
    ctx.fillRect(metalX, metalY, metalWidth, metalHeight);
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(metalX, metalY, metalWidth, metalHeight);
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(metals[currentMetal].name, metalX + metalWidth / 2, metalY - 10);
    if (showPhotons) {
        photons.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = p.color;
            const waveY = p.y + Math.sin(p.phase) * 10;
            ctx.beginPath();
            ctx.arc(p.x, waveY, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = 0.3;
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < 3; i++) {
                const trailX = p.x - i * 15;
                const trailY = waveY + Math.sin(p.phase - i * 0.5) * 10;
                if (i === 0) ctx.moveTo(trailX, trailY);
                else ctx.lineTo(trailX, trailY);
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
            
            ctx.shadowBlur = 0;
        });
    }
    if (showElectrons) {
        electrons.forEach(e => {
            ctx.fillStyle = colors.electron;
            ctx.shadowBlur = 12;
            ctx.shadowColor = colors.electron;
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = colors.electron;
            ctx.globalAlpha = 0.2;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(e.x, e.y);
            ctx.lineTo(e.x - e.vx * 5, e.y - e.vy * 5);
            ctx.stroke();
            ctx.globalAlpha = 1;
        });
    }
    if (showEnergyLevels) {
        drawEnergyDiagram(colors);
    }
    if (showGraph && graphData.length > 1) {
        drawIVGraph(colors);
    }
    const collectorX = canvas.width * 0.75;
    ctx.strokeStyle = appliedVoltage >= 0 ? '#51cf66' : '#ff6b6b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(collectorX, metalY);
    ctx.lineTo(collectorX, metalY + metalHeight);
    ctx.stroke();
    ctx.fillStyle = colors.text;
    ctx.font = '12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Collector', collectorX, metalY - 10);
    ctx.fillText(`${appliedVoltage.toFixed(1)} V`, collectorX, metalY + metalHeight + 20);
    if (isLightOn) {
        const wavelength = frequencyToWavelength(frequency);
        const lightColor = wavelengthToRGB(wavelength);
        ctx.fillStyle = lightColor;
        ctx.shadowBlur = 30;
        ctx.shadowColor = lightColor;
        ctx.beginPath();
        ctx.arc(30, canvas.height / 2, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = lightColor;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 3;
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(45, canvas.height / 2 + i * 25);
            ctx.lineTo(metalX, canvas.height / 2 + i * 25);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }
    ctx.fillStyle = colors.text;
    ctx.globalAlpha = 0.6;
    ctx.font = '11px Inter';
    ctx.textAlign = 'left';
    ctx.fillText('Adjust frequency and intensity | Measure stopping potential | Try different metals', 10, canvas.height - 20);
    ctx.globalAlpha = 1;
}

function drawEnergyDiagram(colors) {
    const diagramX = canvas.width * 0.55;
    const diagramY = 50;
    const diagramWidth = 200;
    const diagramHeight = 150;
    ctx.fillStyle = colors.bg;
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 2;
    ctx.fillRect(diagramX, diagramY, diagramWidth, diagramHeight);
    ctx.strokeRect(diagramX, diagramY, diagramWidth, diagramHeight);
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Energy Diagram', diagramX + diagramWidth / 2, diagramY + 20);
    const metal = metals[currentMetal];
    const scale = 20;
    const fermiY = diagramY + diagramHeight - 30;
    ctx.strokeStyle = colors.metal;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(diagramX + 20, fermiY);
    ctx.lineTo(diagramX + diagramWidth - 20, fermiY);
    ctx.stroke();
    ctx.fillStyle = colors.text;
    ctx.font = '10px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(`Φ = ${metal.workFunction} eV`, diagramX + 25, fermiY - 5);
    if (photonEnergy > 0) {
        const photonY = fermiY - photonEnergy * scale;
        ctx.strokeStyle = wavelengthToRGB(frequencyToWavelength(frequency));
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(diagramX + 20, photonY);
        ctx.lineTo(diagramX + diagramWidth - 20, photonY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillText(`E = ${photonEnergy.toFixed(2)} eV`, diagramX + 25, photonY - 5);
        ctx.strokeStyle = colors.text;
        ctx.fillStyle = colors.text;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(diagramX + diagramWidth / 2, fermiY);
        ctx.lineTo(diagramX + diagramWidth / 2, photonY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(diagramX + diagramWidth / 2, photonY);
        ctx.lineTo(diagramX + diagramWidth / 2 - 5, photonY + 10);
        ctx.lineTo(diagramX + diagramWidth / 2 + 5, photonY + 10);
        ctx.closePath();
        ctx.fill();
        if (maxKE > 0) {
            ctx.fillStyle = '#51cf66';
            ctx.fillText(`K_max = ${maxKE.toFixed(2)} eV`, diagramX + diagramWidth - 80, photonY + 15);
        }
    }
}

function drawIVGraph(colors) {
    const graphX = 20;
    const graphY = canvas.height - 180;
    const graphWidth = 250;
    const graphHeight = 150;
    ctx.fillStyle = colors.bg;
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 2;
    ctx.fillRect(graphX, graphY, graphWidth, graphHeight);
    ctx.strokeRect(graphX, graphY, graphWidth, graphHeight);
    
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('I-V Characteristic', graphX + graphWidth / 2, graphY + 20);
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    const originX = graphX + 50;
    const originY = graphY + graphHeight - 30;
    
    ctx.beginPath();
    ctx.moveTo(originX, graphY + 30);
    ctx.lineTo(originX, originY);
    ctx.lineTo(graphX + graphWidth - 20, originY);
    ctx.stroke();
    if (maxKE > 0 && graphData.length > 1) {
        ctx.strokeStyle = '#da77f2';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const xScale = (graphWidth - 70) / 10; 
        const yScale = (graphHeight - 60) / 100; 
        
        let started = false;
        graphData.forEach(point => {
            const x = originX + (point.voltage + 5) * xScale;
            const y = originY - point.current * yScale;
            
            if (!started) {
                ctx.moveTo(x, y);
                started = true;
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        if (stoppingPotential > 0) {
            const stopX = originX + (-stoppingPotential + 5) * xScale;
            ctx.strokeStyle = '#ff6b6b';
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(stopX, graphY + 30);
            ctx.lineTo(stopX, originY);
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.fillStyle = '#ff6b6b';
            ctx.font = '9px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('V₀', stopX, graphY + 25);
        }
    }
    
    ctx.fillStyle = colors.text;
    ctx.font = '10px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Voltage (V)', graphX + graphWidth / 2, graphY + graphHeight - 5);
    ctx.save();
    ctx.translate(graphX + 10, graphY + graphHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Current (nA)', 0, 0);
    ctx.restore();
}

function adjustBrightness(color, factor) {
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substr(0, 2), 16) * factor);
    const g = Math.min(255, parseInt(hex.substr(2, 2), 16) * factor);
    const b = Math.min(255, parseInt(hex.substr(4, 2), 16) * factor);
    return `rgb(${r}, ${g}, ${b})`;
}

function animate() {
    updatePhysics();
    draw();
    requestAnimationFrame(animate);
}

setTimeout(() => {
    calculatePhysics();
    updateDisplay();
    draw();
    animate();
}, 100);