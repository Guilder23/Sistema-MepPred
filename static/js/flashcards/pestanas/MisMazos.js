// Módulo de Mazos - Métodos específicos para la pestaña de mazos
document.addEventListener('DOMContentLoaded', function() {
    // Delegación de eventos para los botones de la tabla de mazos
    const mazosTable = document.getElementById('mazosTable');
    
    if (mazosTable) {
        mazosTable.addEventListener('click', function(event) {
            const btnEditar = event.target.closest('.btn-editar-mazo');
            const btnEliminar = event.target.closest('.btn-eliminar-mazo');
            const btnEstudiar = event.target.closest('.btn-estudiar');
            
            if (btnEditar) {
                const mazoId = btnEditar.dataset.mazoId;
                abrirModalEditarMazo(mazoId);
            }
            
            if (btnEliminar) {
                const mazoId = btnEliminar.dataset.mazoId;
                const mazoNombre = btnEliminar.dataset.mazoNombre;
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