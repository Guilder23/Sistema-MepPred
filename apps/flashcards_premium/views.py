from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.template.loader import render_to_string
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from .models import MazoPremium, FlashcardPremium
from apps.suscripciones.decorators import tiene_suscripcion_activa


def _es_admin(usuario) -> bool:
    return usuario.is_superuser or getattr(usuario, 'role', '') == 'admin'


@login_required
def dashboard(request):
    """Panel de gestión de flashcards premium (solo admin)."""
    if not _es_admin(request.user):
        return render(request, '404.html', status=403)

    mazos_premium = MazoPremium.objects.all()
    return render(
        request,
        'flashcards_premium/flashcards_premium.html',
        {'mazos_premium': mazos_premium},
    )


@login_required
def modo_estudio(request):
    """Vista de estudio de flashcards premium para estudiantes con suscripción activa."""
    # Solo estudiantes premium (no admins)
    if not (tiene_suscripcion_activa(request.user) and not request.user.is_staff):
        return render(request, '404.html', status=403)
    
    return render(request, 'flashcards_premium/estudiante/modo_estudio.html')


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
                'materia_id': mazo.tema.materia_id if mazo.tema and mazo.tema.materia else '',
                'materia_nombre': mazo.tema.materia.nombre if mazo.tema and mazo.tema.materia else 'Sin materia',
                'tema_id': mazo.tema_id,
                'tema_nombre': mazo.tema.nombre if mazo.tema else 'Sin tema',
                'tarjetas_count': mazo.contar_tarjetas(),
                'tarjetas': tarjetas,
                'created_at': mazo.created_at.strftime('%d/%m/%Y %H:%M'),
            }
        )

    return JsonResponse({'success': True, 'mazos': mazos_data})


@login_required
@require_http_methods(["GET"])
def api_mazos_estudiante(request):
    """API para estudiantes premium que devuelve todos los mazos con sus flashcards filtrados por materia y/o tema."""
    # Verificar que el usuario tenga suscripción activa
    if not tiene_suscripcion_activa(request.user):
        return JsonResponse({'error': 'Necesitas una suscripción activa'}, status=403)
    
    # Obtener los filtros de materia y tema desde los parámetros GET
    materia_id = request.GET.get('materia_id', None)
    tema_id = request.GET.get('tema_id', None)
    
    # Obtener mazos
    mazos_query = MazoPremium.objects.all()
    
    if tema_id:
        try:
            mazos_query = mazos_query.filter(tema_id=int(tema_id))
        except (ValueError, TypeError):
            pass
    elif materia_id:
        # Si no hay tema_id pero hay materia_id, filtrar por temas de esa materia
        try:
            mazos_query = mazos_query.filter(tema__materia_id=int(materia_id))
        except (ValueError, TypeError):
            pass
    
    mazos_data = []
    ahora = timezone.now()
    for mazo in mazos_query:
        # Filtrar solo tarjetas que están habilitadas para estudiar (proximo_repaso <= ahora)
        tarjetas = list(
            mazo.tarjetas.filter(proximo_repaso__lte=ahora).values('id', 'pregunta', 'respuesta', 'categoria')
        )
        mazos_data.append(
            {
                'id': mazo.id,
                'nombre': mazo.nombre,
                'descripcion': mazo.descripcion,
                'tema_id': mazo.tema_id,
                'tema_nombre': mazo.tema.nombre if mazo.tema else 'Sin tema',
                'tarjetas_count': mazo.contar_tarjetas(),
                'tarjetas': tarjetas,
            }
        )

    return JsonResponse({'success': True, 'mazos': mazos_data})


@login_required
@require_http_methods(["GET"])
def api_temas_flashcards(request):
    """API para obtener materias y temas que tienen flashcards premium."""
    # Verificar que el usuario tenga suscripción activa
    if not tiene_suscripcion_activa(request.user):
        return JsonResponse({'error': 'Necesitas una suscripción activa'}, status=403)
    
    from apps.temas.models import Tema
    from apps.materias_nueva.models import Materia
    
    # Obtener temas que tengan al menos un mazo premium
    temas_con_mazos = Tema.objects.filter(mazos_premium__isnull=False).distinct().prefetch_related('materia')
    
    # Agrupar temas por materia
    materias_dict = {}
    for tema in temas_con_mazos:
        materia_id = tema.materia.id
        if materia_id not in materias_dict:
            materias_dict[materia_id] = {
                'id': materia_id,
                'nombre': tema.materia.nombre,
                'temas': []
            }
        materias_dict[materia_id]['temas'].append({
            'id': tema.id,
            'nombre': tema.nombre
        })
    
    materias_data = list(materias_dict.values())
    
    return JsonResponse({'success': True, 'materias': materias_data})


