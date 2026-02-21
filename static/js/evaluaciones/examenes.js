// Script principal para gestión de exámenes

let examenesData = [];
let searchTimeout;
let materiasData = [];
let temasData = [];

// Inicializar cuando carga la página
document.addEventListener('DOMContentLoaded', function() {
    cargarExamenes();
    cargarMateriasYTemas();
    
    // Event listeners para búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(filtrarExamenes, 300);
        });
    }

    // Event listeners para filtros
    const filtroMateria = document.getElementById('filtroMateria');
    const filtroTema = document.getElementById('filtroTema');
    const filtroTipo = document.getElementById('filtroTipo');
    const filtroEstado = document.getElementById('filtroEstado');

    if (filtroMateria) {
        filtroMateria.addEventListener('change', function() {
            actualizarSelectTemas();
            filtrarExamenes();
        });
    }

    if (filtroTema) {
        filtroTema.addEventListener('change', filtrarExamenes);
    }

    if (filtroTipo) {
        filtroTipo.addEventListener('change', filtrarExamenes);
    }

    if (filtroEstado) {
        filtroEstado.addEventListener('change', filtrarExamenes);
    }

    // Event listener para botón nuevo examen
    const btnNuevoExamen = document.getElementById('btnNuevoExamen');
    if (btnNuevoExamen) {
        btnNuevoExamen.addEventListener('click', abrirModalCrear);
    }
});

// Cargar materias y temas disponibles
function cargarMateriasYTemas() {
    fetch('/materias/api/materias-y-temas/')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                materiasData = data.materias || [];
                temasData = data.temas || [];
                poblarSelectMaterias();
            }
        })
        .catch(error => console.error('Error al cargar materias y temas:', error));
}

// Poblar el select de materias
function poblarSelectMaterias() {
    const filtroMateria = document.getElementById('filtroMateria');
    materiasData.forEach(materia => {
        const option = document.createElement('option');
        option.value = materia.id;
        option.textContent = materia.nombre;
        filtroMateria.appendChild(option);
    });
}

// Actualizar select de temas basado en la materia seleccionada
function actualizarSelectTemas() {
    const filtroMateria = document.getElementById('filtroMateria').value;
    const filtroTema = document.getElementById('filtroTema');
    
    // Limpiar opciones de tema (excepto la primera)
    while (filtroTema.options.length > 1) {
        filtroTema.remove(1);
    }
    
    if (filtroMateria) {
        const temasFiltrados = temasData.filter(tema => tema.materia_id == filtroMateria);
        temasFiltrados.forEach(tema => {
            const option = document.createElement('option');
            option.value = tema.id;
            option.textContent = tema.nombre;
            filtroTema.appendChild(option);
        });
    } else {
        // Si no hay materia seleccionada, mostrar todos los temas
        temasData.forEach(tema => {
            const option = document.createElement('option');
            option.value = tema.id;
            option.textContent = tema.nombre;
            filtroTema.appendChild(option);
        });
    }
}

// Cargar exámenes del servidor
function cargarExamenes() {
    fetch('/examenes/api/examenes/')
        .then(response => {
            if (!response.ok) throw new Error('Error al cargar exámenes');
            return response.json();
        })
        .then(data => {
            console.log('Datos recibidos:', data);
            if (data.success) {
                examenesData = data.data || [];
                console.log('Exámenes cargados:', examenesData);
                mostrarExamenes(examenesData);
            } else {
                mostrarMensaje(data.error || 'Error desconocido', 'error');
            }
        })
        .catch(error => {
            console.error('Error al cargar exámenes:', error);
            mostrarMensaje('No se pudieron cargar los exámenes', 'error');
        });
}

