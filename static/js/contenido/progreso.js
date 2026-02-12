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
        
        // Cargar materias
        const responseMaterias = await fetch('/temas/api/materias/');
        if (!responseMaterias.ok) {
            throw new Error('Error al cargar materias');
        }
        
        const dataMaterias = await responseMaterias.json();
        mostrarMaterias(dataMaterias.materias);
        
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
    
    const header = document.createElement('div');
    header.className = 'materia-header';
    header.onclick = () => toggleMateriaCard(card, materia.id);
    header.innerHTML = `
        <h3>
            <i class="fas fa-book"></i>
            ${materia.nombre}
        </h3>
        <div class="materia-stats">
            <span class="materia-loading" style="display: none;">
                <i class="fas fa-spinner fa-spin"></i>
            </span>
            <i class="fas fa-chevron-down chevron-icon"></i>
        </div>
    `;
    
    const body = document.createElement('div');
    body.className = 'materia-body';
    body.innerHTML = '<div class="temas-loading" style="padding: 2rem; text-align: center; color: var(--text-secondary);">Haz clic para cargar los temas</div>';
    
    card.appendChild(header);
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
    
    // Activar
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
    
    // Buscar contenidos de este tema en datosProgreso
    const temaProgreso = datosProgreso?.temas?.find(t => t.tema === tema.nombre) || { contenidos: [], completados: 0, total: 0, porcentaje: 0 };
    
    const header = document.createElement('div');
    header.className = 'tema-header';
    header.onclick = () => toggleTemaCard(card);
    header.innerHTML = `
        <h4>
            <i class="fas fa-bookmark"></i>
            ${tema.nombre}
        </h4>
        <div class="tema-stats">
            <span class="tema-porcentaje">${temaProgreso.porcentaje}%</span>
            <span class="tema-detalle">${temaProgreso.completados}/${temaProgreso.total} completados</span>
            <i class="fas fa-chevron-down chevron-icon"></i>
        </div>
    `;
    
    const body = document.createElement('div');
    body.className = 'tema-body';
    
    // Barra de progreso del tema
    body.innerHTML = `
        <div class="tema-progreso">
            <div class="tema-progreso-fill" style="width: ${temaProgreso.porcentaje}%"></div>
        </div>
        <div class="contenidos-list">
            ${temaProgreso.contenidos && temaProgreso.contenidos.length > 0 
                ? temaProgreso.contenidos.map(contenido => crearItemContenido(contenido)).join('')
                : '<p class="text-muted text-center" style="padding: 1rem;">No hay contenidos disponibles en este tema</p>'
            }
        </div>
    `;
    
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
        detalleVideos.innerHTML = contenido.videos.map(video => `
            <div class="video-item">
                <a href="${video.enlace}" target="_blank">
                    <i class="fas fa-play-circle"></i>
                    ${video.enlace}
                </a>
            </div>
        `).join('');
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

function encontrarContenidoEnProgreso(contenidoId) {
    if (!datosProgreso) return null;
    
    for (const tema of datosProgreso.temas) {
        const contenido = tema.contenidos.find(c => c.id === contenidoId);
        if (contenido) return contenido;
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
