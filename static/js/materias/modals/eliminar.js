// Script para modal de eliminar materia

document.addEventListener('DOMContentLoaded', function() {
    const btnEliminar = document.getElementById('btnEliminarMateria');

    if (btnEliminar) {
        btnEliminar.addEventListener('click', eliminarMateria);
    }

    // Cerrar modal al hacer clic en X
    const btnClose = document.querySelector('#modalEliminarOverlay .modal-close-btn');
    if (btnClose) {
        btnClose.addEventListener('click', function() {
            cerrarModal('modalEliminarOverlay');
        });
    }

    // Cerrar modal al hacer clic fuera del modal
    const modalOverlay = document.querySelector('#modalEliminarOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                cerrarModal('modalEliminarOverlay');
            }
        });
    }
});

function eliminarMateria() {
    const id = document.getElementById('idMateriaEliminar').value;
    const btnEliminar = document.getElementById('btnEliminarMateria');

    if (!id) return;

    if (btnEliminar) btnEliminar.disabled = true;

    // Enviar solicitud de eliminación al backend
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
            mostrarMensaje('Éxito', data.message || 'Materia eliminada correctamente', 'success');
        } else {
            // Backend retorna error si tiene temas o cualquier otro problema
            cerrarModal('modalEliminarOverlay');
            mostrarMensaje('No se puede eliminar', data.error || 'Error al eliminar la materia', 'error');
        }
    })
    .catch(error => {
        mostrarMensaje('Error', 'Error al eliminar la materia', 'error');
    })
    .finally(() => {
        if (btnEliminar) btnEliminar.disabled = false;
    });
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
