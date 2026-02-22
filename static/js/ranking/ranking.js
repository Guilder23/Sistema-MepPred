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
 * Cambiar materia y cargar temas asociados
 */
function cambiarMateria(materiaId) {
    const periodo = new URLSearchParams(window.location.search).get('periodo') || 'todo';
    
    if (materiaId === '') {
        // Ir a ranking general
        window.location.href = `?periodo=${periodo}`;
    } else {
        // Cargar temas para la materia seleccionada
        cargarTemas(materiaId, periodo);
    }
}

/**
 * Cargar temas según la materia seleccionada
 */
async function cargarTemas(materiaId, periodo) {
    try {
        const response = await fetch(`/ranking/api/filtros/?materia_id=${materiaId}`);
        const data = await response.json();
        
        if (data.success) {
            const selectTema = document.getElementById('filtroTema');
            const selectExamen = document.getElementById('filtroExamen');
            
            // Limpiar opciones previas
            selectTema.innerHTML = '<option value="">Todos</option>';
            selectExamen.innerHTML = '<option value="">Todos</option>';
            selectExamen.disabled = true;
            
            // Agregar nuevos temas
            data.temas.forEach(tema => {
                const option = document.createElement('option');
                option.value = tema.id;
                option.textContent = tema.nombre;
                selectTema.appendChild(option);
            });
            
            // Habilitar select de temas
            selectTema.disabled = false;
            
            // Ir al ranking con materia seleccionada
            window.location.href = `?periodo=${periodo}&materia=${materiaId}`;
        }
    } catch (error) {
        console.error('Error al cargar temas:', error);
    }
}

/**
 * Cambiar tema y cargar exámenes asociados
 */
function cambiarTema(temaId) {
    const periodo = new URLSearchParams(window.location.search).get('periodo') || 'todo';
    const materiaId = new URLSearchParams(window.location.search).get('materia') || '';
    
    if (temaId === '') {
        // Ir a ranking de la materia sin tema específico
        window.location.href = `?periodo=${periodo}&materia=${materiaId}`;
    } else {
        // Cargar exámenes para el tema seleccionado
        cargarExamenes(temaId, materiaId, periodo);
    }
}

/**
 * Cargar exámenes según el tema seleccionado
 */
async function cargarExamenes(temaId, materiaId, periodo) {
    try {
        const response = await fetch(`/ranking/api/filtros/?tema_id=${temaId}`);
        const data = await response.json();
        
        if (data.success) {
            const selectExamen = document.getElementById('filtroExamen');
            
            // Limpiar opciones previas
            selectExamen.innerHTML = '<option value="">Todos</option>';
            
            // Agregar nuevos exámenes
            data.examenes.forEach(examen => {
                const option = document.createElement('option');
                option.value = examen.id;
                option.textContent = examen.titulo;
                selectExamen.appendChild(option);
            });
            
            // Habilitar select de exámenes
            selectExamen.disabled = false;
            
            // Ir al ranking con tema seleccionado
            window.location.href = `?periodo=${periodo}&materia=${materiaId}&tema=${temaId}`;
        }
    } catch (error) {
        console.error('Error al cargar exámenes:', error);
    }
}

/**
 * Cambiar examen y filtrar ranking
 */
function cambiarExamen(examenId) {
    const periodo = new URLSearchParams(window.location.search).get('periodo') || 'todo';
    const materiaId = new URLSearchParams(window.location.search).get('materia') || '';
    const temaId = new URLSearchParams(window.location.search).get('tema') || '';
    
    let url = `?periodo=${periodo}`;
    if (materiaId) url += `&materia=${materiaId}`;
    if (temaId) url += `&tema=${temaId}`;
    if (examenId) url += `&examen=${examenId}`;
    
    window.location.href = url;
}

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
                `Promedio: ${promedio}/100 | Exámenes: ${examenes} | Mejor: ${mejor}`
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
    cambiarMateria,
    cambiarTema,
    cambiarExamen,
    actualizarRanking,
    formatearNumero,
    obtenerColorBarra
};
