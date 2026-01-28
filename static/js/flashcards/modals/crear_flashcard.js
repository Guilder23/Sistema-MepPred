// Modal para crear flashcard
let flashcardCrearModal = null;
let btnAbrirCrearFlashcard = null;
let btnCancelarCrearFlashcard = null;
let btnGuardarCrearFlashcard = null;
let selectCrearFlashcardMazo = null;
let inputCrearFlashcardCategoria = null;
let textareaCrearFlashcardPregunta = null;
let textareaCrearFlashcardRespuesta = null;

document.addEventListener('DOMContentLoaded', function() {
    // Obtener referencias a los elementos del modal
    flashcardCrearModal = document.getElementById('modal-crear-flashcard');
    btnAbrirCrearFlashcard = document.getElementById('btn-abrir-crear-flashcard');
    btnCancelarCrearFlashcard = document.getElementById('cancelar-crear-flashcard');
    btnGuardarCrearFlashcard = document.getElementById('guardar-crear-flashcard');
    selectCrearFlashcardMazo = document.getElementById('crear-flashcard-mazo');
    inputCrearFlashcardCategoria = document.getElementById('crear-flashcard-categoria');
    textareaCrearFlashcardPregunta = document.getElementById('crear-flashcard-pregunta');
    textareaCrearFlashcardRespuesta = document.getElementById('crear-flashcard-respuesta');
    
    const closeBtn = flashcardCrearModal.querySelector('.close');
    
    // Event listeners
    if (btnAbrirCrearFlashcard) {
        btnAbrirCrearFlashcard.addEventListener('click', abrirModalCrearFlashcard);
    }
    
    if (btnCancelarCrearFlashcard) {
        btnCancelarCrearFlashcard.addEventListener('click', cerrarModalCrearFlashcard);
    }
    
    if (btnGuardarCrearFlashcard) {
        btnGuardarCrearFlashcard.addEventListener('click', guardarNuevaFlashcard);
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', cerrarModalCrearFlashcard);
    }
    
    // Cerrar modal cuando se hace clic fuera del contenido
    if (flashcardCrearModal) {
        flashcardCrearModal.addEventListener('click', function(event) {
            if (event.target === flashcardCrearModal) {
                cerrarModalCrearFlashcard();
            }
        });
    }
    
    // Llenar el select de mazos cuando se abre el modal
    if (selectCrearFlashcardMazo) {
        selectCrearFlashcardMazo.addEventListener('focus', llenarSelectMazos);
    }
});

function llenarSelectMazos() {
    console.log('Ejecutando llenarSelectMazos()');
    console.log('flashcardsData:', window.flashcardsData);
    
    if (window.flashcardsData && window.flashcardsData.mazos) {
        console.log('Mazos disponibles:', window.flashcardsData.mazos);
        
        // Limpiar opciones excepto la primera
        const opciones = selectCrearFlashcardMazo.querySelectorAll('option');
        opciones.forEach((opcion, index) => {
            if (index > 0) opcion.remove();
        });
        
        // Agregar los mazos
        window.flashcardsData.mazos.forEach(mazo => {
            console.log('Agregando mazo:', mazo);
            const option = document.createElement('option');
            option.value = mazo.id;
            option.textContent = `${mazo.nombre} (${mazo.tarjetas_count || 0} tarjetas)`;
            selectCrearFlashcardMazo.appendChild(option);
        });
        
        console.log('Select poblado con', window.flashcardsData.mazos.length, 'mazos');
    } else {
        console.error('No hay flashcardsData o mazos disponibles');
    }
}

function abrirModalCrearFlashcard() {
    // Limpiar el formulario
    selectCrearFlashcardMazo.value = '';
    inputCrearFlashcardCategoria.value = '';
    textareaCrearFlashcardPregunta.value = '';
    textareaCrearFlashcardRespuesta.value = '';
    
    // Llenar los mazos
    llenarSelectMazos();
    
    // Mostrar el modal
    flashcardCrearModal.classList.add('show');
    
    // Enfocar el select de mazo
    selectCrearFlashcardMazo.focus();
}

function cerrarModalCrearFlashcard() {
    flashcardCrearModal.classList.remove('show');
}

function guardarNuevaFlashcard() {
    const mazoId = selectCrearFlashcardMazo.value.trim();
    const categoria = inputCrearFlashcardCategoria.value.trim();
    const pregunta = textareaCrearFlashcardPregunta.value.trim();
    const respuesta = textareaCrearFlashcardRespuesta.value.trim();
    
    if (!mazoId) {
        alert('Por favor selecciona un mazo');
        selectCrearFlashcardMazo.focus();
        return;
    }
    
    if (!pregunta) {
        alert('Por favor ingresa una pregunta');
        textareaCrearFlashcardPregunta.focus();
        return;
    }
    
    if (!respuesta) {
        alert('Por favor ingresa una respuesta');
        textareaCrearFlashcardRespuesta.focus();
        return;
    }
    
    // Desabilitar el botón mientras se guarda
    btnGuardarCrearFlashcard.disabled = true;
    btnGuardarCrearFlashcard.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';
    
    // Enviar solicitud al servidor
    fetch('/flashcards/api/crear-flashcard/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': flashcardsData.csrfToken
        },
        body: JSON.stringify({
            mazo_id: mazoId,
            categoria: categoria,
            pregunta: pregunta,
            respuesta: respuesta
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Cerrar el modal
            cerrarModalCrearFlashcard();
            
            // Recargar las flashcards
            if (window.cargarFlashcards) {
                window.cargarFlashcards();
            } else {
                location.reload();
            }
        } else {
            alert('Error al crear la flashcard: ' + (data.error || 'Error desconocido'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al crear la flashcard');
    })
    .finally(() => {
        // Reabilitar el botón
        btnGuardarCrearFlashcard.disabled = false;
        btnGuardarCrearFlashcard.innerHTML = '<i class="fas fa-plus-circle"></i> Crear Flashcard';
    });
}
