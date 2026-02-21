// Lógica para el modal de editar usuario

document.addEventListener('DOMContentLoaded', function() {
    const formEditar = document.getElementById('formEditar');
    if (formEditar) {
        formEditar.addEventListener('submit', editarUsuario);
        
        // Agregar validaciones en tiempo real
        const inputNombre = formEditar.querySelector('input[name="nombre"]');
        const inputEmail = formEditar.querySelector('input[name="email"]');
        
        if (inputNombre) {
            inputNombre.addEventListener('blur', validarNombreEditar);
            inputNombre.addEventListener('input', validarNombreEditar);
        }
        if (inputEmail) {
            inputEmail.addEventListener('blur', validarEmailEditar);
            inputEmail.addEventListener('input', validarEmailEditar);
        }
    }
});

function validarNombreEditar(e) {
    const valor = e.target.value.trim();
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,150}$/;
    
    if (valor && !regex.test(valor)) {
        e.target.classList.add('is-invalid');
        mostrarMensajeError(e.target, 'Solo letras, mínimo 3 caracteres');
    } else if (valor.length < 3 && valor.length > 0) {
        e.target.classList.add('is-invalid');
        mostrarMensajeError(e.target, 'Mínimo 3 caracteres');
    } else {
        e.target.classList.remove('is-invalid');
        limpiarMensajeError(e.target);
    }
}

function validarEmailEditar(e) {
    const valor = e.target.value.trim();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (valor && !regex.test(valor)) {
        e.target.classList.add('is-invalid');
        mostrarMensajeError(e.target, 'Email inválido');
    } else {
        e.target.classList.remove('is-invalid');
        limpiarMensajeError(e.target);
    }
}

function mostrarMensajeError(elemento, mensaje) {
    limpiarMensajeError(elemento);
    const divError = document.createElement('small');
    divError.className = 'form-text text-danger';
    divError.textContent = mensaje;
    divError.style.display = 'block';
    divError.style.marginTop = '0.25rem';
    elemento.parentNode.appendChild(divError);
}

function limpiarMensajeError(elemento) {
    const error = elemento.parentNode.querySelector('.form-text.text-danger');
    if (error) {
        error.remove();
    }
}

function abrirModalEditar(usuarioId) {
    console.log('Abriendo modal editar para usuario:', usuarioId);
    fetch(`/usuarios/api/obtener/${usuarioId}/`)
        .then(response => response.json())
        .then(usuario => {
            document.getElementById('usuarioIdEditar').value = usuario.id;
            document.getElementById('editNombre').value = usuario.first_name || '';
            document.getElementById('editEmail').value = usuario.email;
            document.getElementById('editRole').value = usuario.role || 'student';
            const studyYearInput = document.getElementById('editStudyYear');
            if (studyYearInput) {
                studyYearInput.value = usuario.study_year || 'pre_uni';
            }
            
            // Manejar select de estado
            const activeSelect = document.getElementById('editActivoSelect');
            if (activeSelect) {
                activeSelect.value = usuario.is_active ? 'true' : 'false';
            }
            
            mostrarModal('modalEditarOverlay');
        })
        .catch(error => console.error('Error:', error));
}

function editarUsuario(e) {
    e.preventDefault();
    
    const usuarioId = document.getElementById('usuarioIdEditar').value;
    const isActive = document.getElementById('editActivoSelect').value === 'true';
    
    const formData = new FormData();
    formData.append('id', usuarioId);
    formData.append('is_active', isActive);
    
    fetch('/usuarios/api/editar/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            cargarUsuarios();
            cerrarModal('modalEditarOverlay');
            mostrarMensaje('Éxito', data.message || 'Usuario actualizado correctamente', 'success');
        } else {
            mostrarMensaje('Error', data.error || 'Error al actualizar el usuario', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarMensaje('Error', 'Error al actualizar el usuario', 'error');
    });
}
