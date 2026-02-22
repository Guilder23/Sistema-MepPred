// ============================================
// MI PROGRESO - JAVASCRIPT
// ============================================

console.log('progreso.js cargado correctamente');

let datosProgreso = null;
let contenidoActual = null;

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    cargarProgreso();
    configurarFiltros();
});

// ============================================
// CARGAR PROGRESO
// ============================================

async function cargarProgreso() {
    try {
        // Cargar progreso del usuario
        const responseProgreso = await fetch('/contenido/api/progreso/');
        
        if (!responseProgreso.ok) {
            throw new Error('Error al cargar progreso');
        }
        
        datosProgreso = await responseProgreso.json();
        
        mostrarEstadisticas(datosProgreso.estadisticas);
        
        // Mostrar materias con datos de progreso
        mostrarMaterias(datosProgreso.materias);
        
        document.getElementById('loadingMessage').style.display = 'none';
        
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('loadingMessage').innerHTML = `
            <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: var(--danger-color);"></i>
            <p class="text-muted mt-3">Error al cargar el progreso</p>
        `;
    }
}

// ============================================
// MOSTRAR MATERIAS
// ============================================

function mostrarMaterias(materias) {
    const container = document.getElementById('materiasContainer');
    
    if (!materias || materias.length === 0) {
        document.getElementById('noResultsMessage').style.display = 'block';
        return;
    }
    
    container.innerHTML = '';
    
    materias.forEach(materia => {
        const materiaCard = crearTarjetaMateria(materia);
        container.appendChild(materiaCard);
    });
}

function crearTarjetaMateria(materia) {
    const card = document.createElement('div');
    card.className = 'materia-card';
    card.dataset.materiaId = materia.id;
    card.dataset.materiaNombre = materia.nombre.toLowerCase();
    
    const porcentaje = materia.porcentaje || 0;
    const temasCompletados = materia.temas_completados || 0;
    const totalTemas = materia.total_temas || 0;
    
    const header = document.createElement('div');
    header.className = 'materia-header';
    header.onclick = () => toggleMateriaCard(card, materia.id);
    header.innerHTML = `
        <div class="materia-header-content">
            <h3>
                <i class="fas fa-book"></i>
                ${materia.nombre}
            </h3>
            <div class="materia-progreso-info">
                <span class="materia-porcentaje">${porcentaje}%</span>
                <span class="materia-detalle">${temasCompletados}/${totalTemas} temas completados</span>
            </div>
        </div>
        <div class="materia-stats">
            <span class="materia-loading" style="display: none;">
                <i class="fas fa-spinner fa-spin"></i>
            </span>
            <i class="fas fa-chevron-down chevron-icon"></i>
        </div>
    `;
    
    // Barra de progreso de la materia
    const progressBar = document.createElement('div');
    progressBar.className = 'materia-progreso';
    progressBar.innerHTML = `<div class="materia-progreso-fill" style="width: ${porcentaje}%"></div>`;
    
    const body = document.createElement('div');
    body.className = 'materia-body';
    body.innerHTML = '<div class="temas-loading" style="padding: 2rem; text-align: center; color: var(--text-secondary);">Haz clic para cargar los temas</div>';
    
    card.appendChild(header);
    card.appendChild(progressBar);
    card.appendChild(body);
    
    return card;
}

async function toggleMateriaCard(card, materiaId) {
    const body = card.querySelector('.materia-body');
    const chevron = card.querySelector('.chevron-icon');
    const loading = card.querySelector('.materia-loading');
    
    // Si ya está activo, cerrar
    if (body.classList.contains('active')) {
        body.classList.remove('active');
        chevron.classList.remove('rotated');
        return;
    }
    
    // Cerrar todas las demás materias (comportamiento de acordeón)
    document.querySelectorAll('.materia-card').forEach(otherCard => {
        if (otherCard !== card) {
            const otherBody = otherCard.querySelector('.materia-body');
            const otherChevron = otherCard.querySelector('.chevron-icon');
            if (otherBody) otherBody.classList.remove('active');
            if (otherChevron) otherChevron.classList.remove('rotated');
        }
    });
    
    // Activar esta materia
    body.classList.add('active');
    chevron.classList.add('rotated');
    
    // Si ya se cargaron los temas, no volver a cargar
    if (card.dataset.temasLoaded === 'true') {
        return;
    }
    
    // Mostrar loading
    loading.style.display = 'inline-block';
    
    try {
        const response = await fetch(`/temas/api/temas/por-materia/${materiaId}/`);
        if (!response.ok) throw new Error('Error al cargar temas');
        
        const data = await response.json();
        mostrarTemasEnMateria(body, data.temas, materiaId);
        card.dataset.temasLoaded = 'true';
    } catch (error) {
        console.error('Error al cargar temas:', error);
        body.innerHTML = '<p class="text-muted text-center" style="padding: 2rem;">Error al cargar los temas</p>';
    } finally {
        loading.style.display = 'none';
    }
}

