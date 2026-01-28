from functools import wraps
from django.http import JsonResponse
from django.shortcuts import redirect
from .models import Suscripcion


def premium_required(view_func):
    """
    Decorador para verificar que el usuario tenga suscripción activa.
    Redirige a la página de suscripción si no tiene acceso premium.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Admins siempre tienen acceso
        if request.user.is_staff:
            return view_func(request, *args, **kwargs)
        
        # Verificar suscripción activa
        suscripcion = Suscripcion.objects.filter(
            estudiante=request.user,
            estado='APROBADO'
        ).first()
        
        if not suscripcion or not suscripcion.esta_activa():
            # Si es una petición AJAX, retornar JSON
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'error': 'Necesitas una suscripción activa para acceder a este contenido'
                }, status=403)
            
            # Si no, redirigir a suscripción
            return redirect('suscripciones:suscripcion_estudiante')
        
        return view_func(request, *args, **kwargs)
    
    return wrapper


def tiene_suscripcion_activa(user):
    """
    Helper para verificar si un usuario tiene suscripción activa.
    Puede usarse en templates o vistas.
    """
    if user.is_staff:
        return True
    
    suscripcion = Suscripcion.objects.filter(
        estudiante=user,
        estado='APROBADO'
    ).first()
    
    if suscripcion:
        return suscripcion.esta_activa()
    
    return False
