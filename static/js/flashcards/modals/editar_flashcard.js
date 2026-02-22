// Modal para editar flashcard
let flashcardSeleccionadaEditar = null;

document.addEventListener('DOMContentLoaded', function() {
    const formEditarFlashcard = document.getElementById('formEditarFlashcard');
    
    // Enviar formulario
    if (formEditarFlashcard) {
        formEditarFlashcard.addEventListener('submit', function(e) {
            e.preventDefault();
            guardarEditarFlashcard();
        });
    }
});

function abrirModalEditarFlashcard(flashcardId) {
    flashcardSeleccionadaEditar = flashcardId;
    
    // Buscar la flashcard en los datos disponibles
    if (window.flashcardsData && window.flashcardsData.tarjetas) {
        const flashcard = window.flashcardsData.tarjetas.find(t => t.id == flashcardId);
        if (flashcard) {
            document.getElementById('editar-flashcard-id').value = flashcard.id;
            document.getElementById('editar-flashcard-categoria').value = flashcard.categoria || '';
            document.getElementById('editar-flashcard-pregunta').value = flashcard.pregunta;
            document.getElementById('editar-flashcard-respuesta').value = flashcard.respuesta;
            
            console.log('Flashcard cargada:', {
                id: flashcard.id,
                categoria: flashcard.categoria,
                pregunta: flashcard.pregunta
            });
        }
    }
    
    // Mostrar el modal
    mostrarModalMazo('modalEditarFlashcardOverlay');
}

function guardarEditarFlashcard() {
    const categoria = document.getElementById('editar-flashcard-categoria').value.trim();
    const pregunta = document.getElementById('editar-flashcard-pregunta').value.trim();
    const respuesta = document.getElementById('editar-flashcard-respuesta').value.trim();
    
    if (!pregunta) {
        mostrarMensaje('Error', 'Por favor ingresa una pregunta', 'error');
        return;
    }
    
    if (!respuesta) {
        mostrarMensaje('Error', 'Por favor ingresa una respuesta', 'error');
        return;
    }
    
    // Enviar solicitud al servidor
    fetch(`/flashcards/api/editar-flashcard/${flashcardSeleccionadaEditar}/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            categoria: categoria,
            pregunta: pregunta,
            respuesta: respuesta
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            cerrarModalMazo('modalEditarFlashcardOverlay');
            mostrarMensaje('Éxito', data.message || '¡Flashcard actualizada exitosamente!', 'success');
            setTimeout(() => location.reload(), 1000);
        } else {
            mostrarMensaje('Error', data.error || 'Error al editar la flashcard', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarMensaje('Error', 'Error al editar la flashcard', 'error');
    });
}
