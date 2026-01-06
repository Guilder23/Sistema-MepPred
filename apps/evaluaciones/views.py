from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.decorators import login_required
from django.db import transaction
import json
from .models import Examen, Pregunta, Enunciado, Opcion, IntentoExamen
from apps.materias.models import Materia
from apps.suscripciones.decorators import tiene_suscripcion_activa


@staff_member_required
def lista_examenes(request):
    """Vista para mostrar la página de gestión de exámenes (solo admin)"""
    return render(request, 'evaluaciones/examenes.html')


@login_required
def examenes_disponibles(request):
    """Vista de exámenes disponibles para estudiantes premium"""
    # Solo estudiantes premium (no admins)
    if not (tiene_suscripcion_activa(request.user) and not request.user.is_staff):
        return render(request, '404.html', status=403)
    
    return render(request, 'evaluaciones/estudiante/examenes_disponibles.html')


@login_required
def resolver_examen(request, examen_id):
    """Vista para resolver un examen específico"""
    # Solo estudiantes premium (no admins)
    if not (tiene_suscripcion_activa(request.user) and not request.user.is_staff):
        return render(request, '404.html', status=403)
    
    # Verificar que el examen existe y está activo
    examen = get_object_or_404(Examen, id=examen_id, activo=True)
    
    # Verificar acceso premium si es necesario
    if examen.es_premium and not tiene_suscripcion_activa(request.user):
        return render(request, '404.html', status=403)
    
    return render(request, 'evaluaciones/estudiante/resolver_examen.html', {
        'examen_id': examen_id
    })


@require_http_methods(["GET"])
@login_required
def obtener_examenes(request):
    """API: Obtener todos los exámenes (filtra premium si no tiene suscripción)"""
    try:
        examenes = Examen.objects.select_related('materia').all()
        
        # Si no es admin, verificar acceso premium
        tiene_premium = request.user.is_staff or tiene_suscripcion_activa(request.user)
        
        examenes_list = []
        for examen in examenes:
            # Si es premium y no tiene acceso, marcar como bloqueado
            bloqueado = examen.es_premium and not tiene_premium
            
            # Obtener intentos del estudiante para este examen
            intentos_realizados = 0
            intentos_restantes = 3
            mejor_nota = None
            
            if not request.user.is_staff:
                intentos = IntentoExamen.objects.filter(
                    estudiante=request.user,
                    examen=examen
                ).order_by('-nota')
                
                intentos_realizados = intentos.count()
                intentos_restantes = max(0, 3 - intentos_realizados)
                
                # Obtener la mejor nota si hay intentos
                if intentos.exists():
                    mejor_nota = float(intentos.first().nota)
            
            examenes_list.append({
                'id': examen.id,
                'titulo': examen.titulo,
                'descripcion': examen.descripcion,
                'materia_id': examen.materia.id,
                'materia_nombre': examen.materia.nombre,
                'duracion_minutos': examen.duracion_minutos,
                'es_premium': examen.es_premium,
                'bloqueado': bloqueado,
                'activo': examen.activo,
                'total_preguntas': examen.preguntas.count(),
                'intentos_realizados': intentos_realizados,
                'intentos_restantes': intentos_restantes,
                'mejor_nota': mejor_nota,
                'created_at': examen.created_at.strftime('%d/%m/%Y %H:%M'),
                'updated_at': examen.updated_at.strftime('%d/%m/%Y %H:%M')
            })
        
        return JsonResponse({
            'success': True,
            'data': examenes_list,
            'tiene_premium': tiene_premium
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })


