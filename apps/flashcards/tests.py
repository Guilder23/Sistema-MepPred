# Test para flashcards
from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import Mazo, Flashcard

User = get_user_model()


class FlashcardTest(TestCase):
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='student'
        )
        
        self.mazo = Mazo.objects.create(
            usuario=self.user,
            nombre='Test Mazo',
            descripcion='Mazo de prueba'
        )
    
    def test_crear_tarjeta(self):
        tarjeta = Flashcard.objects.create(
            mazo=self.mazo,
            pregunta='¿Qué es Django?',
            respuesta='Django es un framework web',
            categoria='Programación'
        )
        
        self.assertEqual(tarjeta.pregunta, '¿Qué es Django?')
        self.assertTrue(tarjeta.esta_vencida())
    
    def test_contar_tarjetas_mazo(self):
        Flashcard.objects.create(
            mazo=self.mazo,
            pregunta='Pregunta 1',
            respuesta='Respuesta 1'
        )
        Flashcard.objects.create(
            mazo=self.mazo,
            pregunta='Pregunta 2',
            respuesta='Respuesta 2'
        )
        
        self.assertEqual(self.mazo.contar_tarjetas(), 2)
