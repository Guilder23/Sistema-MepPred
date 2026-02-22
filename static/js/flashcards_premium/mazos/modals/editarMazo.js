// Script para modal editar mazo

// Cargar materias en el select editar
async function cargarMateriasEditarMazo(callback) {
    try {
        const response = await fetch('/temas/api/materias/');
        const data = await response.json();
        
        if (data.success) {
            const selectMateria = document.getElementById('editMateriaMazo');
            if (selectMateria) {
                selectMateria.innerHTML = '<option value="">Seleccione una materia</option>';
                data.materias.forEach(materia => {
                    const option = document.createElement('option');
                    option.value = materia.id;
                    option.textContent = materia.nombre;
                    selectMateria.appendChild(option);
                });
            }
            if (callback) callback();
        }
    } catch (error) {
        console.error('Error al cargar materias:', error);
    }
}

// Cargar temas filtrados por materia en editar
async function cargarTemasEditarMazo() {
    try {
        const materiaSelect = document.getElementById('editMateriaMazo');
        const temaSelect = document.getElementById('editTemaMazo');
        
        if (!materiaSelect || !temaSelect || !materiaSelect.value) {
            temaSelect.innerHTML = '<option value="">Seleccione un tema</option>';
            return;
        }
        
        const response = await fetch(`/temas/api/temas/por-materia/${materiaSelect.value}/`);
        const data = await response.json();
        
        if (data.success) {
            temaSelect.innerHTML = '<option value="">Seleccione un tema</option>';
            data.temas.forEach(tema => {
                const option = document.createElement('option');
                option.value = tema.id;
                option.textContent = tema.nombre;
                temaSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar temas:', error);
    }
}

window.editarMazoModal = async function(mazoId) {
    try {
        // obtener datos del mazo primero
        const response = await fetch('/flashcards-premium/api/mazos/');
        const data = await response.json();
        
        if (data.success) {
            const mazo = data.mazos.find(m => m.id === mazoId);
            
            if (mazo) {
                document.getElementById('editMazoId').value = mazo.id;
                document.getElementById('editNombreMazo').value = mazo.nombre;
                document.getElementById('editDescripcionMazo').value = mazo.descripcion || '';
                
                // Cargar materias con callback para asignar materia
                await cargarMateriasEditarMazo(async function() {
                    const selectMateria = document.getElementById('editMateriaMazo');
                    if (selectMateria && mazo.materia_id) {
                        selectMateria.value = mazo.materia_id;
                    }
                    
                    // Cargar temas filtrados por materia
                    await cargarTemasEditarMazo();
                    
                    // Seleccionar el tema actual
                    const selectTema = document.getElementById('editTemaMazo');
                    if (selectTema && mazo.tema_id) {
                        selectTema.value = mazo.tema_id;
                    }
                });
                
                mostrarModal('modalEditarMazoOverlay');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error', 'Error al cargar el mazo', 'danger');
    }
};

document.addEventListener('DOMContentLoaded', function() {
    const btnActualizar = document.getElementById('btnActualizarMazo');
    
    if (btnActualizar) {
        btnActualizar.addEventListener('click', async function() {
            const id = document.getElementById('editMazoId').value;
            const formData = new FormData();
            formData.append('nombre', document.getElementById('editNombreMazo').value);
            formData.append('descripcion', document.getElementById('editDescripcionMazo').value);
            formData.append('materia_id', document.getElementById('editMateriaMazo').value);
            formData.append('tema_id', document.getElementById('editTemaMazo').value);
            
            try {
                const response = await fetch(`/flashcards-premium/api/mazos/${id}/editar/`, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken')
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    mostrarMensaje('Éxito', 'Mazo actualizado exitosamente', 'success');
                    ocultarModal('modalEditarMazoOverlay');
                    if (typeof cargarMazos === 'function') {
                        cargarMazos();
                    }
                } else {
                    mostrarMensaje('Error', 'Error: ' + (data.error || 'No se pudo actualizar'), 'danger');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarMensaje('Error', 'Error al actualizar el mazo', 'danger');
            }
        });
    }
});

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
