// Script principal para gestión de materias_nueva

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
                materiasData = data.materias || [];
                mostrarMaterias(materiasData);
            } else {
                mostrarMensaje('Error', data.error || 'Error desconocido', 'error');
            }
        })
        .catch(error => {
            mostrarMensaje('Error', 'No se pudieron cargar las materias', 'error');
            console.error('Error:', error);
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
        const descripcion = materia.descripcion ? 
            (materia.descripcion.length > 50 ? materia.descripcion.substring(0, 50) + '...' : materia.descripcion) : 
            'Sin descripción';
        const tipoAcceso = materia.requiere_suscripcion ? 
            '<span class="badge-premium">Premium</span>' : 
            '<span class="badge-gratis">Gratis</span>';
        
        return `
            <tr>
                <td>${materia.id}</td>
                <td>${escapeHtml(materia.nombre)}</td>
                <td title="${escapeHtml(materia.descripcion || '')}">${escapeHtml(descripcion)}</td>
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
    const searchTerm = document.getElementById('searchInput') ? 
        document.getElementById('searchInput').value.toLowerCase() : '';
    
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
        const modal = document.getElementById('modalVerOverlay');
        if (modal) {
            window.materiaPendiente = materia;
            modal.classList.add('active');
            
            // Cargar detalles
            document.getElementById('verId').textContent = materia.id;
            document.getElementById('verNombre').textContent = escapeHtml(materia.nombre);
            document.getElementById('verDescripcion').textContent = materia.descripcion || 'Sin descripción';
            document.getElementById('verRequiereSuscripcion').textContent = materia.requiere_suscripcion ? 
                'Premium (Requiere Suscripción)' : 'Gratis (Acceso Libre)';
            document.getElementById('verFechaCreacion').textContent = 
                new Date(materia.created_at).toLocaleDateString('es-ES');
            document.getElementById('verFechaActualizacion').textContent = 
                new Date(materia.updated_at).toLocaleDateString('es-ES');
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
            document.getElementById('editarRequiereSuscripcion').checked = materia.requiere_suscripcion;
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

// Cerrar modal
function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Mostrar mensaje de notificación
function mostrarMensaje(titulo, mensaje, tipo = 'success') {
    // Implementar según el sistema de notificaciones que uses
    // Por ahora usamos alert simple
    alert(titulo + ': ' + mensaje);
}

// Escape HTML para prevenir XSS
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

// Obtener cookie CSRF
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

// Exportar funciones globales
window.cargarMaterias = cargarMaterias;
window.abrirModalCrear = abrirModalCrear;
window.abrirModalVer = abrirModalVer;
window.abrirModalEditar = abrirModalEditar;
window.abrirModalEliminar = abrirModalEliminar;
window.cerrarModal = cerrarModal;
window.mostrarMensaje = mostrarMensaje;
window.getCookie = getCookie;
