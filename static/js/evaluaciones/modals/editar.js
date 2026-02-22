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
        
        // Validaciones en tiempo real
        const inputTitulo = formEditar.querySelector('#editarTitulo');
        const inputDescripcion = formEditar.querySelector('#editarDescripcion');
        const inputDuracion = formEditar.querySelector('#editarDuracion');
        
        if (inputTitulo) {
            inputTitulo.addEventListener('blur', validarTituloExamenEditar);
            inputTitulo.addEventListener('input', validarTituloExamenEditar);
        }
        
        if (inputDescripcion) {
            inputDescripcion.addEventListener('blur', validarDescripcionExamenEditar);
            inputDescripcion.addEventListener('input', validarDescripcionExamenEditar);
        }
        
        if (inputDuracion) {
            inputDuracion.addEventListener('blur', validarDuracionExamenEditar);
            inputDuracion.addEventListener('input', validarDuracionExamenEditar);
        }
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
    const btnClose = document.querySelector('#modalEditarExamen .modal-close-btn');
    if (btnClose) {
        btnClose.addEventListener('click', function() {
            cerrarModal('modalEditarOverlay');
        });
    }

    // Cerrar modal al hacer clic fuera del modal
    const modalOverlay = document.getElementById('modalEditarOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                cerrarModal('modalEditarOverlay');
            }
        });
    }
});

function validarTituloExamenEditar(e) {
    const valor = e.target.value.trim();
    
    if (valor && valor.length < 3) {
        e.target.classList.add('form-control-error');
        mostrarErrorMensajeExamenEditar(e.target, 'Mínimo 3 caracteres');
    } else if (valor && valor.length > 150) {
        e.target.classList.add('form-control-error');
        mostrarErrorMensajeExamenEditar(e.target, 'Máximo 150 caracteres');
    } else {
        e.target.classList.remove('form-control-error');
        limpiarErrorMensajeExamenEditar(e.target);
    }
}

function validarDescripcionExamenEditar(e) {
    const valor = e.target.value.trim();
    
    if (valor && valor.length > 500) {
        e.target.classList.add('form-control-error');
        mostrarErrorMensajeExamenEditar(e.target, 'Máximo 500 caracteres');
    } else {
        e.target.classList.remove('form-control-error');
        limpiarErrorMensajeExamenEditar(e.target);
    }
}

function validarDuracionExamenEditar(e) {
    const valor = parseInt(e.target.value);
    
    if (valor < 1) {
        e.target.classList.add('form-control-error');
        mostrarErrorMensajeExamenEditar(e.target, 'Mínimo 1 minuto');
    } else if (valor > 1440) {
        e.target.classList.add('form-control-error');
        mostrarErrorMensajeExamenEditar(e.target, 'Máximo 1440 minutos (24 horas)');
    } else {
        e.target.classList.remove('form-control-error');
        limpiarErrorMensajeExamenEditar(e.target);
    }
}

function mostrarErrorMensajeExamenEditar(elemento, mensaje) {
    limpiarErrorMensajeExamenEditar(elemento);
    const divError = document.createElement('small');
    divError.className = 'form-error';
    divError.textContent = mensaje;
    divError.style.display = 'block';
    divError.style.marginTop = '0.25rem';
    divError.style.color = '#ef4444';
    divError.style.fontSize = '0.875rem';
    elemento.parentNode.appendChild(divError);
}

function limpiarErrorMensajeExamenEditar(elemento) {
    const error = elemento.parentNode.querySelector('.form-error');
    if (error) {
        error.remove();
    }
}

function actualizarExamen() {
    const id = document.getElementById('editarId').value;
    const titulo = document.getElementById('editarTitulo').value.trim();
    const materiaId = document.getElementById('editarTema').value;
    const descripcion = document.getElementById('editarDescripcion').value.trim();
    const duracion = parseInt(document.getElementById('editarDuracion').value);
    const activo = document.getElementById('editarActivo').checked;

    // Validación
    if (!titulo) {
        mostrarMensaje('Error', 'El título es requerido', 'error');
        document.getElementById('editarTitulo').focus();
        return;
    }

    if (titulo.length < 3 || titulo.length > 150) {
        mostrarMensaje('Error', 'El título debe tener entre 3 y 150 caracteres', 'error');
        return;
    }

    if (!materiaId) {
        mostrarMensaje('Error', 'Debe seleccionar un tema', 'error');
        document.getElementById('editarTema').focus();
        return;
    }

    if (descripcion && descripcion.length > 500) {
        mostrarMensaje('Error', 'La descripción no puede exceder 500 caracteres', 'error');
        return;
    }

    if (!duracion || duracion < 1 || duracion > 1440) {
        mostrarMensaje('Error', 'La duración debe estar entre 1 y 1440 minutos', 'error');
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
            tema_id: parseInt(materiaId),
            descripcion: descripcion,
            duracion_minutos: duracion,
            activo: activo
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarMensaje('Éxito', data.message || 'Examen actualizado correctamente', 'success');
            cerrarModal('modalEditarOverlay');
            cargarExamenes();
        } else {
            mostrarMensaje('Error', data.error || 'Error al actualizar el examen', 'error');
        }
    })
    .catch(error => {
        mostrarMensaje('Error', 'Error al actualizar el examen', 'error');
    })
    .finally(() => {
        if (btnActualizar) btnActualizar.disabled = false;
    });
}
