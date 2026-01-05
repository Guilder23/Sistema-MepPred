from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.template.loader import render_to_string
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from .models import MazoPremium, FlashcardPremium



def _es_admin(usuario) -> bool:
    return usuario.is_superuser or getattr(usuario, 'role', '') == 'admin'


@login_required
def dashboard(request):
    """Panel de gestión de flashcards premium."""
    if not _es_admin(request.user):
        return render(request, '404.html', status=403)

    mazos_premium = MazoPremium.objects.all()
    return render(
        request,
        'flashcards_premium/flashcards_premium.html',
        {'mazos_premium': mazos_premium},
    )


@login_required
@require_http_methods(["GET"])
def api_listar_mazos(request):
    if not _es_admin(request.user):
        return JsonResponse({'error': 'No tienes permisos'}, status=403)

    mazos = MazoPremium.objects.all()
    mazos_data = []
    for mazo in mazos:
        tarjetas = list(
            mazo.tarjetas.all().values('id', 'pregunta', 'respuesta', 'categoria')
        )
        mazos_data.append(
            {
                'id': mazo.id,
                'nombre': mazo.nombre,
                'descripcion': mazo.descripcion,
                'tarjetas_count': mazo.contar_tarjetas(),
                'tarjetas': tarjetas,
                'created_at': mazo.created_at.strftime('%d/%m/%Y %H:%M'),
            }
        )

    return JsonResponse({'success': True, 'mazos': mazos_data})


@login_required
@require_http_methods(["POST"])
def api_crear_mazo(request):
    if not _es_admin(request.user):
        return JsonResponse({'error': 'No tienes permisos'}, status=403)

    nombre = request.POST.get('nombre', '').strip()
    descripcion = request.POST.get('descripcion', '').strip()

    if not nombre:
        return JsonResponse({'success': False, 'error': 'El nombre es requerido'})

    mazo = MazoPremium.objects.create(
        creado_por=request.user,
        nombre=nombre,
        descripcion=descripcion,
    )

    return JsonResponse(
        {
            'success': True,
            'mazo': {
                'id': mazo.id,
                'nombre': mazo.nombre,
                'descripcion': mazo.descripcion,
            },
        }
    )


@login_required
@require_http_methods(["POST"])
def api_editar_mazo(request, mazo_id):
    if not _es_admin(request.user):
        return JsonResponse({'error': 'No tienes permisos'}, status=403)

    nombre = request.POST.get('nombre', '').strip()
    descripcion = request.POST.get('descripcion', '').strip()

    if not nombre:
        return JsonResponse({'success': False, 'error': 'El nombre es requerido'})

    mazo = get_object_or_404(MazoPremium, id=mazo_id)
    mazo.nombre = nombre
    mazo.descripcion = descripcion
    mazo.save()

    return JsonResponse(
        {
            'success': True,
            'mazo': {
                'id': mazo.id,
                'nombre': mazo.nombre,
                'descripcion': mazo.descripcion,
            },
        }
    )


@login_required
@require_http_methods(["DELETE"])
def api_eliminar_mazo(request, mazo_id):
    if not _es_admin(request.user):
        return JsonResponse({'error': 'No tienes permisos'}, status=403)

    mazo = get_object_or_404(MazoPremium, id=mazo_id)
    mazo.delete()
    return JsonResponse({'success': True})


@login_required
@require_http_methods(["POST"])
def api_crear_flashcard(request):
    if not _es_admin(request.user):
        return JsonResponse({'error': 'No tienes permisos'}, status=403)

    mazo_id = request.POST.get('mazo_id')
    pregunta = request.POST.get('pregunta', '').strip()
    respuesta = request.POST.get('respuesta', '').strip()
    categoria = request.POST.get('categoria', '').strip()

    if not all([mazo_id, pregunta, respuesta]):
        return JsonResponse({'success': False, 'error': 'Todos los campos son requeridos'})

    mazo = get_object_or_404(MazoPremium, id=mazo_id)
    flashcard = FlashcardPremium.objects.create(
        mazo=mazo,
        pregunta=pregunta,
        respuesta=respuesta,
        categoria=categoria,
        proximo_repaso=timezone.now(),
    )

    return JsonResponse(
        {
            'success': True,
            'flashcard': {
                'id': flashcard.id,
                'pregunta': flashcard.pregunta,
                'respuesta': flashcard.respuesta,
                'categoria': flashcard.categoria,
            },
        }
    )


