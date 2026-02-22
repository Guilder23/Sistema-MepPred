// Modal para crear flashcard
document.addEventListener('DOMContentLoaded', function() {
    const btnAbrirCrearFlashcard = document.getElementById('btn-abrir-crear-flashcard');
    const formCrearFlashcard = document.getElementById('formCrearFlashcard');
    const selectMazo = document.getElementById('crear-flashcard-mazo');
    
    // Abrir modal
    if (btnAbrirCrearFlashcard) {
        btnAbrirCrearFlashcard.addEventListener('click', function() {
            // Llenar select de mazos
            llenarSelectMazos();
            // Mostrar modal
            mostrarModalMazo('modalCrearFlashcardOverlay');
        });
    }
    
    // Enviar formulario
    if (formCrearFlashcard) {
        formCrearFlashcard.addEventListener('submit', function(e) {
            e.preventDefault();
            guardarNuevaFlashcard();
        });
    }
});

function llenarSelectMazos() {
    const selectMazo = document.getElementById('crear-flashcard-mazo');
    
    if (window.flashcardsData && window.flashcardsData.mazos && selectMazo) {
        // Limpiar opciones excepto la primera
        const opciones = selectMazo.querySelectorAll('option');
        opciones.forEach((opcion, index) => {
            if (index > 0) opcion.remove();
        });
        
        // Agregar los mazos
        window.flashcardsData.mazos.forEach(mazo => {
            const option = document.createElement('option');
            option.value = mazo.id;
            option.textContent = `${mazo.nombre} (${mazo.tarjetas_count || 0} tarjetas)`;
            selectMazo.appendChild(option);
        });
    }
}

function guardarNuevaFlashcard() {
    const mazoId = document.getElementById('crear-flashcard-mazo').value.trim();
    const categoria = document.getElementById('crear-flashcard-categoria').value.trim();
    const pregunta = document.getElementById('crear-flashcard-pregunta').value.trim();
    const respuesta = document.getElementById('crear-flashcard-respuesta').value.trim();
    
    if (!mazoId) {
        mostrarMensaje('Error', 'Por favor selecciona un mazo', 'error');
        return;
    }
    
    if (!pregunta) {
        mostrarMensaje('Error', 'Por favor ingresa una pregunta', 'error');
        return;
    }
    
    if (!respuesta) {
        mostrarMensaje('Error', 'Por favor ingresa una respuesta', 'error');
        return;
    }
    
    // Enviar solicitud al servidor
    fetch('/flashcards/api/crear-flashcard/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
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
            cerrarModalMazo('modalCrearFlashcardOverlay');
            mostrarMensaje('Éxito', data.message || '¡Flashcard creada exitosamente!', 'success');
            setTimeout(() => location.reload(), 1000);
        } else {
            mostrarMensaje('Error', data.error || 'Error al crear la flashcard', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarMensaje('Error', 'Error al crear la flashcard', 'error');
    });
}
