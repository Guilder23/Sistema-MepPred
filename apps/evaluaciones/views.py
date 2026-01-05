from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.admin.views.decorators import staff_member_required
from django.db import transaction
import json
from .models import Examen, Pregunta, Enunciado, Opcion
from apps.materias.models import Materia


@staff_member_required
def lista_examenes(request):
    """Vista para mostrar la página de gestión de exámenes"""
    return render(request, 'evaluaciones/examenes.html')


@require_http_methods(["GET"])
def obtener_examenes(request):
    """API: Obtener todos los exámenes"""
    try:
        examenes = Examen.objects.select_related('materia').all()
        
        examenes_list = []
        for examen in examenes:
            examenes_list.append({
                'id': examen.id,
                'titulo': examen.titulo,
                'descripcion': examen.descripcion,
                'materia_id': examen.materia.id,
                'materia_nombre': examen.materia.nombre,
                'duracion_minutos': examen.duracion_minutos,
                'es_premium': examen.es_premium,
                'activo': examen.activo,
                'total_preguntas': examen.preguntas.count(),
                'created_at': examen.created_at.strftime('%d/%m/%Y %H:%M'),
                'updated_at': examen.updated_at.strftime('%d/%m/%Y %H:%M')
            })
        
        return JsonResponse({
            'success': True,
            'data': examenes_list
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })


@require_http_methods(["GET"])
def obtener_examen(request, examen_id):
    """API: Obtener un examen específico con sus preguntas"""
    try:
        examen = get_object_or_404(Examen, id=examen_id)
        
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
