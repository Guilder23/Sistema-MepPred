// Lógica para el modal de eliminar usuario

let usuarioSeleccionadoEliminar = null;

document.addEventListener('DOMContentLoaded', function() {
    const btnConfirmar = document.getElementById('btnConfirmarEliminar');
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', confirmarEliminar);
    }
});

function abrirModalEliminar(usuarioId) {
    console.log('Abriendo modal eliminar para usuario:', usuarioId);
    fetch(`/usuarios/api/obtener/${usuarioId}/`)
        .then(response => response.json())
        .then(usuario => {
            usuarioSeleccionadoEliminar = usuario;
            document.getElementById('eliminarNombre').textContent = usuario.first_name || usuario.username;
            mostrarModal('modalEliminarOverlay');
        })
        .catch(error => console.error('Error:', error));
}

function confirmarEliminar() {
    if (!usuarioSeleccionadoEliminar) return;
    
    fetch(`/usuarios/api/eliminar/${usuarioSeleccionadoEliminar.id}/`, {
        method: 'DELETE',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            cargarUsuarios();
            cerrarModal('modalEliminarOverlay');
            mostrarMensaje('Éxito', data.message || 'Usuario eliminado correctamente', 'success');
        } else {
            cerrarModal('modalEliminarOverlay');
            mostrarMensaje('No se puede eliminar', data.error || 'Error al eliminar el usuario', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarMensaje('Error', 'Error al eliminar el usuario', 'error');
    });
}
