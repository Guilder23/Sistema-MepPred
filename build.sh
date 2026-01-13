#!/bin/bash

set -o errexit

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Running migrations..."
python manage.py migrate --noinput || true

echo "Collecting static files..."
mkdir -p staticfiles
python manage.py collectstatic --noinput --clear --ignore=node_modules || true

echo "Build complete!"
