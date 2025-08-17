# 📅 Sistema de Apartados - Guía de Pruebas

## **📋 Endpoints Disponibles**

### **Para Usuarios:**

#### **1. Crear Apartado**
```http
POST /api/reservations
Authorization: Bearer <token>
Content-Type: application/json

{
  "product_id": 1,
  "quantity": 2
}
```

#### **2. Obtener Mis Apartados**
```http
GET /api/reservations
Authorization: Bearer <token>
```

#### **3. Obtener Apartado Específico**
```http
GET /api/reservations/:id
Authorization: Bearer <token>
```

#### **4. Obtener Estadísticas de Apartados**
```http
GET /api/reservations/stats
Authorization: Bearer <token>
```

#### **5. Cancelar Apartado**
```http
PUT /api/reservations/:id/cancel
Authorization: Bearer <token>
```

#### **6. Completar Apartado**
```http
PUT /api/reservations/:id/complete
Authorization: Bearer <token>
```

### **Para Administradores:**

#### **7. Ver Apartados Expirados**
```http
GET /api/reservations/admin/expired
Authorization: Bearer <admin_token>
```

#### **8. Limpiar Apartados Expirados**
```http
POST /api/reservations/admin/cleanup
Authorization: Bearer <admin_token>
```

## **🧪 Pasos para Probar**

### **Paso 1: Crear Usuario y Hacer Login**
```bash
# 1. Registrar usuario
POST /api/auth/register
{
  "name": "Cliente Test",
  "phone": "+1234567891",
  "email": "cliente@test.com",
  "password": "test123"
}

# 2. Hacer login
POST /api/auth/login
{
  "phone": "+1234567891",
  "password": "test123"
}
```

### **Paso 2: Probar Sistema de Apartados**
1. **Crear apartado**: `POST /api/reservations`
2. **Ver apartados**: `GET /api/reservations`
3. **Ver estadísticas**: `GET /api/reservations/stats`
4. **Cancelar apartado**: `PUT /api/reservations/:id/cancel`
5. **Completar apartado**: `PUT /api/reservations/:id/complete`

## **📱 Funcionalidades del Sistema**

### **✅ Características Implementadas:**

1. **Reservas por 7 días** - Productos se apartan automáticamente
2. **Validación de stock** - No se puede apartar más del disponible
3. **Gestión de estados** - active, completed, cancelled, expired
4. **Limpieza automática** - Apartados expirados se marcan automáticamente
5. **Devolución de stock** - Al cancelar o expirar, el stock vuelve al producto
6. **Estadísticas completas** - Historial y métricas del usuario
7. **Notificaciones** - Preparado para recordatorios de WhatsApp

### **🔄 Flujo de Apartado:**

```
Usuario → Aparta Producto → Stock se Reduce → Reserva por 7 días
    ↓
Expiración → Stock se Devuelve → Producto Disponible
```

## **🔍 Casos de Prueba**

### **Caso 1: Apartado Exitoso**
- Producto con stock suficiente
- Debe crear reservación por 7 días
- Stock debe reducirse
- Debe retornar confirmación

### **Caso 2: Stock Insuficiente**
- Intentar apartar más del disponible
- Debe retornar error 400
- Stock no debe cambiar

### **Caso 3: Apartado Duplicado**
- Usuario ya tiene apartado activo del mismo producto
- Debe retornar error 400
- No debe crear duplicado

### **Caso 4: Cancelación de Apartado**
- Usuario cancela apartado activo
- Stock debe devolverse al producto
- Estado debe cambiar a 'cancelled'

### **Caso 5: Expiración Automática**
- Apartado expira después de 7 días
- Estado debe cambiar a 'expired'
- Stock debe devolverse automáticamente

## **⚠️ Validaciones a Probar**

### **Stock Disponible:**
- No apartar más productos que stock disponible
- Verificar que el stock se reduzca correctamente

### **Límites de Usuario:**
- Un usuario no puede tener múltiples apartados del mismo producto
- Verificar que se respete esta regla

### **Fechas de Expiración:**
- Apartados deben expirar exactamente en 7 días
- Verificar cálculo de días restantes

### **Estados del Apartado:**
- active: Apartado vigente
- completed: Apartado convertido en compra
- cancelled: Usuario canceló
- expired: Expiró automáticamente

## **📊 Respuestas Esperadas**

### **Apartado Creado Exitosamente:**
```json
{
  "success": true,
  "message": "Producto apartado exitosamente por 7 días",
  "data": {
    "reservation_id": 1,
    "product_name": "Labial Mate Premium",
    "quantity": 2,
    "expires_at": "2024-01-15T10:00:00.000Z",
    "total_price": "51.98"
  }
}
```

### **Lista de Apartados:**
```json
{
  "success": true,
  "data": {
    "reservations": [
      {
        "id": 1,
        "quantity": 2,
        "status": "active",
        "expires_at": "2024-01-15T10:00:00.000Z",
        "days_remaining": 5,
        "product_name": "Labial Mate Premium",
        "price": 25.99
      }
    ],
    "total": 51.98,
    "count": 1
  }
}
```

### **Estadísticas del Usuario:**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "total_reservations": 5,
      "active_reservations": 3,
      "completed_reservations": 1,
      "cancelled_reservations": 1,
      "expired_reservations": 0,
      "total_items_reserved": 8
    },
    "expiring_soon": [
      {
        "id": 1,
        "days_remaining": 1,
        "product_name": "Sombra Individual"
      }
    ]
  }
}
```

## **🚀 Herramientas de Prueba**

- **Postman** - Para probar endpoints
- **Thunder Client** - Extensión de VS Code
- **Insomnia** - Alternativa a Postman
- **cURL** - Línea de comandos

## **🔧 Comandos cURL de Ejemplo**

### **Crear Apartado:**
```bash
curl -X POST http://localhost:8000/api/reservations \
  -H "Authorization: Bearer <token_aqui>" \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1, "quantity": 2}'
```

### **Ver Apartados:**
```bash
curl -X GET http://localhost:8000/api/reservations \
  -H "Authorization: Bearer <token_aqui>"
```

### **Cancelar Apartado:**
```bash
curl -X PUT http://localhost:8000/api/reservations/1/cancel \
  -H "Authorization: Bearer <token_aqui>"
```

## **📝 Notas Importantes**

- **Transacciones SQL**: Todas las operaciones usan transacciones para consistencia
- **Reservas por 7 días**: Configuración automática de expiración
- **Stock en tiempo real**: Se valida y actualiza inmediatamente
- **Estados múltiples**: Sistema completo de gestión de apartados
- **Limpieza automática**: Preparado para cron jobs o tareas programadas
- **WhatsApp**: Preparado para integración futura de notificaciones

## **🎯 Próximos Pasos**

1. **Probar todos los endpoints** del sistema de apartados
2. **Verificar validaciones** de stock y fechas
3. **Implementar sistema de encuestas**
4. **Crear sistema de estadísticas avanzadas**
5. **Desarrollar panel administrativo**

## **🔗 Integración con Otros Sistemas**

### **Sistema de Carrito:**
- Apartados y carrito son independientes
- Usuario puede tener ambos simultáneamente
- Stock se gestiona por separado

### **Sistema de Productos:**
- Stock se actualiza en tiempo real
- Productos inactivos no se pueden apartar
- Categorías y tipos se mantienen

### **Sistema de Usuarios:**
- Solo usuarios autenticados pueden apartar
- Historial completo de apartados por usuario
- Estadísticas personalizadas 