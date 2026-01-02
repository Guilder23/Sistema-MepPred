// Modal para crear nuevo mazo
let mazoCrearModal = null;
let btnAbrirCrearMazo = null;
let btnCancelarCrearMazo = null;
let btnGuardarCrearMazo = null;
let inputCrearMazoNombre = null;
let inputCrearMazoDesc = null;

document.addEventListener('DOMContentLoaded', function() {
    // Obtener referencias a los elementos del modal
    mazoCrearModal = document.getElementById('modal-crear-mazo');
    btnAbrirCrearMazo = document.getElementById('btn-abrir-crear-mazo');
    btnCancelarCrearMazo = document.getElementById('cancelar-crear-mazo');
    btnGuardarCrearMazo = document.getElementById('guardar-crear-mazo');
    inputCrearMazoNombre = document.getElementById('crear-mazo-nombre');
    inputCrearMazoDesc = document.getElementById('crear-mazo-desc');
    
    const closeBtn = mazoCrearModal.querySelector('.close');
    
    // Event listeners
    if (btnAbrirCrearMazo) {
        btnAbrirCrearMazo.addEventListener('click', abrirModalCrearMazo);
    }
    
    if (btnCancelarCrearMazo) {
        btnCancelarCrearMazo.addEventListener('click', cerrarModalCrearMazo);
    }
    
    if (btnGuardarCrearMazo) {
        btnGuardarCrearMazo.addEventListener('click', guardarNuevoMazo);
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', cerrarModalCrearMazo);
    }
    
    // Cerrar modal cuando se hace clic fuera del contenido
    if (mazoCrearModal) {
        mazoCrearModal.addEventListener('click', function(event) {
            if (event.target === mazoCrearModal) {
                cerrarModalCrearMazo();
            }
        });
    }
});

function abrirModalCrearMazo() {
    // Limpiar el formulario
    inputCrearMazoNombre.value = '';
    inputCrearMazoDesc.value = '';
    
    // Mostrar el modal
    mazoCrearModal.classList.add('show');
    
    // Enfocar el campo de nombre
    inputCrearMazoNombre.focus();
}

function cerrarModalCrearMazo() {
    mazoCrearModal.classList.remove('show');
}

function guardarNuevoMazo() {
    const nombre = inputCrearMazoNombre.value.trim();
    const descripcion = inputCrearMazoDesc.value.trim();
    
    if (!nombre) {
        alert('Por favor ingresa un nombre para el mazo');
        inputCrearMazoNombre.focus();
        return;
    }
    
    // Desabilitar el botón mientras se guarda
    btnGuardarCrearMazo.disabled = true;
    btnGuardarCrearMazo.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';
    
    // Enviar solicitud al servidor
    fetch('/flashcards/api/crear-mazo/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': flashcardsData.csrfToken
        },
        body: JSON.stringify({
            nombre: nombre,
            descripcion: descripcion
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Cerrar el modal
            cerrarModalCrearMazo();
            
            // Recargar los mazos (if function exists)
            if (window.cargarMazos) {
                window.cargarMazos();
            } else {
                location.reload();
            }
        } else {
            alert('Error al crear el mazo: ' + (data.error || 'Error desconocido'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al crear el mazo');
    })
    .finally(() => {
        // Reabilitar el botón
        btnGuardarCrearMazo.disabled = false;
        btnGuardarCrearMazo.innerHTML = '<i class="fas fa-folder-plus"></i> Crear Mazo';
    });
}
