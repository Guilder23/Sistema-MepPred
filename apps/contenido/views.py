from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.db.models import Q, Count, Case, When
from django.db import transaction
from django.utils import timezone
import json

from .models import Contenido, VideoContenido, ProgresoContenido


@login_required
def gestion_contenidos(request):
    """Vista principal de gestión de contenidos"""
    # Solo administradores pueden acceder
    if not (request.user.is_superuser or getattr(request.user, 'role', '') == 'admin'):
        return render(request, '404.html', status=403)
    
    # Obtener parámetros de búsqueda y filtros
    busqueda = request.GET.get('busqueda', '')
    estado = request.GET.get('estado', '')
    publicacion = request.GET.get('publicacion', '')
    
    # Filtrar contenidos
    contenidos = Contenido.objects.all()
    
    if busqueda:
        contenidos = contenidos.filter(
            Q(titulo__icontains=busqueda) |
            Q(materia__icontains=busqueda) |
            Q(descripcion__icontains=busqueda)
        )
    
    if estado:
        contenidos = contenidos.filter(estado=estado)
    
    if publicacion:
        contenidos = contenidos.filter(publicacion=publicacion)
    
    context = {
        'contenidos': contenidos,
        'busqueda': busqueda,
        'estado': estado,
        'publicacion': publicacion,
    }
    
    return render(request, 'contenido/contenidos.html', context)


@login_required
@require_http_methods(["GET"])
def listar_contenidos(request):
    """API para listar contenidos con búsqueda y filtro"""
    if not (request.user.is_superuser or getattr(request.user, 'role', '') == 'admin'):
        return JsonResponse({'error': 'No tienes permisos'}, status=403)
    
    busqueda = request.GET.get('busqueda', '')
    estado = request.GET.get('estado', '')
    publicacion = request.GET.get('publicacion', '')
    
    contenidos = Contenido.objects.all()
    
    if busqueda:
        contenidos = contenidos.filter(
            Q(titulo__icontains=busqueda) |
            Q(materia__icontains=busqueda) |
            Q(descripcion__icontains=busqueda)
        )
    
    if estado:
        contenidos = contenidos.filter(estado=estado)
    
    if publicacion:
        contenidos = contenidos.filter(publicacion=publicacion)
    
    contenidos_data = []
    for contenido in contenidos:
        contenidos_data.append({
            'id': contenido.id,
            'titulo': contenido.titulo,
            'materia': contenido.materia,
            'nivel_curso': contenido.nivel_curso,
            'estado': contenido.estado,
            'publicacion': contenido.publicacion,
            'fecha_creacion': contenido.fecha_creacion.strftime('%d/%m/%Y %H:%M'),
            'fecha_edicion': contenido.fecha_edicion.strftime('%d/%m/%Y %H:%M'),
        })
    
    return JsonResponse(contenidos_data, safe=False)


@login_required
@require_http_methods(["GET"])
def obtener_contenido(request, contenido_id):
    """API para obtener información de un contenido"""
    try:
        contenido = Contenido.objects.get(id=contenido_id)
        
        # Los estudiantes solo pueden ver contenidos publicados y activos
        es_admin = request.user.is_superuser or getattr(request.user, 'role', '') == 'admin'
        if not es_admin:
            if contenido.estado != 'activo' or contenido.publicacion != 'publicado':
                return JsonResponse({'error': 'No tienes permisos para ver este contenido'}, status=403)
        
        videos = list(contenido.videos.all().values('id', 'enlace', 'orden'))
    except Contenido.DoesNotExist:
        return JsonResponse({'error': 'Contenido no encontrado'}, status=404)
    
    # Obtener nombre del creador
    creado_por_nombre = 'N/A'
    if contenido.creado_por:
        full_name = contenido.creado_por.get_full_name()
        creado_por_nombre = full_name if full_name.strip() else contenido.creado_por.username
    
    # Obtener nombre del editor
    editado_por_nombre = 'N/A'
    if contenido.editado_por:
        full_name = contenido.editado_por.get_full_name()
        editado_por_nombre = full_name if full_name.strip() else contenido.editado_por.username
    
    return JsonResponse({
        'id': contenido.id,
        'titulo': contenido.titulo,
        'descripcion': contenido.descripcion,
        'contenido_tema': contenido.contenido_tema,
        'materia': contenido.materia,
        'nivel_curso': contenido.nivel_curso,
        'estado': contenido.estado,
        'publicacion': contenido.publicacion,
        'fecha_creacion': contenido.fecha_creacion.strftime('%d/%m/%Y %H:%M'),
        'fecha_edicion': contenido.fecha_edicion.strftime('%d/%m/%Y %H:%M'),
        'creado_por': creado_por_nombre,
        'editado_por': editado_por_nombre,
        'videos': videos,
    })


