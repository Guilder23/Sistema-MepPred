// Script para modal de gestión de preguntas

let preguntasExamen = [];
let contadorEnunciados = 0;
let contadorOpciones = 0;

document.addEventListener('DOMContentLoaded', function() {
    const btnCerrar = document.getElementById('btnCerrarPreguntas');
    const btnAgregar = document.getElementById('btnAgregarPregunta');

    if (btnCerrar) {
        btnCerrar.addEventListener('click', function() {
            cerrarModal('modalPreguntasOverlay');
        });
    }

    if (btnAgregar) {
        btnAgregar.addEventListener('click', mostrarFormularioPregunta);
    }

    // Cerrar modal al hacer clic en X
    const btnClose = document.querySelector('.modal-preguntas-btn-close');
    if (btnClose) {
        btnClose.addEventListener('click', function() {
            cerrarModal('modalPreguntasOverlay');
        });
    }

    // Cerrar modal al hacer clic fuera del modal
    const modalOverlay = document.querySelector('.modal-preguntas-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                cerrarModal('modalPreguntasOverlay');
            }
        });
    }
});

// Cargar preguntas de un examen
function cargarPreguntasExamen(examenId) {
    fetch(`/examenes/api/examenes/${examenId}/`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                preguntasExamen = data.examen.preguntas || [];
                mostrarListaPreguntas();
            }
        })
        .catch(error => {
            mostrarMensaje('Error', 'No se pudieron cargar las preguntas', 'error');
        });
}

// Mostrar lista de preguntas
function mostrarListaPreguntas() {
    const container = document.getElementById('listaPreguntasContainer');
    
    if (preguntasExamen.length === 0) {
        container.innerHTML = `
            <div class="mensaje-vacio">
                <i class="fas fa-question-circle"></i>
                <p>No hay preguntas agregadas</p>
                <p style="font-size: 0.9rem; color: #6c757d;">Haz clic en "Agregar Pregunta" para comenzar</p>
            </div>
        `;
        return;
    }

    container.innerHTML = preguntasExamen.map((pregunta, index) => {
        const enunciadosHTML = pregunta.enunciados.map(e => `
            <div class="enunciado-item">
                <span class="enunciado-numero">${e.numero}.</span>
                <span>${escapeHtml(e.texto)}</span>
                <span class="enunciado-badge ${e.es_verdadero ? 'badge-verdadero' : 'badge-falso'}">
                    ${e.es_verdadero ? 'Verdadero' : 'Falso'}
                </span>
            </div>
        `).join('');

        const opcionesHTML = pregunta.opciones.map(o => `
            <div class="opcion-item ${o.es_correcta ? 'opcion-correcta' : ''}">
                <span class="opcion-letra">${o.letra}:</span>
                <span>${escapeHtml(o.descripcion)} ${o.es_correcta ? '✓' : ''}</span>
            </div>
        `).join('');

        return `
            <div class="pregunta-item">
                <div class="pregunta-item-header">
                    <span class="pregunta-numero">Pregunta ${index + 1}</span>
                    <div class="pregunta-acciones">
                        <button class="btn-pregunta-icon btn-editar-pregunta" onclick="editarPregunta(${index})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-pregunta-icon btn-eliminar-pregunta" onclick="eliminarPregunta(${index})" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="pregunta-texto">${escapeHtml(pregunta.texto)}</div>
                <div class="pregunta-enunciados">
                    <h4>Enunciados:</h4>
                    ${enunciadosHTML}
                </div>
                <div class="pregunta-opciones">
                    <h4>Opciones de Respuesta:</h4>
                    ${opcionesHTML}
                </div>
            </div>
        `;
    }).join('');
}

