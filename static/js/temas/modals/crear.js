// Script para modal de crear Tema

document.addEventListener('DOMContentLoaded', function() {
    const formCrear = document.getElementById('formCrearTema');
    const btnGuardar = document.getElementById('btnGuardarTema');
    const btnCancelar = document.getElementById('btnCancelarTema');
    const modalOverlay = document.getElementById('modalCrearOverlay');

    if (formCrear) {
        formCrear.addEventListener('submit', function(e) {
            e.preventDefault();
            guardarTema();
        });
        
        // Validaciones en tiempo real
        const inputNombre = formCrear.querySelector('#crearNombre');
        const inputDescripcion = formCrear.querySelector('#crearDescripcion');
        
        if (inputNombre) {
            inputNombre.addEventListener('blur', validarNombreTema);
            inputNombre.addEventListener('input', validarNombreTema);
        }
        
        if (inputDescripcion) {
            inputDescripcion.addEventListener('blur', validarDescripcionTema);
            inputDescripcion.addEventListener('input', validarDescripcionTema);
        }
    }

    if (btnGuardar) {
        btnGuardar.addEventListener('click', guardarTema);
    }

    if (btnCancelar) {
        btnCancelar.addEventListener('click', function() {
            cerrarModal('modalCrearOverlay');
        });
    }

    // Cerrar modal al hacer clic en X
    const btnClose = document.querySelector('.modal-crear-btn-close');
    if (btnClose) {
        btnClose.addEventListener('click', function() {
            cerrarModal('modalCrearOverlay');
        });
    }

    // Cerrar modal al hacer clic fuera del modal
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                cerrarModal('modalCrearOverlay');
            }
        });
    }

    // Cerrar modal con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('active')) {
            cerrarModal('modalCrearOverlay');
        }
    });
});

function validarNombreTema(e) {
    const valor = e.target.value.trim();
    
    if (valor && valor.length < 3) {
        e.target.classList.add('modal-crear-form-control-error');
        mostrarErrorMensaje(e.target, 'Mínimo 3 caracteres');
    } else if (valor && valor.length > 200) {
        e.target.classList.add('modal-crear-form-control-error');
        mostrarErrorMensaje(e.target, 'Máximo 200 caracteres');
    } else {
        e.target.classList.remove('modal-crear-form-control-error');
        limpiarErrorMensaje(e.target);
    }
}

function validarDescripcionTema(e) {
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

function guardarTema() {
    const nombre = document.getElementById('crearNombre').value.trim();
    const materiaId = document.getElementById('crearMateria').value;
    const descripcion = document.getElementById('crearDescripcion').value.trim();
    const requiereSuscripcion = document.getElementById('crearRequiereSuscripcion').checked;

    // Validación
    if (!nombre) {
        mostrarErrorMensaje(document.getElementById('crearNombre'), 'El nombre es requerido');
        document.getElementById('crearNombre').focus();
        return;
    }

    if (!materiaId) {
        mostrarErrorMensaje(document.getElementById('crearMateria'), 'La materia es requerida');
        document.getElementById('crearMateria').focus();
        return;
    }

    if (nombre.length < 3) {
        mostrarErrorMensaje(document.getElementById('crearNombre'), 'Mínimo 3 caracteres');
        document.getElementById('crearNombre').focus();
        return;
    }

    if (nombre.length > 200) {
        mostrarErrorMensaje(document.getElementById('crearNombre'), 'Máximo 200 caracteres');
        document.getElementById('crearNombre').focus();
        return;
    }

    if (descripcion && descripcion.length > 500) {
        mostrarErrorMensaje(document.getElementById('crearDescripcion'), 'Máximo 500 caracteres');
        document.getElementById('crearDescripcion').focus();
        return;
    }

    // Enviar al servidor
    const btnGuardar = document.getElementById('btnGuardarTema');
    if (btnGuardar) btnGuardar.disabled = true;

    fetch('/temas/api/temas/crear/', {
        method: 'POST',
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
            cerrarModal('modalCrearOverlay');
            mostrarMensaje('Éxito', data.message || 'Tema creado correctamente', 'success');
        } else {
            mostrarMensaje('Error', data.error || 'Error al crear el tema', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarMensaje('Error', 'Error al crear el tema', 'error');
    })
    .finally(() => {
        if (btnGuardar) btnGuardar.disabled = false;
    });
}

