# 🗑️ Script para Eliminar Pedidos de Prueba

Este conjunto de scripts elimina todos los pedidos creados a partir del 19 de septiembre de 2025 y resetea el AUTO_INCREMENT para que continúe desde donde estaba.

## 📋 Archivos Incluidos

1. **`delete-orders-from-sept-19.js`** - Script Node.js (Recomendado)
2. **`delete-orders-from-sept-19.ps1`** - Script PowerShell para Windows
3. **`delete-orders-from-sept-19.sql`** - Script SQL directo

## ⚠️ IMPORTANTE - ANTES DE EJECUTAR

### 1. Hacer Backup de la Base de Datos
```bash
# Backup completo
mysqldump -u root -p cosmetics_db > backup_before_delete_$(date +%Y%m%d_%H%M%S).sql

# O solo las tablas críticas
mysqldump -u root -p cosmetics_db orders order_items > backup_orders_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Verificar Variables de Entorno
Asegúrate de que tu archivo `.env` tenga las configuraciones correctas:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=cosmetics_db
DB_PORT=3306
```

## 🚀 Opciones de Ejecución

### Opción 1: Script Node.js (Recomendado)
```bash
cd backend
node scripts/delete-orders-from-sept-19.js
```

### Opción 2: Script PowerShell (Windows)
```powershell
cd backend
.\scripts\delete-orders-from-sept-19.ps1
```

### Opción 3: Script SQL Directo
```bash
# 1. Primero ejecutar solo las consultas SELECT para verificar
mysql -u root -p cosmetics_db < scripts/delete-orders-from-sept-19.sql

# 2. Si todo se ve bien, editar el script y ejecutar las operaciones DELETE
```

## 📊 Lo que hace el script

### 1. Análisis
- ✅ Cuenta cuántos pedidos se van a eliminar
- ✅ Muestra información de cada pedido (ID, número, cliente, fecha)
- ✅ Calcula el siguiente ID disponible

### 2. Eliminación Segura
- ✅ Deshabilita verificación de claves foráneas
- ✅ Elimina items de pedidos relacionados
- ✅ Elimina los pedidos
- ✅ Resetea AUTO_INCREMENT al siguiente ID disponible
- ✅ Rehabilita verificación de claves foráneas

### 3. Verificación
- ✅ Confirma que no quedan pedidos desde el 19 de septiembre
- ✅ Verifica que el AUTO_INCREMENT esté correcto
- ✅ Muestra el último pedido válido

## 🎯 Resultado Esperado

**Antes:**
- Pedidos: #ORD-20250919-0001, #ORD-20250919-0002, #ORD-20250920-0001, etc.
- AUTO_INCREMENT: 15 (por ejemplo)

**Después:**
- Pedidos eliminados: Todos desde #ORD-20250919-0001
- AUTO_INCREMENT: 12 (último ID válido + 1)
- Próximo pedido: #ORD-20250920-0001 (con ID 12)

## 🔧 Solución de Problemas

### Error de Conexión
```bash
# Verificar que MySQL esté corriendo
sudo systemctl status mysql

# Verificar credenciales
mysql -u root -p -e "SELECT 1"
```

### Error de Permisos
```sql
-- Dar permisos necesarios
GRANT ALL PRIVILEGES ON cosmetics_db.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

### Restaurar desde Backup
```bash
# Restaurar backup completo
mysql -u root -p cosmetics_db < backup_before_delete_YYYYMMDD_HHMMSS.sql

# O restaurar solo las tablas de pedidos
mysql -u root -p cosmetics_db < backup_orders_YYYYMMDD_HHMMSS.sql
```

## 📝 Logs del Script

El script Node.js muestra logs detallados:
```
🔄 Conectando a la base de datos...
✅ Conectado a la base de datos
📊 Analizando pedidos a partir del 19 de septiembre...
📋 Encontrados 5 pedidos a eliminar:
   - ID: 12 | ORD-20250919-0001 | Miriam Test | 2025-09-19 10:30:00 | pending
   - ID: 13 | ORD-20250919-0002 | Juan Pérez | 2025-09-19 11:15:00 | confirmed
   ...
🔢 El siguiente ID disponible será: 11
🚀 Iniciando eliminación...
✅ Eliminados 8 items de pedidos
✅ Eliminados 5 pedidos
✅ AUTO_INCREMENT reseteado a 11
🎉 ¡Eliminación completada exitosamente!
```

## ⚡ Ejecución Rápida

Si estás seguro y quieres ejecutar directamente:

```bash
# 1. Backup rápido
mysqldump -u root -p cosmetics_db orders order_items > backup_orders_$(date +%Y%m%d_%H%M%S).sql

# 2. Ejecutar script
cd backend && node scripts/delete-orders-from-sept-19.js

# 3. Verificar resultado
mysql -u root -p -e "SELECT COUNT(*) as pedidos_desde_19_sep FROM cosmetics_db.orders WHERE created_at >= '2025-09-19 00:00:00'"
```

## 🆘 Soporte

Si encuentras algún problema:
1. Verifica los logs del script
2. Revisa la conexión a la base de datos
3. Restaura desde el backup si es necesario
4. Contacta al equipo de desarrollo
