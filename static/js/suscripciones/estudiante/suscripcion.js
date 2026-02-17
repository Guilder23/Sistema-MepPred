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
        configurarModalQr();

    } catch (error) {
        console.error('Error al cargar estado:', error);
        // Mostrar formulario aunque haya error
        estadoSuscripcion.style.display = 'none';
        formContainer.style.display = 'grid';
        cargarQR();
        configurarFormulario();
        configurarModalQr();
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
            estadoIcon.innerHTML = '<i class="fas fa-hourglass-half"></i>';
            estadoTitulo.textContent = 'Suscripción Pendiente';
            estadoDescripcion.textContent = 'Tu solicitud está siendo revisada por el administrador. Recibirás una confirmación pronto.';
            estadoFecha.textContent = 'Enviado: ' + formatearFecha(data.fecha_solicitud);
            break;

        case 'APROBADO':
            if (data.activa) {
                estadoIcon.innerHTML = '<i class="fas fa-check"></i>';
                estadoTitulo.textContent = '¡Suscripción Activa!';
                estadoDescripcion.textContent = `Tu suscripción está activa. Tienes acceso a todo el contenido premium por ${data.dias_restantes} días más.`;
                estadoFecha.textContent = 'Vence: ' + formatearFecha(data.fecha_vencimiento);
            } else {
                estadoIcon.innerHTML = '<i class="fas fa-clock"></i>';
                estadoTitulo.textContent = 'Suscripción Vencida';
                estadoDescripcion.textContent = 'Tu suscripción ha expirado. Puedes renovarla para seguir disfrutando del contenido premium.';
                estadoFecha.textContent = 'Expiró: ' + formatearFecha(data.fecha_vencimiento);
            }
            break;

        case 'RECHAZADO':
            estadoIcon.innerHTML = '<i class="fas fa-times"></i>';
            estadoTitulo.textContent = 'Suscripción Rechazada';
            estadoDescripcion.textContent = data.motivo_rechazo || 'Tu solicitud fue rechazada. Puedes intentar nuevamente.';
            estadoFecha.textContent = 'Fecha de solicitud: ' + formatearFecha(data.fecha_solicitud);
            break;

        case 'VENCIDO':
            estadoIcon.innerHTML = '<i class="fas fa-clock"></i>';
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

            const btnDescargarInline = document.getElementById('btnDescargarQrInline');
            if (btnDescargarInline) {
                btnDescargarInline.setAttribute('href', data.qr_url);
                btnDescargarInline.setAttribute('download', 'qr-pago');
            }
        } else {
            document.getElementById('qrContenedor').innerHTML = 
                '<p style="color: #ef4444; text-align: center;">No hay código QR configurado. Contacta al administrador.</p>';
        }
    } catch (error) {
        console.error('Error al cargar QR:', error);
    }
}

function configurarModalQr() {
    const modal = document.getElementById('modalQr');
    const btnCerrar = document.getElementById('btnCerrarModalQr');
    const qrImagenModal = document.getElementById('qrImagenModal');
    const qrDescripcion = document.getElementById('qrDescripcion');
    const qrDescripcionModal = document.getElementById('qrDescripcionModal');
    const btnDescargar = document.getElementById('btnDescargarQr');

    if (!modal || !qrImagenModal) return;

    if (window.__qrModalConfigured) return;
    window.__qrModalConfigured = true;

    function abrirModalDesdeImagen(qrImagen) {
        const src = (qrImagen && qrImagen.getAttribute) ? (qrImagen.getAttribute('src') || '') : '';
        if (!src) return;
        qrImagenModal.setAttribute('src', src);
        if (btnDescargar) {
            btnDescargar.setAttribute('href', src);
            btnDescargar.setAttribute('download', 'qr-pago');
        }
        if (qrDescripcionModal && qrDescripcion) {
            qrDescripcionModal.textContent = qrDescripcion.textContent || '';
        }
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
    }

    // Fallback explícito para onclick en HTML
    window.abrirModalQr = function() {
        const qrImagen = document.getElementById('qrImagen');
        if (!qrImagen) return;
        abrirModalDesdeImagen(qrImagen);
    };

    function cerrarModal() {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
    }

    // Delegación para soportar QR cargado dinámicamente
    document.addEventListener('click', function(e) {
        const target = e.target;
        if (target && target.id === 'qrImagen') {
            abrirModalDesdeImagen(target);
        }
    });

    document.addEventListener('keydown', function(e) {
        const target = e.target;
        if (!target || target.id !== 'qrImagen') return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            abrirModalDesdeImagen(target);
        }
    });

    // Hacer QR accesible cuando exista
    const qrImagen = document.getElementById('qrImagen');
    if (qrImagen) {
        qrImagen.setAttribute('tabindex', '0');
        qrImagen.setAttribute('role', 'button');
    }

    if (btnCerrar) {
        btnCerrar.addEventListener('click', cerrarModal);
    }

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            cerrarModal();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display !== 'none') {
            cerrarModal();
        }
    });
}

