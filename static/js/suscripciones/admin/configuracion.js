// JavaScript para configuración de pago - Admin

document.addEventListener('DOMContentLoaded', function() {
    cargarConfiguracion();
    configurarFormulario();
    configurarVistaPrevia();
});

async function cargarConfiguracion() {
    const qrActual = document.getElementById('qrActual');
    const tituloForm = document.getElementById('tituloForm');
    
    try {
        const response = await fetch('/suscripciones/api/admin/configuracion/obtener/');
        const data = await response.json();
        
        if (data.tiene_configuracion) {
            // Mostrar QR actual
            qrActual.style.display = 'block';
            document.getElementById('qrActualImagen').src = data.qr_url;
            document.getElementById('qrActualDescripcion').textContent = data.descripcion || 'Sin descripción';
            document.getElementById('qrActualFecha').textContent = formatearFecha(data.actualizado_en);
            
            // Cambiar título del formulario
            tituloForm.textContent = 'Actualizar Código QR';
            
            // Pre-llenar descripción
            document.getElementById('descripcion').value = data.descripcion || '';
            
            // Hacer opcional el campo de archivo
            document.getElementById('qrPago').required = false;
        }
        
    } catch (error) {
        console.error('Error al cargar configuración:', error);
        // Continuar mostrando el formulario aunque haya error
    }
}

function configurarVistaPrevia() {
    const inputFile = document.getElementById('qrPago');
    const nombreArchivo = document.getElementById('nombreArchivo');
    const previewContainer = document.getElementById('previewContainer');
    const previewImagen = document.getElementById('previewImagen');
    
    if (!inputFile || !nombreArchivo || !previewContainer || !previewImagen) {
        console.error('Elementos de vista previa no encontrados');
        return;
    }
    
    inputFile.addEventListener('change', function() {
        const archivo = this.files[0];
        
        if (archivo) {
            // Mostrar nombre
            nombreArchivo.textContent = archivo.name;
            
            // Validar tamaño (5MB)
            if (archivo.size > 5 * 1024 * 1024) {
                mostrarMensaje('El archivo no debe superar 5MB', 'error');
                this.value = '';
                nombreArchivo.textContent = 'Seleccionar imagen...';
                previewContainer.style.display = 'none';
                return;
            }
            
            // Validar tipo
            if (!archivo.type.startsWith('image/')) {
                mostrarMensaje('Debes seleccionar una imagen', 'error');
                this.value = '';
                nombreArchivo.textContent = 'Seleccionar imagen...';
                previewContainer.style.display = 'none';
                return;
            }
            
            // Mostrar vista previa
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImagen.src = e.target.result;
                previewContainer.style.display = 'block';
            };
            reader.readAsDataURL(archivo);
        } else {
            nombreArchivo.textContent = 'Seleccionar imagen...';
            previewContainer.style.display = 'none';
        }
    });
}

function configurarFormulario() {
    const form = document.getElementById('formConfiguracion');
    
    if (!form) {
        console.error('Formulario no encontrado');
        return;
    }
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const btnGuardar = document.getElementById('btnGuardar');
        const inputFile = document.getElementById('qrPago');
        const descripcion = document.getElementById('descripcion').value;
        
        // Validar que al menos haya una imagen o sea actualización
        if (!inputFile.files.length && inputFile.required) {
            mostrarMensaje('Selecciona una imagen del QR', 'error');
            return;
        }
        
        // Deshabilitar botón
        btnGuardar.disabled = true;
        btnGuardar.querySelector('.btn-texto').style.display = 'none';
        btnGuardar.querySelector('.btn-spinner').style.display = 'flex';
        
        try {
            const formData = new FormData();
            
            if (inputFile.files.length > 0) {
                formData.append('qr_pago', inputFile.files[0]);
            }
            
            formData.append('descripcion', descripcion);
            
            const response = await fetch('/suscripciones/api/admin/configuracion/guardar/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                mostrarMensaje(data.mensaje, 'success');
                
                // Recargar página después de 2 segundos
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                mostrarMensaje(data.error || 'Error al guardar configuración', 'error');
                
                // Restaurar botón
                btnGuardar.disabled = false;
                btnGuardar.querySelector('.btn-texto').style.display = 'inline';
                btnGuardar.querySelector('.btn-spinner').style.display = 'none';
            }
            
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje('Error al guardar configuración', 'error');
            
            // Restaurar botón
            btnGuardar.disabled = false;
            btnGuardar.querySelector('.btn-texto').style.display = 'inline';
            btnGuardar.querySelector('.btn-spinner').style.display = 'none';
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
