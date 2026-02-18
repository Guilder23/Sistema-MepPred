from django.contrib import admin
from .models import Tema


@admin.register(Tema)
class TemaAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'materia', 'requiere_suscripcion', 'created_at')
    search_fields = ('nombre', 'materia__nombre')
    list_filter = ('requiere_suscripcion', 'materia', 'created_at')
    readonly_fields = ('created_at', 'updated_at')
