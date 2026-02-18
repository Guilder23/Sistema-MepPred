from django.urls import path
from . import views

app_name = 'evaluaciones'

urlpatterns = [
    # Vista principal
    path('', views.lista_examenes, name='lista_examenes'),
    
    # Vistas para estudiantes
    path('disponibles/', views.examenes_disponibles, name='examenes_disponibles'),
    path('resolver/<int:examen_id>/', views.resolver_examen, name='resolver_examen'),
    
    # API endpoints (Admin)
    path('api/examenes/', views.obtener_examenes, name='obtener_examenes'),
    path('api/examenes/<int:examen_id>/', views.obtener_examen, name='obtener_examen'),
    path('api/examenes/crear/', views.crear_examen, name='crear_examen'),
    path('api/examenes/<int:examen_id>/actualizar/', views.actualizar_examen, name='actualizar_examen'),
    path('api/examenes/<int:examen_id>/eliminar/', views.eliminar_examen, name='eliminar_examen'),
    path('api/temas/', views.obtener_temas_select, name='obtener_temas_select'),
    
    # API endpoints (Estudiantes)
    path('api/estudiante/examen/<int:examen_id>/', views.obtener_examen_estudiante, name='obtener_examen_estudiante'),
    path('api/estudiante/examen/<int:examen_id>/calificar/', views.calificar_examen, name='calificar_examen'),
    

]
