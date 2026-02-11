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

// Cargar materias en el select crear
async function cargarMateriasCrearMazo() {
    try {
        const response = await fetch('/temas/api/materias/');
        const data = await response.json();
        
        if (data.success) {
            const selectMateria = document.getElementById('materiaMazo');
            if (selectMateria) {
                selectMateria.innerHTML = '<option value="">Seleccione una materia</option>';
                data.materias.forEach(materia => {
                    const option = document.createElement('option');
                    option.value = materia.id;
                    option.textContent = materia.nombre;
                    selectMateria.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error al cargar materias:', error);
    }
}

// Cargar temas filtrados por materia
async function cargarTemasCrearMazo() {
    try {
        const materiaSelect = document.getElementById('materiaMazo');
        const temaSelect = document.getElementById('temaMazo');
        
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

document.addEventListener('DOMContentLoaded', function() {
    // Cargar materias cuando se abre el modal
    const crearMazoModal = document.getElementById('crearMazoModal');
    if (crearMazoModal) {
        // Observar cambios en el display del modal
        const observer = new MutationObserver(() => {
            if (crearMazoModal.style.display === 'flex') {
                cargarMateriasCrearMazo();
            }
        });
        observer.observe(crearMazoModal, { attributes: true, attributeFilter: ['style'] });
    }
    
    const btnGuardar = document.getElementById('btnGuardarMazo');
    
    if (btnGuardar) {
        btnGuardar.addEventListener('click', async function() {
            const formData = new FormData();
            formData.append('nombre', document.getElementById('nombreMazo').value);
            formData.append('descripcion', document.getElementById('descripcionMazo').value);
            formData.append('materia_id', document.getElementById('materiaMazo').value);
            formData.append('tema_id', document.getElementById('temaMazo').value);
            
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
