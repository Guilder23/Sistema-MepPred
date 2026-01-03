from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.db.models import Q
from django.db import transaction
import json

from .models import Contenido, VideoContenido


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
    if not (request.user.is_superuser or getattr(request.user, 'role', '') == 'admin'):
        return JsonResponse({'error': 'No tienes permisos'}, status=403)
    
    try:
        contenido = Contenido.objects.get(id=contenido_id)
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
