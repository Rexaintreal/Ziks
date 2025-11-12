let lensType = 'convex'; 
let focalLength = 150; 
let objectDistance = 300; 
let objectHeight = 60;
let showPrincipalAxis = true;
let showFocalPoints = true;
let showRays = true;
let showGrid = true;
let scale = 1; 
let lensX = 0; 
let objectPos = { x: 0, y: 0 }; 
let isDraggingObject = false;
let isDraggingLens = false;
let isResizingObject = false;
let dragOffset = { x: 0, y: 0 };
let hoverState = {
    object: false,
    lens: false,
    objectTop: false,
    objectBottom: false
};

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
    lensX = canvas.width / 2;
    scale = Math.min(canvas.width / 800, canvas.height / 600);
    updateObjectPosition();
    draw();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const convexBtn = document.getElementById('convexBtn');
const concaveBtn = document.getElementById('concaveBtn');
const focalLengthSlider = document.getElementById('focalLengthSlider');
const objectDistanceSlider = document.getElementById('objectDistanceSlider');
const objectHeightSlider = document.getElementById('objectHeightSlider');
const focalLengthDisplay = document.getElementById('focalLengthDisplay');
const objectDistanceDisplay = document.getElementById('objectDistanceDisplay');
const objectHeightDisplay = document.getElementById('objectHeightDisplay');
const showPrincipalAxisCheck = document.getElementById('showPrincipalAxis');
const showFocalPointsCheck = document.getElementById('showFocalPoints');
const showRaysCheck = document.getElementById('showRays');
const showGridCheck = document.getElementById('showGrid');
const preset1 = document.getElementById('preset1');
const preset2 = document.getElementById('preset2');
const preset3 = document.getElementById('preset3');
const preset4 = document.getElementById('preset4');

convexBtn?.addEventListener('click', () => {
    lensType = 'convex';
    convexBtn.classList.add('active');
    concaveBtn.classList.remove('active');
    updateCalculations();
    draw();
});

concaveBtn?.addEventListener('click', () => {
    lensType = 'concave';
    concaveBtn.classList.add('active');
    convexBtn.classList.remove('active');
    updateCalculations();
    draw();
});

focalLengthSlider?.addEventListener('input', () => {
    focalLength = parseFloat(focalLengthSlider.value);
    updateDisplay();
    updateCalculations();
    draw();
});

objectDistanceSlider?.addEventListener('input', () => {
    objectDistance = parseFloat(objectDistanceSlider.value);
    updateObjectPosition();
    updateDisplay();
    updateCalculations();
    draw();
});

objectHeightSlider?.addEventListener('input', () => {
    objectHeight = parseFloat(objectHeightSlider.value);
    updateDisplay();
    updateCalculations();
    draw();
});

showPrincipalAxisCheck?.addEventListener('change', () => {
    showPrincipalAxis = showPrincipalAxisCheck.checked;
    draw();
});

showFocalPointsCheck?.addEventListener('change', () => {
    showFocalPoints = showFocalPointsCheck.checked;
    draw();
});

showRaysCheck?.addEventListener('change', () => {
    showRays = showRaysCheck.checked;
    draw();
});

showGridCheck?.addEventListener('change', () => {
    showGrid = showGridCheck.checked;
    draw();
});

preset1?.addEventListener('click', () => {
    lensType = 'convex';
    focalLength = 150;
    objectDistance = 350;
    objectHeight = 60;
    convexBtn.classList.add('active');
    concaveBtn.classList.remove('active');
    focalLengthSlider.value = focalLength;
    objectDistanceSlider.value = objectDistance;
    objectHeightSlider.value = objectHeight;
    updateObjectPosition();
    updateDisplay();
    updateCalculations();
    draw();
});

preset2?.addEventListener('click', () => {
    lensType = 'convex';
    focalLength = 150;
    objectDistance = 225;
    objectHeight = 60;
    convexBtn.classList.add('active');
    concaveBtn.classList.remove('active');
    focalLengthSlider.value = focalLength;
    objectDistanceSlider.value = objectDistance;
    objectHeightSlider.value = objectHeight;
    updateObjectPosition();
    updateDisplay();
    updateCalculations();
    draw();
});

