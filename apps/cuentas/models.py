from django.conf import settings
from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager


class UserRole(models.TextChoices):
    STUDENT = 'student', 'Estudiante'
    ADMIN = 'admin', 'Administrador'


class StudentStatus(models.TextChoices):
    ASPIRANT = 'aspirant', 'Postulante'
    UNIVERSITY = 'university', 'Universitario'


class StudyYear(models.TextChoices):
    PRE_UNI = 'pre_uni', 'Pre-universitario'
    YEAR_1 = 'year_1', 'Año 1'
    YEAR_2 = 'year_2', 'Año 2'
    YEAR_3 = 'year_3', 'Año 3'
    YEAR_4 = 'year_4', 'Año 4'
    YEAR_5 = 'year_5', 'Año 5'


class Gender(models.TextChoices):
    MALE = 'male', 'Masculino'
    FEMALE = 'female', 'Femenino'
    OTHER = 'other', 'Otro'
    PREFER_NOT = 'prefer_not', 'Prefiero no decirlo'


class CustomUserManager(UserManager):
    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', UserRole.ADMIN)
        user = super().create_superuser(username, email=email, password=password, **extra_fields)
        if getattr(user, 'role', None) != UserRole.ADMIN:
            user.role = UserRole.ADMIN
            user.save(update_fields=['role'])
        return user


class User(AbstractUser):
    email = models.EmailField(unique=True)
    email_verificado = models.BooleanField(default=False)
    verificacion_enviada_en = models.DateTimeField(blank=True, null=True)
    verificacion_reenvios = models.PositiveIntegerField(default=0)
    verificacion_ventana_inicio = models.DateTimeField(blank=True, null=True)

    objects = CustomUserManager()
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.STUDENT,
    )
    
    # Estado del estudiante (Postulante o Universitario)
    student_status = models.CharField(
        max_length=20,
        choices=StudentStatus.choices,
        default=StudentStatus.ASPIRANT,
        blank=True,
        null=True,
    )
    
    # Información universitaria (si es universitario)
    university = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Universidad donde estudias"
    )
    faculty = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Facultad"
    )
    career = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Carrera"
    )
    
    # Año de estudio
    study_year = models.CharField(
        max_length=20,
        choices=StudyYear.choices,
        default=StudyYear.PRE_UNI,
        blank=True,
        null=True,
    )
    
    # Información personal
    birth_date = models.DateField(blank=True, null=True)
    gender = models.CharField(
        max_length=20,
        choices=Gender.choices,
        blank=True,
        null=True,
    )
    identity_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Número de cédula o carnet de identidad"
    )
    nationality = models.CharField(
        max_length=100,
        blank=True,
        null=True,
    )
    phone_number = models.CharField(
        max_length=20,
        blank=True,
        null=True,
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self) -> str:
        return self.email


class CambioRol(models.Model):
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='cambios_rol_realizados',
    )
    objetivo = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='cambios_rol_recibidos',
    )
    rol_anterior = models.CharField(max_length=20)
    rol_nuevo = models.CharField(max_length=20)
    creado_en = models.DateTimeField(auto_now_add=True)
