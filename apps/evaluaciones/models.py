from django.db import models
from apps.materias.models import Materia


class Examen(models.Model):
    """Modelo para exámenes"""
    
    titulo = models.CharField(
        max_length=200,
        verbose_name="Título del Examen"
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name="Descripción"
    )
    materia = models.ForeignKey(
        Materia,
        on_delete=models.CASCADE,
        related_name='examenes',
        verbose_name="Materia"
    )
    duracion_minutos = models.IntegerField(
        default=60,
        verbose_name="Duración (minutos)"
    )
    es_premium = models.BooleanField(
        default=True,
        verbose_name="Requiere Suscripción Premium"
    )
    activo = models.BooleanField(
        default=True,
        verbose_name="Activo"
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
        verbose_name = "Examen"
        verbose_name_plural = "Exámenes"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.titulo} - {self.materia.nombre}"


class Pregunta(models.Model):
    """Modelo para preguntas de examen"""
    
    examen = models.ForeignKey(
        Examen,
        on_delete=models.CASCADE,
        related_name='preguntas',
        verbose_name="Examen"
    )
    texto = models.TextField(
        verbose_name="Texto de la Pregunta"
    )
    orden = models.IntegerField(
        default=0,
        verbose_name="Orden"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de Creación"
    )
    
    class Meta:
        verbose_name = "Pregunta"
        verbose_name_plural = "Preguntas"
        ordering = ['orden', 'id']
    
    def __str__(self):
        return f"Pregunta {self.orden} - {self.examen.titulo}"


class Enunciado(models.Model):
    """Modelo para enunciados de una pregunta"""
    
    pregunta = models.ForeignKey(
        Pregunta,
        on_delete=models.CASCADE,
        related_name='enunciados',
        verbose_name="Pregunta"
    )
    numero = models.IntegerField(
        verbose_name="Número del Enunciado"
    )
    texto = models.TextField(
        verbose_name="Texto del Enunciado"
    )
    es_verdadero = models.BooleanField(
        default=True,
        verbose_name="Es Verdadero"
    )
    
    class Meta:
        verbose_name = "Enunciado"
        verbose_name_plural = "Enunciados"
        ordering = ['numero']
    
    def __str__(self):
        return f"Enunciado {self.numero} - {self.pregunta}"


class Opcion(models.Model):
    """Modelo para opciones de respuesta"""
    
    pregunta = models.ForeignKey(
        Pregunta,
        on_delete=models.CASCADE,
        related_name='opciones',
        verbose_name="Pregunta"
    )
    letra = models.CharField(
        max_length=1,
        verbose_name="Letra de la Opción"
    )
    descripcion = models.CharField(
        max_length=200,
        verbose_name="Descripción"
    )
    es_correcta = models.BooleanField(
        default=False,
        verbose_name="Es Correcta"
    )
    
    class Meta:
        verbose_name = "Opción"
        verbose_name_plural = "Opciones"
        ordering = ['letra']
    
    def __str__(self):
        return f"Opción {self.letra} - {self.pregunta}"
