// Script para modal de editar Tema

document.addEventListener('DOMContentLoaded', function() {
    const formEditar = document.getElementById('formEditarTema');
    const btnActualizar = document.getElementById('btnActualizarTema');
    const btnCancelar = document.getElementById('btnCancelarEditarTema');
    const modalOverlay = document.getElementById('modalEditarOverlay');

    if (formEditar) {
        formEditar.addEventListener('submit', function(e) {
            e.preventDefault();
            actualizarTema();
        });
        
        // Validaciones en tiempo real
        const inputNombre = formEditar.querySelector('#inputNombreTemaEditar');
        const inputDescripcion = formEditar.querySelector('#textareaDescripcionTemaEditar');
        
        if (inputNombre) {
            inputNombre.addEventListener('blur', validarNombreTema);
            inputNombre.addEventListener('input', validarNombreTema);
        }
        
        if (inputDescripcion) {
            inputDescripcion.addEventListener('blur', validarDescripcionTema);
            inputDescripcion.addEventListener('input', validarDescripcionTema);
        }
    }

    if (btnActualizar) {
        btnActualizar.addEventListener('click', actualizarTema);
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
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                cerrarModal('modalEditarOverlay');
            }
        });
    }

    // Cerrar modal con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('active')) {
            cerrarModal('modalEditarOverlay');
        }
    });
});

function validarNombreTema(e) {
    const valor = e.target.value.trim();
    
    if (valor && valor.length < 3) {
        e.target.classList.add('modal-editar-form-control-error');
        mostrarErrorMensaje(e.target, 'Mínimo 3 caracteres');
    } else if (valor && valor.length > 200) {
        e.target.classList.add('modal-editar-form-control-error');
        mostrarErrorMensaje(e.target, 'Máximo 200 caracteres');
    } else {
        e.target.classList.remove('modal-editar-form-control-error');
        limpiarErrorMensaje(e.target);
    }
}

function validarDescripcionTema(e) {
    const valor = e.target.value.trim();
    
    if (valor && valor.length > 500) {
        e.target.classList.add('modal-editar-form-control-error');
        mostrarErrorMensaje(e.target, 'Máximo 500 caracteres');
    } else {
        e.target.classList.remove('modal-editar-form-control-error');
        limpiarErrorMensaje(e.target);
    }
}

function mostrarErrorMensaje(elemento, mensaje) {
    limpiarErrorMensaje(elemento);
    const divError = document.createElement('small');
    divError.className = 'modal-editar-form-error';
    divError.textContent = mensaje;
    divError.style.display = 'block';
    divError.style.marginTop = '0.25rem';
    divError.style.color = '#ef4444';
    divError.style.fontSize = '0.875rem';
    elemento.parentNode.appendChild(divError);
}

function limpiarErrorMensaje(elemento) {
    const error = elemento.parentNode.querySelector('.modal-editar-form-error');
    if (error) {
        error.remove();
    }
}

function actualizarTema() {
    const id = document.getElementById('inputIdTemaEditar').value;
    const nombre = document.getElementById('inputNombreTemaEditar').value.trim();
    const materiaId = document.getElementById('selectMateriaTemaEditar').value;
    const descripcion = document.getElementById('textareaDescripcionTemaEditar').value.trim();
    const requiereSuscripcion = document.getElementById('checkboxSuscripcionEditar').checked;

    // Validación
    if (!nombre) {
        mostrarErrorMensaje(document.getElementById('inputNombreTemaEditar'), 'El nombre es requerido');
        document.getElementById('inputNombreTemaEditar').focus();
        return;
    }

    if (!materiaId) {
        mostrarErrorMensaje(document.getElementById('selectMateriaTemaEditar'), 'La materia es requerida');
        document.getElementById('selectMateriaTemaEditar').focus();
        return;
    }

    if (nombre.length < 3) {
        mostrarErrorMensaje(document.getElementById('inputNombreTemaEditar'), 'Mínimo 3 caracteres');
        document.getElementById('inputNombreTemaEditar').focus();
        return;
    }

    if (nombre.length > 200) {
        mostrarErrorMensaje(document.getElementById('inputNombreTemaEditar'), 'Máximo 200 caracteres');
        document.getElementById('inputNombreTemaEditar').focus();
        return;
    }

    if (descripcion && descripcion.length > 500) {
        mostrarErrorMensaje(document.getElementById('textareaDescripcionTemaEditar'), 'Máximo 500 caracteres');
        document.getElementById('textareaDescripcionTemaEditar').focus();
        return;
    }

    // Enviar al servidor
    const btnActualizar = document.getElementById('btnActualizarTema');
    if (btnActualizar) btnActualizar.disabled = true;

    fetch(`/temas/api/temas/${id}/actualizar/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            nombre: nombre,
            materia_id: materiaId,
            descripcion: descripcion,
            requiere_suscripcion: requiereSuscripcion
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Recargar tabla
            cargarTemas();
            cerrarModal('modalEditarOverlay');
            mostrarMensaje('Éxito', data.message || 'Tema actualizado correctamente', 'success');
        } else {
            mostrarMensaje('Error', data.error || 'Error al actualizar el tema', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarMensaje('Error', 'Error al actualizar el tema', 'error');
    })
    .finally(() => {
        if (btnActualizar) btnActualizar.disabled = false;
    });
}

