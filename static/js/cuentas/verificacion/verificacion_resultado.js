(function(){
  'use strict';
  
  // Redirigir automáticamente a login después de 4 segundos en caso de éxito
  const card = document.querySelector('.card');
  if (!card) return;
  
  const titulo = card.querySelector('h1');
  if (titulo && titulo.textContent.includes('Correo verificado')) {
    // Caso de éxito: redirigir a login automáticamente
    setTimeout(() => {
      const loginLink = card.querySelector('a');
      if (loginLink) {
        loginLink.click();
      }
    }, 4000);
  }
})();
