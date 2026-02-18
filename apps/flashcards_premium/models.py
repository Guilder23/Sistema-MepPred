from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone
from apps.temas.models import Tema

User = get_user_model()


class MazoPremium(models.Model):
    creado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mazos_premium_creados'
    )
    tema = models.ForeignKey(Tema, on_delete=models.CASCADE, related_name='mazos_premium', null=True, blank=True, verbose_name="Tema")
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Mazo Premium'
        verbose_name_plural = 'Mazos Premium'

    def __str__(self) -> str:
        return self.nombre

    def contar_tarjetas(self) -> int:
        return self.tarjetas.count()


class FlashcardPremium(models.Model):
    mazo = models.ForeignKey(MazoPremium, on_delete=models.CASCADE, related_name='tarjetas')
    pregunta = models.TextField()
    respuesta = models.TextField()
    categoria = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Propiedades de repetición espaciada (paridad con flashcards regulares)
    proximo_repaso = models.DateTimeField(default=timezone.now)
    intervalo = models.IntegerField(default=0)
    factor_facilidad = models.FloatField(default=2.5)
    repeticiones = models.IntegerField(default=0)
    ultimo_repaso = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['proximo_repaso']
        verbose_name = 'Flashcard Premium'
        verbose_name_plural = 'Flashcards Premium'

    def __str__(self) -> str:
        return f"{self.pregunta[:50]}... ({self.mazo.nombre})"
