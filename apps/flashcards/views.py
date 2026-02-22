import json
from datetime import timedelta
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_http_methods
from .models import Mazo, Flashcard, HistorialRepaso


@login_required
def flashcards_view(request):
    """Vista principal de flashcards"""
    usuario = request.user
    
    # Solo estudiantes pueden acceder
    if getattr(usuario, 'role', '') != 'student':
        return redirect('cuentas:panel')
    
    mazos = Mazo.objects.filter(usuario=usuario)
    tarjetas = Flashcard.objects.filter(mazo__usuario=usuario)
    
    # Preparar datos para JavaScript
    mazos_data = []
    for mazo in mazos:
        mazos_data.append({
            'id': mazo.id,
            'nombre': mazo.nombre,
            'descripcion': mazo.descripcion,
            'tarjetas_count': mazo.contar_tarjetas(),
            'vencidas_count': mazo.contar_vencidas(),
        })
    
    tarjetas_data = []
    for tarjeta in tarjetas:
        tarjetas_data.append({
            'id': tarjeta.id,
            'pregunta': tarjeta.pregunta,
            'respuesta': tarjeta.respuesta,
            'categoria': tarjeta.categoria,
            'mazo_id': tarjeta.mazo.id,
            'proximo_repaso': tarjeta.proximo_repaso.isoformat(),
            'intervalo': tarjeta.intervalo,
            'factor_facilidad': tarjeta.factor_facilidad,
            'repeticiones': tarjeta.repeticiones,
        })
    
    context = {
        'mazos': mazos,
        'tarjetas': tarjetas,
        'mazos_json': json.dumps(mazos_data),
        'tarjetas_json': json.dumps(tarjetas_data),
    }
    
    return render(request, 'flashcards/flashcards.html', context)


@login_required
@require_http_methods(["GET"])
def api_get_data(request):
    """API para obtener datos de flashcards"""
    usuario = request.user
    
    if getattr(usuario, 'role', '') != 'student':
        return JsonResponse({'success': False, 'message': 'No autorizado'}, status=403)
    
    try:
        mazos = Mazo.objects.filter(usuario=usuario)
        tarjetas = Flashcard.objects.filter(mazo__usuario=usuario)
        
        # Preparar datos para JavaScript
        mazos_data = []
        for mazo in mazos:
            mazos_data.append({
                'id': mazo.id,
                'nombre': mazo.nombre,
                'descripcion': mazo.descripcion,
                'tarjetas_count': mazo.contar_tarjetas(),
                'vencidas_count': mazo.contar_vencidas(),
            })
        
        tarjetas_data = []
        for tarjeta in tarjetas:
            tarjetas_data.append({
                'id': tarjeta.id,
                'pregunta': tarjeta.pregunta,
                'respuesta': tarjeta.respuesta,
                'categoria': tarjeta.categoria,
                'mazo_id': tarjeta.mazo.id,
                'proximo_repaso': tarjeta.proximo_repaso.isoformat(),
                'intervalo': tarjeta.intervalo,
                'factor_facilidad': tarjeta.factor_facilidad,
                'repeticiones': tarjeta.repeticiones,
            })
        
        return JsonResponse({
            'success': True,
            'mazos': mazos_data,
            'tarjetas': tarjetas_data,
            'csrfToken': request.META.get('CSRF_COOKIE', '')
        })
    
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)



    """Crear nueva flashcard"""
    usuario = request.user
    
    if getattr(usuario, 'role', '') != 'student':
        return JsonResponse({'success': False, 'message': 'Solo estudiantes pueden crear flashcards'})
    
    try:
        mazo_id = request.POST.get('mazo_id')
        pregunta = request.POST.get('pregunta', '').strip()
        respuesta = request.POST.get('respuesta', '').strip()
        categoria = request.POST.get('categoria', '').strip()
        
        if not mazo_id or not pregunta or not respuesta:
            return JsonResponse({'success': False, 'message': 'Campos requeridos faltantes'})
        
        mazo = Mazo.objects.get(id=mazo_id, usuario=usuario)
        
        tarjeta = Flashcard.objects.create(
            mazo=mazo,
            pregunta=pregunta,
            respuesta=respuesta,
            categoria=categoria,
            proximo_repaso=timezone.now(),
        )
        
        return JsonResponse({'success': True, 'message': 'Flashcard creada', 'id': tarjeta.id})
    
    except Mazo.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Mazo no encontrado'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})


