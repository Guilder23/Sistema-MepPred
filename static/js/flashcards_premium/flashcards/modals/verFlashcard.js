// Script para modal ver flashcard

// Funciones para manejar modales
window.abrirModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

window.cerrarModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        cerrarModal(e.target.id);
    }
});

window.verFlashcardModal = async function(flashcardId) {
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
                
                abrirModal('verFlashcardModal');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los detalles');
    }
};
