// biblioteca.js - Lógica para mostrar contenidos publicados a usuarios

console.log('biblioteca.js cargado');

// Variables globales
let todosLosContenidos = [];
let materiasUnicas = new Set();
let nivelesUnicos = new Set();

// Cargar contenidos al iniciar
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, iniciando biblioteca...');
    
    // Event listeners para búsqueda
    const buscarEl = document.getElementById('buscar');
    if (buscarEl) {
        buscarEl.addEventListener('keyup', filtrarContenidos);
    }
    
    const filtroMateriaEl = document.getElementById('filtroMateria');
    const filtroNivelEl = document.getElementById('filtroNivel');
    
    if (filtroMateriaEl) {
        filtroMateriaEl.addEventListener('change', filtrarContenidos);
    }
    
    if (filtroNivelEl) {
        filtroNivelEl.addEventListener('change', filtrarContenidos);
    }
    
    // Cargar contenidos
    cargarContenidos();
});

// Función para cargar contenidos desde el servidor
function cargarContenidos() {
    console.log('Cargando contenidos publicados...');
    
    mostrarCargando(true);
    
    fetch('/contenido/api/publicados/')
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error('Error al cargar contenidos');
            }
            return response.json();
        })
        .then(data => {
            console.log('Contenidos recibidos:', data);
            todosLosContenidos = data;
            
            // Extraer temas y niveles únicos
            data.forEach(contenido => {
                if (contenido.tema) {
                    materiasUnicas.add(contenido.tema);
                }
                if (contenido.nivel_curso) {
                    nivelesUnicos.add(contenido.nivel_curso);
                }
            });
            
            // Actualizar filtros
            actualizarFiltros();
            
            // Mostrar contenidos
            mostrarContenidos(data);
            mostrarCargando(false);
        })
        .catch(error => {
            console.error('Error al cargar contenidos:', error);
            mostrarCargando(false);
            mostrarMensaje('Error al cargar los contenidos. Por favor, intenta de nuevo.', 'danger');
        });
}

// Actualizar opciones de filtros
function actualizarFiltros() {
    const filtroMateriaEl = document.getElementById('filtroMateria');
    const filtroNivelEl = document.getElementById('filtroNivel');
    
    // Actualizar filtro de materias
    if (filtroMateriaEl) {
        filtroMateriaEl.innerHTML = '<option value="">Todas las materias</option>';
        Array.from(materiasUnicas).sort().forEach(materia => {
            const option = document.createElement('option');
            option.value = materia;
            option.textContent = materia;
            filtroMateriaEl.appendChild(option);
        });
    }
    
    // Actualizar filtro de niveles
    if (filtroNivelEl) {
        filtroNivelEl.innerHTML = '<option value="">Todos los niveles</option>';
        Array.from(nivelesUnicos).sort().forEach(nivel => {
            const option = document.createElement('option');
            option.value = nivel;
            option.textContent = nivel;
            filtroNivelEl.appendChild(option);
        });
    }
}

// Filtrar contenidos según criterios
function filtrarContenidos() {
    const busqueda = document.getElementById('buscar').value.toLowerCase();
    const materiaFiltro = document.getElementById('filtroMateria').value;
    const nivelFiltro = document.getElementById('filtroNivel').value;
    
    const contenidosFiltrados = todosLosContenidos.filter(contenido => {
        const cumpleBusqueda = !busqueda || 
            contenido.titulo.toLowerCase().includes(busqueda) ||
            contenido.materia.toLowerCase().includes(busqueda) ||
            (contenido.descripcion && contenido.descripcion.toLowerCase().includes(busqueda));
        
        const cumpleMateria = !materiaFiltro || contenido.materia === materiaFiltro;
        const cumpleNivel = !nivelFiltro || contenido.nivel_curso === nivelFiltro;
        
        return cumpleBusqueda && cumpleMateria && cumpleNivel;
    });
    
    mostrarContenidos(contenidosFiltrados);
}

