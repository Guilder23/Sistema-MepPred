// Script para modal crear flashcard

// Cargar mazos en el select crear
async function cargarMazosCrearFlashcard() {
    try {
        const response = await fetch('/flashcards-premium/api/mazos/');
        const data = await response.json();
        
        if (data.success) {
            const selectMazo = document.getElementById('mazoFlashcard');
            if (selectMazo) {
                selectMazo.innerHTML = '<option value="">Seleccione un mazo</option>';
                data.mazos.forEach(mazo => {
                    const option = document.createElement('option');
                    option.value = mazo.id;
                    option.textContent = mazo.nombre;
                    selectMazo.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error al cargar mazos:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Cargar mazos cuando se abre el modal
    const overlay = document.getElementById('modalCrearFlashcardOverlay');
    
    if (overlay) {
        // Observar cambios en la clase active
        const observer = new MutationObserver(() => {
            if (overlay.classList.contains('active')) {
                // Limpiar formulario
                const form = document.getElementById('formCrearFlashcard');
                if (form) {
                    form.reset();
                }
                // Cargar mazos
                cargarMazosCrearFlashcard();
            }
        });
        observer.observe(overlay, { attributes: true, attributeFilter: ['class'] });
    }
    
    const btnGuardar = document.getElementById('btnGuardarFlashcard');
    
    if (btnGuardar) {
        btnGuardar.addEventListener('click', async function() {
            const formData = new FormData();
            formData.append('mazo_id', document.getElementById('mazoFlashcard').value);
            formData.append('pregunta', document.getElementById('preguntaFlashcard').value);
            formData.append('respuesta', document.getElementById('respuestaFlashcard').value);
            formData.append('categoria', document.getElementById('categoriaFlashcard').value);
            
            try {
                const response = await fetch('/flashcards-premium/api/flashcards/crear/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken')
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    mostrarMensaje('Éxito', 'Flashcard creada exitosamente', 'success');
                    ocultarModal('modalCrearFlashcardOverlay');
                    if (typeof cargarFlashcards === 'function') {
                        cargarFlashcards();
                    }
                } else {
                    mostrarMensaje('Error', 'Error: ' + (data.error || 'No se pudo crear la flashcard'), 'danger');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarMensaje('Error', 'Error al crear la flashcard', 'danger');
            }
        });
    }
});
