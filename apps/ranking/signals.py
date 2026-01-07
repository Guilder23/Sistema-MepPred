from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.evaluaciones.models import IntentoExamen
from .models import EstadisticaEstudiante


@receiver(post_save, sender=IntentoExamen)
def actualizar_estadisticas_estudiante(sender, instance, created, **kwargs):
    """
    Actualiza las estadísticas del estudiante cuando completa un examen
    """
    if created:
        # Actualizar estadísticas del estudiante
        EstadisticaEstudiante.actualizar_estadisticas(instance.estudiante)
