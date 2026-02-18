from django.contrib.auth import get_user_model
from apps.contenido.views import obtener_progreso_usuario
from django.test import RequestFactory
import json

User = get_user_model()
user = User.objects.get(username='guilder')

factory = RequestFactory()
request = factory.get('/contenido/api/progreso/')
request.user = user

response = obtener_progreso_usuario(request)
data = json.loads(response.content)

print(f'\n=== MATERIAS EN RESPUESTA API ===')
print(f'Total materias: {len(data["materias"])}')
print()

for m in data['materias']:
    print(f'ID: {m["id"]}')
    print(f'Nombre: {m["nombre"]}')
    print(f'Total temas: {m["total_temas"]}')
    print(f'Temas completados: {m["temas_completados"]}')
    print(f'Porcentaje: {m["porcentaje"]}%')
    print(f'Temas en array: {len(m["temas"])}')
    print('---')
