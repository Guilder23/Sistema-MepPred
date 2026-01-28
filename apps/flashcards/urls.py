from django.urls import path
from . import views

app_name = 'flashcards'

urlpatterns = [
    path('', views.flashcards_view, name='flashcards'),
    path('crear-mazo/', views.crear_mazo, name='crear_mazo'),
    path('responder/', views.responder_tarjeta, name='responder'),
    path('mazo/<int:mazo_id>/editar/', views.editar_mazo, name='editar_mazo'),
    path('mazo/<int:mazo_id>/eliminar/', views.eliminar_mazo, name='eliminar_mazo'),
    # API endpoints
    path('api/data/', views.api_get_data, name='api_data'),
    path('api/crear-mazo/', views.crear_mazo_api, name='crear_mazo_api'),
    path('api/eliminar-mazo/<int:mazo_id>/', views.eliminar_mazo_api, name='eliminar_mazo_api'),
    path('api/editar-mazo/<int:mazo_id>/', views.editar_mazo_api, name='editar_mazo_api'),
    path('api/crear-flashcard/', views.crear_flashcard_api, name='crear_flashcard_api'),
    path('api/editar-flashcard/<int:flashcard_id>/', views.editar_flashcard_api, name='editar_flashcard_api'),
    path('api/eliminar-flashcard/<int:flashcard_id>/', views.eliminar_flashcard_api, name='eliminar_flashcard_api'),
]

