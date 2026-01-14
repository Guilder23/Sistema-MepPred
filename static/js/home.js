document.addEventListener('DOMContentLoaded', () => {
    // home.js
    // Lógica específica para la página de inicio

    // Botón CTA de registro
    const openRegistroModalCta = document.getElementById('open-registro-modal-cta');
    if (openRegistroModalCta) {
        openRegistroModalCta.addEventListener('click', () => {
            const openRegistroModal = document.getElementById('open-registro-modal');
            if (openRegistroModal) {
                openRegistroModal.click();
            }
        });
    }

    // Los modales de login y registro son manejados por sus propios scripts.
});
