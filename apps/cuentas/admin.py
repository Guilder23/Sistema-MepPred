from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html

from .models import CambioRol, User


def verificar_usuarios(modeladmin, request, queryset):
    """Acción para marcar usuarios como verificados"""
    cantidad = queryset.update(email_verificado=True)
    modeladmin.message_user(request, f'{cantidad} usuario(s) marcado(s) como verificado(s).')

verificar_usuarios.short_description = "✓ Marcar usuarios como verificados (email confirmado)"


def desverificar_usuarios(modeladmin, request, queryset):
    """Acción para marcar usuarios como NO verificados"""
    cantidad = queryset.update(email_verificado=False)
    modeladmin.message_user(request, f'{cantidad} usuario(s) marcado(s) como no verificado(s).')

desverificar_usuarios.short_description = "✗ Marcar usuarios como no verificados"


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'role', 'email_verificado_badge', 'is_staff', 'is_active')
    list_filter = ('email_verificado', 'is_staff', 'is_active', 'role')
    ordering = ('-date_joined',)
    search_fields = ('email', 'username')
    actions = [verificar_usuarios, desverificar_usuarios]
    
    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Información Personal', {'fields': ('first_name', 'last_name')}),
        ('Verificación', {'fields': ('email_verificado',)}),
        ('Rol y Estado', {'fields': ('role', 'student_status', 'is_active', 'is_staff', 'is_superuser')}),
        ('Fechas', {'fields': ('last_login', 'date_joined')}),
    )
    
    def email_verificado_badge(self, obj):
        """Muestra un badge de verificación en la lista"""
        if obj.email_verificado:
            return format_html('<span style="color: green;">✓ Verificado</span>')
        return format_html('<span style="color: red;">✗ No verificado</span>')
    
    email_verificado_badge.short_description = 'Verificación Email'


@admin.register(CambioRol)
class CambioRolAdmin(admin.ModelAdmin):
    list_display = ('actor', 'objetivo', 'rol_anterior', 'rol_nuevo', 'creado_en')
    search_fields = ('actor__email', 'objetivo__email', 'rol_anterior', 'rol_nuevo')
    list_filter = ('rol_anterior', 'rol_nuevo', 'creado_en')
    readonly_fields = ('creado_en',)
