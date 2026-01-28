// Archivo principal de inicialización de Flashcards
// Manejo de pestañas y coordinación de módulos

document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema de Flashcards inicializado');
    
    // Obtener datos desde atributos data- del HTML
    const container = document.querySelector('.flashcard-container');
    if (container) {
        window.flashcardsData = {
            mazos: JSON.parse(container.dataset.mazos || '[]'),
            tarjetas: JSON.parse(container.dataset.tarjetas || '[]'),
            csrfToken: container.dataset.csrf || ''
        };
        console.log('Datos cargados:', window.flashcardsData);
    }
    
    setupTabs();
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