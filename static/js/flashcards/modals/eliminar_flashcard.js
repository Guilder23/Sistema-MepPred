// Modal para eliminar flashcard
let flashcardEliminarModal = null;
let btnCancelarEliminarFlashcard = null;
let btnConfirmarEliminarFlashcard = null;
let inputEliminarFlashcardPregunta = null;
let flashcardSeleccionadaEliminar = null;

document.addEventListener('DOMContentLoaded', function() {
    // Obtener referencias a los elementos del modal
    flashcardEliminarModal = document.getElementById('modal-eliminar-flashcard');
    btnCancelarEliminarFlashcard = document.getElementById('cancelar-eliminar-flashcard');
    btnConfirmarEliminarFlashcard = document.getElementById('confirmar-eliminar-flashcard');
    inputEliminarFlashcardPregunta = document.getElementById('eliminar-flashcard-pregunta');
    
    const closeBtn = flashcardEliminarModal.querySelector('.close');
    
    // Event listeners
    if (btnCancelarEliminarFlashcard) {
        btnCancelarEliminarFlashcard.addEventListener('click', cerrarModalEliminarFlashcard);
    }
    
    if (btnConfirmarEliminarFlashcard) {
        btnConfirmarEliminarFlashcard.addEventListener('click', confirmarEliminarFlashcard);
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', cerrarModalEliminarFlashcard);
    }
    
    // Cerrar modal cuando se hace clic fuera del contenido
    if (flashcardEliminarModal) {
        flashcardEliminarModal.addEventListener('click', function(event) {
            if (event.target === flashcardEliminarModal) {
                cerrarModalEliminarFlashcard();
            }
        });
    }
});

function abrirModalEliminarFlashcard(flashcardId, pregunta) {
    flashcardSeleccionadaEliminar = flashcardId;
    inputEliminarFlashcardPregunta.textContent = pregunta;
    
    // Mostrar el modal
    flashcardEliminarModal.classList.add('show');
}

function cerrarModalEliminarFlashcard() {
    flashcardEliminarModal.classList.remove('show');
    flashcardSeleccionadaEliminar = null;
}

function confirmarEliminarFlashcard() {
    if (!flashcardSeleccionadaEliminar) return;
    
    // Desabilitar el botón mientras se elimina
    btnConfirmarEliminarFlashcard.disabled = true;
    btnConfirmarEliminarFlashcard.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
    
    // Enviar solicitud al servidor
    fetch(`/flashcards/api/eliminar-flashcard/${flashcardSeleccionadaEliminar}/`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': flashcardsData.csrfToken
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Cerrar el modal
            cerrarModalEliminarFlashcard();
            
            // Recargar las flashcards
            if (window.cargarFlashcards) {
                window.cargarFlashcards();
            } else {
                location.reload();
            }
        } else {
            alert('Error al eliminar la flashcard: ' + (data.error || 'Error desconocido'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al eliminar la flashcard');
    })
    .finally(() => {
        // Reabilitar el botón
        btnConfirmarEliminarFlashcard.disabled = false;
        btnConfirmarEliminarFlashcard.innerHTML = '<i class="fas fa-trash"></i> Eliminar';
    });
}
