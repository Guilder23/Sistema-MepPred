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
            
            // Extraer materias y niveles únicos
            data.forEach(contenido => {
                if (contenido.materia) {
                    materiasUnicas.add(contenido.materia);
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
    card.onclick = () => verContenido(contenido.id);
    
    const fecha = contenido.fecha_creacion ? 
        new Date(contenido.fecha_creacion).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }) : '-';
    
    card.innerHTML = `
        <div class="contenido-card-header">
            <h3 class="contenido-card-title">${contenido.titulo}</h3>
        </div>
        <div class="contenido-card-body">
            <p class="contenido-card-description">${contenido.descripcion || 'Sin descripción'}</p>
            <div class="contenido-card-meta">
                <span class="badge badge-materia">${contenido.materia}</span>
                <span class="badge badge-nivel">${contenido.nivel_curso}</span>
            </div>
            <div class="contenido-card-footer">
                <span class="contenido-fecha">
                    <i class="fas fa-calendar"></i> ${fecha}
                </span>
                <button class="btn-ver-contenido" onclick="event.stopPropagation(); verContenido(${contenido.id})">
                    Ver más <i class="fas fa-arrow-right"></i>
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
            const videoItem = document.createElement('div');
            videoItem.className = 'video-item';
            videoItem.innerHTML = `
                <a href="${video.enlace}" target="_blank" rel="noopener noreferrer">
                    <i class="fas fa-play-circle"></i>
                    Video ${index + 1}
                    <i class="fas fa-external-link-alt" style="margin-left: auto; font-size: 0.85rem;"></i>
                </a>
            `;
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
