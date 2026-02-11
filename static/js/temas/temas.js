// Script principal para gestión de temas

let temasData = [];
let materiasData = [];
let searchTimeout;

// Inicializar cuando carga la página
document.addEventListener('DOMContentLoaded', function() {
    cargarMaterias();
    cargarTemas();
    
    // Event listeners para búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(filtrarTemas, 300);
        });
    }

    // Event listener para filtro de materia
    const filtroMateria = document.getElementById('filtroMateria');
    if (filtroMateria) {
        filtroMateria.addEventListener('change', filtrarTemas);
    }

    // Event listener para botón nuevo tema
    const btnNuevoTema = document.getElementById('btnNuevoTema');
    if (btnNuevoTema) {
        btnNuevoTema.addEventListener('click', abrirModalCrear);
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
                cargarFiltroMaterias();
            }
        })
        .catch(error => {
            console.error('Error cargando materias:', error);
        });
}

// Cargar materias en el filtro
function cargarFiltroMaterias() {
    const filtroMateria = document.getElementById('filtroMateria');
    if (filtroMateria && materiasData.length > 0) {
        filtroMateria.innerHTML = '<option value="">Todas las materias</option>';
        materiasData.forEach(materia => {
            const option = document.createElement('option');
            option.value = materia.id;
            option.textContent = materia.nombre;
            filtroMateria.appendChild(option);
        });
    }
}

// Cargar temas del servidor
function cargarTemas() {
    fetch('/temas/api/temas/')
        .then(response => {
            if (!response.ok) throw new Error('Error al cargar temas');
            return response.json();
        })
        .then(data => {
            if (data.success) {
                temasData = data.temas || [];
                mostrarTemas(temasData);
            } else {
                mostrarMensaje('Error', data.error || 'Error desconocido', 'error');
            }
        })
        .catch(error => {
            mostrarMensaje('Error', 'No se pudieron cargar los temas', 'error');
        });
}

