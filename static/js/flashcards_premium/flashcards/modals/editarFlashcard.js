// Script para modal editar flashcard

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
        const form = modal.querySelector('form');
        if (form) form.reset();
    }
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        cerrarModal(e.target.id);
    }
});

// Cargar mazos en el select
async function cargarMazosEnSelect() {
    try {
        const response = await fetch('/flashcards-premium/api/mazos/');
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById('mazoFlashcard');
            const editSelect = document.getElementById('editMazoFlashcard');
            
            [select, editSelect].forEach(s => {
                if (s) {
                    s.innerHTML = '<option value="">Seleccione un mazo</option>';
                    data.mazos.forEach(mazo => {
                        const option = document.createElement('option');
                        option.value = mazo.id;
                        option.textContent = mazo.nombre;
                        s.appendChild(option);
                    });
                }
            });
        }
    } catch (error) {
        console.error('Error al cargar mazos:', error);
    }
}

window.editarFlashcardModal = async function(flashcardId) {
    try {
        await cargarMazosEnSelect();
        
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
                
                abrirModal('editarFlashcardModal');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar la flashcard');
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
                    cerrarModal('editarFlashcardModal');
                    if (typeof cargarFlashcards === 'function') {
                        cargarFlashcards();
                    }
                } else {
                    alert('Error: ' + (data.error || 'No se pudo actualizar'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al actualizar la flashcard');
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
