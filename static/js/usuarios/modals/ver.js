// Lógica para el modal de ver usuario

// La función verUsuario es llamada desde el HTML generado dinámicamente
function verUsuario(usuarioId) {
    console.log('Obteniendo usuario:', usuarioId);
    fetch(`/usuarios/api/obtener/${usuarioId}/`)
        .then(response => response.json())
        .then(usuario => {
            console.log('Usuario obtenido:', usuario);
            let htmlContenido = `
                <div class="info-row">
                    <label>Nombre:</label>
                    <span>${usuario.first_name || usuario.username}</span>
                </div>
                <div class="info-row">
                    <label>Usuario:</label>
                    <span>${usuario.username}</span>
                </div>
                <div class="info-row">
                    <label>Email:</label>
                    <span>${usuario.email}</span>
                </div>
                <div class="info-row">
                    <label>Carnet de Identidad:</label>
                    <span>${usuario.identity_number || 'No registrado'}</span>
                </div>
                <div class="info-row">
                    <label>Rol:</label>
                    <span class="badge">${usuario.role === 'admin' ? 'Administrador' : 'Estudiante'}</span>
                </div>
                <div class="info-row">
                    <label>Estado:</label>
                    <span class="badge ${usuario.is_active ? 'badge-activo' : 'badge-inactivo'}">
                        ${usuario.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                </div>
                <div class="info-row">
                    <label>Fecha Creación:</label>
                    <span>${new Date(usuario.date_joined).toLocaleDateString()}</span>
                </div>
            `;
            const contentDiv = document.getElementById('verUsuarioContent');
            if (contentDiv) {
                contentDiv.innerHTML = htmlContenido;
                mostrarModal('modalVerOverlay');
            }
        })
        .catch(error => console.error('Error:', error));
}