// Mostrar temas en la tabla
function mostrarTemas(temas) {
    const tableBody = document.getElementById('tableTemas');
    
    if (!tableBody) return;

    if (temas.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-5"><i class="fas fa-inbox" style="font-size: 48px; color: #ccc;"></i><br><br>No hay temas registrados</td></tr>';
        return;
    }

    tableBody.innerHTML = temas.map(tema => {
        const fechaCreacion = new Date(tema.created_at).toLocaleDateString('es-ES');
        const descripcion = tema.descripcion ? 
            (tema.descripcion.length > 50 ? tema.descripcion.substring(0, 50) + '...' : tema.descripcion) : 
            '-';
        const tipoAcceso = tema.requiere_suscripcion ? 
            '<span class="badge bg-warning text-dark">Premium</span>' : 
            '<span class="badge bg-success">Gratis</span>';
        const materiaNombre = tema.materia_nombre || 'Sin materia';
        
        return `
            <tr>
                <td>${tema.id}</td>
                <td><strong>${escapeHtml(tema.nombre)}</strong></td>
                <td>${escapeHtml(materiaNombre)}</td>
                <td title="${escapeHtml(tema.descripcion || '')}">${escapeHtml(descripcion)}</td>
                <td>${tipoAcceso}</td>
                <td>${fechaCreacion}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="abrirModalVer(${tema.id})" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="abrirModalEditar(${tema.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="abrirModalEliminar(${tema.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Filtrar temas por búsqueda y materia
function filtrarTemas() {
    const searchTerm = document.getElementById('searchInput') ? 
        document.getElementById('searchInput').value.toLowerCase() : '';
    const materiaId = document.getElementById('filtroMateria') ? 
        document.getElementById('filtroMateria').value : '';
    
    let filtrados = temasData;

    // Filtrar por materia
    if (materiaId) {
        filtrados = filtrados.filter(tema => tema.materia_id == materiaId);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
        filtrados = filtrados.filter(tema => 
            tema.nombre.toLowerCase().includes(searchTerm) ||
            (tema.descripcion && tema.descripcion.toLowerCase().includes(searchTerm)) ||
            (tema.materia_nombre && tema.materia_nombre.toLowerCase().includes(searchTerm))
        );
    }

    mostrarTemas(filtrados);
}

// Abrir modal para crear
function abrirModalCrear() {
    const modal = document.getElementById('modalCrearOverlay');
    if (modal) {
        modal.classList.add('active');
        // Limpiar formulario
        const form = document.getElementById('formCrearTema');
        if (form) form.reset();
        
        // Cargar materias en el select
        cargarMateriasEnModal();
    }
}

// Cargar materias en el modal de crear
function cargarMateriasEnModal() {
    const selectMateria = document.getElementById('crearMateria');
    if (selectMateria) {
        selectMateria.innerHTML = '<option value="">-- Seleccionar Materia --</option>';
        
        if (materiasData && materiasData.length > 0) {
            materiasData.forEach(materia => {
                const option = document.createElement('option');
                option.value = materia.id;
                option.textContent = materia.nombre;
                selectMateria.appendChild(option);
            });
        }
    }
}

// Abrir modal para ver detalles
function abrirModalVer(id) {
    const tema = temasData.find(t => t.id === id);
    if (tema) {
        const modal = document.getElementById('modalVerOverlay');
        if (modal) {
            window.temaPendiente = tema;
            modal.classList.add('active');
            
            // Cargar detalles
            document.getElementById('verNombreTema').textContent = escapeHtml(tema.nombre);
            document.getElementById('verMateriaTema').textContent = escapeHtml(tema.materia_nombre || '-');
            document.getElementById('verDescripcionTema').textContent = tema.descripcion || 'Sin descripción';
            document.getElementById('verSuscripcionTema').textContent = tema.requiere_suscripcion ? 
                'Premium (Requiere Suscripción)' : 'Gratis (Acceso Libre)';
            document.getElementById('verFechaCreacionTema').textContent = 
                new Date(tema.created_at).toLocaleDateString('es-ES');
            document.getElementById('verFechaActualizacionTema').textContent = 
                new Date(tema.updated_at).toLocaleDateString('es-ES');
        }
    }
}

// Abrir modal para editar
function abrirModalEditar(id) {
    const tema = temasData.find(t => t.id === id);
    if (tema) {
        const modal = document.getElementById('modalEditarOverlay');
        if (modal) {
            window.temaEditar = tema;
            modal.classList.add('active');
            
            // Cargar materias en el select
            cargarMateriasEnModalEditar();
            
            // Llenar formulario
            document.getElementById('inputIdTemaEditar').value = tema.id;
            document.getElementById('inputNombreTemaEditar').value = tema.nombre;
            document.getElementById('selectMateriaTemaEditar').value = tema.materia_id;
            document.getElementById('textareaDescripcionTemaEditar').value = tema.descripcion || '';
            document.getElementById('checkboxSuscripcionEditar').checked = tema.requiere_suscripcion;
        }
    }
}

// Cargar materias en el modal de editar
function cargarMateriasEnModalEditar() {
    const selectMateria = document.getElementById('selectMateriaTemaEditar');
    if (selectMateria) {
        selectMateria.innerHTML = '<option value="">-- Seleccionar Materia --</option>';
        
        if (materiasData && materiasData.length > 0) {
            materiasData.forEach(materia => {
                const option = document.createElement('option');
                option.value = materia.id;
                option.textContent = materia.nombre;
                selectMateria.appendChild(option);
            });
        }
    }
}

// Abrir modal para eliminar
function abrirModalEliminar(id) {
    const tema = temasData.find(t => t.id === id);
    if (tema) {
        const modal = document.getElementById('modalEliminarOverlay');
        if (modal) {
            window.temaEliminar = tema;
            modal.classList.add('active');
            
            // Mostrar nombre del tema y establecer ID
            document.getElementById('nombreTemaEliminar').textContent = escapeHtml(tema.nombre);
            document.getElementById('idTemaEliminar').value = tema.id;
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

// Obtener cookie por nombre (para CSRF token)
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
window.cargarTemas = cargarTemas;
window.cargarMateriasEnModal = cargarMateriasEnModal;
window.cargarMateriasEnModalEditar = cargarMateriasEnModalEditar;
window.abrirModalCrear = abrirModalCrear;
window.abrirModalVer = abrirModalVer;
window.abrirModalEditar = abrirModalEditar;
window.abrirModalEliminar = abrirModalEliminar;
window.cerrarModal = cerrarModal;
window.mostrarMensaje = mostrarMensaje;
window.getCookie = getCookie;
