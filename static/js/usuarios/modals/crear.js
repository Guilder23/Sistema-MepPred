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
    }
});

function crearUsuario(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    
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
            mostrarAlerta('¡Usuario creado exitosamente!', 'success');
            ocultarModal('modalCrearOverlay');
            this.reset();
            if (typeof cargarUsuarios === 'function') {
                cargarUsuarios();
            }
        } else {
            mostrarAlerta(data.error || 'Error al crear usuario', 'danger');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarAlerta('Error al crear usuario', 'danger');
    });
}