// Mostrar exámenes en la tabla
function mostrarExamenes(examenes) {
    const tableBody = document.getElementById('tablaExamenes');
    
    if (!tableBody) return;

    if (examenes.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center">No hay exámenes registrados</td></tr>';
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
                <td>${escapeHtml(examen.materia_nombre || 'Sin materia')}</td>
                <td>${escapeHtml(examen.tema_nombre)}</td>
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

// Filtrar exámenes por búsqueda y filtros
function filtrarExamenes() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filtroMateria = document.getElementById('filtroMateria').value;
    const filtroTema = document.getElementById('filtroTema').value;
    const filtroTipo = document.getElementById('filtroTipo').value;
    const filtroEstado = document.getElementById('filtroEstado').value;
    
    const filtrados = examenesData.filter(examen => {
        // Filtro por búsqueda
        const coincideSearch = !searchTerm || 
            examen.titulo.toLowerCase().includes(searchTerm) ||
            (examen.descripcion && examen.descripcion.toLowerCase().includes(searchTerm));
        
        // Filtro por materia
        const coincideMateria = !filtroMateria || examen.materia_id == filtroMateria;
        
        // Filtro por tema
        const coincideTema = !filtroTema || examen.tema_id == filtroTema;
        
        // Filtro por tipo
        let coincideTipo = true;
        if (filtroTipo) {
            if (filtroTipo === 'premium') {
                coincideTipo = examen.materia_requiere_suscripcion === true;
            } else if (filtroTipo === 'gratis') {
                coincideTipo = examen.materia_requiere_suscripcion === false;
            }
        }
        
        // Filtro por estado
        let coincideEstado = true;
        if (filtroEstado) {
            if (filtroEstado === 'activo') {
                coincideEstado = examen.activo === true;
            } else if (filtroEstado === 'inactivo') {
                coincideEstado = examen.activo === false;
            }
        }
        
        return coincideSearch && coincideMateria && coincideTema && coincideTipo && coincideEstado;
    });

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
        // Cargar materias
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
            document.getElementById('verMateria').textContent = escapeHtml(examen.tema_nombre || 'N/A');
            document.getElementById('verTema').textContent = escapeHtml(examen.tema_nombre);
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
    console.log('Editar examen:', examen);
    
    if (examen) {
        const modal = document.getElementById('modalEditarOverlay');
        if (modal) {
            window.examenEditar = examen;
            modal.classList.add('active');
            
            // Llenar campos básicos primero
            document.getElementById('editarId').value = examen.id || '';
            document.getElementById('editarTitulo').value = examen.titulo || '';
            document.getElementById('editarDescripcion').value = examen.descripcion || '';
            document.getElementById('editarDuracion').value = examen.duracion_minutos || 60;
            document.getElementById('editarActivo').checked = examen.activo !== false;
            
            // Cargar materias y temas
            cargarMateriasSelect('editarMateria', () => {
                // Seleccionar la materia del examen
                if (examen.materia_id) {
                    document.getElementById('editarMateria').value = examen.materia_id;
                    // Después cargar temas de esa materia
                    setTimeout(() => {
                        cargarTemasEditarExamen();
                        // Seleccionar el tema del examen
                        setTimeout(() => {
                            if (examen.tema_id) {
                                document.getElementById('editarTema').value = examen.tema_id;
                            }
                        }, 150);
                    }, 100);
                }
            });
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
function cargarMateriasSelect(selectId, callback) {
    fetch('/temas/api/materias/')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const select = document.getElementById(selectId);
                if (select) {
                    select.innerHTML = '<option value="">Seleccione una materia</option>';
                    (data.materias || []).forEach(materia => {
                        const option = document.createElement('option');
                        option.value = materia.id;
                        option.textContent = materia.nombre;
                        select.appendChild(option);
                    });
                }
            }
            if (callback) callback();
        })
        .catch(error => {
            mostrarMensaje('No se pudieron cargar las materias', 'error');
        });
}

// Cargar temas filtrados por materia para crear
function cargarTemasCrearExamen() {
    const materiaSelect = document.getElementById('crearMateria');
    const temaSelect = document.getElementById('crearTema');
    
    if (!materiaSelect || !temaSelect || !materiaSelect.value) {
        temaSelect.innerHTML = '<option value="">Seleccione un tema</option>';
        return;
    }
    
    fetch(`/temas/api/temas/por-materia/${materiaSelect.value}/`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                temaSelect.innerHTML = '<option value="">Seleccione un tema</option>';
                data.temas.forEach(tema => {
                    const option = document.createElement('option');
                    option.value = tema.id;
                    option.textContent = tema.nombre;
                    temaSelect.appendChild(option);
                });
            }
        })
        .catch(error => console.error('Error al cargar temas:', error));
}

// Cargar temas filtrados por materia para editar
function cargarTemasEditarExamen() {
    const materiaSelect = document.getElementById('editarMateria');
    const temaSelect = document.getElementById('editarTema');
    
    if (!materiaSelect || !temaSelect || !materiaSelect.value) {
        temaSelect.innerHTML = '<option value="">Seleccione un tema</option>';
        return;
    }
    
    const temaActual = temaSelect.value;
    
    fetch(`/temas/api/temas/por-materia/${materiaSelect.value}/`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                temaSelect.innerHTML = '<option value="">Seleccione un tema</option>';
                data.temas.forEach(tema => {
                    const option = document.createElement('option');
                    option.value = tema.id;
                    option.textContent = tema.nombre;
                    temaSelect.appendChild(option);
                });
                temaSelect.value = temaActual;
            }
        })
        .catch(error => console.error('Error al cargar temas:', error));
}

// Cargar temas en select (usado anterior)
function cargarTemasSelect(selectId, selectedId = null) {
    fetch('/temas/api/temas/')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const select = document.getElementById(selectId);
                if (select) {
                    select.innerHTML = '<option value="">Seleccione un tema</option>';
                    (data.temas || []).forEach(tema => {
                        const option = document.createElement('option');
                        option.value = tema.id;
                        option.textContent = tema.nombre;
                        if (selectedId && tema.id === selectedId) {
                            option.selected = true;
                        }
                        select.appendChild(option);
                    });
                }
            }
        })
        .catch(error => {
            mostrarMensaje('No se pudieron cargar los temas', 'error');
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
