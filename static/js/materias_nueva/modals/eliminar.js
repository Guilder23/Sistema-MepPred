// Script para modal de eliminar materia

document.addEventListener('DOMContentLoaded', function() {
    const modalOverlay = document.getElementById('modalEliminarOverlay');
    const btnEliminar = document.getElementById('btnEliminarMateria');
    const btnCancelar = document.getElementById('btnCancelarEliminarMateria');

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
    const id = document.getElementById('idMateriaEliminar').value;
    
    if (!id) {
        mostrarMensaje('Error', 'ID de materia no especificado', 'error');
        return;
    }

    // Enviar solicitud de eliminación
    const btnEliminar = document.getElementById('btnEliminarMateria');
    if (btnEliminar) btnEliminar.disabled = true;

    fetch(`/materias/api/materias/${id}/eliminar/`, {
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
            cargarMaterias();
            cerrarModal('modalEliminarOverlay');
            mostrarMensaje('Éxito', 'Materia eliminada correctamente', 'success');
        } else {
            mostrarMensaje('Error', data.error || 'Error al eliminar la materia', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarMensaje('Error', 'Error al eliminar la materia', 'error');
    })
    .finally(() => {
        if (btnEliminar) btnEliminar.disabled = false;
    });
}
