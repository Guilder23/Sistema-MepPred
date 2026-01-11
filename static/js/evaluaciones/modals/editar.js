// Script para modal de editar examen

document.addEventListener('DOMContentLoaded', function() {
    const formEditar = document.getElementById('formEditarExamen');
    const btnActualizar = document.getElementById('btnActualizarExamen');
    const btnCancelar = document.getElementById('btnCancelarEditarExamen');

    if (formEditar) {
        formEditar.addEventListener('submit', function(e) {
            e.preventDefault();
            actualizarExamen();
        });
    }

    if (btnActualizar) {
        btnActualizar.addEventListener('click', actualizarExamen);
    }

    if (btnCancelar) {
        btnCancelar.addEventListener('click', function() {
            cerrarModal('modalEditarOverlay');
        });
    }

    // Cerrar modal al hacer clic en X
    const btnClose = document.querySelector('.modal-editar-btn-close');
    if (btnClose) {
        btnClose.addEventListener('click', function() {
            cerrarModal('modalEditarOverlay');
        });
    }

    // Cerrar modal al hacer clic fuera del modal
    const modalOverlay = document.querySelector('.modal-editar-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                cerrarModal('modalEditarOverlay');
            }
        });
    }
});

function actualizarExamen() {
    const id = document.getElementById('editarId').value;
    const titulo = document.getElementById('editarTitulo').value.trim();
    const materiaId = document.getElementById('editarMateria').value;
    const descripcion = document.getElementById('editarDescripcion').value.trim();
    const duracion = document.getElementById('editarDuracion').value;
    const activo = document.getElementById('editarActivo').checked;

    // Validación
    if (!titulo) {
        mostrarMensaje('El título es requerido', 'error');
        document.getElementById('editarTitulo').focus();
        return;
    }

    if (!materiaId) {
        mostrarMensaje('Debe seleccionar una materia', 'error');
        document.getElementById('editarMateria').focus();
        return;
    }

    if (!duracion || duracion < 1) {
        mostrarMensaje('La duración debe ser mayor a 0', 'error');
        document.getElementById('editarDuracion').focus();
        return;
    }

    // Enviar al servidor
    const btnActualizar = document.getElementById('btnActualizarExamen');
    if (btnActualizar) btnActualizar.disabled = true;

    fetch(`/examenes/api/examenes/${id}/actualizar/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            titulo: titulo,
            materia_id: parseInt(materiaId),
            descripcion: descripcion,
            duracion_minutos: parseInt(duracion),
            activo: activo
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarMensaje('Examen actualizado correctamente', 'success');
            cerrarModal('modalEditarOverlay');
            cargarExamenes();
        } else {
            mostrarMensaje(data.error || 'Error al actualizar el examen', 'error');
        }
    })
    .catch(error => {
        mostrarMensaje('Error al actualizar el examen', 'error');
    })
    .finally(() => {
        if (btnActualizar) btnActualizar.disabled = false;
    });
}
