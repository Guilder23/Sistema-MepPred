from django.urls import path
from . import views

app_name = 'ranking'

urlpatterns = [
    path('', views.ranking_estudiantes, name='ranking'),
    path('mi-posicion/', views.mi_posicion, name='mi_posicion'),
    path('api/filtros/', views.api_filtros_ranking, name='api_filtros'),
]