@require_http_methods(["GET"])
@login_required
def obtener_examen_estudiante(request, examen_id):
    """API: Obtener un examen para que un estudiante lo resuelva (sin respuestas correctas)"""
    try:
        examen = get_object_or_404(Examen, id=examen_id, activo=True)
        
        # Verificar acceso premium
        if examen.es_premium and not request.user.is_staff:
            if not tiene_suscripcion_activa(request.user):
                return JsonResponse({
                    'success': False,
                    'error': 'Este examen es premium. Necesitas una suscripción activa para acceder.',
                    'premium_required': True
                }, status=403)
        
        # Obtener intentos previos del estudiante
        intentos_previos = IntentoExamen.objects.filter(
            estudiante=request.user,
            examen=examen
        ).order_by('numero_intento')
        
        intentos_data = []
        for intento in intentos_previos:
            intentos_data.append({
                'numero': intento.numero_intento,
                'nota': float(intento.nota),
                'porcentaje': float(intento.porcentaje),
                'aprobado': intento.aprobado,
                'fecha': intento.fecha_intento.strftime('%d/%m/%Y %H:%M')
            })
        
        # Verificar si ya alcanzó el límite de intentos
        numero_intentos = intentos_previos.count()
        puede_intentar = numero_intentos < 3
        
        # Obtener preguntas con sus enunciados y opciones (sin mostrar respuestas correctas)
        preguntas_list = []
        for pregunta in examen.preguntas.all().order_by('orden'):
            enunciados_list = [
                {
                    'id': enunciado.id,
                    'numero': enunciado.numero,
                    'texto': enunciado.texto,
                }
                for enunciado in pregunta.enunciados.all().order_by('numero')
            ]
            
            opciones_list = [
                {
                    'id': opcion.id,
                    'letra': opcion.letra,
                    'descripcion': opcion.descripcion,
                }
                for opcion in pregunta.opciones.all().order_by('letra')
            ]
            
            preguntas_list.append({
                'id': pregunta.id,
                'texto': pregunta.texto,
                'orden': pregunta.orden,
                'enunciados': enunciados_list,
                'opciones': opciones_list
            })
        
        return JsonResponse({
            'success': True,
            'examen': {
                'id': examen.id,
                'titulo': examen.titulo,
                'descripcion': examen.descripcion,
                'materia_nombre': examen.materia.nombre,
                'duracion_minutos': examen.duracion_minutos,
                'total_preguntas': len(preguntas_list),
                'preguntas': preguntas_list,
            },
            'intentos': {
                'realizados': intentos_data,
                'total': numero_intentos,
                'puede_intentar': puede_intentar,
                'intentos_restantes': 3 - numero_intentos
            }
        })
    except Examen.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'El examen no existe o no está activo.'
        }, status=404)
    except Exception as e:
        import traceback
        print(f"Error en obtener_examen_estudiante: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': f'Error del servidor: {str(e)}'
        }, status=500)


