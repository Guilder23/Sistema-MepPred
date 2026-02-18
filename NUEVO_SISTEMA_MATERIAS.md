# Nuevo Sistema de Materias, Temas y Contenidos

## 📋 Resumen del Cambio

Se ha implementado un nuevo sistema de acceso y progreso para materias, temas y contenidos educativos. Este sistema reemplaza el flujo anterior donde era necesario aprobar una materia completa para desbloquear la siguiente.

## 🎯 Nuevo Flujo de Funcionamiento

### 1. **Acceso a Materias**
- ✅ **Todas las materias están visibles** para todos los estudiantes
- ✅ Los estudiantes pueden navegar y explorar todas las materias disponibles

### 2. **Acceso a Temas (Gratis vs Premium)**
Cada materia contiene temas que pueden ser:

#### Temas Gratuitos
- ✅ Accesibles para **todos los estudiantes** (con o sin suscripción)
- ✅ Identificados con `requiere_suscripcion = False`

#### Temas Premium
- 🔒 Requieren **suscripción activa** para acceder
- 🔒 Identificados con `requiere_suscripcion = True`
- 🔒 Si un estudiante no tiene suscripción, verá el tema pero **no podrá acceder** a sus contenidos
- 🔒 Mensaje mostrado: *"Este tema requiere suscripción premium"*

### 3. **Desbloqueo de Contenidos**

#### Dentro de un Tema
Los contenidos se desbloquean **secuencialmente**:
- ✅ El **primer contenido** de cada tema está disponible automáticamente
- ✅ Los contenidos siguientes se desbloquean al **completar el anterior**
- ✅ Ejemplo: Contenido 1 → (completar) → Contenido 2 → (completar) → Contenido 3

#### Entre Temas (de la misma materia)
Para acceder al siguiente tema de una materia:
- ✅ Debes **aprobar el examen** del tema anterior
- ✅ Nota mínima para aprobar: **16/20 (80%)**
- ✅ El primer tema de cada materia siempre está disponible

### 4. **Sistema de Exámenes**

#### Disponibilidad del Examen
- ✅ El examen se habilita cuando **todos los contenidos del tema están completados**
- ✅ Si el tema es premium, requiere suscripción activa

#### Intentos y Ranking
- 🏆 **Primer intento**: Si apruebas, entras al **ranking** automáticamente
- 🏆 **Primer intento**: Si no apruebas, **NO entras al ranking**
- ♻️ **Siguientes intentos**: Puedes seguir intentando **ilimitadamente** hasta aprobar
- ♻️ **Siguientes intentos**: NO cuentan para el ranking (solo el primero)

#### Progreso después del Examen
- ✅ Al aprobar el examen (≥80%), se **desbloquea el siguiente tema** de la misma materia
- ✅ El primer contenido del nuevo tema se vuelve accesible
- ✅ Si es un tema premium y no tienes suscripción, verás el mensaje de bloqueo

### 5. **Barras de Progreso**

#### Progreso por Materia
- 📊 Muestra el **porcentaje de contenidos completados** en esa materia
- 📊 Calcula: `(contenidos completados / total contenidos) * 100`
- 📊 Solo cuenta los temas que el estudiante puede ver (según suscripción)

#### Progreso General
- 📊 Muestra el **porcentaje total** de todos los contenidos completados
- 📊 Calcula: `(total completados en todas materias / total contenidos accesibles) * 100`
- 📊 Solo cuenta temas accesibles según suscripción

## 🔧 Cambios Técnicos Implementados

### Modelos Modificados

#### 1. `Contenido.esta_disponible_para()`
**Ubicación**: `apps/contenido/models.py`

Nueva lógica:
1. Verificar si el usuario es admin (acceso completo)
2. Verificar que el contenido esté activo y publicado
3. **NUEVO**: Verificar si el tema requiere suscripción premium
4. Desbloqueo secuencial dentro del tema (completar anterior)
5. Verificar aprobación del examen del tema anterior (si no es el primer tema)

### Vistas Modificadas

#### 1. `listar_contenidos_publicados()`
**Ubicación**: `apps/contenido/views.py`

- Muestra **todas las materias** con sus temas
- Filtra temas según suscripción (gratis/premium)
- Incluye información de exámenes disponibles por tema
- Retorna estructura organizada: `materias → temas → contenidos`

#### 2. `obtener_progreso_usuario()`
**Ubicación**: `apps/contenido/views.py`

- Calcula progreso **por materia**
- Calcula progreso **general**
- Filtra temas premium según suscripción
- Incluye información de exámenes y aprobación

#### 3. `obtener_examenes()`
**Ubicación**: `apps/evaluaciones/views.py`

- Organiza exámenes por **materia → tema**
- Verifica completitud de contenidos antes de permitir acceso
- Indica si el estudiante puede entrar al ranking (solo primer intento)
- Muestra mejor nota y total de intentos

### Nuevas Vistas Creadas

#### 1. `listar_materias_estudiante()`
**Ubicación**: `apps/materias_nueva/views.py`
**Ruta**: `/api/estudiante/materias/`

Retorna todas las materias con:
- Total de temas (visibles y bloqueados)
- Total de contenidos
- Contenidos completados
- Porcentaje de progreso

#### 2. `obtener_materia_estudiante(materia_id)`
**Ubicación**: `apps/materias_nueva/views.py`
**Ruta**: `/api/estudiante/materias/<id>/`

