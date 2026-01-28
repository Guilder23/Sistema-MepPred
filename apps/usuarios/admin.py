from django.contrib import admin
from .models import UsuarioAuditoria


@admin.register(UsuarioAuditoria)
class UsuarioAuditoriaAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'accion', 'realizado_por', 'fecha')
    list_filter = ('accion', 'fecha')
    search_fields = ('usuario__email', 'realizado_por__email')
    readonly_fields = ('usuario', 'accion', 'realizado_por', 'fecha', 'cambios')
    date_hierarchy = 'fecha'

