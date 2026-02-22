// Script para modal editar flashcard

// Cargar mazos en el select editar
async function cargarMazosEditarFlashcard() {
    try {
        const response = await fetch('/flashcards-premium/api/mazos/');
        const data = await response.json();
        
        if (data.success) {
            const editSelect = document.getElementById('editMazoFlashcard');
            
            if (editSelect) {
                editSelect.innerHTML = '<option value="">Seleccione un mazo</option>';
                data.mazos.forEach(mazo => {
                    const option = document.createElement('option');
                    option.value = mazo.id;
                    option.textContent = mazo.nombre;
                    editSelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error al cargar mazos:', error);
    }
}

window.editarFlashcard = async function(flashcardId) {
    try {
        // Cargar mazos primero
        await cargarMazosEditarFlashcard();
        
        const response = await fetch('/flashcards-premium/api/mazos/');
        const data = await response.json();
        
        if (data.success) {
            let flashcard = null;
            for (const mazo of data.mazos) {
                if (mazo.tarjetas) {
                    flashcard = mazo.tarjetas.find(t => t.id === flashcardId);
                    if (flashcard) {
                        flashcard.mazo_id = mazo.id;
                        break;
                    }
                }
            }
            
            if (flashcard) {
                document.getElementById('editFlashcardId').value = flashcard.id;
                document.getElementById('editMazoFlashcard').value = flashcard.mazo_id;
                document.getElementById('editPreguntaFlashcard').value = flashcard.pregunta;
                document.getElementById('editRespuestaFlashcard').value = flashcard.respuesta;
                document.getElementById('editCategoriaFlashcard').value = flashcard.categoria || '';
                
                mostrarModal('modalEditarFlashcardOverlay');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error', 'Error al cargar la flashcard', 'danger');
    }
};

document.addEventListener('DOMContentLoaded', function() {
    const btnActualizar = document.getElementById('btnActualizarFlashcard');
    
    if (btnActualizar) {
        btnActualizar.addEventListener('click', async function() {
            const id = document.getElementById('editFlashcardId').value;
            const formData = new FormData();
            formData.append('mazo_id', document.getElementById('editMazoFlashcard').value);
            formData.append('pregunta', document.getElementById('editPreguntaFlashcard').value);
            formData.append('respuesta', document.getElementById('editRespuestaFlashcard').value);
            formData.append('categoria', document.getElementById('editCategoriaFlashcard').value);
            
            try {
                const response = await fetch(`/flashcards-premium/api/flashcards/${id}/editar/`, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken')
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    mostrarMensaje('Éxito', 'Flashcard actualizada exitosamente', 'success');
                    ocultarModal('modalEditarFlashcardOverlay');
                    if (typeof cargarFlashcards === 'function') {
                        cargarFlashcards();
                    }
                } else {
                    mostrarMensaje('Error', 'Error: ' + (data.error || 'No se pudo actualizar'), 'danger');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarMensaje('Error', 'Error al actualizar la flashcard', 'danger');
            }
        });
    }
});
