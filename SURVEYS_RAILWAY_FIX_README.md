# 🔧 Fix para Tablas de Encuestas en Railway

## 🚨 **Problema Identificado**
Tu backend en Railway está fallando porque las tablas de encuestas no existen:
- `surveys` ❌
- `survey_options` ❌  
- `survey_votes` ❌

**Error específico:** `Table 'railway.surveys' doesn't exist`

## 🎯 **Causa del Problema**
Las tablas tienen **dependencias de clave foránea** que requieren ser creadas en **orden específico**:

1. **Tablas Base** (sin dependencias):
   - `users` ← Necesaria para todas las demás
   - `categories`
   - `product_types`
   - `products`

2. **Tablas de Encuestas** (con dependencias):
   - `surveys` ← Depende de `users`
   - `survey_options` ← Depende de `surveys` y `users`
   - `survey_votes` ← Depende de `surveys`, `survey_options` y `users`

## 🚀 **Soluciones Disponibles**

### **Opción 1: Script Secuencial Automático (RECOMENDADO)**
```bash
# Desde el directorio backend
.\fix-railway-final.ps1
```

**Ventajas:**
- ✅ Crea tablas en el orden correcto
- ✅ Maneja dependencias automáticamente
- ✅ Incluye datos mínimos de prueba
- ✅ Verificación completa al final

### **Opción 2: Script Node.js Secuencial**
```bash
# Desde el directorio backend
node scripts/fix-railway-sequential.js
```

**Ventajas:**
- ✅ Control total del proceso
- ✅ Logs detallados de cada paso
- ✅ Manejo de errores robusto

### **Opción 3: SQL Directo (Para Expertos)**
```bash
# Conectar a Railway y ejecutar:
mysql -h mysql.railway.internal -u root -p railway < scripts/create-tables-sequential.sql
```

## 📋 **Pasos para Aplicar el Fix**

### **Paso 1: Preparar el Entorno**
```bash
# Navegar al directorio backend
cd backend

# Verificar que tienes los scripts
ls scripts/fix-railway-sequential.js
ls fix-railway-final.ps1
```

### **Paso 2: Configurar Credenciales**
Crear archivo `.env` en el directorio `backend`:
```env
DB_HOST=mysql.railway.internal
DB_USER=root
DB_PASSWORD=TU_PASSWORD_DE_RAILWAY
DB_NAME=railway
DB_PORT=3306
```

**⚠️ IMPORTANTE:** Reemplaza `TU_PASSWORD_DE_RAILWAY` con tu contraseña real de Railway.

### **Paso 3: Ejecutar el Fix**
```bash
# Opción más simple (PowerShell)
.\fix-railway-final.ps1

# O directamente con Node.js
node scripts/fix-railway-sequential.js
```

### **Paso 4: Verificar el Resultado**
El script mostrará:
```
✅ Tabla users creada/verificada
✅ Tabla categories creada/verificada
✅ Tabla product_types creada/verificada
✅ Tabla products creada/verificada
✅ Tabla surveys creada/verificada
✅ Tabla survey_options creada/verificada
✅ Tabla survey_votes creada/verificada
```

## 🔍 **Verificación Manual**

### **Conectar a Railway MySQL:**
```bash
railway ssh
mysql -u root -p railway
```

### **Verificar Tablas:**
```sql
SHOW TABLES;
DESCRIBE surveys;
SELECT COUNT(*) FROM surveys;
```

### **Verificar Datos:**
```sql
SELECT * FROM users WHERE role = 'admin';
SELECT * FROM surveys WHERE status = 'active';
SELECT * FROM survey_options WHERE is_approved = 1;
```

## 🚨 **Solución de Problemas**

### **Error: "Access denied"**
- Verifica que las credenciales en `.env` sean correctas
- Asegúrate de que el usuario tenga permisos en Railway

### **Error: "Connection refused"**
- Verifica que `DB_HOST` sea `mysql.railway.internal`
- Confirma que Railway esté ejecutándose

### **Error: "Table already exists"**
- No es un problema, `CREATE TABLE IF NOT EXISTS` lo maneja
- El script continuará normalmente

### **Error: "Foreign key constraint fails"**
- El script secuencial debería evitar esto
- Si persiste, ejecuta el script completo desde el principio

## 📊 **Estructura Final Esperada**

```
railway/
├── users (1 registro admin)
├── categories (1 registro)
├── product_types (1 registro)
├── products (1 registro de prueba)
├── surveys (1 encuesta activa)
├── survey_options (1 opción aprobada)
└── survey_votes (vacía, lista para votos)
```

## 🔄 **Después del Fix**

1. **Reinicia tu aplicación** en Railway
2. **Verifica que no haya más errores** de `ER_NO_SUCH_TABLE`
3. **Prueba las funcionalidades** de encuestas
4. **Monitorea los logs** para confirmar funcionamiento

## 📞 **Soporte**

Si el fix no funciona:
1. Revisa los logs del script
2. Verifica la configuración de `.env`
3. Confirma que Railway esté activo
4. Ejecuta el script en modo verbose para más detalles

---

**🎯 Objetivo:** Crear todas las tablas necesarias en Railway para que tu backend funcione correctamente con el sistema de encuestas.
