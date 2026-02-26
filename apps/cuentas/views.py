from datetime import timedelta
from typing import TYPE_CHECKING, Tuple

from django.conf import settings
from django.contrib import messages
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone
from django.utils.text import slugify
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.http import JsonResponse

from .models import CambioRol

if TYPE_CHECKING:
    from django.contrib.auth.models import AbstractBaseUser as User
else:
    User = get_user_model()

signer = TimestampSigner()


def _generar_email_recuperacion(user: User, url: str) -> str:
    """Genera HTML profesional para email de recuperación de contraseña"""
    return f"""
    <html dir="ltr" lang="es">
    <head>
        <meta charset="UTF-8">
        <style>
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #333333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: #0052A3; color: white; padding: 40px 20px; border-radius: 8px 8px 0 0; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 28px; font-weight: 600; }}
            .content {{ background: #F5F5F5; padding: 40px 20px; border-radius: 0 0 8px 8px; }}
            .content p {{ margin: 15px 0; }}
            .button-container {{ text-align: center; margin: 30px 0; }}
            .button {{ display: inline-block; padding: 14px 40px; background: #0D6EFD; color: #000000; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; border: none; cursor: pointer; }}
            .button:hover {{ background: #0B5ED7; color: #000000; }}
            .info-box {{ background: #E8F8F5; border-left: 4px solid #27AE60; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 14px; color: #1E5631; }}
            .url-box {{ background: white; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 12px; word-break: break-all; margin: 15px 0; border: 1px solid #E0E0E0; }}
            .footer {{ text-align: center; color: #999999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #E0E0E0; }}
            .warning {{ color: #666666; font-size: 13px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Recuperar tu Contraseña</h1>
            </div>
            <div class="content">
                <p>Hola <strong>{user.first_name or 'usuario'}</strong>,</p>
                <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta LevelMed.</p>
                <div class="button-container">
                    <a href="{url}" class="button">Restablecer Contraseña</a>
                </div>
                <p>O copia y pega este enlace en tu navegador:</p>
                <div class="url-box">{url}</div>
                <div class="info-box">
                    Este enlace expira en 1 hora por razones de seguridad.
                </div>
                <p class="warning">Si no realizaste esta solicitud, ignora este correo. Tu cuenta seguirá siendo segura.</p>
            </div>
            <div class="footer">
                <p>© 2026 LevelMed. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    """


def _generar_email_confirmacion(user: User) -> str:
    """Genera HTML profesional para email de confirmación de cambio de contraseña"""
    return f"""
    <html dir="ltr" lang="es">
    <head>
        <meta charset="UTF-8">
        <style>
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #333333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: #27AE60; color: white; padding: 40px 20px; border-radius: 8px 8px 0 0; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 28px; font-weight: 600; }}
            .content {{ background: #F5F5F5; padding: 40px 20px; border-radius: 0 0 8px 8px; }}
            .content p {{ margin: 15px 0; }}
            .success-box {{ background: #E8F8F5; border-left: 4px solid #27AE60; padding: 15px; margin: 20px 0; border-radius: 4px; }}
            .success-box strong {{ color: #1E5631; }}
            .footer {{ text-align: center; color: #999999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #E0E0E0; }}
            .warning {{ color: #666666; font-size: 13px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Contraseña Actualizada</h1>
            </div>
            <div class="content">
                <p>Hola <strong>{user.first_name or 'usuario'}</strong>,</p>
                <div class="success-box">
                    <strong>Tu contraseña ha sido actualizada correctamente.</strong><br>
                    Ya puedes iniciar sesión con tu nueva contraseña.
                </div>
                <p class="warning">Si no realizaste este cambio o tienes sospechas de actividad no autorizada, contacta con nosotros inmediatamente.</p>
                <p class="warning">Por tu seguridad, no compartas tu contraseña con nadie.</p>
            </div>
            <div class="footer">
                <p>© 2026 LevelMed. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    """


