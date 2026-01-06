// JavaScript para suscripción de estudiantes

document.addEventListener('DOMContentLoaded', function() {
    cargarEstadoSuscripcion();
});

async function cargarEstadoSuscripcion() {
    const mensajeCarga = document.getElementById('mensajeCarga');
    const estadoSuscripcion = document.getElementById('estadoSuscripcion');
    const formContainer = document.getElementById('formContainer');

    try {
        const response = await fetch('/suscripciones/api/estado/');
        const data = await response.json();

        if (data.tiene_suscripcion) {
            mostrarEstadoSuscripcion(data);
            estadoSuscripcion.style.display = 'flex';

            // Mostrar formulario solo si puede suscribirse de nuevo (rechazado o vencido)
            if (data.puede_suscribirse) {
                formContainer.style.display = 'grid';
            } else {
                // Ocultar formulario si tiene suscripción pendiente o activa
                formContainer.style.display = 'none';
            }
        } else {
            // Primera suscripción - mostrar formulario, ocultar estado
            estadoSuscripcion.style.display = 'none';
            formContainer.style.display = 'grid';
        }

        cargarQR();
        configurarFormulario();

    } catch (error) {
        console.error('Error al cargar estado:', error);
        // Mostrar formulario aunque haya error
        estadoSuscripcion.style.display = 'none';
        formContainer.style.display = 'grid';
        cargarQR();
        configurarFormulario();
    }
}

function mostrarEstadoSuscripcion(data) {
    const estadoIcon = document.getElementById('estadoIcon');
    const estadoTitulo = document.getElementById('estadoTitulo');
    const estadoDescripcion = document.getElementById('estadoDescripcion');
    const estadoFecha = document.getElementById('estadoFecha');
    const statusAlert = document.getElementById('estadoSuscripcion');

    // Configurar según estado
    statusAlert.className = 'status-alert ' + data.estado.toLowerCase();

    switch (data.estado) {
        case 'PENDIENTE':
            estadoIcon.textContent = '⏳';
            estadoTitulo.textContent = 'Suscripción Pendiente';
            estadoDescripcion.textContent = 'Tu solicitud está siendo revisada por el administrador. Recibirás una confirmación pronto.';
            estadoFecha.textContent = 'Enviado: ' + formatearFecha(data.fecha_solicitud);
            break;

        case 'APROBADO':
            if (data.activa) {
                estadoIcon.textContent = '✓';
                estadoTitulo.textContent = '¡Suscripción Activa!';
                estadoDescripcion.textContent = `Tu suscripción está activa. Tienes acceso a todo el contenido premium por ${data.dias_restantes} días más.`;
                estadoFecha.textContent = 'Vence: ' + formatearFecha(data.fecha_vencimiento);
            } else {
                estadoIcon.textContent = '⏰';
                estadoTitulo.textContent = 'Suscripción Vencida';
                estadoDescripcion.textContent = 'Tu suscripción ha expirado. Puedes renovarla para seguir disfrutando del contenido premium.';
                estadoFecha.textContent = 'Expiró: ' + formatearFecha(data.fecha_vencimiento);
            }
            break;

        case 'RECHAZADO':
            estadoIcon.textContent = '✕';
            estadoTitulo.textContent = 'Suscripción Rechazada';
            estadoDescripcion.textContent = data.motivo_rechazo || 'Tu solicitud fue rechazada. Puedes intentar nuevamente.';
            estadoFecha.textContent = 'Fecha de solicitud: ' + formatearFecha(data.fecha_solicitud);
            break;

        case 'VENCIDO':
            estadoIcon.textContent = '⏰';
            estadoTitulo.textContent = 'Suscripción Vencida';
            estadoDescripcion.textContent = 'Tu suscripción ha expirado. Renuévala para seguir accediendo al contenido premium.';
            estadoFecha.textContent = 'Expiró: ' + formatearFecha(data.fecha_vencimiento);
            break;
    }
}

async function cargarQR() {
    try {
        const response = await fetch('/suscripciones/api/qr/');
        const data = await response.json();

        if (response.ok) {
            document.getElementById('qrImagen').src = data.qr_url;
            document.getElementById('qrDescripcion').textContent = data.descripcion || '';
        } else {
            document.getElementById('qrContenedor').innerHTML = 
                '<p style="color: #ef4444; text-align: center;">No hay código QR configurado. Contacta al administrador.</p>';
        }
    } catch (error) {
        console.error('Error al cargar QR:', error);
    }
}

function configurarFormulario() {
    const form = document.getElementById('formSuscripcion');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const btnEnviar = document.getElementById('btnEnviar');
        const comprobanteInput = document.getElementById('comprobante');
        const archivo = comprobanteInput.files[0];

        if (!archivo) {
            mostrarMensaje('Selecciona un comprobante', 'error');
            return;
        }

        // Validar tamaño (5MB)
        if (archivo.size > 5 * 1024 * 1024) {
            mostrarMensaje('El archivo no debe superar 5MB', 'error');
            return;
        }

        // Deshabilitar botón
        btnEnviar.disabled = true;
        btnEnviar.querySelector('.btn-texto').style.display = 'none';
        btnEnviar.querySelector('.btn-spinner').style.display = 'flex';

        try {
            const formData = new FormData();
            formData.append('comprobante', archivo);

            const response = await fetch('/suscripciones/api/crear/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                mostrarMensaje(data.mensaje, 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                mostrarMensaje(data.error || 'Error al enviar suscripción', 'error');
                // Restaurar botón
                btnEnviar.disabled = false;
                btnEnviar.querySelector('.btn-texto').style.display = 'inline';
                btnEnviar.querySelector('.btn-spinner').style.display = 'none';
            }

        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje('Error al enviar suscripción', 'error');
            // Restaurar botón
            btnEnviar.disabled = false;
            btnEnviar.querySelector('.btn-texto').style.display = 'inline';
            btnEnviar.querySelector('.btn-spinner').style.display = 'none';
        }
    });
}

function formatearFecha(isoString) {
    const fecha = new Date(isoString);
    const opciones = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return fecha.toLocaleDateString('es-ES', opciones);
}

function mostrarMensaje(mensaje, tipo = 'info') {
    // Crear toast
    const toast = document.createElement('div');
    toast.className = `toast-mensaje toast-${tipo}`;
    toast.textContent = mensaje;

    // Estilos del toast
    toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        padding: 1rem 1.5rem;
        background: ${tipo === 'success' ? '#10b981' : tipo === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-weight: 600;
    `;

    document.body.appendChild(toast);

    // Eliminar después de 5 segundos
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Añadir animaciones CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
