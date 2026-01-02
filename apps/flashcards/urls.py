from django.urls import path
from . import views

app_name = 'flashcards'

urlpatterns = [
    path('', views.flashcards_view, name='flashcards'),
    path('crear/', views.crear_flashcard, name='crear_flashcard'),
    path('crear-mazo/', views.crear_mazo, name='crear_mazo'),
    path('responder/', views.responder_tarjeta, name='responder'),
    path('mazo/<int:mazo_id>/editar/', views.editar_mazo, name='editar_mazo'),
    path('mazo/<int:mazo_id>/eliminar/', views.eliminar_mazo, name='eliminar_mazo'),
]
