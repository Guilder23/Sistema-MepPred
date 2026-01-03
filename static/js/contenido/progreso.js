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
        const response = await fetch('/contenido/api/progreso/');
        
        if (!response.ok) {
            throw new Error('Error al cargar progreso');
        }
        
        datosProgreso = await response.json();
        
        mostrarEstadisticas(datosProgreso.estadisticas);
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
    card.dataset.materia = materia.materia.toLowerCase();
    
    const header = document.createElement('div');
    header.className = 'materia-header';
    header.onclick = () => toggleMateria(card);
    header.innerHTML = `
        <h3>
            <i class="fas fa-book"></i>
            ${materia.materia}
        </h3>
        <div class="materia-stats">
            <span class="materia-porcentaje">${materia.porcentaje}%</span>
            <span class="materia-detalle">${materia.completados}/${materia.total} completados</span>
            <i class="fas fa-chevron-down chevron-icon"></i>
        </div>
    `;
    
    const body = document.createElement('div');
    body.className = 'materia-body';
    body.innerHTML = `
        <div class="materia-progreso">
            <div class="materia-progreso-fill" style="width: ${materia.porcentaje}%"></div>
        </div>
        <div class="contenidos-list" id="contenidos-${materia.materia.replace(/\s+/g, '-')}">
            ${materia.contenidos.map(contenido => crearItemContenido(contenido)).join('')}
        </div>
    `;
    
    card.appendChild(header);
    card.appendChild(body);
    
    return card;
}

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

function toggleMateria(card) {
    const body = card.querySelector('.materia-body');
    const chevron = card.querySelector('.chevron-icon');
    
    body.classList.toggle('active');
    chevron.classList.toggle('rotated');
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
    
    for (const materia of datosProgreso.materias) {
        const contenido = materia.contenidos.find(c => c.id === contenidoId);
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
        const nombreMateria = materia.dataset.materia;
        const cumpleBusqueda = nombreMateria.includes(textoBusqueda);
        
        if (cumpleBusqueda) {
            materia.style.display = 'block';
            
            // Filtrar contenidos dentro de la materia
            if (estadoFiltro) {
                const contenidos = materia.querySelectorAll('.contenido-item');
                contenidos.forEach(contenido => {
                    const estado = contenido.dataset.estado;
                    contenido.style.display = estado === estadoFiltro ? 'flex' : 'none';
                });
            } else {
                const contenidos = materia.querySelectorAll('.contenido-item');
                contenidos.forEach(contenido => {
                    contenido.style.display = 'flex';
                });
            }
        } else {
            materia.style.display = 'none';
        }
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
