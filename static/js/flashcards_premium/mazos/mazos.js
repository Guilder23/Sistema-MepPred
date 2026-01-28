// JavaScript para Gestión de Mazos Premium
document.addEventListener('DOMContentLoaded', function() {
    console.log('Mazos.js cargado');
    cargarMazos();
    
    // Event listener para el buscador
    const inputBuscar = document.getElementById('buscarMazo');
    if (inputBuscar) {
        inputBuscar.addEventListener('input', filtrarMazos);
    }
    
    // Event listener para el botón crear
    const btnCrear = document.getElementById('btnCrearMazo');
    console.log('Botón crear encontrado:', btnCrear);
    if (btnCrear) {
        btnCrear.addEventListener('click', async function() {
            console.log('Click en botón crear mazo');
            // Cargar materias antes de abrir el modal
            if (typeof cargarMateriasCrear === 'function') {
                await cargarMateriasCrear();
            }
            abrirModal('crearMazoModal');
        });
    }
});

// Función para cargar todos los mazos
async function cargarMazos() {
    try {
        const response = await fetch('/flashcards-premium/api/mazos/');
        const data = await response.json();
        
        if (data.success) {
            mostrarMazos(data.mazos);
        } else {
            console.error('Error al cargar mazos:', data.error);
        }
    } catch (error) {
        console.error('Error en la petición:', error);
    }
}

// Función para mostrar mazos en la tabla
function mostrarMazos(mazos) {
    const tbody = document.getElementById('tablaMazos');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (mazos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="no-data-message">
                    <i>📚</i>
                    <p>No hay mazos creados aún. ¡Crea tu primer mazo!</p>
                </td>
            </tr>
        `;
        return;
    }
    
    mazos.forEach(mazo => {
        const tr = document.createElement('tr');
        tr.dataset.mazoId = mazo.id;
        tr.dataset.mazoNombre = (mazo.nombre || '').toLowerCase();
        
        tr.innerHTML = `
            <td>${mazo.id}</td>
            <td><strong>${mazo.nombre}</strong></td>
            <td><span style="background: #10b981; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem;">${mazo.materia_nombre || 'Sin materia'}</span></td>
            <td>${mazo.descripcion || '-'}</td>
            <td><span style="background: #667eea; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem;">${mazo.tarjetas_count || 0}</span></td>
            <td>${mazo.created_at}</td>
            <td>
                <div class="acciones-cell">
                    <button class="btn-accion btn-ver" onclick="verMazo(${mazo.id})" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-accion btn-editar" onclick="editarMazo(${mazo.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-accion btn-eliminar" onclick="eliminarMazo(${mazo.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

// Función para filtrar mazos
function filtrarMazos() {
    const busqueda = document.getElementById('buscarMazo').value.toLowerCase();
    const filas = document.querySelectorAll('#tablaMazos tr');
    
    filas.forEach(fila => {
        const nombre = fila.dataset.mazoNombre || '';
        if (nombre.includes(busqueda)) {
            fila.style.display = '';
        } else {
            fila.style.display = 'none';
        }
    });
}

// Funciones de acciones (se conectan con los modales)
function verMazo(id) {
    if (typeof window.verMazoModal === 'function') {
        window.verMazoModal(id);
    }
}

function editarMazo(id) {
    if (typeof window.editarMazoModal === 'function') {
        window.editarMazoModal(id);
    }
}

function eliminarMazo(id) {
    if (typeof window.eliminarMazoModal === 'function') {
        window.eliminarMazoModal(id);
    }
}
