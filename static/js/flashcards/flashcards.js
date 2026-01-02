// Sistema de Flashcards con Repetición Espaciada
class FlashcardSystem {
    constructor() {
        this.tarjetas = [];
        this.mazos = [];
        this.mazoActual = null;
        this.tarjetaActual = null;
        this.repasadasHoy = 0;
        this.inicializar();
    }
    
    inicializar() {
        this.cargarDatos();
        this.vincularEventos();
        this.actualizarEstadisticas();
        this.mostrarProximaTarjeta();
    }
    
    cargarDatos() {
        // Los datos vienen del servidor
        if (typeof flashcardsData !== 'undefined') {
            this.mazos = flashcardsData.mazos || [];
            this.tarjetas = flashcardsData.tarjetas || [];
        }
    }
    
    vincularEventos() {
        // Tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.cambiarTab(e.currentTarget));
        });
        
        // Voltear tarjeta
        const studyCard = document.getElementById('study-card');
        if (studyCard) {
            studyCard.addEventListener('click', () => studyCard.classList.toggle('flipped'));
        }
        
        // Botones de dificultad
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dificultad = parseInt(e.currentTarget.getAttribute('data-difficulty'));
                this.procesarRespuesta(dificultad);
            });
        });
        
        // Crear flashcard
        document.getElementById('add-card')?.addEventListener('click', () => this.crearFlashcard());
        
        // Crear mazo
        document.getElementById('crear-mazo-btn')?.addEventListener('click', () => this.crearMazo());
        
        // Modal
        this.inicializarModal();
    }
    
    cambiarTab(tabElement) {
        const tabId = tabElement.getAttribute('data-tab');
        
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        tabElement.classList.add('active');
        document.getElementById(tabId).classList.add('active');
        
        if (tabId === 'mazos') {
            this.actualizarListaMazos();
        } else if (tabId === 'list') {
            this.actualizarListaTarjetas();
        }
    }
    
    crearFlashcard() {
        const mazoId = document.getElementById('mazo-select').value;
        const pregunta = document.getElementById('pregunta').value.trim();
        const respuesta = document.getElementById('respuesta').value.trim();
        const categoria = document.getElementById('categoria').value.trim();
        
        if (!mazoId || !pregunta || !respuesta) {
            alert('Por favor completa todos los campos requeridos');
            return;
        }
        
        const datos = new FormData();
        datos.append('mazo_id', mazoId);
        datos.append('pregunta', pregunta);
        datos.append('respuesta', respuesta);
        datos.append('categoria', categoria);
        
        fetch('/flashcards/crear/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': flashcardsData.csrfToken,
            },
            body: datos
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                document.getElementById('pregunta').value = '';
                document.getElementById('respuesta').value = '';
                document.getElementById('categoria').value = '';
                alert('¡Flashcard creada exitosamente!');
                this.cargarDatos();
                this.actualizarEstadisticas();
                this.mostrarProximaTarjeta();
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(err => console.error('Error:', err));
    }
    
    crearMazo() {
        const nombre = document.getElementById('nuevo-mazo-nombre').value.trim();
        const descripcion = document.getElementById('nuevo-mazo-desc').value.trim();
        
        if (!nombre) {
            alert('El nombre del mazo es requerido');
            return;
        }
        
        const datos = new FormData();
        datos.append('nombre', nombre);
        datos.append('descripcion', descripcion);
        
        fetch('/flashcards/crear-mazo/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': flashcardsData.csrfToken,
            },
            body: datos
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                document.getElementById('nuevo-mazo-nombre').value = '';
                document.getElementById('nuevo-mazo-desc').value = '';
                alert('¡Mazo creado exitosamente!');
                location.reload();
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(err => console.error('Error:', err));
    }
    
    procesarRespuesta(dificultad) {
        if (!this.tarjetaActual) return;
        
        const datos = new FormData();
        datos.append('tarjeta_id', this.tarjetaActual.id);
        datos.append('dificultad', dificultad);
        
        fetch('/flashcards/responder/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': flashcardsData.csrfToken,
            },
            body: datos
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                this.repasadasHoy++;
                this.cargarDatos();
                this.actualizarEstadisticas();
                this.mostrarProximaTarjeta();
            }
        })
        .catch(err => console.error('Error:', err));
    }
    
    mostrarProximaTarjeta() {
        const tarjetasVencidas = this.tarjetas.filter(t => new Date(t.proximo_repaso) <= new Date());
        
        if (tarjetasVencidas.length === 0) {
            this.mostrarNoHayTarjetas();
            return;
        }
        
        tarjetasVencidas.sort((a, b) => new Date(a.proximo_repaso) - new Date(b.proximo_repaso));
        this.tarjetaActual = tarjetasVencidas[0];
        this.mostrarTarjeta(this.tarjetaActual);
    }
    
    mostrarTarjeta(tarjeta) {
        document.getElementById('front-category').textContent = tarjeta.categoria || 'General';
        document.getElementById('front-content').textContent = tarjeta.pregunta;
        document.getElementById('back-category').textContent = tarjeta.categoria || 'General';
        document.getElementById('back-content').textContent = tarjeta.respuesta;
        document.getElementById('study-card').classList.remove('flipped');
        
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
        });
    }
    
    mostrarNoHayTarjetas() {
        document.getElementById('front-category').textContent = 'Sin tarjetas';
        document.getElementById('front-content').textContent = 
            'No hay flashcards para repasar. ¡Crea algunas nuevas o espera a que estén listas!';
        document.getElementById('back-category').textContent = 'Sin tarjetas';
        document.getElementById('back-content').textContent = 
            'Puedes crear nuevas flashcards en la pestaña "Crear"';
        
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
        });
    }
    
    actualizarEstadisticas() {
        const total = this.tarjetas.length;
        const vencidas = this.tarjetas.filter(t => new Date(t.proximo_repaso) <= new Date()).length;
        
        document.getElementById('total-cards').textContent = total;
        document.getElementById('due-cards').textContent = vencidas;
        document.getElementById('today-cards').textContent = vencidas;
        document.getElementById('reviewed-cards').textContent = this.repasadasHoy;
    }
    
    actualizarListaTarjetas() {
        const container = document.getElementById('flashcards-list');
        const emptyState = document.getElementById('empty-list');
        
        if (this.tarjetas.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        const tarjetasOrdenadas = [...this.tarjetas].sort((a, b) => 
            new Date(a.proximo_repaso) - new Date(b.proximo_repaso)
        );
        
        let html = '';
        tarjetasOrdenadas.forEach(tarjeta => {
            const diasHastaRepaso = this.calcularDias(tarjeta.proximo_repaso);
            const textoVencimiento = diasHastaRepaso <= 0 ? 'Vencida' : `En ${Math.ceil(diasHastaRepaso)} día(s)`;
            
            html += `
                <div class="flashcard-item">
                    <div class="flashcard-item-header">
                        <span class="flashcard-category">${tarjeta.categoria || 'General'}</span>
                        <span class="flashcard-due-date">${textoVencimiento}</span>
                    </div>
                    <div class="flashcard-preview">
                        <strong>P:</strong> ${this.truncar(tarjeta.pregunta, 80)}
                    </div>
                    <div class="flashcard-preview">
                        <strong>R:</strong> ${this.truncar(tarjeta.respuesta, 80)}
                    </div>
                    <div style="font-size: 0.8rem; color: #777; margin-top: 8px;">
                        Repeticiones: ${tarjeta.repeticiones} | Facilidad: ${tarjeta.factor_facilidad.toFixed(2)}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    actualizarListaMazos() {
        const container = document.getElementById('mazos-container');
        
        if (this.mazos.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>No tienes mazos creados</p></div>';
            return;
        }
        
        let html = '';
        this.mazos.forEach(mazo => {
            html += `
                <div class="mazo-item" data-mazo-id="${mazo.id}">
                    <div class="mazo-header">
                        <h4>${mazo.nombre}</h4>
                        <span class="mazo-stats">${mazo.tarjetas_count} tarjetas | ${mazo.vencidas_count} vencidas</span>
                    </div>
                    ${mazo.descripcion ? `<p class="mazo-description">${mazo.descripcion}</p>` : ''}
                    <div class="mazo-actions">
                        <button class="btn-small btn-estudiar" onclick="system.estudiarMazo(${mazo.id})">
                            <i class="fas fa-book"></i> Estudiar
                        </button>
                        <button class="btn-small btn-editar" onclick="system.editarMazo(${mazo.id})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-small btn-eliminar" onclick="system.eliminarMazo(${mazo.id})">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    estudiarMazo(mazoId) {
        console.log('Estudiar mazo:', mazoId);
        // Cambiar a pestaña de estudio
        document.querySelector('[data-tab="study"]').click();
    }
    
    editarMazo(mazoId) {
        const mazo = this.mazos.find(m => m.id === mazoId);
        if (!mazo) return;
        
        document.getElementById('edit-mazo-nombre').value = mazo.nombre;
        document.getElementById('edit-mazo-desc').value = mazo.descripcion || '';
        document.getElementById('modal-editar-mazo').classList.add('show');
        
        document.getElementById('guardar-editar').onclick = () => {
            this.guardarEdicionMazo(mazoId);
        };
    }
    
    guardarEdicionMazo(mazoId) {
        const nombre = document.getElementById('edit-mazo-nombre').value.trim();
        const descripcion = document.getElementById('edit-mazo-desc').value.trim();
        
        if (!nombre) {
            alert('El nombre es requerido');
            return;
        }
        
        const datos = new FormData();
        datos.append('nombre', nombre);
        datos.append('descripcion', descripcion);
        
        fetch(`/flashcards/mazo/${mazoId}/editar/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': flashcardsData.csrfToken,
            },
            body: datos
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('Mazo actualizado');
                document.getElementById('modal-editar-mazo').classList.remove('show');
                location.reload();
            }
        })
        .catch(err => console.error('Error:', err));
    }
    
    eliminarMazo(mazoId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este mazo?')) return;
        
        fetch(`/flashcards/mazo/${mazoId}/eliminar/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': flashcardsData.csrfToken,
            }
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('Mazo eliminado');
                location.reload();
            }
        })
        .catch(err => console.error('Error:', err));
    }
    
    inicializarModal() {
        const modal = document.getElementById('modal-editar-mazo');
        const close = modal.querySelector('.close');
        const cancelar = document.getElementById('cancelar-editar');
        
        if (close) close.addEventListener('click', () => modal.classList.remove('show'));
        if (cancelar) cancelar.addEventListener('click', () => modal.classList.remove('show'));
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('show');
        });
    }
    
    calcularDias(fecha) {
        const hoy = new Date();
        const fechaRepaso = new Date(fecha);
        return (fechaRepaso - hoy) / (1000 * 60 * 60 * 24);
    }
    
    truncar(texto, longitud) {
        return texto.length > longitud ? texto.substring(0, longitud) + '...' : texto;
    }
}

// Inicializar cuando DOM esté listo
let system;
document.addEventListener('DOMContentLoaded', () => {
    system = new FlashcardSystem();
});
