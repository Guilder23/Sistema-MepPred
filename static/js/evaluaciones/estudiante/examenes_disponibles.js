// Exámenes disponibles para estudiantes
let examenes = [];
let examenesPorMateria = {};

document.addEventListener('DOMContentLoaded', function() {
    cargarExamenes();
    
    // Event listener para búsqueda
    const inputBuscar = document.getElementById('buscarExamen');
    if (inputBuscar) {
        inputBuscar.addEventListener('input', filtrarExamenes);
    }
    
    // Event listener para filtro de materia
    const selectMateria = document.getElementById('filtroMateria');
    if (selectMateria) {
        selectMateria.addEventListener('change', filtrarExamenes);
    }
});

// Cargar exámenes del servidor
async function cargarExamenes() {
    try {
        const response = await fetch('/examenes/api/examenes/');
        const data = await response.json();
        
        if (data.success) {
            examenes = data.data || [];
            // Filtrar solo exámenes activos (el backend filtra por suscripción)
            examenes = examenes.filter(ex => ex.activo);
            
            if (examenes.length > 0) {
                agruparPorMateria();
                cargarFiltroMaterias();
                mostrarExamenes();
            } else {
                mostrarMensajeSinExamenes();
            }
        }
    } catch (error) {
        console.error('Error al cargar exámenes:', error);
        mostrarMensajeSinExamenes();
    }
}

// Agrupar exámenes por materia
function agruparPorMateria() {
    examenesPorMateria = {};
    
    examenes.forEach(examen => {
        const materiaId = examen.materia_id;
        const materiaNombre = examen.materia_nombre;
        
        if (!examenesPorMateria[materiaId]) {
            examenesPorMateria[materiaId] = {
                nombre: materiaNombre,
                examenes: []
            };
        }
        
        examenesPorMateria[materiaId].examenes.push(examen);
    });
}

// Cargar opciones en el filtro de materias
function cargarFiltroMaterias() {
    const select = document.getElementById('filtroMateria');
    
    Object.keys(examenesPorMateria).forEach(materiaId => {
        const option = document.createElement('option');
        option.value = materiaId;
        option.textContent = examenesPorMateria[materiaId].nombre;
        select.appendChild(option);
    });
}

// Mostrar exámenes agrupados por materia
function mostrarExamenes() {
    const container = document.getElementById('materiasContainer');
    container.innerHTML = '';
    
    Object.keys(examenesPorMateria).forEach(materiaId => {
        const materia = examenesPorMateria[materiaId];
        
        const section = document.createElement('div');
        section.className = 'materia-section';
        section.dataset.materiaId = materiaId;
        
        section.innerHTML = `
            <div class="materia-header">
                <h2>${materia.nombre}</h2>
                <span class="examenes-count">${materia.examenes.length} exámenes</span>
            </div>
            <div class="examenes-grid">
                ${materia.examenes.map(examen => crearTarjetaExamen(examen)).join('')}
            </div>
        `;
        
        container.appendChild(section);
    });
    
    document.getElementById('materiasContainer').style.display = 'flex';
    document.getElementById('sinExamenes').style.display = 'none';
}

