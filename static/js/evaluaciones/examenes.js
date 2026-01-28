// Script principal para gestión de exámenes

let examenesData = [];
let searchTimeout;

// Inicializar cuando carga la página
document.addEventListener('DOMContentLoaded', function() {
    cargarExamenes();
    
    // Event listeners para búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(filtrarExamenes, 300);
        });
    }

    // Event listener para botón nuevo examen
    const btnNuevoExamen = document.getElementById('btnNuevoExamen');
    if (btnNuevoExamen) {
        btnNuevoExamen.addEventListener('click', abrirModalCrear);
    }
});

// Cargar exámenes del servidor
function cargarExamenes() {
    fetch('/examenes/api/examenes/')
        .then(response => {
            if (!response.ok) throw new Error('Error al cargar exámenes');
            return response.json();
        })
        .then(data => {
            if (data.success) {
                examenesData = data.data || [];
                mostrarExamenes(examenesData);
            } else {
                mostrarMensaje(data.error || 'Error desconocido', 'error');
            }
        })
        .catch(error => {
            mostrarMensaje('No se pudieron cargar los exámenes', 'error');
        });
}

// Mostrar exámenes en la tabla
function mostrarExamenes(examenes) {
    const tableBody = document.getElementById('tablaExamenes');
    
    if (!tableBody) return;

    if (examenes.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center">No hay exámenes registrados</td></tr>';
        return;
    }

    tableBody.innerHTML = examenes.map(examen => {
        const estadoBadge = examen.activo 
            ? '<span class="badge badge-success">Activo</span>' 
            : '<span class="badge badge-danger">Inactivo</span>';
        
        const tipoBadge = examen.materia_requiere_suscripcion 
            ? '<span class="badge badge-premium">Premium</span>' 
            : '<span class="badge badge-gratis">Gratis</span>';
        
        return `
            <tr>
                <td>${examen.id}</td>
                <td>${escapeHtml(examen.titulo)}</td>
                <td>${escapeHtml(examen.materia_nombre)}</td>
                <td>${tipoBadge}</td>
                <td>${examen.duracion_minutos} min</td>
                <td>${examen.total_preguntas}</td>
                <td>${estadoBadge}</td>
                <td>
                    <div class="acciones-cell">
                        <button class="btn-icon btn-preguntas" onclick="abrirModalPreguntas(${examen.id})" title="Gestionar Preguntas">
                            <i class="fas fa-question-circle"></i>
                        </button>
                        <button class="btn-icon btn-ver" onclick="abrirModalVer(${examen.id})" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon btn-editar" onclick="abrirModalEditar(${examen.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-eliminar" onclick="abrirModalEliminar(${examen.id})" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Filtrar exámenes por búsqueda
function filtrarExamenes() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (!searchTerm) {
        mostrarExamenes(examenesData);
        return;
    }

    const filtrados = examenesData.filter(examen => 
        examen.titulo.toLowerCase().includes(searchTerm) ||
        examen.materia_nombre.toLowerCase().includes(searchTerm) ||
        (examen.descripcion && examen.descripcion.toLowerCase().includes(searchTerm))
    );

    mostrarExamenes(filtrados);
}

// Abrir modal para crear
function abrirModalCrear() {
    const modal = document.getElementById('modalCrearOverlay');
    if (modal) {
        modal.classList.add('active');
        // Limpiar formulario
        const form = document.getElementById('formCrearExamen');
        if (form) form.reset();
        // Cargar materias en el select
        cargarMateriasSelect('crearMateria');
    }
}

// Abrir modal para ver detalles
function abrirModalVer(id) {
    const examen = examenesData.find(e => e.id === id);
    if (examen) {
        const modal = document.getElementById('modalVerOverlay');
        if (modal) {
            window.examenPendiente = examen;
            modal.classList.add('active');
            
            // Cargar detalles
            document.getElementById('verTitulo').textContent = escapeHtml(examen.titulo);
            document.getElementById('verMateria').textContent = escapeHtml(examen.materia_nombre);
            document.getElementById('verDescripcion').textContent = examen.descripcion || 'Sin descripción';
            document.getElementById('verDuracion').textContent = `${examen.duracion_minutos} minutos`;
            document.getElementById('verTotalPreguntas').textContent = examen.total_preguntas;
            document.getElementById('verPremium').textContent = examen.materia_requiere_suscripcion ? 'Sí' : 'No';
            document.getElementById('verEstado').textContent = examen.activo ? 'Activo' : 'Inactivo';
            document.getElementById('verFechaCreacion').textContent = examen.created_at;
            document.getElementById('verFechaActualizacion').textContent = examen.updated_at;
        }
    }
}

// Abrir modal para editar
function abrirModalEditar(id) {
    const examen = examenesData.find(e => e.id === id);
    if (examen) {
        const modal = document.getElementById('modalEditarOverlay');
        if (modal) {
            window.examenEditar = examen;
            modal.classList.add('active');
            
            // Cargar materias
            cargarMateriasSelect('editarMateria', examen.materia_id);
            
            // Llenar formulario
            document.getElementById('editarId').value = examen.id;
            document.getElementById('editarTitulo').value = examen.titulo;
            document.getElementById('editarDescripcion').value = examen.descripcion || '';
            document.getElementById('editarDuracion').value = examen.duracion_minutos;
            document.getElementById('editarActivo').checked = examen.activo;
        }
    }
}

// Abrir modal para gestionar preguntas
function abrirModalPreguntas(id) {
    const examen = examenesData.find(e => e.id === id);
    if (examen) {
        const modal = document.getElementById('modalPreguntasOverlay');
        if (modal) {
            window.examenActual = examen;
            modal.classList.add('active');
            
            // Actualizar título del modal
            document.getElementById('tituloExamenPreguntas').textContent = examen.titulo;
            document.getElementById('examenIdPreguntas').value = examen.id;
            
            // Cargar preguntas del examen
            cargarPreguntasExamen(examen.id);
        }
    }
}

// Abrir modal para eliminar
function abrirModalEliminar(id) {
    const examen = examenesData.find(e => e.id === id);
    if (examen) {
        const modal = document.getElementById('modalEliminarOverlay');
        if (modal) {
            window.examenEliminar = examen;
            modal.classList.add('active');
            
            // Mostrar nombre del examen
            document.getElementById('nombreExamenEliminar').textContent = escapeHtml(examen.titulo);
            document.getElementById('idExamenEliminar').value = examen.id;
        }
    }
}

// Cargar materias en select
function cargarMateriasSelect(selectId, selectedId = null) {
    fetch('/examenes/api/materias/')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const select = document.getElementById(selectId);
                if (select) {
                    select.innerHTML = '<option value="">Seleccione una materia</option>';
                    data.data.forEach(materia => {
                        const option = document.createElement('option');
                        option.value = materia.id;
                        option.textContent = materia.nombre;
                        if (selectedId && materia.id === selectedId) {
                            option.selected = true;
                        }
                        select.appendChild(option);
                    });
                }
            }
        })
        .catch(error => {
            mostrarMensaje('No se pudieron cargar las materias', 'error');
        });
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

// Mostrar mensaje toast
function mostrarMensaje(mensaje, tipo) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.textContent = mensaje;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}
