from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import CambioRol, User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'role', 'email_verificado', 'is_staff', 'is_active')
    ordering = ('email',)
    search_fields = ('email', 'username')


@admin.register(CambioRol)
class CambioRolAdmin(admin.ModelAdmin):
    list_display = ('actor', 'objetivo', 'rol_anterior', 'rol_nuevo', 'creado_en')
    search_fields = ('actor__email', 'objetivo__email', 'rol_anterior', 'rol_nuevo')
    list_filter = ('rol_anterior', 'rol_nuevo', 'creado_en')
