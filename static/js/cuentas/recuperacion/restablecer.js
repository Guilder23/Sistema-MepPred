(function(){
  'use strict';
  
  // Funcionalidad de Enter en formulario de contraseña
  const form = document.querySelector('form');
  if (!form) return;
  
  const inputs = form.querySelectorAll('input[type="password"]');
  const submitButton = form.querySelector('button[type="submit"]');
  
  // Enter en primer password -> va al segundo
  if (inputs[0]) {
    inputs[0].addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        inputs[1]?.focus();
      }
    });
  }
  
  // Enter en segundo password -> envía el formulario
  if (inputs[1]) {
    inputs[1].addEventListener('keypress', function(event) {
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
      submitButton.innerHTML = '<span>Actualizando...</span>';
    });
  }
  
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
        }, 4000);
      }
      
      // Los errores permanecen visible pero pueden cerrarse
      if (isError) {
        msg.title = 'Haz clic para cerrar este mensaje';
      }
    });
  }
  
  initMessages();
  
  // Validación en tiempo real: contraseñas coinciden
  if (inputs[1]) {
    const password1 = inputs[0];
    const password2 = inputs[1];
    
    password2.addEventListener('blur', function() {
      if (password1.value && password2.value && password1.value === password2.value) {
        password2.style.borderColor = '#27AE60';
      } else if (password1.value && password2.value) {
        password2.style.borderColor = '#E74C3C';
      }
    });
    
    password2.addEventListener('input', function() {
      if (this.value && password1.value === this.value) {
        this.style.borderColor = '#27AE60';
      } else if (this.value) {
        this.style.borderColor = '#E74C3C';
      } else {
        this.style.borderColor = '';
      }
    });
  }
})();
