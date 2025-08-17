# 👑 Panel Administrativo - Guía de Pruebas

## **📋 Endpoints Disponibles**

### **Dashboard Principal:**
```http
GET /api/admin/dashboard
Authorization: Bearer <admin_token>
```

### **Gestión de Usuarios:**
```http
GET /api/admin/users?page=1&limit=20&search=&role=&status=
PUT /api/admin/users/:id/status
Authorization: Bearer <admin_token>
```

### **Gestión de Productos:**
```http
GET /api/admin/products?page=1&limit=20&search=&category=&status=
Authorization: Bearer <admin_token>
```

### **Gestión de Carritos:**
```http
GET /api/admin/carts?page=1&limit=20&status=&period=7
Authorization: Bearer <admin_token>
```

### **Gestión de Apartados:**
```http
GET /api/admin/reservations?page=1&limit=20&status=&period=7
Authorization: Bearer <admin_token>
```

### **Gestión de Encuestas:**
```http
GET /api/admin/surveys?page=1&limit=20&status=
Authorization: Bearer <admin_token>
```

## **🧪 Pasos para Probar**

### **Paso 1: Login como Administrador**
```bash
# Usar el endpoint de login
POST /api/auth/login
{
  "phone": "+1234567890",
  "password": "admin123"
}
```

### **Paso 2: Probar Dashboard**
1. **Dashboard principal**: `GET /api/admin/dashboard`
2. **Verificar métricas** del día y semana
3. **Revisar alertas** de stock bajo y apartados expirando

### **Paso 3: Probar Gestión de Usuarios**
1. **Listar usuarios**: `GET /api/admin/users`
2. **Buscar usuarios**: `GET /api/admin/users?search=maria`
3. **Filtrar por rol**: `GET /api/admin/users?role=client`
4. **Cambiar estado**: `PUT /api/admin/users/2/status`

### **Paso 4: Probar Gestión de Productos**
1. **Listar productos**: `GET /api/admin/products`
2. **Ver estadísticas** de popularidad
3. **Identificar productos** con bajo stock

### **Paso 5: Probar Gestión de Carritos**
1. **Listar carritos**: `GET /api/admin/carts`
2. **Ver carritos por período**: `GET /api/admin/carts?period=30`
3. **Analizar conversión** de carritos

### **Paso 6: Probar Gestión de Apartados**
1. **Listar apartados**: `GET /api/admin/reservations`
2. **Ver apartados expirando**: `GET /api/admin/reservations?status=active&period=3`
3. **Analizar tendencias** de apartados

### **Paso 7: Probar Gestión de Encuestas**
1. **Listar encuestas**: `GET /api/admin/surveys`
2. **Ver estadísticas** de participación
3. **Analizar engagement** de usuarios

## **📱 Funcionalidades del Panel**

### **✅ Dashboard Principal:**
- **Métricas del día**: Nuevos usuarios, carritos, apartados, votos
- **Métricas de la semana**: Actividad semanal y órdenes completadas
- **Alertas**: Productos con bajo stock, apartados expirando
- **Actividad reciente**: Últimas 24 horas de actividad
- **Top productos**: Productos más populares del día

### **👥 Gestión de Usuarios:**
- **Lista completa** de usuarios con estadísticas
- **Búsqueda y filtros** por nombre, teléfono, email
- **Filtros por rol** (cliente, administrador)
- **Filtros por estado** (activo, inactivo)
- **Estadísticas por usuario**: Carritos, apartados, encuestas
- **Activación/desactivación** de usuarios

### **🛍️ Gestión de Productos:**
- **Lista completa** con estadísticas de popularidad
- **Búsqueda y filtros** por nombre, descripción
- **Filtros por categoría** y estado
- **Métricas de popularidad**: Apartados y carritos
- **Stock en tiempo real** con alertas
- **Análisis por categoría** y tipo

### **🛒 Gestión de Carritos:**
- **Lista completa** de carritos con detalles
- **Filtros por estado** (abierto, enviado, cancelado)
- **Filtros por período** (7, 30, 90 días)
- **Valor total** de cada carrito
- **Detalles del usuario** y productos
- **Análisis de conversión** y tendencias

### **📅 Gestión de Apartados:**
- **Lista completa** de apartados con detalles
- **Filtros por estado** (activo, completado, cancelado, expirado)
- **Filtros por período** para análisis temporal
- **Días restantes** hasta expiración
- **Valor total** de cada apartado
- **Información del usuario** y producto

### **📊 Gestión de Encuestas:**
- **Lista completa** de encuestas con estadísticas
- **Filtros por estado** (abierta, cerrada)
- **Métricas de participación**: Total de votos, votantes únicos
- **Tasa de participación** como porcentaje
- **Análisis de engagement** por encuesta

