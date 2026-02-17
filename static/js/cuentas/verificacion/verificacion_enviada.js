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
})();
