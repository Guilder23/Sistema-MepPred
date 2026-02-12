from django.urls import path
from . import views

app_name = 'temas'

urlpatterns = [
    # Vistas
    path('', views.lista_temas, name='lista'),
    
    # API - Rutas específicas primero
    path('api/materias/', views.obtener_materias, name='api_materias'),
    path('api/temas/crear/', views.crear_tema, name='api_crear'),
    path('api/temas/por-materia/<int:materia_id>/', views.obtener_temas_por_materia, name='api_temas_por_materia'),
    
    # API - Rutas genéricas después
    path('api/temas/', views.obtener_temas, name='api_obtener_todas'),
    path('api/temas/<int:tema_id>/', views.obtener_tema, name='api_obtener'),
    path('api/temas/<int:tema_id>/actualizar/', views.actualizar_tema, name='api_actualizar'),
    path('api/temas/<int:tema_id>/eliminar/', views.eliminar_tema, name='api_eliminar'),
    
    # API Estudiantes
    path('api/estudiante/temas/<int:tema_id>/', views.obtener_tema_estudiante, name='api_estudiante_obtener_tema'),
]
