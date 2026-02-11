from django.urls import path
from . import views

app_name = 'suscripciones'

urlpatterns = [
    # Estudiante
    path('', views.suscripcion_estudiante, name='suscripcion_estudiante'),
    path('api/estado/', views.obtener_estado_suscripcion, name='obtener_estado'),
    path('api/verificar-suscripcion/', views.verificar_suscripcion_activa, name='verificar_suscripcion'),
    path('api/qr/', views.obtener_qr_pago, name='obtener_qr'),
    path('api/validar-perfil/', views.validar_perfil, name='validar_perfil'),
    path('api/crear/', views.crear_suscripcion, name='crear_suscripcion'),
    
    # Administrador - Verificación
    path('admin/verificacion/', views.panel_verificacion, name='panel_verificacion'),
    path('api/admin/pendientes/', views.listar_suscripciones_pendientes, name='listar_pendientes'),
    path('api/admin/todas/', views.listar_todas_suscripciones, name='listar_todas'),
    path('api/admin/<int:suscripcion_id>/aprobar/', views.aprobar_suscripcion, name='aprobar'),
    path('api/admin/<int:suscripcion_id>/rechazar/', views.rechazar_suscripcion, name='rechazar'),
    
    # Administrador - Configuración
    path('admin/configuracion/', views.configuracion_pago, name='configuracion_pago'),
    path('api/admin/configuracion/guardar/', views.guardar_configuracion_pago, name='guardar_configuracion'),
    path('api/admin/configuracion/obtener/', views.obtener_configuracion_pago, name='obtener_configuracion'),
]
