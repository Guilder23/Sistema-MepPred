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
            Q(tema__nombre__icontains=busqueda) |
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
            Q(tema__nombre__icontains=busqueda) |
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
            'tema': contenido.tema.nombre if contenido.tema else '',
            'tema_id': contenido.tema.id if contenido.tema else None,
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
        'tema': contenido.tema.nombre if contenido.tema else '',
        'nivel_curso': contenido.nivel_curso,
        'tipo_contenido': contenido.tipo_contenido,
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
        tema_nombre = request.POST.get('tema', '').strip()
        nivel_curso = request.POST.get('nivel_curso', '').strip()
        estado = request.POST.get('estado', 'activo')
        publicacion = request.POST.get('publicacion', 'no_publicado')
        tipo_contenido = request.POST.get('tipo_contenido', 'universitario')
        
        # Obtener videos (pueden venir múltiples)
        videos_enlaces = request.POST.getlist('videos[]')
        
        # Validaciones
        if not all([titulo, descripcion, contenido_tema, tema_nombre, nivel_curso]):
            return JsonResponse({'success': False, 'error': 'Todos los campos son requeridos'})
        
        # Buscar el tema
        from apps.temas.models import Tema
        try:
            tema = Tema.objects.get(nombre=tema_nombre)
        except Tema.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Tema no encontrado'})
        
        # Crear contenido con transacción
        with transaction.atomic():
            contenido = Contenido.objects.create(
                titulo=titulo,
                descripcion=descripcion,
                contenido_tema=contenido_tema,
                tema=tema,
                nivel_curso=nivel_curso,
                tipo_contenido=tipo_contenido,
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
        tema_nombre = request.POST.get('tema', '').strip()
        nivel_curso = request.POST.get('nivel_curso', '').strip()
        estado = request.POST.get('estado', 'activo')
        publicacion = request.POST.get('publicacion', 'no_publicado')
        tipo_contenido = request.POST.get('tipo_contenido', 'universitario')
        
        # Obtener videos
        videos_enlaces = request.POST.getlist('videos[]')
        
        contenido = Contenido.objects.get(id=contenido_id)
        
        # Buscar el tema
        from apps.temas.models import Tema
        try:
            tema = Tema.objects.get(nombre=tema_nombre)
        except Tema.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Tema no encontrado'})
        
        # Actualizar contenido con transacción
        with transaction.atomic():
            contenido.titulo = titulo
            contenido.descripcion = descripcion
            contenido.contenido_tema = contenido_tema
            contenido.tema = tema
            contenido.nivel_curso = nivel_curso
            contenido.tipo_contenido = tipo_contenido
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
    from apps.suscripciones.models import Suscripcion
    from apps.evaluaciones.models import IntentoExamen, Examen
    
    # Verificar si es administrador
    es_admin = request.user.is_superuser or getattr(request.user, 'role', '') == 'admin'
    
    # Verificar si el estudiante tiene suscripción premium activa
    tiene_suscripcion_activa = False
    if not es_admin:
        suscripcion = Suscripcion.objects.filter(
            estudiante=request.user,
            estado='APROBADO'
        ).first()
        tiene_suscripcion_activa = suscripcion and suscripcion.esta_activa()
    
    # Obtener todos los temas ordenados
    from apps.temas.models import Tema
    temas_ordenados = list(Tema.objects.filter(
        contenido__estado='activo',
        contenido__publicacion='publicado'
    ).distinct().order_by('id'))
    
    # Determinar qué temas puede ver el usuario
    temas_accesibles = []
    
    if es_admin or tiene_suscripcion_activa:
        # Premium: ve todos los temas según haya aprobado los anteriores
        if temas_ordenados:
            temas_accesibles.append(temas_ordenados[0])
            
            # Verificar cuántos temas ha aprobado
            for i, tema in enumerate(temas_ordenados[:-1]):
                # Buscar el examen de este tema
                examen = Examen.objects.filter(tema=tema, activo=True).first()
                if examen:
                    # Verificar si aprobó (nota >= 16/20 = 80%)
                    intento_aprobado = IntentoExamen.objects.filter(
                        estudiante=request.user,
                        examen=examen,
                        nota__gte=16  # 80% de 20
                    ).exists()
                    
                    if intento_aprobado:
                        # Aprobó, puede ver el siguiente tema
                        siguiente_tema = temas_ordenados[i + 1]
                        if siguiente_tema not in temas_accesibles:
                            temas_accesibles.append(siguiente_tema)
                    else:
                        # No aprobó, no puede ver las siguientes
                        break
                else:
                    # No hay examen, no puede avanzar
                    break
    else:
        # No premium: SOLO ve el primer tema (gratis)
        if temas_ordenados:
            temas_accesibles.append(temas_ordenados[0])
    
    # Filtrar contenidos solo de temas accesibles
    contenidos = Contenido.objects.filter(
        estado='activo',
        publicacion='publicado',
        tema__in=temas_accesibles
    ).select_related('tema').order_by('tema__id', 'orden')
    
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
            'tema': contenido.tema.nombre if contenido.tema else '',
            'tema_requiere_suscripcion': contenido.tema.requiere_suscripcion if contenido.tema else False,
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
    from apps.suscripciones.models import Suscripcion
    
    # Verificar si es administrador
    es_admin = request.user.is_superuser or getattr(request.user, 'role', '') == 'admin'
    
    # Verificar si el estudiante tiene suscripción premium activa
    tiene_suscripcion_activa = False
    if not es_admin:
        suscripcion = Suscripcion.objects.filter(
            estudiante=request.user,
            estado='APROBADO'
        ).first()
        tiene_suscripcion_activa = suscripcion and suscripcion.esta_activa()
    
    # Obtener todos los contenidos publicados y activos
    contenidos = Contenido.objects.filter(
        estado='activo',
        publicacion='publicado'
    ).select_related('tema').order_by('tema', 'orden')
    
    # Obtener progresos del usuario
    progresos = ProgresoContenido.objects.filter(usuario=request.user)
    progresos_dict = {p.contenido_id: p for p in progresos}
    
    # Agrupar por tema
    temas_data = {}
    for contenido in contenidos:
        # Verificar acceso según tipo de tema
        if contenido.tema:
            # Si el tema es premium
            if contenido.tema.requiere_suscripcion:
                # Solo mostrar si:
                # 1. Es administrador, O
                # 2. El estudiante tiene suscripción aprobada y activa
                if not es_admin and not tiene_suscripcion_activa:
                    continue  # Saltar este contenido
        
        tema_nombre = contenido.tema.nombre if contenido.tema else 'Sin tema'
        
        if tema_nombre not in temas_data:
            temas_data[tema_nombre] = {
                'tema': tema_nombre,
                'contenidos': [],
                'total': 0,
                'completados': 0,
                'porcentaje': 0
            }
        
        progreso = progresos_dict.get(contenido.id)
        completado = progreso.completado if progreso else False
        porcentaje_avance = progreso.porcentaje_avance if progreso else 0
        esta_disponible = contenido.esta_disponible_para(request.user)
        
        temas_data[tema_nombre]['contenidos'].append({
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
        
        temas_data[tema_nombre]['total'] += 1
        if completado:
            temas_data[tema_nombre]['completados'] += 1
    
    # Calcular porcentajes
    for tema_data in temas_data.values():
        if tema_data['total'] > 0:
            tema_data['porcentaje'] = round((tema_data['completados'] / tema_data['total']) * 100)
    
    # Calcular progreso general
    total_contenidos = sum(m['total'] for m in temas_data.values())
    total_completados = sum(m['completados'] for m in temas_data.values())
    porcentaje_general = round((total_completados / total_contenidos) * 100) if total_contenidos > 0 else 0
    
    return JsonResponse({
        'temas': list(temas_data.values()),
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