function mostrarTemasEnMateria(bodyElement, temas, materiaId) {
    if (!temas || temas.length === 0) {
        bodyElement.innerHTML = '<p class="text-muted text-center" style="padding: 2rem;">No hay temas disponibles</p>';
        return;
    }
    
    const temasContainer = document.createElement('div');
    temasContainer.className = 'temas-container';
    
    temas.forEach(tema => {
        const temaCard = crearTarjetaTema(tema);
        temasContainer.appendChild(temaCard);
    });
    
    bodyElement.innerHTML = '';
    bodyElement.appendChild(temasContainer);
}

function crearTarjetaTema(tema) {
    const card = document.createElement('div');
    card.className = 'tema-card';
    card.dataset.temaId = tema.id;
    card.dataset.temaNombre = tema.nombre.toLowerCase();
    
    // Debug: verificar si los exámenes están llegando
    if (tema.examenes && tema.examenes.length > 0) {
        console.log(`Tema "${tema.nombre}" tiene ${tema.examenes.length} exámenes:`, tema.examenes);
    }
    
    // Los contenidos ahora vienen directamente del API
    const contenidos = tema.contenidos || [];
    const totalContenidos = tema.total_contenidos || 0;
    const completados = tema.contenidos_completados || 0;
    const porcentaje = tema.porcentaje || 0;
    const temaCompletado = tema.completado || false;
    
    // Si el tema está completado, agregar clase especial
    if (temaCompletado) {
        card.classList.add('tema-completado');
    }
    
    const header = document.createElement('div');
    header.className = 'tema-header';
    header.onclick = () => toggleTemaCard(card);
    header.innerHTML = `
        <h4>
            ${temaCompletado ? '<i class="fas fa-check-circle" style="color: var(--success-color); margin-right: 0.5rem;" title="Tema Completado"></i>' : '<i class="fas fa-bookmark"></i>'}
            ${tema.nombre}
            ${tema.requiere_suscripcion ? '<i class="fas fa-crown" style="color: var(--warning-color); margin-left: 0.5rem;" title="Premium"></i>' : ''}
        </h4>
        <div class="tema-stats">
            <span class="tema-porcentaje" style="color: ${temaCompletado ? 'var(--success-color)' : 'inherit'}">${porcentaje}%</span>
            <span class="tema-detalle">${completados}/${totalContenidos} completados</span>
            <i class="fas fa-chevron-down chevron-icon"></i>
        </div>
    `;
    
    const body = document.createElement('div');
    body.className = 'tema-body';
    
    // Verificar si puede ver el tema
    if (tema.puede_ver_tema === false) {
        body.innerHTML = `
            <div class="tema-bloqueado" style="padding: 2rem; text-align: center;">
                <i class="fas fa-lock" style="font-size: 2rem; color: var(--warning-color);"></i>
                <p class="text-muted mt-2">${tema.mensaje_bloqueo || 'Este tema requiere suscripción premium'}</p>
                <a href="/suscripciones/" class="btn btn-warning mt-2">
                    <i class="fas fa-crown"></i> Obtener Premium
                </a>
            </div>
        `;
    } else {
        // Barra de progreso del tema
        body.innerHTML = `
            <div class="tema-progreso">
                <div class="tema-progreso-fill" style="width: ${porcentaje}%"></div>
            </div>
            <div class="contenidos-list">
                ${contenidos && contenidos.length > 0 
                    ? contenidos.map(contenido => crearItemContenido(contenido)).join('')
                    : '<p class="text-muted text-center" style="padding: 1rem;">No hay contenidos disponibles en este tema</p>'
                }
            </div>
        `;
        
        // Agregar información de los exámenes si existen
        if (tema.examenes && tema.examenes.length > 0) {
            console.log(`Agregando ${tema.examenes.length} exámenes al tema "${tema.nombre}"`);
            const examenesDiv = document.createElement('div');
            examenesDiv.className = 'tema-examenes';
            examenesDiv.innerHTML = crearListaExamenes(tema.examenes);
            body.appendChild(examenesDiv);
            console.log('Exámenes agregados al DOM');
        } else {
            console.log(`Tema "${tema.nombre}" no tiene exámenes o el array está vacío`);
        }
    }
    
    card.appendChild(header);
    card.appendChild(body);
    
    return card;
}

