#!/usr/bin/env python
"""
Script para crear usuarios de administrador y estudiante automáticamente
"""
import os
import django
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'meetwin.settings')
django.setup()

from apps.cuentas.models import User, UserRole, StudentStatus, Gender

# Datos de los usuarios
USERS = [
    {
        'email': 'admin@gmail.com',
        'password': 'admin12345',
        'username': 'admin',
        'first_name': 'Administrador',
        'last_name': 'Sistema',
        'role': UserRole.ADMIN,
        'is_admin': True,
        'is_staff': True,
        'is_superuser': True,
        'email_verificado': True,
        'is_active': True,
        'student_status': None,
        'birth_date': None,
        'gender': None,
        'phone_number': None,
        'identity_number': None,
        'nationality': None,
    },
    {
        'email': 'pplg39394@gmail.com',
        'password': 'guilder1234',
        'username': 'estudiante_test',
        'first_name': 'Estudiante',
        'last_name': 'Test',
        'role': UserRole.STUDENT,
        'is_admin': False,
        'is_staff': False,
        'is_superuser': False,
        'email_verificado': True,
        'is_active': True,
        'student_status': StudentStatus.ASPIRANT,
        'birth_date': date(2005, 7, 20),
        'gender': Gender.MALE,
        'phone_number': '+591 123456789',
        'identity_number': '12345678',
        'nationality': 'Bolivia',
    },
]

def crear_usuarios():
    """Crea los usuarios si no existen"""
    for user_data in USERS:
        email = user_data['email']
        
        # Verificar si el usuario ya existe
        if User.objects.filter(email=email).exists():
            print(f"✓ Usuario {email} ya existe")
            continue
        
        # Crear el usuario
        user = User.objects.create_user(
            email=email,
            username=user_data['username'],
            password=user_data['password'],
            first_name=user_data['first_name'],
            last_name=user_data['last_name'],
            role=user_data['role'],
            is_staff=user_data['is_staff'],
            is_superuser=user_data['is_superuser'],
            email_verificado=user_data['email_verificado'],
            is_active=user_data['is_active'],
            student_status=user_data['student_status'],
            birth_date=user_data['birth_date'],
            gender=user_data['gender'],
            phone_number=user_data['phone_number'],
            identity_number=user_data['identity_number'],
            nationality=user_data['nationality'],
        )
        
        print(f"✓ Usuario creado: {email}")

if __name__ == '__main__':
    print("Creando usuarios de prueba...")
    crear_usuarios()
    print("¡Hecho!")