function configurarFormulario() {
    const form = document.getElementById('formSuscripcion');
    if (!form) return;

    const comprobanteInput = document.getElementById('comprobante');
    const archivoSeleccionadoDiv = document.getElementById('archivoSeleccionado');
    const archivoNombreSpan = archivoSeleccionadoDiv ? archivoSeleccionadoDiv.querySelector('.archivo-nombre') : null;

    const comprobantePreview = document.getElementById('comprobantePreview');
    const previewImagen = document.getElementById('previewImagen');
    const previewPdf = document.getElementById('previewPdf');
    const previewFallback = document.getElementById('previewFallback');
    const btnCambiarComprobante = document.getElementById('btnCambiarComprobante');
    const btnQuitarComprobante = document.getElementById('btnQuitarComprobante');
    const comprobantePreviewEmpty = document.getElementById('comprobantePreviewEmpty');

    let currentObjectUrl = null;

    function limpiarPreview() {
        if (currentObjectUrl) {
            try {
                URL.revokeObjectURL(currentObjectUrl);
            } catch (e) {
                // noop
            }
            currentObjectUrl = null;
        }

        if (previewImagen) {
            previewImagen.src = '';
            previewImagen.style.display = 'none';
        }

        if (previewPdf) {
            previewPdf.innerHTML = '';
            previewPdf.style.display = 'none';
        }

        if (previewFallback) {
            previewFallback.innerHTML = '';
            previewFallback.style.display = 'none';
        }

        if (comprobantePreview) {
            comprobantePreview.style.display = 'none';
        }

        if (comprobantePreviewEmpty) {
            comprobantePreviewEmpty.style.display = 'block';
        }
    }

    function mostrarPreview(archivo) {
        limpiarPreview();

        if (!archivo) return;
        if (!comprobantePreview) return;

        comprobantePreview.style.display = 'block';
        if (comprobantePreviewEmpty) {
            comprobantePreviewEmpty.style.display = 'none';
        }

        const tipo = (archivo.type || '').toLowerCase();
        const nombre = (archivo.name || '').toLowerCase();
        const esPdf = tipo === 'application/pdf' || nombre.endsWith('.pdf');
        const esImagen = tipo.startsWith('image/');

        if (esImagen && previewImagen) {
            currentObjectUrl = URL.createObjectURL(archivo);
            previewImagen.src = currentObjectUrl;
            previewImagen.style.display = 'block';
            return;
        }

        if (esPdf && previewPdf) {
            currentObjectUrl = URL.createObjectURL(archivo);
            previewPdf.innerHTML = `<iframe src="${currentObjectUrl}" title="Comprobante PDF"></iframe>`;
            previewPdf.style.display = 'block';
            return;
        }

        if (previewFallback) {
            previewFallback.textContent = 'No se puede previsualizar este tipo de archivo. Puedes enviarlo igualmente.';
            previewFallback.style.display = 'block';
        }
    }

    function resetearSeleccionArchivo() {
        limpiarPreview();
        if (archivoSeleccionadoDiv) {
            archivoSeleccionadoDiv.style.display = 'none';
        }
        if (archivoNombreSpan) {
            archivoNombreSpan.textContent = '';
        }
        if (comprobanteInput) {
            comprobanteInput.value = '';
        }
    }

    // Mostrar nombre del archivo cuando se selecciona
    if (comprobanteInput) {
        comprobanteInput.addEventListener('change', function(e) {
            const archivo = e.target.files[0];

            if (!archivo) {
                resetearSeleccionArchivo();
                return;
            }

            // Validar tamaño (5MB)
            if (archivo.size > 5 * 1024 * 1024) {
                mostrarMensaje('El archivo no debe superar 5MB', 'error');
                resetearSeleccionArchivo();
                return;
            }

            // Validar tipo
            const tipo = (archivo.type || '').toLowerCase();
            const nombre = (archivo.name || '').toLowerCase();
            const esPdf = tipo === 'application/pdf' || nombre.endsWith('.pdf');
            const esImagen = tipo.startsWith('image/');
            if (!esPdf && !esImagen) {
                mostrarMensaje('Formato no permitido. Usa JPG, PNG o PDF.', 'error');
                resetearSeleccionArchivo();
                return;
            }

            if (archivoSeleccionadoDiv) {
                if (archivoNombreSpan) {
                    archivoNombreSpan.textContent = archivo.name;
                }
                archivoSeleccionadoDiv.style.display = 'flex';
            }

            mostrarPreview(archivo);
        });
    }

    if (btnCambiarComprobante && comprobanteInput) {
        btnCambiarComprobante.addEventListener('click', function() {
            comprobanteInput.click();
        });
    }

    if (btnQuitarComprobante) {
        btnQuitarComprobante.addEventListener('click', function() {
            resetearSeleccionArchivo();
        });
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const btnEnviar = document.getElementById('btnEnviar');
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
            // Primero validar el perfil
            const validacionResponse = await fetch('/suscripciones/api/validar-perfil/');
            const validacionData = await validacionResponse.json();

            if (!validacionData.perfil_valido) {
                // Mostrar modal de perfil incompleto
                mostrarModalPerfilIncompleto(validacionData.campos_faltantes);
                // Restaurar botón
                btnEnviar.disabled = false;
                btnEnviar.querySelector('.btn-texto').style.display = 'inline';
                btnEnviar.querySelector('.btn-spinner').style.display = 'none';
                return;
            }

            // Si el perfil es válido, crear la suscripción
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
                // Verificar si el error es por perfil incompleto
                if (data.tipo_error === 'perfil_incompleto') {
                    mostrarModalPerfilIncompleto(data.campos_faltantes);
                } else {
                    mostrarMensaje(data.error || 'Error al enviar suscripción', 'error');
                }
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

    .modal-overlay-perfil {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal-perfil {
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        max-width: 420px;
        width: 90%;
        padding: 1.25rem;
        text-align: center;
    }

    .modal-perfil-icon {
        font-size: 2rem;
        margin-bottom: 0.75rem;
        color: #f59e0b;
    }

    .modal-perfil h2 {
        color: #1f2937;
        margin-bottom: 0.4rem;
        font-size: 1.2rem;
    }

    .modal-perfil p {
        color: #6b7280;
        margin-bottom: 1rem;
        line-height: 1.5;
        font-size: 0.92rem;
    }

    .campos-faltantes {
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 8px;
        padding: 0.85rem;
        margin-bottom: 1rem;
        text-align: left;
    }

    .campos-faltantes h4 {
        color: #991b1b;
        margin: 0 0 0.75rem 0;
        font-size: 0.95rem;
    }

    .campos-faltantes ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .campos-faltantes li {
        color: #7f1d1d;
        padding: 0.5rem 0;
        padding-left: 1.5rem;
        position: relative;
        font-size: 0.9rem;
    }

    .campos-faltantes li:before {
        content: "•";
        position: absolute;
        left: 0;
    }

    .modal-perfil-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
    }

    .btn-perfil-modal {
        flex: 1;
        padding: 0.65rem 1rem;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.95rem;
    }

    .btn-perfil-ir {
        background: #3b82f6;
        color: white;
    }

    .btn-perfil-ir:hover {
        background: #2563eb;
    }

    .btn-perfil-cerrar {
        background: #e5e7eb;
        color: #374151;
    }

    .btn-perfil-cerrar:hover {
        background: #d1d5db;
    }
`;
document.head.appendChild(style);

function mostrarModalPerfilIncompleto(camposFaltantes) {
    // Eliminar modal anterior si existe
    const modalExistente = document.getElementById('modalPerfilIncompleto');
    if (modalExistente) {
        modalExistente.remove();
    }

    // Crear modal
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'modalPerfilIncompleto';
    modalOverlay.className = 'modal-overlay-perfil';

    const listaItems = camposFaltantes.map(campo => `<li>${campo}</li>`).join('');

    modalOverlay.innerHTML = `
        <div class="modal-perfil">
            <div class="modal-perfil-icon"><i class="fas fa-exclamation-triangle"></i></div>
            <h2>Perfil Incompleto</h2>
            <p><strong>Primero debe llenar todos los datos en su perfil</strong> para poder enviar el comprobante de suscripción.</p>
            
            <div class="campos-faltantes">
                <h4>Campos que faltan:</h4>
                <ul>
                    ${listaItems}
                </ul>
            </div>

            <div class="modal-perfil-buttons">
                <button class="btn-perfil-modal btn-perfil-ir" onclick="window.location.href='/perfil/'">
                    Ir a Completar Perfil
                </button>
                <button class="btn-perfil-modal btn-perfil-cerrar" onclick="this.closest('.modal-overlay-perfil').remove()">
                    Cerrar
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modalOverlay);

    // Cerrar al hacer clic en el overlay
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            modalOverlay.remove();
        }
    });
}
