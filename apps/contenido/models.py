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
    
    TIPO_CONTENIDO_CHOICES = [
        ('universitario', 'Universitario'),
        ('postulante', 'Postulante'),
    ]
    
    titulo = models.CharField(max_length=255, verbose_name='Título del contenido')
    descripcion = models.TextField(verbose_name='Descripción del contenido')
    contenido_tema = models.TextField(verbose_name='Contenido del tema')
    tema = models.ForeignKey('temas.Tema', on_delete=models.CASCADE, verbose_name='Tema')
    nivel_curso = models.CharField(max_length=100, verbose_name='Nivel/Curso')
    tipo_contenido = models.CharField(max_length=20, choices=TIPO_CONTENIDO_CHOICES, default='universitario', verbose_name='Tipo de contenido')
    
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
        """
        Verifica si el contenido está disponible para el usuario.
        NUEVO FLUJO:
        1. Si es administrador, siempre disponible
        2. Debe estar publicado y activo
        3. Verificar si el tema es premium y si el usuario tiene suscripción activa
        4. Dentro de un tema: desbloqueo secuencial (completar contenido anterior)
        5. Primer contenido de cada tema: verificar que aprobó el examen del tema anterior
        """
        # Si es admin, siempre disponible
        if usuario.is_superuser or getattr(usuario, 'role', '') == 'admin':
            return True
        
        # Debe estar publicado y activo
        if self.estado != 'activo' or self.publicacion != 'publicado':
            return False
        
        # Verificar si el tema requiere suscripción premium
        if self.tema and self.tema.requiere_suscripcion:
            from apps.suscripciones.models import Suscripcion
            suscripcion = Suscripcion.objects.filter(
                estudiante=usuario,
                estado='APROBADO'
            ).first()
            
            if not suscripcion or not suscripcion.esta_activa():
                return False  # Tema premium bloqueado sin suscripción
        
        # Obtener todos los contenidos del mismo tema, ordenados
        contenidos_tema = Contenido.objects.filter(
            tema=self.tema,
            estado='activo',
            publicacion='publicado'
        ).order_by('orden', 'id')
        
        contenidos_lista = list(contenidos_tema)
        
        try:
            indice_contenido = next(i for i, c in enumerate(contenidos_lista) if c.id == self.id)
        except StopIteration:
            return False
        
        # Si es el primer contenido del tema
        if indice_contenido == 0:
            # Verificar si debe aprobar examen del tema anterior
            from apps.temas.models import Tema
            from apps.evaluaciones.models import Examen, IntentoExamen
            
            # Obtener todos los temas de la misma materia, ordenados
            temas_materia = list(Tema.objects.filter(
                materia=self.tema.materia
            ).order_by('id'))
            
            try:
                indice_tema = next(i for i, t in enumerate(temas_materia) if t.id == self.tema.id)
            except StopIteration:
                return False
            
            # Si NO es el primer tema de la materia
            if indice_tema > 0:
                tema_anterior = temas_materia[indice_tema - 1]
                
                # Buscar el examen del tema anterior
                examen_anterior = Examen.objects.filter(
                    tema=tema_anterior,
                    activo=True
                ).first()
                
                if examen_anterior:
                    # Verificar si aprobó el examen (nota >= 80/100 = 80%)
                    intento_aprobado = IntentoExamen.objects.filter(
                        estudiante=usuario,
                        examen=examen_anterior,
                        nota__gte=80
                    ).exists()
                    
                    if not intento_aprobado:
                        return False  # No aprobó el examen del tema anterior
                else:
                    # Si no hay examen, bloquear (debe existir examen para avanzar)
                    return False
            
            # Es el primer tema O aprobó el examen anterior
            return True
        
        # NO es el primer contenido del tema: verificar que completó el anterior
        contenido_anterior = contenidos_lista[indice_contenido - 1]
        try:
            progreso_anterior = ProgresoContenido.objects.get(
                usuario=usuario,
                contenido=contenido_anterior
            )
            return progreso_anterior.completado
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
