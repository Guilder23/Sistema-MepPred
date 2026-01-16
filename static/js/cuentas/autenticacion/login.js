// ===== VALIDACIÓN Y FUNCIONALIDAD DE LOGIN =====

document.addEventListener('DOMContentLoaded', function() {
  // Si estamos en página de login (no en modal)
  const form = document.getElementById('login-form');
  
  if (form) {
    setupLoginFormValidation(document.getElementById('email'), document.getElementById('password'), document.getElementById('toggle-password'));
  }

  // ===== MODAL DE LOGIN Y REGISTRO DESDE HOME =====
  const loginModal = document.getElementById('login-modal');
  if (loginModal) {
    const loginModalForm = document.getElementById('login-modal-form');
    if (loginModalForm) {
      setupModalLoginValidation(loginModalForm);
    }
  }

  // ===== MODAL DE LOGIN GENÉRICO =====
  const modal = document.getElementById('login-modal');
  if (modal) {
    const openBtns = document.querySelectorAll('#open-login-modal, .nav-login-btn');
    const closeBtn = document.getElementById('close-login-modal');
    const switchToRegistroBtn = document.querySelector('.js-switch-to-registro');

    function openModal() {
      if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    }

    function closeModal() {
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    }

    openBtns.forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        openModal();
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    window.addEventListener('click', function(event) {
      if (event.target === modal) {
        closeModal();
      }
    });

    window.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && modal && modal.classList.contains('active')) {
        closeModal();
      }
    });

    if (switchToRegistroBtn) {
      switchToRegistroBtn.addEventListener('click', function(e) {
        e.preventDefault();
        closeModal();
        const openRegistroBtn = document.getElementById('open-registro-modal');
        if (openRegistroBtn) openRegistroBtn.click();
      });
    }
  }

  // Funciones compartidas
  function setupLoginFormValidation(emailInput, passwordInput, togglePasswordBtn) {
    // Toggle contraseña
    if (togglePasswordBtn) {
      togglePasswordBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        
        const icon = this.querySelector('i');
        if (icon) {
          icon.classList.toggle('fa-eye');
          icon.classList.toggle('fa-eye-slash');
        }
      });
    }

    // Navegación con Enter
    emailInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (validateEmail(this.value)) {
          passwordInput.focus();
        }
      }
    });

    passwordInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const form = emailInput.closest('form');
        if (form && validatePassword(this.value)) {
          form.submit();
        }
      }
    });

    // Validación en tiempo real
    setupFieldValidation(emailInput, validateEmailField, 'email-error');
    setupFieldValidation(passwordInput, validatePasswordField, 'password-error');
  }

  function setupModalLoginValidation(form) {
    const emailInput = form.querySelector('#login-email');
    const passwordInput = form.querySelector('#login-password');
    const togglePasswordBtn = form.querySelector('#toggle-login-password');

    if (!emailInput || !passwordInput) return;

    // Toggle contraseña
    if (togglePasswordBtn) {
      togglePasswordBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        
        const icon = this.querySelector('i');
        if (icon) {
          icon.classList.toggle('fa-eye');
          icon.classList.toggle('fa-eye-slash');
        }
      });
    }

    // Navegación con Enter
    emailInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (validateEmail(this.value)) {
          passwordInput.focus();
        }
      }
    });

    passwordInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (validatePassword(this.value)) {
          form.submit();
        }
      }
    });

    // Validación en tiempo real
    setupFieldValidation(emailInput, validateEmailField, 'login-email-error');
    setupFieldValidation(passwordInput, validatePasswordField, 'login-password-error');

    // Submit
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const isEmailValid = validateEmailField(emailInput, 'login-email-error');
      const isPasswordValid = validatePasswordField(passwordInput, 'login-password-error');
      
      if (isEmailValid && isPasswordValid) {
        // Enviar con AJAX para manejar errores sin redirigir
        const formData = new FormData(form);
        
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
            window.location.href = data.redirect_url || '/panel/';
          } else {
            // Mostrar error en el campo de contraseña
            showError(passwordInput, document.getElementById('login-password-error'), data.message);
          }
        })
        .catch(error => {
          console.error('Error:', error);
          showError(passwordInput, document.getElementById('login-password-error'), 'Error al iniciar sesión');
        });
      }
    });
  }

  function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  function validatePassword(password) {
    return password.length >= 1;
  }

  function validateEmailField(field, errorId = 'email-error') {
    const errorElement = document.getElementById(errorId);
    const value = field.value.trim();

    if (!value) {
      showError(field, errorElement, 'El correo es requerido');
      return false;
    }

    if (!validateEmail(value)) {
      showError(field, errorElement, 'Ingresa un correo válido');
      return false;
    }

    hideError(field, errorElement);
    return true;
  }

  function validatePasswordField(field, errorId = 'password-error') {
    const errorElement = document.getElementById(errorId);
    const value = field.value;

    if (!value) {
      showError(field, errorElement, 'La contraseña es requerida');
      return false;
    }

    hideError(field, errorElement);
    return true;
  }

  function setupFieldValidation(field, validationFn, errorId) {
    field.addEventListener('blur', function() {
      validationFn(this, errorId);
    });

    field.addEventListener('input', function() {
      validationFn(this, errorId);
    });
  }

  function showError(field, errorElement, message) {
    field.classList.add('is-invalid');
    field.classList.remove('is-valid');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.add('show');
    }
  }

  function hideError(field, errorElement) {
    field.classList.remove('is-invalid');
    field.classList.add('is-valid');
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.classList.remove('show');
    }
  }
});


