#!/bin/bash

set -o errexit

pip install -r requirements.txt

python manage.py migrate || echo "Migration failed, continuing..."

python manage.py collectstatic --noinput --clear || echo "Collectstatic failed, continuing..."
