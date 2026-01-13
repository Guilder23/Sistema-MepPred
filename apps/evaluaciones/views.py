from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.decorators import login_required
from django.db import transaction
import json
from .models import Examen, Pregunta, Enunciado, Opcion, IntentoExamen
from apps.materias.models import Materia
from apps.suscripciones.decorators import tiene_suscripcion_activa
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
from datetime import datetime


@staff_member_required
def lista_examenes(request):
    """Vista para mostrar la página de gestión de exámenes (solo admin)"""
    return render(request, 'evaluaciones/examenes.html')


@login_required
def examenes_disponibles(request):
    """Vista de exámenes disponibles para estudiantes"""
    es_premium = request.user.is_staff or request.user.is_superuser or tiene_suscripcion_activa(request.user)
    return render(request, 'evaluaciones/estudiante/examenes_disponibles.html', {
        'es_premium': es_premium
    })


@login_required
def resolver_examen(request, examen_id):
    """Vista para resolver un examen específico"""
    from apps.suscripciones.models import Suscripcion
    from apps.contenido.models import Contenido, ProgresoContenido
    
    # Verificar que el examen existe y está activo
    examen = get_object_or_404(Examen, id=examen_id, activo=True)
    
    # Verificar acceso
    es_admin = request.user.is_staff or request.user.is_superuser
    tiene_premium = es_admin or tiene_suscripcion_activa(request.user)
    
    # Si no es admin, verificar que completó todos los contenidos
    if not es_admin:
        contenidos_materia = Contenido.objects.filter(
            materia=examen.materia,
            estado='activo',
            publicacion='publicado'
        )
        
        for contenido in contenidos_materia:
            try:
                progreso = ProgresoContenido.objects.get(
                    usuario=request.user,
                    contenido=contenido
                )
                if not progreso.completado:
                    return render(request, '404.html', status=403)
            except ProgresoContenido.DoesNotExist:
                return render(request, '404.html', status=403)
    
    return render(request, 'evaluaciones/estudiante/resolver_examen.html', {
        'examen_id': examen_id
    })


