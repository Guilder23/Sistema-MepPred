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
    contenidos = Contenido.objects.select_related('tema__materia').all()
    
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
    
    contenidos = Contenido.objects.select_related('tema__materia').all()
    
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
            'materia_nombre': contenido.tema.materia.nombre if contenido.tema and contenido.tema.materia else '-',
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
        
        # Obtener videos
        videos = list(contenido.videos.all().values('id', 'enlace', 'orden'))
        
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
            'materia_id': contenido.tema.materia_id if contenido.tema else '',
            'materia': contenido.tema.materia.nombre if contenido.tema and contenido.tema.materia else '',
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
        
    except Contenido.DoesNotExist:
        return JsonResponse({'error': 'Contenido no encontrado'}, status=404)
    except Exception as e:
        print(f"Error en obtener_contenido: {str(e)}")
        return JsonResponse({'error': f'Error al obtener contenido: {str(e)}'}, status=500)


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
        materia_id = request.POST.get('materia', '').strip()
        nivel_curso = request.POST.get('nivel_curso', '').strip()
        estado = request.POST.get('estado', 'activo')
        publicacion = request.POST.get('publicacion', 'no_publicado')
        tipo_contenido = request.POST.get('tipo_contenido', 'universitario')
        
        # Obtener videos (pueden venir múltiples)
        videos_enlaces = request.POST.getlist('videos[]')
        
        # Validaciones
        if not all([titulo, descripcion, contenido_tema, tema_nombre, materia_id, nivel_curso]):
            return JsonResponse({'success': False, 'error': 'Todos los campos son requeridos'})
        
        # Buscar el tema
        from apps.temas.models import Tema
        try:
            tema = Tema.objects.get(nombre=tema_nombre, materia__id=materia_id)
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
        materia_id = request.POST.get('materia', '').strip()
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
            tema = Tema.objects.get(nombre=tema_nombre, materia__id=materia_id)
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
    """API para listar contenidos publicados organizados por materia y tema"""
    try:
        from apps.suscripciones.models import Suscripcion
        from apps.evaluaciones.models import IntentoExamen, Examen
        from apps.materias_nueva.models import Materia
        from apps.temas.models import Tema
        
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
        
        # Obtener todas las materias con sus temas y contenidos
        materias = Materia.objects.all().order_by('id')
        
        materias_data = []
        for materia in materias:
            # Obtener todos los temas de esta materia
            temas = Tema.objects.filter(materia=materia).order_by('id')
            
            temas_data = []
            for tema in temas:
                # Verificar si el estudiante puede ver este tema
                puede_ver_tema = True
                mensaje_bloqueo = None
                
                # Si el tema es premium y no tiene suscripción
                if tema.requiere_suscripcion and not es_admin and not tiene_suscripcion_activa:
                    puede_ver_tema = False
                    mensaje_bloqueo = "Este tema requiere suscripción premium"
                
                # Obtener contenidos del tema
                contenidos = Contenido.objects.filter(
                    tema=tema,
                    estado='activo',
                    publicacion='publicado'
                ).order_by('orden', 'id')
                
                contenidos_lista = list(contenidos)  # Convertir a lista para reutilizar
                total_contenidos = len(contenidos_lista)
                
                contenidos_data = []
                contenidos_completados_count = 0
                
                for contenido in contenidos_lista:
                    # Verificar si está disponible
                    esta_disponible = contenido.esta_disponible_para(request.user)
                    
                    # Obtener progreso
                    try:
                        progreso = ProgresoContenido.objects.get(usuario=request.user, contenido=contenido)
                        completado = progreso.completado
                        porcentaje = progreso.porcentaje_avance
                        if completado:
                            contenidos_completados_count += 1
                    except ProgresoContenido.DoesNotExist:
                        completado = False
                        porcentaje = 0
                    
                    contenidos_data.append({
                        'id': contenido.id,
                        'titulo': contenido.titulo,
                        'descripcion': contenido.descripcion,
                        'orden': contenido.orden,
                        'nivel_curso': contenido.nivel_curso,
                        'fecha_creacion': contenido.fecha_creacion.strftime('%Y-%m-%d %H:%M:%S'),
                        'esta_disponible': esta_disponible,
                        'completado': completado,
                        'porcentaje_avance': porcentaje,
                    })
                
                # Verificar si el examen del tema está disponible
                examen = Examen.objects.filter(tema=tema, activo=True).first()
                examen_disponible = False
                examen_aprobado = False
                mejor_nota = None
                
                if examen:
                    # El examen está disponible si completó todos los contenidos del tema
                    todos_completados = (contenidos_completados_count == total_contenidos and total_contenidos > 0) or es_admin
                    examen_disponible = todos_completados
                    
                    # Verificar si ya aprobó
                    intento_aprobado = IntentoExamen.objects.filter(
                        estudiante=request.user,
                        examen=examen,
                        aprobado=True
                    ).first()
                    
                    if intento_aprobado:
                        examen_aprobado = True
                        mejor_nota = float(intento_aprobado.nota)
                    else:
                        # Obtener la mejor nota aunque no haya aprobado
                        mejor_intento = IntentoExamen.objects.filter(
                            estudiante=request.user,
                            examen=examen
                        ).order_by('-nota').first()
                        
                        if mejor_intento:
                            mejor_nota = float(mejor_intento.nota)
                
                temas_data.append({
                    'id': tema.id,
                    'nombre': tema.nombre,
                    'descripcion': tema.descripcion,
                    'requiere_suscripcion': tema.requiere_suscripcion,
                    'puede_ver_tema': puede_ver_tema,
                    'mensaje_bloqueo': mensaje_bloqueo,
                    'contenidos': contenidos_data,
                    'examen': {
                        'id': examen.id if examen else None,
                        'titulo': examen.titulo if examen else None,
                        'disponible': examen_disponible,
                        'aprobado': examen_aprobado,
                        'mejor_nota': mejor_nota,
                    } if examen else None,
                })
            
            materias_data.append({
                'id': materia.id,
                'nombre': materia.nombre,
                'descripcion': materia.descripcion,
                'temas': temas_data,
            })
        
        return JsonResponse({
            'materias': materias_data,
            'es_premium': tiene_suscripcion_activa or es_admin,
        }, safe=False)
    
    except Exception as e:
        import traceback
        print(f"Error en listar_contenidos_publicados: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'error': 'Error al cargar los contenidos',
            'detalle': str(e)
        }, status=500)


