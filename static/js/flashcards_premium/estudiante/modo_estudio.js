// Modo estudio - Flashcards Premium para estudiantes
let flashcards = [];
let flashcardActual = null;
let indiceFlashcardActual = 0;
let volteada = false;

document.addEventListener('DOMContentLoaded', function() {
    cargarFlashcards();
    
    // Event listener para voltear la tarjeta
    const card = document.getElementById('flashcardCard');
    if (card) {
        card.addEventListener('click', voltearTarjeta);
    }
    
    // Event listeners para botones de dificultad
    const botonesDificultad = document.querySelectorAll('.btn-dificultad');
    botonesDificultad.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const dias = parseInt(this.dataset.dificultad);
            marcarRespuesta(dias);
        });
    });
});

// Cargar todas las flashcards de todos los mazos
async function cargarFlashcards() {
    try {
        const response = await fetch('/flashcards-premium/api/estudiante/mazos/');
        const data = await response.json();
        
        if (data.success) {
            // Combinar todas las flashcards de todos los mazos
            flashcards = [];
            data.mazos.forEach(mazo => {
                if (mazo.tarjetas && mazo.tarjetas.length > 0) {
                    mazo.tarjetas.forEach(tarjeta => {
                        flashcards.push({
                            ...tarjeta,
                            mazo_nombre: mazo.nombre
                        });
                    });
                }
            });
            
            if (flashcards.length > 0) {
                // Mezclar aleatoriamente
                flashcards = flashcards.sort(() => Math.random() - 0.5);
                actualizarEstadisticas();
                mostrarFlashcard();
            } else {
                mostrarMensajeSinFlashcards();
            }
        }
    } catch (error) {
        console.error('Error al cargar flashcards:', error);
    }
}

// Actualizar estadísticas
function actualizarEstadisticas() {
    document.getElementById('totalFlashcards').textContent = flashcards.length;
    document.getElementById('porRepasar').textContent = flashcards.length - indiceFlashcardActual;
    document.getElementById('hoy').textContent = Math.min(flashcards.length, 10);
    document.getElementById('repasadas').textContent = indiceFlashcardActual;
}

// Mostrar flashcard actual
function mostrarFlashcard() {
    if (indiceFlashcardActual >= flashcards.length) {
        mostrarMensajeSinFlashcards();
        return;
    }
    
    flashcardActual = flashcards[indiceFlashcardActual];
    volteada = false;
    
    const card = document.getElementById('flashcardCard');
    card.classList.remove('volteada');
    
    document.getElementById('flashcardCategoria').textContent = flashcardActual.categoria || flashcardActual.mazo_nombre;
    document.getElementById('flashcardPregunta').textContent = flashcardActual.pregunta;
    document.getElementById('flashcardRespuesta').textContent = flashcardActual.respuesta;
    
    // Mostrar la sección de flashcard y ocultar mensaje
    document.querySelector('.flashcard-section').style.display = 'flex';
    document.querySelector('.botones-dificultad').style.display = 'grid';
    document.getElementById('sinFlashcards').style.display = 'none';
}

// Voltear tarjeta
function voltearTarjeta() {
    const card = document.getElementById('flashcardCard');
    volteada = !volteada;
    
    if (volteada) {
        card.classList.add('volteada');
    } else {
        card.classList.remove('volteada');
    }
}

// Marcar respuesta y avanzar
function marcarRespuesta(dias) {
    // Aquí podrías enviar al backend para actualizar el próximo repaso
    // Por ahora solo avanzamos a la siguiente
    
    indiceFlashcardActual++;
    actualizarEstadisticas();
    mostrarFlashcard();
}

// Mostrar mensaje cuando no hay flashcards
function mostrarMensajeSinFlashcards() {
    document.querySelector('.flashcard-section').style.display = 'none';
    document.querySelector('.botones-dificultad').style.display = 'none';
    document.getElementById('sinFlashcards').style.display = 'block';
    
    // Actualizar estadísticas finales
    document.getElementById('porRepasar').textContent = '0';
    document.getElementById('repasadas').textContent = flashcards.length;
}