preset3?.addEventListener('click', () => {
    lensType = 'convex';
    focalLength = 150;
    objectDistance = 100;
    objectHeight = 60;
    convexBtn.classList.add('active');
    concaveBtn.classList.remove('active');
    focalLengthSlider.value = focalLength;
    objectDistanceSlider.value = objectDistance;
    objectHeightSlider.value = objectHeight;
    updateObjectPosition();
    updateDisplay();
    updateCalculations();
    draw();
});

preset4?.addEventListener('click', () => {
    lensType = 'concave';
    focalLength = 150;
    objectDistance = 250;
    objectHeight = 60;
    concaveBtn.classList.add('active');
    convexBtn.classList.remove('active');
    focalLengthSlider.value = focalLength;
    objectDistanceSlider.value = objectDistance;
    objectHeightSlider.value = objectHeight;
    updateObjectPosition();
    updateDisplay();
    updateCalculations();
    draw();
});

function updateObjectPosition() {
    objectPos.x = lensX - objectDistance * scale;
    objectPos.y = canvas.height / 2;
}

function updateDisplay() {
    if (focalLengthDisplay) focalLengthDisplay.textContent = focalLength + ' cm';
    if (objectDistanceDisplay) objectDistanceDisplay.textContent = objectDistance + ' cm';
    if (objectHeightDisplay) objectHeightDisplay.textContent = objectHeight + ' cm';
}

function updateCalculations() {
    const u = -objectDistance;
    const f = lensType === 'convex' ? focalLength : -focalLength;
    let v, imageHeight, magnification;
    let imageType = '';
    let imageNature = '';
    
    if (lensType === 'convex') {
        v = (f * u) / (u - f);
    } else {
        v = (f * u) / (u - f);
    }
    
    magnification = v / u;
    imageHeight = magnification * objectHeight;
    
    if (lensType === 'convex') {
        if (objectDistance > 2 * focalLength) {
            imageType = 'Real, Inverted';
            imageNature = 'Diminished';
        } else if (objectDistance === 2 * focalLength) {
            imageType = 'Real, Inverted';
            imageNature = 'Same Size';
        } else if (objectDistance > focalLength && objectDistance < 2 * focalLength) {
            imageType = 'Real, Inverted';
            imageNature = 'Magnified';
        } else if (objectDistance === focalLength) {
            imageType = 'At Infinity';
            imageNature = 'Highly Magnified';
            v = Infinity;
        } else {
            imageType = 'Virtual, Erect';
            imageNature = 'Magnified';
        }
    } else {
        imageType = 'Virtual, Erect';
        imageNature = 'Diminished';
    }
    
    const imageDistanceEl = document.getElementById('imageDistanceValue');
    const imageHeightEl = document.getElementById('imageHeightValue');
    const magnificationEl = document.getElementById('magnificationValue');
    const imageTypeEl = document.getElementById('imageTypeValue');
    const imageNatureEl = document.getElementById('imageNatureValue');
    
    if (imageDistanceEl) {
        if (isFinite(v)) {
            imageDistanceEl.textContent = Math.abs(v).toFixed(1) + ' cm';
        } else {
            imageDistanceEl.textContent = '∞';
        }
    }
    
    if (imageHeightEl) {
        if (isFinite(imageHeight)) {
            imageHeightEl.textContent = Math.abs(imageHeight).toFixed(1) + ' cm';
        } else {
            imageHeightEl.textContent = '∞';
        }
    }
    
    if (magnificationEl) {
        if (isFinite(magnification)) {
            magnificationEl.textContent = Math.abs(magnification).toFixed(2) + '×';
        } else {
            magnificationEl.textContent = '∞';
        }
    }
    
    if (imageTypeEl) {
        imageTypeEl.textContent = imageType;
        if (imageType.includes('Real')) {
            imageTypeEl.style.color = '#51cf66';
        } else if (imageType.includes('Virtual')) {
            imageTypeEl.style.color = '#4dabf7';
        } else {
            imageTypeEl.style.color = '#ffd43b';
        }
    }
    
    if (imageNatureEl) {
        imageNatureEl.textContent = imageNature;
    }
    
    return { v, imageHeight, magnification };
}

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function checkHover(mouseX, mouseY) {
    const objectTopY = objectPos.y - objectHeight * scale;
    const objectBottomY = objectPos.y;
    const objectDist = Math.hypot(mouseX - objectPos.x, mouseY - (objectTopY + objectHeight * scale / 2));
    hoverState.object = objectDist < 25;
    const topHandleDist = Math.hypot(mouseX - objectPos.x, mouseY - objectTopY);
    hoverState.objectTop = topHandleDist < 15;
    const bottomHandleDist = Math.hypot(mouseX - objectPos.x, mouseY - objectBottomY);
    hoverState.objectBottom = bottomHandleDist < 15;
    const lensDist = Math.abs(mouseX - lensX);
    hoverState.lens = lensDist < 20 && Math.abs(mouseY - canvas.height / 2) < 120;
}

