from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required, user_passes_test
from django.views.decorators.http import require_http_methods
from django.db import transaction
from django.utils import timezone
from django.core.files.storage import default_storage
import json

from .models import Suscripcion, ConfiguracionPago, HistorialSuscripcion


# ===== HELPERS =====

def es_administrador(user):
    return user.is_staff


def tiene_suscripcion_activa(user):
    """Verificar si el usuario tiene suscripción activa"""
    if user.is_staff:
        return True  # Admins siempre tienen acceso
    
    suscripcion = Suscripcion.objects.filter(
        estudiante=user,
        estado='APROBADO'
    ).first()
    
    if suscripcion:
        return suscripcion.esta_activa()
    
    return False


def validar_datos_perfil_completos(user):
    """
    Validar si el usuario tiene todos los datos requeridos en su perfil
    Retorna: (es_valido: bool, campos_faltantes: list)
    """
    campos_faltantes = []
    
    # Campos requeridos en el perfil del estudiante
    if not user.first_name or not user.first_name.strip():
        campos_faltantes.append('Nombre')
    
    if not user.last_name or not user.last_name.strip():
        campos_faltantes.append('Apellido')
    
    if not user.identity_number or not user.identity_number.strip():
        campos_faltantes.append('Carnet de Identidad (CI)')
    
    if not user.phone_number or not user.phone_number.strip():
        campos_faltantes.append('Teléfono')
    
    if not user.birth_date:
        campos_faltantes.append('Fecha de Nacimiento')
    
    if not user.nationality or not user.nationality.strip():
        campos_faltantes.append('Nacionalidad')
    
    return len(campos_faltantes) == 0, campos_faltantes


# ===== VISTAS ESTUDIANTE =====

@login_required
@require_http_methods(["GET"])
def suscripcion_estudiante(request):
    """Vista principal de suscripción para estudiantes"""
    return render(request, 'suscripciones/estudiante/suscripcion.html')


@login_required
@require_http_methods(["GET"])
def obtener_estado_suscripcion(request):
    """API: Obtener estado actual de la suscripción del estudiante"""
    try:
        # Buscar suscripción más reciente
        suscripcion = Suscripcion.objects.filter(
            estudiante=request.user
        ).first()
        
        if not suscripcion:
            return JsonResponse({
                'tiene_suscripcion': False,
                'puede_suscribirse': True
            })
        
        # Verificar si está activa
        activa = suscripcion.esta_activa()
        
        data = {
            'tiene_suscripcion': True,
            'estado': suscripcion.estado,
            'activa': activa,
            'fecha_solicitud': suscripcion.fecha_solicitud.isoformat(),
            'puede_suscribirse': suscripcion.estado in ['RECHAZADO', 'VENCIDO']
        }
        
        if suscripcion.estado == 'APROBADO' and activa:
            data['fecha_vencimiento'] = suscripcion.fecha_vencimiento.isoformat()
            data['dias_restantes'] = suscripcion.dias_restantes()
        
        if suscripcion.estado == 'RECHAZADO':
            data['motivo_rechazo'] = suscripcion.motivo_rechazo
        
        return JsonResponse(data)
        
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=500)


@login_required
@require_http_methods(["GET"])
def verificar_suscripcion_activa(request):
    """API: Verificar si el usuario tiene suscripción activa - endpoint simple"""
    try:
        tiene_suscripcion = tiene_suscripcion_activa(request.user)
        
        return JsonResponse({
            'tiene_suscripcion': tiene_suscripcion,
            'es_admin': request.user.is_staff
        })
        
    except Exception as e:
        return JsonResponse({
            'error': str(e),
            'tiene_suscripcion': False
        }, status=500)


@login_required
@require_http_methods(["GET"])
def obtener_qr_pago(request):
    """API: Obtener QR de pago del administrador"""
    try:
        config = ConfiguracionPago.objects.first()
        
        if not config:
            return JsonResponse({
                'error': 'No hay configuración de pago disponible'
            }, status=404)
        
        return JsonResponse({
            'qr_url': config.qr_pago.url,
            'descripcion': config.descripcion
        })
        
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=500)