// Mostrar formulario para nueva pregunta
function mostrarFormularioPregunta() {
    const formulario = document.getElementById('formularioPregunta');
    formulario.style.display = 'block';
    document.getElementById('tituloPreguntaForm').textContent = 'Nueva Pregunta';
    document.getElementById('preguntaIdEdit').value = '';
    document.getElementById('textoPregunta').value = '';
    
    // Limpiar y agregar 2 enunciados por defecto
    document.getElementById('enunciadosContainer').innerHTML = '';
    contadorEnunciados = 0;
    agregarEnunciado();
    agregarEnunciado();
    
    // Limpiar y agregar opciones por defecto (A-H para 3 enunciados)
    document.getElementById('opcionesContainer').innerHTML = '';
    contadorOpciones = 0;
    const letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    letras.forEach(letra => agregarOpcion(letra));
}

// Agregar enunciado al formulario
function agregarEnunciado(numero = null, texto = '', esVerdadero = true) {
    const container = document.getElementById('enunciadosContainer');
    contadorEnunciados++;
    const num = numero || contadorEnunciados;
    
    const div = document.createElement('div');
    div.className = 'enunciado-input';
    div.innerHTML = `
        <input type="number" value="${num}" min="1" placeholder="Nº" required>
        <textarea placeholder="Texto del enunciado..." rows="2" required>${escapeHtml(texto)}</textarea>
        <select required>
            <option value="true" ${esVerdadero ? 'selected' : ''}>Verdadero</option>
            <option value="false" ${!esVerdadero ? 'selected' : ''}>Falso</option>
        </select>
        <button type="button" class="btn-remove" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(div);
}

// Agregar opción al formulario
function agregarOpcion(letra = '', descripcion = '', esCorrecta = false) {
    const container = document.getElementById('opcionesContainer');
    
    // Calcular la siguiente letra basándose en cuántas opciones ya existen
    const opcionesActuales = container.querySelectorAll('.opcion-input').length;
    const letraDefault = letra || String.fromCharCode(65 + opcionesActuales); // A=65, B=66, C=67...
    
    const div = document.createElement('div');
    div.className = 'opcion-input';
    div.innerHTML = `
        <input type="text" value="${letraDefault}" maxlength="1" placeholder="Letra" required>
        <input type="text" value="${escapeHtml(descripcion)}" placeholder="Descripción (ej: si 1 y 2 son correctos)" required>
        <label>
            <input type="checkbox" ${esCorrecta ? 'checked' : ''}>
            Es correcta
        </label>
        <button type="button" class="btn-remove" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(div);
}

// Guardar pregunta
function guardarPregunta() {
    const texto = document.getElementById('textoPregunta').value.trim();
    const btnGuardar = document.querySelector('.btn-guardar-pregunta');
    
    if (!texto) {
        mostrarMensaje('El texto de la pregunta es requerido', 'error');
        return;
    }

    // Recopilar enunciados
    const enunciados = [];
    document.querySelectorAll('.enunciado-input').forEach(div => {
        const numero = parseInt(div.querySelector('input[type="number"]').value);
        const textoEnunc = div.querySelector('textarea').value.trim();
        const esVerdadero = div.querySelector('select').value === 'true';
        
        if (textoEnunc) {
            enunciados.push({ numero, texto: textoEnunc, es_verdadero: esVerdadero });
        }
    });

    // Recopilar opciones
    const opciones = [];
    document.querySelectorAll('.opcion-input').forEach(div => {
        const inputs = div.querySelectorAll('input[type="text"]');
        const letra = inputs[0].value.trim().toUpperCase();
        const descripcion = inputs[1].value.trim();
        const esCorrecta = div.querySelector('input[type="checkbox"]').checked;
        
        if (letra && descripcion) {
            opciones.push({ letra, descripcion, es_correcta: esCorrecta });
        }
    });

    if (enunciados.length === 0) {
        mostrarMensaje('Debe agregar al menos un enunciado', 'error');
        return;
    }

    if (opciones.length === 0) {
        mostrarMensaje('Debe agregar al menos una opción', 'error');
        return;
    }

    const pregunta = {
        texto: texto,
        orden: preguntasExamen.length + 1,
        enunciados: enunciados,
        opciones: opciones
    };

    const indexEdit = document.getElementById('preguntaIdEdit').value;
    
    if (indexEdit !== '') {
        // Editar existente
        preguntasExamen[parseInt(indexEdit)] = pregunta;
    } else {
        // Agregar nueva
        preguntasExamen.push(pregunta);
    }

    // Deshabilitar botón para evitar múltiples clics
    if (btnGuardar) {
        btnGuardar.disabled = true;
        btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    }

    // Guardar en el servidor
    guardarPreguntasExamen(btnGuardar);
}

