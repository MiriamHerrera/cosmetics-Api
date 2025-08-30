# 🔧 Fix para Tablas de Encuestas en Railway

## 📋 Problema Identificado

Tu backend en Railway está fallando con el siguiente error:

```
Error obteniendo encuestas: Error: Table 'railway.surveys' doesn't exist
```

Esto indica que las tablas del sistema de encuestas no se crearon correctamente durante la inicialización de la base de datos.

## 🎯 Solución

He creado varios archivos para solucionar este problema:

### 1. `fix-surveys-tables.sql` - Script SQL directo
- Script SQL que puedes ejecutar directamente en tu base de datos de Railway
- Crea las tablas `surveys`, `survey_options` y `survey_votes`
- Inserta datos mínimos de prueba

### 2. `fix-surveys-railway.js` - Script de Node.js específico
- Script que puedes ejecutar desde tu entorno local o en Railway
- Se conecta automáticamente a tu base de datos
- Aplica el fix de manera programática

### 3. `initialize-database-railway.js` - Script completo de inicialización
- Script completo que crea todas las tablas del sistema
- Manejo mejorado de errores
- Verificación de cada tabla creada

### 4. `deploy-railway.sh` - Script de deploy automatizado
- Script que se ejecuta durante el deploy
- Inicializa la base de datos automáticamente
- Fallback al fix específico si falla la inicialización completa

## 🚀 Opciones para Aplicar el Fix

### Opción 1: Ejecutar Script SQL Directamente (Recomendado para Fix Rápido)

1. **Accede a tu base de datos de Railway:**
   - Ve al dashboard de Railway
   - Selecciona tu proyecto
   - Ve a la pestaña "Variables"
   - Copia las credenciales de base de datos

2. **Conéctate a MySQL:**
   ```bash
   # Usando MySQL CLI
   mysql -h [DB_HOST] -u [DB_USER] -p [DB_NAME]
   
   # O usando un cliente MySQL como HeidiSQL, MySQL Workbench, etc.
   ```

3. **Ejecuta el script:**
   ```sql
   -- Copia y pega el contenido de fix-surveys-tables.sql
   -- O ejecuta directamente:
   source /path/to/fix-surveys-tables.sql
   ```

### Opción 2: Ejecutar Script de Node.js

1. **Desde tu entorno local:**
   ```bash
   cd backend
   npm install mysql2 dotenv
   node scripts/fix-surveys-railway.js
   ```

2. **Desde Railway (SSH):**
   ```bash
   # Conéctate a tu contenedor de Railway
   railway ssh
   
   # Navega al directorio y ejecuta
   cd backend
   node scripts/fix-surveys-railway.js
   ```

### Opción 3: Inicialización Completa de Base de Datos

1. **Desde tu entorno local:**
   ```bash
   cd backend
   npm install mysql2 dotenv
   node scripts/initialize-database-railway.js
   ```

2. **Desde Railway (SSH):**
   ```bash
   railway ssh
   cd backend
   node scripts/initialize-database-railway.js
   ```

### Opción 4: Deploy Automatizado (Recomendado para Producción)

1. **Modifica tu `package.json` para incluir el script de deploy:**
   ```json
   {
     "scripts": {
       "deploy": "chmod +x deploy-railway.sh && ./deploy-railway.sh",
       "start": "node server.js"
     }
   }
   ```

2. **O agrega el fix a tu `server.js`:**
   ```javascript
   const { fixSurveysTables } = require('./src/config/database');
   
   // En la función startServer, después de testConnection:
   if (dbConnected) {
     try {
       await fixSurveysTables();
       console.log('✅ Tablas de encuestas verificadas/creadas');
     } catch (error) {
       console.error('⚠️ Error creando tablas de encuestas:', error);
     }
   }
   ```

3. **Configura Railway para usar el script de deploy:**
   - En tu `railway.toml` o configuración de Railway
   - Cambia el comando de inicio a: `npm run deploy`

## 🔍 Verificación

Después de aplicar el fix, verifica que las tablas se crearon correctamente:

```sql
-- Verificar tablas existentes
SHOW TABLES LIKE '%survey%';

-- Verificar estructura de la tabla surveys
DESCRIBE surveys;

-- Verificar datos mínimos
SELECT * FROM surveys;
SELECT * FROM survey_options;
```

## 📊 Estructura de Tablas Creadas

### `surveys`
- `id`: Identificador único
- `question`: Pregunta de la encuesta
- `description`: Descripción opcional
- `status`: Estado (draft, active, closed)
- `created_by`: ID del usuario creador
- `created_at`, `updated_at`: Timestamps
- `closed_by`, `closed_at`: Información de cierre

### `survey_options`
- `id`: Identificador único
- `survey_id`: Referencia a la encuesta
- `option_text`: Texto de la opción
- `description`: Descripción opcional
- `product_id`: Producto asociado (opcional)
- `is_approved`: Estado de aprobación
- `created_by`: ID del usuario creador

### `survey_votes`
- `id`: Identificador único
- `survey_id`: Referencia a la encuesta
- `option_id`: Referencia a la opción
- `user_id`: ID del usuario que votó
- `created_at`, `updated_at`: Timestamps

## 🚨 Notas Importantes

1. **Backup:** Siempre haz un backup de tu base de datos antes de aplicar cambios
2. **Permisos:** Asegúrate de que tu usuario de base de datos tenga permisos para crear tablas
3. **Dependencias:** Las tablas se crean con `IF NOT EXISTS`, por lo que son seguras de ejecutar múltiples veces
4. **Datos:** El script inserta datos mínimos de prueba que puedes eliminar después
5. **Orden de ejecución:** Si usas la inicialización completa, no necesitas ejecutar el fix específico

## 🔄 Reinicio del Servidor

Después de aplicar el fix:

1. **Reinicia tu aplicación en Railway:**
   ```bash
   # Desde el dashboard de Railway
   # O usando CLI
   railway up
   ```

2. **Verifica los logs:**
   - Los errores de "Table doesn't exist" deberían desaparecer
   - Deberías ver mensajes de éxito en la inicialización

## 🚀 Deploy Automatizado

Para evitar este problema en futuros deploys:

1. **Usa el script de deploy automatizado:**
   ```bash
   npm run deploy
   ```

2. **O configura Railway para ejecutar automáticamente:**
   - El script se ejecutará en cada deploy
   - La base de datos se inicializará automáticamente
   - No más errores de tablas faltantes

## 📞 Soporte

Si encuentras problemas al aplicar el fix:

1. Verifica las credenciales de base de datos
2. Revisa los logs de error en Railway
3. Asegúrate de que MySQL esté funcionando correctamente
4. Verifica que las variables de entorno estén configuradas
5. Ejecuta el script de inicialización completa si el fix específico falla

## ✅ Estado Esperado

Después de aplicar el fix exitosamente:

- ✅ Tabla `surveys` creada
- ✅ Tabla `survey_options` creada  
- ✅ Tabla `survey_votes` creada
- ✅ Datos mínimos insertados
- ✅ Endpoint `/api/surveys` funcionando
- ✅ Sistema de encuestas operativo
- ✅ Sin errores de "Table doesn't exist"
- ✅ Deploy automatizado configurado (opcional)