function toggleTemaCard(card) {
    const body = card.querySelector('.tema-body');
    const chevron = card.querySelector('.chevron-icon');
    
    body.classList.toggle('active');
    chevron.classList.toggle('rotated');
}

function crearListaExamenes(examenes) {
    if (!examenes || examenes.length === 0) {
        return '';
    }
    
    const examenesHTML = examenes.map((examen, index) => {
        return crearInfoExamen(examen, index + 1, examenes.length);
    }).join('');
    
    return `
        <div class="examenes-section">
            <h5 class="examenes-titulo"><i class="fas fa-graduation-cap"></i> Exámenes del Tema</h5>
            ${examenesHTML}
        </div>
    `;
}

function crearInfoExamen(examen, numero, totalExamenes) {
    const disponible = examen.disponible;
    const aprobado = examen.aprobado;
    const mejorNota = examen.mejor_nota;
    const totalIntentos = examen.total_intentos || 0;
    
    let estadoHTML = '';
    let botonHTML = '';
    
    if (aprobado) {
        estadoHTML = `
            <div class="examen-aprobado">
                <i class="fas fa-check-circle"></i>
                <span>Examen Aprobado</span>
                <span class="nota">Nota: ${mejorNota}/100</span>
            </div>
        `;
        // No mostrar botón para exámenes aprobados
        botonHTML = '';
    } else if (disponible) {
        estadoHTML = `
            <div class="examen-disponible">
                <i class="fas fa-clipboard-check"></i>
                <span>Examen Disponible</span>
                ${mejorNota ? `<span class="nota">Mejor nota: ${mejorNota}/100</span>` : ''}
                ${totalIntentos > 0 ? `<span class="intentos">${totalIntentos} intento(s)</span>` : ''}
            </div>
        `;
        botonHTML = `
            <a href="/examenes/resolver/${examen.id}/" class="btn btn-primary btn-sm">
                <i class="fas fa-pen"></i> ${totalIntentos > 0 ? 'Reintentar' : 'Realizar'} Examen
            </a>
        `;
    } else {
        // Mensaje diferente para el primer examen vs los siguientes
        const mensajeBloqueo = numero === 1 
            ? 'Completa todos los contenidos del tema' 
            : 'Aprueba el examen anterior para desbloquear';
        
        estadoHTML = `
            <div class="examen-bloqueado">
                <i class="fas fa-lock"></i>
                <span>Examen Bloqueado</span>
                <small>${mensajeBloqueo}</small>
            </div>
        `;
    }
    
    return `
        <div class="examen-info">
            <h5><i class="fas fa-graduation-cap"></i> ${examen.titulo}</h5>
            ${estadoHTML}
            ${botonHTML}
        </div>
    `;
}

// ============================================
// MOSTRAR ESTADÍSTICAS
// ============================================

function mostrarEstadisticas(stats) {
    document.getElementById('totalContenidos').textContent = stats.total_contenidos;
    document.getElementById('completados').textContent = stats.completados;
    document.getElementById('pendientes').textContent = stats.pendientes;
    document.getElementById('porcentajeGeneral').textContent = stats.porcentaje_general + '%';
    
    // Actualizar barra de progreso
    document.getElementById('progresoTexto').textContent = stats.porcentaje_general + '%';
    document.getElementById('progresoFill').style.width = stats.porcentaje_general + '%';
}

// ============================================
// MOSTRAR TEMAS
// ============================================

function crearItemContenido(contenido) {
    const estado = contenido.completado ? 'completado' : (contenido.esta_disponible ? 'pendiente' : 'bloqueado');
    const iconoEstado = contenido.completado ? 'fa-check-circle' : (contenido.esta_disponible ? 'fa-clock' : 'fa-lock');
    const textoEstado = contenido.completado ? 'Completado' : (contenido.esta_disponible ? 'Pendiente' : 'Bloqueado');
    
    let descripcionExtra = '';
    if (!contenido.esta_disponible && contenido.tiene_prerequisito) {
        descripcionExtra = ` - Requiere: ${contenido.prerequisito_titulo}`;
    }
    
    return `
        <div class="contenido-item ${estado}" data-contenido-id="${contenido.id}" data-estado="${estado}">
            <div class="contenido-info">
                <div class="contenido-orden">${contenido.orden}</div>
                <div class="contenido-detalles">
                    <h4>${contenido.titulo}</h4>
                    <p>${contenido.descripcion.substring(0, 100)}...${descripcionExtra}</p>
                </div>
            </div>
            <div class="contenido-status">
                <span class="status-badge ${estado}">
                    <i class="fas ${iconoEstado}"></i>
                    ${textoEstado}
                </span>
                <button class="btn-ver" onclick="verContenido(${contenido.id})" ${!contenido.esta_disponible ? 'disabled' : ''}>
                    <i class="fas fa-eye"></i>
                    Ver
                </button>
            </div>
        </div>
    `;
}