@login_required
@require_http_methods(["POST"])
def crear_mazo(request):
    """Crear nuevo mazo"""
    usuario = request.user
    
    if getattr(usuario, 'role', '') != 'student':
        return JsonResponse({'success': False, 'message': 'Solo estudiantes pueden crear mazos'})
    
    try:
        nombre = request.POST.get('nombre', '').strip()
        descripcion = request.POST.get('descripcion', '').strip()
        
        if not nombre:
            return JsonResponse({'success': False, 'message': 'El nombre es requerido'})
        
        mazo = Mazo.objects.create(
            usuario=usuario,
            nombre=nombre,
            descripcion=descripcion,
        )
        
        return JsonResponse({'success': True, 'message': 'Mazo creado', 'id': mazo.id})
    
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})


@login_required
@require_http_methods(["POST"])
def responder_tarjeta(request):
    """Procesar respuesta a una tarjeta"""
    usuario = request.user
    
    try:
        tarjeta_id = request.POST.get('tarjeta_id')
        dificultad = int(request.POST.get('dificultad', 2))
        
        tarjeta = Flashcard.objects.get(id=tarjeta_id, mazo__usuario=usuario)
        
        # Registrar el historial
        HistorialRepaso.objects.create(
            flashcard=tarjeta,
            usuario=usuario,
            dificultad=dificultad,
        )
        
        # Calcular próximo repaso (lógica de Anki simplificada)
        ahora = timezone.now()
        tarjeta.ultimo_repaso = ahora
        
        if dificultad == 0:  # Otra vez
            tarjeta.intervalo = 1
            tarjeta.repeticiones = 0
        elif dificultad == 1:  # Difícil
            tarjeta.intervalo = max(1, int(tarjeta.intervalo * 1.2))
            tarjeta.repeticiones += 1
        elif dificultad == 2:  # Bien
            tarjeta.intervalo = max(3, int(tarjeta.intervalo * tarjeta.factor_facilidad))
            tarjeta.repeticiones += 1
        else:  # Fácil (3)
            tarjeta.intervalo = max(7, int(tarjeta.intervalo * tarjeta.factor_facilidad * 1.3))
            tarjeta.repeticiones += 1
        
        # Establecer próximo repaso
        tarjeta.proximo_repaso = ahora + timedelta(days=tarjeta.intervalo)
        tarjeta.save()
        
        return JsonResponse({'success': True, 'message': 'Respuesta registrada'})
    
    except Flashcard.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Tarjeta no encontrada'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})


@login_required
@require_http_methods(["POST"])
def editar_mazo(request, mazo_id):
    """Editar un mazo"""
    usuario = request.user
    
    try:
        mazo = Mazo.objects.get(id=mazo_id, usuario=usuario)
        
        nombre = request.POST.get('nombre', '').strip()
        descripcion = request.POST.get('descripcion', '').strip()
        
        if not nombre:
            return JsonResponse({'success': False, 'message': 'El nombre es requerido'})
        
        mazo.nombre = nombre
        mazo.descripcion = descripcion
        mazo.save()
        
        return JsonResponse({'success': True, 'message': 'Mazo actualizado'})
    
    except Mazo.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Mazo no encontrado'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})


@login_required
@require_http_methods(["POST"])
def eliminar_mazo(request, mazo_id):
    """Eliminar un mazo"""
    usuario = request.user
    
    try:
        mazo = Mazo.objects.get(id=mazo_id, usuario=usuario)
        mazo.delete()
        
        return JsonResponse({'success': True, 'message': 'Mazo eliminado'})
    
    except Mazo.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Mazo no encontrado'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})


# ==================== API ENDPOINTS JSON ====================

