// contenidos.js - Lógica principal para gestión de contenidos

// Función para obtener CSRF token
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

// Función para mostrar alertas
function mostrarAlerta(mensaje, tipo) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo}`;
    alertDiv.style.cssText = 'padding: 1rem; border-radius: 4px; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;';
    
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
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = 'background: none; border: none; font-size: 1.5rem; cursor: pointer; color: inherit;';
    closeBtn.onclick = () => alertDiv.remove();
    
    const contenedor = document.createElement('div');
    contenedor.textContent = mensaje;
    
    alertDiv.appendChild(contenedor);
    alertDiv.appendChild(closeBtn);
    
    const container = document.querySelector('.container-fluid');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
    }

    setTimeout(() => {
        alertDiv.remove();
    }, 4000);
}

// Funciones para mostrar/ocultar modales
function mostrarModal(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (overlay) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Cargar materias al abrir modal de crear o editar
        if (overlayId === 'modalCrearOverlay') {
            cargarMateriasCrear();
        } else if (overlayId === 'modalEditarOverlay') {
            cargarMateriasEditar();
        }
    }
}

function ocultarModal(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Alias para compatibilidad con evaluaciones
function cerrarModal(elementId) {
    const modal = document.getElementById(elementId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

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

// Cargar materias en select de crear
function cargarMateriasCrear() {
    fetch('/temas/api/materias/')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const selectMateria = document.getElementById('crearMateria');
                if (selectMateria) {
                    const options = (data.materias || []).map(m => 
                        `<option value="${m.id}">${m.nombre}</option>`
                    ).join('');
                    selectMateria.innerHTML = '<option value="">Seleccione una materia</option>' + options;
                }
            }
        })
        .catch(error => {
            console.error('Error al cargar materias:', error);
            mostrarAlerta('Error al cargar las materias', 'danger');
        });
}

// Cargar materias en select de editar
function cargarMateriasEditar() {
    fetch('/temas/api/materias/')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const selectMateria = document.getElementById('editarMateria');
                if (selectMateria) {
                    const options = (data.materias || []).map(m => 
                        `<option value="${m.id}">${m.nombre}</option>`
                    ).join('');
                    selectMateria.innerHTML = '<option value="">Seleccione una materia</option>' + options;
                }
            }
        })
        .catch(error => {
            console.error('Error al cargar materias:', error);
            mostrarAlerta('Error al cargar las materias', 'danger');
        });
}

// Cargar temas filtrados por materia en crear
function cargarTemasCrear() {
    const materiaSelect = document.getElementById('crearMateria');
    const temaSelect = document.getElementById('crearTema');
    
    if (!materiaSelect || !temaSelect) {
        return;
    }
    
    const materiaId = materiaSelect.value;
    
    if (!materiaId) {
        temaSelect.innerHTML = '<option value="">Seleccione un tema</option>';
        return;
    }
    
    fetch(`/temas/api/temas/por-materia/${materiaId}/`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const options = (data.temas || []).map(t => 
                    `<option value="${t.nombre}">${t.nombre}</option>`
                ).join('');
                temaSelect.innerHTML = '<option value="">Seleccione un tema</option>' + options;
            }
        })
        .catch(error => {
            console.error('Error al cargar temas:', error);
            mostrarAlerta('Error al cargar los temas', 'danger');
        });
}

// Cargar temas filtrados por materia en editar
function cargarTemasEditar() {
    const materiaSelect = document.getElementById('editarMateria');
    const temaSelect = document.getElementById('editarTema');
    
    if (!materiaSelect || !temaSelect) {
        return;
    }
    
    const materiaId = materiaSelect.value;
    const temaActual = temaSelect.value;
    
    if (!materiaId) {
        temaSelect.innerHTML = '<option value="">Seleccione un tema</option>';
        return;
    }
    
    fetch(`/temas/api/temas/por-materia/${materiaId}/`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const options = (data.temas || []).map(t => 
                    `<option value="${t.nombre}">${t.nombre}</option>`
                ).join('');
                temaSelect.innerHTML = '<option value="">Seleccione un tema</option>' + options;
                // Mantener el valor seleccionado si existe
                if (temaActual) {
                    temaSelect.value = temaActual;
                }
            }
        })
        .catch(error => {
            console.error('Error al cargar temas:', error);
            mostrarAlerta('Error al cargar los temas', 'danger');
        });
}

// Cargar temas desde la API (función legacy - mantener para compatibilidad)
function cargarTemas() {
    fetch('/temas/api/temas/')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const selectCrear = document.getElementById('crearTema');
                const selectEditar = document.getElementById('editarTema');
                
                const options = (data.temas || []).map(m => 
                    `<option value="${m.nombre}">${m.nombre}</option>`
                ).join('');
                
                if (selectCrear) {
                    selectCrear.innerHTML = '<option value="">Seleccione un tema</option>' + options;
                }
                
                if (selectEditar) {
                    // No sobreescribir si ya tiene un valor seleccionado
                    const valorActual = selectEditar.value;
                    selectEditar.innerHTML = '<option value="">Seleccione un tema</option>' + options;
                    if (valorActual) {
                        selectEditar.value = valorActual;
                    }
                }
            }
        })
        .catch(error => {
            console.error('Error al cargar temas:', error);
        });
}

// Cerrar modal al hacer click en el overlay
document.addEventListener('DOMContentLoaded', function() {
    // Cargar temas al iniciar la página
    cargarTemas();
    
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                ocultarModal(this.id);
            }
        });
    });
});

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

// Cargar contenidos al iniciar
window.addEventListener('load', function() {
    console.log('Página de gestión de contenidos cargada');
    cargarContenidos();
    
    // Event listeners para búsqueda y filtros
    const buscar = document.getElementById('buscar');
    const filtroEstado = document.getElementById('filtroEstado');
    const filtroPublicacion = document.getElementById('filtroPublicacion');
    
    if (buscar) {
        buscar.addEventListener('input', cargarContenidos);
    }
    
    if (filtroEstado) {
        filtroEstado.addEventListener('change', cargarContenidos);
    }
    
    if (filtroPublicacion) {
        filtroPublicacion.addEventListener('change', cargarContenidos);
    }
});

// Función para cargar contenidos
function cargarContenidos() {
    const busqueda = document.getElementById('buscar')?.value || '';
    const estado = document.getElementById('filtroEstado')?.value || '';
    const publicacion = document.getElementById('filtroPublicacion')?.value || '';
    
    const params = new URLSearchParams();
    if (busqueda) params.append('busqueda', busqueda);
    if (estado) params.append('estado', estado);
    if (publicacion) params.append('publicacion', publicacion);
    
    fetch(`/contenido/api/contenidos/listar/?${params.toString()}`)
        .then(response => response.json())
        .then(data => {
            renderizarContenidos(data);
        })
        .catch(error => {
            console.error('Error al cargar contenidos:', error);
            mostrarAlerta('Error al cargar los contenidos', 'danger');
        });
}

// Función para renderizar contenidos en la tabla
function renderizarContenidos(contenidos) {
    const tbody = document.getElementById('contenidosTableBody');
    if (!tbody) return;
    
    if (contenidos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron contenidos</td></tr>';
        return;
    }
    
    tbody.innerHTML = contenidos.map(contenido => {
        return `
        <tr>
            <td>${contenido.titulo}</td>
            <td>${contenido.materia_nombre || '-'}</td>
            <td>${contenido.tema}</td>
            <td>
                <span class="badge badge-${contenido.estado}">
                    ${contenido.estado === 'activo' ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <span class="badge badge-${contenido.publicacion === 'publicado' ? 'publicado' : 'no-publicado'}">
                    ${contenido.publicacion === 'publicado' ? 'Publicado' : 'No Publicado'}
                </span>
            </td>
            <td>${contenido.fecha_creacion}</td>
            <td class="acciones-cell">
                <div class="acciones-buttons">
                    <button class="btn-icon btn-ver" onclick="verContenido(${contenido.id})" title="Ver">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon btn-editar" onclick="abrirModalEditar(${contenido.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-eliminar" onclick="abrirModalEliminar(${contenido.id}, '${contenido.titulo.replace(/'/g, "\\'")}' )" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `}).join('');
}
