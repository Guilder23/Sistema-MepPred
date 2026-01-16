// ===== VALIDACIÓN Y FUNCIONALIDAD DE REGISTRO =====

document.addEventListener('DOMContentLoaded', function() {
  // Si estamos en página de registro (no en modal)
  const form = document.getElementById('registro-form');
  
  if (form) {
    const emailInput = document.getElementById('email');
    const usernameInput = document.getElementById('username');
    const password1Input = document.getElementById('password1');
    const password2Input = document.getElementById('password2');
    const togglePassword1Btn = document.getElementById('toggle-password1');
    const togglePassword2Btn = document.getElementById('toggle-password2');

    // Toggle contraseña visible/oculta
    setupPasswordToggle(togglePassword1Btn, password1Input);
    setupPasswordToggle(togglePassword2Btn, password2Input);

    // Navegación entre campos con Enter
    emailInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (validateEmail(this.value)) {
          usernameInput.focus();
        }
      }
    });

    usernameInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (this.value.trim().length >= 3) {
          password1Input.focus();
        }
      }
    });

    password1Input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (validatePassword(this.value)) {
          password2Input.focus();
        }
      }
    });

    password2Input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (validatePassword(this.value)) {
          form.submit();
        }
      }
    });

    // Validación en tiempo real
    setupFieldValidation(emailInput, validateEmailField);
    setupFieldValidation(usernameInput, validateUsernameField);
    setupFieldValidation(password1Input, validatePassword1Field);
    setupFieldValidation(password2Input, validatePassword2Field);

    // Submit del formulario
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const isEmailValid = validateEmailField(emailInput);
      const isUsernameValid = validateUsernameField(usernameInput);
      const isPassword1Valid = validatePassword1Field(password1Input);
      const isPassword2Valid = validatePassword2Field(password2Input);
      
      if (isEmailValid && isUsernameValid && isPassword1Valid && isPassword2Valid) {
        form.submit();
      }
    });

    // Funciones de validación
    function validateEmail(email) {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(email);
    }

    function validatePassword(password) {
      return password.length >= 8;
    }

    function validateEmailField(field) {
      const errorElement = document.getElementById('email-error');
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

    function validateUsernameField(field) {
      const errorElement = document.getElementById('username-error');
      const value = field.value.trim();

      if (!value) {
        hideError(field, errorElement);
        return true;
      }

      if (value.length < 3) {
        showError(field, errorElement, 'El usuario debe tener al menos 3 caracteres');
        return false;
      }

      hideError(field, errorElement);
      return true;
    }

    function validatePassword1Field(field) {
      const errorElement = document.getElementById('password1-error');
      const value = field.value;

      if (!value) {
        showError(field, errorElement, 'La contraseña es requerida');
        return false;
      }

      if (!validatePassword(value)) {
        showError(field, errorElement, 'La contraseña debe tener al menos 8 caracteres');
        return false;
      }

      hideError(field, errorElement);
      return true;
    }

    function validatePassword2Field(field) {
      const errorElement = document.getElementById('password2-error');
      const value = field.value;
      const password1Value = password1Input.value;

      if (!value) {
        showError(field, errorElement, 'Confirma tu contraseña');
        return false;
      }

      if (value !== password1Value) {
        showError(field, errorElement, 'Las contraseñas no coinciden');
        return false;
      }

      hideError(field, errorElement);
      return true;
    }

    function showError(field, errorElement, message) {
      field.classList.add('is-invalid');
      field.classList.remove('is-valid');
      errorElement.textContent = message;
      errorElement.classList.add('show');
    }

    function hideError(field, errorElement) {
      field.classList.remove('is-invalid');
      field.classList.add('is-valid');
      errorElement.textContent = '';
      errorElement.classList.remove('show');
    }

    function setupPasswordToggle(btn, input) {
      if (btn) {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          const type = input.type === 'password' ? 'text' : 'password';
          input.type = type;
          
          const icon = this.querySelector('i');
          if (icon) {
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
          }
        });
      }
    }

    function setupFieldValidation(field, validationFn) {
      field.addEventListener('blur', function() {
        validationFn(this);
      });

      field.addEventListener('input', function() {
        validationFn(this);
      });
    }
  }

  // ===== MODAL DE REGISTRO =====
  const modal = document.getElementById('registro-modal');
  if (modal) {
    const modalForm = document.getElementById('registro-modal-form');
    const openBtns = document.querySelectorAll('#open-registro-modal, .nav-registro-btn');
    
    // Agregar click handler para el botón CTA
    const ctaBtn = document.getElementById('open-registro-modal-cta');
    if (ctaBtn) {
      ctaBtn.addEventListener('click', function(e) {
        e.preventDefault();
        openModal();
      });
    }
    const closeBtn = document.getElementById('close-registro-modal');
    const switchToLoginBtn = document.querySelector('.js-switch-to-login');

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
    
    if (switchToLoginBtn) {
      switchToLoginBtn.addEventListener('click', function(e) {
        e.preventDefault();
        closeModal();
        const openLoginBtn = document.getElementById('open-login-modal');
        if (openLoginBtn) openLoginBtn.click();
      });
    }

    // Validación del modal
    if (modalForm) {
      const emailInput = modalForm.querySelector('#registro-email');
      const usernameInput = modalForm.querySelector('#registro-username');
      const password1Input = modalForm.querySelector('#registro-password1');
      const password2Input = modalForm.querySelector('#registro-password2');
      const togglePassword1Btn = modalForm.querySelector('#toggle-registro-password1');
      const togglePassword2Btn = modalForm.querySelector('#toggle-registro-password2');

      // Funciones de validación para modal
      function validateEmailModal(field) {
        const errorElement = document.getElementById('registro-email-error');
        const value = field.value.trim();

        if (!value) {
          showErrorModal(field, errorElement, 'El correo es requerido');
          return false;
        }

        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(value)) {
          showErrorModal(field, errorElement, 'Ingresa un correo válido');
          return false;
        }

        hideErrorModal(field, errorElement);
        return true;
      }

      function validateUsernameModal(field) {
        const errorElement = document.getElementById('registro-username-error');
        const value = field.value.trim();

        if (value && value.length < 3) {
          showErrorModal(field, errorElement, 'Mínimo 3 caracteres');
          return false;
        }

        hideErrorModal(field, errorElement);
        return true;
      }

      function validatePassword1Modal(field) {
        const errorElement = document.getElementById('registro-password1-error');
        const value = field.value;

        if (!value) {
          showErrorModal(field, errorElement, 'La contraseña es requerida');
          return false;
        }

        if (value.length < 8) {
          showErrorModal(field, errorElement, 'Mínimo 8 caracteres');
          return false;
        }

        hideErrorModal(field, errorElement);
        return true;
      }

      function validatePassword2Modal(field) {
        const errorElement = document.getElementById('registro-password2-error');
        const value = field.value;

        if (!value) {
          showErrorModal(field, errorElement, 'Confirma tu contraseña');
          return false;
        }

        if (value !== password1Input.value) {
          showErrorModal(field, errorElement, 'Las contraseñas no coinciden');
          return false;
        }

        hideErrorModal(field, errorElement);
        return true;
      }

      function showErrorModal(field, errorElement, message) {
        field.classList.add('is-invalid');
        field.classList.remove('is-valid');
        if (errorElement) {
          errorElement.textContent = message;
          errorElement.classList.add('show');
        }
      }

      function hideErrorModal(field, errorElement) {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
        if (errorElement) {
          errorElement.textContent = '';
          errorElement.classList.remove('show');
        }
      }

      // Toggle contraseñas
      if (togglePassword1Btn) {
        togglePassword1Btn.addEventListener('click', function(e) {
          e.preventDefault();
          const type = password1Input.type === 'password' ? 'text' : 'password';
          password1Input.type = type;
          const icon = this.querySelector('i');
          if (icon) {
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
          }
        });
      }

      if (togglePassword2Btn) {
        togglePassword2Btn.addEventListener('click', function(e) {
          e.preventDefault();
          const type = password2Input.type === 'password' ? 'text' : 'password';
          password2Input.type = type;
          const icon = this.querySelector('i');
          if (icon) {
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
          }
        });
      }

      // Validación en tiempo real
      emailInput.addEventListener('blur', function() { validateEmailModal(this); });
      emailInput.addEventListener('input', function() { validateEmailModal(this); });
      
      usernameInput.addEventListener('blur', function() { validateUsernameModal(this); });
      usernameInput.addEventListener('input', function() { validateUsernameModal(this); });
      
      password1Input.addEventListener('blur', function() { validatePassword1Modal(this); });
      password1Input.addEventListener('input', function() { validatePassword1Modal(this); });
      
      password2Input.addEventListener('blur', function() { validatePassword2Modal(this); });
      password2Input.addEventListener('input', function() { validatePassword2Modal(this); });

      // Navegación con Enter
      emailInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (validateEmailModal(this)) {
            usernameInput.focus();
          }
        }
      });

      usernameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (this.value === '' || validateUsernameModal(this)) {
            password1Input.focus();
          }
        }
      });

      password1Input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (validatePassword1Modal(this)) {
            password2Input.focus();
          }
        }
      });

      password2Input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (validatePassword2Modal(this)) {
            modalForm.submit();
          }
        }
      });

      // Submit
      modalForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const isEmailValid = validateEmailModal(emailInput);
        const isUsernameValid = validateUsernameModal(usernameInput);
        const isPassword1Valid = validatePassword1Modal(password1Input);
        const isPassword2Valid = validatePassword2Modal(password2Input);

        if (isEmailValid && isUsernameValid && isPassword1Valid && isPassword2Valid) {
          const submitBtn = modalForm.querySelector('button[type="submit"]');
          const originalText = submitBtn.innerText;
          
          submitBtn.disabled = true;
          submitBtn.innerText = 'Cargando...';
          
          const formData = new FormData(modalForm);

          fetch(modalForm.action, {
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
              
              // Mostrar error en el campo de correo si es un correo duplicado
              if (data.message && data.message.includes('correo')) {
                showErrorModal(emailInput, document.getElementById('registro-email-error'), data.message);
              } else {
                // Mostrar error genérico en la parte superior del formulario
                const existingError = modalForm.querySelector('.error-message-top');
                if (existingError) existingError.remove();
                
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message-top';
                errorDiv.style.color = '#ef4444';
                errorDiv.style.marginBottom = '1rem';
                errorDiv.style.textAlign = 'center';
                errorDiv.style.fontSize = '0.875rem';
                errorDiv.innerText = data.message || 'Ocurrió un error inesperado';
                
                modalForm.insertBefore(errorDiv, modalForm.firstChild);
              }
            }
          })
          .catch(error => {
            console.error('Error:', error);
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
            
            const existingError = modalForm.querySelector('.error-message-top');
            if (existingError) existingError.remove();
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message-top';
            errorDiv.style.color = '#ef4444';
            errorDiv.style.marginBottom = '1rem';
            errorDiv.style.textAlign = 'center';
            errorDiv.innerText = 'Error de conexión. Inténtalo de nuevo.';
            
            modalForm.insertBefore(errorDiv, modalForm.firstChild);
          });
        }
      });
    }
  }
});

