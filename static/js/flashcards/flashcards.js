// Archivo principal de inicialización de Flashcards
// Manejo de pestañas y coordinación de módulos

document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema de Flashcards inicializado');
    
    // Obtener datos desde atributos data- del HTML
    const container = document.querySelector('.flashcard-container');
    if (container) {
        window.flashcardsData = {
            mazos: JSON.parse(container.dataset.mazos || '[]'),
            tarjetas: JSON.parse(container.dataset.tarjetas || '[]'),
            csrfToken: container.dataset.csrf || ''
        };
        console.log('Datos cargados:', window.flashcardsData);
    }
    
    setupTabs();
});

// Manejo de pestañas
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Remover clase active de todos
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.style.display = 'none');
            
            // Agregar clase active al tab clickeado
            this.classList.add('active');
            document.getElementById(tabName).style.display = 'block';
        });
    });
}

// =========================================
// FUNCIONES DE MODAL Y NOTIFICACIONES
// =========================================

// Función para cerrar modales
function cerrarModalMazo(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// Función para abrir modales
function mostrarModalMazo(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (overlay) {
        overlay.classList.add('active');
    }
}

// Función para escapar HTML y prevenir XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Función para mostrar mensajes toast
function mostrarMensaje(titulo, mensaje, tipo = 'info') {
    // Crear contenedor si no existe
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    // Determinar el icono según el tipo
    let icono = 'fa-info-circle';
    if (tipo === 'success') icono = 'fa-check-circle';
    else if (tipo === 'error' || tipo === 'danger') icono = 'fa-exclamation-circle';
    else if (tipo === 'warning') icono = 'fa-exclamation-triangle';
    
    // Crear el toast
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icono}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${escapeHtml(titulo)}</div>
            <div class="toast-message">${escapeHtml(mensaje)}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Agregar al contenedor
    container.appendChild(toast);
    
    // Auto-eliminar después de 10 segundos
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }
    }, 10000);
}

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

// Event listeners para cerrar modales con ESC o click fuera
document.addEventListener('DOMContentLoaded', function() {
    // Cerrar modal al presionar ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const activeOverlays = document.querySelectorAll('.modal-overlay.active');
            activeOverlays.forEach(overlay => {
                overlay.classList.remove('active');
            });
        }
    });
    
    // Cerrar modal al hacer click en el overlay (fondo oscuro)
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
});
