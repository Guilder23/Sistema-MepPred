from django.urls import path
from . import views

app_name = 'temas'

urlpatterns = [
    # Vistas
    path('', views.lista_temas, name='lista'),
    
    # API - Rutas específicas primero
    path('api/temas/crear/', views.crear_tema, name='api_crear'),
    
    # API - Rutas genéricas después
    path('api/temas/', views.obtener_temas, name='api_obtener_todas'),
    path('api/temas/<int:tema_id>/', views.obtener_tema, name='api_obtener'),
    path('api/temas/<int:tema_id>/actualizar/', views.actualizar_tema, name='api_actualizar'),
    path('api/temas/<int:tema_id>/eliminar/', views.eliminar_tema, name='api_eliminar'),
]
