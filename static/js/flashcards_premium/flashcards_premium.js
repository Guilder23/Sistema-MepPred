// Cargar estadísticas al iniciar la página
document.addEventListener('DOMContentLoaded', function() {
    cargarEstadisticas();
});

// Función para cargar las estadísticas del dashboard
async function cargarEstadisticas() {
    try {
        const response = await fetch('/flashcards-premium/api/mazos/');
        const data = await response.json();
        
        if (data.success) {
            // Calcular totales
            let totalMazos = data.mazos.length;
            let totalFlashcards = 0;
            
            data.mazos.forEach(mazo => {
                totalFlashcards += mazo.tarjetas_count || 0;
            });
            
            // Actualizar el DOM
            const totalMazosElement = document.getElementById('totalMazos');
            const totalFlashcardsElement = document.getElementById('totalFlashcards');
            const progresoGeneralElement = document.getElementById('progresoGeneral');
            
            if (totalMazosElement) totalMazosElement.textContent = totalMazos;
            if (totalFlashcardsElement) totalFlashcardsElement.textContent = totalFlashcards;
            
            // Calcular progreso general (ejemplo: basado en cantidad de flashcards)
            const progresoMaximo = 100; // Puedes ajustar esto según tu lógica
            const progreso = Math.min(100, Math.round((totalFlashcards / progresoMaximo) * 100));
            if (progresoGeneralElement) progresoGeneralElement.textContent = progreso + '%';
        }
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}
