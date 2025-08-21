# Sistema de Órdenes con Lugares y Horarios de Entrega

Este documento describe la implementación completa del sistema de órdenes para la aplicación de cosméticos, incluyendo la selección de lugares de entrega, fechas y horarios específicos.

## 🎯 Características Principales

### Lugares de Entrega Predefinidos
1. **Unidad Académica Juárez UANL**
   - Horarios específicos: Lunes a Viernes, 9:00 AM - 5:00 PM
   - Horarios disponibles: 9:00, 11:00, 13:00, 15:00, 17:00

2. **Soriana San Roque**
   - Horarios específicos: Lunes a Domingo, 10:00 AM - 8:00 PM
   - Horarios disponibles: 10:00, 12:00, 14:00, 16:00, 18:00, 20:00

3. **Soriana Santa María**
   - Horarios flexibles: Lunes a Domingo, 8:00 AM - 10:00 PM
   - Libre elección cada 30 minutos

### Restricciones de Fechas por Tipo de Usuario
- **Usuarios Invitados**: Máximo 3 días posteriores al día actual
- **Usuarios Registrados**: Máximo 7 días posteriores al día actual

## 🗄️ Base de Datos

### Script SQL
Ejecutar el archivo `backend/scripts/orders-schema.sql` para crear:
- Tabla `delivery_locations` - Lugares de entrega
- Tabla `delivery_schedules` - Horarios generales por lugar
- Tabla `delivery_time_slots` - Horarios específicos
- Tabla `orders` - Órdenes principales
- Tabla `order_items` - Items de las órdenes
- Tabla `order_status_history` - Historial de cambios de estado
- Vista `orders_with_details` - Vista consolidada de órdenes

### Estructura de Tablas
```sql
-- Lugares de entrega
CREATE TABLE delivery_locations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- Horarios por lugar y día
CREATE TABLE delivery_schedules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  location_id INT NOT NULL,
  day_of_week INT NOT NULL, -- 0=Domingo, 1=Lunes, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);

-- Horarios específicos (para lugares con horarios fijos)
CREATE TABLE delivery_time_slots (
  id INT PRIMARY KEY AUTO_INCREMENT,
  location_id INT NOT NULL,
  day_of_week INT NOT NULL,
  time_slot TIME NOT NULL
);

-- Órdenes principales
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_type ENUM('registered', 'guest') NOT NULL,
  user_id INT NULL,
  session_id VARCHAR(255) NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  delivery_location_id INT NOT NULL,
  delivery_date DATE NOT NULL,
  delivery_time TIME NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')
);
```

## 🔧 Backend

### Controlador de Órdenes
Archivo: `backend/src/controllers/orderController.js`

#### Endpoints Principales:
- `GET /api/orders/delivery-locations` - Obtener lugares de entrega
- `GET /api/orders/delivery-times` - Obtener horarios disponibles
- `POST /api/orders` - Crear nueva orden
- `GET /api/orders` - Obtener todas las órdenes (admin)
- `PUT /api/orders/:id/status` - Actualizar estado de orden (admin)

#### Funcionalidades:
- Validación de fechas según tipo de usuario
- Generación automática de números de orden únicos
- Validación de horarios disponibles por lugar y fecha
- Generación de mensajes de WhatsApp
- Historial de cambios de estado

### Rutas
Archivo: `backend/src/routes/orders.js`

### Integración en App Principal
Agregar en `backend/src/app.js`:
```javascript
const orderRoutes = require('./routes/orders');
app.use('/api/orders', orderRoutes);
```

## 🎨 Frontend

### Modal de Checkout
Archivo: `frontend/src/components/ui/CheckoutModal.tsx`

#### Características:
- **Paso 1**: Información del cliente
- **Paso 2**: Selección de lugar, fecha y horario de entrega
- **Paso 3**: Confirmación del pedido

#### Validaciones:
- Restricciones de fechas según tipo de usuario
- Horarios disponibles según lugar y fecha seleccionada
- Campos obligatorios validados

### Sección de Administración
Archivo: `frontend/src/components/sections/OrdersSection.tsx`

#### Funcionalidades:
- Lista de todas las órdenes con filtros avanzados
- Cambio de estado de órdenes
- Vista detallada de cada orden
- Paginación y búsqueda
- Filtros por estado, tipo de cliente, fecha, etc.

### Integración en AdminPanel
Actualizar `frontend/src/components/ui/AdminPanel.tsx`:
```typescript
import { OrdersSection } from '@/components/sections';

// En el renderTabContent, caso 'orders':
case 'orders':
  return (
    <div className="space-y-4 sm:space-y-6">
      <OrdersSection />
    </div>
  );
```

### Actualización del Carrito
Modificar `frontend/src/components/ui/CartModal.tsx` para usar el nuevo CheckoutModal.

## 🚀 Instalación y Configuración

### 1. Base de Datos
```bash
# Conectar a MySQL y ejecutar:
mysql -u root -p
USE cosmetics_db;
SOURCE backend/scripts/orders-schema.sql;
```

### 2. Backend
```bash
cd backend
npm install
# El controlador y rutas ya están incluidos
```

### 3. Frontend
```bash
cd frontend
npm install
# Los componentes ya están incluidos
```

