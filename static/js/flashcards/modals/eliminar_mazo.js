// Modal para eliminar mazo
let mazoSeleccionadoEliminar = null;

document.addEventListener('DOMContentLoaded', function() {
    const btnConfirmarEliminarMazo = document.getElementById('confirmar-eliminar-mazo');
    
    // Event listener para confirmar eliminación
    if (btnConfirmarEliminarMazo) {
        btnConfirmarEliminarMazo.addEventListener('click', confirmarEliminarMazo);
    }
});

function abrirModalEliminarMazo(mazoId, mazoNombre) {
    mazoSeleccionadoEliminar = mazoId;
    document.getElementById('eliminar-mazo-nombre').textContent = mazoNombre;
    
    // Mostrar el modal
    mostrarModalMazo('modalEliminarMazoOverlay');
}

function confirmarEliminarMazo() {
    if (!mazoSeleccionadoEliminar) return;
    
    // Enviar solicitud al servidor
    fetch(`/flashcards/api/eliminar-mazo/${mazoSeleccionadoEliminar}/`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarMensaje('Éxito', data.message || '¡Mazo eliminado exitosamente!', 'success');
            cerrarModalMazo('modalEliminarMazoOverlay');
            
            // Recargar después de 1 segundo
            setTimeout(() => {
                location.reload();
            }, 1000);
        } else {
            mostrarMensaje('Error', data.error || 'Error al eliminar el mazo', 'error');
            cerrarModalMazo('modalEliminarMazoOverlay');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarMensaje('Error', 'Error al eliminar el mazo', 'error');
        cerrarModalMazo('modalEliminarMazoOverlay');
    });
}
