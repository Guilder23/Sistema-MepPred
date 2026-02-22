from django.urls import path
from . import views

app_name = 'materias'

urlpatterns = [
    # Vistas
    path('', views.lista_materias, name='lista'),
    
    # API Admin
    path('api/materias/', views.obtener_materias, name='api_obtener_todas'),
    path('api/materias/<int:materia_id>/', views.obtener_materia, name='api_obtener'),
    path('api/materias/crear/', views.crear_materia, name='api_crear'),
    path('api/materias/<int:materia_id>/actualizar/', views.actualizar_materia, name='api_actualizar'),
    path('api/materias/<int:materia_id>/eliminar/', views.eliminar_materia, name='api_eliminar'),
    path('api/materias-y-temas/', views.obtener_materias_y_temas, name='api_materias_y_temas'),
    
    # API Estudiantes
    path('api/estudiante/materias/', views.listar_materias_estudiante, name='api_estudiante_listar'),
    path('api/estudiante/materias/<int:materia_id>/', views.obtener_materia_estudiante, name='api_estudiante_obtener'),
]
