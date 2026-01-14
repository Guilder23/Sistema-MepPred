// Script para modal editar mazo

// Funciones para manejar modales
window.abrirModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

window.cerrarModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        const form = modal.querySelector('form');
        if (form) form.reset();
    }
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        cerrarModal(e.target.id);
    }
});

// Cargar materias en el select
async function cargarMateriasEditar() {
    try {
        const response = await fetch('/materias/api/materias/');
        const data = await response.json();
        
        const selectMateria = document.getElementById('editMateriaMazo');
        if (selectMateria && data.success && data.data) {
            selectMateria.innerHTML = '<option value="">Seleccione una materia</option>';
            data.data.forEach(materia => {
                const option = document.createElement('option');
                option.value = materia.id;
                option.textContent = materia.nombre;
                selectMateria.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar materias:', error);
    }
}

window.editarMazoModal = async function(mazoId) {
    try {
        // Primero cargar las materias
        await cargarMateriasEditar();
        
        // Luego cargar los datos del mazo
        const response = await fetch('/flashcards-premium/api/mazos/');
        const data = await response.json();
        
        if (data.success) {
            const mazo = data.mazos.find(m => m.id === mazoId);
            
            if (mazo) {
                document.getElementById('editMazoId').value = mazo.id;
                document.getElementById('editNombreMazo').value = mazo.nombre;
                document.getElementById('editDescripcionMazo').value = mazo.descripcion || '';
                
                // Seleccionar la materia actual
                const selectMateria = document.getElementById('editMateriaMazo');
                if (selectMateria && mazo.materia_id) {
                    selectMateria.value = mazo.materia_id;
                }
                
                abrirModal('editarMazoModal');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar el mazo');
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
                    alert('Mazo actualizado exitosamente');
                    cerrarModal('editarMazoModal');
                    if (typeof cargarMazos === 'function') {
                        cargarMazos();
                    }
                } else {
                    alert('Error: ' + (data.error || 'No se pudo actualizar'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al actualizar el mazo');
            }
        });
    }
});
