"""
Storage backend personalizado para Django usando Supabase Storage
Con fallback automático a almacenamiento local cuando no hay conexión
"""
import os
import socket
from django.core.files.storage import Storage, FileSystemStorage
from django.core.files.base import ContentFile
from django.conf import settings
from pathlib import Path

try:
    from supabase import create_client
except ImportError:
    raise ImportError("Debes instalar la librería 'supabase': pip install supabase")


class SupabaseStorage(Storage):
    """
    Storage backend que almacena archivos en Supabase Storage
    Con fallback automático a almacenamiento local
    """
    
    def __init__(self):
        self.supabase_url = os.environ.get('SUPABASE_URL', '').strip()
        self.supabase_key = os.environ.get('SUPABASE_SECRET_KEY', '').strip()
        self.bucket_name = os.environ.get('SUPABASE_BUCKET', 'media')
        self.use_fallback = False
        self.client = None
        
        # Inicializar fallback siempre
        self._init_fallback()
        
        if not self.supabase_url or not self.supabase_key:
            self.use_fallback = True
            return
        
        try:
            self.client = create_client(self.supabase_url, self.supabase_key)
        except Exception as e:
            print(f"⚠️  No se pudo conectar a Supabase: {e}")
            print("   Usando almacenamiento local como fallback")
            self.use_fallback = True
    
    def _init_fallback(self):
        """Inicializa el almacenamiento local como fallback"""
        media_root = getattr(settings, 'MEDIA_ROOT', Path(settings.BASE_DIR) / 'media')
        self.fallback_storage = FileSystemStorage(location=str(media_root))
    
    def _is_network_error(self, error):
        """Verifica si el error es de conectividad de red"""
        error_str = str(error).lower()
        network_errors = [
            'getaddrinfo failed',
            'connection refused',
            'no internet',
            'network unreachable',
            'timeout',
            'connection reset',
            'unable to resolve',
        ]
        return any(err in error_str for err in network_errors)
    
    def _open(self, name, mode='rb'):
        """Abre un archivo desde Supabase o fallback"""
        if self.use_fallback:
            return self.fallback_storage._open(name, mode)
        
        try:
            response = self.client.storage.from_(self.bucket_name).download(name)
            return ContentFile(response)
        except Exception as e:
            if self._is_network_error(e):
                print(f"⚠️  Error de red al abrir {name}, usando almacenamiento local")
                return self.fallback_storage._open(name, mode)
            raise FileNotFoundError(f"No se pudo descargar el archivo {name}: {str(e)}")
    
    def _save(self, name, content):
        """Guarda un archivo en Supabase o fallback local"""
        if self.use_fallback:
            return self.fallback_storage._save(name, content)
        
        try:
            # Leer el contenido del archivo
            if hasattr(content, 'read'):
                file_content = content.read()
            else:
                file_content = content
            
            # Subir el archivo a Supabase
            self.client.storage.from_(self.bucket_name).upload(
                name,
                file_content,
                {
                    "contentType": getattr(content, 'content_type', 'application/octet-stream'),
                    "upsert": "false"
                }
            )
            
            return name
        except Exception as e:
            if self._is_network_error(e):
                print(f"⚠️  Error de red al guardar {name}, usando almacenamiento local")
                return self.fallback_storage._save(name, content)
            raise Exception(f"Error al guardar el archivo {name} en Supabase: {str(e)}")
    
    def delete(self, name):
        """Elimina un archivo de Supabase o fallback"""
        if self.use_fallback:
            return self.fallback_storage.delete(name)
        
        try:
            self.client.storage.from_(self.bucket_name).remove([name])
        except Exception as e:
            if self._is_network_error(e):
                print(f"⚠️  Error de red al eliminar {name}, usando almacenamiento local")
                return self.fallback_storage.delete(name)
            raise Exception(f"Error al eliminar el archivo {name}: {str(e)}")
    
    def exists(self, name):
        """Verifica si un archivo existe"""
        if self.use_fallback:
            return self.fallback_storage.exists(name)
        
        try:
            files = self.client.storage.from_(self.bucket_name).list(
                options={"limit": 100}
            )
            return any(f['name'] == name for f in files)
        except Exception as e:
            if self._is_network_error(e):
                return self.fallback_storage.exists(name)
            return False
    
    def listdir(self, path):
        """Lista el contenido de una carpeta"""
        if self.use_fallback:
            return self.fallback_storage.listdir(path)
        
        try:
            files = self.client.storage.from_(self.bucket_name).list(path)
            dirs = []
            file_list = []
            
            for item in files:
                if item.get('metadata') and item['metadata'].get('mimetype') is None:
                    dirs.append(item['name'])
                else:
                    file_list.append(item['name'])
            
            return dirs, file_list
        except Exception as e:
            if self._is_network_error(e):
                return self.fallback_storage.listdir(path)
            raise Exception(f"Error al listar el directorio {path}: {str(e)}")
    
    def size(self, name):
        """Obtiene el tamaño de un archivo"""
        if self.use_fallback:
            return self.fallback_storage.size(name)
        
        try:
            files = self.client.storage.from_(self.bucket_name).list(
                options={"limit": 100}
            )
            for file in files:
                if file['name'] == name:
                    return file.get('metadata', {}).get('size', 0)
            return 0
        except Exception as e:
            if self._is_network_error(e):
                return self.fallback_storage.size(name)
            return 0
    
    def url(self, name):
        """Obtiene la URL pública del archivo"""
        if self.use_fallback:
            return self.fallback_storage.url(name)
        
        try:
            url = self.client.storage.from_(self.bucket_name).get_public_url(name)
            return url
        except Exception as e:
            if self._is_network_error(e):
                return self.fallback_storage.url(name)
            # Construir URL manualmente si falla
            return f"{self.supabase_url.rstrip('/')}/storage/v1/object/public/{self.bucket_name}/{name}"
    
    def get_accessed_time(self, name):
        """No implementado para Supabase, usa fallback"""
        if self.use_fallback:
            return self.fallback_storage.get_accessed_time(name)
        raise NotImplementedError("Supabase Storage no proporciona tiempo de acceso")
    
    def get_created_time(self, name):
        """No implementado para Supabase, usa fallback"""
        if self.use_fallback:
            return self.fallback_storage.get_created_time(name)
        raise NotImplementedError("Supabase Storage no proporciona tiempo de creación")
    
    def get_modified_time(self, name):
        """No implementado para Supabase, usa fallback"""
        if self.use_fallback:
            return self.fallback_storage.get_modified_time(name)
        raise NotImplementedError("Supabase Storage no proporciona tiempo de modificación")