@login_required
@require_http_methods(["POST"])
def crear_contenido(request):
    """API para crear un nuevo contenido"""
    if not (request.user.is_superuser or getattr(request.user, 'role', '') == 'admin'):
        return JsonResponse({'error': 'No tienes permisos'}, status=403)
    
    try:
        titulo = request.POST.get('titulo', '').strip()
        descripcion = request.POST.get('descripcion', '').strip()
        contenido_tema = request.POST.get('contenido_tema', '').strip()
        materia = request.POST.get('materia', '').strip()
        nivel_curso = request.POST.get('nivel_curso', '').strip()
        estado = request.POST.get('estado', 'activo')
        publicacion = request.POST.get('publicacion', 'no_publicado')
        
        # Obtener videos (pueden venir múltiples)
        videos_enlaces = request.POST.getlist('videos[]')
        
        # Validaciones
        if not all([titulo, descripcion, contenido_tema, materia, nivel_curso]):
            return JsonResponse({'success': False, 'error': 'Todos los campos son requeridos'})
        
        # Crear contenido con transacción
        with transaction.atomic():
            contenido = Contenido.objects.create(
                titulo=titulo,
                descripcion=descripcion,
                contenido_tema=contenido_tema,
                materia=materia,
                nivel_curso=nivel_curso,
                estado=estado,
                publicacion=publicacion,
                creado_por=request.user
            )
            
            # Crear videos
            for idx, enlace in enumerate(videos_enlaces):
                if enlace.strip():
                    VideoContenido.objects.create(
                        contenido=contenido,
                        enlace=enlace.strip(),
                        orden=idx
                    )
        
        return JsonResponse({'success': True, 'message': 'Contenido creado exitosamente'})
    
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@login_required
@require_http_methods(["POST"])
def editar_contenido(request):
    """API para editar un contenido"""
    if not (request.user.is_superuser or getattr(request.user, 'role', '') == 'admin'):
        return JsonResponse({'error': 'No tienes permisos'}, status=403)
    
    try:
        contenido_id = request.POST.get('contenido_id')
        titulo = request.POST.get('titulo', '').strip()
        descripcion = request.POST.get('descripcion', '').strip()
        contenido_tema = request.POST.get('contenido_tema', '').strip()
        materia = request.POST.get('materia', '').strip()
        nivel_curso = request.POST.get('nivel_curso', '').strip()
        estado = request.POST.get('estado', 'activo')
        publicacion = request.POST.get('publicacion', 'no_publicado')
        
        # Obtener videos
        videos_enlaces = request.POST.getlist('videos[]')
        
        contenido = Contenido.objects.get(id=contenido_id)
        
        # Actualizar contenido con transacción
        with transaction.atomic():
            contenido.titulo = titulo
            contenido.descripcion = descripcion
            contenido.contenido_tema = contenido_tema
            contenido.materia = materia
            contenido.nivel_curso = nivel_curso
            contenido.estado = estado
            contenido.publicacion = publicacion
            contenido.editado_por = request.user
            contenido.save()
            
            # Eliminar videos antiguos y crear nuevos
            contenido.videos.all().delete()
            for idx, enlace in enumerate(videos_enlaces):
                if enlace.strip():
                    VideoContenido.objects.create(
                        contenido=contenido,
                        enlace=enlace.strip(),
                        orden=idx
                    )
        
        return JsonResponse({'success': True, 'message': 'Contenido actualizado exitosamente'})
    
    except Contenido.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Contenido no encontrado'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@login_required
@require_http_methods(["DELETE"])
def eliminar_contenido(request, contenido_id):
    """API para eliminar un contenido"""
    if not (request.user.is_superuser or getattr(request.user, 'role', '') == 'admin'):
        return JsonResponse({'error': 'No tienes permisos'}, status=403)
    
    try:
        contenido = Contenido.objects.get(id=contenido_id)
        contenido.delete()
        return JsonResponse({'success': True, 'message': 'Contenido eliminado exitosamente'})
    
    except Contenido.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Contenido no encontrado'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@login_required
def biblioteca_contenidos(request):
    """Vista de biblioteca de contenidos para estudiantes y administradores"""
    return render(request, 'contenido/biblioteca.html')


@login_required
@require_http_methods(["GET"])
def listar_contenidos_publicados(request):
    """API para listar solo contenidos publicados y activos"""
    # Filtrar solo contenidos publicados y activos
    contenidos = Contenido.objects.filter(
        estado='activo',
        publicacion='publicado'
    ).order_by('orden', '-fecha_creacion')
    
    es_admin = request.user.is_superuser or getattr(request.user, 'role', '') == 'admin'
    
    contenidos_data = []
    for contenido in contenidos:
        # Verificar si está disponible para el estudiante
        esta_disponible = contenido.esta_disponible_para(request.user)
        
        # Verificar progreso
        try:
            progreso = ProgresoContenido.objects.get(usuario=request.user, contenido=contenido)
            completado = progreso.completado
            porcentaje = progreso.porcentaje_avance
        except ProgresoContenido.DoesNotExist:
            completado = False
            porcentaje = 0
        
        contenidos_data.append({
            'id': contenido.id,
            'titulo': contenido.titulo,
            'descripcion': contenido.descripcion,
            'materia': contenido.materia,
            'nivel_curso': contenido.nivel_curso,
            'fecha_creacion': contenido.fecha_creacion.isoformat(),
            'orden': contenido.orden,
            'esta_disponible': esta_disponible,
            'completado': completado,
            'porcentaje_avance': porcentaje,
            'tiene_prerequisito': contenido.prerequisito is not None,
            'prerequisito_titulo': contenido.prerequisito.titulo if contenido.prerequisito else None,
        })
    
    return JsonResponse(contenidos_data, safe=False)


