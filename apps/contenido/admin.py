from django.contrib import admin
from .models import Contenido, VideoContenido


class VideoContenidoInline(admin.TabularInline):
    model = VideoContenido
    extra = 1


@admin.register(Contenido)
class ContenidoAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'materia', 'nivel_curso', 'estado', 'publicacion', 'fecha_creacion']
    list_filter = ['estado', 'publicacion', 'materia']
    search_fields = ['titulo', 'descripcion', 'materia']
    inlines = [VideoContenidoInline]
    readonly_fields = ['fecha_creacion', 'fecha_edicion']
    
    fieldsets = (
        ('Información Principal', {
            'fields': ('titulo', 'descripcion', 'contenido_tema')
        }),
        ('Clasificación', {
            'fields': ('materia', 'nivel_curso')
        }),
        ('Estado y Publicación', {
            'fields': ('estado', 'publicacion')
        }),
        ('Auditoría', {
            'fields': ('creado_por', 'editado_por', 'fecha_creacion', 'fecha_edicion')
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.creado_por = request.user
        obj.editado_por = request.user
        super().save_model(request, obj, form, change)


@admin.register(VideoContenido)
class VideoContenidoAdmin(admin.ModelAdmin):
    list_display = ['contenido', 'enlace', 'orden']
    list_filter = ['contenido']
    search_fields = ['contenido__titulo', 'enlace']