@require_http_methods(["GET"])
@login_required
def obtener_examenes(request):
    """API: Obtener todos los exámenes según el nivel de suscripción"""
    try:
        from apps.suscripciones.models import Suscripcion
        from apps.contenido.models import Contenido, ProgresoContenido
        from apps.materias.models import Materia
        
        # Verificar si es administrador
        es_admin = request.user.is_staff or request.user.is_superuser
        tiene_premium = es_admin or tiene_suscripcion_activa(request.user)
        
        # Los administradores ven todos los exámenes
        if es_admin:
            examenes = Examen.objects.select_related('materia').filter(activo=True)
        else:
            # Para estudiantes: determinar qué materias puede ver
            # Obtener todas las materias ordenadas
            materias_ordenadas = list(Materia.objects.all().order_by('id'))
            
            # Determinar qué materias puede ver el usuario
            materias_accesibles = []
            
            if tiene_premium:
                # Premium: ve todas las materias según haya aprobado las anteriores
                if materias_ordenadas:
                    materias_accesibles.append(materias_ordenadas[0])
                    
                    # Verificar cuántas materias ha aprobado
                    for i, materia in enumerate(materias_ordenadas[:-1]):
                        # Buscar el examen de esta materia
                        examen = Examen.objects.filter(materia=materia, activo=True).first()
                        if examen:
                            # Verificar si aprobó (nota >= 16/20 = 80%)
                            intento_aprobado = IntentoExamen.objects.filter(
                                estudiante=request.user,
                                examen=examen,
                                nota__gte=16  # 80% de 20
                            ).exists()
                            
                            if intento_aprobado:
                                # Aprobó, puede ver la siguiente materia
                                siguiente_materia = materias_ordenadas[i + 1]
                                if siguiente_materia not in materias_accesibles:
                                    materias_accesibles.append(siguiente_materia)
                            else:
                                # No aprobó, no puede ver las siguientes
                                break
                        else:
                            # No hay examen, no puede avanzar
                            break
            else:
                # No premium: SOLO ve la primera materia (gratis)
                if materias_ordenadas:
                    materias_accesibles.append(materias_ordenadas[0])
            
            # Obtener exámenes solo de materias accesibles
            examenes = Examen.objects.select_related('materia').filter(
                activo=True,
                materia__in=materias_accesibles
            )
        
        examenes_list = []
        for examen in examenes:
            # Verificar si completó todos los contenidos de la materia
            contenidos_materia = Contenido.objects.filter(
                materia=examen.materia,
                estado='activo',
                publicacion='publicado'
            )
            
            total_contenidos = contenidos_materia.count()
            contenidos_completados = 0
            
            if not es_admin:
                for contenido in contenidos_materia:
                    try:
                        progreso = ProgresoContenido.objects.get(
                            usuario=request.user,
                            contenido=contenido,
                            completado=True
                        )
                        contenidos_completados += 1
                    except ProgresoContenido.DoesNotExist:
                        pass
            else:
                contenidos_completados = total_contenidos
            
            # El examen está bloqueado si no completó todos los contenidos
            contenido_completado = (contenidos_completados == total_contenidos and total_contenidos > 0) or es_admin
            
            # Obtener intentos del estudiante para este examen
            intentos_realizados = 0
            intentos_restantes = 3
            mejor_nota = None
            puede_entrar_ranking = True
            
            if not es_admin:
                intentos = IntentoExamen.objects.filter(
                    estudiante=request.user,
                    examen=examen
                ).order_by('-nota')
                
                intentos_realizados = intentos.count()
                intentos_restantes = max(0, 3 - intentos_realizados)
                
                # Los primeros 3 intentos pueden entrar al ranking
                puede_entrar_ranking = intentos_realizados < 3
                
                # Obtener la mejor nota si hay intentos
                if intentos.exists():
                    mejor_nota = float(intentos.first().nota)
            
            examenes_list.append({
                'id': examen.id,
                'titulo': examen.titulo,
                'descripcion': examen.descripcion,
                'materia_id': examen.materia.id,
                'materia_nombre': examen.materia.nombre,
                'materia_requiere_suscripcion': examen.materia.requiere_suscripcion if examen.materia else False,
                'duracion_minutos': examen.duracion_minutos,
                'bloqueado': False,  # Ya está filtrado por materias accesibles
                'contenido_completado': contenido_completado,
                'activo': examen.activo,
                'total_preguntas': examen.preguntas.count(),
                'total_contenidos': total_contenidos,
                'contenidos_completados': contenidos_completados,
                'intentos_realizados': intentos_realizados,
                'intentos_restantes': intentos_restantes,
                'puede_entrar_ranking': puede_entrar_ranking,
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
        from apps.suscripciones.models import Suscripcion
        
        examen = get_object_or_404(Examen, id=examen_id, activo=True)
        
        # Verificar acceso
        es_admin = request.user.is_staff or request.user.is_superuser
        tiene_premium = es_admin or tiene_suscripcion_activa(request.user)
        
        # Un examen es premium si su materia requiere suscripción
        es_examen_premium = examen.materia.requiere_suscripcion if examen.materia else False
        
        # Si la materia es premium y no tiene suscripción, denegar acceso
        if es_examen_premium and not tiene_premium:
            return JsonResponse({
                'success': False,
                'error': 'Esta materia requiere suscripción premium. Necesitas una suscripción activa para acceder.',
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
        
        # Los primeros 3 intentos cuentan para el ranking
        # Después puede seguir intentando pero ya no suma al ranking
        numero_intentos = intentos_previos.count()
        puede_intentar = True  # Siempre puede intentar
        puede_ranking = numero_intentos < 3  # Solo los primeros 3 van al ranking
        
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
                'puede_ranking': puede_ranking,
                'intentos_restantes': max(0, 3 - numero_intentos)
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
        
        # Verificar acceso
        es_admin = request.user.is_staff or request.user.is_superuser
        tiene_premium = es_admin or tiene_suscripcion_activa(request.user)
        
        # Un examen es premium si su materia requiere suscripción
        es_examen_premium = examen.materia.requiere_suscripcion if examen.materia else False
        
        # Si la materia es premium y no tiene acceso, denegar
        if es_examen_premium and not tiene_premium:
            return JsonResponse({
                'success': False,
                'error': 'Esta materia requiere suscripción premium. Necesitas una suscripción activa para acceder.',
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
                'materia_requiere_suscripcion': es_examen_premium,
                'duracion_minutos': examen.duracion_minutos,
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
        # Nota: es_premium se determina por materia.requiere_suscripcion
        examen = Examen.objects.create(
            titulo=data['titulo'].strip(),
            descripcion=data.get('descripcion', '').strip(),
            materia=materia,
            duracion_minutos=data.get('duracion_minutos', 60),
            es_premium=materia.requiere_suscripcion,  # Basado en la materia
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
        # Nota: es_premium ahora se determina por materia.requiere_suscripcion
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
        es_admin = request.user.is_staff or request.user.is_superuser
        tiene_premium = es_admin or tiene_suscripcion_activa(request.user)
        
        # Un examen es premium si su materia requiere suscripción
        es_examen_premium = examen.materia.requiere_suscripcion if examen.materia else False
        
        # Si la materia es premium y no tiene acceso, denegar
        if es_examen_premium and not tiene_premium:
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
        
        # Los primeros 3 intentos cuentan para el ranking
        # Después puede seguir pero ya no entra al ranking
        puede_ranking = intentos_previos < 3
        
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
            cuenta_para_ranking=puede_ranking,
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
                'puede_ranking': puede_ranking,
                'intentos_restantes': max(0, 3 - intento.numero_intento)
            },
            'resultados': resultados_detallados
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)

@login_required
def descargar_certificado(request, examen_id):
    """Generar y descargar certificado PDF con diseño premium"""
    try:
        examen = get_object_or_404(Examen, id=examen_id)
        
        mejor_intento = IntentoExamen.objects.filter(
            estudiante=request.user,
            examen=examen,
            aprobado=True
        ).order_by('-nota').first()
        
        if not mejor_intento:
            return HttpResponse("No has aprobado este examen aún.", status=403)
        
        response = HttpResponse(content_type='application/pdf')
        
        import re
        nombre_archivo = re.sub(r'[^a-zA-Z0-9_-]', '_', f"certificado_{examen.materia.nombre}_{request.user.username}")
        response['Content-Disposition'] = f'attachment; filename="{nombre_archivo}.pdf"'
        
        p = canvas.Canvas(response, pagesize=landscape(A4))
        width, height = landscape(A4)
        
        # Paleta de colores profesional
        color_primario = colors.HexColor('#003d82')      # Azul marino
        color_secundario = colors.HexColor('#0066cc')    # Azul más claro
        color_dorado = colors.HexColor('#d4af37')        # Oro auténtico
        color_gris_claro = colors.HexColor('#f8f9fa')    # Fondo claro
        color_texto = colors.HexColor('#1a1a1a')         # Texto oscuro
        color_linea = colors.HexColor('#003d82')         # Líneas
        
        # Fondo degradado simulado (capas)
        p.setFillColor(colors.white)
        p.rect(0, 0, width, height, fill=True, stroke=False)
        
        # Fondo superior decorativo
        p.setFillColor(color_primario)
        p.rect(0, height-1.5*cm, width, 1.5*cm, fill=True, stroke=False)
        
        # Fondo inferior decorativo
        p.setFillColor(color_primario)
        p.rect(0, 0, width, 1.2*cm, fill=True, stroke=False)
        
        # Marco principal elegante (triple línea)
        margen = 1.8*cm
        marco_width = width - 2*margen
        marco_height = height - 2*margen - 1.2*cm
        
        # Línea exterior dorada gruesa
        p.setStrokeColor(color_dorado)
        p.setLineWidth(2.5)
        p.rect(margen, margen, marco_width, marco_height, fill=False, stroke=True)
        
        # Línea interior principal
        p.setStrokeColor(color_primario)
        p.setLineWidth(1.5)
        p.rect(margen+0.2*cm, margen+0.2*cm, marco_width-0.4*cm, marco_height-0.4*cm, fill=False, stroke=True)
        
        # Línea interior fina dorada
        p.setStrokeColor(color_dorado)
        p.setLineWidth(0.5)
        p.rect(margen+0.35*cm, margen+0.35*cm, marco_width-0.7*cm, marco_height-0.7*cm, fill=False, stroke=True)
        
        # Título principal - CERTIFICADO
        p.setFillColor(color_primario)
        p.setFont("Helvetica-Bold", 48)
        p.drawCentredString(width/2, height-3.5*cm, "CERTIFICADO")
        
        # Subtítulo
        p.setFillColor(color_dorado)
        p.setFont("Helvetica-Bold", 14)
        p.drawCentredString(width/2, height-4.6*cm, "DE LOGRO Y EXCELENCIA ACADÉMICA")
        
        # Línea decorativa dorada bajo título
        p.setStrokeColor(color_dorado)
        p.setLineWidth(1.5)
        p.line(width/2-6*cm, height-5*cm, width/2+6*cm, height-5*cm)
        
        # Textos de presentación
        p.setFillColor(color_texto)
        p.setFont("Helvetica", 13)
        p.drawCentredString(width/2, height-6*cm, "Se certifica que")
        
        # Nombre del estudiante - DESTACADO
        nombre_completo = f"{request.user.first_name} {request.user.last_name}" if request.user.first_name else request.user.username
        
        # Rectángulo de fondo para el nombre
        nombre_y = height - 7.5*cm
        p.setFillColor(color_gris_claro)
        p.rect(width/2-7*cm, nombre_y-0.8*cm, 14*cm, 1.2*cm, fill=True, stroke=False)
        
        p.setFillColor(color_primario)
        p.setFont("Helvetica-Bold", 32)
        p.drawCentredString(width/2, nombre_y, nombre_completo.upper())
        
        # Tipo de estudiante
        tipo_estudiante = ""
        if hasattr(request.user, 'student_status') and request.user.student_status:
            if request.user.student_status == 'university':
                tipo_estudiante = "Estudiante Universitario"
            elif request.user.student_status == 'aspirant':
                tipo_estudiante = "Postulante"
            else:
                tipo_estudiante = "Estudiante"
        else:
            tipo_estudiante = "Estudiante"
        
        p.setFillColor(color_dorado)
        p.setFont("Helvetica-Oblique", 12)
        p.drawCentredString(width/2, height-9*cm, tipo_estudiante)
        
        # Línea decorativa
        p.setStrokeColor(color_dorado)
        p.setLineWidth(1)
        p.line(width/2-4.5*cm, height-9.4*cm, width/2+4.5*cm, height-9.4*cm)
        
        # Texto principal - Ha aprobado
        p.setFillColor(color_texto)
        p.setFont("Helvetica", 13)
        p.drawCentredString(width/2, height-10.2*cm, "Por haber completado satisfactoriamente el examen de")
        
        # Materia - En grande
        p.setFillColor(color_secundario)
        p.setFont("Helvetica-Bold", 22)
        p.drawCentredString(width/2, height-11.3*cm, examen.materia.nombre.upper())
        
        # Título del examen
        p.setFillColor(color_texto)
        p.setFont("Helvetica-Oblique", 12)
        titulo_truncado = (examen.titulo[:50] + "...") if len(examen.titulo) > 50 else examen.titulo
        p.drawCentredString(width/2, height-12.2*cm, f'"{titulo_truncado}"')
        
        # Sección de resultados - Caja destacada
        resultado_y_inicio = height - 13.5*cm
        p.setFillColor(colors.HexColor('#f0f4f8'))
        p.rect(width/2-5.5*cm, resultado_y_inicio-1.8*cm, 11*cm, 1.8*cm, fill=True, stroke=False)
        
        # Borde de la caja
        p.setStrokeColor(color_dorado)
        p.setLineWidth(1.5)
        p.rect(width/2-5.5*cm, resultado_y_inicio-1.8*cm, 11*cm, 1.8*cm, fill=False, stroke=True)
        
        # Nota
        p.setFillColor(color_primario)
        p.setFont("Helvetica-Bold", 13)
        p.drawString(width/2-5*cm, resultado_y_inicio-0.5*cm, "NOTA OBTENIDA:")
        
        p.setFillColor(color_dorado)
        p.setFont("Helvetica-Bold", 20)
        p.drawString(width/2+2*cm, resultado_y_inicio-0.5*cm, f"{float(mejor_intento.nota):.2f}/20")
        
        # Porcentaje
        p.setFillColor(color_texto)
        p.setFont("Helvetica", 11)
        p.drawString(width/2-5.2*cm, resultado_y_inicio-1.2*cm, f"Precision: {float(mejor_intento.porcentaje):.1f}%")
        
        # Estrella de logro (usando caracteres especiales)
        p.setFillColor(color_dorado)
        p.setFont("Helvetica-Bold", 16)
        p.drawString(width/2+3*cm, resultado_y_inicio-1.2*cm, "★★★")
        
        # Línea divisoria
        p.setStrokeColor(color_primario)
        p.setLineWidth(0.5)
        p.line(margen+0.5*cm, height-15.5*cm, width-margen-0.5*cm, height-15.5*cm)
        
        # Mensaje de reconocimiento
        p.setFillColor(color_texto)
        p.setFont("Helvetica", 11)
        linea1 = "Se reconoce el esfuerzo, dedicacion y competencia demostrada"
        linea2 = "en el dominio de los conocimientos evaluados en esta materia."
        p.drawCentredString(width/2, height-16.2*cm, linea1)
        p.drawCentredString(width/2, height-16.8*cm, linea2)
        
        # Fecha de aprobación
        meses = {
            1: 'enero', 2: 'febrero', 3: 'marzo', 4: 'abril',
            5: 'mayo', 6: 'junio', 7: 'julio', 8: 'agosto',
            9: 'septiembre', 10: 'octubre', 11: 'noviembre', 12: 'diciembre'
        }
        dia_aprobacion = mejor_intento.fecha_intento.day
        mes_aprobacion = meses[mejor_intento.fecha_intento.month]
        anio_aprobacion = mejor_intento.fecha_intento.year
        fecha_aprobacion = f"Aprobado: {dia_aprobacion} de {mes_aprobacion} de {anio_aprobacion}"
        
        p.setFillColor(color_primario)
        p.setFont("Helvetica-Bold", 10)
        p.drawCentredString(width/2, height-17.8*cm, fecha_aprobacion)
        
        # Pie de página - sobre fondo oscuro
        p.setFillColor(color_primario)
        p.setFont("Helvetica-Bold", 14)
        p.drawCentredString(width/2, 3*cm, "MedPred")
        
        p.setFillColor(color_dorado)
        p.setFont("Helvetica", 10)
        p.drawCentredString(width/2, 2.4*cm, "Sistema de Evaluacion Medica")
        
        # Información de generación
        dia_impresion = datetime.now().day
        mes_impresion = meses[datetime.now().month]
        anio_impresion = datetime.now().year
        fecha_impresion = f"{dia_impresion} de {mes_impresion} de {anio_impresion}"
        
        p.setFillColor(colors.white)
        p.setFont("Helvetica", 8)
        p.drawCentredString(width/2, 1.7*cm, f"Certificado generado: {fecha_impresion}")
        
        # Finalizar
        p.showPage()
        p.save()
        
        return response
        
    except Exception as e:
        return HttpResponse(f"Error al generar certificado: {str(e)}", status=500)