canvas.addEventListener('mousedown', (e) => {
    const pos = getMousePos(e);
    checkHover(pos.x, pos.y);
    
    if (hoverState.objectTop || hoverState.objectBottom) {
        isResizingObject = true;
        canvas.style.cursor = 'ns-resize';
    } else if (hoverState.object) {
        isDraggingObject = true;
        dragOffset.x = pos.x - objectPos.x;
        canvas.style.cursor = 'grabbing';
    } else if (hoverState.lens) {
        isDraggingLens = true;
        dragOffset.x = pos.x - lensX;
        canvas.style.cursor = 'grabbing';
    }
});

canvas.addEventListener('mousemove', (e) => {
    const pos = getMousePos(e);
    
    if (isResizingObject) {
        const objectTopY = objectPos.y - objectHeight * scale;
        const newHeight = Math.abs(pos.y - objectPos.y) / scale;
        objectHeight = Math.max(20, Math.min(100, newHeight));
        objectHeightSlider.value = objectHeight;
        updateDisplay();
        updateCalculations();
        draw();
    } else if (isDraggingObject) {
        const newX = pos.x - dragOffset.x;
        objectPos.x = Math.max(50, Math.min(newX, lensX - 50 * scale));
        objectDistance = (lensX - objectPos.x) / scale;
        objectDistanceSlider.value = objectDistance;
        updateDisplay();
        updateCalculations();
        draw();
    } else if (isDraggingLens) {
        lensX = Math.max(200, Math.min(pos.x - dragOffset.x, canvas.width - 200));
        updateObjectPosition();
        updateCalculations();
        draw();
    } else {
        checkHover(pos.x, pos.y);
        
        if (hoverState.objectTop || hoverState.objectBottom) {
            canvas.style.cursor = 'ns-resize';
        } else if (hoverState.object || hoverState.lens) {
            canvas.style.cursor = 'grab';
        } else {
            canvas.style.cursor = 'default';
        }
        
        draw();
    }
});

canvas.addEventListener('mouseup', () => {
    isDraggingObject = false;
    isDraggingLens = false;
    isResizingObject = false;
    canvas.style.cursor = 'default';
});

canvas.addEventListener('mouseleave', () => {
    isDraggingObject = false;
    isDraggingLens = false;
    isResizingObject = false;
    hoverState = {
        object: false,
        lens: false,
        objectTop: false,
        objectBottom: false
    };
    canvas.style.cursor = 'default';
    draw();
});


canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -10 : 10;
    focalLength = Math.max(50, Math.min(250, focalLength + delta));
    focalLengthSlider.value = focalLength;
    updateDisplay();
    updateCalculations();
    draw();
}, { passive: false });

