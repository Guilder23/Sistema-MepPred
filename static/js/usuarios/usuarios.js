// Variables globales
let usuarioSeleccionado = null;

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
        
        // Event listeners
        const buscarEl = document.getElementById('buscar');
        const filtroEl = document.getElementById('filtroEstado');
        const formCrearEl = document.getElementById('formCrear');
        const formEditarEl = document.getElementById('formEditar');
        const btnConfirmarEl = document.getElementById('btnConfirmarEliminar');
        const btnAbrirCrearEl = document.getElementById('btnAbrirCrear');
        
        if (buscarEl) buscarEl.addEventListener('keyup', cargarUsuarios);
        if (filtroEl) filtroEl.addEventListener('change', cargarUsuarios);
        if (formCrearEl) formCrearEl.addEventListener('submit', crearUsuario);
        if (formEditarEl) formEditarEl.addEventListener('submit', editarUsuario);
        if (btnConfirmarEl) btnConfirmarEl.addEventListener('click', confirmarEliminar);
        if (btnAbrirCrearEl) btnAbrirCrearEl.addEventListener('click', function() {
            mostrarModal('modalCrearOverlay');
        });
        
        console.log('Event listeners configurados');
        
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
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No hay usuarios para mostrar</td></tr>';
        return;
    }

    usuarios.forEach(usuario => {
        const estadoBadge = usuario.is_active ? 
            '<span class="badge badge-activo">Activo</span>' : 
            '<span class="badge badge-inactivo">Inactivo</span>';

        const fila = `
            <tr>
                <td><strong>${usuario.first_name || usuario.username}</strong></td>
                <td>${usuario.email}</td>
                <td><span class="badge">${usuario.role === 'admin' ? 'Administrador' : 'Estudiante'}</span></td>
                <td>${estadoBadge}</td>
                <td>
                    <button class="btn-accion btn-ver" onclick="verUsuario(${usuario.id})">Ver</button>
                    <button class="btn-accion btn-editar" onclick="abrirModalEditar(${usuario.id})">Editar</button>
                    <button class="btn-accion btn-eliminar" onclick="abrirModalEliminar(${usuario.id})">Eliminar</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += fila;
    });
}

// Ver usuario
function verUsuario(usuarioId) {
    console.log('Obteniendo usuario:', usuarioId);
    fetch(`/usuarios/api/obtener/${usuarioId}/`)
        .then(response => response.json())
        .then(usuario => {
            console.log('Usuario obtenido:', usuario);
            let htmlContenido = `
                <div class="info-row">
                    <label>Nombre:</label>
                    <span>${usuario.first_name || usuario.username}</span>
                </div>
                <div class="info-row">
                    <label>Usuario:</label>
                    <span>${usuario.username}</span>
                </div>
                <div class="info-row">
                    <label>Email:</label>
                    <span>${usuario.email}</span>
                </div>
                <div class="info-row">
                    <label>Rol:</label>
                    <span class="badge">${usuario.role === 'admin' ? 'Administrador' : 'Estudiante'}</span>
                </div>
                <div class="info-row">
                    <label>Estado:</label>
                    <span class="badge ${usuario.is_active ? 'badge-activo' : 'badge-inactivo'}">
                        ${usuario.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                </div>
                <div class="info-row">
                    <label>Fecha Creación:</label>
                    <span>${new Date(usuario.date_joined).toLocaleDateString()}</span>
                </div>
            `;
            document.getElementById('verUsuarioContent').innerHTML = htmlContenido;
            mostrarModal('modalVerOverlay');
        })
        .catch(error => console.error('Error:', error));
}

// Crear usuario
function crearUsuario(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    
    fetch('/usuarios/api/crear/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarAlerta('¡Usuario creado exitosamente!', 'success');
            ocultarModal('modalCrearOverlay');
            this.reset();
            cargarUsuarios();
        } else {
            mostrarAlerta(data.error || 'Error al crear usuario', 'danger');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarAlerta('Error al crear usuario', 'danger');
    });
}

// Abrir modal editar
function abrirModalEditar(usuarioId) {
    console.log('Abriendo modal editar para usuario:', usuarioId);
    fetch(`/usuarios/api/obtener/${usuarioId}/`)
        .then(response => response.json())
        .then(usuario => {
            document.getElementById('usuarioIdEditar').value = usuario.id;
            document.getElementById('editNombre').value = usuario.first_name || '';
            document.getElementById('editEmail').value = usuario.email;
            document.getElementById('editRole').value = usuario.role || 'student';
            document.getElementById('editStudyYear').value = usuario.study_year || 'pre_uni';
            
            // Manejar toggle switch
            const toggleSwitch = document.getElementById('editActivo');
            if (usuario.is_active) {
                toggleSwitch.classList.add('active');
            } else {
                toggleSwitch.classList.remove('active');
            }
            
            // Agregar evento click al toggle
            toggleSwitch.addEventListener('click', function() {
                this.classList.toggle('active');
            });
            
            mostrarModal('modalEditarOverlay');
        })
        .catch(error => console.error('Error:', error));
}

// Editar usuario
function editarUsuario(e) {
    e.preventDefault();
    
    const usuarioId = document.getElementById('usuarioIdEditar').value;
    const toggleSwitch = document.getElementById('editActivo');
    const isActive = toggleSwitch.classList.contains('active');
    
    const formData = new FormData(this);
    formData.set('id', usuarioId);
    formData.set('is_active', isActive);
    
    fetch('/usuarios/api/editar/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarAlerta('¡Usuario actualizado exitosamente!', 'success');
            ocultarModal('modalEditarOverlay');
            cargarUsuarios();
        } else {
            mostrarAlerta(data.error || 'Error al actualizar usuario', 'danger');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarAlerta('Error al actualizar usuario', 'danger');
    });
}

// Abrir modal eliminar
function abrirModalEliminar(usuarioId) {
    console.log('Abriendo modal eliminar para usuario:', usuarioId);
    fetch(`/usuarios/api/obtener/${usuarioId}/`)
        .then(response => response.json())
        .then(usuario => {
            usuarioSeleccionado = usuario;
            document.getElementById('eliminarNombre').textContent = usuario.first_name || usuario.username;
            mostrarModal('modalEliminarOverlay');
        })
        .catch(error => console.error('Error:', error));
}

// Confirmar eliminación
function confirmarEliminar() {
    if (!usuarioSeleccionado) return;
    
    fetch(`/usuarios/api/eliminar/${usuarioSeleccionado.id}/`, {
        method: 'DELETE',
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarAlerta('¡Usuario eliminado exitosamente!', 'success');
            ocultarModal('modalEliminarOverlay');
            cargarUsuarios();
        } else {
            mostrarAlerta(data.error || 'Error al eliminar usuario', 'danger');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarAlerta('Error al eliminar usuario', 'danger');
    });
}
