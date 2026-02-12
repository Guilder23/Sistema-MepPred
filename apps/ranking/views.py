from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from .models import EstadisticaEstudiante
from apps.evaluaciones.models import IntentoExamen
from django.db.models import Avg, Count, Max, Q
from django.utils import timezone
from datetime import timedelta


def ranking_estudiantes(request):
    """Vista pública del ranking de estudiantes"""
    periodo = request.GET.get('periodo', 'todo')  # dia, semana, mes, todo
    materia_id = request.GET.get('materia', None)  # Filtro por materia
    tema_id = request.GET.get('tema', None)  # Filtro por tema
    examen_id = request.GET.get('examen', None)  # Filtro por examen
    
    # Obtener el ranking según los filtros
    ranking_data = EstadisticaEstudiante.obtener_ranking(
        periodo=periodo, 
        materia_id=materia_id,
        tema_id=tema_id,
        examen_id=examen_id,
        limite=100
    )
    
    # Convertir a lista para agregar posiciones
    ranking_list = list(ranking_data)
    for index, item in enumerate(ranking_list, start=1):
        item['posicion'] = index
        # Calcular tasa de aprobación
        if item['total_examenes'] > 0:
            item['tasa_aprobacion'] = (item['total_aprobados'] / item['total_examenes']) * 100
        else:
            item['tasa_aprobacion'] = 0
    
    # Verificar si el usuario actual tiene intentos aprobados que NO cuentan para ranking
    fuera_de_ranking = False
    if request.user.is_authenticated:
        # Filtrar por la materia seleccionada (si hay)
        filtro_materia = {}
        if materia_id:
            filtro_materia['examen__tema__materia_id'] = materia_id
        
        # Verificar si tiene intentos aprobados que no cuentan para ranking en esta materia
        intentos_aprobados_fuera = IntentoExamen.objects.filter(
            estudiante=request.user,
            aprobado=True,
            cuenta_para_ranking=False,
            **filtro_materia
        ).exists()
        
        # Verificar si está en el ranking actual
        esta_en_ranking = any(item['estudiante__id'] == request.user.id for item in ranking_list)
        
        # Solo mostrar mensaje si aprobó fuera del ranking y no está en el ranking
        fuera_de_ranking = intentos_aprobados_fuera and not esta_en_ranking
    
    # Obtener información del período para el título
    periodo_texto = {
        'dia': 'Último Día',
        'semana': 'Última Semana',
        'mes': 'Último Mes',
        'todo': 'Histórico'
    }.get(periodo, 'Histórico')
    
    # Obtener lista de materias para el filtro
    from apps.materias_nueva.models import Materia
    from apps.temas.models import Tema
    from apps.evaluaciones.models import Examen
    
    materias = Materia.objects.all().order_by('nombre')
    
    # Obtener temas si hay materia seleccionada
    temas = []
    if materia_id:
        temas = Tema.objects.filter(materia_id=materia_id).order_by('nombre')
    
    # Obtener exámenes si hay tema seleccionado
    examenes = []
    if tema_id:
        examenes = Examen.objects.filter(tema_id=tema_id, activo=True).order_by('id')
    
    context = {
        'ranking': ranking_list,
        'periodo': periodo,
        'periodo_texto': periodo_texto,
        'materias': materias,
        'temas': temas,
        'examenes': examenes,
        'materia_id': materia_id,
        'tema_id': tema_id,
        'examen_id': examen_id,
        'fuera_de_ranking': fuera_de_ranking,
    }
    
    return render(request, 'ranking/ranking.html', context)


@login_required
def mi_posicion(request):
    """Vista para ver la posición del usuario actual"""
    periodo = request.GET.get('periodo', 'todo')
    
    # Obtener el ranking completo
    ranking_data = list(EstadisticaEstudiante.obtener_ranking(periodo=periodo, limite=1000))
    
    # Buscar la posición del usuario actual
    mi_posicion = None
    for index, item in enumerate(ranking_data, start=1):
        if item['estudiante__id'] == request.user.id:
            mi_posicion = {
                'posicion': index,
                'promedio': item['promedio'],
                'total_examenes': item['total_examenes'],
                'mejor_nota': item['mejor_nota'],
                'total_aprobados': item['total_aprobados']
            }
            break
    
    context = {
        'mi_posicion': mi_posicion,
        'periodo': periodo,
    }
    
    return render(request, 'ranking/mi_posicion.html', context)


def api_filtros_ranking(request):
    """API: Obtener temas y exámenes para los filtros del ranking"""
    try:
        from django.http import JsonResponse
        from apps.temas.models import Tema
        from apps.evaluaciones.models import Examen
        
        materia_id = request.GET.get('materia_id', None)
        tema_id = request.GET.get('tema_id', None)
        
        response_data = {
            'success': True,
            'temas': [],
            'examenes': []
        }
        
        # Obtener temas si hay materia seleccionada
        if materia_id:
            temas = Tema.objects.filter(materia_id=materia_id).values('id', 'nombre').order_by('nombre')
            response_data['temas'] = list(temas)
        
        # Obtener exámenes si hay tema seleccionado
        if tema_id:
            examenes = Examen.objects.filter(tema_id=tema_id, activo=True).values('id', 'titulo').order_by('id')
            response_data['examenes'] = list(examenes)
        
        return JsonResponse(response_data)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)
