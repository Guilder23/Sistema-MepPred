// Lógica para el modal de ver contenido

function verContenido(contenidoId) {
    fetch(`/contenido/api/contenidos/${contenidoId}/`)
        .then(response => response.json())
        .then(data => {
            const setText = (id, value) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value ?? '';
            };

            const setHtml = (id, value) => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = value ?? '';
            };

            // Llenar los campos del modal
            setText('verTitulo', data.titulo);
            setText('verDescripcion', data.descripcion);
            setText('verContenidoTema', data.contenido_tema);
            setText('verMateria', data.materia);
            setText('verTema', data.tema);
            setText('verNivelCurso', data.nivel_curso);
            setText('verTipoContenido', data.tipo_contenido === 'universitario' ? 'Universitario' : 'Postulante');
            
            // Estado y publicación con badges
            setHtml('verEstado', `
                <span class="badge badge-${data.estado}">
                    ${data.estado === 'activo' ? 'Activo' : 'Inactivo'}
                </span>
            `);
            
            setHtml('verPublicacion', `
                <span class="badge badge-${data.publicacion === 'publicado' ? 'publicado' : 'no-publicado'}">
                    ${data.publicacion === 'publicado' ? 'Publicado' : 'No Publicado'}
                </span>
            `);
            
            // Videos
            const videosContainer = document.getElementById('verVideos');
            if (data.videos && data.videos.length > 0) {
                if (videosContainer) {
                    videosContainer.innerHTML = data.videos.map((video, index) => `
                        <div class="video-item">
                            <i class="fas fa-play-circle"></i>
                            <a href="${video.enlace}" target="_blank" rel="noopener noreferrer">
                                Video ${index + 1}: ${video.enlace}
                            </a>
                        </div>
                    `).join('');
                }
            } else if (videosContainer) {
                videosContainer.innerHTML = '<p class="detalle-valor">No hay videos asociados</p>';
            }
            
            // Información de auditoría
            setText('verCreadoPor', data.creado_por);
            setText('verFechaCreacion', data.fecha_creacion);
            setText('verEditadoPor', data.editado_por);
            setText('verFechaEdicion', data.fecha_edicion);
            
            mostrarModal('modalVerOverlay');
        })
        .catch(error => {
            console.error('Error al cargar contenido:', error);
            mostrarMensaje('Error', 'Error al cargar el contenido', 'error');
        });
}
