// Lógica para el modal de crear usuario

document.addEventListener('DOMContentLoaded', function() {
    // Listener para abrir el modal
    const btnAbrirCrear = document.getElementById('btnAbrirCrear');
    if (btnAbrirCrear) {
        btnAbrirCrear.addEventListener('click', function() {
            mostrarModal('modalCrearOverlay');
        });
    }

    // Listener para el formulario
    const formCrear = document.getElementById('formCrear');
    if (formCrear) {
        formCrear.addEventListener('submit', crearUsuario);
        
        // Agregar validaciones en tiempo real
        const inputNombre = formCrear.querySelector('input[name="nombre"]');
        const inputEmail = formCrear.querySelector('input[name="email"]');
        const inputUsername = formCrear.querySelector('input[name="username"]');
        const inputPassword = formCrear.querySelector('input[name="password"]');
        const inputPassword2 = formCrear.querySelector('input[name="password2"]');
        
        if (inputNombre) {
            inputNombre.addEventListener('blur', validarNombre);
            inputNombre.addEventListener('input', validarNombre);
        }
        if (inputUsername) {
            inputUsername.addEventListener('blur', validarUsuario);
            inputUsername.addEventListener('input', validarUsuario);
        }
        if (inputPassword) {
            inputPassword.addEventListener('blur', validarContraseña);
            inputPassword.addEventListener('input', validarContraseña);
        }
        if (inputPassword2) {
            inputPassword2.addEventListener('blur', function() {
                validarCoincidenciaContraseña(inputPassword, inputPassword2);
            });
            inputPassword2.addEventListener('input', function() {
                validarCoincidenciaContraseña(inputPassword, inputPassword2);
            });
        }
        
        // Agregar toggle de contraseñas
        const toggleButtons = formCrear.querySelectorAll('.toggle-password');
        toggleButtons.forEach(button => {
            button.addEventListener('click', togglePasswordVisibility);
        });
    }
});

function togglePasswordVisibility(e) {
    e.preventDefault();
    const targetName = e.currentTarget.getAttribute('data-target');
    const inputGroup = e.currentTarget.parentElement;
    const input = inputGroup.querySelector(`input[name="${targetName}"]`);
    const icon = e.currentTarget.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        e.currentTarget.classList.add('active');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        e.currentTarget.classList.remove('active');
    }
}

function validarNombre(e) {
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

function validarUsuario(e) {
    const valor = e.target.value.trim();
    const regex = /^[a-zA-Z0-9_.-]{3,150}$/;
    
    if (valor && !regex.test(valor)) {
        e.target.classList.add('is-invalid');
        mostrarMensajeError(e.target, 'Solo letras, números, guiones y puntos');
    } else if (valor.length < 3 && valor.length > 0) {
        e.target.classList.add('is-invalid');
        mostrarMensajeError(e.target, 'Mínimo 3 caracteres');
    } else {
        e.target.classList.remove('is-invalid');
        limpiarMensajeError(e.target);
    }
}

function validarContraseña(e) {
    const valor = e.target.value;
    
    if (valor.length > 0 && valor.length < 8) {
        e.target.classList.add('is-invalid');
        mostrarMensajeError(e.target, 'Mínimo 8 caracteres');
    } else if (valor.length > 128) {
        e.target.classList.add('is-invalid');
        mostrarMensajeError(e.target, 'Máximo 128 caracteres');
    } else {
        e.target.classList.remove('is-invalid');
        limpiarMensajeError(e.target);
    }
}

function validarCoincidenciaContraseña(pass1Input, pass2Input) {
    const pass1 = pass1Input.value;
    const pass2 = pass2Input.value;
    
    if (pass1 !== pass2 && pass2.length > 0) {
        pass2Input.classList.add('is-invalid');
        mostrarMensajeError(pass2Input, 'Las contraseñas no coinciden');
    } else if (pass1 === pass2 && pass2.length > 0) {
        pass2Input.classList.remove('is-invalid');
        limpiarMensajeError(pass2Input);
    }
}

function mostrarMensajeError(elemento, mensaje) {
    limpiarMensajeError(elemento);
    const divError = document.createElement('small');
    divError.className = 'form-text text-danger';
    divError.textContent = mensaje;
    divError.style.display = 'block';
    divError.style.marginTop = '0.25rem';
    
    // Si el elemento está dentro de un input-group, insertar en el form-group
    const inputGroup = elemento.closest('.input-group');
    if (inputGroup) {
        const formGroup = inputGroup.closest('.form-group');
        if (formGroup) {
            inputGroup.classList.add('is-invalid');
            formGroup.appendChild(divError);
        }
    } else {
        elemento.parentNode.appendChild(divError);
    }
}

function limpiarMensajeError(elemento) {
    // Si está en un input-group
    const inputGroup = elemento.closest('.input-group');
    if (inputGroup) {
        inputGroup.classList.remove('is-invalid');
        const formGroup = inputGroup.closest('.form-group');
        if (formGroup) {
            const error = formGroup.querySelector('.form-text.text-danger');
            if (error) {
                error.remove();
            }
        }
    } else {
        const error = elemento.parentNode.querySelector('.form-text.text-danger');
        if (error) {
            error.remove();
        }
    }
}

function crearUsuario(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const formCrear = document.getElementById('formCrear');
    
    // Validar todos los campos
    const nombre = formCrear.querySelector('input[name="nombre"]').value.trim();
    const email = formCrear.querySelector('input[name="email"]').value.trim();
    const username = formCrear.querySelector('input[name="username"]').value.trim();
    const password = formCrear.querySelector('input[name="password"]').value;
    const password2 = formCrear.querySelector('input[name="password2"]').value;

    // Validar nombre
    const regexNombre = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,150}$/;
    if (!regexNombre.test(nombre)) {
        mostrarAlerta('El nombre debe contener solo letras (3-150 caracteres)', 'danger');
        return;
    }

    // Validar email
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(email)) {
        mostrarAlerta('Por favor ingresa un email válido', 'danger');
        return;
    }

    // Validar usuario
    const regexUsuario = /^[a-zA-Z0-9_.-]{3,150}$/;
    if (!regexUsuario.test(username)) {
        mostrarAlerta('Usuario inválido (3-150 caracteres, solo letras, números, guiones y puntos)', 'danger');
        return;
    }

    // Validar contraseña
    if (password.length < 8 || password.length > 128) {
        mostrarAlerta('La contraseña debe tener entre 8 y 128 caracteres', 'danger');
        return;
    }

    // Validar coincidencia de contraseñas
    if (password !== password2) {
        mostrarAlerta('Las contraseñas no coinciden', 'danger');
        return;
    }
    
    fetch('/usuarios/api/crear/', {
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
            cerrarModal('modalCrearOverlay');
            const form = document.getElementById('formCrear');
            if (form) {
                form.reset();
            }
            if (data.warning) {
                mostrarMensaje('Advertencia', data.warning, 'warning');
            } else {
                mostrarMensaje('Éxito', data.message || 'Usuario creado correctamente', 'success');
            }
        } else {
            mostrarMensaje('Error', data.error || 'Error al crear el usuario', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarMensaje('Error', 'Error al crear el usuario', 'error');
    });
}
