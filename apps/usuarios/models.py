from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class UsuarioAuditoria(models.Model):
    """Modelo para auditar cambios en usuarios"""
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='auditorias')
    accion = models.CharField(max_length=50, choices=[
        ('crear', 'Crear'),
        ('editar', 'Editar'),
        ('eliminar', 'Eliminar'),
        ('activar', 'Activar'),
        ('desactivar', 'Desactivar'),
    ])
    realizado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='acciones_auditoria')
    fecha = models.DateTimeField(auto_now_add=True)
    cambios = models.JSONField(null=True, blank=True)

    class Meta:
        ordering = ['-fecha']
        verbose_name_plural = 'Auditorías de Usuarios'

    def __str__(self):
        return f"{self.accion} - {self.usuario.email} ({self.fecha.strftime('%d/%m/%Y %H:%M')})"

