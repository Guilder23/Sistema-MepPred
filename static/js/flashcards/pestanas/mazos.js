// Módulo de Mazos - Métodos específicos para la pestaña de mazos
document.addEventListener('DOMContentLoaded', function() {
    // Delegación de eventos para los botones de la lista de mazos
    const mazosContainer = document.getElementById('mazos-container');
    
    if (mazosContainer) {
        mazosContainer.addEventListener('click', function(event) {
            const btnEditar = event.target.closest('.btn-editar');
            const btnEliminar = event.target.closest('.btn-eliminar');
            const btnEstudiar = event.target.closest('.btn-estudiar');
            
            if (btnEditar) {
                const mazoId = btnEditar.dataset.mazoId;
                const mazoRow = btnEditar.closest('.mazo-row');
                const mazoNombre = mazoRow ? mazoRow.querySelector('.mazo-nombre').textContent : '';
                abrirModalEditarMazo(mazoId);
            }
            
            if (btnEliminar) {
                const mazoId = btnEliminar.dataset.mazoId;
                const mazoRow = btnEliminar.closest('.mazo-row');
                const mazoNombre = mazoRow ? mazoRow.querySelector('.mazo-nombre').textContent : '';
                abrirModalEliminarMazo(mazoId, mazoNombre);
            }
            
            if (btnEstudiar) {
                const mazoId = btnEstudiar.dataset.mazoId;
                // Cambiar a la pestaña de estudiar y cargar el mazo
                const studyTab = document.querySelector('[data-tab="study"]');
                if (studyTab) {
                    studyTab.click();
                }
            }
        });
    }
});