// Script para modal de ver detalles de examen

document.addEventListener('DOMContentLoaded', function() {
    const btnCerrar = document.getElementById('btnCerrarVer');

    if (btnCerrar) {
        btnCerrar.addEventListener('click', function() {
            cerrarModal('modalVerOverlay');
        });
    }

    // Cerrar modal al hacer clic en X
    const btnClose = document.querySelector('#modalVerExamen .modal-close-btn');
    if (btnClose) {
        btnClose.addEventListener('click', function() {
            cerrarModal('modalVerOverlay');
        });
    }

    // Cerrar modal al hacer clic fuera del modal
    const modalOverlay = document.getElementById('modalVerOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                cerrarModal('modalVerOverlay');
            }
        });
    }
});
