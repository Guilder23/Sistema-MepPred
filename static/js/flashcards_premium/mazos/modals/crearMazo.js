// Script para modal crear mazo

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
    const overlay = document.getElementById('modalCrearMazoOverlay');
    
    if (overlay) {
        // Observar cambios en la clase active
        const observer = new MutationObserver(() => {
            if (overlay.classList.contains('active')) {
                // Limpiar formulario
                const form = document.getElementById('formCrearMazo');
                if (form) {
                    form.reset();
                }
                // Resetear temas
                const temaSelect = document.getElementById('temaMazo');
                if (temaSelect) {
                    temaSelect.innerHTML = '<option value="">Seleccione un tema</option>';
                }
                // Cargar materias
                cargarMateriasCrearMazo();
            }
        });
        observer.observe(overlay, { attributes: true, attributeFilter: ['class'] });
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
                    mostrarMensaje('Éxito', 'Mazo creado exitosamente', 'success');
                    ocultarModal('modalCrearMazoOverlay');
                    if (typeof cargarMazos === 'function') {
                        cargarMazos();
                    }
                } else {
                    mostrarMensaje('Error', 'Error: ' + (data.error || 'No se pudo crear el mazo'), 'danger');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarMensaje('Error', 'Error al crear el mazo', 'danger');
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
