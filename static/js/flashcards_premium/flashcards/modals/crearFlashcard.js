// Script para modal crear flashcard
document.addEventListener('DOMContentLoaded', function() {
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
                    alert('Flashcard creada exitosamente');
                    cerrarModal('crearFlashcardModal');
                    if (typeof cargarFlashcards === 'function') {
                        cargarFlashcards();
                    }
                } else {
                    alert('Error: ' + (data.error || 'No se pudo crear la flashcard'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al crear la flashcard');
            }
        });
    }
});

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

// Cargar mazos en el select cuando se abre el modal
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

// Conectar carga de mazos con abrirModal para crear flashcard
const btnCrearFlashcard = document.getElementById('btnCrearFlashcard');
if (btnCrearFlashcard) {
    btnCrearFlashcard.addEventListener('click', function() {
        cargarMazosEnSelect();
    });
}

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
