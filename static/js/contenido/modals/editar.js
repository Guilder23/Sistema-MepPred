// Lógica para el modal de editar contenido

function abrirModalEditar(contenidoId) {
    fetch(`/contenido/api/contenidos/${contenidoId}/`)
        .then(response => response.json())
        .then(data => {
            // Llenar los campos del formulario
            document.getElementById('editarContenidoId').value = data.id;
            document.getElementById('editarTitulo').value = data.titulo;
            document.getElementById('editarDescripcion').value = data.descripcion;
            document.getElementById('editarContenidoTema').value = data.contenido_tema;
            document.getElementById('editarMateria').value = data.materia;
            document.getElementById('editarNivelCurso').value = data.nivel_curso;
            document.getElementById('editarEstado').value = data.estado;
            document.getElementById('editarPublicacion').value = data.publicacion;
            
            // Cargar videos existentes
            const videosContainer = document.getElementById('editarVideosContainer');
            videosContainer.innerHTML = '';
            
            if (data.videos && data.videos.length > 0) {
                data.videos.forEach(video => {
                    const videoGroup = document.createElement('div');
                    videoGroup.className = 'video-input-group mb-2';
                    videoGroup.innerHTML = `
                        <input type="url" class="form-control" name="videos[]" value="${video.enlace}" placeholder="Enlace del video">
                        <button type="button" class="btn-remove-video" onclick="eliminarCampoVideoEditar(this)">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    videosContainer.appendChild(videoGroup);
                });
            } else {
                videosContainer.innerHTML = `
                    <div class="video-input-group mb-2">
                        <input type="url" class="form-control" name="videos[]" placeholder="Enlace del video">
                    </div>
                `;
            }
            
            mostrarModal('modalEditarOverlay');
        })
        .catch(error => {
            console.error('Error al cargar contenido:', error);
            mostrarAlerta('Error al cargar el contenido', 'danger');
        });
}

// Agregar campo de video en edición
document.addEventListener('DOMContentLoaded', function() {
    const btnAgregarVideoEditar = document.getElementById('btnAgregarVideoEditar');
    if (btnAgregarVideoEditar) {
        btnAgregarVideoEditar.addEventListener('click', function() {
            const videosContainer = document.getElementById('editarVideosContainer');
            const videoGroup = document.createElement('div');
            videoGroup.className = 'video-input-group mb-2';
            videoGroup.innerHTML = `
                <input type="url" class="form-control" name="videos[]" placeholder="Enlace del video">
                <button type="button" class="btn-remove-video" onclick="eliminarCampoVideoEditar(this)">
                    <i class="fas fa-times"></i>
                </button>
            `;
            videosContainer.appendChild(videoGroup);
        });
    }

    // Listener para el formulario de editar
    const formEditar = document.getElementById('formEditar');
    if (formEditar) {
        formEditar.addEventListener('submit', editarContenido);
    }
});

function eliminarCampoVideoEditar(btn) {
    btn.closest('.video-input-group').remove();
}

function editarContenido(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    
    fetch('/contenido/api/contenidos/editar/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarAlerta('¡Contenido actualizado exitosamente!', 'success');
            ocultarModal('modalEditarOverlay');
            // Recargar la página para mostrar los cambios
            window.location.reload();
        } else {
            mostrarAlerta(data.error || 'Error al actualizar contenido', 'danger');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarAlerta('Error al actualizar contenido', 'danger');
    });
}