// Guardar preguntas en el servidor
function guardarPreguntasExamen(btnGuardar) {
    const examenId = document.getElementById('examenIdPreguntas').value;

    fetch(`/examenes/api/examenes/${examenId}/actualizar/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            preguntas: preguntasExamen
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarMensaje('Pregunta guardada correctamente', 'success');
            cargarPreguntasExamen(examenId);
            cancelarPregunta();
        } else {
            mostrarMensaje(data.error || 'Error al guardar la pregunta', 'error');
            // Rehabilitar botón en caso de error
            if (btnGuardar) {
                btnGuardar.disabled = false;
                btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar Pregunta';
            }
        }
    })
    .catch(error => {
        mostrarMensaje('Error al guardar la pregunta', 'error');
        // Rehabilitar botón en caso de error
        if (btnGuardar) {
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar Pregunta';
        }
    });
}

// Editar pregunta existente
function editarPregunta(index) {
    const pregunta = preguntasExamen[index];
    const formulario = document.getElementById('formularioPregunta');
    
    formulario.style.display = 'block';
    document.getElementById('tituloPreguntaForm').textContent = `Editar Pregunta ${index + 1}`;
    document.getElementById('preguntaIdEdit').value = index;
    document.getElementById('textoPregunta').value = pregunta.texto;
    
    // Cargar enunciados
    document.getElementById('enunciadosContainer').innerHTML = '';
    contadorEnunciados = 0;
    pregunta.enunciados.forEach(e => {
        agregarEnunciado(e.numero, e.texto, e.es_verdadero);
    });
    
    // Cargar opciones
    document.getElementById('opcionesContainer').innerHTML = '';
    contadorOpciones = 0;
    pregunta.opciones.forEach(o => {
        agregarOpcion(o.letra, o.descripcion, o.es_correcta);
    });
    
    formulario.scrollIntoView({ behavior: 'smooth' });
}

// Eliminar pregunta
let indicePreguntaEliminar = null;

function eliminarPregunta(index) {
    indicePreguntaEliminar = index;
    document.getElementById('modalConfirmarEliminarPregunta').classList.add('active');
}

// Confirmar eliminación de pregunta
document.addEventListener('DOMContentLoaded', function() {
    const btnConfirmar = document.getElementById('btnConfirmarEliminarPregunta');
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', function() {
            if (indicePreguntaEliminar !== null) {
                preguntasExamen.splice(indicePreguntaEliminar, 1);
                guardarPreguntasExamen();
                cerrarModalConfirmarEliminar();
                indicePreguntaEliminar = null;
            }
        });
    }
});

function cerrarModalConfirmarEliminar() {
    document.getElementById('modalConfirmarEliminarPregunta').classList.remove('active');
    indicePreguntaEliminar = null;
}

// Cancelar formulario de pregunta
function cancelarPregunta() {
    const formulario = document.getElementById('formularioPregunta');
    const btnGuardar = document.querySelector('.btn-guardar-pregunta');
    
    // Restaurar estado del botón
    if (btnGuardar) {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar Pregunta';
    }
    
    formulario.style.display = 'none';
    document.getElementById('textoPregunta').value = '';
    document.getElementById('enunciadosContainer').innerHTML = '';
    document.getElementById('opcionesContainer').innerHTML = '';
    document.getElementById('preguntaIdEdit').value = '';
}
