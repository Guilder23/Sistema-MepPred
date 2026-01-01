// Utilidades globales para el sistema de usuarios

// Función para obtener CSRF token
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

// Función para mostrar alertas (Sin Bootstrap)
function mostrarAlerta(mensaje, tipo) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo}`;
    alertDiv.style.cssText = 'padding: 1rem; border-radius: 4px; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;';
    
    // Establecer colores según el tipo
    const colores = {
        'success': { bg: '#d4edda', border: '#c3e6cb', color: '#155724' },
        'danger': { bg: '#f8d7da', border: '#f5c6cb', color: '#721c24' },
        'warning': { bg: '#fff3cd', border: '#ffeaa7', color: '#856404' },
        'info': { bg: '#d1ecf1', border: '#bee5eb', color: '#0c5460' }
    };
    
    const color = colores[tipo] || colores['info'];
    alertDiv.style.backgroundColor = color.bg;
    alertDiv.style.borderLeft = `4px solid ${color.border}`;
    alertDiv.style.color = color.color;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = 'background: none; border: none; font-size: 1.5rem; cursor: pointer; color: inherit;';
    closeBtn.onclick = () => alertDiv.remove();
    
    const contenedor = document.createElement('div');
    contenedor.textContent = mensaje;
    
    alertDiv.appendChild(contenedor);
    alertDiv.appendChild(closeBtn);
    
    const container = document.querySelector('.container-fluid');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
    }

    setTimeout(() => {
        alertDiv.remove();
    }, 4000);
}

