// Módulo de Crear - Métodos específicos para la pestaña de crear

// Configurar event listeners para la pestaña crear
document.addEventListener('DOMContentLoaded', function() {
    // Delegación de eventos para los botones de la tabla de flashcards
    const flashcardsTable = document.getElementById('flashcardsTable');
    
    if (flashcardsTable) {
        flashcardsTable.addEventListener('click', function(event) {
            const btnEditar = event.target.closest('.btn-editar-flashcard');
            const btnEliminar = event.target.closest('.btn-eliminar-flashcard');
            
            if (btnEditar) {
                const flashcardId = parseInt(btnEditar.dataset.flashcardId);
                abrirModalEditarFlashcard(flashcardId);
            }
            
            if (btnEliminar) {
                const flashcardId = parseInt(btnEliminar.dataset.flashcardId);
                
                // Buscar la flashcard para obtener su pregunta
                let flashcard = null;
                if (window.flashcardsData && window.flashcardsData.tarjetas) {
                    flashcard = window.flashcardsData.tarjetas.find(t => t.id === flashcardId);
                }
                
                const pregunta = flashcard ? flashcard.pregunta : 'esta flashcard';
                abrirModalEliminarFlashcard(flashcardId, pregunta);
            }
        });
    }
});