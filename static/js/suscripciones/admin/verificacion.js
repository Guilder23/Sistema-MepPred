// JavaScript para verificación de pagos - Admin

let estadoFiltro = '';
let suscripciones = [];
let suscripcionAprobarId = null;
let botoneAprobarElement = null;

document.addEventListener('DOMContentLoaded', function() {
    configurarFiltros();
    cargarSuscripciones();
    configurarModales();
    
    // Actualizar cada 30 segundos
    setInterval(cargarSuscripciones, 30000);
});

function configurarFiltros() {
    const botonesFiltro = document.querySelectorAll('.filtro-btn');
    
    botonesFiltro.forEach(btn => {
        btn.addEventListener('click', function() {
            // Actualizar estado activo
            botonesFiltro.forEach(b => b.classList.remove('filtro-activo'));
            this.classList.add('filtro-activo');
            
            // Aplicar filtro
            estadoFiltro = this.dataset.estado;
            renderizarSuscripciones();
        });
    });
}

async function cargarSuscripciones() {
    const listaSuscripciones = document.getElementById('listaSuscripciones');
    
    try {
        const response = await fetch('/suscripciones/api/admin/todas/');
        const data = await response.json();
        
        suscripciones = data;
        
        // Actualizar badge de pendientes
        const pendientes = suscripciones.filter(s => s.estado === 'PENDIENTE').length;
        document.getElementById('badgePendientes').textContent = pendientes;
        
        renderizarSuscripciones();
        
    } catch (error) {
        console.error('Error al cargar suscripciones:', error);
        listaSuscripciones.innerHTML = '<p style="text-align: center; padding: 2rem; color: #ef4444;">Error al cargar suscripciones. Recarga la página.</p>';
    }
}

function renderizarSuscripciones() {
    const listaSuscripciones = document.getElementById('listaSuscripciones');
    const mensajeVacio = document.getElementById('mensajeVacio');
    
    // Filtrar
    let filtradas = suscripciones;
    if (estadoFiltro) {
        filtradas = suscripciones.filter(s => s.estado === estadoFiltro);
    }
    
    // Mostrar mensaje vacío si no hay resultados
    if (filtradas.length === 0) {
        listaSuscripciones.innerHTML = '';
        mensajeVacio.style.display = 'block';
        return;
    }
    
    mensajeVacio.style.display = 'none';
    
    // Renderizar tarjetas
    listaSuscripciones.innerHTML = filtradas.map(s => crearTarjetaSuscripcion(s)).join('');
    
    // Añadir event listeners
    agregarEventListeners();
}

