// Resolver Examen - Estudiantes
let examen = null;
let intentosData = null;
let preguntaActualIndex = 0;
let respuestas = {}; // {pregunta_id: {enunciado_id: 'V'/'F', opcion: opcion_id}}
let tiempoInicio = null;
let tiempoRestante = 0;
let intervalTimer = null;

document.addEventListener('DOMContentLoaded', function() {
    const examenId = document.getElementById('examenId').value;
    cargarExamen(examenId);
    
    // Advertir al intentar cerrar la ventana o recargar la página
    window.addEventListener('beforeunload', function(e) {
        const modalResultados = document.getElementById('modalResultados');
        if (examen && modalResultados && modalResultados.style.display !== 'flex') {
            e.preventDefault();
            e.returnValue = '¿Seguro que quieres salir? Perderás el progreso del examen.';
            return e.returnValue;
        }
    });
});

// Cargar examen desde el servidor
async function cargarExamen(examenId) {
    try {
        const response = await fetch(`/examenes/api/estudiante/examen/${examenId}/`);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error de respuesta:', errorData);
            alert('Error al cargar el examen: ' + (errorData.error || 'Error desconocido'));
            window.location.href = '/examenes/disponibles/';
            return;
        }
        
        const data = await response.json();
        
        if (data.success && data.examen) {
            if (!data.examen.preguntas || data.examen.preguntas.length === 0) {
                alert('Este examen no tiene preguntas configuradas. Por favor contacta al administrador.');
                window.location.href = '/examenes/disponibles/';
                return;
            }
            
            // Guardar datos de intentos
            intentosData = data.intentos;
            
            // Verificar si puede intentar
            if (!intentosData.puede_intentar) {
                mostrarLimiteIntentosAlcanzado();
                return;
            }
            
            // Mostrar historial de intentos si existen
            if (intentosData.realizados && intentosData.realizados.length > 0) {
                mostrarHistorialIntentos();
            }
            
            examen = data.examen;
            inicializarExamen();
        } else {
            alert('Error al cargar el examen: ' + (data.error || 'Datos inválidos'));
            window.location.href = '/examenes/disponibles/';
        }
    } catch (error) {
        console.error('Error al cargar el examen:', error);
        alert('Error de conexión al cargar el examen. Por favor intenta nuevamente.');
        window.location.href = '/examenes/disponibles/';
    }
}

// Mostrar historial de intentos previos
function mostrarHistorialIntentos() {
    const intentosLista = document.getElementById('intentosLista');
    const intentosInfo = document.getElementById('intentosInfo');
    
    let html = '';
    intentosData.realizados.forEach((intento, index) => {
        const aprobadoClass = intento.aprobado ? 'aprobado' : 'reprobado';
        const aprobadoTexto = intento.aprobado ? 'Aprobado' : 'Reprobado';
        const aprobadoIcono = intento.aprobado ? 'fa-check-circle' : 'fa-times-circle';
        
        html += `
            <div class="intento-card ${aprobadoClass}">
                <div class="intento-numero">
                    <i class="fas ${aprobadoIcono}"></i>
                    Intento ${intento.numero}
                </div>
                <div class="intento-detalles">
                    <div class="intento-nota">
                        <span class="nota-valor">${intento.nota}/100</span>
                        <span class="nota-porcentaje">(${intento.porcentaje}%)</span>
                    </div>
                    <div class="intento-estado">${aprobadoTexto}</div>
                    <div class="intento-fecha">${intento.fecha}</div>
                </div>
            </div>
        `;
    });
    
    intentosLista.innerHTML = html;
    
    intentosInfo.innerHTML = `
        <div class="intentos-resumen">
            <p><strong>Intentos realizados:</strong> ${intentosData.total}/3</p>
            <p><strong>Intentos restantes:</strong> ${intentosData.intentos_restantes}</p>
        </div>
    `;
    
    document.getElementById('intentosHistorial').style.display = 'block';
}

