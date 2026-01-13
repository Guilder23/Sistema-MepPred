# Guía de Deploy en Render - MeetWin

## Rama: deployrender
**Rama dedicada para preparación y deploy en Render**

---

## Archivos preparados para Deploy

✅ **requirements.txt** - Dependencias necesarias
✅ **Procfile** - Configuración de procesos
✅ **runtime.txt** - Versión de Python (3.11.7)
✅ **build.sh** - Script de construcción
✅ **render.yaml** - Configuración IaC para Render
✅ **settings.py** - Actualizado para producción
✅ **.env.example** - Variables de entorno actualizadas

---

## Pasos para Deploy en Render

### 1. Conectar repositorio Git
```bash
git add .
git commit -m "Preparación para deploy en Render [deployrender]"
git push origin deployrender
```

### 2. Crear cuenta en Render
- Ir a https://render.com
- Registrarse o iniciar sesión
- Conectar repositorio de GitHub

### 3. Opción A: Deploy manual (recomendado)

#### a) Crear Web Service
1. Dashboard → New → Web Service
2. Seleccionar el repositorio y rama `deployrender`
3. Configuración:
   - **Name:** meetwin
   - **Runtime:** Python 3.11
   - **Build Command:** `./build.sh`
   - **Start Command:** `gunicorn meetwin.wsgi --bind 0.0.0.0:$PORT`
   - **Plan:** Standard ($7/mes)

#### b) Crear PostgreSQL Database
1. Dashboard → New → PostgreSQL
2. Configuración:
   - **Name:** meetwin-db
   - **Database:** meetwin_db
   - **User:** postgres
   - **Plan:** Standard ($15/mes)

#### c) Configurar Variables de Entorno
En el Web Service → Environment:

```
DEBUG=False
SECRET_KEY=<generar-una-nueva-clave>
ALLOWED_HOSTS=meetwin.onrender.com,localhost
DB_NAME=meetwin_db
DB_USER=postgres
DB_PASSWORD=<password-de-la-bd>
DB_HOST=<host-de-la-bd>
DB_PORT=5432
```

### 4. Opción B: Deploy automático con render.yaml
```bash
git push origin deployrender
```
Render detectará automáticamente el archivo `render.yaml` y creará todos los servicios.

---

## Generar SECRET_KEY segura

```python
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

---

## Verificar Deploy

1. Render mostrará los logs de build
2. Esperar a que compile (2-3 minutos)
3. Acceder a `https://meetwin.onrender.com`

---

## Verificación Post-Deploy

### Admin Panel
```
https://meetwin.onrender.com/admin/
```

### Crear superusuario (en el shell de Render)
```bash
python manage.py createsuperuser
```

---

## Solución de Problemas

### Build fallido
- Revisar logs en Render
- Verificar `build.sh` tiene permisos de ejecución
- Confirmar todas las dependencias están en `requirements.txt`

### Errores de conexión a BD
- Verificar credenciales en variables de entorno
- Confirmar que la BD está en el mismo región
- Revisar firewall rules

### Archivos estáticos no cargando
- Ejecutar: `python manage.py collectstatic --no-input`
- Verificar `STATIC_ROOT` en settings.py

---

## Cambios en settings.py para Producción

- ✅ SECRET_KEY desde variable de entorno
- ✅ DEBUG desde variable de entorno
- ✅ ALLOWED_HOSTS configurable
- ✅ WhiteNoise para servir archivos estáticos
- ✅ STATIC_ROOT configurado
- ✅ STATICFILES_STORAGE comprimido

---

## Costo mensual estimado
- Web Service: $7
- PostgreSQL: $15
- **Total: ~$22/mes**

---

## Variables de Entorno en Render
Las variables se pueden actualizar en Dashboard → Settings sin necesidad de redeploy.

Para cambios en código:
```bash
git push origin deployrender
```
Render automáticamente redespliega.

---

## Actualizaciones futuras
1. Hacer cambios en código local en rama deployrender
2. Commit y push a GitHub
3. Render automáticamente redespliega

```bash
git add .
git commit -m "descripción del cambio"
git push origin deployrender
```

---

## Checklist Pre-Deploy

- [ ] Configurar SECRET_KEY en variables de entorno
- [ ] Configurar DEBUG=False
- [ ] Configurar ALLOWED_HOSTS con dominio de Render
- [ ] Crear base de datos PostgreSQL en Render
- [ ] Verificar archivo build.sh existe
- [ ] Verificar requirements.txt con todas las dependencias
- [ ] Ejecutar `python manage.py migrate` en Render
- [ ] Crear superusuario en Render
- [ ] Probar acceso a admin panel
- [ ] Verificar carga de archivos estáticos

---

**Última actualización:** 13 de enero de 2026
**Rama:** deployrender