## **🔍 Casos de Prueba**

### **Caso 1: Dashboard Completo**
- Verificar que todas las métricas se muestren
- Confirmar que las alertas funcionen
- Verificar que la actividad reciente se actualice

### **Caso 2: Gestión de Usuarios**
- Listar todos los usuarios
- Buscar usuario específico
- Cambiar estado de usuario
- Verificar estadísticas por usuario

### **Caso 3: Gestión de Productos**
- Listar productos con estadísticas
- Identificar productos con bajo stock
- Verificar métricas de popularidad
- Filtrar por categoría

### **Caso 4: Gestión de Carritos**
- Listar carritos por período
- Verificar conversión de carritos
- Analizar tendencias temporales
- Ver detalles completos

### **Caso 5: Gestión de Apartados**
- Listar apartados activos
- Identificar apartados expirando
- Verificar estadísticas por usuario
- Analizar tendencias

### **Caso 6: Gestión de Encuestas**
- Listar encuestas con estadísticas
- Verificar tasas de participación
- Analizar engagement por encuesta
- Comparar encuestas abiertas vs cerradas

## **⚠️ Validaciones a Probar**

### **Autenticación:**
- Endpoints sin token de admin
- Token de usuario normal (debe fallar)
- Token expirado o inválido

### **Permisos:**
- Solo administradores pueden acceder
- Usuarios normales no pueden ver panel admin
- Verificar middleware de autorización

### **Filtros y Búsquedas:**
- Búsquedas con texto vacío
- Filtros con valores inválidos
- Paginación con límites extremos
- Períodos de tiempo inválidos

## **📊 Respuestas Esperadas**

### **Dashboard Principal:**
```json
{
  "success": true,
  "data": {
    "today_stats": {
      "new_users_today": 2,
      "new_carts_today": 5,
      "new_reservations_today": 3,
      "new_votes_today": 8
    },
    "week_stats": {
      "new_users_week": 7,
      "new_carts_week": 25,
      "new_reservations_week": 15,
      "new_votes_week": 45,
      "completed_orders_week": 12
    },
    "low_stock_products": [...],
    "expiring_reservations": [...],
    "recent_activity": [...],
    "top_products_today": [...]
  }
}
```

### **Lista de Usuarios:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Administrador",
      "role": "admin",
      "total_carts": 0,
      "total_reservations": 0,
      "surveys_participated": 0,
      "total_activity": 0
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 7,
    "pages": 1
  }
}
```

## **🚀 Herramientas de Prueba**

- **Postman** - Para probar endpoints
- **Thunder Client** - Extensión de VS Code
- **Insomnia** - Alternativa a Postman
- **cURL** - Línea de comandos

## **🔧 Comandos cURL de Ejemplo**

### **Dashboard:**
```bash
curl -X GET http://localhost:8000/api/admin/dashboard \
  -H "Authorization: Bearer <admin_token_aqui>"
```

### **Usuarios:**
```bash
curl -X GET "http://localhost:8000/api/admin/users?search=maria&role=client" \
  -H "Authorization: Bearer <admin_token_aqui>"
```

### **Productos:**
```bash
curl -X GET "http://localhost:8000/api/admin/products?category=1&status=active" \
  -H "Authorization: Bearer <admin_token_aqui>"
```

## **📝 Notas Importantes**

- **Solo administradores** pueden acceder al panel
- **Todas las rutas** requieren autenticación JWT
- **Filtros y búsquedas** son opcionales
- **Paginación** está implementada en todos los endpoints
- **Estadísticas en tiempo real** del sistema
- **Alertas automáticas** para stock bajo y expiración

## **🎯 Próximos Pasos**

1. **Probar todos los endpoints** del panel administrativo
2. **Verificar funcionalidades** de gestión
3. **Integrar con el frontend** existente
4. **Implementar sistema de notificaciones** WhatsApp
5. **Desarrollar reportes avanzados** y exportables

## **🔗 Integración con Otros Sistemas**

### **Sistema de Estadísticas:**
- El panel admin consume las estadísticas
- Proporciona interfaz visual para los datos
- Permite gestión basada en métricas

### **Sistema de Usuarios:**
- Control total sobre usuarios del sistema
- Activación/desactivación de cuentas
- Monitoreo de actividad por usuario

### **Sistema de Productos:**
- Gestión completa del inventario
- Alertas de stock en tiempo real
- Análisis de popularidad y rendimiento

### **Sistema de Ventas:**
- Monitoreo de carritos y apartados
- Análisis de conversión y tendencias
- Gestión de estados y transiciones 