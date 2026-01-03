from django.urls import path
from . import views

app_name = 'contenido'

urlpatterns = [
    # Administración
    path('admin/contenidos/', views.gestion_contenidos, name='gestion_contenidos'),
    
    # Biblioteca pública (para usuarios logueados)
    path('biblioteca/', views.biblioteca_contenidos, name='biblioteca_contenidos'),
    
    # APIs
    path('api/contenidos/listar/', views.listar_contenidos, name='listar_contenidos'),
    path('api/publicados/', views.listar_contenidos_publicados, name='listar_contenidos_publicados'),
    path('api/contenidos/<int:contenido_id>/', views.obtener_contenido, name='obtener_contenido'),
    path('api/contenidos/crear/', views.crear_contenido, name='crear_contenido'),
    path('api/contenidos/editar/', views.editar_contenido, name='editar_contenido'),
    path('api/contenidos/<int:contenido_id>/eliminar/', views.eliminar_contenido, name='eliminar_contenido'),
]
