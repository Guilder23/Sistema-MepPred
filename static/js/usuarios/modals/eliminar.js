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
            mostrarAlerta('¡Usuario eliminado exitosamente!', 'success');
            ocultarModal('modalEliminarOverlay');
            if (typeof cargarUsuarios === 'function') {
                cargarUsuarios();
            }
        } else {
            mostrarAlerta(data.error || 'Error al eliminar usuario', 'danger');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarAlerta('Error al eliminar usuario', 'danger');
    });
}
