// Modal para crear nuevo mazo

document.addEventListener('DOMContentLoaded', function() {
    const formCrearMazo = document.getElementById('formCrearMazo');
    const btnAbrirCrearMazo = document.getElementById('btn-abrir-crear-mazo');
    
    // Event listener para abrir modal
    if (btnAbrirCrearMazo) {
        btnAbrirCrearMazo.addEventListener('click', function() {
            mostrarModalMazo('modalCrearMazoOverlay');
            document.getElementById('crear-mazo-nombre').focus();
        });
    }
    
    // Event listener para el formulario
    if (formCrearMazo) {
        formCrearMazo.addEventListener('submit', function(e) {
            e.preventDefault();
            crearMazo();
        });
    }
});

function crearMazo() {
    const nombre = document.getElementById('crear-mazo-nombre').value.trim();
    const descripcion = document.getElementById('crear-mazo-desc').value.trim();
    
    if (!nombre) {
        mostrarMensaje('Error', 'Por favor ingresa un nombre para el mazo', 'error');
        document.getElementById('crear-mazo-nombre').focus();
        return;
    }
    
    // Enviar solicitud al servidor
    fetch('/flashcards/api/crear-mazo/', {
        method: 'POST',
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
            mostrarMensaje('Éxito', data.message || '¡Mazo creado exitosamente!', 'success');
            cerrarModalMazo('modalCrearMazoOverlay');
            
            // Limpiar formulario
            document.getElementById('formCrearMazo').reset();
            
            // Recargar después de 1 segundo
            setTimeout(() => {
                location.reload();
            }, 1000);
        } else {
            mostrarMensaje('Error', data.error || 'Error al crear el mazo', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarMensaje('Error', 'Error al crear el mazo', 'error');
    });
}
