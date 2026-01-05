// Script para modal de crear materia

document.addEventListener('DOMContentLoaded', function() {
    const formCrear = document.getElementById('formCrearMateria');
    const btnGuardar = document.getElementById('btnGuardarMateria');
    const btnCancelar = document.getElementById('btnCancelarMateria');

    if (formCrear) {
        formCrear.addEventListener('submit', function(e) {
            e.preventDefault();
            guardarMateria();
        });
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
    const modalOverlay = document.querySelector('.modal-crear-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                cerrarModal('modalCrearOverlay');
            }
        });
    }
});

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
            mostrarMensaje('Éxito', 'Materia creada correctamente', 'success');
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
