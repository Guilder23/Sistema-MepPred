// Script para modal de crear examen

document.addEventListener('DOMContentLoaded', function() {
    const formCrear = document.getElementById('formCrearExamen');
    const btnGuardar = document.getElementById('btnGuardarExamen');
    const btnCancelar = document.getElementById('btnCancelarExamen');

    if (formCrear) {
        formCrear.addEventListener('submit', function(e) {
            e.preventDefault();
            guardarExamen();
        });
        
        // Validaciones en tiempo real
        const inputTitulo = formCrear.querySelector('#crearTitulo');
        const inputDescripcion = formCrear.querySelector('#crearDescripcion');
        const inputDuracion = formCrear.querySelector('#crearDuracion');
        
        if (inputTitulo) {
            inputTitulo.addEventListener('blur', validarTituloExamen);
            inputTitulo.addEventListener('input', validarTituloExamen);
        }
        
        if (inputDescripcion) {
            inputDescripcion.addEventListener('blur', validarDescripcionExamen);
            inputDescripcion.addEventListener('input', validarDescripcionExamen);
        }
        
        if (inputDuracion) {
            inputDuracion.addEventListener('blur', validarDuracionExamen);
            inputDuracion.addEventListener('input', validarDuracionExamen);
        }
    }

    if (btnGuardar) {
        btnGuardar.addEventListener('click', guardarExamen);
    }

    if (btnCancelar) {
        btnCancelar.addEventListener('click', function() {
            cerrarModal('modalCrearOverlay');
        });
    }

    // Cerrar modal al hacer clic en X
    const btnClose = document.querySelector('#modalCrearExamen .modal-close-btn');
    if (btnClose) {
        btnClose.addEventListener('click', function() {
            cerrarModal('modalCrearOverlay');
        });
    }

    // Cerrar modal al hacer clic fuera del modal
    const modalOverlay = document.getElementById('modalCrearOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                cerrarModal('modalCrearOverlay');
            }
        });
    }
});

function validarTituloExamen(e) {
    const valor = e.target.value.trim();
    
    if (valor && valor.length < 3) {
        e.target.classList.add('form-control-error');
        mostrarErrorMensajeExamen(e.target, 'Mínimo 3 caracteres');
    } else if (valor && valor.length > 150) {
        e.target.classList.add('form-control-error');
        mostrarErrorMensajeExamen(e.target, 'Máximo 150 caracteres');
    } else {
        e.target.classList.remove('form-control-error');
        limpiarErrorMensajeExamen(e.target);
    }
}

function validarDescripcionExamen(e) {
    const valor = e.target.value.trim();
    
    if (valor && valor.length > 500) {
        e.target.classList.add('form-control-error');
        mostrarErrorMensajeExamen(e.target, 'Máximo 500 caracteres');
    } else {
        e.target.classList.remove('form-control-error');
        limpiarErrorMensajeExamen(e.target);
    }
}

function validarDuracionExamen(e) {
    const valor = parseInt(e.target.value);
    
    if (valor < 1) {
        e.target.classList.add('form-control-error');
        mostrarErrorMensajeExamen(e.target, 'Mínimo 1 minuto');
    } else if (valor > 1440) {
        e.target.classList.add('form-control-error');
        mostrarErrorMensajeExamen(e.target, 'Máximo 1440 minutos (24 horas)');
    } else {
        e.target.classList.remove('form-control-error');
        limpiarErrorMensajeExamen(e.target);
    }
}

function mostrarErrorMensajeExamen(elemento, mensaje) {
    limpiarErrorMensajeExamen(elemento);
    const divError = document.createElement('small');
    divError.className = 'form-error';
    divError.textContent = mensaje;
    divError.style.display = 'block';
    divError.style.marginTop = '0.25rem';
    divError.style.color = '#ef4444';
    divError.style.fontSize = '0.875rem';
    elemento.parentNode.appendChild(divError);
}

function limpiarErrorMensajeExamen(elemento) {
    const error = elemento.parentNode.querySelector('.form-error');
    if (error) {
        error.remove();
    }
}

function guardarExamen() {
    const titulo = document.getElementById('crearTitulo').value.trim();
    const materiaId = document.getElementById('crearTema').value;
    const descripcion = document.getElementById('crearDescripcion').value.trim();
    const duracion = parseInt(document.getElementById('crearDuracion').value);
    const activo = document.getElementById('crearActivo').checked;

    // Validación
    if (!titulo) {
        mostrarMensaje('Error', 'El título es requerido', 'error');
        document.getElementById('crearTitulo').focus();
        return;
    }

    if (titulo.length < 3 || titulo.length > 150) {
        mostrarMensaje('Error', 'El título debe tener entre 3 y 150 caracteres', 'error');
        return;
    }

    if (!materiaId) {
        mostrarMensaje('Error', 'Debe seleccionar un tema', 'error');
        document.getElementById('crearTema').focus();
        return;
    }

    if (descripcion && descripcion.length > 500) {
        mostrarMensaje('Error', 'La descripción no puede exceder 500 caracteres', 'error');
        return;
    }

    if (!duracion || duracion < 1 || duracion > 1440) {
        mostrarMensaje('Error', 'La duración debe estar entre 1 y 1440 minutos', 'error');
        document.getElementById('crearDuracion').focus();
        return;
    }

    // Enviar al servidor
    const btnGuardar = document.getElementById('btnGuardarExamen');
    if (btnGuardar) btnGuardar.disabled = true;

    fetch('/examenes/api/examenes/crear/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            titulo: titulo,
            tema_id: parseInt(materiaId),
            descripcion: descripcion,
            duracion_minutos: parseInt(duracion),
            activo: activo,
            preguntas: []
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarMensaje('Éxito', data.message || 'Examen creado correctamente', 'success');
            cerrarModal('modalCrearOverlay');
            cargarExamenes();
        } else {
            mostrarMensaje('Error', data.error || 'Error al crear el examen', 'error');
        }
    })
    .catch(error => {
        mostrarMensaje('Error', 'Error al crear el examen', 'error');
    })
    .finally(() => {
        if (btnGuardar) btnGuardar.disabled = false;
    });
}
