// Módulo de Crear - Métodos específicos para la pestaña de crear

// Configurar event listeners para la pestaña crear
document.addEventListener('DOMContentLoaded', function() {
    // Event delegation para botones de editar en la pestaña crear
    document.addEventListener('click', function(e) {
        const createTab = document.getElementById('create');
        if (!createTab) return;
        
        // Solo manejar clicks dentro de la pestaña crear
        if (!createTab.contains(e.target)) return;
        
        if (e.target.closest('.btn-editar-flashcard')) {
            const btn = e.target.closest('.btn-editar-flashcard');
            const flashcardId = parseInt(btn.dataset.flashcardId);
            abrirModalEditarFlashcard(flashcardId);
        }
    });
    
    // Event delegation para botones de eliminar en la pestaña crear
    document.addEventListener('click', function(e) {
        const createTab = document.getElementById('create');
        if (!createTab) return;
        
        // Solo manejar clicks dentro de la pestaña crear
        if (!createTab.contains(e.target)) return;
        
        if (e.target.closest('.btn-eliminar-flashcard')) {
            const btn = e.target.closest('.btn-eliminar-flashcard');
            const flashcardId = parseInt(btn.dataset.flashcardId);
            
            // Buscar la flashcard para obtener su pregunta
            let flashcard = null;
            if (window.flashcardsData && window.flashcardsData.tarjetas) {
                flashcard = window.flashcardsData.tarjetas.find(t => t.id === flashcardId);
            }
            
            const pregunta = flashcard ? flashcard.pregunta : 'esta flashcard';
            abrirModalEliminarFlashcard(flashcardId, pregunta);
        }
    });
});