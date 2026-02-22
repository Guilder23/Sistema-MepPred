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

// Agrupar exámenes por materia y luego por tema
function agruparPorMateria() {
    examenesPorMateria = {};
    
    examenes.forEach(examen => {
        const materiaId = examen.materia_id;
        const materiaNombre = examen.materia_nombre;
        const temaId = examen.tema_id;
        const temaNombre = examen.tema_nombre || 'Sin tema';
        
        if (!examenesPorMateria[materiaId]) {
            examenesPorMateria[materiaId] = {
                nombre: materiaNombre,
                temas: {}
            };
        }
        
        if (!examenesPorMateria[materiaId].temas[temaId]) {
            examenesPorMateria[materiaId].temas[temaId] = {
                nombre: temaNombre,
                examenes: []
            };
        }
        
        examenesPorMateria[materiaId].temas[temaId].examenes.push(examen);
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

// Mostrar exámenes agrupados por materia y tema
function mostrarExamenes() {
    const container = document.getElementById('materiasContainer');
    container.innerHTML = '';
    
    Object.keys(examenesPorMateria).forEach(materiaId => {
        const materia = examenesPorMateria[materiaId];
        
        const section = document.createElement('div');
        section.className = 'materia-section';
        section.dataset.materiaId = materiaId;
        
        // Contar total de exámenes
        let totalExamenes = 0;
        Object.keys(materia.temas).forEach(temaId => {
            totalExamenes += materia.temas[temaId].examenes.length;
        });
        
        let temasHtml = '';
        
        Object.keys(materia.temas).forEach(temaId => {
            const tema = materia.temas[temaId];
            
            temasHtml += `
                <div class="tema-subsection">
                    <div class="tema-header">
                        <h3>${tema.nombre}</h3>
                        <span class="temas-count">${tema.examenes.length} ${tema.examenes.length === 1 ? 'examen' : 'exámenes'}</span>
                    </div>
                    <div class="examenes-grid">
                        ${tema.examenes.map(examen => crearTarjetaExamen(examen, tema.nombre)).join('')}
                    </div>
                </div>
            `;
        });
        
        section.innerHTML = `
            <div class="materia-header">
                <h2>${materia.nombre}</h2>
                <span class="examenes-count">${totalExamenes} ${totalExamenes === 1 ? 'examen' : 'exámenes'}</span>
            </div>
            <div class="temas-content">
                ${temasHtml}
            </div>
        `;
        
        container.appendChild(section);
    });
    
    document.getElementById('materiasContainer').style.display = 'flex';
    document.getElementById('sinExamenes').style.display = 'none';
}

// Crear tarjeta de examen
function crearTarjetaExamen(examen, temaNombre = null) {
    const estadoBadge = examen.activo 
        ? '<span class="badge badge-activo">Activo</span>' 
        : '<span class="badge badge-inactivo">Inactivo</span>';
    
    // Información de intentos
    let intentosInfo = '';
    let botonTexto = '<i class="fas fa-play"></i> Resolver Examen';
    let botonDeshabilitado = !examen.activo;
    let mensajeBloqueo = '';
    
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
    } else if (examen.bloqueado_secuencial) {
        botonDeshabilitado = true;
        mensajeBloqueo = `
            <div class="bloqueo-info secuencial">
                <i class="fas fa-link"></i>
                <span>Aprueba el examen anterior de este tema para desbloquearlo</span>
            </div>
        `;
        botonTexto = '<i class="fas fa-lock"></i> Bloqueado Secuencialmente';
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
                <span>Intentos: ${examen.intentos_realizados}/1</span>
                ${puedeRanking 
                    ? `<span class="restantes ranking-disponible">${intentosRestantes} intento para ranking</span>`
                    : `<span class="sin-ranking-text">Ya no puedes entrar al ranking</span>`
                }
                ${examen.mejor_nota !== null ? `<span class="mejor-nota">Mejor: ${examen.mejor_nota}/100</span>` : ''}
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
                <span>1 intento para entrar al ranking</span>
            </div>
        `;
    }
    
    // Botón de certificado (removido - no se usa)
    const botonCertificado = '';
    
    return `
        <div class="examen-card" data-examen-id="${examen.id}" data-titulo="${examen.titulo.toLowerCase()}">
            ${temaNombre ? `<div class="examen-tema"><i class="fas fa-bookmark"></i> ${temaNombre}</div>` : ''}
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
        
        // Filtrar por temas
        const temasSubsections = section.querySelectorAll('.tema-subsection');
        let materiaConExamenes = false;
        
        temasSubsections.forEach(temaSection => {
            const tarjetas = temaSection.querySelectorAll('.examen-card');
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
            
            // Mostrar/ocultar sección de tema
            if (examenesVisibles > 0) {
                temaSection.style.display = 'block';
                materiaConExamenes = true;
            } else {
                temaSection.style.display = 'none';
            }
        });
        
        // Mostrar sección de materia solo si tiene temas con exámenes visibles
        if (materiaConExamenes) {
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
