// Módulo de Estudio - Métodos específicos para la pestaña de estudio

let tarjetasEstudio = [];
let tarjetaActualIndex = 0;
let mostrandoFrente = true;

document.addEventListener('DOMContentLoaded', function() {
    actualizarEstadisticas();
    cargarTarjetasEstudio();
    
    // Voltear tarjeta al hacer clic
    const studyCard = document.getElementById('study-card');
    if (studyCard) {
        studyCard.addEventListener('click', voltearTarjeta);
    }
    
    // Botones de dificultad
    const botonessDificultad = document.querySelectorAll('.difficulty-btn');
    botonessDificultad.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation(); // Evitar que se voltee la tarjeta
            const dificultad = parseInt(this.dataset.difficulty);
            responderTarjeta(dificultad);
        });
    });
    
    // Actualizar cuando se cambie a esta pestaña
    const tabEstudiar = document.querySelector('[data-tab="study"]');
    if (tabEstudiar) {
        tabEstudiar.addEventListener('click', function() {
            actualizarEstadisticas();
            cargarTarjetasEstudio();
        });
    }
});

function cargarTarjetasEstudio() {
    if (!window.flashcardsData || !window.flashcardsData.tarjetas) {
        return;
    }
    
    const ahora = new Date();
    
    // Filtrar tarjetas vencidas
    tarjetasEstudio = window.flashcardsData.tarjetas.filter(t => {
        const proximoRepaso = new Date(t.proximo_repaso);
        return proximoRepaso <= ahora;
    });
    
    console.log('Tarjetas para estudiar:', tarjetasEstudio.length);
    
    tarjetaActualIndex = 0;
    mostrarTarjetaActual();
}

function mostrarTarjetaActual() {
    const studyCard = document.getElementById('study-card');
    
    if (!studyCard) return;
    
    if (tarjetasEstudio.length === 0 || tarjetaActualIndex >= tarjetasEstudio.length) {
        // No hay tarjetas para repasar
        document.getElementById('front-category').textContent = 'General';
        document.getElementById('front-content').textContent = 'No hay flashcards para repasar. ¡Crea algunas!';
        document.getElementById('back-category').textContent = 'General';
        document.getElementById('back-content').textContent = 'Respuesta de la flashcard.';
        studyCard.classList.remove('flipped');
        mostrandoFrente = true;
        return;
    }
    
    const tarjeta = tarjetasEstudio[tarjetaActualIndex];
    const mazo = window.flashcardsData.mazos.find(m => m.id == tarjeta.mazo_id) || {};
    
    // Actualizar contenido
    document.getElementById('front-category').textContent = tarjeta.categoria || mazo.nombre || 'General';
    document.getElementById('front-content').textContent = tarjeta.pregunta;
    document.getElementById('back-category').textContent = tarjeta.categoria || mazo.nombre || 'General';
    document.getElementById('back-content').textContent = tarjeta.respuesta;
    
    // Resetear a frente
    studyCard.classList.remove('flipped');
    mostrandoFrente = true;
}

function voltearTarjeta() {
    const studyCard = document.getElementById('study-card');
    if (!studyCard) return;
    
    if (tarjetasEstudio.length === 0) return; // No voltear si no hay tarjetas
    
    studyCard.classList.toggle('flipped');
    mostrandoFrente = !mostrandoFrente;
}

function responderTarjeta(dificultad) {
    if (tarjetasEstudio.length === 0 || tarjetaActualIndex >= tarjetasEstudio.length) {
        return;
    }
    
    const tarjeta = tarjetasEstudio[tarjetaActualIndex];
    
    // Crear FormData para enviar como POST tradicional
    const formData = new FormData();
    formData.append('tarjeta_id', tarjeta.id);
    formData.append('dificultad', dificultad);
    
    // Enviar respuesta al servidor
    fetch('/flashcards/responder/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': window.flashcardsData.csrfToken
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Respuesta enviada correctamente');
            
            // Pasar a la siguiente tarjeta
            tarjetaActualIndex++;
            
            // Si terminamos todas, recargar
            if (tarjetaActualIndex >= tarjetasEstudio.length) {
                setTimeout(() => {
                    location.reload();
                }, 500);
            } else {
                mostrarTarjetaActual();
            }
        } else {
            alert('Error al enviar respuesta: ' + (data.message || 'Error desconocido'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al enviar respuesta');
    });
}

function actualizarEstadisticas() {
    console.log('Actualizando estadísticas de estudio');
    
    if (!window.flashcardsData || !window.flashcardsData.tarjetas) {
        console.log('No hay datos de flashcards disponibles');
        return;
    }
    
    const tarjetas = window.flashcardsData.tarjetas;
    const ahora = new Date();
    
    // Total de tarjetas
    const total = tarjetas.length;
    
    // Tarjetas vencidas (proximo_repaso <= ahora)
    const vencidas = tarjetas.filter(t => {
        const proximoRepaso = new Date(t.proximo_repaso);
        return proximoRepaso <= ahora;
    }).length;
    
    // Tarjetas de hoy (proximo_repaso es hoy)
    const hoy = tarjetas.filter(t => {
        const proximoRepaso = new Date(t.proximo_repaso);
        return proximoRepaso.toDateString() === ahora.toDateString();
    }).length;
    
    // Tarjetas repasadas (repeticiones > 0)
    const repasadas = tarjetas.filter(t => t.repeticiones > 0).length;
    
    // Actualizar el DOM
    document.getElementById('total-cards').textContent = total;
    document.getElementById('due-cards').textContent = vencidas;
    document.getElementById('today-cards').textContent = hoy;
    document.getElementById('reviewed-cards').textContent = repasadas;
    
    console.log('Estadísticas:', { total, vencidas, hoy, repasadas });
}