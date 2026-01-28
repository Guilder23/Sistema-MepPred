from django.contrib import admin
from .models import Materia


@admin.register(Materia)
class MateriaAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'requiere_suscripcion', 'created_at')
    search_fields = ('nombre',)
    list_filter = ('requiere_suscripcion', 'created_at')
    readonly_fields = ('created_at', 'updated_at')
