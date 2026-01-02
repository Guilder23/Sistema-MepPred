// Sistema de inicialización de Flashcards
// Este archivo coordina todos los módulos

document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema de Flashcards inicializado');
    console.log('Datos disponibles:', window.flashcardsData);
});

// Manejo de pestañas
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Remover clase active de todos
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.style.display = 'none');
            
            // Agregar clase active al tab clickeado
            this.classList.add('active');
            document.getElementById(tabName).style.display = 'block';
        });
    });
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupTabs);
} else {
    setupTabs();
}
