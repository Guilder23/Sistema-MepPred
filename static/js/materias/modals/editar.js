// Script para modal de editar materia

document.addEventListener('DOMContentLoaded', function() {
    const formEditar = document.getElementById('formEditarMateria');
    const btnActualizar = document.getElementById('btnActualizarMateria');
    const btnCancelar = document.getElementById('btnCancelarEditarMateria');

    if (formEditar) {
        formEditar.addEventListener('submit', function(e) {
            e.preventDefault();
            actualizarMateria();
        });
    }

    if (btnActualizar) {
        btnActualizar.addEventListener('click', actualizarMateria);
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

function actualizarMateria() {
    const id = document.getElementById('editarId').value;
    const nombre = document.getElementById('editarNombre').value.trim();
    const descripcion = document.getElementById('editarDescripcion').value.trim();

    // Validación
    if (!nombre) {
        mostrarError('editarNombre', 'El nombre es requerido');
        return;
    }

    if (nombre.length < 3) {
        mostrarError('editarNombre', 'El nombre debe tener al menos 3 caracteres');
        return;
    }

    // Enviar al servidor
    const btnActualizar = document.getElementById('btnActualizarMateria');
    if (btnActualizar) btnActualizar.disabled = true;

    fetch(`/materias/api/materias/${id}/actualizar/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            nombre: nombre,
            descripcion: descripcion
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Recargar tabla
            cargarMaterias();
            cerrarModal('modalEditarOverlay');
            mostrarMensaje('Éxito', 'Materia actualizada correctamente', 'success');
        } else {
            mostrarMensaje('Error', data.error || 'Error al actualizar la materia', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarMensaje('Error', 'Error al actualizar la materia', 'error');
    })
    .finally(() => {
        if (btnActualizar) btnActualizar.disabled = false;
    });
}

function mostrarError(elementId, mensaje) {
    const elemento = document.getElementById(elementId);
    if (elemento) {
        elemento.focus();
        elemento.style.borderColor = '#dc3545';
        
        // Mostrar mensaje de error debajo del campo
        let errorMsg = elemento.parentElement.querySelector('.error-message');
        if (!errorMsg) {
            errorMsg = document.createElement('div');
            errorMsg.className = 'error-message show';
            elemento.parentElement.appendChild(errorMsg);
        }
        errorMsg.textContent = mensaje;
        errorMsg.classList.add('show');

        // Limpiar error al escribir
        elemento.addEventListener('input', function() {
            elemento.style.borderColor = '';
            if (errorMsg) errorMsg.classList.remove('show');
        }, { once: true });
    }
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
