// Script para modal crear mazo

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
async function cargarMateriasCrear() {
    try {
        console.log('Cargando materias...');
        const response = await fetch('/materias/api/materias/');
        const data = await response.json();
        console.log('Respuesta de materias:', data);
        
        const selectMateria = document.getElementById('materiaMazo');
        console.log('Select encontrado:', selectMateria);
        
        if (selectMateria && data.success && data.data) {
            selectMateria.innerHTML = '<option value="">Seleccione una materia</option>';
            console.log('Cantidad de materias:', data.data.length);
            data.data.forEach(materia => {
                const option = document.createElement('option');
                option.value = materia.id;
                option.textContent = materia.nombre;
                selectMateria.appendChild(option);
                console.log('Materia agregada:', materia.nombre);
            });
        } else {
            console.log('No se cumplió la condición:', {
                selectMateria: !!selectMateria,
                success: data.success,
                hasData: !!data.data
            });
        }
    } catch (error) {
        console.error('Error al cargar materias:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const btnGuardar = document.getElementById('btnGuardarMazo');
    
    if (btnGuardar) {
        btnGuardar.addEventListener('click', async function() {
            const formData = new FormData();
            formData.append('nombre', document.getElementById('nombreMazo').value);
            formData.append('descripcion', document.getElementById('descripcionMazo').value);
            formData.append('materia_id', document.getElementById('materiaMazo').value);
            
            try {
                const response = await fetch('/flashcards-premium/api/mazos/crear/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken')
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    alert('Mazo creado exitosamente');
                    cerrarModal('crearMazoModal');
                    if (typeof cargarMazos === 'function') {
                        cargarMazos();
                    }
                } else {
                    alert('Error: ' + (data.error || 'No se pudo crear el mazo'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al crear el mazo');
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
