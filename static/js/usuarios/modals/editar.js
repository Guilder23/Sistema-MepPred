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
            
            // Manejar toggle switch
            const toggleSwitch = document.getElementById('editActivo');
            if (toggleSwitch) {
                // Limpiar event listeners previos clonando el nodo
                const newToggle = toggleSwitch.cloneNode(true);
                toggleSwitch.parentNode.replaceChild(newToggle, toggleSwitch);
                
                if (usuario.is_active) {
                    newToggle.classList.add('active');
                } else {
                    newToggle.classList.remove('active');
                }
                
                // Agregar evento click al toggle
                newToggle.addEventListener('click', function() {
                    this.classList.toggle('active');
                });
            }
            
            mostrarModal('modalEditarOverlay');
        })
        .catch(error => console.error('Error:', error));
}

function editarUsuario(e) {
    e.preventDefault();
    
    const usuarioId = document.getElementById('usuarioIdEditar').value;
    const toggleSwitch = document.getElementById('editActivo');
    const isActive = toggleSwitch.classList.contains('active');
    
    const formData = new FormData(this);
    formData.set('id', usuarioId);
    formData.set('is_active', isActive);
    
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