// ============================================
// VER CONTENIDO
// ============================================

async function verContenido(contenidoId) {
    try {
        const response = await fetch(`/contenido/api/contenidos/${contenidoId}/`);
        
        if (!response.ok) {
            throw new Error('Error al cargar contenido');
        }
        
        const contenido = await response.json();
        contenidoActual = contenido;
        
        mostrarModalContenido(contenido);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar el contenido');
    }
}

function mostrarModalContenido(contenido) {
    document.getElementById('detalleNombre').textContent = contenido.titulo;
    document.getElementById('detalleDescripcion').textContent = contenido.descripcion;
    document.getElementById('detalleContenido').textContent = contenido.contenido_tema;
    
    // Meta información
    const metaHtml = `
        <span class="badge badge-materia">
            <i class="fas fa-book"></i>
            ${contenido.materia}
        </span>
        <span class="badge badge-nivel">
            <i class="fas fa-graduation-cap"></i>
            ${contenido.nivel_curso}
        </span>
    `;
    document.getElementById('detalleMeta').innerHTML = metaHtml;
    
    // Videos
    const seccionVideos = document.getElementById('seccionVideos');
    const detalleVideos = document.getElementById('detalleVideos');
    
    if (contenido.videos && contenido.videos.length > 0) {
        seccionVideos.style.display = 'block';
        detalleVideos.innerHTML = contenido.videos.map(video => {
            const videoId = extraerVideoIdYoutube(video.enlace);
            if (videoId) {
                return `
                    <div class="video-item-embed">
                        <div class="video-container">
                            <iframe 
                                width="100%" 
                                height="315" 
                                src="${construirYoutubeEmbedSrc(videoId)}" 
                                title="Video de YouTube" 
                                frameborder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                allowfullscreen
                                loading="lazy"
                                referrerpolicy="strict-origin-when-cross-origin">
                            </iframe>
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div class="video-item">
                        <a href="${video.enlace}" target="_blank">
                            <i class="fas fa-play-circle"></i>
                            Ver en YouTube
                        </a>
                    </div>
                `;
            }
        }).join('');
    } else {
        seccionVideos.style.display = 'none';
    }
    
    // Verificar si está completado
    const contenidoData = encontrarContenidoEnProgreso(contenido.id);
    const estaCompletado = contenidoData ? contenidoData.completado : false;
    
    actualizarBotonCompletar(estaCompletado);
    
    // Mostrar modal
    document.getElementById('modalDetalleContenido').classList.add('active');
}

function construirYoutubeEmbedSrc(videoId) {
    const safeVideoId = (typeof videoId === 'string') ? videoId.trim() : '';
    if (!/^[a-zA-Z0-9_-]{11}$/.test(safeVideoId)) {
        return 'about:blank';
    }

    const params = new URLSearchParams({
        rel: '0',
        modestbranding: '1',
        showinfo: '0',
        iv_load_policy: '3',
        fs: '1',
        cc_load_policy: '0',
        enablejsapi: '1',
        controls: '1',
        autoplay: '0',
        mute: '0',
        loop: '0',
        playlist: safeVideoId,
        disablekb: '1',
        playsinline: '1',
        origin: window.location.origin,
    });

    return `https://www.youtube.com/embed/${safeVideoId}?${params.toString()}`;
}

function extraerVideoIdYoutube(url) {
    if (!url) return null;
    
    try {
        // Formato: https://www.youtube.com/watch?v=VIDEO_ID
        if (url.includes('youtube.com/watch?v=')) {
            const urlObj = new URL(url);
            const v = urlObj.searchParams.get('v');
            return (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) ? v : null;
        }

        // Formato: https://www.youtube.com/shorts/VIDEO_ID
        if (url.includes('youtube.com/shorts/')) {
            const match = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
            if (match && match[1]) return match[1];
        }
        
        // Formato: https://youtu.be/VIDEO_ID
        if (url.includes('youtu.be/')) {
            const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
            if (match && match[1]) return match[1];
        }
        
        // Formato: https://www.youtube.com/embed/VIDEO_ID
        if (url.includes('youtube.com/embed/')) {
            const match = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
            if (match && match[1]) return match[1];
        }
    } catch (e) {
        console.error('Error extrayendo video ID:', e);
    }
    
    return null;
}

