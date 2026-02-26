from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.views.decorators.http import require_http_methods
from django.db.models import Q
from django.urls import reverse
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
    rol = request.GET.get('rol', '')
    
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

    if rol:
        usuarios = usuarios.filter(role=rol)
    
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
            'date_joined': user.date_joined.isoformat(),
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
        'identity_number': getattr(usuario, 'identity_number', ''),
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

        email_warning = None
        try:
            login_url = request.build_absolute_uri(f"{reverse('cuentas:home')}?show_login=true")
            subject = 'Tu cuenta ha sido creada en LevelMed'
            text_body = (
                f'Hola {usuario.first_name or usuario.username},\n\n'
                f'Se creó una cuenta para ti en LevelMed.\n'
                f'Usuario: {usuario.username}\n'
                f'Correo: {usuario.email}\n\n'
                f'Inicia sesión aquí: {login_url}\n\n'
                'Si no solicitaste esta cuenta, por favor contacta al administrador.'
            )
            html_body = f"""
            <div style=\"margin:0;padding:24px;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;\">
                <table role=\"presentation\" style=\"width:100%;max-width:620px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;\">
                    <tr>
                        <td style=\"background:#0f172a;padding:18px 24px;\">
                            <h2 style=\"margin:0;color:#ffffff;font-size:22px;font-weight:700;\">LevelMed</h2>
                            <p style=\"margin:8px 0 0;color:#cbd5e1;font-size:13px;\">Tu cuenta ha sido creada exitosamente</p>
                        </td>
                    </tr>
                    <tr>
                        <td style=\"padding:24px;\">
                            <p style=\"margin:0 0 16px;font-size:16px;\">Hola <strong>{usuario.first_name or usuario.username}</strong>,</p>
                            <p style=\"margin:0 0 18px;line-height:1.6;\">Se creó una cuenta para ti en <strong>LevelMed</strong>. Aquí tienes tus datos:</p>
                            <table role=\"presentation\" style=\"width:100%;border-collapse:collapse;margin:0 0 18px;\">
                                <tr>
                                    <td style=\"padding:10px;border:1px solid #e5e7eb;background:#f8fafc;font-weight:600;width:140px;\">Usuario</td>
                                    <td style=\"padding:10px;border:1px solid #e5e7eb;\">{usuario.username}</td>
                                </tr>
                                <tr>
                                    <td style=\"padding:10px;border:1px solid #e5e7eb;background:#f8fafc;font-weight:600;\">Correo</td>
                                    <td style=\"padding:10px;border:1px solid #e5e7eb;\">{usuario.email}</td>
                                </tr>
                            </table>
                            <div style=\"margin:0 0 18px;\">
                                <a href=\"{login_url}\" style=\"display:inline-block;padding:10px 16px;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;\">Ir a iniciar sesión</a>
                            </div>
                            <p style=\"margin:0 0 18px;line-height:1.6;\">También puedes ingresar desde este enlace: <a href=\"{login_url}\">{login_url}</a></p>
                            <p style=\"margin:0;line-height:1.6;color:#475569;\">Si no solicitaste esta cuenta, contacta al administrador para revisar el acceso.</p>
                        </td>
                    </tr>
                </table>
            </div>
            """

            email = EmailMultiAlternatives(
                subject=subject,
                body=text_body,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
                to=[usuario.email],
            )
            email.attach_alternative(html_body, "text/html")
            email.send(fail_silently=False)
        except Exception:
            email_warning = 'Usuario creado, pero no se pudo enviar el correo de notificación.'
        
        # Registrar en auditoría
        UsuarioAuditoria.objects.create(
            usuario=usuario,
            accion='crear',
            realizado_por=request.user
        )
        
        response_payload = {'success': True, 'message': 'Usuario creado exitosamente'}
        if email_warning:
            response_payload['warning'] = email_warning
            response_payload['message'] = email_warning

        return JsonResponse(response_payload)
    
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@login_required
@require_http_methods(["POST"])
def editar_usuario(request):
    """API para editar un usuario"""
    if not (request.user.is_superuser or getattr(request.user, 'role', '') == 'admin'):
        return JsonResponse({'error': 'No tienes permisos'}, status=403)
    
    try:
        # Aceptar tanto 'id' como 'usuario_id'
        usuario_id = request.POST.get('id') or request.POST.get('usuario_id')
        nombre = request.POST.get('nombre', '').strip()
        email = request.POST.get('email', '').strip().lower()
        role = request.POST.get('role', '').strip()
        study_year = request.POST.get('study_year', '').strip()
        
        # Manejar diferentes formatos de is_active ('true', 'on', '1', True)
        is_active_val = request.POST.get('is_active')
        is_active = str(is_active_val).lower() in ['true', 'on', '1']
        
        usuario = User.objects.get(id=usuario_id)
        
        # Registrar cambios para auditoría
        cambios = {}
        
        # Solo actualizar campos si se proporcionan
        if nombre:
            # Validar email único
            if email and email != usuario.email and User.objects.filter(email=email).exists():
                return JsonResponse({'success': False, 'error': 'Este email ya está registrado'})
            
            nombres = nombre.split(' ', 1)
            usuario.first_name = nombres[0]
            usuario.last_name = nombres[1] if len(nombres) > 1 else ''
            if nombre != usuario.first_name + ' ' + usuario.last_name:
                cambios['nombre'] = nombre
        
        if email:
            # Validar email único
            if email != usuario.email and User.objects.filter(email=email).exists():
                return JsonResponse({'success': False, 'error': 'Este email ya está registrado'})
            usuario.email = email
            if usuario.email != email:
                cambios['email'] = email
        
        if role:
            usuario.role = role
            if getattr(usuario, 'role', 'student') != role:
                cambios['role'] = role
            usuario.is_staff = role == 'admin'
        
        if study_year:
            usuario.study_year = study_year
        
        # Actualizar estado
        if usuario.is_active != is_active:
            usuario.is_active = is_active
            cambios['estado'] = 'activo' if is_active else 'inactivo'
        
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
    """API para eliminar un usuario (deshabilitada por política de negocio)"""
    if not (request.user.is_superuser or getattr(request.user, 'role', '') == 'admin'):
        return JsonResponse({'error': 'No tienes permisos'}, status=403)

    return JsonResponse(
        {
            'success': False,
            'error': 'La eliminación de usuarios está deshabilitada. Puedes desactivar el usuario desde Editar.'
        },
        status=403
    )


@login_required
@require_http_methods(["POST"])
def toggle_estado_usuario(request, usuario_id):
    """API para activar/desactivar usuario desde la tabla"""
    if not (request.user.is_superuser or getattr(request.user, 'role', '') == 'admin'):
        return JsonResponse({'error': 'No tienes permisos'}, status=403)

    try:
        usuario = User.objects.get(id=usuario_id)

        is_active_val = request.POST.get('is_active')
        nuevo_estado = str(is_active_val).lower() in ['true', 'on', '1']

        if usuario.id == request.user.id and not nuevo_estado:
            return JsonResponse({'success': False, 'error': 'No puedes desactivar tu propia cuenta'})

        usuario.is_active = nuevo_estado
        usuario.save(update_fields=['is_active'])

        UsuarioAuditoria.objects.create(
            usuario=usuario,
            accion='editar',
            realizado_por=request.user,
            cambios={'estado': 'activo' if nuevo_estado else 'inactivo'}
        )

        accion = 'activado' if nuevo_estado else 'desactivado'
        return JsonResponse({'success': True, 'message': f'Usuario {accion} exitosamente'})

    except User.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Usuario no encontrado'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

