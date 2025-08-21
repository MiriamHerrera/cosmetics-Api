# Solución para Error 500 en Sistema de Órdenes

## Problema Identificado

El error 500 al crear órdenes de invitado se debe a dos problemas principales:

1. **Falta la vista `orders_with_details`** que se usa en el controlador
2. **Falta el procedimiento almacenado `GenerateOrderNumber`** para generar números de orden únicos
3. **Error en la estructura de datos** pasados a `generateWhatsAppMessage`

## Solución Paso a Paso

### Paso 1: Ejecutar Script de Reparación

Ejecuta el siguiente script en tu base de datos MariaDB:

```sql
-- Abrir HeidiSQL o tu cliente de base de datos
-- Conectarte a la base de datos cosmetics_db
-- Ejecutar el archivo: backend/scripts/fix-orders-system-simple.sql
```

**IMPORTANTE:** Si el script anterior falla, usa la versión simple que es más compatible con MariaDB.

Este script:
- Crea la vista `orders_with_details` necesaria
- Crea el procedimiento `GenerateOrderNumber`
- Verifica que todo funcione correctamente

### Paso 2: Verificar Carrito de Invitado

Ejecuta el script de diagnóstico:

```sql
-- Ejecutar el archivo: backend/scripts/check-guest-cart.sql
```

Este script verifica:
- Estado de las tablas de carrito de invitado
- Productos disponibles
- Lugares de entrega
- Crea datos de prueba si es necesario

### Paso 3: Reiniciar el Servidor

Después de ejecutar los scripts SQL:

```bash
# En la terminal, desde la carpeta backend
cd backend
npm start
# o
node server.js
```

### Paso 4: Probar el Sistema

1. Abrir la aplicación en el navegador
2. Agregar productos al carrito como invitado
3. Intentar finalizar la compra
4. Verificar que se genere el mensaje de WhatsApp

## Archivos Modificados

### Backend
- `src/controllers/orderController.js` - Corregido el manejo de datos para WhatsApp

### Scripts SQL
- `scripts/fix-orders-system.sql` - Script principal de reparación
- `scripts/check-guest-cart.sql` - Script de diagnóstico
- `scripts/verify-orders-setup.sql` - Verificación completa del sistema

## Verificación de Funcionamiento

### 1. Verificar Vista
```sql
USE cosmetics_db;
SHOW CREATE VIEW orders_with_details;
```

### 2. Verificar Procedimiento
```sql
USE cosmetics_db;
SHOW CREATE PROCEDURE GenerateOrderNumber;
```

### 3. Probar Procedimiento
```sql
USE cosmetics_db;
SET @testOrderNumber = '';
CALL GenerateOrderNumber(@testOrderNumber);
SELECT @testOrderNumber as test_result;
```

## Estructura de Datos Esperada

### Carrito de Invitado
```json
{
  "sessionId": "uuid-session-id",
  "customerName": "Nombre del Cliente",
  "customerPhone": "1234567890",
  "customerEmail": "cliente@email.com",
  "deliveryLocationId": 1,
  "deliveryDate": "2024-01-15",
  "deliveryTime": "14:00:00",
  "totalAmount": 99.99,
  "cartItems": [
    {
      "productId": 1,
      "quantity": 2
    }
  ],
  "notes": "Notas adicionales"
}
```

### Respuesta Esperada
```json
{
  "success": true,
  "message": "Orden creada exitosamente",
  "data": {
    "order": { /* detalles de la orden */ },
    "whatsappMessage": "🛍️ *NUEVO PEDIDO #ORD202401150001*...",
    "orderNumber": "ORD202401150001"
  }
}
```

## Troubleshooting

### Error: "Vista orders_with_details no existe"
- Ejecutar `fix-orders-system-simple.sql`
- Verificar que la base de datos sea `cosmetics_db`

### Error: "You have an error in your SQL syntax" en GenerateOrderNumber
- **SOLUCIÓN:** Usar `fix-orders-system-simple.sql` en lugar de `fix-orders-system.sql`
- Este error es común en versiones antiguas de MariaDB
- La versión simple evita el uso de `WHILE` y `REPEAT` que pueden causar problemas

### Error: "Procedimiento GenerateOrderNumber no existe"
- Ejecutar `fix-orders-system.sql`
- Verificar permisos de usuario de base de datos

### Error: "Carrito de invitado no encontrado"
- Verificar que el `sessionId` sea válido
- Ejecutar `check-guest-cart.sql` para diagnóstico

### Error: "Producto no encontrado"
- Verificar que existan productos en la tabla `products`
- Verificar que el `productId` sea correcto

## Contacto

Si persisten los problemas después de seguir estos pasos, revisar:
1. Logs del servidor en la consola
2. Errores de base de datos en HeidiSQL
3. Estado de las tablas con los scripts de diagnóstico 