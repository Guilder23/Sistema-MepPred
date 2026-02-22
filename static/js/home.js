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
    const showLogin = urlParams.get('show_login');
    
    if (loginError) {
        const openLoginBtn = document.getElementById('open-login-modal');
        if (openLoginBtn) {
            setTimeout(() => {
                const modal = document.getElementById('login-modal');
                if (modal) {
                    modal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
                
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
                }, 100);
            }, 100);
            
            // Limpiar la URL sin recargar
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    if (showLogin === 'true') {
        // Esperar a que login.js esté listo
        const openLoginBtn = document.getElementById('open-login-modal');
        if (openLoginBtn) {
            // Darle un pequeño delay para asegurar que login.js está configurado
            setTimeout(() => {
                const modal = document.getElementById('login-modal');
                if (modal) {
                    modal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            }, 100);
        }
        // Limpiar la URL sin recargar
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // ===== ANIMACIONES CON INTERSECTION OBSERVER =====
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observar feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        observer.observe(card);
    });

    // Observar testimonial cards
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    testimonialCards.forEach(card => {
        observer.observe(card);
    });

    // Observar benefit items
    const benefitItems = document.querySelectorAll('.benefit-item');
    benefitItems.forEach(item => {
        observer.observe(item);
    });

    // ===== EFECTO DE HOVER EN BOTONES =====
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // ===== CONTADOR ANIMADO PARA ESTADÍSTICAS =====
    const stats = document.querySelectorAll('.stat__number');
    let hasAnimated = false;

    const animateStats = () => {
        if (hasAnimated) return;
        
        stats.forEach(stat => {
            const finalNumber = parseInt(stat.textContent.replace(/\D/g, ''));
            const increment = finalNumber / 50;
            let currentNumber = 0;

            const interval = setInterval(() => {
                currentNumber += increment;
                if (currentNumber >= finalNumber) {
                    stat.textContent = stat.textContent.replace(/\d+/g, finalNumber);
                    clearInterval(interval);
                } else {
                    stat.textContent = stat.textContent.replace(/\d+/, Math.floor(currentNumber));
                }
            }, 30);
        });

        hasAnimated = true;
    };

    // Observar la sección de estadísticas
    const heroStats = document.querySelector('.hero__stats');
    if (heroStats) {
        const statsObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                animateStats();
                statsObserver.unobserve(heroStats);
            }
        }, { threshold: 0.5 });

        statsObserver.observe(heroStats);
    }

    // ===== EFECTO PARALLAX SUAVE =====
    window.addEventListener('scroll', () => {
        const heroIllustration = document.querySelector('.hero__illustration');
        if (heroIllustration && window.scrollY < window.innerHeight) {
            heroIllustration.style.transform = `translateY(${window.scrollY * 0.3}px)`;
        }

        const benefitsIllustration = document.querySelector('.benefits__illustration');
        if (benefitsIllustration) {
            const benefitsSection = benefitsIllustration.closest('.benefits');
            if (benefitsSection) {
                const rect = benefitsSection.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    const offset = (window.innerHeight - rect.top) * 0.1;
                    benefitsIllustration.style.transform = `translateY(${offset}px)`;
                }
            }
        }
    });

    // Los modales de login y registro son manejados por sus propios scripts.
});
