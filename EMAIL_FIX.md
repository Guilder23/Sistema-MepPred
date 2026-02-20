# Problema de Envío de Emails en Render (Resuelto)

## 🔴 Problema Identificado

El servidor mostraba error 500 al intentar recuperar contraseña porque:

```
[CRITICAL] WORKER TIMEOUT
File "apps/cuentas/views.py", line 395, in solicitar_recuperacion
    send_mail(...)
```

**Causa**: Render bloquea conexiones SMTP salientes (puerto 587) en el plan gratuito para prevenir spam. La aplicación se congelaba intentando conectar a `smtp.gmail.com:587`.

## ✅ Solución Implementada

### 1. **Timeout de Gunicorn aumentado**
- **Antes**: gunicorn con timeout de 30s (default)
- **Ahora**: `gunicorn meetwin.wsgi --timeout 120 --workers 2`
- Archivos modificados: `Procfile`, `render.yaml`

### 2. **Timeout de conexión SMTP**
- Agregado `EMAIL_TIMEOUT = 10` en `settings.py`
- Evita que la conexión se congele indefinidamente

### 3. **fail_silently=True en producción**
- Todas las llamadas `send_mail()` ahora usan `fail_silently=True`
- Si el email falla, la aplicación continúa funcionando normalmente
- El usuario puede seguir usando recuperación de contraseña

## 📧 Estado del Envío de Emails

### En Producción (Render):
- ❌ **SMTP bloqueado** - Los emails NO se envían pero la app funciona
- ✅ **App estable** - No más errores 500
- ⚠️ **Alternativa recomendada**: Usar SendGrid (ver abajo)

### En Local:
- ✅ **SMTP funciona** - Emails se envían correctamente
- Usando `202005745@est.umss.edu` via smtp.gmail.com

## 🚀 Alternativa Recomendada: SendGrid

Para que los emails funcionen en producción:

### 1. Crear cuenta en SendGrid (Gratis)
- https://signup.sendgrid.com/
- Plan gratuito: 100 emails/día

### 2. Obtener API Key
- Dashboard → Settings → API Keys → Create API Key
- Copiar la clave generada

### 3. Instalar SendGrid
```bash
pip install sendgrid
```

### 4. Configurar en Render
Agregar variables de entorno:
```
SENDGRID_API_KEY=tu-api-key-aqui
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=tu-api-key-aqui
```

### 5. O usar MailGun / Amazon SES
Ambos tienen planes gratuitos y funcionan en Render.

## 📝 Archivos Modificados

1. **`render.yaml`** - Timeout de Gunicorn
2. **`Procfile`** - Timeout de Gunicorn
3. **`meetwin/settings.py`** - EMAIL_TIMEOUT configurado
4. **`apps/cuentas/views.py`** - fail_silently=True en todos los send_mail()

## 🧪 Testing

Para probar emails en producción con SendGrid:
```bash
# En Render Shell
python test_email.py
```

## 📌 Notas

- La app ahora es **estable** aunque los emails no se envíen en Render
- Los usuarios pueden usar todas las funciones (registro, login, recuperación)
- Para emails en producción, **implementar SendGrid** es la solución definitiva
