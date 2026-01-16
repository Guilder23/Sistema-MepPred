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

    // Detectar errores de login en la URL y mostrar el modal con el error
    const urlParams = new URLSearchParams(window.location.search);
    const loginError = urlParams.get('login_error');
    
    if (loginError) {
        const openLoginBtn = document.getElementById('open-login-modal');
        if (openLoginBtn) {
            openLoginBtn.click();
            
            // Mostrar el mensaje de error en el modal
            setTimeout(() => {
                const passwordErrorElement = document.getElementById('login-password-error');
                const passwordInput = document.getElementById('login-password');
                
                if (passwordErrorElement && passwordInput) {
                    if (loginError === 'credenciales_incorrectas') {
                        passwordErrorElement.textContent = 'Credenciales incorrectas.';
                        passwordErrorElement.classList.add('show');
                        passwordInput.classList.add('is-invalid');
                    }
                }
            }, 300);
            
            // Limpiar la URL sin recargar
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    // Los modales de login y registro son manejados por sus propios scripts.
});