// Mostrar contenidos en el grid
function mostrarContenidos(contenidos) {
    const grid = document.getElementById('contenidosGrid');
    const noResults = document.getElementById('noResultsMessage');
    
    if (!grid) {
        console.error('Elemento contenidosGrid no encontrado');
        return;
    }
    
    grid.innerHTML = '';
    
    if (!contenidos || contenidos.length === 0) {
        grid.style.display = 'none';
        if (noResults) noResults.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    if (noResults) noResults.style.display = 'none';
    
    contenidos.forEach(contenido => {
        const card = crearCardContenido(contenido);
        grid.appendChild(card);
    });
}

// Crear tarjeta de contenido
function crearCardContenido(contenido) {
    const card = document.createElement('div');
    card.className = 'contenido-card';
    
    // Agregar clases según estado
    if (!contenido.esta_disponible) {
        card.classList.add('bloqueado');
    } else if (contenido.completado) {
        card.classList.add('completado');
    }
    
    // Solo permitir click si está disponible
    if (contenido.esta_disponible) {
        card.onclick = () => verContenido(contenido.id);
        card.style.cursor = 'pointer';
    } else {
        card.style.cursor = 'not-allowed';
        card.style.opacity = '0.6';
    }
    
    const fecha = contenido.fecha_creacion ? 
        new Date(contenido.fecha_creacion).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }) : '-';
    
    // Badges adicionales para estado
    let badgesEstado = '';
    if (contenido.completado) {
        badgesEstado = '<span class="badge badge-activo"><i class="fas fa-check-circle"></i> Completado</span>';
    } else if (!contenido.esta_disponible) {
        badgesEstado = '<span class="badge badge-inactivo"><i class="fas fa-lock"></i> Bloqueado</span>';
    }
    
    card.innerHTML = `
        <div class="contenido-card-header">
            <h3 class="contenido-card-title">${contenido.titulo}</h3>
        </div>
        <div class="contenido-card-body">
            <p class="contenido-card-description">${contenido.descripcion || 'Sin descripción'}</p>
            <div class="contenido-card-meta">
                <span class="badge badge-materia">${contenido.materia}</span>
                <span class="badge badge-nivel">${contenido.nivel_curso}</span>
                ${badgesEstado}
            </div>
            <div class="contenido-card-footer">
                <span class="contenido-fecha">
                    <i class="fas fa-calendar"></i> ${fecha}
                </span>
                <button class="btn-ver-contenido" 
                    onclick="event.stopPropagation(); ${contenido.esta_disponible ? `verContenido(${contenido.id})` : 'return false;'}" 
                    ${!contenido.esta_disponible ? 'disabled' : ''}>
                    ${contenido.esta_disponible ? 'Ver más' : 'Bloqueado'} 
                    <i class="fas fa-${contenido.esta_disponible ? 'arrow-right' : 'lock'}"></i>
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// Ver detalle de contenido
function verContenido(contenidoId) {
    console.log('Ver contenido:', contenidoId);
    
    fetch(`/contenido/api/contenidos/${contenidoId}/`)
        .then(response => response.json())
        .then(contenido => {
            console.log('Detalle de contenido:', contenido);
            mostrarDetalleContenido(contenido);
        })
        .catch(error => {
            console.error('Error al obtener detalle:', error);
            mostrarMensaje('Error al cargar el detalle del contenido', 'danger');
        });
}

// Mostrar detalle en modal
function mostrarDetalleContenido(contenido) {
    document.getElementById('detalleTitulo').textContent = contenido.titulo;
    document.getElementById('detalleMateria').textContent = contenido.materia;
    document.getElementById('detalleNivel').textContent = contenido.nivel_curso;
    document.getElementById('detalleDescripcion').textContent = contenido.descripcion || 'Sin descripción';
    document.getElementById('detalleContenido').textContent = contenido.contenido_tema || 'Sin contenido';
    
    // Mostrar videos si existen
    const contenedorVideos = document.getElementById('contenedorVideos');
    const videosEl = document.getElementById('detalleVideos');
    
    if (contenido.videos && contenido.videos.length > 0) {
        contenedorVideos.style.display = 'block';
        videosEl.innerHTML = '';
        
        contenido.videos.forEach((video, index) => {
            console.log('Procesando video', index + 1, ':', video);
            console.log('Enlace del video:', video.enlace);
            const videoItem = document.createElement('div');
            videoItem.className = 'video-item';
            const embedHtml = getVideoEmbed(video.enlace);
            console.log('HTML generado:', embedHtml);
            videoItem.innerHTML = `
                <div class="video-title">Video ${index + 1}</div>
                <div class="video-embed">
                    <div class="video-loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Cargando video...</p>
                    </div>
                    ${embedHtml}
                </div>
            `;
            
            // Agregar event listener para manejar errores de carga del iframe
            const iframe = videoItem.querySelector('iframe');
            const fallback = videoItem.querySelector('.video-fallback');
            const loading = videoItem.querySelector('.video-loading');
            
            if (iframe && fallback && loading) {
                let loadTimeout;
                
                // Timeout para detectar videos que no cargan
                loadTimeout = setTimeout(() => {
                    console.log('Timeout: video no cargó en 10 segundos, mostrando fallback');
                    loading.style.display = 'none';
                    iframe.style.display = 'none';
                    fallback.classList.add('show');
                    fallback.innerHTML = `
                        <p><strong>Video no disponible</strong></p>
                        <p>Este video puede tener restricciones de privacidad o no estar disponible para embed.</p>
                        <p><a href="${video.enlace}" target="_blank" rel="noopener noreferrer">Ver en ${video.enlace.includes('youtube') ? 'YouTube' : 'Vimeo'}</a></p>
                    `;
                }, 10000);
                
                iframe.addEventListener('error', function() {
                    console.log('Error cargando video, mostrando fallback');
                    clearTimeout(loadTimeout);
                    loading.style.display = 'none';
                    iframe.style.display = 'none';
                    fallback.classList.add('show');
                    fallback.innerHTML = `
                        <p><strong>Error al cargar el video</strong></p>
                        <p>Puede haber restricciones de embed o problemas de conectividad.</p>
                        <p><a href="${video.enlace}" target="_blank" rel="noopener noreferrer">Ver directamente</a></p>
                    `;
                });
                
                iframe.addEventListener('load', function() {
                    console.log('Video cargado correctamente');
                    clearTimeout(loadTimeout);
                    loading.style.display = 'none';
                    iframe.style.display = 'block';
                });
            }
            
            videosEl.appendChild(videoItem);
        });
    } else {
        contenedorVideos.style.display = 'none';
    }
    
    // Mostrar modal
    const modal = document.getElementById('modalVerContenido');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Cerrar modal
function cerrarModal() {
    const modal = document.getElementById('modalVerContenido');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Cerrar modal al hacer clic en el overlay
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('modalVerContenido');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                cerrarModal();
            }
        });
    }
});

// Mostrar/ocultar indicador de carga
function mostrarCargando(mostrar) {
    const loadingMsg = document.getElementById('loadingMessage');
    const grid = document.getElementById('contenidosGrid');
    const noResults = document.getElementById('noResultsMessage');
    
    if (mostrar) {
        if (loadingMsg) loadingMsg.style.display = 'block';
        if (grid) grid.style.display = 'none';
        if (noResults) noResults.style.display = 'none';
    } else {
        if (loadingMsg) loadingMsg.style.display = 'none';
    }
}

// Mostrar mensaje de alerta
function mostrarMensaje(mensaje, tipo) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo}`;
    alertDiv.style.cssText = 'padding: 1rem; border-radius: 8px; margin-bottom: 1rem; position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 400px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
    
    const colores = {
        'success': { bg: '#d4edda', border: '#c3e6cb', color: '#155724' },
        'danger': { bg: '#f8d7da', border: '#f5c6cb', color: '#721c24' },
        'warning': { bg: '#fff3cd', border: '#ffeaa7', color: '#856404' },
        'info': { bg: '#d1ecf1', border: '#bee5eb', color: '#0c5460' }
    };
    
    const color = colores[tipo] || colores['info'];
    alertDiv.style.backgroundColor = color.bg;
    alertDiv.style.borderLeft = `4px solid ${color.border}`;
    alertDiv.style.color = color.color;
    
    alertDiv.textContent = mensaje;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 4000);
}

