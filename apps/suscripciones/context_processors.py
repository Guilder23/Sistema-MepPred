from .models import Suscripcion


def suscripcion_context(request):
    """
    Context processor para añadir información de suscripción a todos los templates.
    """
    context = {
        'tiene_suscripcion_premium': False,
        'suscripcion_activa': None
    }
    
    if request.user.is_authenticated:
        # Admins siempre tienen acceso premium
        if request.user.is_staff:
            context['tiene_suscripcion_premium'] = True
        else:
            # Verificar suscripción del estudiante
            suscripcion = Suscripcion.objects.filter(
                estudiante=request.user,
                estado='APROBADO'
            ).first()
            
            if suscripcion and suscripcion.esta_activa():
                context['tiene_suscripcion_premium'] = True
                context['suscripcion_activa'] = suscripcion
    
    return context
