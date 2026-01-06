from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


class ConfiguracionPago(models.Model):
    """Configuración del QR de pago del administrador"""
    administrador = models.OneToOneField(
        User, 
        on_delete=models.CASCADE,
        related_name='configuracion_pago',
        limit_choices_to={'is_staff': True}
    )
    qr_pago = models.ImageField(
        upload_to='qr_pagos/',
        verbose_name='QR de Pago',
        help_text='Imagen del QR para recibir pagos'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Instrucciones adicionales para el pago'
    )
    actualizado_en = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Configuración de Pago'
        verbose_name_plural = 'Configuraciones de Pago'
    
    def __str__(self):
        return f'QR de {self.administrador.get_full_name() or self.administrador.username}'


class Suscripcion(models.Model):
    """Suscripción de estudiante al contenido premium"""
    
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente de Aprobación'),
        ('APROBADO', 'Aprobado'),
        ('RECHAZADO', 'Rechazado'),
        ('VENCIDO', 'Vencido'),
    ]
    
    estudiante = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='suscripciones'
    )
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='PENDIENTE'
    )
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    fecha_aprobacion = models.DateTimeField(null=True, blank=True)
    fecha_vencimiento = models.DateTimeField(null=True, blank=True)
    
    # Comprobante
    comprobante = models.ImageField(
        upload_to='comprobantes/%Y/%m/',
        verbose_name='Comprobante de Pago'
    )
    
    # Aprobación
    aprobado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='suscripciones_aprobadas'
    )
    motivo_rechazo = models.TextField(blank=True)
    
    # Auditoría
    actualizado_en = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-fecha_solicitud']
        verbose_name = 'Suscripción'
        verbose_name_plural = 'Suscripciones'
    
    def __str__(self):
        return f'{self.estudiante.get_full_name() or self.estudiante.username} - {self.estado}'
    
    def aprobar(self, admin):
        """Aprobar la suscripción"""
        self.estado = 'APROBADO'
        self.aprobado_por = admin
        self.fecha_aprobacion = timezone.now()
        self.fecha_vencimiento = timezone.now() + timedelta(days=30)  # 1 mes
        self.save()
    
    def rechazar(self, admin, motivo=''):
        """Rechazar la suscripción"""
        self.estado = 'RECHAZADO'
        self.aprobado_por = admin
        self.motivo_rechazo = motivo
        self.save()
    
    def esta_activa(self):
        """Verificar si la suscripción está activa"""
        if self.estado != 'APROBADO':
            return False
        
        if not self.fecha_vencimiento:
            return False
        
        # Verificar si venció
        if timezone.now() > self.fecha_vencimiento:
            if self.estado == 'APROBADO':
                self.estado = 'VENCIDO'
                self.save()
            return False
        
        return True
    
    def dias_restantes(self):
        """Calcular días restantes de la suscripción"""
        if not self.fecha_vencimiento or self.estado != 'APROBADO':
            return 0
        
        delta = self.fecha_vencimiento - timezone.now()
        return max(0, delta.days)


class HistorialSuscripcion(models.Model):
    """Historial de cambios de estado de suscripciones"""
    suscripcion = models.ForeignKey(
        Suscripcion,
        on_delete=models.CASCADE,
        related_name='historial'
    )
    estado_anterior = models.CharField(max_length=20)
    estado_nuevo = models.CharField(max_length=20)
    modificado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True
    )
    observaciones = models.TextField(blank=True)
    fecha = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-fecha']
        verbose_name = 'Historial de Suscripción'
        verbose_name_plural = 'Historial de Suscripciones'
    
    def __str__(self):
        return f'{self.suscripcion.estudiante.username}: {self.estado_anterior} → {self.estado_nuevo}'
