// Script para modal de eliminar Tema

document.addEventListener('DOMContentLoaded', function() {
    const modalOverlay = document.getElementById('modalEliminarOverlay');
    const btnEliminar = document.getElementById('btnEliminarTema');
    const btnCancelar = document.getElementById('btnCancelarEliminarTema');

    if (btnEliminar) {
        btnEliminar.addEventListener('click', confirmarEliminacion);
    }

    if (btnCancelar) {
        btnCancelar.addEventListener('click', function() {
            cerrarModal('modalEliminarOverlay');
        });
    }

    // Cerrar modal al hacer clic en X
    const btnClose = document.querySelector('.modal-eliminar-btn-close');
    if (btnClose) {
        btnClose.addEventListener('click', function() {
            cerrarModal('modalEliminarOverlay');
        });
    }

    // Cerrar modal al hacer clic fuera del modal
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                cerrarModal('modalEliminarOverlay');
            }
        });
    }

    // Cerrar modal con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('active')) {
            cerrarModal('modalEliminarOverlay');
        }
    });
});

function confirmarEliminacion() {
    const id = document.getElementById('idTemaEliminar').value;
    
    if (!id) {
        mostrarMensaje('Error', 'ID de tema no especificado', 'error');
        return;
    }

    // Enviar solicitud de eliminación
    const btnEliminar = document.getElementById('btnEliminarTema');
    if (btnEliminar) btnEliminar.disabled = true;

    fetch(`/temas/api/temas/${id}/eliminar/`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Recargar tabla
            cargarTemas();
            cerrarModal('modalEliminarOverlay');
            mostrarMensaje('Éxito', 'Tema eliminado correctamente', 'success');
        } else {
            cerrarModal('modalEliminarOverlay');
            mostrarMensaje('Error', data.error || 'Error al eliminar el tema', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        cerrarModal('modalEliminarOverlay');
        mostrarMensaje('Error', 'Error al eliminar el tema', 'error');
    })
    .finally(() => {
        if (btnEliminar) btnEliminar.disabled = false;
    });
}

