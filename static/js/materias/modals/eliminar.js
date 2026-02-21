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

    // Verificar si la materia tiene temas
    fetch(`/temas/api/temas/por-materia/${id}/`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.temas && data.temas.length > 0) {
                // Si tiene temas, mostrar error y cerrar modal
                const materia = materiasData.find(m => m.id === parseInt(id));
                mostrarMensaje(
                    'No se puede eliminar',
                    `No puedes eliminar "${escapeHtml(materia.nombre)}" porque contiene ${data.temas.length} tema${data.temas.length > 1 ? 's' : ''}. Primero debes eliminar los temas asociados.`,
                    'error'
                );
                cerrarModal('modalEliminarOverlay');
                if (btnEliminar) btnEliminar.disabled = false;
                return;
            }
            
            // Si no tiene temas, proceder con la eliminación
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
                mostrarMensaje('Error', 'Error al eliminar la materia', 'error');
            })
            .finally(() => {
                if (btnEliminar) btnEliminar.disabled = false;
            });
        })
        .catch(error => {
            console.error('Error al verificar temas:', error);
            mostrarMensaje('Error', 'Error al verificar los temas de la materia', 'error');
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
