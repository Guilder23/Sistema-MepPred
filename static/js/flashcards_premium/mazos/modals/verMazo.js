// Script para modal ver mazo

window.verMazoModal = async function(mazoId) {
    try {
        const response = await fetch('/flashcards-premium/api/mazos/');
        const data = await response.json();
        
        if (data.success) {
            const mazo = data.mazos.find(m => m.id === mazoId);
            
            if (mazo) {
                document.getElementById('verNombreMazo').textContent = mazo.nombre;
                document.getElementById('verMateriaMazo').textContent = mazo.materia_nombre || 'Sin materia';
                document.getElementById('verTemaMazo').textContent = mazo.tema_nombre || 'Sin tema';
                document.getElementById('verDescripcionMazo').textContent = mazo.descripcion || '-';
                document.getElementById('verTotalFlashcards').textContent = mazo.tarjetas_count || 0;
                document.getElementById('verCreadoMazo').textContent = mazo.created_at;
                
                mostrarModal('modalVerMazoOverlay');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los detalles del mazo');
    }
};
