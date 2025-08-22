# 📊 Sistema de Encuestas - Análisis y Funcionalidad

## 🎯 Funcionalidad del Sistema

El sistema de encuestas permite a los administradores crear encuestas y a los usuarios votar por múltiples opciones, con la capacidad de sugerir nuevas opciones sujetas a aprobación administrativa.

## 🏗️ Estructura de Tablas

### 1. **Tabla `surveys`** - Encuestas Principales
```sql
CREATE TABLE `surveys` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `question` varchar(255) NOT NULL,           -- Pregunta de la encuesta
  `description` text DEFAULT NULL,            -- Descripción adicional
  `status` enum('draft','active','closed'),   -- Estado: borrador/activa/cerrada
  `created_by` bigint(20) NOT NULL,          -- Admin que creó la encuesta
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `closed_by` bigint(20) DEFAULT NULL,       -- Admin que cerró la encuesta
  `closed_at` datetime DEFAULT NULL           -- Fecha de cierre
)
```

**Estados de Encuesta:**
- `draft`: Borrador (solo visible para admin)
- `active`: Activa (visible para usuarios, pueden votar)
- `closed`: Cerrada (no se pueden agregar votos)

### 2. **Tabla `survey_options`** - Opciones de Voto
```sql
CREATE TABLE `survey_options` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `survey_id` bigint(20) NOT NULL,           -- Encuesta a la que pertenece
  `option_text` varchar(200) NOT NULL,       -- Texto de la opción
  `description` text DEFAULT NULL,            -- Descripción adicional
  `product_id` bigint(20) DEFAULT NULL,      -- Producto relacionado (opcional)
  `created_by` bigint(20) NOT NULL,          -- Usuario que creó la opción
  `is_approved` tinyint(1) DEFAULT 0,        -- 0=Pendiente, 1=Aprobada
  `admin_notes` text DEFAULT NULL,            -- Notas del admin
  `approved_by` bigint(20) DEFAULT NULL,     -- Admin que aprobó/rechazó
  `approved_at` datetime DEFAULT NULL,        -- Fecha de aprobación
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
)
```

**Tipos de Opciones:**
- **Opciones Iniciales**: Creadas por admin, automáticamente aprobadas
- **Opciones Sugeridas**: Creadas por usuarios, pendientes de aprobación

### 3. **Tabla `survey_votes`** - Votos de Usuarios
```sql
CREATE TABLE `survey_votes` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `survey_id` bigint(20) NOT NULL,           -- Encuesta en la que se vota
  `option_id` bigint(20) NOT NULL,           -- Opción por la que se vota
  `user_id` bigint(20) NOT NULL,             -- Usuario que vota
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
)
```

**Restricciones de Voto:**
- Un usuario puede votar por **múltiples opciones** en la misma encuesta
- Un usuario **NO puede votar múltiples veces** por la misma opción
- Restricción UNIQUE: `(user_id, option_id)`

## 🔄 Flujo de Funcionamiento

### **Para Administradores:**

1. **Crear Encuesta** (`POST /api/enhanced-surveys`)
   - Se crea en estado `draft`
   - Solo visible para admins

2. **Agregar Opciones Iniciales** (`POST /api/enhanced-surveys/options`)
   - Opciones creadas por admin se marcan como aprobadas
   - Aparecen inmediatamente en la encuesta

3. **Aprobar Encuesta** (`PUT /api/enhanced-surveys/:id/approve`)
   - Cambia estado de `draft` a `active`
   - Se hace visible para usuarios
   - Los usuarios pueden votar y sugerir opciones

4. **Gestionar Opciones Pendientes** (`GET /api/enhanced-surveys/pending-options`)
   - Ver opciones sugeridas por usuarios
   - Aprobar o rechazar con notas

5. **Cerrar Encuesta** (`PUT /api/enhanced-surveys/:id/close`)
   - Cambia estado a `closed`
   - No se pueden agregar más votos

### **Para Usuarios:**

1. **Ver Encuestas Activas** (`GET /api/enhanced-surveys/active`)
   - Solo encuestas en estado `active`
   - Muestran opciones aprobadas y conteo de votos

2. **Votar por Opciones** (`POST /api/enhanced-surveys/vote`)
   - Pueden votar por **múltiples opciones**
   - Un voto por opción (no duplicados)

3. **Cambiar Voto** (`PUT /api/enhanced-surveys/change-vote`)
   - Cambiar voto de una opción a otra
   - Útil para ajustar preferencias

4. **Sugerir Nueva Opción** (`POST /api/enhanced-surveys/options`)
   - Crear opción personalizada
   - Se marca como pendiente de aprobación
   - Solo visible después de ser aprobada

## 📊 Ejemplos de Uso

### **Escenario 1: Encuesta de Productos**
```
Encuesta: "¿Qué productos te gustaría que incluyamos?"

Opciones Iniciales (Admin):
✅ Productos de cuidado facial
✅ Productos de maquillaje  
✅ Productos de cuidado corporal

Usuario 1 vota por: Cuidado facial + Maquillaje
Usuario 2 vota por: Cuidado corporal
Usuario 3 sugiere: "Productos de cuidado de uñas" (pendiente)
```

### **Escenario 2: Votos Múltiples**
```
Usuario puede votar por:
- Opción A ✅
- Opción B ✅  
- Opción C ✅

Total: 3 votos del mismo usuario en la misma encuesta
```

## 🔧 Correcciones Necesarias

### **Problema 1: Inconsistencia de Estados**
- **Base de datos**: `'draft','open','closed'`
- **Código**: `'draft','active','closed'`
- **Solución**: Ejecutar script `fix-surveys-structure.sql`

### **Problema 2: Votos Duplicados**
- **Situación**: Usuario puede votar múltiples veces por la misma opción
- **Solución**: Restricción UNIQUE `(user_id, option_id)`

### **Problema 3: Índices Faltantes**
- **Impacto**: Consultas lentas en encuestas con muchos votos
- **Solución**: Agregar índices compuestos para optimizar consultas

## 📝 Scripts de Corrección

1. **`fix-surveys-structure.sql`** - Corrige estructura y agrega restricciones
2. **`test-survey-voting.sql`** - Prueba la funcionalidad de votos múltiples

## ✅ Verificación de Funcionalidad

Después de ejecutar los scripts, verificar:

1. **Estados de Encuesta**: `draft` → `active` → `closed`
2. **Votos Múltiples**: Usuario puede votar por varias opciones
3. **Aprobación de Opciones**: Sistema de moderación funciona
4. **Restricciones**: No hay votos duplicados
5. **Rendimiento**: Consultas optimizadas con índices

## 🚀 Próximos Pasos

1. Ejecutar script de corrección en base de datos
2. Probar funcionalidad de votos múltiples
3. Verificar sistema de aprobación de opciones
4. Optimizar consultas si es necesario
5. Documentar casos de uso específicos

---

**Nota**: Este sistema permite máxima flexibilidad para los usuarios (votos múltiples) mientras mantiene control administrativo (aprobación de opciones sugeridas). 