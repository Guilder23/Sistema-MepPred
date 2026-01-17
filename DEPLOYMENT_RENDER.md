# Guía de Deployment en Render

## Pasos para desplegar la aplicación en Render

### 1. Preparar el repositorio
- ✅ Branch `deployrender2` creada
- ✅ `requirements.txt` actualizado con dependencias necesarias
- ✅ `Procfile` configurado para Gunicorn
- ✅ `runtime.txt` especifica Python 3.11
- ✅ `build.sh` script para construcción automática
- ✅ `settings.py` configurado para producción
- ✅ Variables de entorno configuradas

### 2. Crear una cuenta en Render
- Ir a [https://render.com](https://render.com)
- Crear una cuenta gratuita
- Conectar tu repositorio de GitHub

### 3. Crear una base de datos PostgreSQL en Render
1. En el dashboard de Render, ir a "Databases"
2. Hacer clic en "New +"
3. Seleccionar "PostgreSQL"
4. Configurar:
   - **Name**: `meetwin-db`
   - **Database**: `medpred`
   - **User**: `postgres`
   - **Region**: Seleccionar la más cercana
5. Copiar la URL de conexión (CONNECTION_STRING o DATABASE_URL)

### 4. Crear el servicio Web
1. En el dashboard, ir a "Services"
2. Hacer clic en "New +"
3. Seleccionar "Web Service"
4. Conectar el repositorio y seleccionar rama `deployrender2`
5. Configurar:
   - **Name**: `meetwin-app`
   - **Environment**: `Python 3`
   - **Build Command**: `bash build.sh`
   - **Start Command**: `gunicorn meetwin.wsgi`
   - **Plan**: Free o Starter según necesidades

### 5. Configurar variables de entorno
En la sección "Environment" del servicio web, añadir:

```
DATABASE_URL=<Copiar de la BD creada>
DEBUG=False
SECRET_KEY=<Generar una clave segura>
ALLOWED_HOSTS=<tu-app>.onrender.com,localhost
EMAIL_USER=<tu-email@gmail.com>
EMAIL_PASSWORD=<contraseña-de-aplicacion>
SUPABASE_URL=<tu-supabase-url>
SUPABASE_SERVICE_KEY=<tu-supabase-key>
JWT_SECRET=<tu-jwt-secret>
```

### 6. Generar SECRET_KEY seguro
Ejecutar en Python:
```python
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

### 7. Hacer push a GitHub
```bash
git add .
git commit -m "Configure para Render deployment"
git push origin deployrender2
```

### 8. Deploy automático
- Render detectará los cambios en GitHub
- Ejecutará automáticamente `build.sh`
- Aplicará las migraciones
- Recopilará archivos estáticos
- Iniciará la aplicación

### 9. Verificar el deployment
- Ir a la URL asignada: `https://<tu-app>.onrender.com`
- Revisar los logs en "Logs" tab
- Ejecutar comandos en "Shell" si es necesario

## Estructura de archivos para Render

```
Sistema-MeedPred/
├── Procfile                 # Comando para iniciar la app
├── runtime.txt             # Versión de Python
├── build.sh                # Script de construcción
├── render.yaml             # Configuración de Render
├── requirements.txt        # Dependencias Python
├── .env.example            # Variables de entorno de ejemplo
├── manage.py
├── meetwin/
│   ├── settings.py         # (Actualizado para producción)
│   ├── wsgi.py
│   └── ...
├── apps/
├── static/                 # Archivos estáticos
├── media/                  # Archivos de usuario
├── templates/
└── db.sqlite3
```

## Cambios realizados en settings.py

1. **SECRET_KEY**: Ahora usa variable de entorno
   ```python
   SECRET_KEY = os.environ.get('SECRET_KEY', '...')
   ```

2. **DEBUG**: Ahora usa variable de entorno (False en producción)
   ```python
   DEBUG = os.environ.get('DEBUG', 'False') == 'True'
   ```

3. **ALLOWED_HOSTS**: Configurable por variables de entorno
   ```python
   ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '...').split(',')
   ```

4. **Database**: Usa DATABASE_URL o credenciales por entorno
   ```python
   'default': {
       'ENGINE': 'django.db.backends.postgresql',
       'NAME': os.environ.get('DB_NAME', 'medpred'),
       ...
   }
   ```

5. **Static Files**: Configurado con WhiteNoise
   ```python
   STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
   STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
   ```

6. **Middleware**: Agregado WhiteNoise
   ```python
   'whitenoise.middleware.WhiteNoiseMiddleware',
   ```

## Solución de problemas comunes

### Error 500 en la aplicación
- Revisar logs: `heroku logs --tail`
- Verificar variables de entorno
- Asegurar que las migraciones se ejecutaron

### Archivos estáticos no cargan
- Ejecutar: `python manage.py collectstatic`
- Verificar STATIC_ROOT y STATICFILES_DIRS
- Revisar WhiteNoise está en MIDDLEWARE

### Errores de conexión a BD
- Verificar DATABASE_URL es correcto
- Ejecutar: `python manage.py migrate`
- Revisar credenciales en variables de entorno

### Aplicación tarda mucho en cargar
- Aumentar memoria en Render (plan pagado)
- Optimizar queries en bases de datos
- Usar caching

## Comandos útiles en Render Shell

```bash
# Ver versión de Python
python --version

# Verificar migraciones
python manage.py showmigrations

# Crear superusuario
python manage.py createsuperuser

# Aplicar migraciones manualmente
python manage.py migrate

# Verificar static files
python manage.py collectstatic --dry-run
```

## Notas de seguridad

⚠️ **IMPORTANTE**: Antes de deployar en producción:

1. ✅ Cambiar SECRET_KEY a un valor único y seguro
2. ✅ Cambiar DEBUG a False
3. ✅ No exponer credenciales en el código
4. ✅ Usar variables de entorno para todo
5. ✅ Configurar ALLOWED_HOSTS correctamente
6. ✅ Usar HTTPS (Render lo proporciona automáticamente)
7. ✅ Configurar CORS si hay frontend separado
8. ✅ Validar todas las entradas de usuario

## Próximas mejoras opcionales

- Configurar dominio personalizado
- Implementar CI/CD con GitHub Actions
- Configurar backups automáticos de BD
- Implementar monitoring y alertas
- Usar Redis para caché
- Configurar CDN para archivos estáticos
