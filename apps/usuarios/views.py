from datetime import timedelta

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


User = get_user_model()
signer = TimestampSigner()


def _enviar_correo_verificacion(request, user: User) -> None:
    token = signer.sign(str(user.pk))
    url = request.build_absolute_uri(reverse('usuarios:verificar_email', args=[token]))
    send_mail(
        subject='Verifica tu correo',
        message=f'Verifica tu cuenta entrando a este enlace: {url}',
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
        recipient_list=[user.email],
        fail_silently=True,
    )
    user.verificacion_enviada_en = timezone.now()
    user.save(update_fields=['verificacion_enviada_en'])


def home(request):
    if request.user.is_authenticated:
        return redirect('usuarios:panel')
    return render(request, 'home.html')


def _puede_reenviar_verificacion(user: User) -> tuple[bool, str]:
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
        study_year = (request.POST.get('study_year') or '').strip() or 'pre_uni'
        password1 = request.POST.get('password1') or ''
        password2 = request.POST.get('password2') or ''

        if not email or not password1 or not password2:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'message': 'Debes completar todos los campos requeridos.'})
            messages.error(request, 'Debes completar todos los campos requeridos.')
            return render(request, 'usuarios/autenticacion/registro.html')

        if password1 != password2:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'message': 'Las contraseñas no coinciden.'})
            messages.error(request, 'Las contraseñas no coinciden.')
            return render(request, 'usuarios/autenticacion/registro.html')

        if User.objects.filter(email=email).exists():
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'message': 'Este correo ya está registrado.'})
            messages.error(request, 'Este correo ya está registrado.')
            return render(request, 'usuarios/autenticacion/registro.html')

        try:
            validate_password(password1)
        except ValidationError as exc:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'message': ' '.join(exc.messages)})
            messages.error(request, ' '.join(exc.messages))
            return render(request, 'usuarios/autenticacion/registro.html')

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
            study_year=study_year,
            email_verificado=False,
            is_staff=False,
            is_superuser=False,
        )
        user.set_password(password1)
        user.save()
        _enviar_correo_verificacion(request, user)
        
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({'success': True, 'redirect_url': reverse('usuarios:verificacion_enviada')})
        return redirect('usuarios:verificacion_enviada')

    return render(request, 'usuarios/autenticacion/registro.html')


def verificacion_enviada(request):
    return render(request, 'usuarios/verificacion/verificacion_enviada.html')


def reenviar_verificacion(request):
    if request.method == 'POST':
        email = (request.POST.get('email') or '').strip().lower()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            messages.error(request, 'No existe una cuenta con ese correo.')
            return render(request, 'usuarios/verificacion/reenviar_verificacion.html')

        if user.email_verificado:
            messages.info(request, 'Tu correo ya está verificado. Ya puedes iniciar sesión.')
            return redirect('usuarios:login')

        ok, msg = _puede_reenviar_verificacion(user)
        if not ok:
            messages.error(request, msg)
            return render(request, 'usuarios/verificacion/reenviar_verificacion.html')

        _enviar_correo_verificacion(request, user)
        messages.success(request, 'Correo de verificación reenviado.')
        return redirect('usuarios:verificacion_enviada')

    return render(request, 'usuarios/verificacion/reenviar_verificacion.html')


def verificar_email(request, token: str):
    max_age = getattr(settings, 'EMAIL_VERIFICACION_MAX_AGE_SECONDS', 86400)
    try:
        unsigned = signer.unsign(token, max_age=max_age)
    except SignatureExpired:
        return render(request, 'usuarios/verificacion/verificacion_resultado.html', {'estado': 'expirado'})
    except BadSignature:
        return render(request, 'usuarios/verificacion/verificacion_resultado.html', {'estado': 'invalido'})

    user = get_object_or_404(User, pk=int(unsigned))
    user.email_verificado = True
    user.save(update_fields=['email_verificado'])
    return render(request, 'usuarios/verificacion/verificacion_resultado.html', {'estado': 'ok'})


def login_view(request):
    if request.method == 'POST':
        email = (request.POST.get('email') or '').strip().lower()
        password = request.POST.get('password') or ''

        user = authenticate(request, username=email, password=password)
        if user is None:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'message': 'Credenciales incorrectas.'})
            messages.error(request, 'Credenciales incorrectas.')
            return render(request, 'usuarios/autenticacion/login.html')

        if not getattr(user, 'email_verificado', False):
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'message': 'Debes verificar tu correo antes de iniciar sesión.', 'redirect_url': reverse('usuarios:reenviar_verificacion')})
            messages.error(request, 'Debes verificar tu correo antes de iniciar sesión.')
            return redirect('usuarios:reenviar_verificacion')

        login(request, user)
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({'success': True, 'redirect_url': reverse('usuarios:panel')})
        return redirect('usuarios:panel')

    return render(request, 'usuarios/autenticacion/login.html')


def logout_view(request):
    logout(request)
    return redirect('usuarios:login')


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
        return render(request, 'usuarios/paneles/panel_admin.html')
    return render(request, 'usuarios/paneles/panel_estudiante.html')


def solicitar_recuperacion(request):
    if request.method == 'POST':
        email = (request.POST.get('email') or '').strip().lower()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            messages.error(request, 'No existe una cuenta con ese correo.')
            return render(request, 'usuarios/recuperacion/recuperar.html')

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        url = request.build_absolute_uri(reverse('usuarios:confirmar_recuperacion', args=[uid, token]))
        send_mail(
            subject='Recuperación de contraseña',
            message=f'Para restablecer tu contraseña entra aquí: {url}',
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
            recipient_list=[user.email],
            fail_silently=True,
        )
        messages.success(request, 'Se envió un correo de recuperación (si el email existe).')
        return redirect('usuarios:login')

    return render(request, 'usuarios/recuperacion/recuperar.html')


def confirmar_recuperacion(request, uidb64: str, token: str):
    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        user = User.objects.get(pk=uid)
    except Exception:
        user = None

    if user is None or not default_token_generator.check_token(user, token):
        return render(request, 'usuarios/recuperacion/restablecer.html', {'token_valido': False})

    if request.method == 'POST':
        password1 = request.POST.get('password1') or ''
        password2 = request.POST.get('password2') or ''
        if password1 != password2:
            messages.error(request, 'Las contraseñas no coinciden.')
            return render(request, 'usuarios/recuperacion/restablecer.html', {'token_valido': True})
        try:
            validate_password(password1, user=user)
        except ValidationError as exc:
            messages.error(request, ' '.join(exc.messages))
            return render(request, 'usuarios/recuperacion/restablecer.html', {'token_valido': True})
        user.set_password(password1)
        user.save()
        messages.success(request, 'Contraseña actualizada. Inicia sesión.')
        return redirect('usuarios:login')

    return render(request, 'usuarios/recuperacion/restablecer.html', {'token_valido': True})


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
        return redirect('usuarios:panel')

    if request.method == 'POST':
        email = (request.POST.get('email') or '').strip().lower()
        try:
            objetivo = User.objects.get(email=email)
        except User.DoesNotExist:
            messages.error(request, 'No existe un usuario con ese correo.')
            return render(request, 'usuarios/admin/asignar_admin.html')

        rol_anterior = objetivo.role
        if rol_anterior == 'admin':
            messages.info(request, 'El usuario ya es administrador.')
            return render(request, 'usuarios/admin/asignar_admin.html')

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
        return redirect('usuarios:panel')

    return render(request, 'usuarios/admin/asignar_admin.html')
