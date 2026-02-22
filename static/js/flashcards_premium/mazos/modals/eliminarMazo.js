// Script para modal eliminar mazo

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
                
                mostrarModal('modalEliminarMazoOverlay');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error', 'Error al cargar el mazo', 'danger');
    }
};

document.addEventListener('DOMContentLoaded', function() {
    const btnConfirmar = document.getElementById('btnConfirmarEliminarMazo');
    
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', async function() {
            const id = document.getElementById('eliminarMazoId').value;
            const totalFlashcards = parseInt(document.getElementById('eliminarTotalFlashcards').textContent) || 0;
            
            // Validar si tiene flashcards
            if (totalFlashcards > 0) {
                mostrarMensaje('No se puede eliminar', `Este mazo tiene ${totalFlashcards} flashcard(s). Debe eliminar todas las flashcards antes de poder eliminar el mazo.`, 'warning');
                return;
            }
            
            try {
                const response = await fetch(`/flashcards-premium/api/mazos/${id}/eliminar/`, {
                    method: 'DELETE',
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken')
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    mostrarMensaje('Éxito', 'Mazo eliminado exitosamente', 'success');
                    ocultarModal('modalEliminarMazoOverlay');
                    if (typeof cargarMazos === 'function') {
                        cargarMazos();
                    }
                } else {
                    mostrarMensaje('Error', 'Error al eliminar el mazo', 'danger');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarMensaje('Error', 'Error al eliminar el mazo', 'danger');
            }
        });
    }
});
