// JavaScript para Gestión de Mazos Premium

// ==========================================
// UTILIDADES
// ==========================================

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

// Función para escapar HTML y prevenir XSS
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

// Alias para compatibilidad con mostrarAlerta
function mostrarAlerta(mensaje, tipo) {
    mostrarMensaje('Notificación', mensaje, tipo);
}

// ==========================================
// LÓGICA PRINCIPAL
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Mazos.js cargado');
    cargarMazos();
    
    // Event listener para el buscador
    const inputBuscar = document.getElementById('buscarMazo');
    if (inputBuscar) {
        inputBuscar.addEventListener('input', filtrarMazos);
    }
    
    // Event listener para el botón crear
    const btnCrear = document.getElementById('btnCrearMazo');
    console.log('Botón crear encontrado:', btnCrear);
    if (btnCrear) {
        btnCrear.addEventListener('click', async function() {
            console.log('Click en botón crear mazo');
            mostrarModal('modalCrearMazoOverlay');
        });
    }
});

// Función para cargar todos los mazos
async function cargarMazos() {
    try {
        const response = await fetch('/flashcards-premium/api/mazos/');
        const data = await response.json();
        
        if (data.success) {
            mostrarMazos(data.mazos);
        } else {
            console.error('Error al cargar mazos:', data.error);
        }
    } catch (error) {
        console.error('Error en la petición:', error);
    }
}

// Función para mostrar mazos en la tabla
function mostrarMazos(mazos) {
    const tbody = document.querySelector('#tablaMazos tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (mazos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="no-data-message">
                    <i>📚</i>
                    <p>No hay mazos creados aún. ¡Crea tu primer mazo!</p>
                </td>
            </tr>
        `;
        return;
    }
    
    mazos.forEach(mazo => {
        const tr = document.createElement('tr');
        tr.dataset.mazoId = mazo.id;
        tr.dataset.mazoNombre = (mazo.nombre || '').toLowerCase();
        
        tr.innerHTML = `
            <td>${mazo.id}</td>
            <td><strong>${mazo.nombre}</strong></td>
            <td>${mazo.materia_nombre || 'Sin materia'}</td>
            <td>${mazo.tema_nombre || 'Sin tema'}</td>
            <td>${mazo.descripcion || '-'}</td>
            <td><span style="background: #667eea; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem;">${mazo.tarjetas_count || 0}</span></td>
            <td>${mazo.created_at}</td>
            <td class="acciones-cell">
                <div class="acciones-buttons">
                    <button class="btn-icon btn-ver" onclick="verMazo(${mazo.id})" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon btn-editar" onclick="editarMazo(${mazo.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-eliminar" onclick="eliminarMazo(${mazo.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                </div>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

// Función para filtrar mazos
function filtrarMazos() {
    const busqueda = document.getElementById('buscarMazo').value.toLowerCase();
    const filas = document.querySelectorAll('#tablaMazos tr');
    
    filas.forEach(fila => {
        const nombre = fila.dataset.mazoNombre || '';
        if (nombre.includes(busqueda)) {
            fila.style.display = '';
        } else {
            fila.style.display = 'none';
        }
    });
}

// Funciones de acciones (se conectan con los modales)
function verMazo(id) {
    if (typeof window.verMazoModal === 'function') {
        window.verMazoModal(id);
    }
}

function editarMazo(id) {
    if (typeof window.editarMazoModal === 'function') {
        window.editarMazoModal(id);
    }
}

function eliminarMazo(id) {
    if (typeof window.eliminarMazoModal === 'function') {
        window.eliminarMazoModal(id);
    }
}

// Funciones globales para manejar modales (copiado de usuarios.js)
window.mostrarModal = function(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (overlay) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

window.cerrarModal = function(elementId) {
    const modal = document.getElementById(elementId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        const form = modal.querySelector('form');
        if (form) form.reset();
    }
}

// Alias para compatibilidad
window.ocultarModal = function(overlayId) {
    cerrarModal(overlayId);
}

// Alias legacy para compatibilidad
window.abrirModal = window.mostrarModal;

// Cerrar modal al hacer clic fuera
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        window.ocultarModal(e.target.id);
    }
});
