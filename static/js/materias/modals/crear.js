// Script para modal de crear materia

document.addEventListener('DOMContentLoaded', function() {
    const formCrear = document.getElementById('formCrearMateria');
    const btnGuardar = document.getElementById('btnGuardarMateria');

    if (formCrear) {
        formCrear.addEventListener('submit', function(e) {
            e.preventDefault();
            guardarMateria();
        });
        
        // Validaciones en tiempo real
        const inputNombre = formCrear.querySelector('#crearNombre');
        const inputDescripcion = formCrear.querySelector('#crearDescripcion');
        
        if (inputNombre) {
            inputNombre.addEventListener('blur', validarNombreMateria);
            inputNombre.addEventListener('input', validarNombreMateria);
        }
        
        if (inputDescripcion) {
            inputDescripcion.addEventListener('blur', validarDescripcionMateria);
            inputDescripcion.addEventListener('input', validarDescripcionMateria);
        }
    }

    if (btnGuardar) {
        btnGuardar.addEventListener('click', guardarMateria);
    }

    // Cerrar modal al hacer clic en X
    const btnClose = document.querySelector('.modal-close-btn');
    if (btnClose) {
        btnClose.addEventListener('click', function() {
            cerrarModal('modalCrearOverlay');
        });
    }

    // Cerrar modal al hacer clic fuera del modal
    const modalOverlay = document.querySelector('#modalCrearOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                cerrarModal('modalCrearOverlay');
            }
        });
    }
});

function validarNombreMateria(e) {
    const valor = e.target.value.trim();
    
    if (valor && valor.length < 3) {
        e.target.classList.add('modal-crear-form-control-error');
        mostrarErrorMensaje(e.target, 'Mínimo 3 caracteres');
    } else if (valor && valor.length > 150) {
        e.target.classList.add('modal-crear-form-control-error');
        mostrarErrorMensaje(e.target, 'Máximo 150 caracteres');
    } else {
        e.target.classList.remove('modal-crear-form-control-error');
        limpiarErrorMensaje(e.target);
    }
}

function validarDescripcionMateria(e) {
    const valor = e.target.value.trim();
    
    if (valor && valor.length > 500) {
        e.target.classList.add('modal-crear-form-control-error');
        mostrarErrorMensaje(e.target, 'Máximo 500 caracteres');
    } else {
        e.target.classList.remove('modal-crear-form-control-error');
        limpiarErrorMensaje(e.target);
    }
}

function mostrarErrorMensaje(elemento, mensaje) {
    limpiarErrorMensaje(elemento);
    const divError = document.createElement('small');
    divError.className = 'modal-crear-form-error';
    divError.textContent = mensaje;
    divError.style.display = 'block';
    divError.style.marginTop = '0.25rem';
    divError.style.color = '#ef4444';
    divError.style.fontSize = '0.875rem';
    elemento.parentNode.appendChild(divError);
}

function limpiarErrorMensaje(elemento) {
    const error = elemento.parentNode.querySelector('.modal-crear-form-error');
    if (error) {
        error.remove();
    }
}

function guardarMateria() {
    const nombre = document.getElementById('crearNombre').value.trim();
    const descripcion = document.getElementById('crearDescripcion').value.trim();

    // Validación
    if (!nombre) {
        mostrarError('crearNombre', 'El nombre es requerido');
        return;
    }

    if (nombre.length < 3) {
        mostrarError('crearNombre', 'El nombre debe tener al menos 3 caracteres');
        return;
    }

    if (nombre.length > 150) {
        mostrarError('crearNombre', 'El nombre no puede exceder 150 caracteres');
        return;
    }

    if (descripcion && descripcion.length > 500) {
        mostrarError('crearDescripcion', 'La descripción no puede exceder 500 caracteres');
        return;
    }

    // Enviar al servidor
    const btnGuardar = document.getElementById('btnGuardarMateria');
    if (btnGuardar) btnGuardar.disabled = true;

    fetch('/materias/api/materias/crear/', {
        method: 'POST',
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
            cerrarModal('modalCrearOverlay');
            mostrarMensaje('Éxito', data.message || 'Materia creada correctamente', 'success');
        } else {
            mostrarMensaje('Error', data.error || 'Error al crear la materia', 'error');
        }
    })
    .catch(error => {
        mostrarMensaje('Error', 'Error al crear la materia', 'error');
    })
    .finally(() => {
        if (btnGuardar) btnGuardar.disabled = false;
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