function crearTarjetaSuscripcion(suscripcion) {
    const inicial = suscripcion.estudiante.nombre.charAt(0).toUpperCase();
    const estadoClass = suscripcion.estado.toLowerCase();
    
    let accionesHTML = '';
    if (suscripcion.estado === 'PENDIENTE') {
        accionesHTML = `
            <div class="card-acciones">
                <button class="btn-aprobar" data-id="${suscripcion.id}">
                    <span class="btn-texto">✓ Aprobar</span>
                    <span class="btn-spinner" style="display: none;">
                        <span class="spinner"></span>
                    </span>
                </button>
                <button class="btn-rechazar" data-id="${suscripcion.id}">
                    <span class="btn-texto">✕ Rechazar</span>
                    <span class="btn-spinner" style="display: none;">
                        <span class="spinner"></span>
                    </span>
                </button>
            </div>
        `;
    }
    
    let infoExtra = '';
    if (suscripcion.estado === 'APROBADO') {
        const diasClass = suscripcion.dias_restantes > 7 ? 'dias-restantes' : 'vencido';
        infoExtra = `
            <div class="info-item">
                <span class="info-label">Días restantes:</span>
                <span class="info-value ${diasClass}">${suscripcion.dias_restantes} días</span>
            </div>
            <div class="info-item">
                <span class="info-label">Vencimiento:</span>
                <span class="info-value">${formatearFecha(suscripcion.fecha_vencimiento)}</span>
            </div>
        `;
    }
    
    if (suscripcion.estado === 'RECHAZADO' && suscripcion.motivo_rechazo) {
        infoExtra = `
            <div class="motivo-rechazo">
                <strong>Motivo del rechazo:</strong>
                <p>${suscripcion.motivo_rechazo}</p>
            </div>
        `;
    }
    
    if (suscripcion.aprobado_por) {
        infoExtra += `
            <div class="info-item">
                <span class="info-label">Procesado por:</span>
                <span class="info-value">${suscripcion.aprobado_por}</span>
            </div>
        `;
    }
    
    return `
        <div class="suscripcion-card">
            <div class="card-header">
                <div class="card-estudiante">
                    <div class="estudiante-avatar">${inicial}</div>
                    <div class="estudiante-info">
                        <h3>${suscripcion.estudiante.nombre}</h3>
                        <p>${suscripcion.estudiante.email}</p>
                    </div>
                </div>
                <span class="card-estado ${estadoClass}">${suscripcion.estado}</span>
            </div>
            
            <div class="card-body">
                <div class="card-info">
                    <div class="info-item">
                        <span class="info-label">Fecha de solicitud:</span>
                        <span class="info-value">${formatearFecha(suscripcion.fecha_solicitud)}</span>
                    </div>
                    ${infoExtra}
                </div>
                
                <div class="card-comprobante">
                    <img 
                        src="${suscripcion.comprobante_url}" 
                        alt="Comprobante" 
                        class="comprobante-preview"
                        data-url="${suscripcion.comprobante_url}"
                    >
                </div>
                
                ${accionesHTML}
            </div>
        </div>
    `;
}

function agregarEventListeners() {
    // Comprobantes - abrir modal
    document.querySelectorAll('.comprobante-preview').forEach(img => {
        img.addEventListener('click', function() {
            const url = this.dataset.url;
            document.getElementById('imagenComprobante').src = url;
            document.getElementById('modalComprobante').style.display = 'flex';
        });
    });
    
    // Botones aprobar
    document.querySelectorAll('.btn-aprobar').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            aprobarSuscripcion(id, this);
        });
    });
    
    // Botones rechazar
    document.querySelectorAll('.btn-rechazar').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            abrirModalRechazo(id);
        });
    });
}

function configurarModales() {
    // Modal comprobante
    document.getElementById('cerrarModalComprobante').addEventListener('click', () => {
        document.getElementById('modalComprobante').style.display = 'none';
    });
    
    // Modal confirmación aprobación
    document.getElementById('cerrarModalConfirmarAprobacion').addEventListener('click', () => {
        document.getElementById('modalConfirmarAprobacion').style.display = 'none';
        suscripcionAprobarId = null;
        botoneAprobarElement = null;
    });
    
    document.getElementById('cancelarAprobacion').addEventListener('click', () => {
        document.getElementById('modalConfirmarAprobacion').style.display = 'none';
        suscripcionAprobarId = null;
        botoneAprobarElement = null;
    });
    
    document.getElementById('confirmarAprobacion').addEventListener('click', async function() {
        if (suscripcionAprobarId && botoneAprobarElement) {
            await procesarAprobacionSuscripcion(suscripcionAprobarId, botoneAprobarElement);
        }
    });
    
    // Modal rechazo
    document.getElementById('cerrarModalRechazo').addEventListener('click', () => {
        document.getElementById('modalRechazo').style.display = 'none';
        // No limpiar el textarea al cerrar, el usuario puede querer corregir
    });
    
    document.getElementById('cancelarRechazo').addEventListener('click', () => {
        document.getElementById('modalRechazo').style.display = 'none';
        // Limpiar solo si cancela
        document.getElementById('motivoRechazo').value = '';
    });
    
    // Formulario rechazo
    document.getElementById('formRechazo').addEventListener('submit', async function(e) {
        e.preventDefault();
        const id = document.getElementById('suscripcionRechazarId').value;
        const motivo = document.getElementById('motivoRechazo').value;
        await rechazarSuscripcion(id, motivo, this);
    });
    
    // Cerrar al hacer clic fuera
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('verificacion-modal')) {
            e.target.style.display = 'none';
        }
    });
}

