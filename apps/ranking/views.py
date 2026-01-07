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
    
    # Obtener el ranking según el período
    ranking_data = EstadisticaEstudiante.obtener_ranking(periodo=periodo, limite=100)
    
    # Convertir a lista para agregar posiciones
    ranking_list = list(ranking_data)
    for index, item in enumerate(ranking_list, start=1):
        item['posicion'] = index
        # Calcular tasa de aprobación
        if item['total_examenes'] > 0:
            item['tasa_aprobacion'] = (item['total_aprobados'] / item['total_examenes']) * 100
        else:
            item['tasa_aprobacion'] = 0
    
    # Obtener información del período para el título
    periodo_texto = {
        'dia': 'Último Día',
        'semana': 'Última Semana',
        'mes': 'Último Mes',
        'todo': 'Histórico'
    }.get(periodo, 'Histórico')
    
    context = {
        'ranking': ranking_list,
        'periodo': periodo,
        'periodo_texto': periodo_texto,
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
