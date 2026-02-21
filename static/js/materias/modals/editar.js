// Script para modal de editar materia

document.addEventListener('DOMContentLoaded', function() {
    const formEditar = document.getElementById('formEditarMateria');
    const btnActualizar = document.getElementById('btnActualizarMateria');

    if (formEditar) {
        formEditar.addEventListener('submit', function(e) {
            e.preventDefault();
            actualizarMateria();
        });
        
        // Validaciones en tiempo real
        const inputNombre = formEditar.querySelector('#editarNombre');
        const inputDescripcion = formEditar.querySelector('#editarDescripcion');
        
        if (inputNombre) {
            inputNombre.addEventListener('blur', validarNombreMateriaEditar);
            inputNombre.addEventListener('input', validarNombreMateriaEditar);
        }
        
        if (inputDescripcion) {
            inputDescripcion.addEventListener('blur', validarDescripcionMateriaEditar);
            inputDescripcion.addEventListener('input', validarDescripcionMateriaEditar);
        }
    }

    if (btnActualizar) {
        btnActualizar.addEventListener('click', actualizarMateria);
    }

    // Cerrar modal al hacer clic en X
    const btnClose = document.querySelector('#modalEditarOverlay .modal-close-btn');
    if (btnClose) {
        btnClose.addEventListener('click', function() {
            cerrarModal('modalEditarOverlay');
        });
    }

    // Cerrar modal al hacer clic fuera del modal
    const modalOverlay = document.querySelector('#modalEditarOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                cerrarModal('modalEditarOverlay');
            }
        });
    }
});

function validarNombreMateriaEditar(e) {
    const valor = e.target.value.trim();
    
    if (valor && valor.length < 3) {
        e.target.classList.add('modal-editar-form-control-error');
        mostrarErrorMensajeEditar(e.target, 'Mínimo 3 caracteres');
    } else if (valor && valor.length > 150) {
        e.target.classList.add('modal-editar-form-control-error');
        mostrarErrorMensajeEditar(e.target, 'Máximo 150 caracteres');
    } else {
        e.target.classList.remove('modal-editar-form-control-error');
        limpiarErrorMensajeEditar(e.target);
    }
}

function validarDescripcionMateriaEditar(e) {
    const valor = e.target.value.trim();
    
    if (valor && valor.length > 500) {
        e.target.classList.add('modal-editar-form-control-error');
        mostrarErrorMensajeEditar(e.target, 'Máximo 500 caracteres');
    } else {
        e.target.classList.remove('modal-editar-form-control-error');
        limpiarErrorMensajeEditar(e.target);
    }
}

function mostrarErrorMensajeEditar(elemento, mensaje) {
    limpiarErrorMensajeEditar(elemento);
    const divError = document.createElement('small');
    divError.className = 'modal-editar-form-error';
    divError.textContent = mensaje;
    divError.style.display = 'block';
    divError.style.marginTop = '0.25rem';
    divError.style.color = '#ef4444';
    divError.style.fontSize = '0.875rem';
    elemento.parentNode.appendChild(divError);
}

function limpiarErrorMensajeEditar(elemento) {
    const error = elemento.parentNode.querySelector('.modal-editar-form-error');
    if (error) {
        error.remove();
    }
}

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

    if (nombre.length > 150) {
        mostrarError('editarNombre', 'El nombre no puede exceder 150 caracteres');
        return;
    }

    if (descripcion && descripcion.length > 500) {
        mostrarError('editarDescripcion', 'La descripción no puede exceder 500 caracteres');
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
            mostrarMensaje('Éxito', data.message || 'Materia actualizada correctamente', 'success');
        } else {
            mostrarMensaje('Error', data.error || 'Error al actualizar la materia', 'error');
        }
    })
    .catch(error => {
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
