// Script principal para gestión de materias

let materiasData = [];
let searchTimeout;

// Inicializar cuando carga la página
document.addEventListener('DOMContentLoaded', function() {
    cargarMaterias();
    
    // Event listeners para búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(filtrarMaterias, 300);
        });
    }

    // Event listener para botón nueva materia
    const btnNuevaMateria = document.getElementById('btnNuevaMateria');
    if (btnNuevaMateria) {
        btnNuevaMateria.addEventListener('click', abrirModalCrear);
    }

    // Event listener para filtro de orden
    const filtroOrden = document.getElementById('filtroOrden');
    if (filtroOrden) {
        filtroOrden.addEventListener('change', filtrarMaterias);
    }
});

// Cargar materias del servidor
function cargarMaterias() {
    fetch('/materias/api/materias/')
        .then(response => {
            if (!response.ok) throw new Error('Error al cargar materias');
            return response.json();
        })
        .then(data => {
            if (data.success) {
                materiasData = data.materias || [];
                mostrarMaterias(materiasData);
            } else {
                mostrarMensaje('Error', data.error || 'Error desconocido', 'error');
            }
        })
        .catch(error => {
            mostrarMensaje('Error', 'No se pudieron cargar las materias', 'error');
        });
}

// Mostrar materias en la tabla
function mostrarMaterias(materias) {
    const tableBody = document.getElementById('tableMaterias');
    
    if (!tableBody) return;

    if (materias.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No hay materias registradas</td></tr>';
        return;
    }

    tableBody.innerHTML = materias.map(materia => {
        const fechaCreacion = materia.created_at || '-';
        const fechaActualizacion = materia.updated_at || '-';
        const descripcion = materia.descripcion ? (materia.descripcion.length > 50 ? materia.descripcion.substring(0, 50) + '...' : materia.descripcion) : 'Sin descripción';
        
        return `
            <tr>
                <td>${materia.id}</td>
                <td>${escapeHtml(materia.nombre)}</td>
                <td title="${materia.descripcion || ''}">${escapeHtml(descripcion)}</td>
                <td>${fechaCreacion}</td>
                <td>${fechaActualizacion}</td>
                <td>
                    <div class="acciones-cell">
                        <button class="btn-icon btn-ver" onclick="abrirModalVer(${materia.id})" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon btn-editar" onclick="abrirModalEditar(${materia.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-eliminar" onclick="abrirModalEliminar(${materia.id})" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Filtrar materias por búsqueda
function filtrarMaterias() {
    const searchTermEl = document.getElementById('searchInput');
    const searchTerm = searchTermEl ? searchTermEl.value.toLowerCase() : '';
    const ordenEl = document.getElementById('filtroOrden');
    const orden = ordenEl ? ordenEl.value : '';

    let filtradas = materiasData;

    if (searchTerm) {
        filtradas = filtradas.filter(materia =>
            materia.nombre.toLowerCase().includes(searchTerm) ||
            (materia.descripcion && materia.descripcion.toLowerCase().includes(searchTerm))
        );
    }

    if (orden) {
        const copia = [...filtradas];
        if (orden === 'az') {
            filtradas = copia.sort((a, b) => (a.nombre || '').localeCompare((b.nombre || ''), 'es'));
        } else if (orden === 'za') {
            filtradas = copia.sort((a, b) => (b.nombre || '').localeCompare((a.nombre || ''), 'es'));
        } else if (orden === 'recientes') {
            filtradas = copia.sort((a, b) => (b.id || 0) - (a.id || 0));
        } else if (orden === 'antiguas') {
            filtradas = copia.sort((a, b) => (a.id || 0) - (b.id || 0));
        }
    }

    mostrarMaterias(filtradas);
}

// Abrir modal para crear
function abrirModalCrear() {
    const modal = document.getElementById('modalCrearOverlay');
    if (modal) {
        modal.classList.add('active');
        // Limpiar formulario
        const form = document.getElementById('formCrearMateria');
        if (form) form.reset();
    }
}

// Abrir modal para ver detalles
function abrirModalVer(id) {
    const materia = materiasData.find(m => m.id === id);
    if (materia) {
        const modal = document.getElementById('modalVerOverlay');
        if (modal) {
            // Construir contenido dinámico
            let htmlContenido = `
                <div class="info-row">
                    <label>Nombre:</label>
                    <span>${escapeHtml(materia.nombre)}</span>
                </div>
                <div class="info-row">
                    <label>Descripción:</label>
                    <span>${escapeHtml(materia.descripcion || 'Sin descripción')}</span>
                </div>
                <div class="info-row">
                    <label>Fecha de Creación:</label>
                    <span>${materia.created_at || '-'}</span>
                </div>
                <div class="info-row">
                    <label>Última Actualización:</label>
                    <span>${materia.updated_at || '-'}</span>
                </div>
            `;
            
            const contentDiv = document.getElementById('verMateriaContent');
            if (contentDiv) {
                contentDiv.innerHTML = htmlContenido;
            }
            
            modal.classList.add('active');
        }
    }
}

// Abrir modal para editar
function abrirModalEditar(id) {
    const materia = materiasData.find(m => m.id === id);
    if (materia) {
        const modal = document.getElementById('modalEditarOverlay');
        if (modal) {
            window.materiaEditar = materia;
            modal.classList.add('active');
            
            // Llenar formulario
            document.getElementById('editarId').value = materia.id;
            document.getElementById('editarNombre').value = materia.nombre;
            document.getElementById('editarDescripcion').value = materia.descripcion || '';
        }
    }
}

// Abrir modal para eliminar
function abrirModalEliminar(id) {
    const materia = materiasData.find(m => m.id === id);
    if (materia) {
        const modal = document.getElementById('modalEliminarOverlay');
        if (modal) {
            window.materiaEliminar = materia;
            modal.classList.add('active');
            
            // Mostrar nombre de la materia
            document.getElementById('nombreMateriaEliminar').textContent = escapeHtml(materia.nombre);
            document.getElementById('idMateriaEliminar').value = materia.id;
        }
    }
}

// Funciones auxiliares para cerrar modales
function cerrarModal(elementId) {
    const modal = document.getElementById(elementId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Alias de cerrarModal para compatibilidad con HTML
function ocultarModal(elementId) {
    cerrarModal(elementId);
}

// Cerrar modal al hacer clic en el overlay
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal-overlay')) {
        event.target.classList.remove('active');
    }
});

// Cerrar modales con ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});

// Función para escapar HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Mostrar mensaje tipo toast en la esquina inferior derecha
function mostrarMensaje(titulo, mensaje, tipo) {
    // Crear contenedor de notificaciones si no existe
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Crear el toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    
    // Icono según el tipo
    let icono = '';
    switch(tipo) {
        case 'success':
            icono = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
        case 'danger':
            icono = '<i class="fas fa-exclamation-circle"></i>';
            break;
        case 'warning':
            icono = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        case 'info':
            icono = '<i class="fas fa-info-circle"></i>';
            break;
        default:
            icono = '<i class="fas fa-bell"></i>';
    }

    toast.innerHTML = `
        <div class="toast-icon">${icono}</div>
        <div class="toast-content">
            <div class="toast-title">${escapeHtml(titulo)}</div>
            <div class="toast-message">${escapeHtml(mensaje)}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    container.appendChild(toast);

    // Animar entrada
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Función para obtener cookie CSRF
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
