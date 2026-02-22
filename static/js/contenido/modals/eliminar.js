// Lógica para el modal de eliminar contenido

let contenidoIdAEliminar = null;

function abrirModalEliminar(contenidoId, contenidoNombre) {
    contenidoIdAEliminar = contenidoId;
    const nombreElement = document.getElementById('nombreContenidoEliminar');
    if (nombreElement) {
        nombreElement.textContent = contenidoNombre;
    }
    const overlay = document.getElementById('modalEliminarOverlay');
    if (overlay) {
        overlay.classList.add('active');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const btnEliminarContenido = document.getElementById('btnEliminarContenido');
    if (btnEliminarContenido) {
        btnEliminarContenido.addEventListener('click', eliminarContenido);
    }
});

function eliminarContenido() {
    if (!contenidoIdAEliminar) return;
    
    fetch(`/contenido/api/contenidos/${contenidoIdAEliminar}/eliminar/`, {
        method: 'DELETE',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarMensaje('Éxito', data.message || '¡Contenido eliminado exitosamente!', 'success');
            cerrarModal('modalEliminarOverlay');
            contenidoIdAEliminar = null;
            // Recargar la página para actualizar la lista
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            mostrarMensaje('Error', data.message || 'Error al eliminar contenido', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarMensaje('Error', 'Error al eliminar contenido', 'error');
    });
}
