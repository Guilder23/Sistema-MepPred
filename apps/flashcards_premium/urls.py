from django.urls import path
from . import views

app_name = 'flashcards_premium'

urlpatterns = [
    # URL principal
    path('', views.dashboard, name='dashboard'),
    
    # URLs API para Mazos
    path('api/mazos/', views.api_listar_mazos, name='api_listar_mazos'),
    path('api/mazos/crear/', views.api_crear_mazo, name='api_crear_mazo'),
    path('api/mazos/<int:mazo_id>/editar/', views.api_editar_mazo, name='api_editar_mazo'),
    path('api/mazos/<int:mazo_id>/eliminar/', views.api_eliminar_mazo, name='api_eliminar_mazo'),
    
    # URLs API para Flashcards
    path('api/flashcards/crear/', views.api_crear_flashcard, name='api_crear_flashcard'),
    path('api/flashcards/<int:flashcard_id>/editar/', views.api_editar_flashcard, name='api_editar_flashcard'),
    path('api/flashcards/<int:flashcard_id>/eliminar/', views.api_eliminar_flashcard, name='api_eliminar_flashcard'),
    
    # URLs para vistas de template
    path('mazos/', views.lista_mazos_premium, name='lista_mazos_premium'),
    path('flashcards/', views.lista_flashcards_premium, name='lista_flashcards_premium'),
]
