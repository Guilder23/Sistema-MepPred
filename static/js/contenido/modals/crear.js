// Lógica para el modal de crear contenido

document.addEventListener('DOMContentLoaded', function() {
    // Listener para abrir el modal
    const btnAbrirCrear = document.getElementById('btnAbrirCrear');
    if (btnAbrirCrear) {
        btnAbrirCrear.addEventListener('click', function() {
            mostrarModal('modalCrearOverlay');
            cargarMateriasCrear();
            // Resetear el contenedor de videos
            const videosContainer = document.getElementById('videosContainer');
            if (videosContainer) {
                videosContainer.innerHTML = `
                    <div class="video-input-group mb-2">
                        <input type="url" class="form-control" name="videos[]" placeholder="Enlace del video">
                    </div>
                `;
            }
        });
    }

    // Listener para el botón "Agregar más video"
    const btnAgregarVideo = document.getElementById('btnAgregarVideo');
    if (btnAgregarVideo) {
        btnAgregarVideo.addEventListener('click', agregarCampoVideo);
    }

    // Listener para el formulario
    const formCrear = document.getElementById('formCrear');
    if (formCrear) {
        formCrear.addEventListener('submit', crearContenido);
    }
});

// Cargar materias en el modal crear
function cargarMateriasCrear() {
    fetch('/temas/api/materias/')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const select = document.getElementById('crearMateria');
                if (select) {
                    select.innerHTML = '<option value="">Seleccione una materia</option>';
                    data.materias.forEach(materia => {
                        const option = document.createElement('option');
                        option.value = materia.id;
                        option.textContent = materia.nombre;
                        select.appendChild(option);
                    });
                }
            }
        })
        .catch(error => console.error('Error al cargar materias:', error));
}

// Cargar temas filtrados para crear
function cargarTemasCrear() {
    const materiaSelect = document.getElementById('crearMateria');
    const temaSelect = document.getElementById('crearTema');
    
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
                    option.value = tema.id;
                    option.textContent = tema.nombre;
                    temaSelect.appendChild(option);
                });
            }
        })
        .catch(error => console.error('Error al cargar temas:', error));
}

function agregarCampoVideo() {
    const videosContainer = document.getElementById('videosContainer');
    const videoGroup = document.createElement('div');
    videoGroup.className = 'video-input-group mb-2';
    videoGroup.innerHTML = `
        <input type="url" class="form-control" name="videos[]" placeholder="Enlace del video">
        <button type="button" class="btn-remove-video" onclick="eliminarCampoVideo(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    videosContainer.appendChild(videoGroup);
}

function eliminarCampoVideo(btn) {
    btn.closest('.video-input-group').remove();
}

function crearContenido(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    
    fetch('/contenido/api/contenidos/crear/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarAlerta('¡Contenido creado exitosamente!', 'success');
            ocultarModal('modalCrearOverlay');
            this.reset();
            // Recargar la página para mostrar el nuevo contenido
            window.location.reload();
        } else {
            mostrarAlerta(data.error || 'Error al crear contenido', 'danger');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarAlerta('Error al crear contenido', 'danger');
    });
}
