from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.admin.views.decorators import staff_member_required
import json
from .models import Materia
from apps.temas.models import Tema


@staff_member_required
def lista_materias(request):
    """Vista para mostrar la página de gestión de materias"""
    return render(request, 'materias/materias.html')


@require_http_methods(["GET"])
def obtener_materias(request):
    """API: Obtener todas las materias"""
    try:
        materias = Materia.objects.all().values(
            'id', 'nombre', 'descripcion', 'created_at', 'updated_at'
        )
        
        # Formatear fechas
        materias_list = []
        for materia in materias:
            materia['created_at'] = materia['created_at'].strftime('%d/%m/%Y %H:%M')
            materia['updated_at'] = materia['updated_at'].strftime('%d/%m/%Y %H:%M')
            materias_list.append(materia)
        
        return JsonResponse({
            'success': True,
            'materias': list(materias_list)
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
            descripcion=data.get('descripcion', '').strip()
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Materia creada exitosamente',
            'materia': {
                'id': materia.id,
                'nombre': materia.nombre,
                'descripcion': materia.descripcion,
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
        
        materia.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Materia actualizada exitosamente',
            'materia': {
                'id': materia.id,
                'nombre': materia.nombre,
                'descripcion': materia.descripcion,
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
    """API: Eliminar materia - Valida que no tenga temas"""
    try:
        materia = get_object_or_404(Materia, id=materia_id)
        
        # Verificar si la materia tiene temas
        temas_count = Tema.objects.filter(materia=materia).count()
        if temas_count > 0:
            return JsonResponse({
                'success': False,
                'error': f'No puedes eliminar "{materia.nombre}" porque contiene {temas_count} tema{"s" if temas_count > 1 else ""}. Primero debes eliminar los temas asociados.'
            }, status=400)
        
        nombre = materia.nombre
        materia.delete()
        
        return JsonResponse({
            'success': True,
            'message': f'Materia "{nombre}" eliminada exitosamente'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


from django.contrib.auth.decorators import login_required


@login_required
@require_http_methods(["GET"])
def listar_materias_estudiante(request):
    """API: Obtener todas las materias con información de progreso para estudiantes"""
    try:
        from apps.temas.models import Tema
        from apps.contenido.models import Contenido, ProgresoContenido
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
        
        materias = Materia.objects.all().order_by('id')
        
        materias_data = []
        for materia in materias:
            # Obtener todos los temas de esta materia
            temas = Tema.objects.filter(materia=materia).order_by('id')
            
            total_temas = temas.count()
            temas_visibles = 0
            temas_bloqueados = 0
            total_contenidos = 0
            contenidos_completados = 0
            
            for tema in temas:
                # Verificar si puede ver este tema
                puede_ver = True
                if tema.requiere_suscripcion and not es_admin and not tiene_suscripcion_activa:
                    puede_ver = False
                    temas_bloqueados += 1
                else:
                    temas_visibles += 1
                
                # Contar contenidos del tema
                if puede_ver:
                    contenidos = Contenido.objects.filter(
                        tema=tema,
                        estado='activo',
                        publicacion='publicado'
                    )
                    total_contenidos += contenidos.count()
                    
                    # Contar contenidos completados
                    for contenido in contenidos:
                        if ProgresoContenido.objects.filter(
                            usuario=request.user,
                            contenido=contenido,
                            completado=True
                        ).exists():
                            contenidos_completados += 1
            
            # Calcular porcentaje de progreso
            porcentaje = round((contenidos_completados / total_contenidos) * 100) if total_contenidos > 0 else 0
            
            materias_data.append({
                'id': materia.id,
                'nombre': materia.nombre,
                'descripcion': materia.descripcion,
                'total_temas': total_temas,
                'temas_visibles': temas_visibles,
                'temas_bloqueados': temas_bloqueados,
                'total_contenidos': total_contenidos,
                'contenidos_completados': contenidos_completados,
                'porcentaje': porcentaje,
                'created_at': materia.created_at.strftime('%d/%m/%Y %H:%M'),
                'updated_at': materia.updated_at.strftime('%d/%m/%Y %H:%M')
            })
        
        return JsonResponse({
            'success': True,
            'materias': materias_data,
            'es_premium': tiene_suscripcion_activa or es_admin
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@login_required
@require_http_methods(["GET"])
def obtener_materia_estudiante(request, materia_id):
    """API: Obtener una materia con sus temas y progreso para estudiantes"""
    try:
        from apps.temas.models import Tema
        from apps.contenido.models import Contenido, ProgresoContenido
        from apps.evaluaciones.models import Examen, IntentoExamen
        from apps.suscripciones.models import Suscripcion
        
        materia = get_object_or_404(Materia, id=materia_id)
        
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
        
        # Obtener todos los temas de esta materia
        temas = Tema.objects.filter(materia=materia).order_by('id')
        
        temas_data = []
        for tema in temas:
            # Verificar si puede ver este tema
            puede_ver = True
            mensaje_bloqueo = None
            
            if tema.requiere_suscripcion and not es_admin and not tiene_suscripcion_activa:
                puede_ver = False
                mensaje_bloqueo = "Este tema requiere suscripción premium"
            
            # Obtener contenidos del tema
            contenidos = Contenido.objects.filter(
                tema=tema,
                estado='activo',
                publicacion='publicado'
            ).order_by('orden', 'id')
            
            total_contenidos = contenidos.count()
            contenidos_completados = 0
            
            if puede_ver:
                for contenido in contenidos:
                    if ProgresoContenido.objects.filter(
                        usuario=request.user,
                        contenido=contenido,
                        completado=True
                    ).exists():
                        contenidos_completados += 1
            
            # Verificar estado del examen
            examen = Examen.objects.filter(tema=tema, activo=True).first()
            examen_info = None
            
            if examen:
                todos_completados = contenidos_completados == total_contenidos and total_contenidos > 0
                examen_disponible = (todos_completados or es_admin) and puede_ver
                
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
                
                examen_info = {
                    'id': examen.id,
                    'titulo': examen.titulo,
                    'disponible': examen_disponible,
                    'aprobado': aprobado,
                    'mejor_nota': mejor_nota,
                    'total_intentos': intentos.count(),
                }
            
            # Calcular porcentaje del tema
            porcentaje = round((contenidos_completados / total_contenidos) * 100) if total_contenidos > 0 else 0
            
            temas_data.append({
                'id': tema.id,
                'nombre': tema.nombre,
                'descripcion': tema.descripcion,
                'requiere_suscripcion': tema.requiere_suscripcion,
                'puede_ver': puede_ver,
                'mensaje_bloqueo': mensaje_bloqueo,
                'total_contenidos': total_contenidos,
                'contenidos_completados': contenidos_completados,
                'porcentaje': porcentaje,
                'examen': examen_info,
            })
        
        # Calcular progreso general de la materia
        total_contenidos_materia = sum(t['total_contenidos'] for t in temas_data if t['puede_ver'])
        contenidos_completados_materia = sum(t['contenidos_completados'] for t in temas_data if t['puede_ver'])
        porcentaje_materia = round((contenidos_completados_materia / total_contenidos_materia) * 100) if total_contenidos_materia > 0 else 0
        
        return JsonResponse({
            'success': True,
            'materia': {
                'id': materia.id,
                'nombre': materia.nombre,
                'descripcion': materia.descripcion,
                'total_contenidos': total_contenidos_materia,
                'contenidos_completados': contenidos_completados_materia,
                'porcentaje': porcentaje_materia,
                'temas': temas_data,
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


@require_http_methods(["GET"])
def obtener_materias_y_temas(request):
    """API: Obtener todas las materias y temas para filtros"""
    try:
        materias = Materia.objects.all()
        temas = Tema.objects.all()
        
        materias_data = [
            {'id': m.id, 'nombre': m.nombre}
            for m in materias
        ]
        
        temas_data = [
            {'id': t.id, 'nombre': t.nombre, 'materia_id': t.materia_id}
            for t in temas
        ]
        
        return JsonResponse({
            'success': True,
            'materias': materias_data,
            'temas': temas_data
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)
