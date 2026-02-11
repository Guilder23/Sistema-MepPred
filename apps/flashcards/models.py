from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from apps.materias_nueva.models import Materia

User = get_user_model()


class Mazo(models.Model):
    """Colección de flashcards organizadas por tema"""
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mazos_flashcards')
    materia = models.ForeignKey(Materia, on_delete=models.CASCADE, related_name='mazos_flashcards', null=True, blank=True, verbose_name="Materia")
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Mazo"
        verbose_name_plural = "Mazos"
    
    def __str__(self):
        return f"{self.nombre} ({self.usuario.username})"
    
    def contar_tarjetas(self):
        """Contar total de tarjetas en el mazo"""
        return self.tarjetas.count()
    
    def contar_vencidas(self):
        """Contar tarjetas vencidas para repaso"""
        ahora = timezone.now()
        return self.tarjetas.filter(proximo_repaso__lte=ahora).count()


class Flashcard(models.Model):
    """Tarjeta individual con pregunta y respuesta"""
    mazo = models.ForeignKey(Mazo, on_delete=models.CASCADE, related_name='tarjetas')
    pregunta = models.TextField()
    respuesta = models.TextField()
    categoria = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Propiedades de repetición espaciada (estilo Anki)
    proximo_repaso = models.DateTimeField(default=timezone.now)  # Cuándo estudiar nuevamente
    intervalo = models.IntegerField(default=0)  # Días hasta próximo repaso
    factor_facilidad = models.FloatField(default=2.5)  # Factor de facilidad (2.5 en Anki)
    repeticiones = models.IntegerField(default=0)  # Número de veces estudiada correctamente
    ultimo_repaso = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['proximo_repaso']
        verbose_name = "Flashcard"
        verbose_name_plural = "Flashcards"
    
    def __str__(self):
        return f"{self.pregunta[:50]}... ({self.mazo.nombre})"
    
    def esta_vencida(self):
        """Verificar si la tarjeta está vencida para repaso"""
        return timezone.now() >= self.proximo_repaso
    
    def dias_hasta_repaso(self):
        """Calcular días hasta próximo repaso"""
        diferencia = self.proximo_repaso - timezone.now()
        return (diferencia.total_seconds() / (24 * 3600))


class HistorialRepaso(models.Model):
    """Registro del historial de repasos"""
    DIFICULTAD_CHOICES = [
        (0, 'Otra vez (0-1 días)'),
        (1, 'Difícil (1-3 días)'),
        (2, 'Bien (3-7 días)'),
        (3, 'Fácil (7+ días)'),
    ]
    
    flashcard = models.ForeignKey(Flashcard, on_delete=models.CASCADE, related_name='historial')
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    dificultad = models.IntegerField(choices=DIFICULTAD_CHOICES)
    fecha_repaso = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-fecha_repaso']
        verbose_name = "Historial de Repaso"
        verbose_name_plural = "Historiales de Repaso"
    
    def __str__(self):
        return f"{self.usuario.username} - {self.flashcard.pregunta[:30]} ({self.get_dificultad_display()})"
