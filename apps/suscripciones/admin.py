from django.contrib import admin
from .models import ConfiguracionPago, Suscripcion, HistorialSuscripcion


@admin.register(ConfiguracionPago)
class ConfiguracionPagoAdmin(admin.ModelAdmin):
    list_display = ['administrador', 'actualizado_en']
    fields = ['administrador', 'qr_pago', 'descripcion']


@admin.register(Suscripcion)
class SuscripcionAdmin(admin.ModelAdmin):
    list_display = ['estudiante', 'estado', 'fecha_solicitud', 'fecha_vencimiento', 'aprobado_por']
    list_filter = ['estado', 'fecha_solicitud']
    search_fields = ['estudiante__username', 'estudiante__first_name', 'estudiante__last_name']
    readonly_fields = ['fecha_solicitud', 'fecha_aprobacion', 'actualizado_en']
    
    fieldsets = (
        ('Información del Estudiante', {
            'fields': ('estudiante', 'comprobante')
        }),
        ('Estado', {
            'fields': ('estado', 'fecha_solicitud', 'fecha_aprobacion', 'fecha_vencimiento')
        }),
        ('Aprobación', {
            'fields': ('aprobado_por', 'motivo_rechazo')
        }),
    )


@admin.register(HistorialSuscripcion)
class HistorialSuscripcionAdmin(admin.ModelAdmin):
    list_display = ['suscripcion', 'estado_anterior', 'estado_nuevo', 'modificado_por', 'fecha']
    list_filter = ['fecha', 'estado_anterior', 'estado_nuevo']
    search_fields = ['suscripcion__estudiante__username']
    readonly_fields = ['suscripcion', 'estado_anterior', 'estado_nuevo', 'modificado_por', 'fecha']
