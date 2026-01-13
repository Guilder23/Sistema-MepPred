release: python manage.py migrate --noinput; python manage.py collectstatic --noinput --clear 2>/dev/null || true
web: gunicorn meetwin.wsgi:application --bind 0.0.0.0:$PORT
