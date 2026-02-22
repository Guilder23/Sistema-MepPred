from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.admin.views.decorators import staff_member_required
import json
from .models import Tema
from apps.materias_nueva.models import Materia


@staff_member_required
def lista_temas(request):
    """Vista para mostrar la página de gestión de temas"""
    return render(request, 'temas/temas.html')


@require_http_methods(["GET"])
def obtener_materias(request):
    """API: Obtener todas las materias"""
    try:
        materias = Materia.objects.all().order_by('nombre')
        
        materias_list = []
        for materia in materias:
            materias_list.append({
                'id': materia.id,
                'nombre': materia.nombre,
            })
        
        return JsonResponse({
            'success': True,
            'materias': materias_list
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@require_http_methods(["GET"])
def obtener_temas_por_materia(request, materia_id):
    """API: Obtener temas de una materia específica con contenidos para estudiantes"""
    try:
        from apps.contenido.models import Contenido, ProgresoContenido, VideoContenido
        from apps.evaluaciones.models import Examen, IntentoExamen
        from apps.suscripciones.models import Suscripcion
        
        # Verificar si es administrador
        es_admin = request.user.is_authenticated and (request.user.is_superuser or getattr(request.user, 'role', '') == 'admin')
        
        # Verificar si el estudiante tiene suscripción premium activa
        tiene_suscripcion_activa = False
        if request.user.is_authenticated and not es_admin:
            suscripcion = Suscripcion.objects.filter(
                estudiante=request.user,
                estado='APROBADO'
            ).first()
            tiene_suscripcion_activa = suscripcion and suscripcion.esta_activa()
        
        temas = Tema.objects.filter(materia_id=materia_id).select_related('materia').order_by('id')
        
        temas_list = []
        for tema in temas:
            tema_data = {
                'id': tema.id,
                'nombre': tema.nombre,
                'descripcion': tema.descripcion,
                'requiere_suscripcion': tema.requiere_suscripcion,
                'materia_id': tema.materia_id,
                'materia_nombre': tema.materia.nombre if tema.materia else '-',
                'examenes': [],  # Inicializar siempre con array vacío
            }
            
            # Si el usuario está autenticado, agregar información de contenidos y progreso
            if request.user.is_authenticated:
                # Verificar si puede ver este tema
                puede_ver_tema = True
                mensaje_bloqueo = None
                
                if tema.requiere_suscripcion and not es_admin and not tiene_suscripcion_activa:
                    puede_ver_tema = False
                    mensaje_bloqueo = "Este tema requiere suscripción premium"
                
                tema_data['puede_ver_tema'] = puede_ver_tema
                tema_data['mensaje_bloqueo'] = mensaje_bloqueo
                
                # Obtener contenidos del tema
                contenidos = Contenido.objects.filter(
                    tema=tema,
                    estado='activo',
                    publicacion='publicado'
                ).order_by('orden', 'id')
                
                contenidos_data = []
                contenidos_completados = 0
                
                for contenido in contenidos:
                    # Verificar si está disponible
                    esta_disponible = contenido.esta_disponible_para(request.user)
                    
                    # Obtener progreso
                    try:
                        progreso = ProgresoContenido.objects.get(usuario=request.user, contenido=contenido)
                        completado = progreso.completado
                        porcentaje = progreso.porcentaje_avance
                        if completado:
                            contenidos_completados += 1
                    except ProgresoContenido.DoesNotExist:
                        completado = False
                        porcentaje = 0
                    
                    # Obtener videos
                    videos = list(VideoContenido.objects.filter(contenido=contenido).values('id', 'enlace', 'orden').order_by('orden'))
                    
                    contenidos_data.append({
                        'id': contenido.id,
                        'titulo': contenido.titulo,
                        'descripcion': contenido.descripcion,
                        'contenido_tema': contenido.contenido_tema,
                        'orden': contenido.orden,
                        'esta_disponible': esta_disponible,
                        'completado': completado,
                        'porcentaje_avance': porcentaje,
                        'videos': videos,
                    })
                
                tema_data['contenidos'] = contenidos_data
                tema_data['total_contenidos'] = len(contenidos_data)
                tema_data['contenidos_completados'] = contenidos_completados
                tema_data['porcentaje'] = round((contenidos_completados / len(contenidos_data)) * 100) if len(contenidos_data) > 0 else 0
                
                # Verificar estado de TODOS los exámenes del tema (habilitación secuencial)
                examenes = Examen.objects.filter(tema=tema, activo=True).order_by('id')
                examenes_data = []
                
                # Para habilitación secuencial
                todos_contenidos_completados = contenidos_completados == len(contenidos_data) and len(contenidos_data) > 0
                ultimo_examen_aprobado = True  # El primer examen no requiere aprobación previa
                
                for index, examen in enumerate(examenes):
                    # Verificar intentos
                    intentos = IntentoExamen.objects.filter(
                        estudiante=request.user,
                        examen=examen
                    ).order_by('numero_intento')
                    
                    mejor_nota = None
                    aprobado = False
                    
                    if intentos.exists():
                        mejor_intento = intentos.order_by('-nota').first()
                        mejor_nota = float(mejor_intento.nota)
                        aprobado = mejor_intento.aprobado
                    
                    # Lógica de disponibilidad secuencial
                    if es_admin:
                        # Admins pueden ver todos los exámenes
                        examen_disponible = True
                    elif index == 0:
                        # Primer examen: disponible si todos los contenidos están completados
                        examen_disponible = todos_contenidos_completados
                    else:
                        # Exámenes siguientes: disponibles si el anterior fue aprobado
                        examen_disponible = ultimo_examen_aprobado
                    
                    examenes_data.append({
                        'id': examen.id,
                        'titulo': examen.titulo,
                        'descripcion': examen.descripcion,
                        'duracion_minutos': examen.duracion_minutos,
                        'disponible': examen_disponible,
                        'aprobado': aprobado,
                        'mejor_nota': mejor_nota,
                        'total_intentos': intentos.count(),
                    })
                    
                    # Actualizar estado para el siguiente examen
                    ultimo_examen_aprobado = aprobado
                
                tema_data['examenes'] = examenes_data
            
            temas_list.append(tema_data)
        
        return JsonResponse({
            'success': True,
            'temas': temas_list,
            'es_premium': tiene_suscripcion_activa or es_admin if request.user.is_authenticated else False
        })
    except Exception as e:
        import traceback
        print(f"Error en obtener_temas_por_materia: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@staff_member_required
def lista_temas(request):
    """Vista para mostrar la página de gestión de temas"""
    return render(request, 'temas/temas.html')


@require_http_methods(["GET"])
def obtener_temas(request):
    """API: Obtener todos los temas"""
    try:
        materia_id = request.GET.get('materia_id')
        
        if materia_id:
            temas = Tema.objects.filter(materia_id=materia_id).select_related('materia')
        else:
            temas = Tema.objects.all().select_related('materia')
        
        # Formatear datos
        temas_list = []
        for tema in temas:
            temas_list.append({
                'id': tema.id,
                'nombre': tema.nombre,
                'descripcion': tema.descripcion,
                'requiere_suscripcion': tema.requiere_suscripcion,
                'materia_id': tema.materia_id,
                'materia_nombre': tema.materia.nombre if tema.materia else '-',
                'suscripcion': tema.requiere_suscripcion,
                'fecha_creacion': tema.created_at.strftime('%d/%m/%Y %H:%M'),
                'fecha_actualizacion': tema.updated_at.strftime('%d/%m/%Y %H:%M'),
                'created_at': tema.created_at.strftime('%d/%m/%Y %H:%M'),
                'updated_at': tema.updated_at.strftime('%d/%m/%Y %H:%M')
            })
        
        return JsonResponse({
            'success': True,
            'temas': temas_list
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })


@require_http_methods(["GET"])
def obtener_tema(request, tema_id):
    """API: Obtener un tema específico"""
    try:
        tema = get_object_or_404(Tema, id=tema_id)
        return JsonResponse({
            'success': True,
            'tema': {
                'id': tema.id,
                'nombre': tema.nombre,
                'descripcion': tema.descripcion,
                'requiere_suscripcion': tema.requiere_suscripcion,
                'materia_id': tema.materia_id,
                'materia_nombre': tema.materia.nombre,
                'created_at': tema.created_at.strftime('%d/%m/%Y %H:%M'),
                'updated_at': tema.updated_at.strftime('%d/%m/%Y %H:%M')
            }
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=404)


@require_http_methods(["POST"])
def crear_tema(request):
    """API: Crear nuevo tema"""
    try:
        data = json.loads(request.body)
        
        # Validar campos requeridos
        if not data.get('nombre') or not data['nombre'].strip():
            return JsonResponse({
                'success': False,
                'error': 'El nombre del tema es requerido'
            }, status=400)
        
        if not data.get('materia_id'):
            return JsonResponse({
                'success': False,
                'error': 'La materia es requerida'
            }, status=400)
        
        # Verificar si la materia existe
        try:
            materia = Materia.objects.get(id=data['materia_id'])
        except Materia.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'La materia especificada no existe'
            }, status=404)
        
        # Verificar si ya existe un tema con ese nombre en esa materia
        if Tema.objects.filter(nombre=data['nombre'], materia_id=data['materia_id']).exists():
            return JsonResponse({
                'success': False,
                'error': 'Ya existe un tema con ese nombre en esta materia'
            }, status=400)
        
        tema = Tema.objects.create(
            nombre=data['nombre'].strip(),
            descripcion=data.get('descripcion', '').strip(),
            materia_id=data['materia_id'],
            requiere_suscripcion=data.get('requiere_suscripcion', False)
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Tema creado exitosamente',
            'tema': {
                'id': tema.id,
                'nombre': tema.nombre,
                'descripcion': tema.descripcion,
                'requiere_suscripcion': tema.requiere_suscripcion,
                'materia_id': tema.materia_id,
                'materia_nombre': tema.materia.nombre,
                'created_at': tema.created_at.strftime('%d/%m/%Y %H:%M')
            }
        }, status=201)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@require_http_methods(["PUT", "POST"])
def actualizar_tema(request, tema_id):
    """API: Actualizar tema"""
    try:
        tema = get_object_or_404(Tema, id=tema_id)
        data = json.loads(request.body)
        
        # Validar nombre
        if data.get('nombre'):
            nombre = data['nombre'].strip()
            if not nombre:
                return JsonResponse({
                    'success': False,
                    'error': 'El nombre no puede estar vacío'
                }, status=400)
            
            # Verificar si otro ya lo usa en la misma materia
            materia_id = data.get('materia_id', tema.materia_id)
            if Tema.objects.filter(nombre=nombre, materia_id=materia_id).exclude(id=tema_id).exists():
                return JsonResponse({
                    'success': False,
                    'error': 'Ya existe otro tema con ese nombre en esta materia'
                }, status=400)
            
            tema.nombre = nombre
        
        if 'descripcion' in data:
            tema.descripcion = data['descripcion'].strip()
        
        if 'materia_id' in data:
            try:
                materia = Materia.objects.get(id=data['materia_id'])
                tema.materia = materia
            except Materia.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'error': 'La materia especificada no existe'
                }, status=404)
        
        if 'requiere_suscripcion' in data:
            tema.requiere_suscripcion = data['requiere_suscripcion']
        
        tema.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Tema actualizado exitosamente',
            'tema': {
                'id': tema.id,
                'nombre': tema.nombre,
                'descripcion': tema.descripcion,
                'requiere_suscripcion': tema.requiere_suscripcion,
                'materia_id': tema.materia_id,
                'materia_nombre': tema.materia.nombre,
                'updated_at': tema.updated_at.strftime('%d/%m/%Y %H:%M')
            }
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@require_http_methods(["DELETE"])
def eliminar_tema(request, tema_id):
    """API: Eliminar tema"""
    try:
        tema = get_object_or_404(Tema, id=tema_id)
        nombre = tema.nombre
        
        # Verificar relaciones antes de eliminar
        relaciones = []
        
        # Verificar si tiene contenidos
        contenidos_count = tema.contenido_set.count()
        if contenidos_count > 0:
            relaciones.append(f"{contenidos_count} contenido(s)")
        
        # Verificar si tiene exámenes
        examenes_count = tema.examenes.count()
        if examenes_count > 0:
            relaciones.append(f"{examenes_count} examen(es)")
        
        # Verificar si tiene mazos premium
        mazos_premium_count = tema.mazos_premium.count()
        if mazos_premium_count > 0:
            relaciones.append(f"{mazos_premium_count} mazo(s) premium")
        
        # Si tiene relaciones, no permitir eliminar
        if relaciones:
            mensaje_error = f'No se puede eliminar el tema "{nombre}" porque tiene: {", ".join(relaciones)}. Elimine primero estos elementos.'
            return JsonResponse({
                'success': False,
                'error': mensaje_error
            }, status=400)
        
        # Si no tiene relaciones, proceder con la eliminación
        tema.delete()
        
        return JsonResponse({
            'success': True,
            'message': f'Tema "{nombre}" eliminado exitosamente'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


from django.contrib.auth.decorators import login_required


@login_required
@require_http_methods(["GET"])
def obtener_tema_estudiante(request, tema_id):
    """API: Obtener un tema con sus contenidos para estudiantes"""
    try:
        from apps.contenido.models import Contenido, ProgresoContenido, VideoContenido
        from apps.evaluaciones.models import Examen, IntentoExamen
        from apps.suscripciones.models import Suscripcion
        
        tema = get_object_or_404(Tema, id=tema_id)
        
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
        
        # Verificar si puede ver este tema
        puede_ver_tema = True
        mensaje_bloqueo = None
        
        if tema.requiere_suscripcion and not es_admin and not tiene_suscripcion_activa:
            puede_ver_tema = False
            mensaje_bloqueo = "Este tema requiere suscripción premium. Por favor, suscríbete para acceder."
            
            return JsonResponse({
                'success': False,
                'error': mensaje_bloqueo,
                'requiere_suscripcion': True
            }, status=403)
        
        # Obtener contenidos del tema
        contenidos = Contenido.objects.filter(
            tema=tema,
            estado='activo',
            publicacion='publicado'
        ).order_by('orden', 'id')
        
        contenidos_data = []
        for contenido in contenidos:
            # Verificar si está disponible
            esta_disponible = contenido.esta_disponible_para(request.user)
            
            # Obtener progreso
            try:
                progreso = ProgresoContenido.objects.get(usuario=request.user, contenido=contenido)
                completado = progreso.completado
                porcentaje = progreso.porcentaje_avance
                fecha_completado = progreso.fecha_completado.isoformat() if progreso.fecha_completado else None
            except ProgresoContenido.DoesNotExist:
                completado = False
                porcentaje = 0
                fecha_completado = None
            
            # Obtener videos
            videos = list(VideoContenido.objects.filter(contenido=contenido).values('id', 'enlace', 'orden').order_by('orden'))
            
            contenidos_data.append({
                'id': contenido.id,
                'titulo': contenido.titulo,
                'descripcion': contenido.descripcion,
                'contenido_tema': contenido.contenido_tema,
                'orden': contenido.orden,
                'esta_disponible': esta_disponible,
                'completado': completado,
                'porcentaje_avance': porcentaje,
                'fecha_completado': fecha_completado,
                'videos': videos,
            })
        
        # Verificar estado del examen
        examen = Examen.objects.filter(tema=tema, activo=True).first()
        examen_info = None
        
        if examen:
            # Verificar si completó todos los contenidos
            total_contenidos = contenidos.count()
            contenidos_completados = sum(1 for c in contenidos_data if c['completado'])
            todos_completados = contenidos_completados == total_contenidos and total_contenidos > 0
            examen_disponible = todos_completados or es_admin
            
            # Obtener intentos
            intentos = IntentoExamen.objects.filter(
                estudiante=request.user,
                examen=examen
            ).order_by('numero_intento')
            
            mejor_nota = None
            aprobado = False
            primer_intento_aprobado = False
            intentos_data = []
            
            for intento in intentos:
                intentos_data.append({
                    'numero': intento.numero_intento,
                    'nota': float(intento.nota),
                    'porcentaje': float(intento.porcentaje),
                    'aprobado': intento.aprobado,
                    'cuenta_para_ranking': intento.cuenta_para_ranking,
                    'fecha': intento.fecha_intento.strftime('%d/%m/%Y %H:%M')
                })
                
                if intento.numero_intento == 1 and intento.aprobado:
                    primer_intento_aprobado = True
            
            if intentos.exists():
                mejor_intento = intentos.order_by('-nota').first()
                mejor_nota = float(mejor_intento.nota)
                aprobado = mejor_intento.aprobado
            
            examen_info = {
                'id': examen.id,
                'titulo': examen.titulo,
                'descripcion': examen.descripcion,
                'duracion_minutos': examen.duracion_minutos,
                'disponible': examen_disponible,
                'aprobado': aprobado,
                'mejor_nota': mejor_nota,
                'total_intentos': intentos.count(),
                'primer_intento_aprobado': primer_intento_aprobado,
                'puede_entrar_ranking': intentos.count() < 1,
                'intentos': intentos_data,
            }
        
        # Calcular progreso del tema
        total_contenidos = len(contenidos_data)
        contenidos_completados = sum(1 for c in contenidos_data if c['completado'])
        porcentaje_tema = round((contenidos_completados / total_contenidos) * 100) if total_contenidos > 0 else 0
        
        return JsonResponse({
            'success': True,
            'tema': {
                'id': tema.id,
                'nombre': tema.nombre,
                'descripcion': tema.descripcion,
                'requiere_suscripcion': tema.requiere_suscripcion,
                'materia': {
                    'id': tema.materia.id,
                    'nombre': tema.materia.nombre,
                } if tema.materia else None,
                'total_contenidos': total_contenidos,
                'contenidos_completados': contenidos_completados,
                'porcentaje': porcentaje_tema,
                'contenidos': contenidos_data,
                'examen': examen_info,
            },
            'es_premium': tiene_suscripcion_activa or es_admin
        })
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)
