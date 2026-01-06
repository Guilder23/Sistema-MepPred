from django.urls import path
from . import views

app_name = 'evaluaciones'

urlpatterns = [
    # Vista principal
    path('', views.lista_examenes, name='lista_examenes'),
    
    # Vista para estudiantes
    path('disponibles/', views.examenes_disponibles, name='examenes_disponibles'),
    
    # API endpoints
    path('api/examenes/', views.obtener_examenes, name='obtener_examenes'),
    path('api/examenes/<int:examen_id>/', views.obtener_examen, name='obtener_examen'),
    path('api/examenes/crear/', views.crear_examen, name='crear_examen'),
    path('api/examenes/<int:examen_id>/actualizar/', views.actualizar_examen, name='actualizar_examen'),
    path('api/examenes/<int:examen_id>/eliminar/', views.eliminar_examen, name='eliminar_examen'),
    path('api/materias/', views.obtener_materias_select, name='obtener_materias_select'),
]
