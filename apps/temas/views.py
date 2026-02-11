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
    """API: Obtener temas de una materia específica"""
    try:
        temas = Tema.objects.filter(materia_id=materia_id).select_related('materia').order_by('nombre')
        
        temas_list = []
        for tema in temas:
            temas_list.append({
                'id': tema.id,
                'nombre': tema.nombre,
                'descripcion': tema.descripcion,
                'requiere_suscripcion': tema.requiere_suscripcion,
                'materia_id': tema.materia_id,
                'materia_nombre': tema.materia.nombre if tema.materia else '-',
            })
        
        return JsonResponse({
            'success': True,
            'temas': temas_list
        })
    except Exception as e:
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
            'mensaje': 'Tema creado exitosamente',
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
            'mensaje': 'Tema actualizado exitosamente',
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
        tema.delete()
        
        return JsonResponse({
            'success': True,
            'mensaje': f'Tema "{nombre}" eliminado exitosamente'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)