@login_required
@require_http_methods(["POST"])
def api_editar_flashcard(request, flashcard_id):
    if not _es_admin(request.user):
        return JsonResponse({'error': 'No tienes permisos'}, status=403)

    pregunta = request.POST.get('pregunta', '').strip()
    respuesta = request.POST.get('respuesta', '').strip()
    categoria = request.POST.get('categoria', '').strip()

    if not all([pregunta, respuesta]):
        return JsonResponse({'success': False, 'error': 'Pregunta y respuesta son requeridos'})

    flashcard = get_object_or_404(FlashcardPremium, id=flashcard_id)
    flashcard.pregunta = pregunta
    flashcard.respuesta = respuesta
    flashcard.categoria = categoria
    flashcard.save()

    return JsonResponse(
        {
            'success': True,
            'flashcard': {
                'id': flashcard.id,
                'pregunta': flashcard.pregunta,
                'respuesta': flashcard.respuesta,
                'categoria': flashcard.categoria,
            },
        }
    )


@login_required
@require_http_methods(["DELETE"])
def api_eliminar_flashcard(request, flashcard_id):
    if not _es_admin(request.user):
        return JsonResponse({'error': 'No tienes permisos'}, status=403)

    flashcard = get_object_or_404(FlashcardPremium, id=flashcard_id)
    flashcard.delete()
    return JsonResponse({'success': True})


# Vistas para MazoPremium


@login_required
def lista_mazos_premium(request):
    """Vista para mostrar la tabla de gestión de mazos"""
    if not _es_admin(request.user):
        return render(request, '404.html', status=403)
    
    mazos = MazoPremium.objects.all()
    return render(request, 'flashcards_premium/mazos/mazos.html', {'mazos': mazos})


@login_required
def detalle_mazo_premium(request, pk):
    """Vista para mostrar los detalles de un mazo"""
    mazo = get_object_or_404(MazoPremium, pk=pk)
    return JsonResponse({
        'success': True,
        'mazo': {
            'id': mazo.id,
            'nombre': mazo.nombre,
            'descripcion': mazo.descripcion,
            'total_flashcards': mazo.contar_tarjetas(),
            'fecha_creacion': mazo.created_at.strftime('%d/%m/%Y %H:%M'),
        }
    })


@login_required
def crear_mazo_premium(request):
    """Redirige a API - esta vista ya no se usa con formularios"""
    return redirect('flashcards_premium:dashboard')


@login_required
def editar_mazo_premium(request, pk):
    """Redirige a API - esta vista ya no se usa con formularios"""
    return redirect('flashcards_premium:dashboard')


@login_required
def eliminar_mazo_premium(request, pk):
    """Redirige a API - esta vista ya no se usa con formularios"""
    return redirect('flashcards_premium:dashboard')


@login_required
def lista_flashcards_premium(request):
    """Vista para mostrar la tabla de gestión de flashcards"""
    if not _es_admin(request.user):
        return render(request, '404.html', status=403)
    
    flashcards = FlashcardPremium.objects.select_related('mazo').all()
    mazos = MazoPremium.objects.all()
    return render(request, 'flashcards_premium/flashcards/flashcards.html', {
        'flashcards': flashcards,
        'mazos': mazos
    })


# Vistas para FlashcardPremium


@login_required
def crear_flashcard_premium(request, mazo_pk):
    """Redirige a API - esta vista ya no se usa con formularios"""
    return redirect('flashcards_premium:dashboard')


@login_required
def editar_flashcard_premium(request, pk):
    """Redirige a API - esta vista ya no se usa con formularios"""
    return redirect('flashcards_premium:dashboard')


@login_required
def eliminar_flashcard_premium(request, pk):
    """Redirige a API - esta vista ya no se usa con formularios"""
    return redirect('flashcards_premium:dashboard')
