from django.urls import path
from . import views

app_name = 'flashcards_premium'

urlpatterns = [
    # URL principal
    path('', views.dashboard, name='dashboard'),
    
    # Vista de estudio para estudiantes
    path('estudiar/', views.modo_estudio, name='modo_estudio'),
    
    # URLs API para Mazos (Admin)
    path('api/mazos/', views.api_listar_mazos, name='api_listar_mazos'),
    path('api/mazos/crear/', views.api_crear_mazo, name='api_crear_mazo'),
    path('api/mazos/<int:mazo_id>/editar/', views.api_editar_mazo, name='api_editar_mazo'),
    path('api/mazos/<int:mazo_id>/eliminar/', views.api_eliminar_mazo, name='api_eliminar_mazo'),
    
    # URLs API para Estudiantes
    path('api/estudiante/mazos/', views.api_mazos_estudiante, name='api_mazos_estudiante'),
    path('api/estudiante/temas/', views.api_temas_flashcards, name='api_temas_flashcards'),
    
    # URLs API para Flashcards
    path('api/flashcards/crear/', views.api_crear_flashcard, name='api_crear_flashcard'),
    path('api/flashcards/<int:flashcard_id>/editar/', views.api_editar_flashcard, name='api_editar_flashcard'),
    path('api/flashcards/<int:flashcard_id>/eliminar/', views.api_eliminar_flashcard, name='api_eliminar_flashcard'),
    path('api/flashcards/marcar-respuesta/', views.api_marcar_respuesta, name='api_marcar_respuesta'),
    
    # URLs para vistas de template (admin)
    path('mazos/', views.lista_mazos_premium, name='lista_mazos_premium'),
    path('flashcards/', views.lista_flashcards_premium, name='lista_flashcards_premium'),
]
