(function(){
  // login

  // ===== MODAL DE LOGIN =====

  document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('login-modal');
    // Selectores para botones de apertura (Hero + Navbar)
    const openBtns = document.querySelectorAll('#open-login-modal, .nav-login-btn');
    const closeBtn = document.getElementById('close-login-modal');
    const switchToRegistroBtn = document.querySelector('.js-switch-to-registro');
    const form = modal ? modal.querySelector('form') : null;

    // Función para abrir modal
    function openModal() {
        if(modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevenir scroll
        }
    }

    // Función para cerrar modal
    function closeModal() {
        if(modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Asignar eventos a botones de apertura
    openBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault(); // Prevenir navegación si es un enlace
            openModal();
        });
    });

    // Cerrar modal con botón X
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    // Cerrar al hacer click fuera del modal
    window.addEventListener('click', function(event) {
      if (event.target === modal) {
        closeModal();
      }
    });

    // Cerrar con tecla Escape
    window.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && modal && modal.classList.contains('active')) {
        closeModal();
      }
    });

    // Cambiar a modal de registro
    if (switchToRegistroBtn) {
        switchToRegistroBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal();
            const openRegistroBtn = document.getElementById('open-registro-modal');
            if (openRegistroBtn) openRegistroBtn.click();
        });
    }

    // Manejo de formulario vía AJAX
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(form);
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            
            submitBtn.disabled = true;
            submitBtn.innerText = 'Cargando...';
            
            // Limpiar errores previos
            const existingErrors = form.querySelectorAll('.error-message');
            existingErrors.forEach(el => el.remove());

            fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.href = data.redirect_url;
                } else {
                    submitBtn.disabled = false;
                    submitBtn.innerText = originalText;
                    
                    // Mostrar error
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'error-message';
                    errorDiv.style.color = '#ef4444';
                    errorDiv.style.marginBottom = '1rem';
                    errorDiv.style.textAlign = 'center';
                    errorDiv.style.fontSize = '0.875rem';
                    errorDiv.innerText = data.message || 'Ocurrió un error inesperado';
                    
                    form.insertBefore(errorDiv, form.firstChild);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                submitBtn.disabled = false;
                submitBtn.innerText = originalText;
                
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.style.color = '#ef4444';
                errorDiv.style.marginBottom = '1rem';
                errorDiv.style.textAlign = 'center';
                errorDiv.innerText = 'Error de conexión. Inténtalo de nuevo.';
                
                form.insertBefore(errorDiv, form.firstChild);
            });
        });
    }
  });

})();
