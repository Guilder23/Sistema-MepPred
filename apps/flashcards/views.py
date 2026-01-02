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
    
    return render(request, 'flashcards/flashcards/flashcards.html', context)


@login_required
@require_http_methods(["POST"])
def crear_flashcard(request):
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
