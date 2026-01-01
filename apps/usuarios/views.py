from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.views.decorators.http import require_http_methods
from django.db.models import Q
import json

from .models import UsuarioAuditoria

User = get_user_model()


@login_required
def gestion_usuarios(request):
    """Vista principal de gestión de usuarios"""
    # Solo administradores pueden acceder
    if not (request.user.is_superuser or getattr(request.user, 'role', '') == 'admin'):
        return render(request, '404.html', status=403)
    
    return render(request, 'usuarios/usuarios.html')


@login_required
@require_http_methods(["GET"])
def listar_usuarios(request):
    """API para listar usuarios con búsqueda y filtro"""
    # Solo administradores pueden acceder
    if not (request.user.is_superuser or getattr(request.user, 'role', '') == 'admin'):
        return JsonResponse({'error': 'No tienes permisos'}, status=403)
    
    busqueda = request.GET.get('busqueda', '')
    estado = request.GET.get('estado', '')
    
    usuarios = User.objects.all()
    
    if busqueda:
        usuarios = usuarios.filter(
            Q(first_name__icontains=busqueda) |
            Q(last_name__icontains=busqueda) |
            Q(email__icontains=busqueda) |
            Q(username__icontains=busqueda)
        )
    
    if estado == 'activo':
        usuarios = usuarios.filter(is_active=True)
    elif estado == 'inactivo':
        usuarios = usuarios.filter(is_active=False)
    
    usuarios_data = []
    for user in usuarios:
        usuarios_data.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': getattr(user, 'role', 'student'),
            'is_active': user.is_active,
        })
    
    return JsonResponse(usuarios_data, safe=False)


@login_required
@require_http_methods(["GET"])
def obtener_usuario(request, usuario_id):
    """API para obtener información de un usuario"""
    if not (request.user.is_superuser or getattr(request.user, 'role', '') == 'admin'):
        return JsonResponse({'error': 'No tienes permisos'}, status=403)
    
    try:
        usuario = User.objects.get(id=usuario_id)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Usuario no encontrado'}, status=404)
    
    return JsonResponse({
        'id': usuario.id,
        'username': usuario.username,
        'email': usuario.email,
        'first_name': usuario.first_name,
        'last_name': usuario.last_name,
        'role': getattr(usuario, 'role', 'student'),
        'study_year': getattr(usuario, 'study_year', 'pre_uni'),
        'is_active': usuario.is_active,
        'email_verificado': getattr(usuario, 'email_verificado', False),
        'date_joined': usuario.date_joined.isoformat(),
    })


@login_required
@require_http_methods(["POST"])
def crear_usuario(request):
    """API para crear un nuevo usuario"""
    if not (request.user.is_superuser or getattr(request.user, 'role', '') == 'admin'):
        return JsonResponse({'error': 'No tienes permisos'}, status=403)
    
    try:
        nombre = request.POST.get('nombre', '').strip()
        email = request.POST.get('email', '').strip().lower()
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')
        password2 = request.POST.get('password2', '')
        role = request.POST.get('role', 'student')
        
        # Validaciones
        if not all([nombre, email, username, password, password2, role]):
            return JsonResponse({'success': False, 'error': 'Todos los campos son requeridos'})
        
        if password != password2:
            return JsonResponse({'success': False, 'error': 'Las contraseñas no coinciden'})
        
        if User.objects.filter(email=email).exists():
            return JsonResponse({'success': False, 'error': 'Este email ya está registrado'})
        
        if User.objects.filter(username=username).exists():
            return JsonResponse({'success': False, 'error': 'Este nombre de usuario ya existe'})
        
        try:
            validate_password(password)
        except ValidationError as e:
            return JsonResponse({'success': False, 'error': ' '.join(e.messages)})
        
        # Crear usuario
        nombres = nombre.split(' ', 1)
        usuario = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=nombres[0],
            last_name=nombres[1] if len(nombres) > 1 else '',
        )
        usuario.role = role
        usuario.is_staff = role == 'admin'
        usuario.save()
        
        # Registrar en auditoría
        UsuarioAuditoria.objects.create(
            usuario=usuario,
            accion='crear',
            realizado_por=request.user
        )
        
        return JsonResponse({'success': True, 'message': 'Usuario creado exitosamente'})
    
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@login_required
@require_http_methods(["POST"])
def editar_usuario(request):
    """API para editar un usuario"""
    if not (request.user.is_superuser or getattr(request.user, 'role', '') == 'admin'):
        return JsonResponse({'error': 'No tienes permisos'}, status=403)
    
    try:
        usuario_id = request.POST.get('usuario_id')
        nombre = request.POST.get('nombre', '').strip()
        email = request.POST.get('email', '').strip().lower()
        role = request.POST.get('role', 'student')
        study_year = request.POST.get('study_year', 'pre_uni')
        
        # Manejar diferentes formatos de is_active ('true', 'on', '1', True)
        is_active_val = request.POST.get('is_active')
        is_active = str(is_active_val).lower() in ['true', 'on', '1']
        
        usuario = User.objects.get(id=usuario_id)
        
        # Validar email único
        if email != usuario.email and User.objects.filter(email=email).exists():
            return JsonResponse({'success': False, 'error': 'Este email ya está registrado'})
        
        # Registrar cambios para auditoría
        cambios = {}
        if usuario.first_name + ' ' + usuario.last_name != nombre:
            cambios['nombre'] = nombre
        if usuario.email != email:
            cambios['email'] = email
        if getattr(usuario, 'role', 'student') != role:
            cambios['role'] = role
        if usuario.is_active != is_active:
            cambios['estado'] = 'activo' if is_active else 'inactivo'
        
        # Actualizar usuario
        nombres = nombre.split(' ', 1)
        usuario.first_name = nombres[0]
        usuario.last_name = nombres[1] if len(nombres) > 1 else ''
        usuario.email = email
        usuario.role = role
        usuario.study_year = study_year
        usuario.is_active = is_active
        usuario.is_staff = role == 'admin'
        usuario.save()
        
        # Registrar en auditoría
        if cambios:
            UsuarioAuditoria.objects.create(
                usuario=usuario,
                accion='editar',
                realizado_por=request.user,
                cambios=cambios
            )
        
        return JsonResponse({'success': True, 'message': 'Usuario actualizado exitosamente'})
    
    except User.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Usuario no encontrado'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@login_required
@require_http_methods(["DELETE"])
def eliminar_usuario(request, usuario_id):
    """API para eliminar un usuario"""
    if not (request.user.is_superuser or getattr(request.user, 'role', '') == 'admin'):
        return JsonResponse({'error': 'No tienes permisos'}, status=403)
    
    try:
        usuario = User.objects.get(id=usuario_id)
        
        # No permitir eliminar al mismo usuario
        if usuario.id == request.user.id:
            return JsonResponse({'success': False, 'error': 'No puedes eliminar tu propia cuenta'})
        
        # Registrar en auditoría antes de eliminar
        UsuarioAuditoria.objects.create(
            usuario=usuario,
            accion='eliminar',
            realizado_por=request.user
        )
        
        usuario.delete()
        return JsonResponse({'success': True, 'message': 'Usuario eliminado exitosamente'})
    
    except User.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Usuario no encontrado'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