@require_http_methods(["GET"])
@login_required
def obtener_examen(request, examen_id):
    """API: Obtener un examen específico con sus preguntas (para admin)"""
    try:
        examen = get_object_or_404(Examen, id=examen_id)
        
        # Verificar acceso premium
        if examen.es_premium and not request.user.is_staff:
            if not tiene_suscripcion_activa(request.user):
                return JsonResponse({
                    'success': False,
                    'error': 'Este examen es premium. Necesitas una suscripción activa para acceder.',
                    'premium_required': True
                }, status=403)
        
        # Obtener preguntas con sus enunciados y opciones
        preguntas_list = []
        for pregunta in examen.preguntas.all():
            enunciados_list = []
            for enunciado in pregunta.enunciados.all():
                enunciados_list.append({
                    'id': enunciado.id,
                    'numero': enunciado.numero,
                    'texto': enunciado.texto,
                    'es_verdadero': enunciado.es_verdadero
                })
            
            opciones_list = []
            for opcion in pregunta.opciones.all():
                opciones_list.append({
                    'id': opcion.id,
                    'letra': opcion.letra,
                    'descripcion': opcion.descripcion,
                    'es_correcta': opcion.es_correcta
                })
            
            preguntas_list.append({
                'id': pregunta.id,
                'texto': pregunta.texto,
                'orden': pregunta.orden,
                'enunciados': enunciados_list,
                'opciones': opciones_list
            })
        
        return JsonResponse({
            'success': True,
            'examen': {
                'id': examen.id,
                'titulo': examen.titulo,
                'descripcion': examen.descripcion,
                'materia_id': examen.materia.id,
                'materia_nombre': examen.materia.nombre,
                'duracion_minutos': examen.duracion_minutos,
                'es_premium': examen.es_premium,
                'activo': examen.activo,
                'preguntas': preguntas_list,
                'created_at': examen.created_at.strftime('%d/%m/%Y %H:%M'),
                'updated_at': examen.updated_at.strftime('%d/%m/%Y %H:%M')
            }
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=404)


@require_http_methods(["POST"])
@transaction.atomic
def crear_examen(request):
    """API: Crear nuevo examen con preguntas"""
    try:
        data = json.loads(request.body)
        
        # Validar campos requeridos
        if not data.get('titulo') or not data['titulo'].strip():
            return JsonResponse({
                'success': False,
                'error': 'El título del examen es requerido'
            }, status=400)
        
        if not data.get('materia_id'):
            return JsonResponse({
                'success': False,
                'error': 'La materia es requerida'
            }, status=400)
        
        # Verificar que la materia existe
        materia = get_object_or_404(Materia, id=data['materia_id'])
        
        # Crear examen
        examen = Examen.objects.create(
            titulo=data['titulo'].strip(),
            descripcion=data.get('descripcion', '').strip(),
            materia=materia,
            duracion_minutos=data.get('duracion_minutos', 60),
            es_premium=data.get('es_premium', True),
            activo=data.get('activo', True)
        )
        
        # Crear preguntas si se proporcionan
        preguntas_data = data.get('preguntas', [])
        for idx, pregunta_data in enumerate(preguntas_data):
            pregunta = Pregunta.objects.create(
                examen=examen,
                texto=pregunta_data.get('texto', ''),
                orden=idx + 1
            )
            
            # Crear enunciados
            for enunciado_data in pregunta_data.get('enunciados', []):
                Enunciado.objects.create(
                    pregunta=pregunta,
                    numero=enunciado_data.get('numero'),
                    texto=enunciado_data.get('texto'),
                    es_verdadero=enunciado_data.get('es_verdadero', True)
                )
            
            # Crear opciones
            for opcion_data in pregunta_data.get('opciones', []):
                Opcion.objects.create(
                    pregunta=pregunta,
                    letra=opcion_data.get('letra'),
                    descripcion=opcion_data.get('descripcion'),
                    es_correcta=opcion_data.get('es_correcta', False)
                )
        
        return JsonResponse({
            'success': True,
            'mensaje': 'Examen creado exitosamente',
            'examen': {
                'id': examen.id,
                'titulo': examen.titulo,
                'materia_nombre': examen.materia.nombre
            }
        }, status=201)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@require_http_methods(["PUT"])
@transaction.atomic
def actualizar_examen(request, examen_id):
    """API: Actualizar examen"""
    try:
        examen = get_object_or_404(Examen, id=examen_id)
        data = json.loads(request.body)
        
        # Actualizar campos básicos
        if data.get('titulo'):
            examen.titulo = data['titulo'].strip()
        if 'descripcion' in data:
            examen.descripcion = data['descripcion'].strip()
        if data.get('materia_id'):
            materia = get_object_or_404(Materia, id=data['materia_id'])
            examen.materia = materia
        if 'duracion_minutos' in data:
            examen.duracion_minutos = data['duracion_minutos']
        if 'es_premium' in data:
            examen.es_premium = data['es_premium']
        if 'activo' in data:
            examen.activo = data['activo']
        
        examen.save()
        
        # Si se proporcionan preguntas, eliminar las anteriores y crear nuevas
        if 'preguntas' in data:
            examen.preguntas.all().delete()
            
            for idx, pregunta_data in enumerate(data['preguntas']):
                pregunta = Pregunta.objects.create(
                    examen=examen,
                    texto=pregunta_data.get('texto', ''),
                    orden=idx + 1
                )
                
                for enunciado_data in pregunta_data.get('enunciados', []):
                    Enunciado.objects.create(
                        pregunta=pregunta,
                        numero=enunciado_data.get('numero'),
                        texto=enunciado_data.get('texto'),
                        es_verdadero=enunciado_data.get('es_verdadero', True)
                    )
                
                for opcion_data in pregunta_data.get('opciones', []):
                    Opcion.objects.create(
                        pregunta=pregunta,
                        letra=opcion_data.get('letra'),
                        descripcion=opcion_data.get('descripcion'),
                        es_correcta=opcion_data.get('es_correcta', False)
                    )
        
        return JsonResponse({
            'success': True,
            'mensaje': 'Examen actualizado exitosamente'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@require_http_methods(["DELETE"])
def eliminar_examen(request, examen_id):
    """API: Eliminar examen"""
    try:
        examen = get_object_or_404(Examen, id=examen_id)
        titulo = examen.titulo
        examen.delete()
        
        return JsonResponse({
            'success': True,
            'mensaje': f'Examen "{titulo}" eliminado exitosamente'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@require_http_methods(["GET"])
def obtener_materias_select(request):
    """API: Obtener materias para select"""
    try:
        materias = Materia.objects.all().values('id', 'nombre')
        return JsonResponse({
            'success': True,
            'data': list(materias)
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })


@require_http_methods(["POST"])
@login_required
def calificar_examen(request, examen_id):
    """API: Calificar un examen completado por un estudiante"""
    try:
        examen = get_object_or_404(Examen, id=examen_id)
        
        # Verificar acceso
        if examen.es_premium and not request.user.is_staff:
            if not tiene_suscripcion_activa(request.user):
                return JsonResponse({
                    'success': False,
                    'error': 'No tienes acceso a este examen'
                }, status=403)
        
        data = json.loads(request.body)
        respuestas = data.get('respuestas', {})  # {pregunta_id: {enunciado_id: respuesta, ...}}
        
        # Calcular calificación
        total_preguntas = examen.preguntas.count()
        preguntas_correctas = 0
        resultados_detallados = []
        
        for pregunta in examen.preguntas.all():
            pregunta_id = str(pregunta.id)
            respuestas_pregunta = respuestas.get(pregunta_id, {})
            
            # Verificar enunciados
            enunciados_correctos = 0
            total_enunciados = pregunta.enunciados.count()
            
            detalles_enunciados = []
            for enunciado in pregunta.enunciados.all():
                enunciado_id = str(enunciado.id)
                respuesta_estudiante = respuestas_pregunta.get(enunciado_id)
                
                # Convertir respuesta a booleano
                if respuesta_estudiante == 'V':
                    respuesta_bool = True
                elif respuesta_estudiante == 'F':
                    respuesta_bool = False
                else:
                    respuesta_bool = None
                
                correcto = respuesta_bool == enunciado.es_verdadero
                if correcto:
                    enunciados_correctos += 1
                
                detalles_enunciados.append({
                    'id': enunciado.id,
                    'numero': enunciado.numero,
                    'texto': enunciado.texto,
                    'respuesta_correcta': 'V' if enunciado.es_verdadero else 'F',
                    'respuesta_estudiante': respuesta_estudiante,
                    'correcto': correcto
                })
            
            # Verificar opciones
            opcion_seleccionada_id = respuestas_pregunta.get('opcion')
            opcion_correcta = None
            opcion_seleccionada = None
            
            detalles_opciones = []
            for opcion in pregunta.opciones.all():
                if opcion.es_correcta:
                    opcion_correcta = opcion.letra
                if str(opcion.id) == str(opcion_seleccionada_id):
                    opcion_seleccionada = opcion.letra
                
                detalles_opciones.append({
                    'id': opcion.id,
                    'letra': opcion.letra,
                    'descripcion': opcion.descripcion,
                    'es_correcta': opcion.es_correcta,
                    'seleccionada': str(opcion.id) == str(opcion_seleccionada_id)
                })
            
            # La pregunta es correcta si todos los enunciados están bien Y la opción es correcta
            pregunta_correcta = (
                enunciados_correctos == total_enunciados and 
                opcion_seleccionada == opcion_correcta
            )
            
            if pregunta_correcta:
                preguntas_correctas += 1
            
            resultados_detallados.append({
                'id': pregunta.id,
                'orden': pregunta.orden,
                'texto': pregunta.texto,
                'correcta': pregunta_correcta,
                'enunciados': detalles_enunciados,
                'opciones': detalles_opciones,
                'opcion_correcta': opcion_correcta,
                'opcion_seleccionada': opcion_seleccionada
            })
        
        # Calcular porcentaje
        porcentaje = (preguntas_correctas / total_preguntas * 100) if total_preguntas > 0 else 0
        aprobado = porcentaje >= 60  # 60% para aprobar
        nota = round(porcentaje / 5, 2)  # Nota sobre 20
        
        # Verificar intentos previos
        intentos_previos = IntentoExamen.objects.filter(
            estudiante=request.user,
            examen=examen
        ).count()
        
        # Verificar límite de intentos
        if intentos_previos >= 3:
            return JsonResponse({
                'success': False,
                'error': 'Ya has alcanzado el límite de 3 intentos para este examen.'
            }, status=403)
        
        # Calcular tiempo empleado si se envió
        tiempo_empleado = data.get('tiempo_empleado')
        
        # Guardar intento
        intento = IntentoExamen.objects.create(
            estudiante=request.user,
            examen=examen,
            numero_intento=intentos_previos + 1,
            total_preguntas=total_preguntas,
            preguntas_correctas=preguntas_correctas,
            preguntas_incorrectas=total_preguntas - preguntas_correctas,
            porcentaje=round(porcentaje, 2),
            nota=nota,
            aprobado=aprobado,
            tiempo_empleado=tiempo_empleado
        )
        
        return JsonResponse({
            'success': True,
            'calificacion': {
                'total_preguntas': total_preguntas,
                'preguntas_correctas': preguntas_correctas,
                'preguntas_incorrectas': total_preguntas - preguntas_correctas,
                'porcentaje': round(porcentaje, 2),
                'aprobado': aprobado,
                'nota': nota,
                'numero_intento': intento.numero_intento,
                'intentos_restantes': 3 - intento.numero_intento
            },
            'resultados': resultados_detallados
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)
