# SOLUCIÓN: Columna image_url Faltante en Tabla Products

## Problema Identificado

El error específico es:
```
Error: Unknown column 'p.image_url' in 'field list'
```

**Causa:** La tabla `products` en la base de datos no tiene la columna `image_url`, pero el controlador de productos la está solicitando en las consultas SQL.

## Análisis del Error

### 1. **Controlador solicitando la columna**
En `productController.js`, las funciones `getAllProducts` y `getProductById` solicitan:
```sql
SELECT 
  p.id,
  p.name,
  p.description,
  p.price,
  p.image_url,  -- ← Esta columna no existe en la BD
  p.stock_total,
  -- ... más campos
```

### 2. **Tabla products sin la columna**
La tabla `products` existente en la base de datos no tiene la columna `image_url`, aunque está definida en el archivo de configuración.

## Soluciones Disponibles

### **Opción 1: Script JavaScript (Recomendado)**
```bash
cd backend
node scripts/add-image-url-column.js
```

### **Opción 2: Script SQL**
```bash
# Conectar a MySQL y ejecutar:
source scripts/add-image-url-column.sql
```

### **Opción 3: Script PowerShell (Windows)**
```powershell
cd backend
.\fix-image-url-column.ps1
```

## ¿Qué Hace la Solución?

1. **Verifica** si la columna `image_url` ya existe
2. **Agrega** la columna si no existe:
   ```sql
   ALTER TABLE products 
   ADD COLUMN image_url text DEFAULT NULL 
   COMMENT 'URL de la imagen del producto' 
   AFTER price;
   ```
3. **Confirma** que la columna fue agregada correctamente

## Estructura de la Columna Agregada

```sql
image_url text DEFAULT NULL COMMENT 'URL de la imagen del producto'
```

- **Tipo:** `text` (permite URLs largas)
- **Valor por defecto:** `NULL` (opcional)
- **Posición:** Después de la columna `price`
- **Comentario:** Documenta el propósito de la columna

## Verificación Post-Migración

Después de ejecutar la migración, puedes verificar:

```sql
-- Ver la estructura de la tabla
DESCRIBE products;

-- Verificar que la columna existe
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'products' AND COLUMN_NAME = 'image_url';
```

## Archivos de la Solución

- **`scripts/add-image-url-column.js`** - Script JavaScript principal
- **`scripts/add-image-url-column.sql`** - Script SQL alternativo
- **`fix-image-url-column.ps1`** - Script PowerShell para Windows
- **`IMAGE_URL_COLUMN_FIX_README.md`** - Esta documentación

## Prevención Futura

Para evitar este problema en el futuro:

1. **Sincronizar esquemas:** Asegurar que la BD refleje la configuración del código
2. **Migraciones automáticas:** Implementar un sistema de migraciones automáticas
3. **Validación de esquema:** Verificar la estructura de la BD al iniciar la aplicación

## Estado de la Implementación

🟢 **COMPLETADO** - Scripts de migración creados
🟢 **DOCUMENTADO** - README con instrucciones completas
🟢 **MÚLTIPLES OPCIONES** - JavaScript, SQL y PowerShell disponibles

## Notas Importantes

- La migración es **segura** y no afecta datos existentes
- La columna se agrega como **NULL** por defecto
- **No se requieren** cambios en el código del controlador
- La solución es **compatible** con todas las versiones de MySQL
