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
        
        // Cargar temas al abrir modal de crear o editar
        if (overlayId === 'modalCrearOverlay' || overlayId === 'modalEditarOverlay') {
            cargarTemas();
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

// Cargar temas desde la API
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
            <td>${contenido.tema}</td>
            <td>
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
