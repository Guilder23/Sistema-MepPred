let editMode = false;

function habilitarEdicion() {
    editMode = true;
    const inputs = document.querySelectorAll('.editable');
    const btnEditar = document.getElementById('btnEditar');
    const formActions = document.getElementById('formActions');
    
    inputs.forEach(input => {
        input.disabled = false;
    });
    
    btnEditar.style.display = 'none';
    formActions.style.display = 'flex';
    
    if (document.getElementById('student_status')) {
        toggleUniversidadCampos();
    }
}

function cancelarEdicion() {
    editMode = false;
    const inputs = document.querySelectorAll('.editable');
    const btnEditar = document.getElementById('btnEditar');
    const formActions = document.getElementById('formActions');
    const form = document.getElementById('perfilForm');
    
    inputs.forEach(input => {
        input.disabled = true;
    });
    
    btnEditar.style.display = 'inline-flex';
    formActions.style.display = 'none';
    form.reset();
}

function toggleUniversidadCampos() {
    const status = document.getElementById('student_status').value;
    const campos = document.getElementById('universidad-campos');
    if (status === 'university') {
        campos.style.display = 'block';
    } else {
        campos.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Perfil JS cargado correctamente');
});