def _enviar_correo_verificacion(request, user: User) -> None:
    token = signer.sign(str(user.pk))
    url = request.build_absolute_uri(reverse('cuentas:verificar_email', args=[token]))
    
    html_message = f"""
    <html dir="ltr" lang="es">
    <head>
        <meta charset="UTF-8">
        <style>
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #333333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: #0052A3; color: white; padding: 40px 20px; border-radius: 8px 8px 0 0; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 28px; font-weight: 600; }}
            .content {{ background: #F5F5F5; padding: 40px 20px; border-radius: 0 0 8px 8px; }}
            .content p {{ margin: 15px 0; }}
            .button-container {{ text-align: center; margin: 30px 0; }}
            .button {{ display: inline-block; padding: 14px 40px; background: #27AE60; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; border: none; cursor: pointer; }}
            .button:hover {{ background: #229954; }}
            .info-box {{ background: #E8F8F5; border-left: 4px solid #27AE60; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 14px; color: #1E5631; }}
            .url-box {{ background: white; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 12px; word-break: break-all; margin: 15px 0; border: 1px solid #E0E0E0; }}
            .footer {{ text-align: center; color: #999999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #E0E0E0; }}
            .welcome-text {{ color: #666666; font-size: 14px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Bienvenido a LevelMed</h1>
            </div>
            <div class="content">
                <p class="welcome-text">Hola <strong>{user.first_name or 'nuevo usuario'}</strong>,</p>
                <p class="welcome-text">Tu cuenta ha sido creada exitosamente. Para completar tu registro, debes verificar tu correo electrónico.</p>
                <div class="button-container">
                    <a href="{url}" class="button">Verificar Mi Correo</a>
                </div>
                <p class="welcome-text">O copia y pega este enlace en tu navegador:</p>
                <div class="url-box">{url}</div>
                <div class="info-box">
                    Este enlace expira en 24 horas. Verifica tu correo lo antes posible para activar tu cuenta.
                </div>
                <p class="welcome-text" style="color: #999999; font-size: 13px;">Si no creaste esta cuenta, ignora este correo. Tu cuenta no será activada sin verificación.</p>
            </div>
            <div class="footer">
                <p>© 2026 LevelMed. Todos los derechos reservados.</p>
                <p style="margin-top: 10px; color: #AAAAAA; font-size: 11px;">Este es un correo automático, por favor no respondas a este mensaje.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    send_mail(
        subject='Verifica tu correo - LevelMed',
        message=f'Verifica tu cuenta entrando a este enlace: {url}',
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=True,
    )
    user.verificacion_enviada_en = timezone.now()
    user.save(update_fields=['verificacion_enviada_en'])


def home(request):
    if request.user.is_authenticated:
        return redirect('cuentas:panel')
    return render(request, 'home.html')


def _puede_reenviar_verificacion(user: User) -> Tuple[bool, str]:
    max_reenvios = getattr(settings, 'EMAIL_VERIFICACION_REENVIOS_MAX', 3)
    ventana_seconds = getattr(settings, 'EMAIL_VERIFICACION_REENVIOS_VENTANA_SECONDS', 1800)

    ahora = timezone.now()
    if not user.verificacion_ventana_inicio:
        user.verificacion_ventana_inicio = ahora
        user.verificacion_reenvios = 0
        user.save(update_fields=['verificacion_ventana_inicio', 'verificacion_reenvios'])

    if user.verificacion_ventana_inicio and ahora - user.verificacion_ventana_inicio > timedelta(seconds=ventana_seconds):
        user.verificacion_ventana_inicio = ahora
        user.verificacion_reenvios = 0
        user.save(update_fields=['verificacion_ventana_inicio', 'verificacion_reenvios'])

    if user.verificacion_reenvios >= max_reenvios:
        return False, 'Has alcanzado el límite de reenvíos. Intenta más tarde.'

    user.verificacion_reenvios += 1
    user.save(update_fields=['verificacion_reenvios'])
    return True, ''


def registro_estudiante(request):
    if request.method == 'POST':
        email = (request.POST.get('email') or '').strip().lower()
        username = (request.POST.get('username') or '').strip()
        password1 = request.POST.get('password1') or ''
        password2 = request.POST.get('password2') or ''

        if not email or not password1 or not password2:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'message': 'Debes completar todos los campos requeridos.'})
            return redirect('cuentas:home')

        if password1 != password2:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'message': 'Las contraseñas no coinciden.'})
            return redirect('cuentas:home')

        if User.objects.filter(email=email).exists():
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'message': 'Este correo ya está registrado.'})
            return redirect('cuentas:home')

        try:
            validate_password(password1)
        except ValidationError as exc:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'message': ' '.join(exc.messages)})
            return redirect('cuentas:home')

        base_username = slugify(username) if username else slugify(email.split('@')[0])
        if not base_username:
            base_username = 'usuario'
        candidate = base_username
        i = 1
        while User.objects.filter(username=candidate).exists():
            i += 1
            candidate = f'{base_username}-{i}'

        user = User(
            email=email,
            username=candidate,
            role='student',
            student_status='aspirant',  # Por defecto, nuevo usuario es postulante
            email_verificado=False,
            is_staff=False,
            is_superuser=False,
        )
        user.set_password(password1)
        user.save()
        _enviar_correo_verificacion(request, user)
        
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({'success': True, 'redirect_url': reverse('cuentas:verificacion_enviada')})
        return redirect('cuentas:verificacion_enviada')

    return redirect('cuentas:home')


def verificacion_enviada(request):
    return render(request, 'cuentas/verificacion/verificacion_enviada.html')


def recuperacion_enviada(request):
    return render(request, 'cuentas/verificacion/verificacion_enviada.html')


def reenviar_verificacion(request):
    if request.method == 'POST':
        email = (request.POST.get('email') or '').strip().lower()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            messages.error(request, 'No existe una cuenta con ese correo.')
            return render(request, 'cuentas/verificacion/reenviar_verificacion.html')

        if user.email_verificado:
            messages.info(request, 'Tu correo ya está verificado. Ya puedes iniciar sesión.')
            return render(request, 'cuentas/verificacion/reenviar_verificacion.html')

        ok, msg = _puede_reenviar_verificacion(user)
        if not ok:
            messages.error(request, msg)
            return render(request, 'cuentas/verificacion/reenviar_verificacion.html')

        _enviar_correo_verificacion(request, user)
        messages.success(request, 'Correo de verificación reenviado. Revisa tu bandeja de entrada.')
        return redirect('cuentas:verificacion_enviada')

    return render(request, 'cuentas/verificacion/reenviar_verificacion.html')


def verificar_email(request, token: str):
    max_age = getattr(settings, 'EMAIL_VERIFICACION_MAX_AGE_SECONDS', 86400)
    try:
        unsigned = signer.unsign(token, max_age=max_age)
    except SignatureExpired:
        return render(request, 'cuentas/verificacion/verificacion_resultado.html', {'estado': 'expirado'})
    except BadSignature:
        return render(request, 'cuentas/verificacion/verificacion_resultado.html', {'estado': 'invalido'})

    user = get_object_or_404(User, pk=int(unsigned))
    user.email_verificado = True
    user.save(update_fields=['email_verificado'])
    return render(request, 'cuentas/verificacion/verificacion_resultado.html', {'estado': 'ok'})


def login_view(request):
    if request.method == 'POST':
        email = (request.POST.get('email') or '').strip().lower()
        password = request.POST.get('password') or ''

        user = authenticate(request, username=email, password=password)
        if user is None:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'message': 'Credenciales incorrectas.'})
            return redirect(f'{reverse("cuentas:home")}?show_login=true&login_error=credenciales_incorrectas')

        if not getattr(user, 'email_verificado', False):
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'message': 'Debes verificar tu correo antes de iniciar sesión.', 'redirect_url': reverse('cuentas:reenviar_verificacion')})
            messages.error(request, 'Debes verificar tu correo antes de iniciar sesión.')
            return redirect('cuentas:reenviar_verificacion')

        login(request, user)
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({'success': True, 'redirect_url': reverse('cuentas:panel')})
        return redirect('cuentas:panel')

    # Mostrar el modal de login en el home en lugar de una página de login
    next_url = request.GET.get('next', '')
    next_param = f'&next={next_url}' if next_url else ''
    return redirect(f"{reverse('cuentas:home')}?show_login=true{next_param}")


def logout_view(request):
    logout(request)
    return redirect('cuentas:home')


def _normalizar_superuser(user: User) -> None:
    if not getattr(user, 'is_superuser', False):
        return

    update_fields = []
    if getattr(user, 'role', '') != 'admin':
        user.role = 'admin'
        update_fields.append('role')
    if not getattr(user, 'is_staff', False):
        user.is_staff = True
        update_fields.append('is_staff')
    if update_fields:
        user.save(update_fields=update_fields)


@login_required
def panel(request):
    _normalizar_superuser(request.user)
    if getattr(request.user, 'role', 'student') == 'admin':
        return render(request, 'cuentas/paneles/panel_admin.html')
    return render(request, 'cuentas/paneles/panel_estudiante.html')


def solicitar_recuperacion(request):
    if request.method == 'POST':
        email = (request.POST.get('email') or '').strip().lower()
        
        if not email:
            messages.error(request, 'Por favor ingresa tu correo electrónico.')
            return render(request, 'cuentas/recuperacion/recuperar.html')
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Por seguridad, no revelar si el email existe - redirigir a confirmación igual
            return redirect('cuentas:recuperacion_enviada')

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        url = request.build_absolute_uri(reverse('cuentas:confirmar_recuperacion', args=[uid, token]))
        
        try:
            send_mail(
                subject='Recuperación de contraseña - LevelMed',
                message=f'Para restablecer tu contraseña entra aquí: {url}\n\nEste enlace expira en 1 hora.',
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
                recipient_list=[user.email],
                html_message=_generar_email_recuperacion(user, url),
                fail_silently=False,
            )
            return redirect('cuentas:recuperacion_enviada')
        except Exception as e:
            messages.error(request, 'No pudimos enviar el correo. Por favor intenta más tarde.')
            if settings.DEBUG:
                messages.error(request, f'Error técnico: {str(e)}')
            return render(request, 'cuentas/recuperacion/recuperar.html')

    return render(request, 'cuentas/recuperacion/recuperar.html')


def confirmar_recuperacion(request, uidb64: str, token: str):
    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        user = User.objects.get(pk=uid)
    except Exception:
        user = None

    if user is None or not default_token_generator.check_token(user, token):
        messages.error(request, 'Este enlace de recuperación ha expirado o es inválido. Solicita uno nuevo.')
        return render(request, 'cuentas/recuperacion/restablecer.html', {'token_valido': False})

    if request.method == 'POST':
        password1 = request.POST.get('password1') or ''
        password2 = request.POST.get('password2') or ''
        
        if not password1 or not password2:
            messages.error(request, 'Debes completar ambas contraseñas.')
            return render(request, 'cuentas/recuperacion/restablecer.html', {'token_valido': True})
        
        if password1 != password2:
            messages.error(request, 'Las contraseñas no coinciden. Intenta nuevamente.')
            return render(request, 'cuentas/recuperacion/restablecer.html', {'token_valido': True})
        
        try:
            validate_password(password1, user=user)
        except ValidationError as exc:
            messages.error(request, 'La contraseña no es segura: ' + ' '.join(exc.messages))
            return render(request, 'cuentas/recuperacion/restablecer.html', {'token_valido': True})
        
        # Cambiar contraseña
        user.set_password(password1)
        user.save()
        
        # Enviar correo de confirmación
        try:
            send_mail(
                subject='Contraseña actualizada - LevelMed',
                message='Tu contraseña ha sido actualizada correctamente.',
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
                recipient_list=[user.email],
                html_message=_generar_email_confirmacion(user),
                fail_silently=False,
            )
        except:
            pass  # Si falla el email de confirmación, no afecta el cambio
        
        messages.success(request, 'Contraseña actualizada correctamente. Puedes iniciar sesión con tu nueva contraseña.')
        return redirect(f"{reverse('cuentas:home')}?show_login=true")

    return render(request, 'cuentas/recuperacion/restablecer.html', {'token_valido': True})


def _es_admin(user: User) -> bool:
    if not user.is_authenticated:
        return False
    if getattr(user, 'is_superuser', False):
        _normalizar_superuser(user)
        return True
    return bool(getattr(user, 'role', '') == 'admin')


@login_required
def asignar_administrador(request):
    if not _es_admin(request.user):
        return redirect('cuentas:panel')

    if request.method == 'POST':
        email = (request.POST.get('email') or '').strip().lower()
        try:
            objetivo = User.objects.get(email=email)
        except User.DoesNotExist:
            messages.error(request, 'No existe un usuario con ese correo.')
            return render(request, 'cuentas/admin/asignar_admin.html')

        rol_anterior = objetivo.role
        if rol_anterior == 'admin':
            messages.info(request, 'El usuario ya es administrador.')
            return render(request, 'cuentas/admin/asignar_admin.html')

        objetivo.role = 'admin'
        objetivo.is_staff = True
        objetivo.save(update_fields=['role', 'is_staff'])
        CambioRol.objects.create(
            actor=request.user,
            objetivo=objetivo,
            rol_anterior=rol_anterior,
            rol_nuevo='admin',
        )
        send_mail(
            subject='Cambio de rol',
            message='Tu cuenta fue asignada como Administrador.',
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
            recipient_list=[objetivo.email],
            fail_silently=True,
        )
        messages.success(request, 'Rol actualizado a Administrador.')
        return redirect('cuentas:panel')

    return render(request, 'cuentas/admin/asignar_admin.html')


@login_required
def perfil_view(request):
    user = request.user
    if request.method == 'POST':
        first_name = (request.POST.get('first_name') or '').strip()
        last_name = (request.POST.get('last_name') or '').strip()
        
        # Validar campos obligatorios para estudiantes
        if getattr(user, 'role', '') == 'student':
            birth_date = (request.POST.get('birth_date') or '').strip()
            gender = (request.POST.get('gender') or '').strip()
            identity_number = (request.POST.get('identity_number') or '').strip()
            nationality = (request.POST.get('nationality') or '').strip()
            phone_number = (request.POST.get('phone_number') or '').strip()
            student_status = (request.POST.get('student_status') or '').strip()
            
            # Validar que todos los campos requeridos estén completos
            campos_vacios = []
            if not first_name:
                campos_vacios.append('Nombre')
            if not last_name:
                campos_vacios.append('Apellido')
            if not birth_date:
                campos_vacios.append('Fecha de Nacimiento')
            if not gender:
                campos_vacios.append('Género')
            if not identity_number:
                campos_vacios.append('Carnet de Identidad')
            if not nationality:
                campos_vacios.append('Nacionalidad')
            if not phone_number:
                campos_vacios.append('Teléfono')
            if not student_status:
                campos_vacios.append('Estado Académico')
            
            if campos_vacios:
                messages.error(request, f'Debes completar todos los campos requeridos: {", ".join(campos_vacios)}')
                return redirect('cuentas:perfil')
        
        user.first_name = first_name
        user.last_name = last_name
        
        if getattr(user, 'role', '') == 'student':
            # Estado del estudiante
            student_status = (request.POST.get('student_status') or '').strip()
            if student_status:
                user.student_status = student_status
            
            # Si es universitario, obtener datos universitarios
            if student_status == 'university':
                university = (request.POST.get('university') or '').strip()
                faculty = (request.POST.get('faculty') or '').strip()
                career = (request.POST.get('career') or '').strip()
                study_year = (request.POST.get('study_year') or '').strip()
                
                if university:
                    user.university = university
                if faculty:
                    user.faculty = faculty
                if career:
                    user.career = career
                if study_year:
                    user.study_year = study_year
            
            # Información personal (para todos los estudiantes)
            birth_date = (request.POST.get('birth_date') or '').strip()
            gender = (request.POST.get('gender') or '').strip()
            identity_number = (request.POST.get('identity_number') or '').strip()
            nationality = (request.POST.get('nationality') or '').strip()
            phone_number = (request.POST.get('phone_number') or '').strip()
            
            if birth_date:
                user.birth_date = birth_date
            if gender:
                user.gender = gender
            if identity_number:
                user.identity_number = identity_number
            if nationality:
                user.nationality = nationality
            if phone_number:
                user.phone_number = phone_number
        
        user.save()
        messages.success(request, 'Perfil actualizado correctamente.')
        return redirect('cuentas:perfil')
        
    return render(request, 'cuentas/perfil/perfil.html')