@login_required
def vista_progreso(request):
    """Vista de progreso del estudiante"""
    return render(request, 'contenido/progreso.html')


@login_required
@require_http_methods(["GET"])
def obtener_progreso_usuario(request):
    """API para obtener el progreso completo del usuario organizado por materia"""
    try:
        from apps.suscripciones.models import Suscripcion
        from apps.materias_nueva.models import Materia
        from apps.temas.models import Tema
        from apps.evaluaciones.models import Examen, IntentoExamen
        
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
        
        # Obtener todas las materias
        materias = Materia.objects.all().order_by('id')
        
        # Obtener todos los progresos del usuario
        progresos = ProgresoContenido.objects.filter(usuario=request.user)
        progresos_dict = {p.contenido_id: p for p in progresos}
        
        materias_data = []
        total_contenidos_general = 0
        total_completados_general = 0
        suma_porcentajes_materias = 0
        total_materias_con_temas = 0
        
        for materia in materias:
            # Obtener temas de esta materia
            temas = Tema.objects.filter(materia=materia).order_by('id')
            
            temas_data = []
            total_contenidos_materia = 0
            total_completados_materia = 0
            total_temas_materia = 0
            temas_completados_materia = 0
            
            for tema in temas:
                # Verificar si el estudiante puede ver este tema
                puede_ver_tema = True
                if tema.requiere_suscripcion and not es_admin and not tiene_suscripcion_activa:
                    puede_ver_tema = False
                
                if not puede_ver_tema:
                    continue  # Saltar temas premium sin suscripción
                
                # Obtener contenidos del tema
                contenidos = Contenido.objects.filter(
                    tema=tema,
                    estado='activo',
                    publicacion='publicado'
                ).order_by('orden', 'id')
                
                contenidos_data = []
                tema_total = 0
                tema_completados = 0
                
                for contenido in contenidos:
                    progreso = progresos_dict.get(contenido.id)
                    completado = progreso.completado if progreso else False
                    porcentaje_avance = progreso.porcentaje_avance if progreso else 0
                    esta_disponible = contenido.esta_disponible_para(request.user)
                    
                    contenidos_data.append({
                        'id': contenido.id,
                        'titulo': contenido.titulo,
                        'descripcion': contenido.descripcion,
                        'orden': contenido.orden,
                        'completado': completado,
                        'porcentaje_avance': porcentaje_avance,
                        'esta_disponible': esta_disponible,
                    })
                    
                    tema_total += 1
                    if completado:
                        tema_completados += 1
                
                # Verificar estado del examen
                examen = Examen.objects.filter(tema=tema, activo=True).first()
                examen_info = None
                
                if examen:
                    # Verificar si todos los contenidos están completados
                    todos_completados = tema_completados == tema_total and tema_total > 0
                    examen_disponible = todos_completados or es_admin
                    
                    # Verificar intentos
                    intentos = IntentoExamen.objects.filter(
                        estudiante=request.user,
                        examen=examen
                    ).order_by('numero_intento')
                    
                    mejor_nota = None
                    aprobado = False
                    primer_intento_aprobado = False
                    
                    if intentos.exists():
                        mejor_intento = intentos.order_by('-nota').first()
                        mejor_nota = float(mejor_intento.nota)
                        aprobado = mejor_intento.aprobado
                        
                        # Verificar si el primer intento fue aprobado (para ranking)
                        primer_intento = intentos.first()
                        primer_intento_aprobado = primer_intento.aprobado
                    
                    examen_info = {
                        'id': examen.id,
                        'titulo': examen.titulo,
                        'disponible': examen_disponible,
                        'aprobado': aprobado,
                        'mejor_nota': mejor_nota,
                        'total_intentos': intentos.count(),
                        'primer_intento_aprobado': primer_intento_aprobado,
                    }
                
                # Calcular porcentaje del tema
                porcentaje_tema = round((tema_completados / tema_total) * 100) if tema_total > 0 else 0
                
                # Un tema está completado cuando todos sus contenidos están completados
                tema_esta_completado = (tema_completados == tema_total and tema_total > 0)
                
                temas_data.append({
                    'id': tema.id,
                    'nombre': tema.nombre,
                    'descripcion': tema.descripcion,
                    'requiere_suscripcion': tema.requiere_suscripcion,
                    'contenidos': contenidos_data,
                    'total_contenidos': tema_total,
                    'contenidos_completados': tema_completados,
                    'porcentaje': porcentaje_tema,
                    'completado': tema_esta_completado,
                    'examen': examen_info,
                })
                
                # Sumar al total de la materia
                total_contenidos_materia += tema_total
                total_completados_materia += tema_completados
                total_temas_materia += 1
                if tema_esta_completado:
                    temas_completados_materia += 1
            
            # Calcular porcentaje de la materia basado en TEMAS completados
            porcentaje_materia = round((temas_completados_materia / total_temas_materia) * 100) if total_temas_materia > 0 else 0
            
            # Solo contar materias que tienen temas
            if total_temas_materia > 0:
                total_materias_con_temas += 1
                suma_porcentajes_materias += porcentaje_materia
            
            materias_data.append({
                'id': materia.id,
                'nombre': materia.nombre,
                'descripcion': materia.descripcion,
                'temas': temas_data,
                'total_contenidos': total_contenidos_materia,
                'contenidos_completados': total_completados_materia,
                'total_temas': total_temas_materia,
                'temas_completados': temas_completados_materia,
                'porcentaje': porcentaje_materia,
            })
            
            # Sumar al total general (para estadísticas de contenidos)
            total_contenidos_general += total_contenidos_materia
            total_completados_general += total_completados_materia
        
        # Calcular porcentaje general basado en el PROMEDIO de porcentajes de materias
        porcentaje_general = round(suma_porcentajes_materias / total_materias_con_temas) if total_materias_con_temas > 0 else 0
        
        return JsonResponse({
            'materias': materias_data,
            'estadisticas': {
                'total_contenidos': total_contenidos_general,
                'completados': total_completados_general,
                'pendientes': total_contenidos_general - total_completados_general,
                'porcentaje_general': porcentaje_general,
            },
            'es_premium': tiene_suscripcion_activa or es_admin,
        })
    
    except Exception as e:
        import traceback
        print(f"Error en obtener_progreso_usuario: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'error': 'Error al cargar el progreso',
            'detalle': str(e)
        }, status=500)


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