### 4. Verificar Endpoints
```bash
# Probar endpoints:
curl http://localhost:8000/api/orders/delivery-locations
curl http://localhost:8000/api/orders/delivery-times?locationId=1&date=2024-01-15
```

## 📱 Flujo de Usuario

### Usuario Invitado
1. Agregar productos al carrito
2. Hacer clic en "Finalizar Compra"
3. Completar información personal
4. Seleccionar lugar de entrega
5. Elegir fecha (hoy + máximo 3 días)
6. Seleccionar horario disponible
7. Confirmar pedido
8. Redirigir a WhatsApp con mensaje pre-generado

### Usuario Registrado
1. Agregar productos al carrito
2. Hacer clic en "Finalizar Compra"
3. Información pre-llenada del perfil
4. Seleccionar lugar de entrega
5. Elegir fecha (hoy + máximo 7 días)
6. Seleccionar horario disponible
7. Confirmar pedido
8. Redirigir a WhatsApp con mensaje pre-generado

### Administrador
1. Acceder al panel administrativo
2. Ir a la pestaña "Pedidos"
3. Ver lista de todas las órdenes
4. Aplicar filtros y búsquedas
5. Ver detalles de cada orden
6. Cambiar estado de las órdenes
7. Agregar notas administrativas

## 🔍 Estados de las Órdenes

- **pending**: Pendiente de confirmación
- **confirmed**: Confirmado por el cliente
- **preparing**: En preparación
- **ready**: Listo para entrega
- **delivered**: Entregado
- **cancelled**: Cancelado

## 📊 Filtros Disponibles

- **Búsqueda**: Por nombre, teléfono o número de orden
- **Estado**: Filtrar por estado actual
- **Tipo de Cliente**: Registrado o invitado
- **Lugar de Entrega**: Filtrar por ubicación
- **Rango de Fechas**: Desde/hasta fecha específica

## 🛡️ Seguridad y Validaciones

- Autenticación JWT requerida para endpoints protegidos
- Validación de roles (solo admin puede cambiar estados)
- Validación de fechas según tipo de usuario
- Validación de horarios disponibles
- Sanitización de datos de entrada
- Transacciones de base de datos para operaciones críticas

## 🔧 Personalización

### Agregar Nuevos Lugares
1. Insertar en `delivery_locations`
2. Agregar horarios en `delivery_schedules`
3. Agregar horarios específicos en `delivery_time_slots`

### Modificar Horarios
```sql
-- Ejemplo: Cambiar horarios de UANL
UPDATE delivery_time_slots 
SET time_slot = '10:00:00' 
WHERE location_id = 1 AND day_of_week = 1 AND time_slot = '09:00:00';
```

### Agregar Nuevos Estados
1. Modificar ENUM en tabla `orders`
2. Actualizar controlador y frontend
3. Agregar colores y iconos correspondientes

## 🧪 Pruebas

### Casos de Prueba Recomendados
1. **Usuario Invitado**:
   - Intentar seleccionar fecha más de 3 días adelante
   - Verificar horarios disponibles por lugar
   - Completar checkout completo

2. **Usuario Registrado**:
   - Verificar información pre-llenada
   - Seleccionar fecha hasta 7 días adelante
   - Verificar historial de órdenes

3. **Administrador**:
   - Ver lista de órdenes
   - Aplicar filtros
   - Cambiar estados
   - Ver detalles completos

### Datos de Prueba
El script SQL incluye datos de ejemplo para:
- 3 lugares de entrega
- Horarios para cada lugar
- Horarios específicos para lugares con restricciones

## 🐛 Solución de Problemas

### Error: "No se pudo conectar a la base de datos"
- Verificar credenciales en `.env`
- Asegurar que MySQL esté ejecutándose
- Verificar que la base de datos `cosmetics_db` exista

### Error: "Procedimiento GenerateOrderNumber no existe"
- Ejecutar completamente el script SQL
- Verificar que no haya errores de sintaxis

### Error: "Horarios no disponibles"
- Verificar que la fecha seleccionada no sea domingo para UANL
- Verificar que la fecha esté dentro del rango permitido
- Verificar que el lugar esté activo

### Error: "Permiso denegado"
- Verificar que el usuario tenga rol de admin
- Verificar que el token JWT sea válido
- Verificar que la ruta esté protegida correctamente

## 📈 Próximas Mejoras

- [ ] Notificaciones push para cambios de estado
- [ ] Integración con servicios de mensajería (SMS, email)
- [ ] Dashboard de métricas de órdenes
- [ ] Sistema de calificaciones post-entrega
- [ ] Integración con sistemas de pago
- [ ] Reportes automáticos por email
- [ ] API para aplicaciones móviles
- [ ] Sistema de cupones y descuentos

## 📞 Soporte

Para dudas o problemas con la implementación:
1. Revisar logs del servidor
2. Verificar consola del navegador
3. Revisar respuestas de la API
4. Verificar estado de la base de datos

---

**Nota**: Este sistema está diseñado para ser escalable y fácil de mantener. Los horarios y lugares se pueden modificar fácilmente desde la base de datos sin necesidad de cambios en el código. 