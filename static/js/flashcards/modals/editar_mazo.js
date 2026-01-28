// Modal para editar mazo
let mazoEditarModal = null;
let btnCancelarEditarMazo = null;
let btnGuardarEditarMazo = null;
let inputEditarMazoNombre = null;
let inputEditarMazoDesc = null;
let mazoSeleccionadoEditar = null;

document.addEventListener('DOMContentLoaded', function() {
    // Obtener referencias a los elementos del modal
    mazoEditarModal = document.getElementById('modal-editar-mazo');
    btnCancelarEditarMazo = document.getElementById('cancelar-editar');
    btnGuardarEditarMazo = document.getElementById('guardar-editar');
    inputEditarMazoNombre = document.getElementById('edit-mazo-nombre');
    inputEditarMazoDesc = document.getElementById('edit-mazo-desc');
    
    const closeBtn = mazoEditarModal.querySelector('.close');
    
    // Event listeners
    if (btnCancelarEditarMazo) {
        btnCancelarEditarMazo.addEventListener('click', cerrarModalEditarMazo);
    }
    
    if (btnGuardarEditarMazo) {
        btnGuardarEditarMazo.addEventListener('click', guardarEditarMazo);
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', cerrarModalEditarMazo);
    }
    
    // Cerrar modal cuando se hace clic fuera del contenido
    if (mazoEditarModal) {
        mazoEditarModal.addEventListener('click', function(event) {
            if (event.target === mazoEditarModal) {
                cerrarModalEditarMazo();
            }
        });
    }
});

function abrirModalEditarMazo(mazoId) {
    mazoSeleccionadoEditar = mazoId;
    
    // Buscar el mazo en los datos disponibles
    if (window.flashcardsData && window.flashcardsData.mazos) {
        const mazo = window.flashcardsData.mazos.find(m => m.id == mazoId);
        if (mazo) {
            inputEditarMazoNombre.value = mazo.nombre;
            inputEditarMazoDesc.value = mazo.descripcion || '';
        }
    }
    
    // Mostrar el modal
    mazoEditarModal.classList.add('show');
    
    // Enfocar el campo de nombre
    inputEditarMazoNombre.focus();
}

function cerrarModalEditarMazo() {
    mazoEditarModal.classList.remove('show');
    mazoSeleccionadoEditar = null;
}

function guardarEditarMazo() {
    const nombre = inputEditarMazoNombre.value.trim();
    const descripcion = inputEditarMazoDesc.value.trim();
    
    if (!nombre) {
        alert('Por favor ingresa un nombre para el mazo');
        inputEditarMazoNombre.focus();
        return;
    }
    
    // Desabilitar el botón mientras se guarda
    btnGuardarEditarMazo.disabled = true;
    btnGuardarEditarMazo.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    
    // Enviar solicitud al servidor
    fetch(`/flashcards/api/editar-mazo/${mazoSeleccionadoEditar}/`, {
        method: 'PUT',
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
            cerrarModalEditarMazo();
            
            // Recargar los mazos (if function exists)
            if (window.cargarMazos) {
                window.cargarMazos();
            } else {
                location.reload();
            }
        } else {
            alert('Error al editar el mazo: ' + (data.error || 'Error desconocido'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al editar el mazo');
    })
    .finally(() => {
        // Reabilitar el botón
        btnGuardarEditarMazo.disabled = false;
        btnGuardarEditarMazo.innerHTML = 'Guardar Cambios';
    });
}
