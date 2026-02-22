// Script para modal ver flashcard

window.verFlashcard = async function(flashcardId) {
    try {
        const response = await fetch('/flashcards-premium/api/mazos/');
        const data = await response.json();
        
        if (data.success) {
            let flashcard = null;
            let mazoNombre = '';
            
            for (const mazo of data.mazos) {
                if (mazo.tarjetas) {
                    flashcard = mazo.tarjetas.find(t => t.id === flashcardId);
                    if (flashcard) {
                        mazoNombre = mazo.nombre;
                        break;
                    }
                }
            }
            
            if (flashcard) {
                document.getElementById('verFlashcardId').textContent = flashcard.id;
                document.getElementById('verFlashcardMazo').textContent = mazoNombre;
                document.getElementById('verFlashcardPregunta').textContent = flashcard.pregunta;
                document.getElementById('verFlashcardRespuesta').textContent = flashcard.respuesta;
                document.getElementById('verFlashcardCategoria').textContent = flashcard.categoria || '-';
                
                mostrarModal('modalVerFlashcardOverlay');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error', 'Error al cargar los detalles', 'danger');
    }
};
