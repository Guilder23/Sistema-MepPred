// Modo estudio - Flashcards Premium para estudiantes
let flashcards = [];
let flashcardActual = null;
let indiceFlashcardActual = 0;
let volteada = false;
let materiaSeleccionada = null;
let temaSeleccionado = null;
let materiasYTemas = [];

document.addEventListener('DOMContentLoaded', function() {
    // Cargar materias y temas disponibles
    cargarMateriasYTemas();
    
    // Event listeners para cambiar los filtros
    const filtroMateria = document.getElementById('filtroMateria');
    const filtroTema = document.getElementById('filtroTema');
    
    if (filtroMateria) {
        filtroMateria.addEventListener('change', function() {
            materiaSeleccionada = this.value || null;
            temaSeleccionado = null; // Resetear tema cuando cambia materia
            actualizarSelectTemas();
            indiceFlashcardActual = 0;
            cargarFlashcards();
        });
    }
    
    if (filtroTema) {
        filtroTema.addEventListener('change', function() {
            temaSeleccionado = this.value || null;
            indiceFlashcardActual = 0;
            cargarFlashcards();
        });
    }
    
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
            const minutos = parseInt(this.dataset.minutos) || null;
            const dias = parseInt(this.dataset.dificultad);
            marcarRespuesta(dias, minutos);
        });
    });
});

// Cargar materias y temas disponibles
async function cargarMateriasYTemas() {
    try {
        const response = await fetch('/flashcards-premium/api/estudiante/temas/');
        const data = await response.json();
        
        if (data.success && data.materias.length > 0) {
            materiasYTemas = data.materias;
            const filtroMateria = document.getElementById('filtroMateria');
            
            // Poblar select de materias
            data.materias.forEach(materia => {
                const option = document.createElement('option');
                option.value = materia.id;
                option.textContent = materia.nombre;
                filtroMateria.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar materias y temas:', error);
    }
    
    // Cargar flashcards después de cargar las materias
    cargarFlashcards();
}

// Actualizar el select de temas basado en la materia seleccionada
function actualizarSelectTemas() {
    const filtroTema = document.getElementById('filtroTema');
    
    // Limpiar opciones de tema (excepto la primera)
    while (filtroTema.options.length > 1) {
        filtroTema.remove(1);
    }
    
    if (!materiaSeleccionada) {
        // Si no hay materia seleccionada, mostrar todos los temas
        materiasYTemas.forEach(materia => {
            materia.temas.forEach(tema => {
                const option = document.createElement('option');
                option.value = tema.id;
                option.textContent = tema.nombre;
                filtroTema.appendChild(option);
            });
        });
    } else {
        // Si hay materia seleccionada, mostrar solo los temas de esa materia
        const materia = materiasYTemas.find(m => m.id == materiaSeleccionada);
        if (materia) {
            materia.temas.forEach(tema => {
                const option = document.createElement('option');
                option.value = tema.id;
                option.textContent = tema.nombre;
                filtroTema.appendChild(option);
            });
        }
    }
}

// Cargar todas las flashcards de todos los mazos (filtrado por materia y/o tema)
async function cargarFlashcards() {
    try {
        let url = '/flashcards-premium/api/estudiante/mazos/';
        const parametros = [];
        
        if (temaSeleccionado) {
            parametros.push(`tema_id=${temaSeleccionado}`);
        } else if (materiaSeleccionada) {
            parametros.push(`materia_id=${materiaSeleccionada}`);
        }
        
        if (parametros.length > 0) {
            url += '?' + parametros.join('&');
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            // Combinar todas las flashcards de todos los mazos
            flashcards = [];
            data.mazos.forEach(mazo => {
                if (mazo.tarjetas && mazo.tarjetas.length > 0) {
                    mazo.tarjetas.forEach(tarjeta => {
                        flashcards.push({
                            ...tarjeta,
                            mazo_nombre: mazo.nombre,
                            tema_nombre: mazo.tema_nombre
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
    
    // Actualizar ambas caras
    document.getElementById('flashcardCategoria').textContent = flashcardActual.categoria || flashcardActual.mazo_nombre;
    document.getElementById('flashcardCategoriaBack').textContent = flashcardActual.categoria || flashcardActual.mazo_nombre;
    document.getElementById('flashcardPregunta').textContent = flashcardActual.pregunta;
    document.getElementById('flashcardRespuesta').textContent = flashcardActual.respuesta;
    
    // Mostrar la sección de flashcard y ocultar mensaje
    document.querySelector('.flashcard-section').style.display = 'flex';
    document.querySelector('.botones-dificultad').style.display = 'grid';
    document.getElementById('sinFlashcards').style.display = 'none';
}

// Voltear tarjeta con efecto 3D
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
function marcarRespuesta(dias, minutos = null) {
    // Si hay minutos, convertir a horas (para el cálculo del próximo repaso)
    let tiempoRepaso = dias;
    
    if (minutos !== null) {
        // Convertir minutos a fracción de día (ej: 1 minuto = 1/1440 días, 10 minutos = 10/1440 días)
        tiempoRepaso = minutos / 1440;
    }
    
    // Enviar al backend para actualizar el próximo repaso
    enviarRespuestaAlBackend(flashcardActual.id, dias, minutos);
    
    indiceFlashcardActual++;
    actualizarEstadisticas();
    mostrarFlashcard();
}

// Enviar respuesta al backend
async function enviarRespuestaAlBackend(flashcardId, dias, minutos = null) {
    try {
        const formData = new FormData();
        formData.append('flashcard_id', flashcardId);
        formData.append('dias', dias);
        if (minutos !== null) {
            formData.append('minutos', minutos);
        }
        
        const response = await fetch('/flashcards-premium/api/flashcards/marcar-respuesta/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value || ''
            }
        });
        
        const data = await response.json();
        if (!data.success) {
            console.error('Error al registrar respuesta:', data.error);
        }
    } catch (error) {
        console.error('Error al enviar respuesta al backend:', error);
    }
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

