from django.contrib import admin
from .models import Examen, Pregunta, Enunciado, Opcion, IntentoExamen


class EnunciadoInline(admin.TabularInline):
    model = Enunciado
    extra = 1
    fields = ('numero', 'texto', 'es_verdadero')


class OpcionInline(admin.TabularInline):
    model = Opcion
    extra = 4
    fields = ('letra', 'descripcion', 'es_correcta')


class PreguntaInline(admin.StackedInline):
    model = Pregunta
    extra = 0
    fields = ('texto', 'orden')
    show_change_link = True


@admin.register(Examen)
class ExamenAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'tema', 'duracion_minutos', 'activo', 'created_at')
    list_filter = ('tema', 'es_premium', 'activo', 'created_at')
    search_fields = ('titulo', 'descripcion')
    inlines = [PreguntaInline]
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Pregunta)
class PreguntaAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'examen', 'orden')
    list_filter = ('examen',)
    inlines = [EnunciadoInline, OpcionInline]


@admin.register(Enunciado)
class EnunciadoAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'pregunta', 'numero', 'es_verdadero')
    list_filter = ('es_verdadero',)


@admin.register(Opcion)
class OpcionAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'pregunta', 'letra', 'es_correcta')
    list_filter = ('es_correcta',)


@admin.register(IntentoExamen)
class IntentoExamenAdmin(admin.ModelAdmin):
    list_display = ('estudiante', 'examen', 'numero_intento', 'nota', 'porcentaje', 'aprobado', 'fecha_intento')
    list_filter = ('aprobado', 'examen', 'fecha_intento')
    search_fields = ('estudiante__username', 'estudiante__email', 'examen__titulo')
    readonly_fields = ('fecha_intento',)
    ordering = ('-fecha_intento',)