@login_required
def vista_progreso(request):
    """Vista de progreso del estudiante"""
    return render(request, 'contenido/progreso.html')


@login_required
@require_http_methods(["GET"])
def obtener_progreso_usuario(request):
    """API para obtener el progreso completo del usuario"""
    # Obtener todos los contenidos publicados
    contenidos = Contenido.objects.filter(
        estado='activo',
        publicacion='publicado'
    ).order_by('materia', 'orden')
    
    # Obtener progresos del usuario
    progresos = ProgresoContenido.objects.filter(usuario=request.user)
    progresos_dict = {p.contenido_id: p for p in progresos}
    
    # Agrupar por materia
    materias_data = {}
    for contenido in contenidos:
        if contenido.materia not in materias_data:
            materias_data[contenido.materia] = {
                'materia': contenido.materia,
                'contenidos': [],
                'total': 0,
                'completados': 0,
                'porcentaje': 0
            }
        
        progreso = progresos_dict.get(contenido.id)
        completado = progreso.completado if progreso else False
        porcentaje_avance = progreso.porcentaje_avance if progreso else 0
        esta_disponible = contenido.esta_disponible_para(request.user)
        
        materias_data[contenido.materia]['contenidos'].append({
            'id': contenido.id,
            'titulo': contenido.titulo,
            'descripcion': contenido.descripcion,
            'orden': contenido.orden,
            'completado': completado,
            'porcentaje_avance': porcentaje_avance,
            'esta_disponible': esta_disponible,
            'tiene_prerequisito': contenido.prerequisito is not None,
            'prerequisito_titulo': contenido.prerequisito.titulo if contenido.prerequisito else None,
        })
        
        materias_data[contenido.materia]['total'] += 1
        if completado:
            materias_data[contenido.materia]['completados'] += 1
    
    # Calcular porcentajes
    for materia_data in materias_data.values():
        if materia_data['total'] > 0:
            materia_data['porcentaje'] = round((materia_data['completados'] / materia_data['total']) * 100)
    
    # Calcular progreso general
    total_contenidos = sum(m['total'] for m in materias_data.values())
    total_completados = sum(m['completados'] for m in materias_data.values())
    porcentaje_general = round((total_completados / total_contenidos) * 100) if total_contenidos > 0 else 0
    
    return JsonResponse({
        'materias': list(materias_data.values()),
        'estadisticas': {
            'total_contenidos': total_contenidos,
            'completados': total_completados,
            'pendientes': total_contenidos - total_completados,
            'porcentaje_general': porcentaje_general
        }
    })


@login_required
@require_http_methods(["POST"])
def marcar_contenido_completado(request, contenido_id):
    """API para marcar un contenido como completado"""
    try:
        contenido = Contenido.objects.get(id=contenido_id)
        
        # Verificar que el contenido esté disponible
        if not contenido.esta_disponible_para(request.user):
            return JsonResponse({
                'success': False, 
                'error': 'Este contenido no está disponible aún. Debes completar el contenido anterior primero.'
            }, status=403)
        
        # Crear o actualizar progreso
        progreso, created = ProgresoContenido.objects.get_or_create(
            usuario=request.user,
            contenido=contenido,
            defaults={
                'completado': True,
                'porcentaje_avance': 100,
                'fecha_completado': timezone.now()
            }
        )
        
        if not created:
            progreso.completado = True
            progreso.porcentaje_avance = 100
            progreso.fecha_completado = timezone.now()
            progreso.save()
        
        return JsonResponse({
            'success': True,
            'message': '¡Contenido completado! Sigue avanzando.',
            'siguiente_disponible': _obtener_siguiente_contenido(request.user, contenido)
        })
    
    except Contenido.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Contenido no encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@login_required
@require_http_methods(["POST"])
def desmarcar_contenido_completado(request, contenido_id):
    """API para desmarcar un contenido como completado"""
    try:
        progreso = ProgresoContenido.objects.get(
            usuario=request.user,
            contenido_id=contenido_id
        )
        progreso.completado = False
        progreso.porcentaje_avance = 0
        progreso.fecha_completado = None
        progreso.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Contenido desmarcado'
        })
    
    except ProgresoContenido.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Progreso no encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


def _obtener_siguiente_contenido(usuario, contenido_actual):
    """Helper para obtener el siguiente contenido disponible"""
    siguiente = Contenido.objects.filter(
        estado='activo',
        publicacion='publicado',
        prerequisito=contenido_actual
    ).first()
    
    if siguiente:
        return {
            'id': siguiente.id,
            'titulo': siguiente.titulo
        }
    return None
