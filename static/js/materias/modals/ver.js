// Script para modal de ver detalles de materia

document.addEventListener('DOMContentLoaded', function() {
    // Cerrar modal al hacer clic en X
    const btnClose = document.querySelector('#modalVerOverlay .modal-close-btn');
    if (btnClose) {
        btnClose.addEventListener('click', function() {
            cerrarModal('modalVerOverlay');
        });
    }

    // Cerrar modal al hacer clic fuera del modal
    const modalOverlay = document.querySelector('#modalVerOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                cerrarModal('modalVerOverlay');
            }
        });
    }
});
