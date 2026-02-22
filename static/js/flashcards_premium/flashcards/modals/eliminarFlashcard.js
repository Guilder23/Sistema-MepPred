// Script para modal eliminar flashcard

window.eliminarFlashcard = async function(flashcardId) {
    try {
        const response = await fetch('/flashcards-premium/api/mazos/');
        const data = await response.json();
        
        if (data.success) {
            let flashcard = null;
            
            for (const mazo of data.mazos) {
                if (mazo.tarjetas) {
                    flashcard = mazo.tarjetas.find(t => t.id === flashcardId);
                    if (flashcard) break;
                }
            }
            
            if (flashcard) {
                document.getElementById('deleteFlashcardId').value = flashcard.id;
                document.getElementById('deleteFlashcardPregunta').textContent = flashcard.pregunta.substring(0, 100);
                document.getElementById('deleteFlashcardRespuesta').textContent = flashcard.respuesta.substring(0, 100);
                
                mostrarModal('modalEliminarFlashcardOverlay');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error', 'Error al cargar la flashcard', 'danger');
    }
};

document.addEventListener('DOMContentLoaded', function() {
    const btnConfirmar = document.getElementById('btnConfirmarEliminarFlashcard');
    
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', async function() {
            const id = document.getElementById('deleteFlashcardId').value;
            
            try {
                const response = await fetch(`/flashcards-premium/api/flashcards/${id}/eliminar/`, {
                    method: 'DELETE',
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken')
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    mostrarMensaje('Éxito', 'Flashcard eliminada exitosamente', 'success');
                    ocultarModal('modalEliminarFlashcardOverlay');
                    if (typeof cargarFlashcards === 'function') {
                        cargarFlashcards();
                    }
                } else {
                    mostrarMensaje('Error', 'Error al eliminar la flashcard', 'danger');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarMensaje('Error', 'Error al eliminar la flashcard', 'danger');
            }
        });
    }
});
