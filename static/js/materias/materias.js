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
                materiasData = data.data || [];
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
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No hay materias registradas</td></tr>';
        return;
    }

    tableBody.innerHTML = materias.map(materia => {
        const fechaCreacion = new Date(materia.created_at).toLocaleDateString('es-ES');
        const descripcion = materia.descripcion ? materia.descripcion.substring(0, 50) + '...' : 'Sin descripción';
        const tipoAcceso = materia.requiere_suscripcion ? 
            '<span class="badge-premium">Premium</span>' : 
            '<span class="badge-gratis">Gratis</span>';
        
        return `
            <tr>
                <td>${materia.id}</td>
                <td>${escapeHtml(materia.nombre)}</td>
                <td title="${materia.descripcion || ''}">${escapeHtml(descripcion)}</td>
                <td>${tipoAcceso}</td>
                <td>${fechaCreacion}</td>
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
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (!searchTerm) {
        mostrarMaterias(materiasData);
        return;
    }

    const filtradas = materiasData.filter(materia => 
        materia.nombre.toLowerCase().includes(searchTerm) ||
        (materia.descripcion && materia.descripcion.toLowerCase().includes(searchTerm))
    );

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
        // Cargar datos en el modal
        const modal = document.getElementById('modalVerOverlay');
        if (modal) {
            // Disparar evento personalizado que será escuchado en ver.js
            window.materiaPendiente = materia;
            modal.classList.add('active');
            
            // Cargar detalles
            document.getElementById('verNombre').textContent = escapeHtml(materia.nombre);
            document.getElementById('verDescripcion').textContent = materia.descripcion || 'Sin descripción';
            document.getElementById('verRequiereSuscripcion').textContent = materia.requiere_suscripcion ? 'Premium (Requiere Suscripción)' : 'Gratis (Acceso Libre)';
            document.getElementById('verFechaCreacion').textContent = new Date(materia.created_at).toLocaleDateString('es-ES');
            document.getElementById('verFechaActualizacion').textContent = new Date(materia.updated_at).toLocaleDateString('es-ES');
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
            document.getElementById('editarRequiereSuscripcion').checked = materia.requiere_suscripcion || false;
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
