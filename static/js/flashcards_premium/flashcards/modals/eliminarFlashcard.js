// Script para modal eliminar flashcard

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

window.eliminarFlashcardModal = async function(flashcardId) {
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
                
                abrirModal('eliminarFlashcardModal');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar la flashcard');
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
                    alert('Flashcard eliminada exitosamente');
                    cerrarModal('eliminarFlashcardModal');
                    if (typeof cargarFlashcards === 'function') {
                        cargarFlashcards();
                    }
                } else {
                    alert('Error al eliminar la flashcard');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al eliminar la flashcard');
            }
        });
    }
});

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
