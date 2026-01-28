// Modal para eliminar mazo
let mazoEliminarModal = null;
let btnCancelarEliminarMazo = null;
let btnConfirmarEliminarMazo = null;
let inputEliminarMazoNombre = null;
let mazoSeleccionadoEliminar = null;

document.addEventListener('DOMContentLoaded', function() {
    // Obtener referencias a los elementos del modal
    mazoEliminarModal = document.getElementById('modal-eliminar-mazo');
    btnCancelarEliminarMazo = document.getElementById('cancelar-eliminar-mazo');
    btnConfirmarEliminarMazo = document.getElementById('confirmar-eliminar-mazo');
    inputEliminarMazoNombre = document.getElementById('eliminar-mazo-nombre');
    
    const closeBtn = mazoEliminarModal.querySelector('.close');
    
    // Event listeners
    if (btnCancelarEliminarMazo) {
        btnCancelarEliminarMazo.addEventListener('click', cerrarModalEliminarMazo);
    }
    
    if (btnConfirmarEliminarMazo) {
        btnConfirmarEliminarMazo.addEventListener('click', confirmarEliminarMazo);
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', cerrarModalEliminarMazo);
    }
    
    // Cerrar modal cuando se hace clic fuera del contenido
    if (mazoEliminarModal) {
        mazoEliminarModal.addEventListener('click', function(event) {
            if (event.target === mazoEliminarModal) {
                cerrarModalEliminarMazo();
            }
        });
    }
});

function abrirModalEliminarMazo(mazoId, mazoNombre) {
    mazoSeleccionadoEliminar = mazoId;
    inputEliminarMazoNombre.textContent = mazoNombre;
    
    // Mostrar el modal
    mazoEliminarModal.classList.add('show');
}

function cerrarModalEliminarMazo() {
    mazoEliminarModal.classList.remove('show');
    mazoSeleccionadoEliminar = null;
}

function confirmarEliminarMazo() {
    if (!mazoSeleccionadoEliminar) return;
    
    // Desabilitar el botón mientras se elimina
    btnConfirmarEliminarMazo.disabled = true;
    btnConfirmarEliminarMazo.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
    
    // Enviar solicitud al servidor
    fetch(`/flashcards/api/eliminar-mazo/${mazoSeleccionadoEliminar}/`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': flashcardsData.csrfToken
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Cerrar el modal
            cerrarModalEliminarMazo();
            
            // Recargar los mazos (if function exists)
            if (window.cargarMazos) {
                window.cargarMazos();
            } else {
                location.reload();
            }
        } else {
            alert('Error al eliminar el mazo: ' + (data.error || 'Error desconocido'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al eliminar el mazo');
    })
    .finally(() => {
        // Reabilitar el botón
        btnConfirmarEliminarMazo.disabled = false;
        btnConfirmarEliminarMazo.innerHTML = '<i class="fas fa-trash"></i> Eliminar';
    });
}
