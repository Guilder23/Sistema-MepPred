// Mi Posición JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Mi Posición JS cargado');
    
    // Inicializar animaciones
    initAnimations();
    
    // Inicializar interacciones
    initInteractions();
    
    // Inicializar tooltips si existen
    initTooltips();
});

/**
 * Inicializar animaciones de entrada
 */
function initAnimations() {
    const cards = document.querySelectorAll('.estadistica-card');
    
    // Añadir clase de animación visible
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('animate-in');
        }, index * 100);
    });
}

/**
 * Inicializar interacciones de las tarjetas
 */
function initInteractions() {
    const cards = document.querySelectorAll('.estadistica-card');
    
    cards.forEach(card => {
        // Efecto de inclinación 3D
        card.addEventListener('mousemove', handleCardTilt);
        card.addEventListener('mouseleave', resetCardTilt);
        
        // Efecto de click
        card.addEventListener('click', handleCardClick);
    });
}

/**
 * Manejar inclinación 3D de la tarjeta
 */
function handleCardTilt(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
}

/**
 * Resetear inclinación de la tarjeta
 */
function resetCardTilt(e) {
    const card = e.currentTarget;
    card.style.transform = '';
}

/**
 * Manejar click en tarjeta
 */
function handleCardClick(e) {
    const card = e.currentTarget;
    
    // Añadir efecto de pulso
    card.classList.add('pulse');
    setTimeout(() => {
        card.classList.remove('pulse');
    }, 600);
    
    // Mostrar información adicional si existe
    const statInfo = card.querySelector('.stat-info');
    if (statInfo) {
        console.log('Estadística clickeada:', statInfo.textContent);
    }
}

/**
 * Inicializar tooltips
 */
function initTooltips() {
    const statCards = document.querySelectorAll('.estadistica-card');
    
    statCards.forEach(card => {
        const statTitle = card.querySelector('h3')?.textContent;
        if (statTitle) {
            card.setAttribute('title', `Ver detalles de ${statTitle}`);
        }
    });
}

/**
 * Animar contador de valores
 */
function animateCounter(element, targetValue, duration = 1000) {
    const startValue = 0;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentValue = startValue + (targetValue - startValue) * easeOutQuad(progress);
        element.textContent = Math.round(currentValue);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = targetValue;
        }
    }
    
    requestAnimationFrame(update);
}

/**
 * Función de easing para animaciones suaves
 */
function easeOutQuad(t) {
    return t * (2 - t);
}

/**
 * Cargar estadísticas con efecto de carga
 */
function loadEstadisticas() {
    const cards = document.querySelectorAll('.estadistica-card');
    
    cards.forEach(card => {
        card.classList.add('loading');
    });
    
    // Simular carga (en producción sería una llamada AJAX real)
    setTimeout(() => {
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.remove('loading');
                card.classList.add('loaded');
                
                // Animar valores
                const valor = card.querySelector('.stat-valor');
                if (valor && !isNaN(parseFloat(valor.textContent))) {
                    const targetValue = parseFloat(valor.textContent);
                    animateCounter(valor, targetValue);
                }
            }, index * 150);
        });
    }, 500);
}

/**
 * Actualizar posición en tiempo real
 */
function actualizarPosicion() {
    // Esta función se puede conectar a un WebSocket o polling
    console.log('Actualizando posición...');
    
    // Ejemplo de actualización
    const posicionElement = document.querySelector('.estadistica-card:nth-child(1) .stat-valor');
    if (posicionElement) {
        posicionElement.classList.add('updating');
        
        setTimeout(() => {
            posicionElement.classList.remove('updating');
            posicionElement.classList.add('updated');
            
            setTimeout(() => {
                posicionElement.classList.remove('updated');
            }, 1000);
        }, 500);
    }
}

/**
 * Manejar cambios de rendimiento
 */
function handleRendimientoChange(newPromedio) {
    const promedioElement = document.querySelector('.estadistica-card:nth-child(2) .stat-valor');
    
    if (promedioElement) {
        const oldValue = parseFloat(promedioElement.textContent);
        const newValue = parseFloat(newPromedio);
        
        if (newValue > oldValue) {
            promedioElement.classList.add('increase');
            setTimeout(() => promedioElement.classList.remove('increase'), 1000);
        } else if (newValue < oldValue) {
            promedioElement.classList.add('decrease');
            setTimeout(() => promedioElement.classList.remove('decrease'), 1000);
        }
        
        animateCounter(promedioElement, newValue);
    }
}

/**
 * Mostrar notificación
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Exportar estadísticas
 */
function exportarEstadisticas() {
    const estadisticas = {
        posicion: document.querySelector('.estadistica-card:nth-child(1) .stat-valor')?.textContent,
        promedio: document.querySelector('.estadistica-card:nth-child(2) .stat-valor')?.textContent,
        examenes: document.querySelector('.estadistica-card:nth-child(3) .stat-valor')?.textContent,
        mejorNota: document.querySelector('.estadistica-card:nth-child(4) .stat-valor')?.textContent,
        fecha: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(estadisticas, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `mi-posicion-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('Estadísticas exportadas correctamente', 'success');
}

// Exponer funciones globales si es necesario
window.MiPosicion = {
    actualizarPosicion,
    handleRendimientoChange,
    exportarEstadisticas,
    loadEstadisticas
};
