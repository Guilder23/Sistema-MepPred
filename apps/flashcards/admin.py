from django.contrib import admin
from .models import Mazo, Flashcard, HistorialRepaso


@admin.register(Mazo)
class MazoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'usuario', 'materia', 'created_at', 'contar_tarjetas', 'contar_vencidas')
    list_filter = ('created_at', 'usuario', 'materia')
    search_fields = ('nombre', 'usuario__username', 'materia__nombre')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Flashcard)
class FlashcardAdmin(admin.ModelAdmin):
    list_display = ('pregunta_corta', 'mazo', 'categoria', 'repeticiones', 'factor_facilidad', 'proximo_repaso')
    list_filter = ('mazo', 'categoria', 'created_at', 'proximo_repaso')
    search_fields = ('pregunta', 'respuesta', 'categoria')
    readonly_fields = ('created_at', 'updated_at')
    
    def pregunta_corta(self, obj):
        return obj.pregunta[:50] + '...' if len(obj.pregunta) > 50 else obj.pregunta
    pregunta_corta.short_description = 'Pregunta'


@admin.register(HistorialRepaso)
class HistorialRepasoAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'flashcard_corta', 'dificultad', 'fecha_repaso')
    list_filter = ('usuario', 'dificultad', 'fecha_repaso')
    search_fields = ('usuario__username', 'flashcard__pregunta')
    readonly_fields = ('fecha_repaso',)
    
    def flashcard_corta(self, obj):
        return obj.flashcard.pregunta[:40] + '...' if len(obj.flashcard.pregunta) > 40 else obj.flashcard.pregunta
    flashcard_corta.short_description = 'Flashcard'
