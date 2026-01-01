// Lógica para el modal de editar usuario

document.addEventListener('DOMContentLoaded', function() {
    const formEditar = document.getElementById('formEditar');
    if (formEditar) {
        formEditar.addEventListener('submit', editarUsuario);
    }
});

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
    
    const formData = new FormData(this);
    
    // El input hidden ya maneja el valor de is_active, pero nos aseguramos
    // de enviar el ID que a veces puede faltar en el formData si es un campo deshabilitado
    const usuarioId = document.getElementById('usuarioIdEditar').value;
    formData.set('id', usuarioId);
    
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
            mostrarAlerta('¡Usuario actualizado exitosamente!', 'success');
            ocultarModal('modalEditarOverlay');
            if (typeof cargarUsuarios === 'function') {
                cargarUsuarios();
            }
        } else {
            mostrarAlerta(data.error || 'Error al actualizar usuario', 'danger');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarAlerta('Error al actualizar usuario', 'danger');
    });
}
