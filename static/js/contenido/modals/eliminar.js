// Lógica para el modal de eliminar contenido

let contenidoIdAEliminar = null;

function abrirModalEliminar(contenidoId, contenidoNombre) {
    contenidoIdAEliminar = contenidoId;
    document.getElementById('eliminarContenidoNombre').textContent = contenidoNombre;
    mostrarModal('modalEliminarOverlay');
}

document.addEventListener('DOMContentLoaded', function() {
    const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');
    if (btnConfirmarEliminar) {
        btnConfirmarEliminar.addEventListener('click', eliminarContenido);
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
            mostrarAlerta('¡Contenido eliminado exitosamente!', 'success');
            ocultarModal('modalEliminarOverlay');
            contenidoIdAEliminar = null;
            // Recargar la página para actualizar la lista
            window.location.reload();
        } else {
            mostrarAlerta(data.error || 'Error al eliminar contenido', 'danger');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarAlerta('Error al eliminar contenido', 'danger');
    });
}
