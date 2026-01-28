// Script para modal ver mazo

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

window.verMazoModal = async function(mazoId) {
    try {
        const response = await fetch('/flashcards-premium/api/mazos/');
        const data = await response.json();
        
        if (data.success) {
            const mazo = data.mazos.find(m => m.id === mazoId);
            
            if (mazo) {
                document.getElementById('verNombreMazo').textContent = mazo.nombre;
                document.getElementById('verMateriaMazo').textContent = mazo.materia_nombre || 'Sin materia';
                document.getElementById('verDescripcionMazo').textContent = mazo.descripcion || '-';
                document.getElementById('verTotalFlashcards').textContent = mazo.tarjetas_count || 0;
                document.getElementById('verCreadoMazo').textContent = mazo.created_at;
                
                abrirModal('verMazoModal');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los detalles del mazo');
    }
};