@login_required
@require_http_methods(["GET"])
def validar_perfil(request):
    """API: Validar si el perfil del estudiante tiene todos los datos requeridos"""
    try:
        es_valido, campos_faltantes = validar_datos_perfil_completos(request.user)
        
        return JsonResponse({
            'perfil_valido': es_valido,
            'campos_faltantes': campos_faltantes
        })
        
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=500)


@login_required
@require_http_methods(["POST"])
def crear_suscripcion(request):
    """API: Crear nueva solicitud de suscripción con comprobante"""
    try:
        # Primero validar que el perfil está completo
        es_valido, campos_faltantes = validar_datos_perfil_completos(request.user)
        
        if not es_valido:
            return JsonResponse({
                'error': 'Primero debe llenar todos los datos en su perfil',
                'campos_faltantes': campos_faltantes,
                'tipo_error': 'perfil_incompleto'
            }, status=400)
        
        # Verificar si ya tiene suscripción pendiente o activa
        suscripcion_existente = Suscripcion.objects.filter(
            estudiante=request.user,
            estado__in=['PENDIENTE', 'APROBADO']
        ).first()
        
        if suscripcion_existente:
            return JsonResponse({
                'error': 'Ya tienes una suscripción pendiente o activa'
            }, status=400)
        
        # Verificar que se envió un comprobante
        if 'comprobante' not in request.FILES:
            return JsonResponse({
                'error': 'Debes enviar el comprobante de pago'
            }, status=400)
        
        # Crear suscripción
        with transaction.atomic():
            suscripcion = Suscripcion.objects.create(
                estudiante=request.user,
                comprobante=request.FILES['comprobante'],
                estado='PENDIENTE'
            )
            
            # Registrar en historial
            HistorialSuscripcion.objects.create(
                suscripcion=suscripcion,
                estado_anterior='',
                estado_nuevo='PENDIENTE',
                modificado_por=request.user,
                observaciones='Solicitud creada'
            )
        
        return JsonResponse({
            'mensaje': 'Suscripción enviada. Espera la confirmación del administrador.',
            'id': suscripcion.id
        })
        
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=500)


# ===== VISTAS ADMINISTRADOR =====

@login_required
@user_passes_test(es_administrador)
@require_http_methods(["GET"])
def panel_verificacion(request):
    """Vista del panel de verificación de pagos para administradores"""
    return render(request, 'suscripciones/admin/verificacion.html')


@login_required
@user_passes_test(es_administrador)
@require_http_methods(["GET"])
def listar_suscripciones_pendientes(request):
    """API: Listar suscripciones pendientes de aprobación"""
    try:
        suscripciones = Suscripcion.objects.filter(
            estado='PENDIENTE'
        ).select_related('estudiante')
        
        data = [{
            'id': s.id,
            'estudiante': {
                'id': s.estudiante.id,
                'nombre': s.estudiante.get_full_name() or s.estudiante.username,
                'email': s.estudiante.email
            },
            'fecha_solicitud': s.fecha_solicitud.isoformat(),
            'comprobante_url': s.comprobante.url
        } for s in suscripciones]
        
        return JsonResponse(data, safe=False)
        
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=500)


@login_required
@user_passes_test(es_administrador)
@require_http_methods(["GET"])
def listar_todas_suscripciones(request):
    """API: Listar todas las suscripciones con filtros"""
    try:
        estado = request.GET.get('estado', '')
        
        suscripciones = Suscripcion.objects.select_related(
            'estudiante', 'aprobado_por'
        ).all()
        
        if estado:
            suscripciones = suscripciones.filter(estado=estado)
        
        data = [{
            'id': s.id,
            'estudiante': {
                'id': s.estudiante.id,
                'nombre': s.estudiante.get_full_name() or s.estudiante.username,
                'email': s.estudiante.email
            },
            'estado': s.estado,
            'fecha_solicitud': s.fecha_solicitud.isoformat(),
            'fecha_aprobacion': s.fecha_aprobacion.isoformat() if s.fecha_aprobacion else None,
            'fecha_vencimiento': s.fecha_vencimiento.isoformat() if s.fecha_vencimiento else None,
            'comprobante_url': s.comprobante.url,
            'aprobado_por': s.aprobado_por.get_full_name() if s.aprobado_por else None,
            'motivo_rechazo': s.motivo_rechazo,
            'dias_restantes': s.dias_restantes() if s.estado == 'APROBADO' else 0
        } for s in suscripciones]
        
        return JsonResponse(data, safe=False)
        
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=500)