@login_required
@require_http_methods(["POST"])
def crear_mazo_api(request):
    """API para crear nuevo mazo con JSON"""
    usuario = request.user
    
    if getattr(usuario, 'role', '') != 'student':
        return JsonResponse({'success': False, 'error': 'Solo estudiantes pueden crear mazos'}, status=403)
    
    try:
        data = json.loads(request.body)
        nombre = data.get('nombre', '').strip()
        descripcion = data.get('descripcion', '').strip()
        
        if not nombre:
            return JsonResponse({'success': False, 'error': 'El nombre es requerido'}, status=400)
        
        mazo = Mazo.objects.create(
            usuario=usuario,
            nombre=nombre,
            descripcion=descripcion,
        )
        
        return JsonResponse({
            'success': True,
            'message': '¡Mazo creado exitosamente!',
            'id': mazo.id,
            'nombre': mazo.nombre,
        })
    
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'JSON inválido'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@login_required
@require_http_methods(["DELETE"])
def eliminar_mazo_api(request, mazo_id):
    """API para eliminar un mazo con JSON"""
    usuario = request.user
    
    try:
        mazo = Mazo.objects.get(id=mazo_id, usuario=usuario)
        
        # Validar que el mazo no tenga flashcards
        if mazo.tarjetas.exists():
            return JsonResponse({
                'success': False,
                'error': 'No se puede eliminar el mazo porque contiene flashcards. Elimínalas primero.',
            }, status=400)
        
        mazo.delete()
        
        return JsonResponse({
            'success': True,
            'message': '¡Mazo eliminado exitosamente!',
        })
    
    except Mazo.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Mazo no encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@login_required
@require_http_methods(["PUT"])
def editar_mazo_api(request, mazo_id):
    """API para editar un mazo con JSON"""
    usuario = request.user
    
    try:
        data = json.loads(request.body)
        mazo = Mazo.objects.get(id=mazo_id, usuario=usuario)
        
        nombre = data.get('nombre', '').strip()
        descripcion = data.get('descripcion', '').strip()
        
        if not nombre:
            return JsonResponse({'success': False, 'error': 'El nombre es requerido'}, status=400)
        
        mazo.nombre = nombre
        mazo.descripcion = descripcion
        mazo.save()
        
        return JsonResponse({
            'success': True,
            'message': '¡Mazo actualizado exitosamente!',
            'id': mazo.id,
            'nombre': mazo.nombre,
        })
    
    except Mazo.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Mazo no encontrado'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'JSON inválido'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@login_required
@require_http_methods(["POST"])
def crear_flashcard_api(request):
    """API para crear nueva flashcard con JSON"""
    usuario = request.user
    
    if getattr(usuario, 'role', '') != 'student':
        return JsonResponse({'success': False, 'error': 'Solo estudiantes pueden crear flashcards'}, status=403)
    
    try:
        data = json.loads(request.body)
        mazo_id = data.get('mazo_id')
        pregunta = data.get('pregunta', '').strip()
        respuesta = data.get('respuesta', '').strip()
        categoria = data.get('categoria', '').strip()
        
        if not mazo_id or not pregunta or not respuesta:
            return JsonResponse({'success': False, 'error': 'Campos requeridos faltantes'}, status=400)
        
        mazo = Mazo.objects.get(id=mazo_id, usuario=usuario)
        
        tarjeta = Flashcard.objects.create(
            mazo=mazo,
            pregunta=pregunta,
            respuesta=respuesta,
            categoria=categoria,
            proximo_repaso=timezone.now(),
        )
        
        return JsonResponse({
            'success': True,
            'error': None,
            'id': tarjeta.id,
        })
    
    except Mazo.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Mazo no encontrado'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'JSON inválido'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@login_required
@require_http_methods(["PUT"])
def editar_flashcard_api(request, flashcard_id):
    """API para editar una flashcard con JSON"""
    usuario = request.user
    
    try:
        data = json.loads(request.body)
        tarjeta = Flashcard.objects.get(id=flashcard_id, mazo__usuario=usuario)
        
        pregunta = data.get('pregunta', '').strip()
        respuesta = data.get('respuesta', '').strip()
        categoria = data.get('categoria', '').strip()
        
        if not pregunta:
            return JsonResponse({'success': False, 'error': 'La pregunta es requerida'}, status=400)
        
        if not respuesta:
            return JsonResponse({'success': False, 'error': 'La respuesta es requerida'}, status=400)
        
        tarjeta.pregunta = pregunta
        tarjeta.respuesta = respuesta
        tarjeta.categoria = categoria
        tarjeta.save()
        
        return JsonResponse({
            'success': True,
            'error': None,
            'id': tarjeta.id,
        })
    
    except Flashcard.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Flashcard no encontrada'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'JSON inválido'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@login_required
@require_http_methods(["DELETE"])
def eliminar_flashcard_api(request, flashcard_id):
    """API para eliminar una flashcard con JSON"""
    usuario = request.user
    
    try:
        tarjeta = Flashcard.objects.get(id=flashcard_id, mazo__usuario=usuario)
        tarjeta.delete()
        
        return JsonResponse({
            'success': True,
            'error': None,
        })
    
    except Flashcard.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Flashcard no encontrada'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)