function getThemeColors() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    
    return {
        bg: isDark ? '#0a0a0a' : '#f8f9fa',
        grid: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        axis: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
        lens: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
        lensHover: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
        object: '#ff6b6b',
        objectHover: '#ff5252',
        imageReal: '#51cf66',
        imageVirtual: '#4dabf7',
        ray1: '#ff922b',
        ray2: '#ffd43b',
        ray3: '#da77f2',
        focal: '#ffd43b',
        text: isDark ? '#ffffff' : '#000000',
        handle: '#4dabf7'
    };
}

function drawLens(x, y, height, type) {
    const colors = getThemeColors();
    
    ctx.strokeStyle = hoverState.lens ? colors.lensHover : colors.lens;
    ctx.lineWidth = hoverState.lens ? 6 : 5;
    
    if (type === 'convex') {
        ctx.beginPath();
        ctx.moveTo(x, y - height / 2);
        ctx.quadraticCurveTo(x + 20, y, x, y + height / 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x, y - height / 2);
        ctx.quadraticCurveTo(x - 20, y, x, y + height / 2);
        ctx.stroke();
    } else {
        ctx.beginPath();
        ctx.moveTo(x, y - height / 2);
        ctx.quadraticCurveTo(x - 20, y, x, y + height / 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x, y - height / 2);
        ctx.quadraticCurveTo(x + 20, y, x, y + height / 2);
        ctx.stroke();
    }
    ctx.strokeStyle = colors.lens;
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(x, y - height / 2 - 20);
    ctx.lineTo(x, y + height / 2 + 20);
    ctx.stroke();
    ctx.setLineDash([]);
    if (hoverState.lens) {
        ctx.strokeStyle = colors.handle;
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(x - 30, y - height / 2 - 30, 60, height + 60);
        ctx.setLineDash([]);
    }
}

function drawArrow(x, y, height, color, label, isHovered = false) {
    const colors = getThemeColors();
    const drawColor = isHovered ? colors.objectHover : color;
    
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = isHovered ? 5 : 4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - height);
    ctx.stroke();
    ctx.fillStyle = drawColor;
    ctx.beginPath();
    ctx.moveTo(x, y - height);
    ctx.lineTo(x - 8, y - height + 12);
    ctx.lineTo(x + 8, y - height + 12);
    ctx.closePath();
    ctx.fill();
    if (label === 'Object' && (hoverState.object || hoverState.objectTop || hoverState.objectBottom || isDraggingObject || isResizingObject)) {
        ctx.fillStyle = hoverState.objectTop ? colors.handle : colors.objectHover;
        ctx.beginPath();
        ctx.arc(x, y - height, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = colors.text;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = hoverState.objectBottom ? colors.handle : colors.objectHover;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = colors.text;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.strokeStyle = colors.handle;
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(x - 25, y - height - 15, 50, height + 30);
        ctx.setLineDash([]);
    }
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y + 20);
}