@login_required
@user_passes_test(es_administrador)
@require_http_methods(["POST"])
def aprobar_suscripcion(request, suscripcion_id):
    """API: Aprobar una suscripción"""
    try:
        suscripcion = get_object_or_404(Suscripcion, id=suscripcion_id)
        
        if suscripcion.estado != 'PENDIENTE':
            return JsonResponse({
                'error': 'Solo se pueden aprobar suscripciones pendientes'
            }, status=400)
        
        with transaction.atomic():
            estado_anterior = suscripcion.estado
            
            # Aprobar la suscripción
            suscripcion.aprobar(request.user)
            
            # Registrar en historial
            HistorialSuscripcion.objects.create(
                suscripcion=suscripcion,
                estado_anterior=estado_anterior,
                estado_nuevo='APROBADO',
                modificado_por=request.user,
                observaciones='Suscripción aprobada'
            )
        
        return JsonResponse({
            'mensaje': 'Suscripción aprobada exitosamente',
            'fecha_vencimiento': suscripcion.fecha_vencimiento.isoformat()
        })
        
    except Suscripcion.DoesNotExist:
        return JsonResponse({
            'error': 'Suscripción no encontrada'
        }, status=404)
    except Exception as e:
        import traceback
        print(f"Error al aprobar suscripción: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'error': f'Error al aprobar: {str(e)}'
        }, status=500)


@login_required
@user_passes_test(es_administrador)
@require_http_methods(["POST"])
def rechazar_suscripcion(request, suscripcion_id):
    """API: Rechazar una suscripción"""
    try:
        data = json.loads(request.body)
        motivo = data.get('motivo', '')
        
        suscripcion = get_object_or_404(Suscripcion, id=suscripcion_id)
        
        if suscripcion.estado != 'PENDIENTE':
            return JsonResponse({
                'error': 'Solo se pueden rechazar suscripciones pendientes'
            }, status=400)
        
        with transaction.atomic():
            estado_anterior = suscripcion.estado
            suscripcion.rechazar(request.user, motivo)
            
            # Registrar en historial
            HistorialSuscripcion.objects.create(
                suscripcion=suscripcion,
                estado_anterior=estado_anterior,
                estado_nuevo='RECHAZADO',
                modificado_por=request.user,
                observaciones=f'Rechazado: {motivo}'
            )
        
        return JsonResponse({
            'mensaje': 'Suscripción rechazada'
        })
        
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=500)


@login_required
@user_passes_test(es_administrador)
@require_http_methods(["GET"])
def configuracion_pago(request):
    """Vista de configuración del QR de pago"""
    return render(request, 'suscripciones/admin/configuracion.html')


@login_required
@user_passes_test(es_administrador)
@require_http_methods(["POST"])
def guardar_configuracion_pago(request):
    """API: Guardar/actualizar configuración de pago"""
    try:
        if 'qr_pago' not in request.FILES:
            return JsonResponse({
                'error': 'Debes enviar la imagen del QR'
            }, status=400)
        
        descripcion = request.POST.get('descripcion', '')
        
        # Obtener o crear configuración
        config, created = ConfiguracionPago.objects.get_or_create(
            administrador=request.user,
            defaults={
                'qr_pago': request.FILES['qr_pago'],
                'descripcion': descripcion
            }
        )
        
        if not created:
            # Actualizar existente
            config.qr_pago = request.FILES['qr_pago']
            config.descripcion = descripcion
            config.save()
        
        return JsonResponse({
            'mensaje': 'Configuración guardada exitosamente',
            'qr_url': config.qr_pago.url
        })
        
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=500)


@login_required
@user_passes_test(es_administrador)
@require_http_methods(["GET"])
def obtener_configuracion_pago(request):
    """API: Obtener configuración actual"""
    try:
        config = ConfiguracionPago.objects.filter(
            administrador=request.user
        ).first()
        
        if not config:
            return JsonResponse({
                'tiene_configuracion': False
            })
        
        return JsonResponse({
            'tiene_configuracion': True,
            'qr_url': config.qr_pago.url,
            'descripcion': config.descripcion,
            'actualizado_en': config.actualizado_en.isoformat()
        })
        
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=500)
