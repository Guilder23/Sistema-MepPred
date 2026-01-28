from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.ranking.models import EstadisticaEstudiante

User = get_user_model()


class Command(BaseCommand):
    help = 'Actualiza las estadísticas de todos los estudiantes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--estudiante',
            type=str,
            help='Username de un estudiante específico para actualizar',
        )

    def handle(self, *args, **options):
        estudiante_username = options.get('estudiante')
        
        if estudiante_username:
            # Actualizar un solo estudiante
            try:
                estudiante = User.objects.get(username=estudiante_username)
                EstadisticaEstudiante.actualizar_estadisticas(estudiante)
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Estadísticas actualizadas para {estudiante.username}'
                    )
                )
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(
                        f'✗ Usuario "{estudiante_username}" no encontrado'
                    )
                )
        else:
            # Actualizar todos los estudiantes que tienen intentos de examen
            from apps.evaluaciones.models import IntentoExamen
            
            estudiantes_con_intentos = User.objects.filter(
                intentos_examenes__isnull=False
            ).distinct()
            
            total = estudiantes_con_intentos.count()
            actualizados = 0
            
            self.stdout.write(f'Actualizando estadísticas de {total} estudiantes...')
            
            for estudiante in estudiantes_con_intentos:
                EstadisticaEstudiante.actualizar_estadisticas(estudiante)
                actualizados += 1
                
                if actualizados % 10 == 0:
                    self.stdout.write(f'  Progreso: {actualizados}/{total}')
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Estadísticas actualizadas para {actualizados} estudiantes'
                )
            )
