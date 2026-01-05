// JavaScript para Gestión de Flashcards Premium
document.addEventListener('DOMContentLoaded', function() {
    console.log('Flashcards.js cargado');
    cargarFlashcards();
    
    // Event listener para el buscador
    const inputBuscar = document.getElementById('buscarFlashcard');
    if (inputBuscar) {
        inputBuscar.addEventListener('input', filtrarFlashcards);
    }
    
    // Event listener para el botón crear
    const btnCrear = document.getElementById('btnCrearFlashcard');
    console.log('Botón crear encontrado:', btnCrear);
    if (btnCrear) {
        btnCrear.addEventListener('click', function() {
            console.log('Click en botón crear flashcard');
            console.log('Función window.abrirModal existe:', typeof window.abrirModal);
            if (typeof window.abrirModal === 'function') {
                window.abrirModal('crearFlashcardModal');
            } else {
                console.error('window.abrirModal no está definida');
            }
        });
    }
});

// Función para cargar todas las flashcards
async function cargarFlashcards() {
    try {
        const response = await fetch('/flashcards-premium/api/mazos/');
        const data = await response.json();
        
        if (data.success) {
            // Combinar todas las flashcards de todos los mazos
            const todasFlashcards = [];
            data.mazos.forEach(mazo => {
                if (mazo.tarjetas && mazo.tarjetas.length > 0) {
                    mazo.tarjetas.forEach(tarjeta => {
                        todasFlashcards.push({
                            ...tarjeta,
                            mazo_nombre: mazo.nombre,
                            mazo_id: mazo.id
                        });
                    });
                }
            });
            mostrarFlashcards(todasFlashcards);
        }
    } catch (error) {
        console.error('Error al cargar flashcards:', error);
    }
}

// Función para mostrar flashcards en la tabla
function mostrarFlashcards(flashcards) {
    const tbody = document.getElementById('tablaFlashcards');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (flashcards.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="no-data-message">
                    <i>🎴</i>
                    <p>No hay flashcards creadas aún. ¡Crea tu primera flashcard!</p>
                </td>
            </tr>
        `;
        return;
    }
    
    flashcards.forEach(flashcard => {
        const tr = document.createElement('tr');
        tr.dataset.flashcardId = flashcard.id;
        tr.dataset.flashcardPregunta = (flashcard.pregunta || '').toLowerCase();
        
        const preguntaCorta = flashcard.pregunta.length > 50 
            ? flashcard.pregunta.substring(0, 50) + '...' 
            : flashcard.pregunta;
        
        const respuestaCorta = flashcard.respuesta.length > 50 
            ? flashcard.respuesta.substring(0, 50) + '...' 
            : flashcard.respuesta;
        
        tr.innerHTML = `
            <td>${flashcard.id}</td>
            <td><span style="background: #667eea; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem;">${flashcard.mazo_nombre}</span></td>
            <td><strong>${preguntaCorta}</strong></td>
            <td>${respuestaCorta}</td>
            <td>${flashcard.categoria || '-'}</td>
            <td>-</td>
            <td>
                <div class="acciones-cell">
                    <button class="btn-accion btn-ver" onclick="window.verFlashcard(${flashcard.id})" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-accion btn-editar" onclick="window.editarFlashcard(${flashcard.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-accion btn-eliminar" onclick="window.eliminarFlashcard(${flashcard.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

// Función para filtrar flashcards
function filtrarFlashcards() {
    const busqueda = document.getElementById('buscarFlashcard').value.toLowerCase();
    const filas = document.querySelectorAll('#tablaFlashcards tr');
    
    filas.forEach(fila => {
        const pregunta = fila.dataset.flashcardPregunta || '';
        if (pregunta.includes(busqueda)) {
            fila.style.display = '';
        } else {
            fila.style.display = 'none';
        }
    });
}

// Funciones de acciones (se conectan con los modales) - GLOBALES
window.verFlashcard = function(id) {
    console.log('Ver flashcard:', id);
    if (typeof window.verFlashcardModal === 'function') {
        window.verFlashcardModal(id);
    } else {
        console.error('window.verFlashcardModal no está definida');
    }
};

window.editarFlashcard = function(id) {
    console.log('Editar flashcard:', id);
    if (typeof window.editarFlashcardModal === 'function') {
        window.editarFlashcardModal(id);
    } else {
        console.error('window.editarFlashcardModal no está definida');
    }
};

window.eliminarFlashcard = function(id) {
    console.log('Eliminar flashcard:', id);
    if (typeof window.eliminarFlashcardModal === 'function') {
        window.eliminarFlashcardModal(id);
    } else {
        console.error('window.eliminarFlashcardModal no está definida');
    }
};
