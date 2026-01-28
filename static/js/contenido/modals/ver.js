// Lógica para el modal de ver contenido

function verContenido(contenidoId) {
    fetch(`/contenido/api/contenidos/${contenidoId}/`)
        .then(response => response.json())
        .then(data => {
            // Llenar los campos del modal
            document.getElementById('verTitulo').textContent = data.titulo;
            document.getElementById('verDescripcion').textContent = data.descripcion;
            document.getElementById('verContenidoTema').textContent = data.contenido_tema;
            document.getElementById('verMateria').textContent = data.materia;
            document.getElementById('verNivelCurso').textContent = data.nivel_curso;
            document.getElementById('verTipoContenido').textContent = data.tipo_contenido === 'universitario' ? 'Universitario' : 'Postulante';
            
            // Estado y publicación con badges
            document.getElementById('verEstado').innerHTML = `
                <span class="badge badge-${data.estado}">
                    ${data.estado === 'activo' ? 'Activo' : 'Inactivo'}
                </span>
            `;
            
            document.getElementById('verPublicacion').innerHTML = `
                <span class="badge badge-${data.publicacion === 'publicado' ? 'publicado' : 'no-publicado'}">
                    ${data.publicacion === 'publicado' ? 'Publicado' : 'No Publicado'}
                </span>
            `;
            
            // Videos
            const videosContainer = document.getElementById('verVideos');
            if (data.videos && data.videos.length > 0) {
                videosContainer.innerHTML = data.videos.map((video, index) => `
                    <div class="video-item">
                        <i class="fas fa-play-circle"></i>
                        <a href="${video.enlace}" target="_blank" rel="noopener noreferrer">
                            Video ${index + 1}: ${video.enlace}
                        </a>
                    </div>
                `).join('');
            } else {
                videosContainer.innerHTML = '<p class="detalle-valor">No hay videos asociados</p>';
            }
            
            // Información de auditoría
            document.getElementById('verCreadoPor').textContent = data.creado_por;
            document.getElementById('verFechaCreacion').textContent = data.fecha_creacion;
            document.getElementById('verEditadoPor').textContent = data.editado_por;
            document.getElementById('verFechaEdicion').textContent = data.fecha_edicion;
            
            mostrarModal('modalVerOverlay');
        })
        .catch(error => {
            console.error('Error al cargar contenido:', error);
            mostrarAlerta('Error al cargar el contenido', 'danger');
        });
}