function encontrarContenidoEnProgreso(contenidoId) {
    if (!datosProgreso || !datosProgreso.materias) return null;
    
    for (const materia of datosProgreso.materias) {
        for (const tema of materia.temas) {
            const contenido = tema.contenidos.find(c => c.id === contenidoId);
            if (contenido) return contenido;
        }
    }
    return null;
}

function actualizarBotonCompletar(estaCompletado) {
    const boton = document.getElementById('btnMarcarCompletado');
    const texto = document.getElementById('textoBotonCompletar');
    
    if (estaCompletado) {
        boton.className = 'btn btn-secondary';
        texto.innerHTML = '<i class="fas fa-times"></i> Desmarcar Completado';
    } else {
        boton.className = 'btn btn-primary';
        texto.innerHTML = '<i class="fas fa-check"></i> Marcar como Completado';
    }
}

function cerrarModal() {
    document.getElementById('modalDetalleContenido').classList.remove('active');
    contenidoActual = null;
}

// ============================================
// MARCAR/DESMARCAR COMPLETADO
// ============================================

async function toggleCompletado() {
    if (!contenidoActual) return;
    
    const contenidoData = encontrarContenidoEnProgreso(contenidoActual.id);
    const estaCompletado = contenidoData ? contenidoData.completado : false;
    
    const url = estaCompletado 
        ? `/contenido/api/contenidos/${contenidoActual.id}/descompletar/`
        : `/contenido/api/contenidos/${contenidoActual.id}/completar/`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Recargar progreso
            await cargarProgreso();
            
            // Actualizar botón
            actualizarBotonCompletar(!estaCompletado);
            
            // Mostrar mensaje
            mostrarNotificacion(data.message, 'success');
            
            // Si hay siguiente contenido disponible
            if (data.siguiente_disponible) {
                setTimeout(() => {
                    if (confirm(`¡Genial! ¿Quieres continuar con "${data.siguiente_disponible.titulo}"?`)) {
                        cerrarModal();
                        verContenido(data.siguiente_disponible.id);
                    }
                }, 1000);
            }
        } else {
            mostrarNotificacion(data.error || 'Error al actualizar', 'error');
        }
        
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al actualizar el progreso', 'error');
    }
}

// ============================================
// FILTROS
// ============================================

function configurarFiltros() {
    const buscarMateria = document.getElementById('buscarMateria');
    const filtroEstado = document.getElementById('filtroEstado');
    
    buscarMateria.addEventListener('input', aplicarFiltros);
    filtroEstado.addEventListener('change', aplicarFiltros);
}

function aplicarFiltros() {
    const textoBusqueda = document.getElementById('buscarMateria').value.toLowerCase();
    const estadoFiltro = document.getElementById('filtroEstado').value;
    
    const materias = document.querySelectorAll('.materia-card');
    
    materias.forEach(materia => {
        const nombreMateria = materia.dataset.materiaNombre || '';
        let mostrarMateria = false;
        
        // Buscar en temas dentro de la materia
        const temas = materia.querySelectorAll('.tema-card');
        
        temas.forEach(tema => {
            const nombreTema = tema.dataset.temaNombre || '';
            const cumpleBusqueda = nombreMateria.includes(textoBusqueda) || nombreTema.includes(textoBusqueda);
            
            if (cumpleBusqueda) {
                tema.style.display = 'block';
                mostrarMateria = true;
                
                // Filtrar contenidos dentro del tema
                if (estadoFiltro) {
                    const contenidos = tema.querySelectorAll('.contenido-item');
                    contenidos.forEach(contenido => {
                        const estado = contenido.dataset.estado;
                        contenido.style.display = estado === estadoFiltro ? 'flex' : 'none';
                    });
                } else {
                    const contenidos = tema.querySelectorAll('.contenido-item');
                    contenidos.forEach(contenido => {
                        contenido.style.display = 'flex';
                    });
                }
            } else {
                tema.style.display = 'none';
            }
        });
        
        // Mostrar materia si algún tema coincide con la búsqueda
        materia.style.display = mostrarMateria ? 'block' : 'none';
    });
}

// ============================================
// UTILIDADES
// ============================================

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function mostrarNotificacion(mensaje, tipo) {
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion notificacion-${tipo}`;
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${tipo === 'success' ? 'var(--success-color)' : 'var(--danger-color)'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    notificacion.innerHTML = `
        <i class="fas fa-${tipo === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${mensaje}
    `;
    
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notificacion.remove(), 300);
    }, 3000);
}

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
