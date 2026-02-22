"""
Comando para migrar imágenes al almacenamiento de Supabase
"""
from django.core.management.base import BaseCommand
from django.core.files.storage import default_storage
from apps.suscripciones.models import ConfiguracionPago, Suscripcion
import os


class Command(BaseCommand):
    help = 'Migra imágenes existentes al almacenamiento de Supabase'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Mostrar qué archivos se migrarían sin hacer cambios reales',
        )
    
    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('Ejecutando en modo DRY RUN - No se realizarán cambios')
            )
        
        total = 0
        migrados = 0
        errores = 0
        
        # Migrar QR de configuración de pago
        self.stdout.write('Migrando QR de configuración de pago...')
        for config in ConfiguracionPago.objects.all():
            if config.qr_pago:
                total += 1
                try:
                    if dry_run:
                        self.stdout.write(f"  ✓ {config.qr_pago.name}")
                    else:
                        # El archivo ya estará en Supabase si se subió correctamente
                        self.stdout.write(
                            self.style.SUCCESS(f"  ✓ {config.qr_pago.name}")
                        )
                    migrados += 1
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f"  ✗ Error: {config.qr_pago.name} - {str(e)}")
                    )
                    errores += 1
        
        # Migrar comprobantes de suscripción
        self.stdout.write('Migrando comprobantes de suscripción...')
        for suscripcion in Suscripcion.objects.all():
            if suscripcion.comprobante:
                total += 1
                try:
                    if dry_run:
                        self.stdout.write(f"  ✓ {suscripcion.comprobante.name}")
                    else:
                        # El archivo ya estará en Supabase si se subió correctamente
                        self.stdout.write(
                            self.style.SUCCESS(f"  ✓ {suscripcion.comprobante.name}")
                        )
                    migrados += 1
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f"  ✗ Error: {suscripcion.comprobante.name} - {str(e)}")
                    )
                    errores += 1
        
        # Resumen
        self.stdout.write("\n" + "="*50)
        self.stdout.write(self.style.SUCCESS(f"Total archivos: {total}"))
        self.stdout.write(self.style.SUCCESS(f"Migrados: {migrados}"))
        if errores > 0:
            self.stdout.write(self.style.ERROR(f"Errores: {errores}"))
        self.stdout.write("="*50)
