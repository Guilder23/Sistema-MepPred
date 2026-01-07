// JavaScript para el Ranking de Estudiantes

document.addEventListener('DOMContentLoaded', function() {
    // Animar las barras de progreso
    animarBarrasProgreso();
    
    // Resaltar la fila del usuario actual
    resaltarMiPosicion();
    
    // Añadir tooltips informativos
    añadirTooltips();
});

/**
 * Anima las barras de aprobación al cargar la página
 */
function animarBarrasProgreso() {
    const barras = document.querySelectorAll('.aprobacion-fill');
    
    barras.forEach((barra, index) => {
        const ancho = barra.style.width;
        barra.style.width = '0%';
        
        setTimeout(() => {
            barra.style.width = ancho;
        }, 100 * index);
    });
}

/**
 * Resalta la fila del usuario actual con un efecto visual
 */
function resaltarMiPosicion() {
    const miFilaActual = document.querySelector('.mi-posicion');
    
    if (miFilaActual) {
        // Scroll suave hacia mi posición si está fuera de vista
        setTimeout(() => {
            const rect = miFilaActual.getBoundingClientRect();
            const isInView = rect.top >= 0 && rect.bottom <= window.innerHeight;
            
            if (!isInView) {
                miFilaActual.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }
            
            // Efecto de pulso
            miFilaActual.style.animation = 'pulso 2s ease-in-out';
        }, 500);
    }
}

/**
 * Añade tooltips con información adicional
 */
function añadirTooltips() {
    const filas = document.querySelectorAll('.ranking-row');
    
    filas.forEach(fila => {
        const promedio = fila.querySelector('.promedio-valor')?.textContent;
        const examenes = fila.querySelector('.examenes-total')?.textContent;
        const mejor = fila.querySelector('.mejor-nota')?.textContent;
        
        if (promedio && examenes && mejor) {
            fila.setAttribute('title', 
                `Promedio: ${promedio}/20 | Exámenes: ${examenes} | Mejor: ${mejor}`
            );
        }
    });
}

/**
 * Función para cambiar de período (puede usarse para ajax en el futuro)
 */
function cambiarPeriodo(periodo) {
    window.location.href = `?periodo=${periodo}`;
}

/**
 * Efecto de animación de pulso
 */
const style = document.createElement('style');
style.textContent = `
    @keyframes pulso {
        0%, 100% {
            box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4);
        }
        50% {
            box-shadow: 0 0 0 10px rgba(102, 126, 234, 0);
        }
    }
`;
document.head.appendChild(style);

/**
 * Función para actualizar el ranking sin recargar (opcional - AJAX)
 */
async function actualizarRanking(periodo) {
    try {
        const response = await fetch(`/ranking/?periodo=${periodo}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        if (response.ok) {
            // Aquí se podría implementar actualización AJAX sin recargar
            console.log('Ranking actualizado');
        }
    } catch (error) {
        console.error('Error al actualizar ranking:', error);
    }
}

/**
 * Formatear números con separador de miles
 */
function formatearNumero(numero) {
    return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Calcular el color de la barra según el porcentaje
 */
function obtenerColorBarra(porcentaje) {
    if (porcentaje >= 80) return '#27ae60'; // Verde
    if (porcentaje >= 60) return '#f39c12'; // Naranja
    return '#e74c3c'; // Rojo
}

// Exportar funciones para uso global
window.rankingUtils = {
    cambiarPeriodo,
    actualizarRanking,
    formatearNumero,
    obtenerColorBarra
};
