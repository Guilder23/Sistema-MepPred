from django.db import models
from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, Sum
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


class EstadisticaEstudiante(models.Model):
    """Modelo para almacenar estadísticas agregadas de estudiantes"""
    
    estudiante = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='estadisticas',
        verbose_name="Estudiante"
    )
    total_examenes = models.IntegerField(
        default=0,
        verbose_name="Total de Exámenes Realizados"
    )
    promedio_general = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        verbose_name="Promedio General"
    )
    total_aprobados = models.IntegerField(
        default=0,
        verbose_name="Exámenes Aprobados"
    )
    mejor_nota = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        verbose_name="Mejor Nota"
    )
    ultima_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name="Última Actualización"
    )
    
    class Meta:
        verbose_name = "Estadística de Estudiante"
        verbose_name_plural = "Estadísticas de Estudiantes"
        ordering = ['-promedio_general', '-total_examenes']
    
    def __str__(self):
        return f"{self.estudiante.get_full_name() or self.estudiante.username} - Promedio: {self.promedio_general}"
    
    @classmethod
    def actualizar_estadisticas(cls, estudiante):
        """Actualiza las estadísticas de un estudiante"""
        from apps.evaluaciones.models import IntentoExamen
        
        intentos = IntentoExamen.objects.filter(estudiante=estudiante)
        
        if intentos.exists():
            estadisticas, created = cls.objects.get_or_create(estudiante=estudiante)
            
            estadisticas.total_examenes = intentos.count()
            estadisticas.promedio_general = intentos.aggregate(Avg('nota'))['nota__avg'] or 0
            estadisticas.total_aprobados = intentos.filter(aprobado=True).count()
            estadisticas.mejor_nota = intentos.aggregate(models.Max('nota'))['nota__max'] or 0
            estadisticas.save()
            
            return estadisticas
        return None
    
    @classmethod
    def obtener_ranking(cls, periodo='todo', materia_id=None, tema_id=None, examen_id=None, limite=100):
        """Obtiene el ranking de estudiantes según el período, materia, tema y examen"""
        from apps.evaluaciones.models import IntentoExamen
        
        # Determinar el filtro de fecha
        ahora = timezone.now()
        if periodo == 'dia':
            fecha_desde = ahora - timedelta(days=1)
        elif periodo == 'semana':
            fecha_desde = ahora - timedelta(days=7)
        elif periodo == 'mes':
            fecha_desde = ahora - timedelta(days=30)
        else:
            fecha_desde = None
        
        # Obtener intentos según el período
        # SOLO intentos que cuentan para el ranking (primer intento) Y están aprobados
        intentos = IntentoExamen.objects.select_related('estudiante', 'examen__tema__materia').filter(
            cuenta_para_ranking=True,
            aprobado=True  # SOLO intentos aprobados
        )
        
        if fecha_desde:
            intentos = intentos.filter(fecha_intento__gte=fecha_desde)
        
        # Filtrar por materia si se especifica
        if materia_id:
            intentos = intentos.filter(examen__tema__materia_id=materia_id)
        
        # Filtrar por tema si se especifica
        if tema_id:
            intentos = intentos.filter(examen__tema_id=tema_id)
        
        # Filtrar por examen si se especifica
        if examen_id:
            intentos = intentos.filter(examen_id=examen_id)
        
        # Agrupar por estudiante y calcular promedios
        ranking = intentos.values(
            'estudiante__id',
            'estudiante__username',
            'estudiante__first_name',
            'estudiante__last_name'
        ).annotate(
            promedio=Avg('nota'),
            total_examenes=Count('id'),
            mejor_nota=models.Max('nota'),
            total_aprobados=Count('id', filter=models.Q(aprobado=True))
        ).order_by('-promedio', '-total_examenes')[:limite]
        
        return ranking
