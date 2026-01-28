from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.suscripciones.models import Suscripcion, HistorialSuscripcion


class Command(BaseCommand):
    help = 'Marca como vencidas las suscripciones que han expirado'

    def handle(self, *args, **options):
        ahora = timezone.now()
        
        # Buscar suscripciones aprobadas que ya vencieron
        suscripciones_vencidas = Suscripcion.objects.filter(
            estado='APROBADO',
            fecha_vencimiento__lt=ahora
        )
        
        count = 0
        for suscripcion in suscripciones_vencidas:
            # Registrar en historial
            HistorialSuscripcion.objects.create(
                suscripcion=suscripcion,
                estado_anterior='APROBADO',
                estado_nuevo='VENCIDO',
                modificado_por=None,
                observaciones='Marcada como vencida automáticamente'
            )
            
            # Actualizar estado
            suscripcion.estado = 'VENCIDO'
            suscripcion.save()
            count += 1
        
        if count > 0:
            self.stdout.write(
                self.style.SUCCESS(f'Se marcaron {count} suscripciones como vencidas')
            )
        else:
            self.stdout.write('No hay suscripciones vencidas para procesar')