Retorna una materia específica con:
- Todos sus temas
- Estado de cada tema (accesible o bloqueado)
- Progreso de contenidos por tema
- Información de exámenes

#### 3. `obtener_tema_estudiante(tema_id)`
**Ubicación**: `apps/temas/views.py`
**Ruta**: `/api/estudiante/temas/<id>/`

Retorna un tema específico con:
- Todos sus contenidos
- Estado de disponibilidad de cada contenido
- Progreso de completitud
- Videos asociados
- Información del examen (disponibilidad, intentos, notas)

### Sistema de Ranking

**Ubicación**: `apps/ranking/models.py`

El ranking ya estaba implementado correctamente:
- Filtra solo intentos con `cuenta_para_ranking=True`
- Filtra solo intentos aprobados
- Calcula promedio de notas
- Se puede filtrar por materia y período

## 📊 Estructura de Datos API

### GET `/api/estudiante/materias/`
```json
{
  "success": true,
  "materias": [
    {
      "id": 1,
      "nombre": "Matemáticas",
      "descripcion": "...",
      "total_temas": 5,
      "temas_visibles": 3,
      "temas_bloqueados": 2,
      "total_contenidos": 15,
      "contenidos_completados": 8,
      "porcentaje": 53
    }
  ],
  "es_premium": false
}
```

### GET `/api/estudiante/materias/<id>/`
```json
{
  "success": true,
  "materia": {
    "id": 1,
    "nombre": "Matemáticas",
    "total_contenidos": 15,
    "contenidos_completados": 8,
    "porcentaje": 53,
    "temas": [
      {
        "id": 1,
        "nombre": "Álgebra Básica",
        "requiere_suscripcion": false,
        "puede_ver": true,
        "total_contenidos": 5,
        "contenidos_completados": 3,
        "porcentaje": 60,
        "examen": {
          "id": 10,
          "titulo": "Examen de Álgebra",
          "disponible": false,
          "aprobado": false,
          "mejor_nota": null,
          "total_intentos": 0
        }
      }
    ]
  },
  "es_premium": false
}
```

### GET `/api/estudiante/temas/<id>/`
```json
{
  "success": true,
  "tema": {
    "id": 1,
    "nombre": "Álgebra Básica",
    "requiere_suscripcion": false,
    "total_contenidos": 5,
    "contenidos_completados": 3,
    "porcentaje": 60,
    "contenidos": [
      {
        "id": 1,
        "titulo": "Introducción al Álgebra",
        "esta_disponible": true,
        "completado": true,
        "porcentaje_avance": 100,
        "videos": [...]
      }
    ],
    "examen": {
      "id": 10,
      "disponible": false,
      "aprobado": false,
      "puede_entrar_ranking": true,
      "intentos": []
    }
  },
  "es_premium": false
}
```

## 🚀 Flujo de Usuario (Ejemplo)

### Estudiante Sin Suscripción

1. Ve todas las materias disponibles
2. Entra a "Matemáticas"
3. Ve todos los temas:
   - ✅ "Álgebra Básica" (gratis) → Puede acceder
   - 🔒 "Cálculo Avanzado" (premium) → Bloqueado
4. Entra a "Álgebra Básica"
5. Ve el Contenido 1 (disponible)
6. Completa el Contenido 1
7. Se desbloquea el Contenido 2
8. Completa todos los contenidos del tema
9. Se habilita el examen
10. Realiza el examen (primer intento)
    - ✅ Si aprueba (≥80%): Entra al ranking + Se desbloquea siguiente tema
    - ❌ Si no aprueba: NO entra al ranking + Puede seguir intentando

### Estudiante Premium

1. Ve todas las materias
2. Puede acceder a **todos los temas** (gratis y premium)
3. El flujo de contenidos y exámenes es igual
4. Al aprobar cada examen, desbloquea el siguiente tema (sin importar si es premium)

## 📝 Notas Importantes

- ✅ Los **administradores** tienen acceso completo a todo el contenido
- ✅ El campo `es_premium` del modelo `Examen` está **DEPRECATED** - ahora se usa `tema.requiere_suscripcion`
- ✅ El sistema de ranking filtra automáticamente solo el primer intento
- ✅ Los estudiantes pueden ver los temas premium pero no acceder a ellos sin suscripción
- ✅ No hay límite de intentos de examen, pero solo el primero cuenta para ranking
- ✅ El progreso se calcula solo para temas accesibles según suscripción

## 🔍 Testing Recomendado

1. **Estudiante sin suscripción**:
   - Verificar acceso solo a temas gratis
   - Verificar bloqueo de temas premium
   - Verificar desbloqueo secuencial de contenidos
   - Verificar habilitación de examen tras completar contenidos
   - Verificar desbloqueo de siguiente tema tras aprobar examen

2. **Estudiante premium**:
   - Verificar acceso a todos los temas
   - Verificar mismo flujo de contenidos y exámenes

3. **Sistema de ranking**:
   - Verificar que solo el primer intento aprobado cuenta
   - Verificar que intentos posteriores no afectan ranking
   - Verificar filtrado por materia

4. **Progreso**:
   - Verificar cálculo correcto por materia
   - Verificar cálculo correcto general
   - Verificar que solo cuenta temas accesibles