function drawRay(x1, y1, x2, y2, color, dashPattern = []) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash(dashPattern);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 8;
    ctx.shadowColor = color;
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function draw() {
    if (!canvas || !ctx) return;
    const colors = getThemeColors();
    const centerY = canvas.height / 2;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (showGrid) {
        ctx.strokeStyle = colors.grid;
        ctx.lineWidth = 1;
        const gridSpacing = 50 * scale;
        
        for (let x = 0; x < canvas.width; x += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        for (let y = 0; y < canvas.height; y += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }
    
    if (showPrincipalAxis) {
        ctx.strokeStyle = colors.axis;
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(canvas.width, centerY);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    if (showFocalPoints) {
        const f1X = lensX - focalLength * scale;
        const f2X = lensX + focalLength * scale;
        
        ctx.fillStyle = colors.focal;
        ctx.beginPath();
        ctx.arc(f1X, centerY, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(f2X, centerY, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = colors.text;
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('F', f1X, centerY - 15);
        ctx.fillText('F', f2X, centerY - 15);
        
        const twoF1X = lensX - 2 * focalLength * scale;
        const twoF2X = lensX + 2 * focalLength * scale;
        ctx.fillStyle = colors.focal + '80';
        ctx.beginPath();
        ctx.arc(twoF1X, centerY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(twoF2X, centerY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText('2F', twoF1X, centerY - 15);
        ctx.fillText('2F', twoF2X, centerY - 15);
    }
    
    const { v, imageHeight } = updateCalculations();
    
    if (showRays && isFinite(v)) {
        const objectTipY = objectPos.y - objectHeight * scale;
        const imageX = lensX + v * scale;
        const imageTopY = centerY - imageHeight * scale;
        
        if (lensType === 'convex') {
            drawRay(objectPos.x, objectTipY, lensX, objectTipY, colors.ray1);
            if (v > 0) {
                drawRay(lensX, objectTipY, imageX, imageTopY, colors.ray1);
            } else {
                const focalX = lensX - focalLength * scale;
                const extendX = lensX - canvas.width;
                const slope = (objectTipY - centerY) / (lensX - focalX);
                const extendY = centerY + slope * (extendX - focalX);
                drawRay(lensX, objectTipY, extendX, extendY, colors.ray1);
                drawRay(lensX, objectTipY, imageX, imageTopY, colors.ray1, [5, 5]);
            }
        } else {
            const focalX = lensX + focalLength * scale;
            drawRay(objectPos.x, objectTipY, lensX, objectTipY, colors.ray1);
            const slope = (objectTipY - centerY) / (lensX - focalX);
            const extendX = lensX + canvas.width;
            const extendY = centerY + slope * (extendX - focalX);
            drawRay(lensX, objectTipY, extendX, extendY, colors.ray1);
            drawRay(lensX, objectTipY, imageX, imageTopY, colors.ray1, [5, 5]);
        }
        
        drawRay(objectPos.x, objectTipY, lensX, centerY, colors.ray2);
        if (v > 0) {
            drawRay(lensX, centerY, imageX, imageTopY, colors.ray2);
        } else {
            drawRay(lensX, centerY, lensX - canvas.width, centerY - (centerY - objectTipY) * canvas.width / (lensX - objectPos.x), colors.ray2);
            drawRay(lensX, centerY, imageX, imageTopY, colors.ray2, [5, 5]);
        }
        
        if (lensType === 'convex') {
            const focalX = lensX - focalLength * scale;
            const lensY = centerY + (objectTipY - centerY) * (lensX - focalX) / (objectPos.x - focalX);
            drawRay(objectPos.x, objectTipY, lensX, lensY, colors.ray3);
            if (v > 0) {
                drawRay(lensX, lensY, imageX, imageTopY, colors.ray3);
            } else {
                drawRay(lensX, lensY, lensX + canvas.width, lensY, colors.ray3);
                drawRay(lensX, lensY, imageX, imageTopY, colors.ray3, [5, 5]);
            }
        }
    }
    
    if (isFinite(v) && isFinite(imageHeight)) {
        const imageX = lensX + v * scale;
        const imageColor = v > 0 ? colors.imageReal : colors.imageVirtual;
        const imageLabel = v > 0 ? 'Image (Real)' : 'Image (Virtual)';
        
        if (v > 0) {
            drawArrow(imageX, centerY, imageHeight * scale, imageColor, imageLabel);
        } else {
            drawArrow(imageX, centerY, Math.abs(imageHeight) * scale, imageColor, imageLabel);
        }
        
        ctx.fillStyle = imageColor;
        ctx.font = 'bold 16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(v > 0 ? 'REAL' : 'VIRTUAL', imageX, centerY + Math.abs(imageHeight) * scale + 40);
    }
    
    drawArrow(objectPos.x, objectPos.y, objectHeight * scale, colors.object, 'Object', 
              hoverState.object || isDraggingObject);
    
    drawLens(lensX, centerY, 200, lensType);
    
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(lensType === 'convex' ? 'Convex Lens' : 'Concave Lens', lensX, centerY + 130);
}

setTimeout(() => {
    updateDisplay();
    updateCalculations();
    draw();
}, 100);