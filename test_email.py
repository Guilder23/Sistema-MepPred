#!/usr/bin/env python
"""
Script para probar el envío de email en producción
Ejecuta esto en Render Shell para diagnosticar problemas de correo
"""
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'meetwin.settings')
django.setup()

from django.conf import settings
from django.core.mail import send_mail

def test_email_config():
    """Verifica la configuración de email"""
    print("=" * 60)
    print("CONFIGURACIÓN DE EMAIL")
    print("=" * 60)
    
    config = {
        'EMAIL_BACKEND': settings.EMAIL_BACKEND,
        'EMAIL_HOST': getattr(settings, 'EMAIL_HOST', 'NO CONFIGURADO'),
        'EMAIL_PORT': getattr(settings, 'EMAIL_PORT', 'NO CONFIGURADO'),
        'EMAIL_USE_TLS': getattr(settings, 'EMAIL_USE_TLS', 'NO CONFIGURADO'),
        'EMAIL_USE_SSL': getattr(settings, 'EMAIL_USE_SSL', 'NO CONFIGURADO'),
        'EMAIL_HOST_USER': settings.EMAIL_HOST_USER or 'NO CONFIGURADO',
        'DEFAULT_FROM_EMAIL': settings.DEFAULT_FROM_EMAIL,
    }
    
    for key, value in config.items():
        if key == 'EMAIL_HOST_PASSWORD':
            print(f"{key}: {'***OCULTO***' if value else 'NO CONFIGURADO'}")
        else:
            print(f"{key}: {value}")
    
    print("\n" + "=" * 60)
    print("VERIFICACIÓN DE VARIABLES DE ENTORNO")
    print("=" * 60)
    
    env_vars = {
        'EMAIL_HOST': os.environ.get('EMAIL_HOST'),
        'EMAIL_PORT': os.environ.get('EMAIL_PORT'),
        'EMAIL_USE_TLS': os.environ.get('EMAIL_USE_TLS'),
        'EMAIL_USER': os.environ.get('EMAIL_USER'),
        'EMAIL_PASSWORD': '***' if os.environ.get('EMAIL_PASSWORD') else None,
    }
    
    for key, value in env_vars.items():
        status = "✅" if value else "❌"
        print(f"{status} {key}: {value or 'NO CONFIGURADO'}")
    
    return settings.EMAIL_BACKEND == 'django.core.mail.backends.smtp.EmailBackend'

def test_send_email(recipient=None):
    """Intenta enviar un email de prueba"""
    print("\n" + "=" * 60)
    print("PRUEBA DE ENVÍO DE EMAIL")
    print("=" * 60)
    
    if not recipient:
        recipient = input("Ingresa el correo destinatario (o presiona Enter para usar EMAIL_USER): ").strip()
        if not recipient:
            recipient = settings.EMAIL_HOST_USER
    
    print(f"\n📧 Enviando email de prueba a: {recipient}")
    
    try:
        result = send_mail(
            subject='🧪 Prueba de Email - MeedPred',
            message='Este es un email de prueba desde el servidor de MeedPred.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            html_message="""
            <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #0052A3;">✅ Email de Prueba</h2>
                <p>Si recibes este mensaje, la configuración de email está funcionando correctamente.</p>
                <hr>
                <p style="color: #666; font-size: 12px;">
                    Sistema MeedPred<br>
                    Este es un mensaje automático de prueba
                </p>
            </body>
            </html>
            """,
            fail_silently=False,  # Mostrar errores
        )
        
        if result == 1:
            print("✅ ¡Email enviado exitosamente!")
            print(f"   Revisa la bandeja de entrada de {recipient}")
            return True
        else:
            print("⚠️  El email no se envió (resultado: 0)")
            return False
            
    except Exception as e:
        print(f"❌ Error al enviar email: {type(e).__name__}")
        print(f"   Mensaje: {str(e)}")
        
        # Sugerencias según el error
        if "Authentication" in str(e) or "535" in str(e):
            print("\n💡 SOLUCIÓN:")
            print("   - Verifica que EMAIL_USER y EMAIL_PASSWORD sean correctos")
            print("   - Para Gmail, usa una 'Contraseña de aplicación'")
            print("   - https://myaccount.google.com/apppasswords")
        elif "Connection refused" in str(e) or "timeout" in str(e).lower():
            print("\n💡 SOLUCIÓN:")
            print("   - Verifica EMAIL_HOST y EMAIL_PORT")
            print("   - Gmail usa smtp.gmail.com:587 (TLS) o :465 (SSL)")
        elif "SSL" in str(e) or "TLS" in str(e):
            print("\n💡 SOLUCIÓN:")
            print("   - Verifica EMAIL_USE_TLS (True para puerto 587)")
            print("   - Verifica EMAIL_USE_SSL (True para puerto 465)")
        
        return False

def main():
    print("\n" + "🔍" * 30)
    print("   TEST DE CONFIGURACIÓN DE EMAIL")
    print("🔍" * 30 + "\n")
    
    # Verificar configuración
    is_smtp = test_email_config()
    
    if not is_smtp:
        print("\n❌ EMAIL_BACKEND no está configurado para SMTP")
        print("   Configura EMAIL_USER y EMAIL_PASSWORD en las variables de entorno")
        return
    
    # Preguntar si quiere enviar un email de prueba
    print("\n¿Deseas enviar un email de prueba? (s/n): ", end="")
    response = input().strip().lower()
    
    if response in ['s', 'si', 'y', 'yes']:
        test_send_email()
    else:
        print("\n✅ Verificación de configuración completada")
        print("   Para enviar un email de prueba, ejecuta:")
        print("   python test_email.py")

if __name__ == '__main__':
    main()
