// Script para modal de eliminar examen

document.addEventListener('DOMContentLoaded', function() {
    const btnEliminar = document.getElementById('btnEliminarExamen');
    const btnCancelar = document.getElementById('btnCancelarEliminarExamen');

    if (btnEliminar) {
        btnEliminar.addEventListener('click', eliminarExamen);
    }

    if (btnCancelar) {
        btnCancelar.addEventListener('click', function() {
            cerrarModal('modalEliminarOverlay');
        });
    }

    // Cerrar modal al hacer clic en X
    const btnClose = document.querySelector('#modalEliminarExamen .modal-close-btn');
    if (btnClose) {
        btnClose.addEventListener('click', function() {
            cerrarModal('modalEliminarOverlay');
        });
    }

    // Cerrar modal al hacer clic fuera del modal
    const modalOverlay = document.getElementById('modalEliminarOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                cerrarModal('modalEliminarOverlay');
            }
        });
    }
});

function eliminarExamen() {
    const id = document.getElementById('idExamenEliminar').value;
    const btnEliminar = document.getElementById('btnEliminarExamen');

    if (!id) return;

    if (btnEliminar) btnEliminar.disabled = true;

    fetch(`/examenes/api/examenes/${id}/eliminar/`, {
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
            cargarExamenes();
            cerrarModal('modalEliminarOverlay');
            mostrarMensaje('Éxito', 'Examen eliminado correctamente', 'success');
        } else {
            cerrarModal('modalEliminarOverlay');
            mostrarMensaje('Error', data.error || 'Error al eliminar el examen', 'error');
        }
    })
    .catch(error => {
        cerrarModal('modalEliminarOverlay');
        mostrarMensaje('Error', 'Error al eliminar el examen', 'error');
    })
    .finally(() => {
        if (btnEliminar) btnEliminar.disabled = false;
    });
}
