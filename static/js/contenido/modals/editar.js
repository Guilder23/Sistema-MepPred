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
            document.getElementById('editarNivelCurso').value = data.nivel_curso || '';
            document.getElementById('editarTipoContenido').value = data.tipo_contenido;
            document.getElementById('editarEstado').value = data.estado;
            document.getElementById('editarPublicacion').value = data.publicacion;
            
            // Cargar materias primero
            cargarMateriasEditar(() => {
                // Seleccionar la materia actual
                if (data.materia_id) {
                    document.getElementById('editarMateria').value = data.materia_id;
                    // Después cargar temas de la materia seleccionada
                    cargarTemasEditarConTema(data.tema_id || data.tema);
                }
            });
            
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
            mostrarMensaje('Error', 'Error al cargar el contenido', 'error');
        });
}

// Cargar materias en editar
function cargarMateriasEditar(callback) {
    fetch('/temas/api/materias/')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const select = document.getElementById('editarMateria');
                if (select) {
                    const materiaActual = select.value;
                    select.innerHTML = '<option value="">Seleccione una materia</option>';
                    data.materias.forEach(materia => {
                        const option = document.createElement('option');
                        option.value = materia.id;
                        option.textContent = materia.nombre;
                        select.appendChild(option);
                    });
                    select.value = materiaActual;
                }
            }
            if (callback) callback();
        })
        .catch(error => console.error('Error al cargar materias:', error));
}

// Cargar temas filtrados para editar
function cargarTemasEditar() {
    const materiaSelect = document.getElementById('editarMateria');
    const temaSelect = document.getElementById('editarTema');
    
    if (!materiaSelect || !temaSelect || !materiaSelect.value) {
        temaSelect.innerHTML = '<option value="">Seleccione un tema</option>';
        return;
    }
    
    const temaActual = temaSelect.value;
    
    fetch(`/temas/api/temas/por-materia/${materiaSelect.value}/`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                temaSelect.innerHTML = '<option value="">Seleccione un tema</option>';
                data.temas.forEach(tema => {
                    const option = document.createElement('option');
                    option.value = tema.nombre;
                    option.textContent = tema.nombre;
                    temaSelect.appendChild(option);
                });
                temaSelect.value = temaActual;
            }
        })
        .catch(error => console.error('Error al cargar temas:', error));
}

// Cargar temas y luego seleccionar uno específico
function cargarTemasEditarConTema(temaBuscado) {
    const materiaSelect = document.getElementById('editarMateria');
    const temaSelect = document.getElementById('editarTema');
    
    if (!materiaSelect || !temaSelect || !materiaSelect.value) {
        temaSelect.innerHTML = '<option value="">Seleccione un tema</option>';
        return;
    }
    
    fetch(`/temas/api/temas/por-materia/${materiaSelect.value}/`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                temaSelect.innerHTML = '<option value="">Seleccione un tema</option>';
                data.temas.forEach(tema => {
                    const option = document.createElement('option');
                    option.value = tema.nombre;
                    option.textContent = tema.nombre;
                    temaSelect.appendChild(option);
                });
                // Seleccionar el tema buscado
                if (temaBuscado) {
                    temaSelect.value = temaBuscado;
                }
            }
        })
        .catch(error => console.error('Error al cargar temas:', error));
}

// Agregar campo de video en edición
document.addEventListener('DOMContentLoaded', function() {
    // Listener para cambio de materia
    const editarMateriaSelect = document.getElementById('editarMateria');
    if (editarMateriaSelect) {
        editarMateriaSelect.addEventListener('change', cargarTemasEditar);
    }

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
            mostrarMensaje('Éxito', data.message || '¡Contenido actualizado exitosamente!', 'success');
            cerrarModal('modalEditarOverlay');
            // Recargar la página para mostrar los cambios
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            mostrarMensaje('Error', data.message || data.error || 'Error al actualizar contenido', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarMensaje('Error', 'Error al actualizar contenido', 'error');
    });
}
