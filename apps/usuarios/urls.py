from django.urls import path
from . import views

app_name = 'usuarios'

urlpatterns = [
    # Vistas principales
    path('', views.gestion_usuarios, name='gestion'),
    
    # APIs
    path('api/listar/', views.listar_usuarios, name='api_listar'),
    path('api/obtener/<int:usuario_id>/', views.obtener_usuario, name='api_obtener'),
    path('api/crear/', views.crear_usuario, name='api_crear'),
    path('api/editar/', views.editar_usuario, name='api_editar'),
    path('api/toggle-estado/<int:usuario_id>/', views.toggle_estado_usuario, name='api_toggle_estado'),
    path('api/eliminar/<int:usuario_id>/', views.eliminar_usuario, name='api_eliminar'),
]
