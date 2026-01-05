// Script para modal de crear examen

document.addEventListener('DOMContentLoaded', function() {
    const formCrear = document.getElementById('formCrearExamen');
    const btnGuardar = document.getElementById('btnGuardarExamen');
    const btnCancelar = document.getElementById('btnCancelarExamen');

    if (formCrear) {
        formCrear.addEventListener('submit', function(e) {
            e.preventDefault();
            guardarExamen();
        });
    }

    if (btnGuardar) {
        btnGuardar.addEventListener('click', guardarExamen);
    }

    if (btnCancelar) {
        btnCancelar.addEventListener('click', function() {
            cerrarModal('modalCrearOverlay');
        });
    }

    // Cerrar modal al hacer clic en X
    const btnClose = document.querySelector('.modal-crear-btn-close');
    if (btnClose) {
        btnClose.addEventListener('click', function() {
            cerrarModal('modalCrearOverlay');
        });
    }

    // Cerrar modal al hacer clic fuera del modal
    const modalOverlay = document.querySelector('.modal-crear-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                cerrarModal('modalCrearOverlay');
            }
        });
    }
});

function guardarExamen() {
    const titulo = document.getElementById('crearTitulo').value.trim();
    const materiaId = document.getElementById('crearMateria').value;
    const descripcion = document.getElementById('crearDescripcion').value.trim();
    const duracion = document.getElementById('crearDuracion').value;
    const esPremium = document.getElementById('crearEsPremium').checked;
    const activo = document.getElementById('crearActivo').checked;

    // Validación
    if (!titulo) {
        mostrarMensaje('El título es requerido', 'error');
        document.getElementById('crearTitulo').focus();
        return;
    }

    if (!materiaId) {
        mostrarMensaje('Debe seleccionar una materia', 'error');
        document.getElementById('crearMateria').focus();
        return;
    }

    if (!duracion || duracion < 1) {
        mostrarMensaje('La duración debe ser mayor a 0', 'error');
        document.getElementById('crearDuracion').focus();
        return;
    }

    // Enviar al servidor
    const btnGuardar = document.getElementById('btnGuardarExamen');
    if (btnGuardar) btnGuardar.disabled = true;

    fetch('/examenes/api/examenes/crear/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            titulo: titulo,
            materia_id: parseInt(materiaId),
            descripcion: descripcion,
            duracion_minutos: parseInt(duracion),
            es_premium: esPremium,
            activo: activo,
            preguntas: []
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarMensaje('Examen creado correctamente', 'success');
            cerrarModal('modalCrearOverlay');
            cargarExamenes();
        } else {
            mostrarMensaje(data.error || 'Error al crear el examen', 'error');
        }
    })
    .catch(error => {
        mostrarMensaje('Error al crear el examen', 'error');
    })
    .finally(() => {
        if (btnGuardar) btnGuardar.disabled = false;
    });
}