// Mostrar mensaje cuando se alcanza el límite de intentos
function mostrarLimiteIntentosAlcanzado() {
    const container = document.querySelector('.examen-container');
    container.innerHTML = `
        <div class="limite-alcanzado">
            <i class="fas fa-exclamation-triangle"></i>
            <h2>Límite de Intentos Alcanzado</h2>
            <p>Has completado el intento permitido para este examen.</p>
            
            <div class="intentos-realizados">
                <h3>Tus Calificaciones:</h3>
                ${intentosData.realizados.map((intento, index) => `
                    <div class="intento-resumen ${intento.aprobado ? 'aprobado' : 'reprobado'}">
                        <span class="intento-num">Intento ${intento.numero}:</span>
                        <span class="intento-nota">${intento.nota}/100</span>
                        <span class="intento-porcentaje">(${intento.porcentaje}%)</span>
                        <span class="intento-estado">${intento.aprobado ? '✓ Aprobado' : '✗ Reprobado'}</span>
                    </div>
                `).join('')}
            </div>
            
            <button class="btn-volver-examenes" onclick="window.location.href='/examenes/disponibles/'">
                <i class="fas fa-arrow-left"></i> Volver a Exámenes
            </button>
        </div>
    `;
}

// Inicializar examen
function inicializarExamen() {
    try {
        // Configurar header
        document.getElementById('examenTitulo').textContent = examen.titulo;
        document.getElementById('examenMateria').textContent = examen.materia_nombre;
        
        // Inicializar respuestas vacías primero
        examen.preguntas.forEach(pregunta => {
            respuestas[pregunta.id] = {};
        });
        
        // Verificar si hay progreso guardado
        const progresoGuardado = recuperarProgreso();
        
        if (progresoGuardado) {
            // Restaurar progreso guardado sobre las respuestas inicializadas
            Object.keys(progresoGuardado.respuestas).forEach(preguntaId => {
                if (respuestas[preguntaId]) {
                    respuestas[preguntaId] = progresoGuardado.respuestas[preguntaId];
                }
            });
            preguntaActualIndex = progresoGuardado.preguntaActual;
            tiempoInicio = progresoGuardado.tiempoInicio;
            tiempoRestante = progresoGuardado.tiempoRestante;
        } else {
            // Iniciar temporizador con tiempo completo
            tiempoInicio = Date.now();
            tiempoRestante = examen.duracion_minutos * 60; // en segundos
        }
        
        iniciarTimer();
        
        // Crear indicadores de preguntas
        crearIndicadoresPreguntas();
        
        // Mostrar pregunta actual
        mostrarPregunta(preguntaActualIndex);
        
        // Mostrar navegación
        document.getElementById('navegacionPreguntas').style.display = 'flex';
    } catch (error) {
        console.error('Error en inicializarExamen:', error);
        console.error('Stack:', error.stack);
        alert('Error al inicializar el examen. Por favor, recarga la página. Detalles: ' + error.message);
        // Limpiar progreso corrupto si hay error
        limpiarProgreso();
    }
}

// Iniciar temporizador
function iniciarTimer() {
    actualizarTimer();
    intervalTimer = setInterval(() => {
        const tiempoTranscurrido = Math.floor((Date.now() - tiempoInicio) / 1000);
        tiempoRestante = (examen.duracion_minutos * 60) - tiempoTranscurrido;
        
        if (tiempoRestante <= 0) {
            clearInterval(intervalTimer);
            limpiarProgreso(); // Limpiar progreso guardado
            alert('¡Tiempo agotado! El examen se finalizará automáticamente.');
            finalizarExamen();
        } else {
            actualizarTimer();
            guardarProgreso(); // Guardar progreso cada segundo
        }
    }, 1000);
}

