// Script para modal de editar materia

document.addEventListener('DOMContentLoaded', function() {
    const formEditar = document.getElementById('formEditarMateria');
    const btnActualizar = document.getElementById('btnActualizarMateria');
    const btnCancelar = document.getElementById('btnCancelarEditarMateria');
    const modalOverlay = document.getElementById('modalEditarOverlay');

    if (formEditar) {
        formEditar.addEventListener('submit', function(e) {
            e.preventDefault();
            actualizarMateria();
        });
        
        // Validaciones en tiempo real
        const inputNombre = formEditar.querySelector('#editarNombre');
        const inputDescripcion = formEditar.querySelector('#editarDescripcion');
        
        if (inputNombre) {
            inputNombre.addEventListener('blur', validarNombreMateria);
            inputNombre.addEventListener('input', validarNombreMateria);
        }
        
        if (inputDescripcion) {
            inputDescripcion.addEventListener('blur', validarDescripcionMateria);
            inputDescripcion.addEventListener('input', validarDescripcionMateria);
        }
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

function validarNombreMateria(e) {
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

function validarDescripcionMateria(e) {
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

function actualizarMateria() {
    const id = document.getElementById('editarId').value;
    const nombre = document.getElementById('editarNombre').value.trim();
    const descripcion = document.getElementById('editarDescripcion').value.trim();
    const requiereSuscripcion = document.getElementById('editarRequiereSuscripcion').checked;

    // Validación
    if (!nombre) {
        mostrarErrorMensaje(document.getElementById('editarNombre'), 'El nombre es requerido');
        document.getElementById('editarNombre').focus();
        return;
    }

    if (nombre.length < 3) {
        mostrarErrorMensaje(document.getElementById('editarNombre'), 'Mínimo 3 caracteres');
        document.getElementById('editarNombre').focus();
        return;
    }

    if (nombre.length > 200) {
        mostrarErrorMensaje(document.getElementById('editarNombre'), 'Máximo 200 caracteres');
        document.getElementById('editarNombre').focus();
        return;
    }

    if (descripcion && descripcion.length > 500) {
        mostrarErrorMensaje(document.getElementById('editarDescripcion'), 'Máximo 500 caracteres');
        document.getElementById('editarDescripcion').focus();
        return;
    }

    // Enviar al servidor
    const btnActualizar = document.getElementById('btnActualizarMateria');
    if (btnActualizar) btnActualizar.disabled = true;

    fetch(`/materias/api/materias/${id}/editar/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            nombre: nombre,
            descripcion: descripcion,
            requiere_suscripcion: requiereSuscripcion
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