// Función para convertir enlaces de video a embeds
function getVideoEmbed(url) {
    console.log('Procesando URL:', url);
    if (!url) {
        console.log('URL vacía o null');
        return '<p>Enlace no válido</p>';
    }
    
    try {
        // YouTube - múltiples formatos
        let videoId = null;
        
        // Intentar extraer ID de diferentes formatos de YouTube
        if (url.includes('youtube.com/watch?v=')) {
            console.log('Detectado formato youtube.com/watch');
            const urlObj = new URL(url);
            videoId = urlObj.searchParams.get('v');
            console.log('ID extraído:', videoId);
        } else if (url.includes('youtu.be/')) {
            console.log('Detectado formato youtu.be');
            const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
            if (match) {
                videoId = match[1];
                console.log('ID extraído:', videoId);
            } else {
                console.log('No se pudo extraer ID de youtu.be');
            }
        } else if (url.includes('youtube.com/embed/')) {
            console.log('Detectado formato youtube.com/embed');
            const match = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
            if (match) {
                videoId = match[1];
                console.log('ID extraído:', videoId);
            } else {
                console.log('No se pudo extraer ID de embed');
            }
        } else {
            console.log('Formato de URL no reconocido');
        }
        
        if (videoId && videoId.length === 11) {
            console.log('Generando embed para YouTube con ID:', videoId);
            return `<div class="video-container">
                        <iframe width="560" height="315" 
                                src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&fs=1&cc_load_policy=0&enablejsapi=1&controls=1&autoplay=0&mute=0&loop=0&playlist=${videoId}&disablekb=1&playsinline=1&origin=${window.location.origin}" 
                                frameborder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                allowfullscreen
                                loading="lazy"
                                referrerpolicy="strict-origin-when-cross-origin">
                        </iframe>
                        <div class="video-fallback">
                            <p>Si el video no carga, <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener noreferrer">haz clic aquí para verlo en YouTube</a></p>
                        </div>
                    </div>`;
        }
        
        // Vimeo
        if (url.includes('vimeo.com/')) {
            console.log('Detectado Vimeo');
            const match = url.match(/vimeo\.com\/(\d+)/);
            if (match) {
                const videoId = match[1];
                console.log('ID de Vimeo extraído:', videoId);
                return `<div class="video-container">
                            <iframe width="560" height="315" 
                                    src="https://player.vimeo.com/video/${videoId}?color=ff0179&title=0&byline=0&portrait=0" 
                                    frameborder="0" 
                                    allow="autoplay; fullscreen; picture-in-picture" 
                                    allowfullscreen
                                    loading="lazy">
                            </iframe>
                            <div class="video-fallback">
                                <p>Si el video no carga, <a href="${url}" target="_blank" rel="noopener noreferrer">haz clic aquí para verlo en Vimeo</a></p>
                            </div>
                        </div>`;
            }
        }
        
        console.log('URL no soportada, mostrando como enlace');
        // Si no es un enlace soportado, mostrar como enlace
        return `<div class="video-fallback" style="display: block;">
                    <p><a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a></p>
                </div>`;
    } catch (error) {
        console.error('Error procesando URL:', error);
        return `<div class="video-fallback" style="display: block;">
                    <p><a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a></p>
                </div>`;
    }
}
