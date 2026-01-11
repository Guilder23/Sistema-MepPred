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
    materia = models.ForeignKey('materias.Materia', on_delete=models.CASCADE, verbose_name='Materia')
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
        Reglas:
        1. Dentro de una materia: solo se desbloquea si el contenido anterior está completado
        2. Entre materias: solo se desbloquea si TODA la materia anterior está 100% completada
        """
        # Si es admin, siempre disponible
        if usuario.is_superuser or getattr(usuario, 'role', '') == 'admin':
            return True
        
        # Debe estar publicado y activo
        if self.estado != 'activo' or self.publicacion != 'publicado':
            return False
        
        # Obtener todos los contenidos publicados ordenados por materia y orden
        todos_contenidos = Contenido.objects.filter(
            estado='activo',
            publicacion='publicado'
        ).order_by('materia', 'orden')
        
        # Agrupar por materia
        materias = {}
        for cont in todos_contenidos:
            if cont.materia not in materias:
                materias[cont.materia] = []
            materias[cont.materia].append(cont)
        
        # Obtener lista de materias ordenadas
        materias_ordenadas = list(materias.keys())
        
        # Verificar si es el primer contenido de la primera materia
        if materias_ordenadas and materias[materias_ordenadas[0]]:
            primer_contenido = materias[materias_ordenadas[0]][0]
            if self.id == primer_contenido.id:
                return True  # El primer contenido siempre está disponible
        
        # Encontrar la posición de este contenido
        materia_actual = self.materia
        contenidos_materia = materias.get(materia_actual, [])
        
        try:
            indice_contenido = next(i for i, c in enumerate(contenidos_materia) if c.id == self.id)
        except StopIteration:
            return False
        
        # Si NO es el primer contenido de la materia, verificar que el anterior esté completado
        if indice_contenido > 0:
            contenido_anterior = contenidos_materia[indice_contenido - 1]
            try:
                progreso_anterior = ProgresoContenido.objects.get(
                    usuario=usuario,
                    contenido=contenido_anterior
                )
                return progreso_anterior.completado
            except ProgresoContenido.DoesNotExist:
                return False
        
        # Si ES el primer contenido de la materia (pero no la primera materia)
        # verificar que TODA la materia anterior esté completada
        try:
            indice_materia = materias_ordenadas.index(materia_actual)
        except ValueError:
            return False
        
        if indice_materia > 0:
            # Hay una materia anterior
            materia_anterior = materias_ordenadas[indice_materia - 1]
            contenidos_materia_anterior = materias[materia_anterior]
            
            # Verificar que TODOS los contenidos de la materia anterior estén completados
            for contenido_ant in contenidos_materia_anterior:
                try:
                    progreso = ProgresoContenido.objects.get(
                        usuario=usuario,
                        contenido=contenido_ant
                    )
                    if not progreso.completado:
                        return False  # Falta completar un contenido de la materia anterior
                except ProgresoContenido.DoesNotExist:
                    return False  # No ha iniciado un contenido de la materia anterior
            
            return True  # Todos los contenidos de la materia anterior están completados
        
        # Es el primer contenido de la primera materia
        return True


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
