from django.urls import path

from . import views


app_name = 'cuentas'

urlpatterns = [
    path('', views.home, name='home'),
    path('registro/', views.registro_estudiante, name='registro'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('verificacion/enviada/', views.verificacion_enviada, name='verificacion_enviada'),
    path('verificacion/reenviar/', views.reenviar_verificacion, name='reenviar_verificacion'),
    path('verificar/<str:token>/', views.verificar_email, name='verificar_email'),
    path('recuperar/', views.solicitar_recuperacion, name='solicitar_recuperacion'),
    path('recuperar/enviada/', views.recuperacion_enviada, name='recuperacion_enviada'),
    path('recuperar/<str:uidb64>/<str:token>/', views.confirmar_recuperacion, name='confirmar_recuperacion'),
    path('panel/', views.panel, name='panel'),
    path('perfil/', views.perfil_view, name='perfil'),
    path('admin/asignar/', views.asignar_administrador, name='asignar_administrador'),
]
