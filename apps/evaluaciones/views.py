from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.decorators import login_required
from django.db import transaction
import json
from .models import Examen, Pregunta, Enunciado, Opcion, IntentoExamen
from apps.temas.models import Tema
from apps.suscripciones.decorators import tiene_suscripcion_activa
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
        contenidos_tema = Contenido.objects.filter(
            tema=examen.tema,
            estado='activo',
            publicacion='publicado'
        )
        
        for contenido in contenidos_tema:
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
    """API: Obtener todos los exámenes organizados por materia y tema"""
    try:
        from apps.suscripciones.models import Suscripcion
        from apps.contenido.models import Contenido, ProgresoContenido
        from apps.temas.models import Tema
        from apps.materias_nueva.models import Materia
        
        # Verificar si es administrador
        es_admin = request.user.is_staff or request.user.is_superuser
        tiene_premium = es_admin or tiene_suscripcion_activa(request.user)
        
        # Para administradores, devolver lista simple de todos los exámenes
        if es_admin:
            examenes = Examen.objects.all().select_related('tema', 'tema__materia').order_by('-created_at')
            
            examenes_data = []
            for examen in examenes:
                examenes_data.append({
                    'id': examen.id,
                    'titulo': examen.titulo,
                    'descripcion': examen.descripcion,
                    'tema_id': examen.tema.id if examen.tema else None,
                    'tema_nombre': examen.tema.nombre if examen.tema else 'Sin tema',
                    'materia_id': examen.tema.materia.id if examen.tema and examen.tema.materia else None,
                    'materia_nombre': examen.tema.materia.nombre if examen.tema and examen.tema.materia else 'Sin materia',
                    'materia_requiere_suscripcion': examen.tema.requiere_suscripcion if examen.tema else False,
                    'duracion_minutos': examen.duracion_minutos,
                    'total_preguntas': examen.preguntas.count(),
                    'activo': examen.activo,
                    'created_at': examen.created_at.strftime('%d/%m/%Y %H:%M'),
                    'updated_at': examen.updated_at.strftime('%d/%m/%Y %H:%M'),
                })
            
            return JsonResponse({
                'success': True,
                'data': examenes_data
            })
        
        # Para estudiantes, devolver lista simple de exámenes accesibles
        examenes = Examen.objects.filter(activo=True).select_related('tema', 'tema__materia').order_by('tema__materia__id', 'tema__id', 'id')
        
        # Agrupar exámenes por tema para verificar habilitación secuencial
        examenes_por_tema = {}
        for examen in examenes:
            if examen.tema.id not in examenes_por_tema:
                examenes_por_tema[examen.tema.id] = []
            examenes_por_tema[examen.tema.id].append(examen)
        
        examenes_data = []
        for examen in examenes:
            # Verificar si el estudiante puede ver este examen (si el tema requiere suscripción)
            if examen.tema and examen.tema.requiere_suscripcion and not tiene_premium:
                continue  # Saltar exámenes premium sin suscripción
            
            # Verificar si completó todos los contenidos del tema
            contenidos_tema = Contenido.objects.filter(
                tema=examen.tema,
                estado='activo',
                publicacion='publicado'
            )
            
            total_contenidos = contenidos_tema.count()
            contenidos_completados = 0
            
            for contenido in contenidos_tema:
                try:
                    progreso = ProgresoContenido.objects.get(
                        usuario=request.user,
                        contenido=contenido,
                        completado=True
                    )
                    contenidos_completados += 1
                except ProgresoContenido.DoesNotExist:
                    pass
            
            # El examen está disponible si completó todos los contenidos del tema
            contenido_completado = (contenidos_completados == total_contenidos and total_contenidos > 0)
            
            # Obtener intentos del estudiante para este examen
            intentos = IntentoExamen.objects.filter(
                estudiante=request.user,
                examen=examen
            ).order_by('numero_intento')
            
            intentos_realizados = intentos.count()
            
            # Solo el primer intento puede entrar al ranking
            puede_entrar_ranking = intentos_realizados < 1
            intentos_restantes = 1 if puede_entrar_ranking else 0
            
            # Obtener la mejor nota si hay intentos
            mejor_nota = None
            aprobado = False
            if intentos.exists():
                mejor_intento = intentos.order_by('-nota').first()
                mejor_nota = float(mejor_intento.nota)
                aprobado = mejor_intento.aprobado
            
            # Verificar habilitación secuencial dentro del tema
            bloqueado_secuencial = False
            if contenido_completado:  # Solo si el contenido está completado
                # Obtener la posición de este examen dentro del tema
                examenes_del_tema = examenes_por_tema[examen.tema.id]
                posicion_examen = next((i for i, e in enumerate(examenes_del_tema) if e.id == examen.id), -1)
                
                # Si no es el primer examen del tema, verificar que el anterior fue aprobado
                if posicion_examen > 0:
                    examen_anterior = examenes_del_tema[posicion_examen - 1]
                    intento_anterior_aprobado = IntentoExamen.objects.filter(
                        estudiante=request.user,
                        examen=examen_anterior,
                        aprobado=True
                    ).exists()
                    
                    if not intento_anterior_aprobado:
                        bloqueado_secuencial = True
            
            examenes_data.append({
                'id': examen.id,
                'titulo': examen.titulo,
                'descripcion': examen.descripcion,
                'tema_id': examen.tema.id if examen.tema else None,
                'tema_nombre': examen.tema.nombre if examen.tema else 'Sin tema',
                'materia_id': examen.tema.materia.id if examen.tema and examen.tema.materia else None,
                'materia_nombre': examen.tema.materia.nombre if examen.tema and examen.tema.materia else 'Sin materia',
                'materia_requiere_suscripcion': examen.tema.requiere_suscripcion if examen.tema else False,
                'duracion_minutos': examen.duracion_minutos,
                'total_preguntas': examen.preguntas.count(),
                'activo': examen.activo,
                'bloqueado': not contenido_completado or bloqueado_secuencial,
                'bloqueado_secuencial': bloqueado_secuencial,
                'contenido_completado': contenido_completado,
                'total_contenidos': total_contenidos,
                'contenidos_completados': contenidos_completados,
                'intentos_realizados': intentos_realizados,
                'puede_entrar_ranking': puede_entrar_ranking,
                'intentos_restantes': intentos_restantes,
                'mejor_nota': mejor_nota,
                'aprobado': aprobado,
                'created_at': examen.created_at.strftime('%d/%m/%Y %H:%M'),
                'updated_at': examen.updated_at.strftime('%d/%m/%Y %H:%M'),
            })
        
        return JsonResponse({
            'success': True,
            'data': examenes_data,
            'tiene_premium': tiene_premium
        })
    except Exception as e:
        import traceback
        print(f"Error en obtener_examenes: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


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
        
        # Un examen es premium si su tema requiere suscripción
        es_examen_premium = examen.tema.requiere_suscripcion if examen.tema else False
        
        # Si el tema es premium y no tiene suscripción, denegar acceso
        if es_examen_premium and not tiene_premium:
            return JsonResponse({
                'success': False,
                'error': 'Este tema requiere suscripción premium. Necesitas una suscripción activa para acceder.',
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
        
        # Solo el primer intento cuenta para el ranking
        # Después puede seguir intentando pero ya no suma al ranking
        numero_intentos = intentos_previos.count()
        puede_intentar = True  # Siempre puede intentar
        puede_ranking = numero_intentos < 1  # Solo el primer intento va al ranking
        
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
                'tema_nombre': examen.tema.nombre,
                'duracion_minutos': examen.duracion_minutos,
                'total_preguntas': len(preguntas_list),
                'preguntas': preguntas_list,
            },
            'intentos': {
                'realizados': intentos_data,
                'total': numero_intentos,
                'puede_intentar': puede_intentar,
                'puede_ranking': puede_ranking,
                'intentos_restantes': max(0, 1 - numero_intentos)
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
        
        # Un examen es premium si su tema requiere suscripción
        es_examen_premium = examen.tema.requiere_suscripcion if examen.tema else False
        
        # Si el tema es premium y no tienes acceso, denegar
        if es_examen_premium and not tiene_premium:
            return JsonResponse({
                'success': False,
                'error': 'Este tema requiere suscripción premium. Necesitas una suscripción activa para acceder.',
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
                'materia_id': examen.tema.materia_id if examen.tema and examen.tema.materia else '',
                'tema_id': examen.tema.id,
                'tema_nombre': examen.tema.nombre,
                'tema_requiere_suscripcion': es_examen_premium,
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
        
        if not data.get('tema_id'):
            return JsonResponse({
                'success': False,
                'error': 'El tema es requerido'
            }, status=400)
        
        # Verificar que el tema existe
        tema = get_object_or_404(Tema, id=data['tema_id'])
        
        # Crear examen
        # Nota: es_premium se determina por tema.requiere_suscripcion
        examen = Examen.objects.create(
            titulo=data['titulo'].strip(),
            descripcion=data.get('descripcion', '').strip(),
            tema=tema,
            duracion_minutos=data.get('duracion_minutos', 60),
            es_premium=tema.requiere_suscripcion,  # Basado en el tema
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
            'message': 'Examen creado exitosamente',
            'examen': {
                'id': examen.id,
                'titulo': examen.titulo,
                'tema_nombre': examen.tema.nombre
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
        if data.get('tema_id'):
            tema = get_object_or_404(Tema, id=data['tema_id'])
            examen.tema = tema
        if 'duracion_minutos' in data:
            examen.duracion_minutos = data['duracion_minutos']
        # Nota: es_premium ahora se determina por tema.requiere_suscripcion
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
            'message': 'Examen actualizado exitosamente'
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
        
        # Verificar si el examen tiene preguntas
        if examen.preguntas.exists():
            return JsonResponse({
                'success': False,
                'error': 'No se puede eliminar un examen que tiene preguntas. Elimine primero todas las preguntas.'
            }, status=400)
        
        titulo = examen.titulo
        examen.delete()
        
        return JsonResponse({
            'success': True,
            'message': f'Examen "{titulo}" eliminado exitosamente'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@require_http_methods(["GET"])
def obtener_temas_select(request):
    """API: Obtener temas para select"""
    try:
        temas = Tema.objects.all().values('id', 'nombre')
        return JsonResponse({
            'success': True,
            'data': list(temas)
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
        
        # Un examen es premium si su tema requiere suscripción
        es_examen_premium = examen.tema.requiere_suscripcion if examen.tema else False
        
        # Si el tema es premium y no tiene acceso, denegar
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
        nota = round(porcentaje, 2)  # Nota sobre 100
        
        # Verificar intentos previos
        intentos_previos = IntentoExamen.objects.filter(
            estudiante=request.user,
            examen=examen
        ).count()
        
        # Solo el primer intento cuenta para el ranking
        # Después puede seguir pero ya no entra al ranking
        puede_ranking = intentos_previos < 1
        
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
                'intentos_restantes': max(0, 1 - intento.numero_intento)
            },
            'resultados': resultados_detallados
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