@login_required
@require_http_methods(["POST"])
def api_crear_mazo(request):
    if not _es_admin(request.user):
        return JsonResponse({'error': 'No tienes permisos'}, status=403)

    nombre = request.POST.get('nombre', '').strip()
    descripcion = request.POST.get('descripcion', '').strip()
    tema_id = request.POST.get('tema_id', '').strip()
    # materia_id es ignorado - el tema ya contiene la referencia a la materia

    if not nombre:
        return JsonResponse({'success': False, 'error': 'El nombre es requerido'})

    tema = None
    if tema_id:
        from apps.temas.models import Tema
        try:
            tema = Tema.objects.get(id=int(tema_id))
        except (Tema.DoesNotExist, ValueError):
            pass

    mazo = MazoPremium.objects.create(
        creado_por=request.user,
        nombre=nombre,
        descripcion=descripcion,
        tema=tema,
    )

    return JsonResponse(
        {
            'success': True,
            'mazo': {
                'id': mazo.id,
                'nombre': mazo.nombre,
                'descripcion': mazo.descripcion,
                'materia_id': mazo.tema.materia_id if mazo.tema and mazo.tema.materia else '',
                'tema_id': mazo.tema_id,
                'tema_nombre': mazo.tema.nombre if mazo.tema else None,
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
    tema_id = request.POST.get('tema_id', '').strip()

    if not nombre:
        return JsonResponse({'success': False, 'error': 'El nombre es requerido'})

    mazo = get_object_or_404(MazoPremium, id=mazo_id)
    mazo.nombre = nombre
    mazo.descripcion = descripcion
    
    if tema_id:
        from apps.temas.models import Tema
        try:
            mazo.tema = Tema.objects.get(id=int(tema_id))
        except (Tema.DoesNotExist, ValueError):
            mazo.tema = None
    else:
        mazo.tema = None
    
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

    mazo_id = request.POST.get('mazo_id', '').strip()
    pregunta = request.POST.get('pregunta', '').strip()
    respuesta = request.POST.get('respuesta', '').strip()
    categoria = request.POST.get('categoria', '').strip()

    if not all([mazo_id, pregunta, respuesta]):
        return JsonResponse({'success': False, 'error': 'Mazo, pregunta y respuesta son requeridos'})

    flashcard = get_object_or_404(FlashcardPremium, id=flashcard_id)
    mazo = get_object_or_404(MazoPremium, id=mazo_id)
    
    flashcard.mazo = mazo
    flashcard.pregunta = pregunta
    flashcard.respuesta = respuesta
    flashcard.categoria = categoria
    flashcard.save()

    return JsonResponse(
        {
            'success': True,
            'flashcard': {
                'id': flashcard.id,
                'mazo_id': flashcard.mazo.id,
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


@login_required
@require_http_methods(["POST"])
def api_marcar_respuesta(request):
    """API para marcar una respuesta y actualizar el próximo repaso."""
    # Verificar que el usuario tenga suscripción activa
    if not tiene_suscripcion_activa(request.user):
        return JsonResponse({'error': 'Necesitas una suscripción activa'}, status=403)
    
    try:
        flashcard_id = request.POST.get('flashcard_id')
        dias = int(request.POST.get('dias', 1))
        minutos = request.POST.get('minutos')
        
        if not flashcard_id:
            return JsonResponse({'success': False, 'error': 'flashcard_id es requerido'})
        
        flashcard = get_object_or_404(FlashcardPremium, id=flashcard_id)
        
        # Calcular próximo repaso
        if minutos:
            # Si hay minutos, calcular desde ahora
            minutos = int(minutos)
            proximo_repaso = timezone.now() + timezone.timedelta(minutes=minutos)
        else:
            # Si es en días
            proximo_repaso = timezone.now() + timezone.timedelta(days=dias)
        
        # Actualizar la tarjeta
        flashcard.proximo_repaso = proximo_repaso
        flashcard.repeticiones += 1
        flashcard.ultimo_repaso = timezone.now()
        flashcard.save()
        
        return JsonResponse({'success': True, 'message': 'Respuesta registrada'})
    
    except (ValueError, TypeError) as e:
        return JsonResponse({'success': False, 'error': str(e)})

