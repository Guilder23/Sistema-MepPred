from django.contrib import admin

from .models import MazoPremium, FlashcardPremium


@admin.register(MazoPremium)
class MazoPremiumAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'tema', 'creado_por', 'created_at')
    search_fields = ('nombre', 'descripcion', 'tema__nombre')
    list_filter = ('created_at', 'tema')


@admin.register(FlashcardPremium)
class FlashcardPremiumAdmin(admin.ModelAdmin):
    list_display = ('pregunta_resumida', 'mazo', 'categoria', 'created_at')
    search_fields = ('pregunta', 'respuesta', 'categoria', 'mazo__nombre')
    list_filter = ('mazo', 'categoria', 'created_at')

    def pregunta_resumida(self, obj):
        return obj.pregunta[:50]

    pregunta_resumida.short_description = 'Pregunta'
