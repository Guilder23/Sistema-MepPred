// Lógica para el modal de crear contenido

document.addEventListener('DOMContentLoaded', function() {
    // Listener para abrir el modal
    const btnAbrirCrear = document.getElementById('btnAbrirCrear');
    if (btnAbrirCrear) {
        btnAbrirCrear.addEventListener('click', function() {
            mostrarModal('modalCrearOverlay');
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
