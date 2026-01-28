// usuarios.js - Lógica principal y utilidades

// ==========================================
// UTILIDADES (Anteriormente en utils.js)
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

// Función para mostrar alertas (Sin Bootstrap)
function mostrarAlerta(mensaje, tipo) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo}`;
    alertDiv.style.cssText = 'padding: 1rem; border-radius: 4px; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;';
    
    // Establecer colores según el tipo
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

// ==========================================
// LÓGICA PRINCIPAL
// ==========================================

console.log('usuarios.js cargado');

// Funciones para mostrar/ocultar modales (Vanilla JS)
function mostrarModal(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (overlay) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function ocultarModal(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Cerrar modal al hacer click en el overlay
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                ocultarModal(this.id);
            }
        });
    });
});

// Cargar usuarios al iniciar
window.addEventListener('load', function() {
    console.log('Window load disparado');
    
    try {
        console.log('Inicializando aplicación de usuarios...');
        
        // Event listeners globales (Búsqueda y Filtro)
        const buscarEl = document.getElementById('buscar');
        const filtroEl = document.getElementById('filtroEstado');
        
        if (buscarEl) buscarEl.addEventListener('keyup', cargarUsuarios);
        if (filtroEl) filtroEl.addEventListener('change', cargarUsuarios);
        
        console.log('Event listeners globales configurados');
        console.log('Llamando cargarUsuarios()...');
        cargarUsuarios();
    } catch (error) {
        console.error('Error en window load:', error);
    }
});

// Cargar y mostrar usuarios
function cargarUsuarios() {
    console.log('cargarUsuarios() llamado');
    const buscarEl = document.getElementById('buscar');
    const filtroEl = document.getElementById('filtroEstado');
    
    const busqueda = buscarEl ? buscarEl.value : '';
    const filtro = filtroEl ? filtroEl.value : '';
    
    const url = `/usuarios/api/listar/?busqueda=${busqueda}&estado=${filtro}`;
    console.log('Fetching:', url);

    fetch(url)
        .then(response => {
            console.log('Response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Data recibida:', data);
            mostrarUsuarios(data);
        })
        .catch(error => console.error('Error en fetch:', error));
}

// Mostrar usuarios en la tabla
function mostrarUsuarios(usuarios) {
    const tbody = document.getElementById('usuariosTableBody');
    if (!tbody) {
        console.error('usuariosTableBody element not found');
        return;
    }
    
    tbody.innerHTML = '';

    if (!Array.isArray(usuarios) || usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No hay usuarios para mostrar</td></tr>';
        return;
    }

    usuarios.forEach(usuario => {
        const estadoBadge = usuario.is_active ? 
            '<span class="badge badge-activo">Activo</span>' : 
            '<span class="badge badge-inactivo">Inactivo</span>';

        // Formatear fecha de registro
        const fechaRegistro = usuario.date_joined ? new Date(usuario.date_joined).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : '-';

        const fila = `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar-circle me-2">${(usuario.first_name || usuario.username).charAt(0).toUpperCase()}</div>
                        <strong>${usuario.first_name || usuario.username}</strong>
                    </div>
                </td>
                <td>${usuario.email}</td>
                <td><span class="badge ${usuario.role === 'admin' ? 'bg-primary' : 'bg-secondary'}">${usuario.role === 'admin' ? 'Administrador' : 'Estudiante'}</span></td>
                <td>${estadoBadge}</td>
                <td>${fechaRegistro}</td>
                <td class="acciones-cell">
                    <div class="acciones-buttons">
                        <button class="btn-icon btn-ver" onclick="verUsuario('${usuario.id}')" title="Ver">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon btn-editar" onclick="abrirModalEditar('${usuario.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-eliminar" onclick="abrirModalEliminar('${usuario.id}')" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tbody.innerHTML += fila;
    });
}
