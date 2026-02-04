/* APP DE PINTURA PROFESIONAL - LOGICA CENTRAL
   Este archivo se sube a GitHub para ser usado en Blogger
*/

let canvas, ctx;
let painting = false;
let color = "#000000"; // Color inicial
let tool = "brush";    // Herramienta inicial: brush o bucket
let brushSize = 5;

// 1. INICIALIZACIÓN
function initCanvas(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    // Optimizamos el contexto para lectura frecuente de píxeles (necesario para el balde)
    ctx = canvas.getContext("2d", { willReadFrequently: true });

    // Pintamos el fondo de blanco inicial para que el balde funcione perfecto
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Eventos de Mouse
    canvas.addEventListener("mousedown", startPosition);
    canvas.addEventListener("mouseup", finishedPosition);
    canvas.addEventListener("mousemove", draw);

    // Eventos Touch (Celulares y Tablets)
    canvas.addEventListener("touchstart", (e) => {
        e.preventDefault();
        startPosition(e.touches[0]);
    }, { passive: false });
    
    canvas.addEventListener("touchend", finishedPosition);
    
    canvas.addEventListener("touchmove", (e) => {
        e.preventDefault();
        draw(e.touches[0]);
    }, { passive: false });
    
    console.log("Canvas inicializado correctamente");
}

// 2. LÓGICA DE POSICIÓN Y PINCEL
function startPosition(e) {
    if (tool === "bucket") {
        executeFloodFill(e);
        return;
    }
    painting = true;
    draw(e);
}

function finishedPosition() {
    painting = false;
    ctx.beginPath(); // Resetea el camino para que no una puntos lejanos
}

function draw(e) {
    if (!painting || tool !== "brush") return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = brushSize;
    ctx.lineCap = "round"; // Hace que el trazo sea suave y circular
    ctx.strokeStyle = color;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

// 3. ALGORITMO DE CUBO DE PINTURA (FLOOD FILL)
function executeFloodFill(e) {
    const rect = canvas.getBoundingClientRect();
    const startX = Math.round(e.clientX - rect.left);
    const startY = Math.round(e.clientY - rect.top);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixelData = imageData.data;

    // Obtener color del píxel donde se hizo clic
    const startPos = (startY * canvas.width + startX) * 4;
    const startR = pixelData[startPos];
    const startG = pixelData[startPos + 1];
    const startB = pixelData[startPos + 2];
    const startA = pixelData[startPos + 3];

    // Obtener color nuevo del selector
    const fillColor = hexToRgb(color);

    // Si es el mismo color, cancelar para evitar bucle infinito
    if (startR === fillColor.r && startG === fillColor.g && startB === fillColor.b && startA === 255) {
        return;
    }

    // Algoritmo de inundación mediante pila (Stack)
    const todo = [[startX, startY]];
    
    while (todo.length > 0) {
        const [x, y] = todo.pop();
        const currentPos = (y * canvas.width + x) * 4;

        if (pixelData[currentPos] === startR &&
            pixelData[currentPos + 1] === startG &&
            pixelData[currentPos + 2] === startB &&
            pixelData[currentPos + 3] === startA) {
            
            // Pintar píxel
            pixelData[currentPos] = fillColor.r;
            pixelData[currentPos + 1] = fillColor.g;
            pixelData[currentPos + 2] = fillColor.b;
            pixelData[currentPos + 3] = 255;

            // Revisar vecinos
            if (x > 0) todo.push([x - 1, y]);
            if (x < canvas.width - 1) todo.push([x + 1, y]);
            if (y > 0) todo.push([x, y - 1]);
            if (y < canvas.height - 1) todo.push([x, y + 1]);
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

// 4. UTILIDADES (AUXILIARES)
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

function clearCanvas() {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function downloadImage() {
    const link = document.createElement("a");
    link.download = "mi-dibujo-creativo.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
}

// Función para compartir (solo funciona en HTTPS/Blogger)
async function shareImage() {
    const dataUrl = canvas.toDataURL("image/png");
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], 'dibujo.png', { type: 'image/png' });

    if (navigator.share) {
        try {
            await navigator.share({
                files: [file],
                title: 'Mira mi dibujo',
                text: '¡Mira lo que pinté en mi App de Arte!'
            });
        } catch (err) {
            console.log("Error al compartir:", err);
        }
    } else {
        alert("Tu navegador no soporta la función compartir. ¡Usa el botón de Guardar!");
    }
}
