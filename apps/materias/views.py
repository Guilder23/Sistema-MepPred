from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.contrib.admin.views.decorators import staff_member_required
import json
from .models import Materia


@staff_member_required
def lista_materias(request):
    """Vista para mostrar la página de gestión de materias"""
    return render(request, 'materias/materias.html')


@require_http_methods(["GET"])
def obtener_materias(request):
    """API: Obtener todas las materias"""
    try:
        materias = Materia.objects.all().values(
            'id', 'nombre', 'descripcion', 'requiere_suscripcion', 'created_at', 'updated_at'
        )
        
        # Formatear fechas
        materias_list = []
        for materia in materias:
            materia['created_at'] = materia['created_at'].strftime('%d/%m/%Y %H:%M')
            materia['updated_at'] = materia['updated_at'].strftime('%d/%m/%Y %H:%M')
            materias_list.append(materia)
        
        return JsonResponse({
            'success': True,
            'data': list(materias_list)
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })


@require_http_methods(["GET"])
def obtener_materia(request, materia_id):
    """API: Obtener una materia específica"""
    try:
        materia = get_object_or_404(Materia, id=materia_id)
        return JsonResponse({
            'success': True,
            'materia': {
                'id': materia.id,
                'nombre': materia.nombre,
                'descripcion': materia.descripcion,
                'requiere_suscripcion': materia.requiere_suscripcion,
                'created_at': materia.created_at.strftime('%d/%m/%Y %H:%M'),
                'updated_at': materia.updated_at.strftime('%d/%m/%Y %H:%M')
            }
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=404)


@require_http_methods(["POST"])
def crear_materia(request):
    """API: Crear nueva materia"""
    try:
        data = json.loads(request.body)
        
        # Validar campos requeridos
        if not data.get('nombre') or not data['nombre'].strip():
            return JsonResponse({
                'success': False,
                'error': 'El nombre de la materia es requerido'
            }, status=400)
        
        # Verificar si ya existe
        if Materia.objects.filter(nombre=data['nombre']).exists():
            return JsonResponse({
                'success': False,
                'error': 'Ya existe una materia con ese nombre'
            }, status=400)
        
        materia = Materia.objects.create(
            nombre=data['nombre'].strip(),
            descripcion=data.get('descripcion', '').strip(),
            requiere_suscripcion=data.get('requiere_suscripcion', False)
        )
        
        return JsonResponse({
            'success': True,
            'mensaje': 'Materia creada exitosamente',
            'materia': {
                'id': materia.id,
                'nombre': materia.nombre,
                'descripcion': materia.descripcion,
                'requiere_suscripcion': materia.requiere_suscripcion,
                'created_at': materia.created_at.strftime('%d/%m/%Y %H:%M')
            }
        }, status=201)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@require_http_methods(["PUT"])
def actualizar_materia(request, materia_id):
    """API: Actualizar materia"""
    try:
        materia = get_object_or_404(Materia, id=materia_id)
        data = json.loads(request.body)
        
        # Validar nombre
        if data.get('nombre'):
            nombre = data['nombre'].strip()
            if not nombre:
                return JsonResponse({
                    'success': False,
                    'error': 'El nombre no puede estar vacío'
                }, status=400)
            
            # Verificar si otro ya lo usa
            if Materia.objects.filter(nombre=nombre).exclude(id=materia_id).exists():
                return JsonResponse({
                    'success': False,
                    'error': 'Ya existe otra materia con ese nombre'
                }, status=400)
            
            materia.nombre = nombre
        
        if 'descripcion' in data:
            materia.descripcion = data['descripcion'].strip()
        
        if 'requiere_suscripcion' in data:
            materia.requiere_suscripcion = data['requiere_suscripcion']
        
        materia.save()
        
        return JsonResponse({
            'success': True,
            'mensaje': 'Materia actualizada exitosamente',
            'materia': {
                'id': materia.id,
                'nombre': materia.nombre,
                'descripcion': materia.descripcion,
                'requiere_suscripcion': materia.requiere_suscripcion,
                'updated_at': materia.updated_at.strftime('%d/%m/%Y %H:%M')
            }
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@require_http_methods(["DELETE"])
def eliminar_materia(request, materia_id):
    """API: Eliminar materia"""
    try:
        materia = get_object_or_404(Materia, id=materia_id)
        nombre = materia.nombre
        materia.delete()
        
        return JsonResponse({
            'success': True,
            'mensaje': f'Materia "{nombre}" eliminada exitosamente'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)
