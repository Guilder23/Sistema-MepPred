// JavaScript para Gestión de Flashcards Premium

// ==========================================
// UTILIDADES
// ==========================================

// Función para obtener CSRF token
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

// Función para escapar HTML y prevenir XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Mostrar mensaje tipo toast en la esquina inferior derecha
function mostrarMensaje(titulo, mensaje, tipo) {
    // Crear contenedor de notificaciones si no existe
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Crear el toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    
    // Icono según el tipo
    let icono = '';
    switch(tipo) {
        case 'success':
            icono = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
        case 'danger':
            icono = '<i class="fas fa-exclamation-circle"></i>';
            break;
        case 'warning':
            icono = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        case 'info':
            icono = '<i class="fas fa-info-circle"></i>';
            break;
        default:
            icono = '<i class="fas fa-bell"></i>';
    }

    toast.innerHTML = `
        <div class="toast-icon">${icono}</div>
        <div class="toast-content">
            <div class="toast-title">${escapeHtml(titulo)}</div>
            <div class="toast-message">${escapeHtml(mensaje)}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    container.appendChild(toast);

    // Animar entrada
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Alias para compatibilidad con mostrarAlerta
function mostrarAlerta(mensaje, tipo) {
    mostrarMensaje('Notificación', mensaje, tipo);
}

// Funciones de control de modales
window.mostrarModal = function(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (overlay) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

window.ocultarModal = function(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Alias para cerrarModal (compatibilidad)
window.cerrarModal = function(overlayId) {
    ocultarModal(overlayId);
}

// Cerrar modales al hacer click fuera
document.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal-overlay.active');
    modals.forEach(modal => {
        if (event.target === modal) {
            ocultarModal(modal.id);
        }
    });
});

// ==========================================
// LÓGICA PRINCIPAL
// ==========================================

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
            mostrarModal('modalCrearFlashcardOverlay');
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
    const tbody = document.querySelector('#tablaFlashcards tbody');
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
            <td><span style="background: #c7d2fe; color: #3730a3; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; font-weight: 500;">${flashcard.mazo_nombre}</span></td>
            <td><strong>${preguntaCorta}</strong></td>
            <td>${respuestaCorta}</td>
            <td>${flashcard.categoria || '-'}</td>
            <td>-</td>
            <td class="acciones-cell">
                <div class="acciones-buttons">
                    <button class="btn-icon btn-ver" onclick="window.verFlashcard(${flashcard.id})" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon btn-editar" onclick="window.editarFlashcard(${flashcard.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-eliminar" onclick="window.eliminarFlashcard(${flashcard.id})" title="Eliminar">
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

// Las funciones window.verFlashcard, window.editarFlashcard y window.eliminarFlashcard
// se definen en los archivos de los modales individuales:
// - verFlashcard.js
// - editarFlashcard.js
// - eliminarFlashcard.js
