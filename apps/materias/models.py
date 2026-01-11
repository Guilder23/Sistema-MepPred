from django.db import models
from django.utils import timezone


class Materia(models.Model):
    """Modelo para gestionar materias/asignaturas"""
    
    nombre = models.CharField(
        max_length=200,
        unique=True,
        verbose_name="Nombre de la Materia"
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name="Descripción"
    )
    requiere_suscripcion = models.BooleanField(
        default=False,
        verbose_name="Requiere Suscripción Premium",
        help_text="Indica si esta materia requiere suscripción premium para acceder"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de Creación"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Fecha de Actualización"
    )
    
    class Meta:
        verbose_name = "Materia"
        verbose_name_plural = "Materias"
        ordering = ['-created_at']
    
    def __str__(self):
        return self.nombre
