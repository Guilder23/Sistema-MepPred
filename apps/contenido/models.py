from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Contenido(models.Model):
    """Modelo para gestión de contenidos educativos"""
    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
    ]
    
    PUBLICACION_CHOICES = [
        ('publicado', 'Publicado'),
        ('no_publicado', 'No Publicado'),
    ]
    
    titulo = models.CharField(max_length=255, verbose_name='Título del contenido')
    descripcion = models.TextField(verbose_name='Descripción del contenido')
    contenido_tema = models.TextField(verbose_name='Contenido del tema')
    materia = models.CharField(max_length=100, verbose_name='Materia')
    nivel_curso = models.CharField(max_length=100, verbose_name='Nivel/Curso')
    
    # Estado y publicación
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='activo', verbose_name='Estado')
    publicacion = models.CharField(max_length=20, choices=PUBLICACION_CHOICES, default='no_publicado', verbose_name='Publicación')
    
    # Sistema de progreso y secuencia
    orden = models.PositiveIntegerField(default=0, verbose_name='Orden en el curso', help_text='Define la secuencia del contenido')
    prerequisito = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='contenidos_siguientes', verbose_name='Contenido prerequisito')
    es_obligatorio = models.BooleanField(default=True, verbose_name='Es obligatorio completar')
    
    # Auditoría
    creado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='contenidos_creados')
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')
    fecha_edicion = models.DateTimeField(auto_now=True, verbose_name='Fecha de última edición')
    editado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='contenidos_editados')
    
    class Meta:
        ordering = ['orden', '-fecha_creacion']
        verbose_name = 'Contenido'
        verbose_name_plural = 'Contenidos'
    
    def __str__(self):
        return self.titulo
    
    def esta_disponible_para(self, usuario):
        """Verifica si el contenido está disponible para el usuario"""
        # Si es admin, siempre disponible
        if usuario.is_superuser or getattr(usuario, 'role', '') == 'admin':
            return True
        
        # Debe estar publicado y activo
        if self.estado != 'activo' or self.publicacion != 'publicado':
            return False
        
        # Si no tiene prerequisito, está disponible
        if not self.prerequisito:
            return True
        
        # Verificar si completó el prerequisito
        try:
            progreso = ProgresoContenido.objects.get(
                usuario=usuario,
                contenido=self.prerequisito
            )
            return progreso.completado
        except ProgresoContenido.DoesNotExist:
            return False


class ProgresoContenido(models.Model):
    """Modelo para registrar el progreso de estudiantes en contenidos"""
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progresos')
    contenido = models.ForeignKey(Contenido, on_delete=models.CASCADE, related_name='progresos')
    completado = models.BooleanField(default=False, verbose_name='Completado')
    fecha_inicio = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de inicio')
    fecha_completado = models.DateTimeField(null=True, blank=True, verbose_name='Fecha de completado')
    porcentaje_avance = models.PositiveIntegerField(default=0, verbose_name='Porcentaje de avance')
    
    class Meta:
        unique_together = ['usuario', 'contenido']
        ordering = ['-fecha_inicio']
        verbose_name = 'Progreso de contenido'
        verbose_name_plural = 'Progresos de contenidos'
    
    def __str__(self):
        return f"{self.usuario.username} - {self.contenido.titulo} ({self.porcentaje_avance}%)"


class VideoContenido(models.Model):
    """Modelo para los videos asociados a un contenido"""
    contenido = models.ForeignKey(Contenido, on_delete=models.CASCADE, related_name='videos')
    enlace = models.URLField(max_length=500, verbose_name='Enlace del video')
    orden = models.PositiveIntegerField(default=0, verbose_name='Orden')
    
    class Meta:
        ordering = ['orden']
        verbose_name = 'Video'
        verbose_name_plural = 'Videos'
    
    def __str__(self):
        return f"Video {self.orden} - {self.contenido.titulo}"
