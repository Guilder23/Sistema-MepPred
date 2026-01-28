// Módulo de Lista - Métodos específicos para la pestaña de lista

// Función global para cargar y mostrar las flashcards
window.cargarFlashcards = function() {
    const flashcardsList = document.getElementById('flashcards-list');
    const emptyState = document.getElementById('flashcards-list-empty');
    
    console.log('Ejecutando cargarFlashcards()');
    console.log('flashcardsData:', window.flashcardsData);
    
    if (!flashcardsList) {
        console.log('No se encontró elemento flashcards-list');
        return;
    }
    
    if (window.flashcardsData && window.flashcardsData.tarjetas && window.flashcardsData.tarjetas.length > 0) {
        console.log('No hay flashcards o flashcardsData no está disponible');
        if (emptyState) emptyState.style.display = 'none';
        flashcardsList.innerHTML = '';
        
        window.flashcardsData.tarjetas.forEach(flashcard => {
            const flashcardDiv = document.createElement('div');
            flashcardDiv.className = 'flashcard-item';
            flashcardDiv.dataset.flashcardId = flashcard.id;
            
            const mazo = window.flashcardsData.mazos.find(m => m.id == flashcard.mazo_id) || {};
            
            flashcardDiv.innerHTML = `
                <div class="flashcard-header">
                    <h4>${flashcard.pregunta}</h4>
                    <span class="flashcard-mazo">${mazo.nombre || 'Sin mazo'}</span>
                </div>
                <p class="flashcard-respuesta">${flashcard.respuesta}</p>
                ${flashcard.categoria ? `<p class="flashcard-categoria"><strong>Categoría:</strong> ${flashcard.categoria}</p>` : ''}
                <div class="flashcard-actions">
                    <button class="btn-small btn-editar-flashcard" data-flashcard-id="${flashcard.id}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-small btn-eliminar-flashcard" data-flashcard-id="${flashcard.id}">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            `;
            
            flashcardsList.appendChild(flashcardDiv);
        });
    } else {
        console.log('No hay flashcards o flashcardsData no está disponible');
        if (emptyState) emptyState.style.display = 'block';
        flashcardsList.innerHTML = '';
    }
    
    // Configurar event listeners después de cargar
    configurarEventListeners();
};

// Configurar event listeners para botones de editar y eliminar
function configurarEventListeners() {
    // Event delegation para botones de editar
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-editar-flashcard')) {
            const btn = e.target.closest('.btn-editar-flashcard');
            const flashcardId = parseInt(btn.dataset.flashcardId);
            abrirModalEditarFlashcard(flashcardId);
        }
    });
    
    // Event delegation para botones de eliminar
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-eliminar-flashcard')) {
            const btn = e.target.closest('.btn-eliminar-flashcard');
            const flashcardId = parseInt(btn.dataset.flashcardId);
            
            // Buscar la flashcard para obtener su pregunta
            let flashcard = null;
            if (window.flashcardsData && window.flashcardsData.tarjetas) {
                flashcard = window.flashcardsData.tarjetas.find(t => t.id === flashcardId);
            }
            
            const pregunta = flashcard ? flashcard.pregunta : 'esta flashcard';
            abrirModalEliminarFlashcard(flashcardId, pregunta);
        }
    });
}

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado en list.js');
    
    // Configurar event listeners inmediatamente para elementos ya renderizados
    configurarEventListeners();
    
    // Cargar flashcards cuando se abre la pestaña
    const tabList = document.querySelector('[data-tab="list"]');
    if (tabList) {
        tabList.addEventListener('click', function() {
            // Solo recargar si es necesario
            console.log('Click en tab Ver Todas');
        });
    }
});