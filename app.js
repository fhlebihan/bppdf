<html>
<body>
<style>
    /* 1. RESET Y CONFIGURACIÓN BASE */
    * { 
        margin: 0; 
        padding: 0; 
        box-sizing: border-box; 
        -webkit-tap-highlight-color: transparent; /* Evita el recuadro azul al tocar en móvil */
    }
    
    body, html { 
        height: 100%; 
        width: 100%; 
        overflow: hidden; /* Vital para que no se mueva la pantalla al pintar */
        background-color: #222; 
        font-family: sans-serif;
    }

    /* 2. CONTENEDOR PRINCIPAL (MODO MÓVIL/VERTICAL) */
    .app-container {
        display: flex;
        flex-direction: column; 
        height: 100vh;
        width: 100vw;
    }

    /* 3. BARRA DE HERRAMIENTAS (REJILLA 4x2) */
    .toolbar {
        background: #333;
        display: grid;
        grid-template-columns: repeat(4, 50px); /* 4 columnas de 50px */
        gap: 10px;
        padding: 15px;
        justify-content: center;
        align-content: center;
        min-height: 130px; /* Altura suficiente para 2 filas */
        z-index: 10;
        box-shadow: 0 2px 10px rgba(0,0,0,0.5);
    }

    /* 4. BOTONES UNIFORMES */
    .tool-button {
        width: 50px;
        height: 50px;
        border: none;
        border-radius: 12px;
        background: #444;
        font-size: 1.5rem;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: transform 0.1s, background 0.2s;
        color: white;
        position: relative;
    }

    .tool-button:active { 
        transform: scale(0.9); 
        background: #666; 
    }

    /* Selector de color oculto pero funcional */
    .color-wrapper input[type="color"] {
        position: absolute;
        opacity: 0;
        width: 100%;
        height: 100%;
        cursor: pointer;
    }

    /* 5. ÁREA DEL LIENZO */
    .canvas-wrapper {
        flex-grow: 1;
        position: relative; /* Esto hace que "bottom: 0" sea el fondo del wrapper */
        display: inline-block; /* Para que el div no sea más ancho que el canvas */
        line-height: 0; /* Elimina espacios extra debajo del canvas */
        justify-content: center;
        align-items: center;
        background: #eee;
        overflow: hidden;
        padding: 5px;
    }

    canvas {
        background: white;
        box-shadow: 0 0 15px rgba(0,0,0,0.3);
        touch-action: none; /* Bloquea gestos del navegador para permitir dibujo fluido */
        max-width: 100%;
        max-height: 100%;
        /* Lista de fuentes: Infantil (Comic Sans), Elegante (Georgia), Estándar (Arial) */
        font-family: "Comic Sans MS", "Marker Felt", "Georgia", "Arial", sans-serif;
    }

    /* 6. MODO PC / HORIZONTAL (MEDIA QUERY) */
    @media (orientation: landscape) {
        .app-container {
            flex-direction: row; /* Barra a la izquierda, canvas a la derecha */
        }
        
        .toolbar {
            grid-template-columns: repeat(2, 50px); /* 2 columnas de 50px */
            grid-template-rows: repeat(4, 50px);    /* 4 filas */
            width: 140px; /* Ancho ajustado para evitar cortes */
            height: 100%;
            min-height: 100%;
            border-right: 1px solid #444;
        }
    }

    /* Cursor de Pincel */
    .cursor-brush {
        cursor: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' style='font-size:24px'><text y='24'>🖌️</text></svg>") 0 24, auto;
    }

    /* Cursor de Balde */
    .cursor-bucket {
        cursor: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' style='font-size:24px'><text y='24'>🪣</text></svg>") 0 24, auto;
    }

    /* Cursor de Texto Personalizado */
    .cursor-text {
        cursor: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' style='font-size:20px'><text y='20' x='5'>🅰️</text></svg>") 10 20, auto;
    }

    #text-editor {
        position: absolute;
        z-index: 1000; /* Asegura que toda la ventana flote sobre el canvas */
        display: flex;
        flex-direction: column;
        pointer-events: none; /* Esto permite que los clics pasen a través del fondo si es necesario */
    }

    .editor-controls {
        display: flex;
        gap: 5px;
        margin-bottom: 10px;
        pointer-events: auto; /* ¡IMPORTANTE! Los botones SÍ deben recibir clics */
        z-index: 1010; /* Por encima del textarea */
        position: relative; 
    }    

    .text-editor-hidden { display: none !important; }

    #text-input {
        padding: 0 !important;
        margin: 0 !important;
        display: block;
        transform-origin: top left;
        
        /* ELIMINAR BORDES POR COMPLETO */
        border: none !important;      /* Quita el borde sólido o punteado */
        outline: none !important;     /* Quita el borde azul o negro que sale al escribir */
        
        /* TRANSPARENCIA TOTAL */
        background: transparent !important;
        resize: none;
        box-shadow: none !important;
    }
  
    /* Contenedor de la esquina */
    .page-corner {
        position: absolute;
        bottom: 0;
        width: 80px;
        height: 80px;
        cursor: pointer;
        z-index: 100;
    }

    .left-corner { left: 0; }
    .right-corner { right: 0; }

    /* El efecto de la hoja doblada */
    .flip-content {
        width: 0;
        height: 0;
        border-style: solid;
        transition: all 0.3s ease; /* Velocidad de la animación */
    }

    /* Esquina Derecha (Siguiente) */
    .right-corner .flip-content {
        border-width: 0 0 40px 40px;
        border-color: transparent transparent #ddd transparent; /* Color del reverso de la hoja */
        position: absolute;
        right: 0;
        bottom: 0;
        box-shadow: -2px -2px 5px rgba(0,0,0,0.2);
    }

    .right-corner:hover .flip-content {
        border-width: 0 0 80px 80px; /* Se dobla más al pasar el mouse */
        border-color: transparent transparent #fdfdfd transparent;
    }

    /* Esquina Izquierda (Anterior) */
    .left-corner .flip-content {
        border-width: 0 40px 40px 0;
        border-color: transparent #ddd transparent transparent;
        position: absolute;
        left: 0;
        bottom: 0;
        box-shadow: 2px -2px 5px rgba(0,0,0,0.2);
    }

    .left-corner:hover .flip-content {
        border-width: 0 80px 80px 0;
        border-color: transparent #fdfdfd transparent transparent;
    }  
    
    .corner-hint {
        position: absolute;
        bottom: 10px;
        font-size: 20px;
        z-index: 50; /* Por debajo de flip-content */
    }

    .left-corner .corner-hint { left: 10px; }
    .right-corner .corner-hint { right: 10px; }

    /* Opcional: que el emoji brille un poco al hacer hover */
    .page-corner:hover .corner-hint {
        transform: scale(1.2);
        transition: transform 0.2s;
    }    

    #page-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 80;
        background-size: contain;
        background-repeat: no-repeat;
        background-color: white;
        transition: transform 0.6s ease-in-out;
        pointer-events: none; /* No interfiere con clics */
        box-shadow: -10px 0 20px rgba(0,0,0,0.2); /* Esto crea una sombra en el borde mientras se encoge */
    }

    /* Estado oculto (cuando no hay cambio) */
    .page-overlay-hidden {
        display: none;
        transform: scaleX(1);
    }

    /* Cuando se achica hacia la derecha (vas a la anterior) */
    .shrink-to-right {
        transform: scaleX(0);
        transform-origin: right;
    }

    /* Cuando se achica hacia la izquierda (vas a la siguiente) */
    .shrink-to-left {
        transform: scaleX(0);
        transform-origin: left;
    }  

    .share-btn {
        background: linear-gradient(145deg, #ffcf00, #ff9900); /* Color amarillo/naranja tipo moneda de Mario */
        border: 3px solid #552200;
        border-radius: 12px;
        padding: 8px 15px;
        color: #552200;
        font-weight: bold;
        display: flex;
        flex-direction: column;
        align-items: center;
        transition: transform 0.2s ease;
        cursor: pointer;
        box-shadow: 0 4px 0 #884400;
    }

    .share-btn:active {
        transform: translateY(4px);
        box-shadow: none;
    }

    .share-btn svg {
        margin-bottom: 2px;
    }

    .share-btn-floating {
        position: absolute;
        top: 20px;     /* Distancia desde arriba */
        right: 20px;   /* Distancia desde la derecha */
        z-index: 90;   /* Por encima del canvas pero debajo del overlay de transición */
        
        /* Estética de botón de Mario */
        background: #ffcc00;
        border: 3px solid #000;
        border-radius: 50px;
        padding: 10px 20px;
        font-weight: bold;
        font-family: 'Arial', sans-serif;
        cursor: pointer;
        box-shadow: 4px 4px 0px #884400;
        display: flex;
        align-items: center;
        gap: 8px;
        opacity: 0;
        pointer-events: none; /* Evita que se pueda hacer clic mientras es invisible */
        transition: opacity 0.5s ease-in-out;
        position: absolute;
        z-index: 90;
    }

    .share-btn-floating:hover {
        background: #ffe066;
        transform: scale(1.05);
    }

    .share-btn-floating:active {
        transform: translateY(2px);
        box-shadow: 2px 2px 0px #884400;
    }  

    .modal-overlay {
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex; justify-content: center; align-items: center;
        z-index: 1000;
    }
    .modal-content {
        background: white;
        padding: 25px;
        border-radius: 15px;
        text-align: center;
        max-width: 300px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    }
    .modal-content img { margin: 15px 0; border: 5px solid #f0f0f0; }
    .btn-cerrar { background: #ccc; margin-top: 10px; }

</style>

<div class="app-container">
    <div class="toolbar">
        <label class="tool-button color-wrapper" title="Color">
            <input type="color" id="colorPicker" onchange="color = this.value">
            <span class="icon">🎨</span>
        </label>

        <button class="tool-button" onclick="tool = 'brush'; actualizarCursor()" title="Pincel">🖌️</button>
        <button class="tool-button" onclick="tool = 'bucket'; actualizarCursor()" title="Balde">🪣</button>
        
        <button class="tool-button" onclick="downloadImage()" title="Guardar">💾</button>
        <button class="tool-button" onclick="clearCanvas()" title="Reiniciar">🗑️</button>
        <button class="tool-button" onclick="tool = 'text'; actualizarCursor()" title="Agregar Texto">A</button>
        <button id="mute-btn" class="tool-button" onclick="toggleMute()">
            <span id="mute-emoji">🔊</span>
        </button>
    </div>
    
    <div class="canvas-wrapper">
        <canvas id="main-canvas"></canvas>
        <div id="page-overlay" class="page-overlay-hidden"></div>        
        <button class="share-btn-floating" onclick="compartirArteNativo()">
            <span>🚀 Compartir</span>
        </button>
        <div class="page-corner left-corner" onclick="transicionPagina('anterior')">
            <div class="flip-content"></div>
        </div>

        <div class="page-corner right-corner" onclick="transicionPagina('siguiente')">
            <div class="flip-content"></div>
        </div>
    </div>

    <div id="text-editor" class="text-editor-hidden">
        <div class="editor-controls">
            <button onclick="changeFontSizeText(2)">A+</button>
            <button onclick="changeFontSizeText(-2)">A-</button>
            <button onclick="rotateText()">🔄</button>
            <button onclick="applyText()" class="btn-ok">✅</button>
            <button onclick="closeEditor()" class="btn-cancel">❌</button>
        </div>    
        <textarea id="text-input" placeholder="Escribe aquí..."></textarea>
    </div>

</div>

<script src="https://github.com/fhlebihan/bppdf/blob/main/app.min.js"></script>
<script>
// pdfs de dibujos
const pdfs = {
    "smb445": ["https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh71utCjX8kZbcrh7UOwHxb5advzywgTUKRxaMWA6dl42BSH_P19by0NKD_3mPBSxvvP2qKbPa4iU3wd4j23wFCXsDqyDUpaLHBzjc4K5x5LlpHk3w9xI0XutE8IXdxQt27aA8AKctlHfmp_b20zXhueYYOSHXDH180-fIq6nz-UmZGdiR6BTrbHNWhPj8/s320/smb%20%280%29.png", "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhbAci_0iOh4Ya2aIN6zjNzkz_CwmYrquFIKiSxI0kkRusJ_q1eRYgEXsZ6E-ClsmqCDmh7UeDeBVuAqNWykkhsdw45OpU6D9uXBg_0zj0i0PkTSQPdfHhgyXUkNk9XDh9EjMj3jnqRg8FKqlG7CUTxW6_IKMGFDDurfPveSHgDHmBe75Zqq1b4H6vTr1g/s1600/smb%20%281%29.PNG", "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiUmr0iQ6cnGTjhMz7JQDd0KMmnOD4fkfROcz8HeLO2yuRLacWICd-8tvQjgkNX_wTlty6soezPyphqAU0h2_LNcQoEUZcUGfcE4TsozufHacdUuOy1ffy89pzxs9s3UriIelCxYVJRRgOWnkEqsMoOuOkPx-YG8y8J7TPyAuRU8ihyphenhyphenkq532Or_lU4MvsM/s1600/smb%20%282%29.PNG", "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiex4r5MOlZEbuwKEKr0Q1XwHSLfo0ldYYvL720HariZgvXGvR-npJK7Um9K3P0tOqHPwS58ehmTUBeD07zI5lyJLGc72NaWLlylP1VUWwI49TSBRUABbWO8KaMbi5TFP3ljgkn5uIs43WR_MPosyJTXMV48cL1Zyu3ZXRrggsYVLUvVYFWgqd1e42WbLE/s1600/smb%20%283%29.PNG"]
};

function siguienteDibujo() {
    indiceActual = (indiceActual + 1) % pdfActual.length;
    cargarDibujo(pdfActual[indiceActual]);
}

function configurarPDFDesdeURL() {
    // 1. Buscamos el parámetro "pdf" en la URL (?pdf=gatos)
    const params = new URLSearchParams(window.location.search);
    const nombrePDF = params.get("pdf");

    // 2. Si el pdf existe en nuestra lista, lo asignamos
    if (nombrePDF && pdfs[nombrePDF]) {
        pdfActual = pdfs[nombrePDF];
    } else {
	    alert("El url no está bien formado, avisa a tu proveedor del enlace. Te redirigimos al canal donde puedes adquirir esta App para colorear tus PDFs");
        //window.location.href = "https://lebihanto-digital.blogspot.com";
    }
}


// Aquí decides qué pdf cargar en esta página específica
let pdfActual = [];
let indiceActual = 0;

// Esto arranca la app al cargar la página
window.onload = () => {
    configurarPDFDesdeURL();
    initCanvas("main-canvas");
    if (pdfActual.length > 0) {
        cargarDibujo(pdfActual[indiceActual]);
    }
    actualizarCursor();
};
</script>
</body>
</html>