function aprobarSuscripcion(id, btnElement) {
    // Guardar los datos para usar en la confirmación
    suscripcionAprobarId = id;
    botoneAprobarElement = btnElement;
    
    // Mostrar modal de confirmación
    document.getElementById('modalConfirmarAprobacion').style.display = 'flex';
}

async function procesarAprobacionSuscripcion(id, btnElement) {
    // Deshabilitar botón
    const btnConfirmar = document.getElementById('confirmarAprobacion');
    btnConfirmar.disabled = true;
    btnConfirmar.querySelector('.btn-texto').style.display = 'none';
    btnConfirmar.querySelector('.btn-spinner').style.display = 'flex';
    
    try {
        const response = await fetch(`/suscripciones/api/admin/${id}/aprobar/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarMensaje(data.mensaje, 'success');
            // Cerrar modal
            document.getElementById('modalConfirmarAprobacion').style.display = 'none';
            suscripcionAprobarId = null;
            botoneAprobarElement = null;
            // Esperar un momento antes de recargar para que se vea el mensaje
            setTimeout(() => {
                cargarSuscripciones();
            }, 500);
        } else {
            mostrarMensaje(data.error || 'Error al aprobar', 'error');
            // Restaurar botón
            btnConfirmar.disabled = false;
            btnConfirmar.querySelector('.btn-texto').style.display = 'inline';
            btnConfirmar.querySelector('.btn-spinner').style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al aprobar suscripción', 'error');
        // Restaurar botón
        const btnConfirmar = document.getElementById('confirmarAprobacion');
        btnConfirmar.disabled = false;
        btnConfirmar.querySelector('.btn-texto').style.display = 'inline';
        btnConfirmar.querySelector('.btn-spinner').style.display = 'none';
    }
}

function abrirModalRechazo(id) {
    document.getElementById('suscripcionRechazarId').value = id;
    // No limpiar si ya hay texto escrito
    const textarea = document.getElementById('motivoRechazo');
    if (!textarea.value) {
        textarea.value = '';
    }
    document.getElementById('modalRechazo').style.display = 'flex';
    // Enfocar el textarea
    setTimeout(() => textarea.focus(), 100);
}

async function rechazarSuscripcion(id, motivo, formElement) {
    const btnRechazar = formElement.querySelector('.btn-rechazar-confirmar');
    
    // Validar que tengamos el ID
    if (!id || id === 'undefined') {
        mostrarMensaje('Error: ID de suscripción no válido', 'error');
        return;
    }
    
    // Deshabilitar botón
    btnRechazar.disabled = true;
    btnRechazar.querySelector('.btn-texto').style.display = 'none';
    btnRechazar.querySelector('.btn-spinner').style.display = 'flex';
    
    try {
        const response = await fetch(`/suscripciones/api/admin/${id}/rechazar/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ motivo })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarMensaje(data.mensaje, 'success');
            document.getElementById('modalRechazo').style.display = 'none';
            // Limpiar formulario solo después de éxito
            document.getElementById('motivoRechazo').value = '';
            cargarSuscripciones();
        } else {
            mostrarMensaje(data.error || 'Error al rechazar', 'error');
            // Restaurar botón
            btnRechazar.disabled = false;
            btnRechazar.querySelector('.btn-texto').style.display = 'inline';
            btnRechazar.querySelector('.btn-spinner').style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al rechazar suscripción', 'error');
        // Restaurar botón
        btnRechazar.disabled = false;
        btnRechazar.querySelector('.btn-texto').style.display = 'inline';
        btnRechazar.querySelector('.btn-spinner').style.display = 'none';
    }
}

function formatearFecha(isoString) {
    if (!isoString) return '';
    const fecha = new Date(isoString);
    const opciones = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return fecha.toLocaleDateString('es-ES', opciones);
}

function mostrarMensaje(mensaje, tipo = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-mensaje toast-${tipo}`;
    toast.textContent = mensaje;
    
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
