// Modal para eliminar flashcard
let flashcardSeleccionadaEliminar = null;

document.addEventListener('DOMContentLoaded', function() {
    const btnConfirmarEliminarFlashcard = document.getElementById('confirmar-eliminar-flashcard');
    
    // Event listener para el botón de confirmación
    if (btnConfirmarEliminarFlashcard) {
        btnConfirmarEliminarFlashcard.addEventListener('click', confirmarEliminarFlashcard);
    }
});

function abrirModalEliminarFlashcard(flashcardId, pregunta) {
    flashcardSeleccionadaEliminar = flashcardId;
    
    // Mostrar la pregunta de la flashcard a eliminar
    const inputEliminarFlashcardPregunta = document.getElementById('eliminar-flashcard-pregunta');
    if (inputEliminarFlashcardPregunta) {
        inputEliminarFlashcardPregunta.textContent = pregunta;
    }
    
    // Mostrar el modal
    mostrarModalMazo('modalEliminarFlashcardOverlay');
}

function confirmarEliminarFlashcard() {
    if (!flashcardSeleccionadaEliminar) return;
    
    const btnConfirmarEliminarFlashcard = document.getElementById('confirmar-eliminar-flashcard');
    
    // Desabilitar el botón mientras se elimina
    btnConfirmarEliminarFlashcard.disabled = true;
    btnConfirmarEliminarFlashcard.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
    
    // Enviar solicitud al servidor
    fetch(`/flashcards/api/eliminar-flashcard/${flashcardSeleccionadaEliminar}/`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Cerrar el modal
            cerrarModalMazo('modalEliminarFlashcardOverlay');
            
            // Mostrar mensaje de éxito
            mostrarMensaje('Éxito', 'Flashcard eliminada correctamente', 'success');
            
            // Recargar la página después de 1 segundo
            setTimeout(() => {
                location.reload();
            }, 1000);
        } else {
            mostrarMensaje('Error', data.error || 'Error al eliminar la flashcard', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarMensaje('Error', 'Error al eliminar la flashcard', 'error');
    })
    .finally(() => {
        // Reabilitar el botón
        btnConfirmarEliminarFlashcard.disabled = false;
        btnConfirmarEliminarFlashcard.innerHTML = '<i class="fas fa-trash"></i> Eliminar';
    });
}
