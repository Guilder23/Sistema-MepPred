// Modal para editar flashcard
let flashcardEditarModal = null;
let btnCancelarEditarFlashcard = null;
let btnGuardarEditarFlashcard = null;
let inputEditarFlashcardCategoria = null;
let textareaEditarFlashcardPregunta = null;
let textareaEditarFlashcardRespuesta = null;
let flashcardSeleccionadaEditar = null;

document.addEventListener('DOMContentLoaded', function() {
    // Obtener referencias a los elementos del modal
    flashcardEditarModal = document.getElementById('modal-editar-flashcard');
    btnCancelarEditarFlashcard = document.getElementById('cancelar-editar-flashcard');
    btnGuardarEditarFlashcard = document.getElementById('guardar-editar-flashcard');
    inputEditarFlashcardCategoria = document.getElementById('editar-flashcard-categoria');
    textareaEditarFlashcardPregunta = document.getElementById('editar-flashcard-pregunta');
    textareaEditarFlashcardRespuesta = document.getElementById('editar-flashcard-respuesta');
    
    const closeBtn = flashcardEditarModal.querySelector('.close');
    
    // Event listeners
    if (btnCancelarEditarFlashcard) {
        btnCancelarEditarFlashcard.addEventListener('click', cerrarModalEditarFlashcard);
    }
    
    if (btnGuardarEditarFlashcard) {
        btnGuardarEditarFlashcard.addEventListener('click', guardarEditarFlashcard);
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', cerrarModalEditarFlashcard);
    }
    
    // Cerrar modal cuando se hace clic fuera del contenido
    if (flashcardEditarModal) {
        flashcardEditarModal.addEventListener('click', function(event) {
            if (event.target === flashcardEditarModal) {
                cerrarModalEditarFlashcard();
            }
        });
    }
});

function abrirModalEditarFlashcard(flashcardId) {
    flashcardSeleccionadaEditar = flashcardId;
    
    // Buscar la flashcard en los datos disponibles
    if (window.flashcardsData && window.flashcardsData.tarjetas) {
        const flashcard = window.flashcardsData.tarjetas.find(t => t.id == flashcardId);
        if (flashcard) {
            inputEditarFlashcardCategoria.value = flashcard.categoria || '';
            textareaEditarFlashcardPregunta.value = flashcard.pregunta;
            textareaEditarFlashcardRespuesta.value = flashcard.respuesta;
        }
    }
    
    // Mostrar el modal
    flashcardEditarModal.classList.add('show');
    
    // Enfocar el campo de pregunta
    textareaEditarFlashcardPregunta.focus();
}

function cerrarModalEditarFlashcard() {
    flashcardEditarModal.classList.remove('show');
    flashcardSeleccionadaEditar = null;
}

function guardarEditarFlashcard() {
    const categoria = inputEditarFlashcardCategoria.value.trim();
    const pregunta = textareaEditarFlashcardPregunta.value.trim();
    const respuesta = textareaEditarFlashcardRespuesta.value.trim();
    
    if (!pregunta) {
        alert('Por favor ingresa una pregunta');
        textareaEditarFlashcardPregunta.focus();
        return;
    }
    
    if (!respuesta) {
        alert('Por favor ingresa una respuesta');
        textareaEditarFlashcardRespuesta.focus();
        return;
    }
    
    // Desabilitar el botón mientras se guarda
    btnGuardarEditarFlashcard.disabled = true;
    btnGuardarEditarFlashcard.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    
    // Enviar solicitud al servidor
    fetch(`/flashcards/api/editar-flashcard/${flashcardSeleccionadaEditar}/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': flashcardsData.csrfToken
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
            // Cerrar el modal
            cerrarModalEditarFlashcard();
            
            // Recargar las flashcards
            if (window.cargarFlashcards) {
                window.cargarFlashcards();
            } else {
                location.reload();
            }
        } else {
            alert('Error al editar la flashcard: ' + (data.error || 'Error desconocido'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al editar la flashcard');
    })
    .finally(() => {
        // Reabilitar el botón
        btnGuardarEditarFlashcard.disabled = false;
        btnGuardarEditarFlashcard.innerHTML = 'Guardar Cambios';
    });
}
