release: python manage.py migrate --noinput
web: gunicorn meetwin.wsgi:application --bind 0.0.0.0:$PORT