// Actualizar display del temporizador
function actualizarTimer() {
    const minutos = Math.floor(tiempoRestante / 60);
    const segundos = tiempoRestante % 60;
    document.getElementById('tiempoRestante').textContent = 
        `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
    
    // Cambiar color si queda poco tiempo
    const timerElement = document.getElementById('timer');
    if (tiempoRestante < 300) { // 5 minutos
        timerElement.classList.add('tiempo-critico');
    }
}

// Crear indicadores de preguntas
function crearIndicadoresPreguntas() {
    const container = document.getElementById('indicadoresPreguntas');
    container.innerHTML = '';
    
    examen.preguntas.forEach((pregunta, index) => {
        const indicador = document.createElement('button');
        indicador.className = 'indicador-pregunta';
        indicador.textContent = index + 1;
        indicador.onclick = () => mostrarPregunta(index);
        indicador.dataset.index = index;
        container.appendChild(indicador);
    });
}

// Mostrar pregunta específica
function mostrarPregunta(index) {
    if (index < 0 || index >= examen.preguntas.length) return;
    
    preguntaActualIndex = index;
    const pregunta = examen.preguntas[index];
    
    // Asegurar que respuestas[pregunta.id] existe
    if (!respuestas[pregunta.id]) {
        respuestas[pregunta.id] = {};
    }
    
    const respuestaPregunta = respuestas[pregunta.id];
    
    // Construir HTML de la pregunta
    let html = `
        <div class="pregunta-card">
            <div class="pregunta-numero">Pregunta ${index + 1} de ${examen.preguntas.length}</div>
            <div class="pregunta-texto">${escapeHtml(pregunta.texto)}</div>
            
            <!-- Enunciados (Verdadero/Falso) -->
            ${pregunta.enunciados.length > 0 ? `
                <div class="enunciados-section">
                    <h3>Marca V (Verdadero) o F (Falso):</h3>
                    <div class="enunciados-lista">
                        ${pregunta.enunciados.map(enunciado => `
                            <div class="enunciado-item">
                                <div class="enunciado-numero">${enunciado.numero}</div>
                                <div class="enunciado-texto">${escapeHtml(enunciado.texto)}</div>
                                <div class="enunciado-opciones">
                                    <label class="radio-label ${respuestaPregunta[enunciado.id] === 'V' ? 'selected' : ''}">
                                        <input type="radio" name="enunciado_${enunciado.id}" value="V" 
                                            ${respuestaPregunta[enunciado.id] === 'V' ? 'checked' : ''}
                                            onchange="marcarEnunciado(${pregunta.id}, ${enunciado.id}, 'V')">
                                        <span class="radio-custom">V</span>
                                    </label>
                                    <label class="radio-label ${respuestaPregunta[enunciado.id] === 'F' ? 'selected' : ''}">
                                        <input type="radio" name="enunciado_${enunciado.id}" value="F"
                                            ${respuestaPregunta[enunciado.id] === 'F' ? 'checked' : ''}
                                            onchange="marcarEnunciado(${pregunta.id}, ${enunciado.id}, 'F')">
                                        <span class="radio-custom">F</span>
                                    </label>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- Opciones múltiples -->
            ${pregunta.opciones.length > 0 ? `
                <div class="opciones-section">
                    <h3>Selecciona la opción correcta:</h3>
                    <div class="opciones-lista">
                        ${pregunta.opciones.map(opcion => `
                            <label class="opcion-item ${respuestaPregunta['opcion'] == opcion.id ? 'selected' : ''}">
                                <input type="radio" name="opcion_${pregunta.id}" value="${opcion.id}"
                                    ${respuestaPregunta['opcion'] == opcion.id ? 'checked' : ''}
                                    onchange="marcarOpcion(${pregunta.id}, ${opcion.id})">
                                <div class="opcion-contenido">
                                    <span class="opcion-letra">${opcion.letra}</span>
                                    <span class="opcion-texto">${escapeHtml(opcion.descripcion)}</span>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    document.getElementById('preguntasWrapper').innerHTML = html;
    
    // Actualizar indicadores
    actualizarIndicadores();
    
    // Actualizar botones de navegación
    actualizarBotonesNavegacion(index);
    
    // Actualizar progreso
    actualizarProgreso();
}

// Marcar respuesta de enunciado
function marcarEnunciado(preguntaId, enunciadoId, valor) {
    if (!respuestas[preguntaId]) {
        respuestas[preguntaId] = {};
    }
    respuestas[preguntaId][enunciadoId] = valor;
    actualizarIndicadores();
    actualizarProgreso();
    guardarProgreso(); // Guardar progreso al responder
    
    // Actualizar visualmente
    const labels = document.querySelectorAll(`input[name="enunciado_${enunciadoId}"]`).forEach(input => {
        input.parentElement.classList.toggle('selected', input.checked);
    });
}

// Marcar opción seleccionada
function marcarOpcion(preguntaId, opcionId) {
    if (!respuestas[preguntaId]) {
        respuestas[preguntaId] = {};
    }
    respuestas[preguntaId]['opcion'] = opcionId;
    actualizarIndicadores();
    actualizarProgreso();
    guardarProgreso(); // Guardar progreso al responder
    
    // Actualizar visualmente
    const labels = document.querySelectorAll(`input[name="opcion_${preguntaId}"]`).forEach(input => {
        input.parentElement.classList.toggle('selected', input.checked);
    });
}

// Actualizar indicadores de progreso de preguntas
function actualizarIndicadores() {
    examen.preguntas.forEach((pregunta, index) => {
        const indicador = document.querySelector(`[data-index="${index}"]`);
        if (!indicador) return;
        
        // Verificar si la pregunta está contestada
        const respuesta = respuestas[pregunta.id] || {};
        let contestada = false;
        
        // Verificar enunciados
        const enunciadosContestados = pregunta.enunciados.length === 0 || pregunta.enunciados.every(e => respuesta[e.id]);
        // Verificar opciones
        const opcionContestada = pregunta.opciones.length === 0 || respuesta['opcion'];
        
        contestada = enunciadosContestados && opcionContestada;
        
        indicador.classList.toggle('contestada', contestada);
        indicador.classList.toggle('actual', index === preguntaActualIndex);
    });
}

// Actualizar barra de progreso
function actualizarProgreso() {
    let preguntasContestadas = 0;
    
    examen.preguntas.forEach(pregunta => {
        const respuesta = respuestas[pregunta.id] || {};
        const enunciadosContestados = pregunta.enunciados.length === 0 || pregunta.enunciados.every(e => respuesta[e.id]);
        const opcionContestada = pregunta.opciones.length === 0 || respuesta['opcion'];
        
        if (enunciadosContestados && opcionContestada) {
            preguntasContestadas++;
        }
    });
    
    const porcentaje = (preguntasContestadas / examen.preguntas.length) * 100;
    document.getElementById('progresoFill').style.width = porcentaje + '%';
    document.getElementById('progresoTexto').textContent = `${preguntasContestadas}/${examen.preguntas.length}`;
}

// Navegar a pregunta anterior
function preguntaAnterior() {
    if (preguntaActualIndex > 0) {
        mostrarPregunta(preguntaActualIndex - 1);
        guardarProgreso(); // Guardar progreso al navegar
    }
}

// Navegar a pregunta siguiente
function preguntaSiguiente() {
    if (preguntaActualIndex < examen.preguntas.length - 1) {
        mostrarPregunta(preguntaActualIndex + 1);
        guardarProgreso(); // Guardar progreso al navegar
    }
}

// Actualizar botones de navegación
function actualizarBotonesNavegacion(index) {
    const btnAnterior = document.getElementById('btnAnterior');
    const btnSiguiente = document.getElementById('btnSiguiente');
    const esUltimaPregunta = index === examen.preguntas.length - 1;
    
    // Botón anterior
    btnAnterior.disabled = index === 0;
    
    // Botón siguiente/finalizar
    if (esUltimaPregunta) {
        btnSiguiente.innerHTML = '<i class="fas fa-check"></i> Finalizar Examen';
        btnSiguiente.classList.add('btn-finalizar-examen');
    } else {
        btnSiguiente.innerHTML = 'Siguiente <i class="fas fa-chevron-right"></i>';
        btnSiguiente.classList.remove('btn-finalizar-examen');
    }
}

// Manejar click en botón siguiente/finalizar
function manejarBotonSiguiente() {
    const esUltimaPregunta = preguntaActualIndex === examen.preguntas.length - 1;
    
    if (esUltimaPregunta) {
        confirmarFinalizarExamen();
    } else {
        preguntaSiguiente();
    }
}

// Confirmar finalización del examen
function confirmarFinalizarExamen() {
    // Verificar que todas las preguntas estén contestadas
    let preguntasSinContestar = [];
    
    examen.preguntas.forEach((pregunta, index) => {
        const respuesta = respuestas[pregunta.id] || {};
        const enunciadosContestados = pregunta.enunciados.length === 0 || pregunta.enunciados.every(e => respuesta[e.id]);
        const opcionContestada = pregunta.opciones.length === 0 || respuesta['opcion'];
        
        if (!enunciadosContestados || !opcionContestada) {
            preguntasSinContestar.push(index + 1);
        }
    });
    
    if (preguntasSinContestar.length > 0) {
        // Actualizar cantidad en el modal
        const cantidadElement = document.getElementById('cantidadPreguntasSinContestar');
        if (cantidadElement) {
            cantidadElement.textContent = preguntasSinContestar.length;
        }
        // Mostrar modal personalizado en lugar de confirm()
        document.getElementById('modalPreguntasSinContestar').style.display = 'flex';
        return;
    }
    
    document.getElementById('modalConfirmar').style.display = 'flex';
}

// Cerrar modal de confirmación
function cerrarModalConfirmar() {
    document.getElementById('modalConfirmar').style.display = 'none';
}

// Finalizar examen y enviar respuestas
async function finalizarExamen() {
    cerrarModalConfirmar();
    clearInterval(intervalTimer);
    limpiarProgreso(); // Limpiar progreso guardado al finalizar
    
    // Calcular tiempo empleado
    const tiempoEmpleado = Math.floor((Date.now() - tiempoInicio) / 1000);
    
    try {
        const response = await fetch(`/examenes/api/estudiante/examen/${examen.id}/calificar/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                respuestas: respuestas,
                tiempo_empleado: tiempoEmpleado
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarResultados(data.calificacion, data.resultados);
        } else {
            alert('Error al calificar el examen: ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al enviar las respuestas');
    }
}

// Mostrar resultados del examen
function mostrarResultados(calificacion, resultados) {
    const aprobadoClass = calificacion.aprobado ? 'aprobado' : 'reprobado';
    const aprobadoTexto = calificacion.aprobado ? '¡Aprobado!' : 'Reprobado';
    const aprobadoIcono = calificacion.aprobado ? 'fa-check-circle' : 'fa-times-circle';
    
    // Calificación general
    document.getElementById('resultadoCalificacion').innerHTML = `
        <div class="calificacion-principal ${aprobadoClass}">
            <i class="fas ${aprobadoIcono}"></i>
            <div class="calificacion-info">
                <h3>${aprobadoTexto}</h3>
                <div class="nota-final">${calificacion.nota}/100</div>
                <div class="porcentaje">${calificacion.porcentaje}%</div>
            </div>
        </div>
        <div class="intentos-info-resultado">
            <p><strong>Intento:</strong> ${calificacion.numero_intento} de 3</p>
            <p><strong>Intentos restantes:</strong> ${calificacion.intentos_restantes}</p>
        </div>
        <div class="estadisticas-resumen">
            <div class="stat-item">
                <span class="stat-numero correctas">${calificacion.preguntas_correctas}</span>
                <span class="stat-label">Correctas</span>
            </div>
            <div class="stat-item">
                <span class="stat-numero incorrectas">${calificacion.preguntas_incorrectas}</span>
                <span class="stat-label">Incorrectas</span>
            </div>
            <div class="stat-item">
                <span class="stat-numero total">${calificacion.total_preguntas}</span>
                <span class="stat-label">Total</span>
            </div>
        </div>
    `;
    
    // Detalles de cada pregunta
    let detallesHTML = '<div class="preguntas-revision">';
    
    resultados.forEach((resultado, index) => {
        const correctaClass = resultado.correcta ? 'correcta' : 'incorrecta';
        const correctaIcono = resultado.correcta ? 'fa-check' : 'fa-times';
        
        detallesHTML += `
            <div class="pregunta-revision ${correctaClass}">
                <div class="revision-header">
                    <span class="pregunta-num">Pregunta ${index + 1}</span>
                    <i class="fas ${correctaIcono}"></i>
                </div>
                <div class="pregunta-texto">${escapeHtml(resultado.texto)}</div>
                
                ${resultado.enunciados.length > 0 ? `
                    <div class="enunciados-revision">
                        ${resultado.enunciados.map(e => `
                            <div class="enunciado-revision ${e.correcto ? 'correcto' : 'incorrecto'}">
                                <span class="enum-num">${e.numero}.</span>
                                <span class="enum-texto">${escapeHtml(e.texto)}</span>
                                <div class="enum-respuestas">
                                    <span class="respuesta-correcta">Correcta: ${e.respuesta_correcta}</span>
                                    ${!e.correcto ? `<span class="respuesta-tuya">Tu respuesta: ${e.respuesta_estudiante || 'Sin respuesta'}</span>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${resultado.opciones.length > 0 ? `
                    <div class="opciones-revision">
                        ${resultado.opciones.map(o => `
                            <div class="opcion-revision ${o.es_correcta ? 'correcta' : ''} ${o.seleccionada ? 'seleccionada' : ''}">
                                <span class="opc-letra">${o.letra}</span>
                                <span class="opc-texto">${escapeHtml(o.descripcion)}</span>
                                ${o.es_correcta ? '<i class="fas fa-check-circle"></i>' : ''}
                                ${o.seleccionada && !o.es_correcta ? '<i class="fas fa-times-circle"></i>' : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    detallesHTML += '</div>';
    document.getElementById('resultadoDetalles').innerHTML = detallesHTML;
    
    // Mostrar modal
    document.getElementById('modalResultados').style.display = 'flex';
}

// Utilidades
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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

// Guardar progreso en localStorage
function guardarProgreso() {
    if (!examen) return;
    
    const progreso = {
        examenId: examen.id,
        respuestas: respuestas,
        preguntaActual: preguntaActualIndex,
        tiempoInicio: tiempoInicio,
        tiempoRestante: tiempoRestante,
        timestamp: Date.now()
    };
    
    localStorage.setItem(`examen_progreso_${examen.id}`, JSON.stringify(progreso));
}

// Recuperar progreso de localStorage
function recuperarProgreso() {
    if (!examen) return null;
    
    const progresoGuardado = localStorage.getItem(`examen_progreso_${examen.id}`);
    if (!progresoGuardado) return null;
    
    try {
        const progreso = JSON.parse(progresoGuardado);
        
        // Verificar que el progreso sea del mismo examen
        if (progreso.examenId !== examen.id) {
            return null;
        }
        
        // Verificar que no haya expirado (máximo 24 horas)
        const tiempoTranscurrido = Date.now() - progreso.timestamp;
        const maxTiempo = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
        
        if (tiempoTranscurrido > maxTiempo) {
            limpiarProgreso();
            return null;
        }
        
        // Validar que preguntaActual sea un índice válido
        if (progreso.preguntaActual < 0 || progreso.preguntaActual >= examen.preguntas.length) {
            progreso.preguntaActual = 0;
        }
        
        // Validar que respuestas sea un objeto
        if (!progreso.respuestas || typeof progreso.respuestas !== 'object') {
            progreso.respuestas = {};
        }
        
        return progreso;
    } catch (error) {
        console.error('Error al recuperar progreso:', error);
        limpiarProgreso();
        return null;
    }
}

// Limpiar progreso guardado
function limpiarProgreso() {
    if (!examen) return;
    localStorage.removeItem(`examen_progreso_${examen.id}`);
}

// Confirmar salir del examen
function confirmarSalirExamen() {
    document.getElementById('modalSalir').style.display = 'flex';
}

// Cerrar modal de salir
function cerrarModalSalir() {
    document.getElementById('modalSalir').style.display = 'none';
}

// Salir del examen
function salirExamen() {
    clearInterval(intervalTimer);
    limpiarProgreso();
    window.location.href = '/examenes/disponibles/';
}

// Cerrar modal de preguntas sin contestar
function cerrarModalPreguntasSinContestar() {
    document.getElementById('modalPreguntasSinContestar').style.display = 'none';
}

// Finalizar examen desde modal de preguntas sin contestar
function finalizarDesdePreguntasSinContestar() {
    cerrarModalPreguntasSinContestar();
    document.getElementById('modalConfirmar').style.display = 'flex';
}

// Mostrar notificación toast
function mostrarToast(mensaje, tipo = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    // Crear elemento toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    
    // Determinar el icono según el tipo
    let icono = '';
    switch(tipo) {
        case 'success':
            icono = '✓';
            break;
        case 'warning':
            icono = '⚠';
            break;
        case 'error':
            icono = '✕';
            break;
        case 'info':
        default:
            icono = 'ℹ';
            break;
    }
    
    toast.innerHTML = `
        <span class="toast-icon">${icono}</span>
        <span class="toast-message">${mensaje}</span>
        <button class="toast-close" onclick="cerrarToast(this)">&times;</button>
    `;
    
    // Agregar al contenedor
    container.appendChild(toast);
    
    // Auto-cerrar después de 4 segundos
    setTimeout(() => {
        cerrarToast(toast.querySelector('.toast-close'));
    }, 4000);
}

// Cerrar notificación toast
function cerrarToast(button) {
    const toast = button.parentElement || button;
    toast.classList.add('fade-out');
    setTimeout(() => {
        toast.remove();
    }, 300);
}
