from django.db import models
from django.utils import timezone
from apps.materias_nueva.models import Materia


class Tema(models.Model):
    """Modelo para gestionar temas"""
    
    nombre = models.CharField(
        max_length=200,
        verbose_name="Nombre del Tema"
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name="Descripción"
    )
    materia = models.ForeignKey(
        Materia,
        on_delete=models.CASCADE,
        related_name="temas",
        verbose_name="Materia"
    )
    requiere_suscripcion = models.BooleanField(
        default=False,
        verbose_name="Requiere Suscripción Premium",
        help_text="Indica si este tema requiere suscripción premium para acceder"
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
        verbose_name = "Tema"
        verbose_name_plural = "Temas"
        ordering = ['materia', 'id']
        unique_together = ('nombre', 'materia')
    
    def __str__(self):
        return f"{self.nombre} - {self.materia.nombre}"
