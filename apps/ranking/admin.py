from django.contrib import admin
from .models import EstadisticaEstudiante


@admin.register(EstadisticaEstudiante)
class EstadisticaEstudianteAdmin(admin.ModelAdmin):
    list_display = ('estudiante', 'promedio_general', 'total_examenes', 'total_aprobados', 'mejor_nota', 'ultima_actualizacion')
    list_filter = ('ultima_actualizacion',)
    search_fields = ('estudiante__username', 'estudiante__first_name', 'estudiante__last_name', 'estudiante__email')
    readonly_fields = ('ultima_actualizacion',)
    ordering = ['-promedio_general', '-total_examenes']
    
    def has_add_permission(self, request):
        # Las estadísticas se actualizan automáticamente
        return False
