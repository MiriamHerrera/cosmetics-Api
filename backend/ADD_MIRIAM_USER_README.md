# AGREGAR USUARIO: Miriam Herrera

## Datos del Usuario

- **Nombre:** Miriam Herrera
- **Teléfono:** 8124307494
- **Password Hash:** `$2a$12$Jl4zC7Oj53pq8FALHTf1yuaLWNZjshqY206Amq8gjCCf.3crc0sWi`
- **Rol:** client
- **Estado:** Activo

## Scripts Disponibles

### **Opción 1: Script JavaScript (Recomendado)**
```bash
cd backend
node scripts/add-miriam-user.js
```

### **Opción 2: Script SQL**
```bash
# Conectar a MySQL y ejecutar:
source scripts/add-miriam-user.sql
```

### **Opción 3: Script PowerShell (Windows)**
```powershell
cd backend
.\add-miriam-user.ps1
```

## ¿Qué Hace el Script?

1. **Verifica** si el usuario ya existe (por teléfono)
2. **Crea** el usuario si no existe
3. **Confirma** que el usuario fue creado correctamente
4. **Muestra** los detalles del usuario creado

## Estructura del Usuario Creado

```sql
INSERT INTO users (name, phone, password, role, is_active, created_at, updated_at) 
VALUES (
  'Miriam Herrera',
  '8124307494',
  '$2a$12$Jl4zC7Oj53pq8FALHTf1yuaLWNZjshqY206Amq8gjCCf.3crc0sWi',
  'client',
  1,
  NOW(),
  NOW()
);
```

## Verificación Post-Creación

Después de ejecutar el script, puedes verificar:

```sql
-- Ver el usuario creado
SELECT id, name, phone, role, is_active, created_at
FROM users 
WHERE phone = '8124307494';

-- Ver todos los usuarios
SELECT id, name, phone, role, is_active, created_at
FROM users 
ORDER BY created_at DESC;
```

## Características del Usuario

- **Rol:** `client` (usuario regular, no administrador)
- **Estado:** `1` (activo)
- **Password:** Hash bcrypt ya generado
- **Timestamps:** Fechas de creación y actualización automáticas
- **Teléfono:** Único (no puede haber duplicados)

## Archivos de la Solución

- **`scripts/add-miriam-user.js`** - Script JavaScript principal
- **`scripts/add-miriam-user.sql`** - Script SQL alternativo
- **`add-miriam-user.ps1`** - Script PowerShell para Windows
- **`ADD_MIRIAM_USER_README.md`** - Esta documentación

## Notas Importantes

- El script usa `INSERT IGNORE` para evitar duplicados
- Si el usuario ya existe, mostrará sus datos actuales
- El password hash está listo para usar (no necesita generación)
- El usuario se crea como cliente regular, no como administrador
- Se pueden crear usuarios adicionales modificando el script

## Estado de la Implementación

🟢 **COMPLETADO** - Scripts de creación de usuario creados
🟢 **DOCUMENTADO** - README con instrucciones completas
🟢 **MÚLTIPLES OPCIONES** - JavaScript, SQL y PowerShell disponibles
🟢 **SEGURO** - Verifica duplicados antes de crear
