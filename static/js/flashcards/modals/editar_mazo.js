// Modal para editar mazo
let mazoSeleccionadoEditar = null;

document.addEventListener('DOMContentLoaded', function() {
    const formEditarMazo = document.getElementById('formEditarMazo');
    
    // Event listener para el formulario
    if (formEditarMazo) {
        formEditarMazo.addEventListener('submit', function(e) {
            e.preventDefault();
            guardarEditarMazo();
        });
    }
});

function abrirModalEditarMazo(mazoId) {
    mazoSeleccionadoEditar = mazoId;
    
    // Buscar el mazo en los datos disponibles
    if (window.flashcardsData && window.flashcardsData.mazos) {
        const mazo = window.flashcardsData.mazos.find(m => m.id == mazoId);
        if (mazo) {
            document.getElementById('editar-mazo-id').value = mazo.id;
            document.getElementById('edit-mazo-nombre').value = mazo.nombre;
            document.getElementById('edit-mazo-desc').value = mazo.descripcion || '';
        }
    }
    
    // Mostrar el modal
    mostrarModalMazo('modalEditarMazoOverlay');
    
    // Enfocar el campo de nombre
    document.getElementById('edit-mazo-nombre').focus();
}

function guardarEditarMazo() {
    const nombre = document.getElementById('edit-mazo-nombre').value.trim();
    const descripcion = document.getElementById('edit-mazo-desc').value.trim();
    
    if (!nombre) {
        mostrarMensaje('Error', 'Por favor ingresa un nombre para el mazo', 'error');
        document.getElementById('edit-mazo-nombre').focus();
        return;
    }
    
    // Enviar solicitud al servidor
    fetch(`/flashcards/api/editar-mazo/${mazoSeleccionadoEditar}/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            nombre: nombre,
            descripcion: descripcion
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarMensaje('Éxito', data.message || '¡Mazo actualizado exitosamente!', 'success');
            cerrarModalMazo('modalEditarMazoOverlay');
            
            // Recargar después de 1 segundo
            setTimeout(() => {
                location.reload();
            }, 1000);
        } else {
            mostrarMensaje('Error', data.error || 'Error al editar el mazo', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarMensaje('Error', 'Error al editar el mazo', 'error');
    });
}