// Crear tarjeta de examen
function crearTarjetaExamen(examen) {
    const estadoBadge = examen.activo 
        ? '<span class="badge badge-activo">Activo</span>' 
        : '<span class="badge badge-inactivo">Inactivo</span>';
    
    // Información de intentos
    let intentosInfo = '';
    let botonTexto = '<i class="fas fa-play"></i> Resolver Examen';
    let botonDeshabilitado = !examen.activo;
    let mensajeBloqueo = '';
    
    // Verificar si está aprobado para mostrar certificado
    const estaAprobado = examen.mejor_nota !== null && examen.mejor_nota >= 16;
    
    // Verificar si está bloqueado por contenido incompleto
    if (!examen.contenido_completado) {
        botonDeshabilitado = true;
        mensajeBloqueo = `
            <div class="bloqueo-info contenido-incompleto">
                <i class="fas fa-lock"></i>
                <span>Completa todos los contenidos de la materia (${examen.contenidos_completados}/${examen.total_contenidos})</span>
            </div>
        `;
        botonTexto = '<i class="fas fa-lock"></i> Contenido Incompleto';
    } else if (examen.bloqueado) {
        botonDeshabilitado = true;
        mensajeBloqueo = `
            <div class="bloqueo-info premium-requerido">
                <i class="fas fa-crown"></i>
                <span>Requiere suscripción premium</span>
            </div>
        `;
        botonTexto = '<i class="fas fa-lock"></i> Premium Requerido';
    } else if (examen.intentos_realizados > 0) {
        // Mostrar información sobre el ranking
        const puedeRanking = examen.puede_entrar_ranking;
        const intentosRestantes = examen.intentos_restantes;
        
        intentosInfo = `
            <div class="intentos-info ${puedeRanking ? 'con-intentos' : 'sin-ranking'}">
                <i class="fas ${puedeRanking ? 'fa-trophy' : 'fa-info-circle'}"></i>
                <span>Intentos: ${examen.intentos_realizados}/3</span>
                ${puedeRanking 
                    ? `<span class="restantes ranking-disponible">${intentosRestantes} intentos para ranking</span>`
                    : `<span class="sin-ranking-text">Ya no puedes entrar al ranking</span>`
                }
                ${examen.mejor_nota !== null ? `<span class="mejor-nota">Mejor: ${examen.mejor_nota}/20</span>` : ''}
            </div>
        `;
        
        if (puedeRanking) {
            botonTexto = `<i class="fas fa-redo"></i> Reintentar (${intentosRestantes} para ranking)`;
        } else {
            botonTexto = `<i class="fas fa-redo"></i> Continuar practicando`;
        }
    } else {
        intentosInfo = `
            <div class="intentos-info nuevos-intentos">
                <i class="fas fa-star"></i>
                <span>3 intentos para entrar al ranking</span>
            </div>
        `;
    }
    
    // Botón de certificado (solo si está aprobado)
    const botonCertificado = estaAprobado ? `
        <a href="/examenes/api/certificado/${examen.id}/" 
           class="btn-certificado" 
           download
           title="Descargar certificado">
            <i class="fas fa-certificate"></i>
            Certificado
        </a>
    ` : '';
    
    return `
        <div class="examen-card" data-examen-id="${examen.id}" data-titulo="${examen.titulo.toLowerCase()}">
            <div class="examen-titulo">${escapeHtml(examen.titulo)}</div>
            <div class="examen-descripcion">${escapeHtml(examen.descripcion || 'Sin descripción')}</div>
            
            <div class="examen-info">
                <div class="info-item">
                    <i class="fas fa-clock"></i>
                    <span>${examen.duracion_minutos} min</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-question-circle"></i>
                    <span>${examen.total_preguntas} preguntas</span>
                </div>
            </div>
            
            ${mensajeBloqueo || intentosInfo}
            
            <div class="examen-badges">
                ${examen.materia_requiere_suscripcion 
                    ? '<span class="badge badge-premium">Premium</span>' 
                    : '<span class="badge badge-gratis">Gratis</span>'}
                ${estadoBadge}
            </div>
            
            <div class="examen-acciones">
                <button class="btn-resolver" onclick="resolverExamen(${examen.id})" ${botonDeshabilitado ? 'disabled' : ''}>
                    ${botonTexto}
                </button>
                ${botonCertificado}
            </div>
        </div>
    `;
}

// Filtrar exámenes
function filtrarExamenes() {
    const busqueda = document.getElementById('buscarExamen').value.toLowerCase();
    const materiaFiltro = document.getElementById('filtroMateria').value;
    
    // Ocultar todas las secciones de materia
    document.querySelectorAll('.materia-section').forEach(section => {
        section.style.display = 'none';
    });
    
    let hayResultados = false;
    
    Object.keys(examenesPorMateria).forEach(materiaId => {
        // Aplicar filtro de materia
        if (materiaFiltro && materiaId !== materiaFiltro) {
            return;
        }
        
        const section = document.querySelector(`[data-materia-id="${materiaId}"]`);
        if (!section) return;
        
        // Filtrar exámenes dentro de la materia
        const tarjetas = section.querySelectorAll('.examen-card');
        let examenesVisibles = 0;
        
        tarjetas.forEach(tarjeta => {
            const titulo = tarjeta.dataset.titulo || '';
            
            if (!busqueda || titulo.includes(busqueda)) {
                tarjeta.style.display = 'block';
                examenesVisibles++;
            } else {
                tarjeta.style.display = 'none';
            }
        });
        
        // Mostrar sección solo si tiene exámenes visibles
        if (examenesVisibles > 0) {
            section.style.display = 'block';
            hayResultados = true;
        }
    });
    
    // Mostrar mensaje si no hay resultados
    if (!hayResultados) {
        document.getElementById('materiasContainer').style.display = 'none';
        document.getElementById('sinExamenes').style.display = 'block';
    } else {
        document.getElementById('materiasContainer').style.display = 'flex';
        document.getElementById('sinExamenes').style.display = 'none';
    }
}

// Resolver examen
function resolverExamen(examenId) {
    // Redirigir a la página de resolución del examen
    window.location.href = `/examenes/resolver/${examenId}/`;
}

// Mostrar mensaje cuando no hay exámenes
function mostrarMensajeSinExamenes() {
    document.getElementById('materiasContainer').style.display = 'none';
    document.getElementById('sinExamenes').style.display = 'block';
}

// Escape HTML para prevenir XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
