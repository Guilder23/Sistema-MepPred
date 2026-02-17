(function(){
  'use strict';
  
  // Manejo de mensajes: auto-cierre y animaciones
  function initMessages() {
    const messageContainer = document.querySelector('.mensajes');
    if (!messageContainer) return;
    
    const messages = messageContainer.querySelectorAll('.mensaje');
    
    messages.forEach((msg) => {
      const isSuccess = msg.classList.contains('mensaje-success');
      const isError = msg.classList.contains('mensaje-error');
      
      // Agregar clickabilidad para cerrar
      msg.style.cursor = 'pointer';
      msg.addEventListener('click', function() {
        this.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => {
          this.remove();
        }, 300);
      });
      
      // Auto-cerrar después de un tiempo
      if (isSuccess) {
        setTimeout(() => {
          if (msg.parentNode) {
            msg.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => {
              msg.remove();
            }, 300);
          }
        }, 6000);
      }
      
      if (isError) {
        msg.title = 'Haz clic para cerrar este mensaje';
      }
    });
  }
  
  initMessages();
  
  // Funcionalidad de Enter en el formulario
  const form = document.querySelector('form');
  if (!form) return;
  
  const emailInput = form.querySelector('input[name="email"]');
  const submitButton = form.querySelector('button[type="submit"]');
  
  if (emailInput) {
    emailInput.addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        submitButton?.click();
      }
    });
  }
  
  // Agregar animación de carga al botón
  if (submitButton) {
    submitButton.addEventListener('click', function(e) {
      if (form.checkValidity() === false) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      submitButton.style.pointerEvents = 'none';
      submitButton.style.opacity = '0.7';
      submitButton.innerHTML = '<span>Enviando...</span>';
    });
  }
})();
