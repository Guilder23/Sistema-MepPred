// Script para modal de crear materia

document.addEventListener('DOMContentLoaded', function() {
    const formCrear = document.getElementById('formCrearMateria');
    const btnGuardar = document.getElementById('btnGuardarMateria');
    const btnCancelar = document.getElementById('btnCancelarMateria');
    const modalOverlay = document.getElementById('modalCrearOverlay');

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

function validarNombreMateria(e) {
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
    const requiereSuscripcion = document.getElementById('crearRequiereSuscripcion').checked;

    // Validación
    if (!nombre) {
        mostrarErrorMensaje(document.getElementById('crearNombre'), 'El nombre es requerido');
        document.getElementById('crearNombre').focus();
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
            descripcion: descripcion,
            requiere_suscripcion: requiereSuscripcion
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Recargar tabla
            cargarMaterias();
            cerrarModal('modalCrearOverlay');
            mostrarMensaje('Éxito', 'Materia creada correctamente', 'success');
        } else {
            mostrarMensaje('Error', data.error || 'Error al crear la materia', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarMensaje('Error', 'Error al crear la materia', 'error');
    })
    .finally(() => {
        if (btnGuardar) btnGuardar.disabled = false;
    });
}
