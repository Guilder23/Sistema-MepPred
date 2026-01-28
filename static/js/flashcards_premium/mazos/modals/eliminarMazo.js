// Script para modal eliminar mazo

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
    }
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        cerrarModal(e.target.id);
    }
});

window.eliminarMazoModal = async function(mazoId) {
    try {
        const response = await fetch('/flashcards-premium/api/mazos/');
        const data = await response.json();
        
        if (data.success) {
            const mazo = data.mazos.find(m => m.id === mazoId);
            
            if (mazo) {
                document.getElementById('eliminarMazoId').value = mazo.id;
                document.getElementById('eliminarNombreMazo').textContent = mazo.nombre;
                document.getElementById('eliminarTotalFlashcards').textContent = mazo.tarjetas_count || 0;
                
                abrirModal('eliminarMazoModal');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar el mazo');
    }
};

document.addEventListener('DOMContentLoaded', function() {
    const btnConfirmar = document.getElementById('btnConfirmarEliminarMazo');
    
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', async function() {
            const id = document.getElementById('eliminarMazoId').value;
            
            try {
                const response = await fetch(`/flashcards-premium/api/mazos/${id}/eliminar/`, {
                    method: 'DELETE',
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken')
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    alert('Mazo eliminado exitosamente');
                    cerrarModal('eliminarMazoModal');
                    if (typeof cargarMazos === 'function') {
                        cargarMazos();
                    }
                } else {
                    alert('Error al eliminar el mazo');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al eliminar el mazo');
            }
        });
    }
});
