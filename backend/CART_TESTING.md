# 🛒 Sistema de Carrito - Guía de Pruebas

## **📋 Endpoints Disponibles**

### **1. Obtener Carrito**
```http
GET /api/cart
Authorization: Bearer <token>
```

### **2. Agregar Producto al Carrito**
```http
POST /api/cart/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "product_id": 1,
  "quantity": 2
}
```

### **3. Actualizar Cantidad**
```http
PUT /api/cart/items/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 3
}
```

### **4. Remover Producto**
```http
DELETE /api/cart/items/:id
Authorization: Bearer <token>
```

### **5. Limpiar Carrito**
```http
DELETE /api/cart
Authorization: Bearer <token>
```

### **6. Enviar por WhatsApp**
```http
POST /api/cart/send
Authorization: Bearer <token>
```

## **🧪 Pasos para Probar**

### **Paso 1: Crear Usuario de Prueba**
```bash
# Usar el endpoint de registro
POST /api/auth/register
{
  "name": "Cliente Test",
  "phone": "+1234567891",
  "email": "cliente@test.com",
  "password": "test123"
}
```

### **Paso 2: Hacer Login**
```bash
# Obtener token JWT
POST /api/auth/login
{
  "phone": "+1234567891",
  "password": "test123"
}
```

### **Paso 3: Probar Carrito**
1. **Obtener carrito vacío**: `GET /api/cart`
2. **Agregar productos**: `POST /api/cart/items`
3. **Ver carrito con items**: `GET /api/cart`
4. **Actualizar cantidades**: `PUT /api/cart/items/:id`
5. **Remover items**: `DELETE /api/cart/items/:id`
6. **Enviar por WhatsApp**: `POST /api/cart/send`

## **📱 Datos de Prueba Disponibles**

### **Productos para Probar:**
- **ID 1**: Labial Mate Premium - $25.99
- **ID 5**: Corrector Líquido - $24.99
- **ID 12**: Sombra Individual - $12.99
- **ID 8**: Delineador Líquido - $23.99

### **Usuario de Prueba:**
- **Phone**: +1234567891
- **Password**: test123

## **🔍 Casos de Prueba**

### **Caso 1: Carrito Vacío**
- Usuario nuevo sin carrito
- Debe crear carrito automáticamente
- Debe retornar carrito vacío

### **Caso 2: Agregar Productos**
- Agregar producto válido
- Verificar stock disponible
- Calcular totales correctamente

### **Caso 3: Actualizar Cantidades**
- Cambiar cantidad de item existente
- Verificar límites de stock
- Recalcular totales

### **Caso 4: Remover Productos**
- Eliminar item específico
- Verificar que se actualice el carrito
- Recalcular totales

### **Caso 5: Enviar por WhatsApp**
- Generar mensaje formateado
- Marcar carrito como enviado
- Retornar resumen del pedido

## **⚠️ Validaciones a Probar**

### **Stock Insuficiente:**
- Intentar agregar más productos que stock disponible
- Debe retornar error 400 con mensaje apropiado

### **Cantidades Inválidas:**
- Cantidad 0 o negativa
- Debe retornar error 400

### **Producto Inexistente:**
- ID de producto inválido
- Debe retornar error 404

### **Autenticación:**
- Endpoints sin token
- Debe retornar error 401

## **📊 Respuestas Esperadas**

### **Carrito Válido:**
```json
{
  "success": true,
  "data": {
    "cart": {
      "id": 1,
      "user_id": 2,
      "status": "open",
      "total": 89.96,
      "item_count": 3
    },
    "items": [
      {
        "id": 1,
        "quantity": 2,
        "product_name": "Labial Mate Premium",
        "price": 25.99,
        "subtotal": 51.98
      }
    ]
  }
}
```

### **Error de Stock:**
```json
{
  "success": false,
  "message": "Stock insuficiente. Solo hay 5 unidades disponibles"
}
```

## **🚀 Herramientas de Prueba Recomendadas**

- **Postman** - Para probar endpoints
- **Thunder Client** - Extensión de VS Code
- **Insomnia** - Alternativa a Postman
- **cURL** - Línea de comandos

## **🔧 Comandos cURL de Ejemplo**

### **Login:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567891", "password": "test123"}'
```

### **Obtener Carrito:**
```bash
curl -X GET http://localhost:8000/api/cart \
  -H "Authorization: Bearer <token_aqui>"
```

### **Agregar Producto:**
```bash
curl -X POST http://localhost:8000/api/cart/items \
  -H "Authorization: Bearer <token_aqui>" \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1, "quantity": 2}'
```

## **📝 Notas Importantes**

- **Transacciones**: Todas las operaciones del carrito usan transacciones SQL
- **Reservas**: Los productos se reservan por 7 días automáticamente
- **Stock**: Se valida en tiempo real antes de agregar al carrito
- **WhatsApp**: Simula el envío (preparado para integración futura)
- **Logs**: Todas las operaciones se registran en consola

## **🎯 Próximos Pasos**

1. **Probar todos los endpoints** del carrito
2. **Verificar validaciones** de stock y cantidades
3. **Implementar sistema de apartados** (reservaciones)
4. **Crear sistema de encuestas**
5. **Desarrollar estadísticas de clientes** 