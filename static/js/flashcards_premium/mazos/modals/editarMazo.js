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

window.editarMazoModal = async function(mazoId) {
    try {
        const response = await fetch('/flashcards-premium/api/mazos/');
        const data = await response.json();
        
        if (data.success) {
            const mazo = data.mazos.find(m => m.id === mazoId);
            
            if (mazo) {
                document.getElementById('editMazoId').value = mazo.id;
                document.getElementById('editNombreMazo').value = mazo.nombre;
                document.getElementById('editDescripcionMazo').value = mazo.descripcion || '';
                
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
