// Script para modal de ver detalles de materia

document.addEventListener('DOMContentLoaded', function() {
    const modalOverlay = document.getElementById('modalVerOverlay');
    const btnCerrar = document.getElementById('btnCerrarVer');

    if (btnCerrar) {
        btnCerrar.addEventListener('click', function() {
            cerrarModal('modalVerOverlay');
        });
    }

    // Cerrar modal al hacer clic en X
    const btnClose = document.querySelector('.modal-ver-btn-close');
    if (btnClose) {
        btnClose.addEventListener('click', function() {
            cerrarModal('modalVerOverlay');
        });
    }

    // Cerrar modal al hacer clic fuera del modal
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                cerrarModal('modalVerOverlay');
            }
        });
    }

    // Cerrar modal con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('active')) {
            cerrarModal('modalVerOverlay');
        }
    });
});
