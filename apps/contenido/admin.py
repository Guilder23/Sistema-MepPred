from django.contrib import admin
from .models import Contenido, VideoContenido, ProgresoContenido


class VideoContenidoInline(admin.TabularInline):
    model = VideoContenido
    extra = 1


@admin.register(Contenido)
class ContenidoAdmin(admin.ModelAdmin):
    list_display = ['orden', 'titulo', 'tema', 'nivel_curso', 'prerequisito', 'estado', 'publicacion', 'fecha_creacion']
    list_filter = ['estado', 'publicacion', 'tema', 'es_obligatorio']
    search_fields = ['titulo', 'descripcion', 'tema']
    inlines = [VideoContenidoInline]
    readonly_fields = ['fecha_creacion', 'fecha_edicion']
    
    fieldsets = (
        ('Información Principal', {
            'fields': ('titulo', 'descripcion', 'contenido_tema')
        }),
        ('Clasificación', {
            'fields': ('tema', 'nivel_curso')
        }),
        ('Sistema de Progreso', {
            'fields': ('orden', 'prerequisito', 'es_obligatorio'),
            'description': 'Configura el orden y los prerequisitos para el aprendizaje secuencial.'
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


@admin.register(ProgresoContenido)
class ProgresoContenidoAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'contenido', 'completado', 'porcentaje_avance', 'fecha_inicio', 'fecha_completado']
    list_filter = ['completado', 'fecha_inicio', 'fecha_completado']
    search_fields = ['usuario__username', 'usuario__email', 'contenido__titulo']
    readonly_fields = ['fecha_inicio']
    
    fieldsets = (
        ('Información', {
            'fields': ('usuario', 'contenido')
        }),
        ('Progreso', {
            'fields': ('completado', 'porcentaje_avance')
        }),
        ('Fechas', {
            'fields': ('fecha_inicio', 'fecha_completado')
        }),
    )
