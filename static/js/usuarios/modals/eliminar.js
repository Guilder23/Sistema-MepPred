// Lógica para el modal de eliminar usuario

let usuarioSeleccionadoEliminar = null;
let nuevoEstadoUsuario = null;

document.addEventListener('DOMContentLoaded', function() {
    const btnConfirmar = document.getElementById('btnConfirmarEliminar');
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', confirmarEliminar);
    }
});

function abrirModalEliminar(usuarioId, estadoActual) {
    console.log('Abriendo modal de estado para usuario:', usuarioId);
    nuevoEstadoUsuario = !estadoActual;

    fetch(`/usuarios/api/obtener/${usuarioId}/`)
        .then(response => response.json())
        .then(usuario => {
            usuarioSeleccionadoEliminar = usuario;
            document.getElementById('eliminarNombre').textContent = usuario.first_name || usuario.username;

            const accionTexto = nuevoEstadoUsuario ? 'activar' : 'desactivar';
            const titulo = document.getElementById('modalEstadoTitulo');
            const accionEstadoTexto = document.getElementById('accionEstadoTexto');
            const estadoDescripcion = document.getElementById('estadoDescripcion');
            const btnConfirmar = document.getElementById('btnConfirmarEliminar');

            if (titulo) {
                titulo.textContent = nuevoEstadoUsuario ? 'Activar usuario' : 'Desactivar usuario';
            }
            if (accionEstadoTexto) {
                accionEstadoTexto.textContent = accionTexto;
            }
            if (estadoDescripcion) {
                estadoDescripcion.textContent = 'Podrás revertir esta acción en cualquier momento.';
            }
            if (btnConfirmar) {
                btnConfirmar.textContent = nuevoEstadoUsuario ? 'Activar Usuario' : 'Desactivar Usuario';
                btnConfirmar.classList.remove('btn-success', 'btn-warning');
                btnConfirmar.classList.add(nuevoEstadoUsuario ? 'btn-success' : 'btn-warning');
            }

            mostrarModal('modalEliminarOverlay');
        })
        .catch(error => console.error('Error:', error));
}

function confirmarEliminar() {
    if (!usuarioSeleccionadoEliminar || nuevoEstadoUsuario === null) return;

    const formData = new FormData();
    formData.append('is_active', nuevoEstadoUsuario ? 'true' : 'false');

    fetch(`/usuarios/api/toggle-estado/${usuarioSeleccionadoEliminar.id}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            cargarUsuarios();
            cerrarModal('modalEliminarOverlay');
            mostrarMensaje('Éxito', data.message || `Usuario ${nuevoEstadoUsuario ? 'activado' : 'desactivado'} correctamente`, 'success');
        } else {
            cerrarModal('modalEliminarOverlay');
            mostrarMensaje('Error', data.error || 'No se pudo actualizar el estado del usuario', 'error');
        }

        usuarioSeleccionadoEliminar = null;
        nuevoEstadoUsuario = null;
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarMensaje('Error', 'No se pudo actualizar el estado del usuario', 'error');
        usuarioSeleccionadoEliminar = null;
        nuevoEstadoUsuario = null;
    });
}
